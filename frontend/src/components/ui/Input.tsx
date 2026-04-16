import React from 'react';
import { cn } from '@/utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftElement, rightElement, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-surface-700 mb-1.5">
            {label}
            {props.required && <span className="text-danger-600 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {leftElement && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-surface-400">
              {leftElement}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'block w-full rounded-lg border bg-white text-surface-900 placeholder-surface-400',
              'text-sm transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              'disabled:bg-surface-50 disabled:text-surface-400 disabled:cursor-not-allowed',
              error
                ? 'border-danger-500 focus:ring-danger-500 bg-danger-50'
                : 'border-surface-200 hover:border-surface-300',
              leftElement ? 'pl-10' : 'pl-3',
              rightElement ? 'pr-10' : 'pr-3',
              'py-2.5 h-10',
              className
            )}
            {...props}
          />
          {rightElement && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {rightElement}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-xs text-danger-600 flex items-center gap-1">
            <span className="inline-block w-1 h-1 rounded-full bg-danger-600 flex-shrink-0 mt-0.5" />
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="mt-1.5 text-xs text-surface-400">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-surface-700 mb-1.5">
            {label}
            {props.required && <span className="text-danger-600 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'block w-full rounded-lg border bg-white text-surface-900 placeholder-surface-400',
            'text-sm transition-all duration-150 px-3 py-2.5',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'disabled:bg-surface-50 disabled:text-surface-400',
            'resize-none',
            error ? 'border-danger-500' : 'border-surface-200 hover:border-surface-300',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-danger-600">{error}</p>}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';
