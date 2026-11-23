import { forwardRef } from 'react';
import type { ReactElement, Ref } from 'react';
import type { VirtualListHandle, VirtualListProps } from './types';
import { getVisibleRange } from './virtual';

function VirtualListInner<T>(props: VirtualListProps<T>, _ref: Ref<VirtualListHandle>) {
  const { items, itemHeight, height, overscan = 3, renderItem, label } = props;
  const range = getVisibleRange({ scrollTop: 0, viewportHeight: height, itemHeight, count: items.length, overscan });

  // TODO:
  // - a scroll container of `height` px with a full-height inner spacer (items.length * itemHeight)
  // - render only items in getVisibleRange(...) and position each one at index * itemHeight
  // - recompute the range on scroll; stable keys (getKey)
  // - expose scrollToIndex(index, align) through the ref (useImperativeHandle)
  // - role="listbox" + role="option" with aria-setsize / aria-posinset; focusable list;
  //   ArrowUp/ArrowDown/Home/End move an active option (aria-activedescendant) and keep it in view
  return (
    <div aria-label={label} className="vlist" style={{ height, overflowY: 'auto' }}>
      {items.slice(range.start, range.end).map((item, i) => (
        <div key={i} className="vlist__row" style={{ height: itemHeight }}>
          {renderItem(item, range.start + i)}
        </div>
      ))}
    </div>
  );
}

const VirtualList = forwardRef(VirtualListInner) as <T>(
  props: VirtualListProps<T> & { ref?: Ref<VirtualListHandle> },
) => ReactElement | null;

export default VirtualList;
