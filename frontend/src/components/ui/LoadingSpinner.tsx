import React from 'react';
import { cn } from '@/utils/cn';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-3',
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className, label }) => (
  <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
    <div
      className={cn(
        'rounded-full border-surface-200 border-t-primary-800 animate-spin',
        sizeClasses[size]
      )}
    />
    {label && <p className="text-sm text-surface-500">{label}</p>}
  </div>
);

export const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <LoadingSpinner size="lg" label="Loading..." />
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 5 }) => (
  <div className="animate-pulse">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4 py-3 border-b border-surface-100">
        {Array.from({ length: cols }).map((_, j) => (
          <div key={j} className="h-4 bg-surface-200 rounded flex-1" />
        ))}
      </div>
    ))}
  </div>
);
