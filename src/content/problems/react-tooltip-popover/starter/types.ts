/** The side of the trigger the floating element is placed on. */
export type Placement = 'top' | 'bottom' | 'left' | 'right';

/** A rectangle in viewport coordinates — the shape of getBoundingClientRect(). */
export interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface PositionOptions {
  /** Gap between the trigger and the floating element. Default 8. */
  offset?: number;
  /** Minimum distance the floating element keeps from every viewport edge. Default 8. */
  padding?: number;
}

/** Where to put the floating element (viewport coordinates, for `position: fixed`). */
export interface Position {
  top: number;
  left: number;
  /** The side actually used — differs from the requested one after a flip. */
  placement: Placement;
}
