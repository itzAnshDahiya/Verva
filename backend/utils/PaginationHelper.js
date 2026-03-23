class PaginationHelper {
  static getPaginationParams(query) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    const skip = (page - 1) * limit;

    return { page, limit, skip };
  }

  static buildPaginationResponse(data, page, limit, totalCount) {
    const totalPages = Math.ceil(totalCount / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  static getSortObject(sortParam) {
    if (!sortParam) return { createdAt: -1 };

    const sortObject = {};
    const fields = sortParam.split(',');

    fields.forEach((field) => {
      if (field.startsWith('-')) {
        sortObject[field.slice(1)] = -1;
      } else {
        sortObject[field] = 1;
      }
    });

    return sortObject;
  }
}

module.exports = PaginationHelper;
