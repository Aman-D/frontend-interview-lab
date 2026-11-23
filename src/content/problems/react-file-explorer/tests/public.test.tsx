import FileExplorer from '../FileExplorer';
import type { FolderNode } from '../types';

const tree: FolderNode = {
  kind: 'folder', id: 'root', name: 'project',
  children: [
    { kind: 'file', id: 'root/z.md', name: 'z.md' },
    { kind: 'folder', id: 'root/src', name: 'src', children: [{ kind: 'file', id: 'root/src/App.tsx', name: 'App.tsx' }] },
    { kind: 'file', id: 'root/a.json', name: 'a.json' },
  ],
};

const item = (name: string) => screen.getByRole('treeitem', { name });

describe('FileExplorer — public', () => {
  it('renders an accessible tree with folders first, then files alphabetically', () => {
    render(<FileExplorer initialTree={tree} />);
    expect(screen.getByRole('tree')).toBeInTheDocument();
    const names = screen.getAllByRole('treeitem').map((el) => el.textContent?.replace(/[^\w.]/g, ''));
    expect(screen.getByRole('treeitem', { name: 'src' })).toBeInTheDocument();
    expect(names).toEqual(['src', 'a.json', 'z.md']);
  });

  it('folders start collapsed and toggle on click (aria-expanded)', () => {
    render(<FileExplorer initialTree={tree} />);
    const src = item('src');
    expect(src).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('App.tsx')).toBeNull();
    fireEvent.click(screen.getByText('src'));
    expect(src).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('App.tsx')).toBeInTheDocument();
    fireEvent.click(screen.getByText('src'));
    expect(screen.queryByText('App.tsx')).toBeNull();
  });

  it('clicking a file selects it and calls onOpenFile with the node', () => {
    const onOpenFile = fn();
    render(<FileExplorer initialTree={tree} onOpenFile={onOpenFile} />);
    fireEvent.click(screen.getByText('a.json'));
    expect(onOpenFile).toHaveBeenCalledWith({ kind: 'file', id: 'root/a.json', name: 'a.json' });
    expect(item('a.json')).toHaveAttribute('aria-selected', 'true');
  });

  it('creates a file inside the selected folder', () => {
    render(<FileExplorer initialTree={tree} />);
    fireEvent.click(screen.getByText('src'));
    fireEvent.click(screen.getByRole('button', { name: 'New file' }));
    const input = screen.getByRole('textbox', { name: 'New file name' });
    fireEvent.change(input, { target: { value: 'index.ts' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    const created = item('index.ts');
    expect(created).toHaveAttribute('aria-level', '2');
    expect(created).toHaveAttribute('aria-selected', 'true');
  });

  it('deletes the selected node', () => {
    render(<FileExplorer initialTree={tree} />);
    fireEvent.click(screen.getByText('z.md'));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.queryByText('z.md')).toBeNull();
  });
});
