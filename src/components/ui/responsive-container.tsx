import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * A responsive container component that provides consistent spacing and max-width
 * across different screen sizes following the mobile-first approach.
 */
export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className,
}) => {
  return (
    <div className={cn(
      "max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8",
      className
    )}>
      {children}
    </div>
  );
};

export default ResponsiveContainer;