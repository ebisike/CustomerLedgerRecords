import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav className="flex items-center gap-1 text-sm mb-4" aria-label="Breadcrumb">
      <Link
        to="/dashboard"
        className="text-surface-400 hover:text-surface-600 transition-colors flex items-center"
      >
        <Home size={14} />
      </Link>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight size={14} className="text-surface-300 flex-shrink-0" />
          {item.href && index < items.length - 1 ? (
            <Link
              to={item.href}
              className="text-surface-500 hover:text-surface-700 transition-colors truncate max-w-[200px]"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-surface-800 font-medium truncate max-w-[200px]">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
