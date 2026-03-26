import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";

interface PaginateProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showInfo?: boolean;
  totalCount?: number;
  limit?: number;
  disabled?: boolean;
  className?: string;
}

export const Paginate = ({
  page,
  totalPages,
  onPageChange,
  showInfo = false,
  totalCount = 0,
  limit = 10,
  disabled = false,
  className = "",
}: PaginateProps) => {
  // Validate and sanitize inputs
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const validTotalPages = Math.max(1, totalPages);

  // Return null if there's only one page or invalid data
  if (validTotalPages <= 1) {
    return null;
  }

  // Generate smart page numbers with ellipsis
  const generatePageNumbers = (): (number | "ellipsis")[] => {
    const pages: (number | "ellipsis")[] = [];
    const showEllipsisThreshold = 7; // Show ellipsis if more than 7 pages

    if (validTotalPages <= showEllipsisThreshold) {
      // Show all pages if total is small
      for (let i = 1; i <= validTotalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Show left ellipsis if needed
      if (currentPage > 3) {
        pages.push("ellipsis");
      }

      // Show pages around current page
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(validTotalPages - 1, currentPage + 1);

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      // Show right ellipsis if needed
      if (currentPage < validTotalPages - 2) {
        pages.push("ellipsis");
      }

      // Always show last page
      pages.push(validTotalPages);
    }

    return pages;
  };

  const pages = generatePageNumbers();

  // Calculate showing range
  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, totalCount);

  const handlePageChange = (newPage: number) => {
    if (disabled) return;
    if (newPage < 1 || newPage > validTotalPages) return;
    if (newPage === currentPage) return;
    onPageChange(newPage);
  };

  const isPreviousDisabled = disabled || currentPage <= 1;
  const isNextDisabled = disabled || currentPage >= validTotalPages;

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
      {/* Info Section */}
      {showInfo && totalCount > 0 && (
        <p className="text-sm flex gap-2 text-muted-foreground">
          Showing <span className="font-medium">{startItem}</span> to{" "}
          <span className="font-medium">{endItem}</span> of{" "}
          <span className="font-medium">{totalCount}</span> results
        </p>
      )}

      {/* Pagination Controls */}
      <Pagination>
        <PaginationContent>
          {/* Previous Button */}
          <PaginationItem>
            <PaginationPrevious
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(currentPage - 1);
              }}
              className={
                isPreviousDisabled
                  ? "pointer-events-none opacity-50 cursor-not-allowed"
                  : "cursor-pointer hover:bg-accent"
              }
              aria-disabled={isPreviousDisabled}
            />
          </PaginationItem>

          {/* Page Numbers */}
          {pages.map((pageNum, index) =>
            pageNum === "ellipsis" ? (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={pageNum}>
                <PaginationLink
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(pageNum);
                  }}
                  isActive={pageNum === currentPage}
                  className={
                    disabled
                      ? "pointer-events-none opacity-50 cursor-not-allowed"
                      : pageNum === currentPage
                      ? "cursor-default"
                      : "cursor-pointer hover:bg-accent"
                  }
                  aria-current={pageNum === currentPage ? "page" : undefined}
                  aria-disabled={disabled}
                >
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            )
          )}

          {/* Next Button */}
          <PaginationItem>
            <PaginationNext
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(currentPage + 1);
              }}
              className={
                isNextDisabled
                  ? "pointer-events-none opacity-50 cursor-not-allowed"
                  : "cursor-pointer hover:bg-accent"
              }
              aria-disabled={isNextDisabled}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};