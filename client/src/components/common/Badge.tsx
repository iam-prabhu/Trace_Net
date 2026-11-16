import React from 'react';
import { cn } from '../../utils/cn';

type BadgeVariant = 'default' | 'low' | 'medium' | 'high' | 'critical' | 'open' | 'in_progress' | 'closed' | 'archived';

const variantStyles: Record<BadgeVariant, string> = {
  default: 'text-gray-700 bg-gray-100',
  low: 'text-green-700 bg-green-100',
  medium: 'text-yellow-700 bg-yellow-100',
  high: 'text-orange-700 bg-orange-100',
  critical: 'text-red-700 bg-red-100',
  open: 'text-blue-700 bg-blue-100',
  in_progress: 'text-yellow-700 bg-yellow-100',
  closed: 'text-gray-700 bg-gray-100',
  archived: 'text-purple-700 bg-purple-100',
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', variantStyles[variant], className)}>
      {children}
    </span>
  );
}
