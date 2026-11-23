import { computePosition } from '../position';

// Plain objects — no DOM. Defaults: offset 8, padding 8.
const viewport = { width: 800, height: 600 };
const tip = { width: 120, height: 40 };
const trigger = { top: 100, left: 100, width: 80, height: 30 }; // bottom edge 130, centre x 140

describe('computePosition — public', () => {
  it('places below the trigger, centred, when "bottom" fits', () => {
    expect(computePosition(trigger, tip, viewport, 'bottom')).toEqual({ top: 138, left: 80, placement: 'bottom' });
  });

  it('places above the trigger when "top" fits', () => {
    expect(computePosition(trigger, tip, viewport, 'top')).toEqual({ top: 52, left: 80, placement: 'top' });
  });

  it('flips from top to bottom when there is no room above', () => {
    const nearTop = { top: 20, left: 100, width: 80, height: 30 };
    expect(computePosition(nearTop, tip, viewport, 'top')).toEqual({ top: 58, left: 80, placement: 'bottom' });
  });

  it('flips from bottom to top near the bottom edge', () => {
    const nearBottom = { top: 540, left: 100, width: 80, height: 30 };
    expect(computePosition(nearBottom, tip, viewport, 'bottom')).toEqual({ top: 492, left: 80, placement: 'top' });
  });

  it('shifts along the cross axis to stay inside the left and right edges', () => {
    const wide = { width: 200, height: 40 };
    const atLeft = { top: 100, left: 0, width: 40, height: 30 };
    const atRight = { top: 100, left: 760, width: 40, height: 30 };
    expect(computePosition(atLeft, wide, viewport, 'bottom').left).toBe(8);
    expect(computePosition(atRight, wide, viewport, 'bottom').left).toBe(592); // 800 - 8 - 200
  });
});
