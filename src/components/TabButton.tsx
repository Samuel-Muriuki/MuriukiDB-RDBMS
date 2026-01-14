import { cn } from '@/lib/utils';

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const TabButton = ({ active, onClick, children, icon }: TabButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-2 font-mono text-xs transition-all duration-200 flex items-center gap-1.5 flex-shrink-0 whitespace-nowrap',
        'border-b-2 hover:text-primary',
        active 
          ? 'border-primary text-primary' 
          : 'border-transparent text-muted-foreground hover:border-primary/50'
      )}
    >
      {icon}
      {children}
    </button>
  );
};
