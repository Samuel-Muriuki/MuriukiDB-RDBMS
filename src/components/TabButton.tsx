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
        'px-4 py-2 font-mono text-sm transition-all duration-200 flex items-center gap-2',
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
