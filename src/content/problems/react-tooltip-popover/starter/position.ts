import type { Placement, Position, PositionOptions, Rect, Size } from './types';

/**
 * Pure positioning helper — no DOM access. Returns viewport coordinates for `position: fixed`.
 *
 * TODO:
 * - main axis: use `placement` if the floating element fits between the trigger (+ offset) and the
 *   viewport edge (- padding); otherwise flip to the opposite side if it fits there; if neither side
 *   fits, use the side with more room (a tie keeps the requested side)
 * - cross axis: centre on the trigger, then shift so it stays `padding` away from both edges
 *   (if it is larger than the viewport, align it to the start edge: `padding`)
 * - support 'left' and 'right' as well as 'top' and 'bottom'
 */
export function computePosition(trigger: Rect, floating: Size, _viewport: Size, placement: Placement, options: PositionOptions = {}): Position {
  const offset = options.offset ?? 8;
  const centredLeft = trigger.left + trigger.width / 2 - floating.width / 2;
  if (placement === 'top') return { top: trigger.top - offset - floating.height, left: centredLeft, placement };
  return { top: trigger.top + trigger.height + offset, left: centredLeft, placement: 'bottom' };
}
