import DataTable from '../DataTable';
import { ariaSort, bodyRows, columns, filterTo, header, names, people, sortButton } from './helpers';

const table = () => <DataTable caption="People" rows={people} columns={columns} getRowId={(p) => p.id} />;

describe('DataTable — public', () => {
  it('renders a captioned table, its column headers and the first page of 5 rows', () => {
    render(table());
    expect(screen.getByRole('table', { name: 'People' })).toBeInTheDocument();
    const headers = screen.getAllByRole('columnheader').map((th: HTMLElement) => th.textContent?.replace(/[▲▼↕]/g, '').trim());
    expect(headers).toEqual(['ID', 'Name', 'Team', 'Tickets', 'City']);
    expect(names()).toEqual(['Mira', 'arjun', 'Zoe', 'Bilal', 'Chen']);
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
  });

  it('sortable headers contain a button and cycle aria-sort ascending → descending → none', () => {
    render(table());
    expect(within(header('ID')).queryByRole('button')).toBeNull();
    expect(ariaSort('Name')).toBe('none');

    fireEvent.click(sortButton('Name'));
    expect(ariaSort('Name')).toBe('ascending');
    expect(names()).toEqual(['arjun', 'Bilal', 'Chen', 'Diego', 'Hana']); // case-insensitive

    fireEvent.click(sortButton('Name'));
    expect(ariaSort('Name')).toBe('descending');
    expect(names()).toEqual(['Zoe', 'Priya', 'Omar', 'Mira', 'Lena']);

    fireEvent.click(sortButton('Name'));
    expect(ariaSort('Name')).toBe('none');
    expect(names()).toEqual(['Mira', 'arjun', 'Zoe', 'Bilal', 'Chen']); // original order
  });

  it('sorts numbers numerically, not as strings', () => {
    render(table());
    fireEvent.click(sortButton('Tickets'));
    const tickets = bodyRows().map((r) => r.cells[3].textContent);
    expect(tickets).toEqual(['3', '9', '10', '12', '18']);
  });

  it('filters case-insensitively across columns and returns to page 1', () => {
    render(table());
    const next = screen.getByRole('button', { name: 'Next page' });
    fireEvent.click(next);
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();

    filterTo('A'); // 9 matches → still 2 pages, so we must be back on page 1
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    expect(names()).toEqual(['Mira', 'arjun', 'Bilal', 'Chen', 'Kofi']);

    fireEvent.click(next);
    filterTo('ENGINEERING');
    expect(names()).toEqual(['arjun', 'Zoe', 'Ines', 'Priya']);
    expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();

    filterTo('berlin');
    expect(names()).toEqual(['Zoe', 'Lena']);
  });

  it('disables Previous/Next at the ends and resets to page 1 when the page size changes', () => {
    render(table());
    const prev = screen.getByRole('button', { name: 'Previous page' });
    const next = screen.getByRole('button', { name: 'Next page' });
    expect(prev).toBeDisabled();
    expect(next).not.toBeDisabled();

    fireEvent.click(next);
    fireEvent.click(next);
    expect(screen.getByText('Page 3 of 3')).toBeInTheDocument();
    expect(names()).toEqual(['Diego', 'Hana']);
    expect(next).toBeDisabled();
    expect(prev).not.toBeDisabled();

    const size = screen.getByRole('combobox', { name: 'Rows per page' });
    fireEvent.change(size, { target: { value: '10' } });
    expect(size).toHaveValue('10');
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    expect(bodyRows()).toHaveLength(10);
  });

  it('shows an empty state when nothing matches', () => {
    render(table());
    filterTo('no such person');
    expect(screen.getByText('No matching rows')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });
});
