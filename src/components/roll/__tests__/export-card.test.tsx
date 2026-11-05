import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import { ExportCard, type ExportState } from '@/components/roll/export-card';

// Motion isn't under test; a static stand-in avoids Reanimated's native runtime.
jest.mock('react-native-reanimated', () => {
  // jest.mock factories run before imports, so they have to require.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  const chain = { duration: () => chain, reduceMotion: () => chain };
  return {
    __esModule: true,
    default: { View },
    Easing: { out: () => () => 0, cubic: () => 0 },
    FadeInDown: chain,
    FadeOut: chain,
    ReduceMotion: { System: 'system' },
    useSharedValue: (value: number) => ({ value }),
    useAnimatedStyle: (fn: () => object) => fn(),
    withTiming: (value: number) => value,
  };
});
jest.mock('@/components/icon', () => ({ Icon: () => null }));
jest.mock('@/global.css', () => ({}));

function render(
  state: ExportState,
  handlers = { onRetry: jest.fn(), onDismiss: jest.fn(), onSaveToPhotos: jest.fn() }
) {
  let tree!: ReactTestRenderer;
  act(() => {
    tree = create(<ExportCard state={state} rollFileName="Our Anniversary - Ikausa.zip" {...handlers} />);
  });
  // Text children can be a string or a mix of strings and numbers ({count} ready).
  const isTextPart = (child: unknown) => typeof child === 'string' || typeof child === 'number';
  const text = tree.root
    .findAll((node) => {
      const { children } = node.props;
      return isTextPart(children) || (Array.isArray(children) && children.length > 0 && children.every(isTextPart));
    })
    .map((node) => [node.props.children].flat().join(''))
    .join(' ');
  return { tree, text, handlers };
}

describe('ExportCard', () => {
  test('shows how far the export has got', () => {
    const { tree, text } = render({ kind: 'running', done: 7, total: 24 });
    const bar = tree.root.findAll((node) => node.props.accessibilityRole === 'progressbar')[0];

    expect(text).toContain('Saving to Photos');
    expect(text).toContain('7');
    expect(bar.props.accessibilityValue).toEqual({ min: 0, max: 24, now: 7, text: '7 of 24' });
  });

  test('confirms a complete export', () => {
    const { text } = render({ kind: 'done', saved: 24, failed: 0, via: 'library' });

    expect(text).toContain('Saved 24 photos');
    expect(text).not.toContain('Try again');
  });

  test('offers a retry when some photos failed', () => {
    const { tree, text, handlers } = render({ kind: 'done', saved: 22, failed: 2, via: 'library' });

    expect(text).toContain('Saved 22 of 24');
    expect(text).toContain('2 photos couldn’t be saved');
    act(() => tree.root.findByProps({ label: 'Try again' }).props.onPress());
    expect(handlers.onRetry).toHaveBeenCalledTimes(1);
  });

  test('shows the plain error message and can be dismissed', () => {
    const { tree, text, handlers } = render({ kind: 'error', message: 'No connection. Try again.' });

    expect(text).toContain('Couldn’t export');
    expect(text).toContain('No connection. Try again.');
    act(() => tree.root.findByProps({ accessibilityLabel: 'Dismiss' }).props.onPress());
    expect(handlers.onDismiss).toHaveBeenCalledTimes(1);
  });

  test('asks for one more tap to save to Photos on iPhone web', () => {
    const { tree, text, handlers } = render({ kind: 'ready', count: 24, failed: 0 });

    expect(text).toContain('24 photos ready');
    expect(text).toContain('Save 24 Images');
    act(() => tree.root.findByProps({ label: 'Save to Photos' }).props.onPress());
    expect(handlers.onSaveToPhotos).toHaveBeenCalledTimes(1);
  });

  test('is honest that a share-sheet save depends on what was chosen', () => {
    const { text } = render({ kind: 'done', saved: 24, failed: 0, via: 'share' });

    expect(text).toContain('If you chose Save Images, they’re in your Photos app.');
  });
});

