export interface PaginationResult<T> {
  docs: T[];
  paginationData: {
    totalDocs: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    nextPage: number | null;
    prevPage: number | null;
    currentPage: number;
    totalPages: number;
  };
}