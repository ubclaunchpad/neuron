export type ListResponse<T> = {
  data: T[];
  total: number;
  nextCursor?: number | null;
};
