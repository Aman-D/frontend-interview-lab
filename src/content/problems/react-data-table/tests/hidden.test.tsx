import DataTable from '../DataTable';
import type { Column } from '../types';
import { ariaSort, bodyRows, columns, filterTo, names, people, sortButton, type Person } from './helpers';

const all = [50];

describe('DataTable — hidden', () => {
  it('sorting is stable for ties in both directions and never mutates the rows prop', () => {
    const input = [...people];
    render(<DataTable caption="People" rows={input} columns={columns} getRowId={(p) => p.id} pageSizeOptions={all} />);
    fireEvent.click(sortButton('Tickets'));
    expect(names()).toEqual(['Kofi', 'Zoe', 'Chen', 'Mira', 'Priya', 'Lena', 'Hana', 'Bilal', 'Ines', 'Diego', 'Omar', 'arjun']);
    fireEvent.click(sortButton('Tickets'));
    // Ties (45) keep their original relative order — Bilal, Ines, Diego — when descending too.
    expect(names()).toEqual(['arjun', 'Omar', 'Bilal', 'Ines', 'Diego', 'Hana', 'Lena', 'Priya', 'Mira', 'Chen', 'Zoe', 'Kofi']);
    expect(input.map((p) => p.id)).toEqual(people.map((p) => p.id));
  });

  it("uses a column's compare function and negates it for descending", () => {
    const rank: Record<string, number> = { Support: 0, Sales: 1, Engineering: 2, Design: 3 };
    const cols: Column<Person>[] = columns.map((c) => (c.key === 'team' ? { ...c, compare: (a: Person, b: Person) => rank[a.team] - rank[b.team] } : c));
    render(<DataTable caption="People" rows={people} columns={cols} getRowId={(p) => p.id} pageSizeOptions={all} />);
    fireEvent.click(sortButton('Team'));
    expect(names().slice(0, 5)).toEqual(['Chen', 'Omar', 'Bilal', 'Lena', 'Hana']);
    fireEvent.click(sortButton('Team'));
    expect(names().slice(0, 4)).toEqual(['Mira', 'Kofi', 'Diego', 'arjun']);
  });

  it('puts empty (null) values last in both directions', () => {
    render(<DataTable caption="People" rows={people} columns={columns} getRowId={(p) => p.id} pageSizeOptions={all} />);
    fireEvent.click(sortButton('City'));
    let n = names();
    expect(n.slice(0, 3)).toEqual(['Kofi', 'Zoe', 'Lena']); // Accra, Berlin, Berlin
    expect(n.slice(-2)).toEqual(['Bilal', 'Priya']);
    fireEvent.click(sortButton('City'));
    n = names();
    expect(n[0]).toBe('Chen'); // Taipei
    expect(n.slice(-2)).toEqual(['Bilal', 'Priya']);
  });

  it('filters raw values (not rendered text) of filterKeys only, ignoring surrounding whitespace', () => {
    const { rerender } = render(<DataTable caption="People" rows={people} columns={columns} getRowId={(p) => p.id} filterKeys={['name']} />);
    filterTo('  ZO  ');
    expect(names()).toEqual(['Zoe']);
    filterTo('design'); // a team, but team is not a filter key
    expect(screen.getByText('No matching rows')).toBeInTheDocument();

    rerender(<DataTable caption="People" rows={people} columns={columns} getRowId={(p) => p.id} />);
    filterTo('null'); // null cities must not match the text "null"
    expect(screen.getByText('No matching rows')).toBeInTheDocument();
    filterTo('100');
    expect(names()).toEqual(['arjun']);
  });

  it('a different column starts ascending, clears the old aria-sort, and sorting returns to page 1', () => {
    render(<DataTable caption="People" rows={people} columns={columns} getRowId={(p) => p.id} />);
    expect(sortButton('Name')).toHaveAttribute('type', 'button');
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    fireEvent.click(sortButton('Name'));
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    fireEvent.click(sortButton('Name'));
    expect(ariaSort('Name')).toBe('descending');
    fireEvent.click(sortButton('Team'));
    expect(ariaSort('Team')).toBe('ascending');
    expect(ariaSort('Name')).toBe('none');
    expect(screen.getAllByRole('columnheader').filter((th: HTMLElement) => th.hasAttribute('aria-sort') && th.getAttribute('aria-sort') !== 'none')).toHaveLength(1);
  });

  it('derives the view from props: new rows appear immediately and an out-of-range page is clamped', () => {
    const el = (rows: Person[]) => <DataTable caption="People" rows={rows} columns={columns} getRowId={(p) => p.id} />;
    const { rerender } = render(el(people));
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(screen.getByText('Page 3 of 3')).toBeInTheDocument();

    rerender(el(people.slice(0, 4)));
    expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
    expect(names()).toEqual(['Mira', 'arjun', 'Zoe', 'Bilal']);

    rerender(el([]));
    expect(screen.getByText('No data')).toBeInTheDocument();
    expect(bodyRows()).toHaveLength(1);
  });

  it('never renders rows that no longer match the filter (no effect-synced copies of derived data)', () => {
    const renderName = fn((p: Person) => p.name);
    const cols = columns.map((c) => (c.key === 'name' ? { ...c, render: renderName } : c));
    render(<DataTable caption="People" rows={people} columns={cols} getRowId={(p) => p.id} />);
    renderName.mockClear();
    filterTo('ines');
    expect(names()).toEqual(['Ines']);
    const rendered = renderName.mock.calls.map((call) => call[0].name);
    expect(rendered.length).toBeGreaterThan(0);
    expect(rendered.filter((n) => n !== 'Ines')).toEqual([]);
  });
});
