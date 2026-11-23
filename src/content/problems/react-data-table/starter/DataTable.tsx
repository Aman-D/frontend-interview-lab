import type { DataTableProps } from './types';

// TODO: implement the data table described in the task.
// - header sort buttons cycling ascending → descending → none (with aria-sort on the <th>)
// - a "Filter" search box (case-insensitive, across filterKeys)
// - pagination: "Rows per page" select, "Page X of Y", "Previous page" / "Next page"
// - empty states
// Derive the visible rows during render — do not copy them into state.
export default function DataTable<T>({ caption, rows, columns, getRowId }: DataTableProps<T>) {
  return (
    <div className="data-table">
      <div className="table-scroll">
        <table>
          <caption>{caption}</caption>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} scope="col">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={getRowId(row)}>
                {columns.map((col) => (
                  <td key={col.key}>{col.render ? col.render(row) : String(row[col.key] ?? '')}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
