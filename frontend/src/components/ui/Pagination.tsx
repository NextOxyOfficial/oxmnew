import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  className?: string;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  className = '',
}) => {
  // Calculate start and end item numbers for display
  const startItem = Math.min((currentPage - 1) * itemsPerPage + 1, totalItems);
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to display
  const getVisiblePages = () => {
    const delta = 2; // Number of pages to show on each side of current page
    const range = [];
    const rangeWithDots = [];

    // Always show first page
    if (totalPages <= 1) {
      return [1];
    }

    // Calculate start and end of visible range
    let start = Math.max(1, currentPage - delta);
    let end = Math.min(totalPages, currentPage + delta);

    // Adjust if we're near the beginning or end
    if (currentPage <= delta + 1) {
      end = Math.min(totalPages, 2 * delta + 1);
    }
    if (currentPage >= totalPages - delta) {
      start = Math.max(1, totalPages - 2 * delta);
    }

    // Build the range
    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    // Add first page and dots if necessary
    if (start > 1) {
      rangeWithDots.push(1);
      if (start > 2) {
        rangeWithDots.push('...');
      }
    }

    // Add the main range
    rangeWithDots.push(...range);

    // Add last page and dots if necessary
    if (end < totalPages) {
      if (end < totalPages - 1) {
        rangeWithDots.push('...');
      }
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const visiblePages = getVisiblePages();

  const handlePageClick = (page: number | string) => {
    if (typeof page === 'number' && page !== currentPage) {
      onPageChange(page);
    }
  };

  if (totalPages <= 1) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="text-[13px] text-slate-500">
          মোট {totalItems} টি দেখাচ্ছে
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      {/* Items info */}
      <div className="text-[13px] text-slate-500 num">
        {totalItems} এর মধ্যে {startItem}-{endItem} দেখাচ্ছে
      </div>

      {/* Pagination controls */}
      <nav
        aria-label="পেজ নেভিগেশন"
        className="flex flex-wrap items-center justify-center gap-1.5 w-full sm:w-auto max-w-full"
      >
        {/* Previous button */}
        <button
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage <= 1}
          className="btn btn-ghost btn-sm"
        >
          আগের
        </button>

        {/* Page numbers */}
        <div className="flex flex-wrap items-center justify-center gap-1 max-w-full">
          {visiblePages.map((page, index) => (
            <button
              key={index}
              onClick={() => handlePageClick(page)}
              disabled={page === "..."}
              aria-current={page === currentPage ? "page" : undefined}
              className={
                page === currentPage
                  ? "btn btn-primary btn-sm num min-w-8"
                  : page === "..."
                  ? "inline-flex h-8 min-w-8 items-center justify-center text-xs text-slate-400"
                  : "btn btn-ghost btn-sm num min-w-8"
              }
            >
              {page}
            </button>
          ))}
        </div>

        {/* Next button */}
        <button
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="btn btn-ghost btn-sm"
        >
          পরের
        </button>
      </nav>
    </div>
  );
};

export default Pagination;
