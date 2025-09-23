'use client';

import { useState, ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface ExpandableSectionProps {
  title: string;
  count?: number;
  icon?: ReactNode;
  defaultExpanded?: boolean;
  children: ReactNode;
  className?: string;
}

export const ExpandableSection: React.FC<ExpandableSectionProps> = ({
  title,
  count,
  icon,
  defaultExpanded = true,
  children,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <button
        onClick={toggleExpanded}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-primary/30 hover:border-primary bg-primary/5 hover:bg-primary/15 backdrop-blur-sm transition-all duration-200 hover:shadow-md group"
      >
        {icon && <span className="text-primary">{icon}</span>}
        <span className="text-sm font-medium text-primary text-center flex-1 group-hover:text-primary/80 transition-colors">
          {title}
          {count !== undefined && (
            <span className="ml-1 text-xs text-primary/60">({count})</span>
          )}
        </span>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-primary/60 transition-colors" />
        ) : (
          <ChevronRight className="w-4 h-4 text-primary/60 transition-colors" />
        )}
      </button>
      
      {isExpanded && (
        <div className="space-y-1 pl-2">
          {children}
        </div>
      )}
    </div>
  );
};
