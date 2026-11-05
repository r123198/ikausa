/**
 * Paging maths for swiping between photos. Worklets, so the photo viewer's gesture can
 * run them on the UI thread; plain functions everywhere else (including tests).
 */

/** Drag at least this share of the screen to move to the next photo. */
const DISTANCE_RATIO = 0.2;
/** Or flick at least this fast (points per second). */
const FLICK_VELOCITY = 500;
/** Past the first or last photo the strip only follows a third of the finger's movement. */
const EDGE_RESISTANCE = 1 / 3;

interface SettleInput {
  index: number;
  translationX: number;
  velocityX: number;
  width: number;
  count: number;
}

/** The photo a swipe lands on when the finger lifts. */
export function settleIndex({ index, translationX, velocityX, width, count }: SettleInput): number {
  'worklet';
  const isFlick = Math.abs(velocityX) >= FLICK_VELOCITY;
  // A flick back the other way cancels the move, like the Photos app.
  const direction = isFlick ? -Math.sign(velocityX) : -Math.sign(translationX);
  const movedFar = Math.abs(translationX) >= width * DISTANCE_RATIO;
  const agrees = !isFlick || Math.sign(velocityX) === Math.sign(translationX) || translationX === 0;
  const shouldMove = (isFlick && agrees) || (!isFlick && movedFar);
  if (!shouldMove || direction === 0) return index;
  return Math.min(Math.max(index + direction, 0), count - 1);
}

/** Drag distance after rubber-banding at the first and last photo. */
export function resistEdges(translationX: number, index: number, count: number): number {
  'worklet';
  const pastStart = index === 0 && translationX > 0;
  const pastEnd = index === count - 1 && translationX < 0;
  return pastStart || pastEnd ? translationX * EDGE_RESISTANCE : translationX;
}
