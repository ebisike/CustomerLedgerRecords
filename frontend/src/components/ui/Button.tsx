import React from 'react';
import { cn } from '@/utils/cn';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-primary-800 hover:bg-primary-700 active:bg-primary-900 text-white shadow-sm focus-visible:ring-primary-500',
  secondary: 'bg-white hover:bg-surface-50 active:bg-surface-100 text-surface-700 border border-surface-200 shadow-sm focus-visible:ring-primary-500',
  danger: 'bg-danger-600 hover:bg-danger-500 active:bg-danger-700 text-white shadow-sm focus-visible:ring-danger-500',
  ghost: 'bg-transparent hover:bg-surface-100 active:bg-surface-200 text-surface-600 focus-visible:ring-primary-500',
  success: 'bg-success-600 hover:bg-success-500 active:bg-success-700 text-white shadow-sm focus-visible:ring-success-500',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-6 text-base gap-2',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="animate-spin" size={size === 'sm' ? 14 : 16} />
        ) : leftIcon}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
