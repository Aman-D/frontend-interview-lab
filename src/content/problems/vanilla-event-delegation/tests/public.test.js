import { onClickMatching } from '../delegate';

function setup(html) {
  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.append(container);
  return container;
}

describe('onClickMatching — public', () => {
  it('calls the handler with the matched element and the event', () => {
    const root = setup('<ul><li><button class="del">x</button></li></ul>');
    const handler = fn();
    onClickMatching(root, '.del', handler);
    const button = root.querySelector('.del');
    fireEvent.click(button);
    expect(handler).toHaveBeenCalledTimes(1);
    const [matched, event] = handler.mock.calls[0];
    expect(matched).toBe(button);
    expect(event.type).toBe('click');
  });

  it('a click on a nested child resolves to the matching ancestor', () => {
    const root = setup('<button class="del"><span class="icon"><b>x</b></span></button>');
    const handler = fn();
    onClickMatching(root, '.del', handler);
    fireEvent.click(root.querySelector('b'));
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0]).toBe(root.querySelector('.del'));
  });

  it('ignores clicks that do not hit a matching element, and handles elements added later', () => {
    const root = setup('<p class="text">hello</p>');
    const handler = fn();
    onClickMatching(root, '.del', handler);
    fireEvent.click(root.querySelector('.text'));
    expect(handler).toHaveBeenCalledTimes(0);

    const later = document.createElement('button');
    later.className = 'del';
    root.append(later);
    fireEvent.click(later);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0]).toBe(later);
  });

  it('returns a function that removes the listener', () => {
    const root = setup('<button class="del">x</button>');
    const handler = fn();
    const off = onClickMatching(root, '.del', handler);
    off();
    fireEvent.click(root.querySelector('.del'));
    expect(handler).toHaveBeenCalledTimes(0);
  });
});

describe('todo list — public', () => {
  beforeEach(() => {
    mount();
  });

  it('deleting a task removes it from the list', () => {
    const list = screen.getByRole('list', { name: 'Tasks' });
    fireEvent.click(screen.getByRole('button', { name: 'Delete Water the plants' }));
    expect(within(list).queryByRole('button', { name: 'Water the plants' })).toBe(null);
    expect(within(list).getAllByRole('listitem')).toHaveLength(1);
  });

  it('a task added after load can be deleted (no per-item listeners needed)', () => {
    const input = screen.getByRole('textbox', { name: 'New task' });
    input.value = 'Buy stamps';
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    const list = screen.getByRole('list', { name: 'Tasks' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);

    fireEvent.click(screen.getByRole('button', { name: 'Delete Buy stamps' }));
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByRole('status')).toHaveTextContent('Deleted "Buy stamps".');
  });
});
