import type { Placement, Position, PositionOptions, Rect, Size } from './types';

const OPPOSITE: Record<Placement, Placement> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };

/** Room left between the trigger (plus the offset) and the viewport edge (minus the padding) on one side. */
function spaceOn(side: Placement, trigger: Rect, viewport: Size, offset: number, padding: number): number {
  switch (side) {
    case 'top':
      return trigger.top - offset - padding;
    case 'bottom':
      return viewport.height - padding - (trigger.top + trigger.height) - offset;
    case 'left':
      return trigger.left - offset - padding;
    case 'right':
      return viewport.width - padding - (trigger.left + trigger.width) - offset;
  }
}

/** Size of the floating element along the axis that `side` grows in. */
function extent(side: Placement, floating: Size): number {
  return side === 'top' || side === 'bottom' ? floating.height : floating.width;
}

/** Clamp to [min, max]; when the range is empty (element larger than the viewport) the start edge wins. */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

/**
 * Pure positioning: no DOM access, so it is trivially unit-testable with plain objects.
 *
 * 1. Main axis — use the requested side if the element fits there; otherwise flip to the opposite side
 *    if it fits there; if neither fits, use whichever of the two has more room (ties keep the request).
 * 2. Cross axis — centre on the trigger, then shift so it stays `padding` away from both viewport edges.
 */
export function computePosition(trigger: Rect, floating: Size, viewport: Size, placement: Placement, options: PositionOptions = {}): Position {
  const offset = options.offset ?? 8;
  const padding = options.padding ?? 8;
  const need = extent(placement, floating);

  let side = placement;
  const preferred = spaceOn(placement, trigger, viewport, offset, padding);
  if (preferred < need) {
    const opposite = OPPOSITE[placement];
    const other = spaceOn(opposite, trigger, viewport, offset, padding);
    if (other >= need || other > preferred) side = opposite;
  }

  if (side === 'top' || side === 'bottom') {
    const top = side === 'top' ? trigger.top - offset - floating.height : trigger.top + trigger.height + offset;
    const centred = trigger.left + trigger.width / 2 - floating.width / 2;
    const left = clamp(centred, padding, viewport.width - padding - floating.width);
    return { top, left, placement: side };
  }
  const left = side === 'left' ? trigger.left - offset - floating.width : trigger.left + trigger.width + offset;
  const centred = trigger.top + trigger.height / 2 - floating.height / 2;
  const top = clamp(centred, padding, viewport.height - padding - floating.height);
  return { top, left, placement: side };
}
