import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseRealtimeTableOptions {
  tableName: string;
  onUpdate: () => void;
  enabled?: boolean;
}

export function useRealtimeTable({ tableName, onUpdate, enabled = true }: UseRealtimeTableOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!enabled) {
      setIsConnected(false);
      return;
    }

    const channelName = `realtime-${tableName}-${Date.now()}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rdbms_rows',
        },
        (payload) => {
          console.log('[Realtime] Change detected:', payload.eventType);
          setLastUpdate(new Date());
          onUpdate();
          
          // Show toast for external updates
          if (payload.eventType === 'INSERT') {
            toast.info('New row added by another user', { duration: 2000 });
          } else if (payload.eventType === 'UPDATE') {
            toast.info('Data updated by another user', { duration: 2000 });
          } else if (payload.eventType === 'DELETE') {
            toast.info('Row deleted by another user', { duration: 2000 });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rdbms_tables',
        },
        (payload) => {
          console.log('[Realtime] Table change detected:', payload.eventType);
          setLastUpdate(new Date());
          onUpdate();
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsConnected(false);
    };
  }, [tableName, onUpdate, enabled]);

  const disconnect = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      setIsConnected(false);
    }
  }, []);

  return {
    isConnected,
    lastUpdate,
    disconnect,
  };
}

// Real-time status indicator component
interface RealtimeStatusProps {
  isConnected: boolean;
  lastUpdate?: Date | null;
}

export const RealtimeStatus = ({ isConnected, lastUpdate }: RealtimeStatusProps) => {
  if (!isConnected) return null;

  return (
    <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
      </span>
      <span className="text-green-500">Live</span>
      {lastUpdate && (
        <span className="text-muted-foreground/70">
          (last: {lastUpdate.toLocaleTimeString()})
        </span>
      )}
    </div>
  );
};
