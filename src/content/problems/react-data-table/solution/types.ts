import type { ReactNode } from 'react';

export type SortDirection = 'ascending' | 'descending';

/** Describes one column. `key` is both the field read from each row and the column's unique id. */
export interface Column<T> {
  key: keyof T & string;
  /** Visible header text (also the accessible name of the sort button). */
  header: string;
  /** Show a sort button in the header. Default: false. */
  sortable?: boolean;
  /** Custom cell content. Sorting and filtering always use the raw `row[key]` value. */
  render?: (row: T) => ReactNode;
  /** Custom ascending comparator for this column. Descending is the same comparator negated. */
  compare?: (a: T, b: T) => number;
}

export interface DataTableProps<T> {
  /** Rendered as the table's <caption> (its accessible name). */
  caption: string;
  rows: readonly T[];
  columns: readonly Column<T>[];
  /** Stable identity for each row (used as the React key). */
  getRowId: (row: T) => string | number;
  /** Fields the text filter searches. Default: every column's key. */
  filterKeys?: ReadonlyArray<keyof T & string>;
  /** Options of the "Rows per page" select. The first one is the initial page size. Default: [5, 10, 20]. */
  pageSizeOptions?: readonly number[];
}
