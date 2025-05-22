import { PaginationResult } from '../interfaces/paginationResult.interface';

export class PaginationUtil {
  static createPaginationResult<T>(
    docs: T[],
    total: number,
    page: number,
    limit: number,
  ): PaginationResult<T> {
    const totalPages = Math.ceil(total / limit);
    return {
      docs,
      paginationData: {
        totalDocs: total,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        nextPage: page < totalPages ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null,
        currentPage: page,
        totalPages,
      },
    };
  }
}