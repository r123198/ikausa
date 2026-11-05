import { resistEdges, settleIndex } from '@/lib/swipe';

const WIDTH = 400;

describe('settleIndex', () => {
  test('stays put after a short, slow drag', () => {
    expect(settleIndex({ index: 3, translationX: -40, velocityX: -100, width: WIDTH, count: 10 })).toBe(3);
  });

  test('goes to the next photo after dragging left past a fifth of the screen', () => {
    expect(settleIndex({ index: 3, translationX: -90, velocityX: 0, width: WIDTH, count: 10 })).toBe(4);
  });

  test('goes back after dragging right far enough', () => {
    expect(settleIndex({ index: 3, translationX: 120, velocityX: 0, width: WIDTH, count: 10 })).toBe(2);
  });

  test('a quick flick moves even when the drag was short', () => {
    expect(settleIndex({ index: 3, translationX: -20, velocityX: -900, width: WIDTH, count: 10 })).toBe(4);
    expect(settleIndex({ index: 3, translationX: 20, velocityX: 900, width: WIDTH, count: 10 })).toBe(2);
  });

  test('never moves past the first or last photo', () => {
    expect(settleIndex({ index: 0, translationX: 300, velocityX: 2000, width: WIDTH, count: 10 })).toBe(0);
    expect(settleIndex({ index: 9, translationX: -300, velocityX: -2000, width: WIDTH, count: 10 })).toBe(9);
  });

  test('a flick against the drag direction cancels the move', () => {
    expect(settleIndex({ index: 3, translationX: -150, velocityX: 900, width: WIDTH, count: 10 })).toBe(3);
  });
});

describe('resistEdges', () => {
  test('follows the finger between photos', () => {
    expect(resistEdges(-50, 3, 10)).toBe(-50);
  });

  test('drags at a third of the distance past the first and last photo', () => {
    expect(resistEdges(90, 0, 10)).toBe(30);
    expect(resistEdges(-90, 9, 10)).toBe(-30);
  });
});
