import type { ReactElement } from 'react';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';

/** Renders a tree and returns its visible text plus a way to find buttons by label. */
export function render(element: ReactElement) {
  let tree!: ReactTestRenderer;
  act(() => {
    tree = create(element);
  });
  const isTextPart = (child: unknown) => typeof child === 'string' || typeof child === 'number';
  const text = () =>
    tree.root
      .findAll((node) => {
        // Host nodes only, so a label isn't counted once per wrapping component.
        if (typeof node.type !== 'string') return false;
        const { children } = node.props;
        return isTextPart(children) || (Array.isArray(children) && children.length > 0 && children.every(isTextPart));
      })
      .map((node) => [node.props.children].flat().join(''))
      .join(' ');
  const button = (label: string): ReactTestInstance =>
    tree.root.find(
      (node) =>
        node.props.accessibilityRole === 'button' &&
        typeof node.props.onPress === 'function' &&
        node.findAll((child) => child.props.children === label).length > 0,
    );
  return { tree, text, button };
}
