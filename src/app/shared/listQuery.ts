export interface ListOptions {
    page: number;
    limit: number;
    search?: string;
}

const toPositiveInt = (value: unknown, fallback: number): number => {
    const n = Number(value);
    return Number.isInteger(n) && n > 0 ? n : fallback;
};

export const parseListOptions = (query: Record<string, unknown>, defaultLimit = 20): ListOptions => {
    const search = typeof query.search === "string" ? query.search.trim() : "";
    return {
        page: toPositiveInt(query.page, 1),
        limit: Math.min(toPositiveInt(query.limit, defaultLimit), 200),
        search: search || undefined,
    };
};

export const pageSlice = (options: ListOptions) => ({
    skip: (options.page - 1) * options.limit,
    take: options.limit,
});

export const paginationMeta = (options: ListOptions, total: number, summary?: Record<string, number>) => ({
    page: options.page,
    limit: options.limit,
    total,
    totalPage: Math.max(1, Math.ceil(total / options.limit)),
    summary,
});

/** A string query param, or undefined when empty/missing. */
export const queryString = (query: Record<string, unknown>, key: string): string | undefined => {
    const value = query[key];
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
};
