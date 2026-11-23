import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { computePosition } from './position';
import type { Placement, Position } from './types';

/**
 * Measures the anchor and the floating element while `open` is true and returns where to place the
 * floating element (viewport coordinates, for `position: fixed`). Re-measures on window resize and on
 * scroll of ANY scroll container (capture phase), because a scrolled ancestor moves the anchor too.
 */
export function useAnchoredPosition(
  open: boolean,
  getAnchor: () => Element | null,
  floatingRef: RefObject<HTMLElement>,
  placement: Placement,
): Position | null {
  const [position, setPosition] = useState<Position | null>(null);
  // The latest getAnchor without making it an effect dependency (callers pass inline functions).
  const getAnchorRef = useRef(getAnchor);
  useLayoutEffect(() => {
    getAnchorRef.current = getAnchor;
  });

  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const anchor = getAnchorRef.current();
      const floating = floatingRef.current;
      if (!anchor || !floating) return;
      const trigger = anchor.getBoundingClientRect();
      const box = floating.getBoundingClientRect();
      // clientWidth/Height exclude scrollbars, unlike innerWidth/innerHeight.
      const viewport = { width: document.documentElement.clientWidth, height: document.documentElement.clientHeight };
      const next = computePosition(trigger, { width: box.width, height: box.height }, viewport, placement);
      // Keep the same object when nothing moved, so scroll events don't cause pointless re-renders.
      setPosition((prev) => (prev && prev.top === next.top && prev.left === next.left && prev.placement === next.placement ? prev : next));
    };
    // Layout effect: runs after the DOM is committed but before paint, so there is no visible jump.
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, placement, floatingRef]);

  return open ? position : null;
}
