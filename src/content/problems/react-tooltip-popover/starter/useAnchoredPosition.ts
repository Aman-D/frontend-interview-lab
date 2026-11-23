import { useLayoutEffect, useState, type RefObject } from 'react';
import { computePosition } from './position';
import type { Placement, Position } from './types';

/**
 * Measures the anchor and the floating element while `open` and returns where to put the floating
 * element (viewport coordinates, for `position: fixed`).
 *
 * TODO: also re-measure on window resize and on scroll (of any scroll container), and clean up.
 */
export function useAnchoredPosition(
  open: boolean,
  getAnchor: () => Element | null,
  floatingRef: RefObject<HTMLElement>,
  placement: Placement,
): Position | null {
  const [position, setPosition] = useState<Position | null>(null);
  useLayoutEffect(() => {
    if (!open) return;
    const anchor = getAnchor();
    const floating = floatingRef.current;
    if (!anchor || !floating) return;
    const viewport = { width: document.documentElement.clientWidth, height: document.documentElement.clientHeight };
    setPosition(computePosition(anchor.getBoundingClientRect(), floating.getBoundingClientRect(), viewport, placement));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, placement]);
  return open ? position : null;
}
