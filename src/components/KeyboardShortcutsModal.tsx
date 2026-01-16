import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Keyboard, Terminal, Users, HelpCircle } from 'lucide-react';

interface ShortcutSection {
  title: string;
  icon: React.ReactNode;
  shortcuts: Array<{ keys: string[]; description: string }>;
}

const SHORTCUT_SECTIONS: ShortcutSection[] = [
  {
    title: 'SQL REPL',
    icon: <Terminal className="w-4 h-4" />,
    shortcuts: [
      { keys: ['Ctrl/⌘', 'Enter'], description: 'Execute query' },
      { keys: ['Ctrl/⌘', 'L'], description: 'Clear history' },
      { keys: ['Ctrl/⌘', 'K'], description: 'Focus input' },
      { keys: ['Esc'], description: 'Clear input' },
      { keys: ['↑', '↓'], description: 'Navigate command history' },
      { keys: ['Tab'], description: 'Autocomplete SQL keywords' },
    ],
  },
  {
    title: 'Demo App',
    icon: <Users className="w-4 h-4" />,
    shortcuts: [
      { keys: ['↑', '↓'], description: 'Navigate table rows' },
      { keys: ['Enter'], description: 'Edit focused row' },
      { keys: ['Space'], description: 'Toggle row selection' },
      { keys: ['Ctrl/⌘', 'Delete'], description: 'Delete focused row' },
      { keys: ['Esc'], description: 'Clear focus/cancel' },
    ],
  },
  {
    title: 'Terminal Auth',
    icon: <Keyboard className="w-4 h-4" />,
    shortcuts: [
      { keys: ['Shift', 'T'], description: 'Toggle password visibility' },
      { keys: ['Tab'], description: 'Autocomplete commands' },
      { keys: ['Esc'], description: 'Cancel/exit' },
    ],
  },
  {
    title: 'Global',
    icon: <HelpCircle className="w-4 h-4" />,
    shortcuts: [
      { keys: ['?'], description: 'Open this shortcuts guide' },
      { keys: ['1'], description: 'Switch to SQL REPL tab' },
      { keys: ['2'], description: 'Switch to Demo App tab' },
    ],
  },
];

interface KeyboardShortcutsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const KeyboardShortcutsModal = ({ open, onOpenChange }: KeyboardShortcutsModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-mono text-primary">
            <Keyboard className="w-5 h-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            {SHORTCUT_SECTIONS.map((section) => (
              <div key={section.title} className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-mono font-semibold text-foreground">
                  {section.icon}
                  {section.title}
                </h3>
                <div className="space-y-2">
                  {section.shortcuts.map((shortcut, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between py-1.5 px-2 rounded-md bg-secondary/30"
                    >
                      <span className="text-xs text-muted-foreground font-mono">
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIdx) => (
                          <span key={keyIdx} className="flex items-center gap-1">
                            <kbd className="px-2 py-0.5 rounded bg-background border border-border text-[10px] font-mono font-medium">
                              {key}
                            </kbd>
                            {keyIdx < shortcut.keys.length - 1 && (
                              <span className="text-muted-foreground text-[10px]">+</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="pt-2 border-t border-border/50">
          <p className="text-[10px] text-muted-foreground font-mono text-center">
            Press <kbd className="px-1.5 py-0.5 rounded bg-secondary text-[10px]">?</kbd> anywhere to toggle this guide
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Hook to manage keyboard shortcuts modal
export const useKeyboardShortcuts = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || 
                       target.tagName === 'TEXTAREA' || 
                       target.isContentEditable;
      
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // For '?' key, we still want to allow it unless we're in a text input
        if (!isTyping || e.shiftKey) {
          e.preventDefault();
          setIsOpen(prev => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { isOpen, setIsOpen };
};
