import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="flex flex-col items-center justify-center py-16 px-4 text-center"
  >
    {icon && (
      <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mb-4 text-surface-300">
        {icon}
      </div>
    )}
    <h3 className="text-lg font-semibold text-surface-800 mb-1">{title}</h3>
    {description && <p className="text-sm text-surface-500 max-w-xs mb-5">{description}</p>}
    {action && (
      <Button onClick={action.onClick} size="sm">
        {action.label}
      </Button>
    )}
  </motion.div>
);
