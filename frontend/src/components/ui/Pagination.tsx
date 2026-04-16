import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { MetaData } from '@/types';

interface PaginationProps {
  metaData: MetaData;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ metaData, onPageChange }) => {
  const { pageIndex, totalPages, totalCount, showing } = metaData;

  if (totalPages <= 1) {
    return (
      <div className="flex items-center justify-between px-1 py-2 text-sm text-surface-500">
        <span>{showing}</span>
      </div>
    );
  }

  const pages: (number | '...')[] = [];
  const delta = 2;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= pageIndex - delta && i <= pageIndex + delta)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <div className="flex items-center justify-between flex-wrap gap-3 px-1 py-2">
      <p className="text-sm text-surface-500">{showing}</p>
      <div className="flex items-center gap-1">
        <PageButton onClick={() => onPageChange(1)} disabled={pageIndex === 1} title="First page">
          <ChevronsLeft size={16} />
        </PageButton>
        <PageButton onClick={() => onPageChange(pageIndex - 1)} disabled={pageIndex === 1} title="Previous page">
          <ChevronLeft size={16} />
        </PageButton>

        {pages.map((page, i) =>
          page === '...' ? (
            <span key={`ellipsis-${i}`} className="px-2 text-surface-400 select-none">...</span>
          ) : (
            <PageButton
              key={page}
              onClick={() => onPageChange(page as number)}
              active={page === pageIndex}
            >
              {page}
            </PageButton>
          )
        )}

        <PageButton onClick={() => onPageChange(pageIndex + 1)} disabled={pageIndex === totalPages} title="Next page">
          <ChevronRight size={16} />
        </PageButton>
        <PageButton onClick={() => onPageChange(totalPages)} disabled={pageIndex === totalPages} title="Last page">
          <ChevronsRight size={16} />
        </PageButton>
      </div>
    </div>
  );
};

interface PageButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

const PageButton: React.FC<PageButtonProps> = ({ active, className, children, ...props }) => (
  <button
    className={cn(
      'min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium transition-colors',
      'disabled:opacity-40 disabled:cursor-not-allowed',
      active
        ? 'bg-primary-800 text-white'
        : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900',
      className
    )}
    {...props}
  >
    {children}
  </button>
);
