import { computePosition } from '../position';

const viewport = { width: 800, height: 600 };

describe('computePosition — hidden', () => {
  it('supports right, flipping to left at the right edge, with vertical centring', () => {
    const tip = { width: 150, height: 40 };
    expect(computePosition({ top: 100, left: 100, width: 60, height: 30 }, tip, viewport, 'right')).toEqual({ top: 95, left: 168, placement: 'right' });
    expect(computePosition({ top: 100, left: 700, width: 60, height: 30 }, tip, viewport, 'right')).toEqual({ top: 95, left: 542, placement: 'left' });
  });

  it('flips from left to right at the left edge and shifts vertically inside the viewport', () => {
    const tip = { width: 150, height: 80 };
    // centred top would be 0 + 15 - 40 = -25 → shifted to the padding (8)
    expect(computePosition({ top: 0, left: 20, width: 60, height: 30 }, tip, viewport, 'left')).toEqual({ top: 8, left: 88, placement: 'right' });
  });

  it('when neither side fits, uses the side with more room', () => {
    const short = { width: 800, height: 200 };
    const tip = { width: 100, height: 120 };
    const trigger = { top: 60, left: 300, width: 80, height: 30 }; // room above: 44, room below: 94
    expect(computePosition(trigger, tip, short, 'top')).toEqual({ top: 98, left: 290, placement: 'bottom' });
    expect(computePosition(trigger, tip, short, 'bottom')).toEqual({ top: 98, left: 290, placement: 'bottom' });
  });

  it('keeps the requested side when it fits exactly (boundary is inclusive)', () => {
    // top = 56 - 8 - 40 = 8 = padding → fits
    const r = computePosition({ top: 56, left: 100, width: 80, height: 30 }, { width: 120, height: 40 }, viewport, 'top');
    expect(r.placement).toBe('top');
    expect(r.top).toBe(8);
  });

  it('aligns to the start padding when the element is wider than the viewport', () => {
    const r = computePosition({ top: 100, left: 300, width: 40, height: 30 }, { width: 900, height: 40 }, viewport, 'bottom');
    expect(r.left).toBe(8);
  });

  it('uses the viewport argument (not window) and honours offset/padding options', () => {
    const small = { width: 300, height: 300 };
    const r = computePosition({ top: 100, left: 260, width: 40, height: 20 }, { width: 100, height: 30 }, small, 'bottom', { offset: 4, padding: 12 });
    expect(r).toEqual({ top: 124, left: 188, placement: 'bottom' }); // 300 - 12 - 100
  });

  it('does not mutate its inputs', () => {
    const trigger = { top: 20, left: 0, width: 40, height: 30 };
    const tip = { width: 200, height: 40 };
    const vp = { width: 800, height: 600 };
    computePosition(trigger, tip, vp, 'top');
    expect(trigger).toEqual({ top: 20, left: 0, width: 40, height: 30 });
    expect(tip).toEqual({ width: 200, height: 40 });
    expect(vp).toEqual({ width: 800, height: 600 });
  });
});
