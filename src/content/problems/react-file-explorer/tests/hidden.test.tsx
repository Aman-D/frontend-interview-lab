import FileExplorer from '../FileExplorer';
import type { FolderNode } from '../types';

const tree: FolderNode = {
  kind: 'folder', id: 'root', name: 'project',
  children: [
    { kind: 'folder', id: 'root/src', name: 'src', children: [
      { kind: 'folder', id: 'root/src/lib', name: 'lib', children: [{ kind: 'file', id: 'root/src/lib/x.ts', name: 'x.ts' }] },
      { kind: 'file', id: 'root/src/App.tsx', name: 'App.tsx' },
    ] },
    { kind: 'file', id: 'root/b.md', name: 'b.md' },
  ],
};

const item = (name: string) => screen.getByRole('treeitem', { name });

describe('FileExplorer — hidden', () => {
  it('uses roving tabindex: exactly one treeitem is tabbable', () => {
    render(<FileExplorer initialTree={tree} />);
    const tabbable = screen.getAllByRole('treeitem').filter((el) => el.getAttribute('tabindex') === '0');
    expect(tabbable).toHaveLength(1);
  });

  it('supports ArrowDown / ArrowRight / ArrowLeft / Enter keyboard navigation', () => {
    const onOpenFile = fn();
    render(<FileExplorer initialTree={tree} onOpenFile={onOpenFile} />);
    const src = item('src');
    src.focus();
    fireEvent.keyDown(src, { key: 'ArrowRight' }); // expand
    expect(src).toHaveAttribute('aria-expanded', 'true');
    fireEvent.keyDown(src, { key: 'ArrowRight' }); // move to first child (lib)
    expect(item('lib')).toHaveFocus();
    fireEvent.keyDown(item('lib'), { key: 'ArrowDown' }); // App.tsx (lib is collapsed)
    expect(item('App.tsx')).toHaveFocus();
    fireEvent.keyDown(item('App.tsx'), { key: 'Enter' });
    expect(onOpenFile).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(item('App.tsx'), { key: 'ArrowLeft' }); // to parent
    expect(src).toHaveFocus();
    fireEvent.keyDown(src, { key: 'ArrowLeft' }); // collapse
    expect(src).toHaveAttribute('aria-expanded', 'false');
  });

  it('Home / End jump to first and last visible items', () => {
    render(<FileExplorer initialTree={tree} />);
    const src = item('src');
    src.focus();
    fireEvent.keyDown(src, { key: 'End' });
    expect(item('b.md')).toHaveFocus();
    fireEvent.keyDown(item('b.md'), { key: 'Home' });
    expect(src).toHaveFocus();
  });

  it('rejects empty and duplicate names with an alert, case-insensitively', () => {
    render(<FileExplorer initialTree={tree} />);
    fireEvent.click(screen.getByRole('button', { name: 'New file' }));
    const input = screen.getByRole('textbox', { name: 'New file name' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByRole('alert')).toBeInTheDocument();
    fireEvent.change(input, { target: { value: 'B.MD' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByRole('alert')).toHaveTextContent('already exists');
    expect(screen.getAllByRole('treeitem')).toHaveLength(2);
  });

  it('Escape cancels creation', () => {
    render(<FileExplorer initialTree={tree} />);
    fireEvent.click(screen.getByRole('button', { name: 'New folder' }));
    const input = screen.getByRole('textbox', { name: 'New folder name' });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('creating next to a selected file puts the new node in that file\'s folder', () => {
    render(<FileExplorer initialTree={tree} />);
    fireEvent.click(screen.getByText('src'));
    fireEvent.click(screen.getByText('App.tsx'));
    fireEvent.click(screen.getByRole('button', { name: 'New folder' }));
    const input = screen.getByRole('textbox', { name: 'New folder name' });
    fireEvent.change(input, { target: { value: 'hooks' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(item('hooks')).toHaveAttribute('aria-level', '2');
    expect(item('hooks')).toHaveAttribute('aria-expanded', 'false');
  });

  it('deleting a folder removes its descendants', () => {
    render(<FileExplorer initialTree={tree} />);
    fireEvent.click(screen.getByText('src'));
    fireEvent.click(screen.getByText('lib'));
    expect(screen.getByText('x.ts')).toBeInTheDocument();
    fireEvent.click(screen.getByText('src')); // select (and collapse) src
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.queryByText('src')).toBeNull();
    expect(screen.queryByText('lib')).toBeNull();
    expect(screen.getAllByRole('treeitem')).toHaveLength(1);
  });
});
