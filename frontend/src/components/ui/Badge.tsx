import React from 'react';
import { cn } from '@/utils/cn';

type BadgeVariant = 'default' | 'success' | 'danger' | 'warning' | 'info';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-surface-100 text-surface-700',
  success: 'bg-success-50 text-success-700',
  danger: 'bg-danger-50 text-danger-700',
  warning: 'bg-warning-50 text-warning-600',
  info: 'bg-primary-50 text-primary-700',
};

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', children, className }) => (
  <span
    className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      variantClasses[variant],
      className
    )}
  >
    {children}
  </span>
);
