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
  onPageSizeChange,
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
        <div className="text-sm text-slate-400">
          Showing {totalItems} item{totalItems === 1 ? "" : "s"}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 ${className}`}
    >
      {/* Items info */}
      <div className="text-sm text-slate-400">
        Showing {startItem}-{endItem} of {totalItems} items
      </div>

      {/* Pagination controls */}
      <div className="flex flex-wrap items-center justify-center gap-2 w-full sm:w-auto max-w-full">
        {/* Previous button */}
        <button
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-3 py-2 text-sm border border-slate-700 text-slate-400 rounded-lg hover:bg-slate-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          Previous
        </button>

        {/* Page numbers */}
        <div className="flex flex-wrap items-center justify-center gap-1 max-w-full">
          {visiblePages.map((page, index) => (
            <button
              key={index}
              onClick={() => handlePageClick(page)}
              disabled={page === "..."}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                page === currentPage
                  ? "bg-cyan-600 text-white"
                  : page === "..."
                  ? "cursor-default text-slate-500"
                  : "border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        {/* Next button */}
        <button
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-3 py-2 text-sm border border-slate-700 text-slate-400 rounded-lg hover:bg-slate-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
