import { onClickMatching } from '../delegate';

function setup(html) {
  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.append(container);
  return container;
}

describe('onClickMatching — hidden', () => {
  it('never matches root itself or ancestors of root', () => {
    const outer = setup('<section class="card"><ul class="card list"><li class="item">a</li></ul></section>');
    const root = outer.querySelector('ul');
    const handler = fn();
    onClickMatching(root, '.card', handler);
    fireEvent.click(root.querySelector('.item')); // nearest .card is root, then the section outside it
    fireEvent.click(root);
    expect(handler).toHaveBeenCalledTimes(0);
  });

  it('ignores matching elements outside root', () => {
    const page = setup('<ul id="a"><li><button class="del">in</button></li></ul><button class="del" id="outside">out</button>');
    const handler = fn();
    onClickMatching(page.querySelector('#a'), '.del', handler);
    fireEvent.click(page.querySelector('#outside'));
    expect(handler).toHaveBeenCalledTimes(0);
    fireEvent.click(page.querySelector('#a .del'));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('with nested matches, calls the handler once with the innermost match', () => {
    const root = setup('<div class="row" id="outer"><div class="row" id="inner"><span>hit</span></div></div>');
    const handler = fn();
    onClickMatching(root, '.row', handler);
    fireEvent.click(root.querySelector('span'));
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].id).toBe('inner');
  });

  it('handles events whose target is a text node', () => {
    const root = setup('<button class="del">delete</button>');
    const handler = fn();
    onClickMatching(root, '.del', handler);
    const text = root.querySelector('.del').firstChild;
    text.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0]).toBe(root.querySelector('.del'));
  });

  it('throws for an invalid selector at registration time', () => {
    const root = setup('<button>x</button>');
    expect(() => onClickMatching(root, 'button[', fn())).toThrow();
  });

  it('registrations are independent and unsubscribing twice is harmless', () => {
    const root = setup('<button class="del">x</button>');
    const first = fn();
    const second = fn();
    const offFirst = onClickMatching(root, '.del', first);
    onClickMatching(root, 'button', second);
    offFirst();
    offFirst();
    fireEvent.click(root.querySelector('.del'));
    expect(first).toHaveBeenCalledTimes(0);
    expect(second).toHaveBeenCalledTimes(1);
  });
});

describe('todo list — hidden', () => {
  beforeEach(() => {
    mount();
  });

  it('clicking the icon inside a delete button deletes that task only', () => {
    const list = screen.getByRole('list', { name: 'Tasks' });
    const button = screen.getByRole('button', { name: 'Delete Reply to Sam' });
    fireEvent.click(button.querySelector('.icon'));
    const remaining = within(list).getAllByRole('listitem');
    expect(remaining).toHaveLength(1);
    expect(remaining[0]).toHaveTextContent('Water the plants');
  });

  it('toggle and delete handlers coexist on the same list', () => {
    const toggle = screen.getByRole('button', { name: 'Water the plants' });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });

  it('after deleting, focus moves to the next task so keyboard users stay in the list', () => {
    fireEvent.click(screen.getByRole('button', { name: 'Delete Water the plants' }));
    expect(screen.getByRole('button', { name: 'Delete Reply to Sam' })).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Delete Reply to Sam' }));
    expect(screen.getByRole('textbox', { name: 'New task' })).toHaveFocus();
  });
});
