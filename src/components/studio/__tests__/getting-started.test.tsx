import { GettingStarted } from '@/components/studio/getting-started';

import { render } from '@/test-utils/render';

jest.mock('@/global.css', () => ({}));

describe('GettingStarted', () => {
  test('offers to create the first event when there is none', () => {
    const onCreate = jest.fn();
    const { button } = render(<GettingStarted hasEvent={false} hasPhotos={false} onCreate={onCreate} />);

    button('Create your first event').props.onPress();

    expect(onCreate).toHaveBeenCalled();
  });

  test('ticks off the event step and drops the button once an event exists', () => {
    const { text } = render(<GettingStarted hasEvent hasPhotos={false} onCreate={jest.fn()} />);

    expect(text()).toContain('✓');
    expect(text()).not.toContain('Create your first event');
    expect(text()).toContain('2');
  });

  test('ticks off the first two steps once guests have shot photos', () => {
    const { text } = render(<GettingStarted hasEvent hasPhotos onCreate={jest.fn()} />);

    expect(text().match(/✓/g)).toHaveLength(2);
    expect(text()).toContain('3');
  });
});
