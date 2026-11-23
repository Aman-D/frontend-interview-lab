import { useId, useMemo, useState } from 'react';
import type { Column, DataTableProps, SortDirection } from './types';

const DEFAULT_PAGE_SIZES: readonly number[] = [5, 10, 20];

// One collator for the whole module: creating it is relatively expensive, comparing is cheap.
// numeric: "item 2" < "item 10"; sensitivity "base": "chloe" and "Chloe" compare equal (case-insensitive).
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

type SortState<T> = { key: keyof T & string; direction: SortDirection } | null;

function isEmpty(value: unknown): boolean {
  return value === null || value === undefined || value === '';
}

/** Default ascending comparison for raw cell values. Empty values are handled by the caller. */
function compareValues(a: unknown, b: unknown): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b);
  return collator.compare(String(a), String(b));
}

/** Ascending → descending → none; a different column always starts ascending. */
function nextSort<T>(prev: SortState<T>, key: keyof T & string): SortState<T> {
  if (!prev || prev.key !== key) return { key, direction: 'ascending' };
  return prev.direction === 'ascending' ? { key, direction: 'descending' } : null;
}

function sortRows<T>(rows: readonly T[], column: Column<T>, direction: SortDirection): readonly T[] {
  const sign = direction === 'ascending' ? 1 : -1;
  const { key, compare } = column;
  // Copy first: Array.prototype.sort mutates, and `rows` belongs to the parent.
  // sort() is stable (ES2019+), and negating the comparator — instead of reversing the
  // ascending result — keeps ties in their original order in BOTH directions.
  return [...rows].sort((a, b) => {
    if (compare) return sign * compare(a, b);
    const av = a[key];
    const bv = b[key];
    const aEmpty = isEmpty(av);
    const bEmpty = isEmpty(bv);
    if (aEmpty || bEmpty) return aEmpty === bEmpty ? 0 : aEmpty ? 1 : -1; // empties last, either direction
    return sign * compareValues(av, bv);
  });
}

function matches<T>(row: T, keys: ReadonlyArray<keyof T & string>, needle: string): boolean {
  return keys.some((k) => {
    const value = row[k];
    return !isEmpty(value) && String(value).toLowerCase().includes(needle);
  });
}

export default function DataTable<T>({ caption, rows, columns, getRowId, filterKeys, pageSizeOptions = DEFAULT_PAGE_SIZES }: DataTableProps<T>) {
  // Only genuine user input lives in state. Everything else is derived below.
  const [sort, setSort] = useState<SortState<T>>(null);
  const [query, setQuery] = useState('');
  const [pageSize, setPageSize] = useState(() => pageSizeOptions[0] ?? 10);
  const [page, setPage] = useState(1);

  const id = useId();
  const filterId = `${id}-filter`;
  const pageSizeId = `${id}-page-size`;

  const needle = query.trim().toLowerCase();

  // Derived during render. useMemo is only a cache: removing it must not change behaviour.
  const filtered = useMemo(() => {
    if (!needle) return rows;
    const keys = filterKeys ?? columns.map((c) => c.key);
    return rows.filter((row) => matches(row, keys, needle));
  }, [rows, columns, filterKeys, needle]);

  const sorted = useMemo(() => {
    const column = sort && columns.find((c) => c.key === sort.key);
    return sort && column ? sortRows(filtered, column, sort.direction) : filtered;
  }, [filtered, columns, sort]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  // Clamp instead of "fixing" page in an effect: if rows shrink, we are simply on the last page.
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const visible = sorted.slice(start, start + pageSize);

  // Resetting the page happens in the event that caused the change, not in an effect.
  function handleSort(key: keyof T & string) {
    setSort((prev) => nextSort(prev, key));
    setPage(1);
  }
  function handleQuery(value: string) {
    setQuery(value);
    setPage(1);
  }
  function handlePageSize(value: string) {
    setPageSize(Number(value));
    setPage(1);
  }

  return (
    <div className="data-table">
      <div className="toolbar">
        <label htmlFor={filterId}>Filter</label>
        <input id={filterId} type="search" value={query} onChange={(e) => handleQuery(e.target.value)} placeholder="Type to filter…" />
      </div>

      <div className="table-scroll">
        <table>
          <caption>{caption}</caption>
          <thead>
            <tr>
              {columns.map((col) => {
                const direction = sort?.key === col.key ? sort.direction : undefined;
                return (
                  <th key={col.key} scope="col" aria-sort={direction}>
                    {col.sortable ? (
                      <button type="button" className="sort-button" onClick={() => handleSort(col.key)}>
                        {col.header}
                        <span className="sort-icon" aria-hidden="true">
                          {direction === 'ascending' ? '▲' : direction === 'descending' ? '▼' : '↕'}
                        </span>
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td className="empty" colSpan={columns.length}>
                  {rows.length === 0 ? 'No data' : 'No matching rows'}
                </td>
              </tr>
            ) : (
              visible.map((row) => (
                <tr key={getRowId(row)}>
                  {columns.map((col) => (
                    <td key={col.key}>{col.render ? col.render(row) : String(row[col.key] ?? '')}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <label htmlFor={pageSizeId}>Rows per page</label>
        <select id={pageSizeId} value={pageSize} onChange={(e) => handlePageSize(e.target.value)}>
          {pageSizeOptions.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => setPage(currentPage - 1)} disabled={currentPage <= 1}>
          Previous page
        </button>
        <span aria-live="polite">{`Page ${currentPage} of ${pageCount}`}</span>
        <button type="button" onClick={() => setPage(currentPage + 1)} disabled={currentPage >= pageCount}>
          Next page
        </button>
      </div>
    </div>
  );
}
