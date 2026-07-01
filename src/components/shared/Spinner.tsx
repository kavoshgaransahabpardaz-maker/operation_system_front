import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClass = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' };

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-muted border-t-primary',
          sizeClass[size]
        )}
      />
    </div>
  );
}
