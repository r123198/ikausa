import { act } from 'react-test-renderer';

import { ClientPanel, HandOffPanel } from '@/components/studio/event-panels';
import type { HostInvite } from '@/lib/studio';

import { render } from '@/test-utils/render';

jest.mock('@/global.css', () => ({}));
jest.mock('@/lib/supabase', () => ({ supabase: {} }));
jest.mock('@/components/qr-code', () => ({ QrCode: () => null }));
jest.mock('@/components/logo', () => ({ Logo: () => null, PulsingLogo: () => null }));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn() }));
// The test renderer has a window but no window.location.
jest.mock('@/lib/studio', () => ({
  ...jest.requireActual('@/lib/studio'),
  hostInviteUrl: (token: string) => `https://ikausa.test/host/${token}`,
}));

const used: HostInvite = { token: 'used', createdAt: new Date(), usedAt: new Date() };
const unused: HostInvite = { token: 'fresh', createdAt: new Date(), usedAt: null };

function handOff(hostInvites: HostInvite[], onCreate = jest.fn()) {
  return render(
    <HandOffPanel hint="hint" hostInvites={hostInvites} isCreating={false} isDisabled={false} onCreate={onCreate} />,
  );
}

describe('HandOffPanel', () => {
  test('offers to create a host link when there is none', () => {
    const onCreate = jest.fn();
    const { text, button } = handOff([], onCreate);

    button('Create host link').props.onPress();

    expect(onCreate).toHaveBeenCalled();
    expect(text()).toContain('No co-hosts yet.');
  });

  test('shows the unused link to copy instead of a create button', () => {
    const { text } = handOff([used, unused]);

    expect(text()).toContain('/host/fresh');
    expect(text()).toContain('Copy host link');
    expect(text()).not.toContain('Create');
    expect(text()).toContain('1 co-host so far.');
  });

  test('offers another link once every link has been used', () => {
    const { text } = handOff([used]);

    expect(text()).toContain('Create another host link');
  });
});

describe('ClientPanel', () => {
  function client(onSave: (name: string) => Promise<boolean>, isSaving = false) {
    const view = render(<ClientPanel savedName="Ana" isSaving={isSaving} onSave={onSave} />);
    const input = view.tree.root.find((node) => typeof node.props.onChangeText === 'function');
    return { ...view, input };
  }

  test('keeps Save disabled until the name changes', () => {
    const { button, input } = client(jest.fn());

    expect(button('Save').props.disabled).toBe(true);
    act(() => input.props.onChangeText('Ana & Paolo'));
    expect(button('Save').props.disabled).toBe(false);
  });

  test('saves the edited name on submit', async () => {
    const onSave = jest.fn().mockResolvedValue(true);
    const { input } = client(onSave);

    act(() => input.props.onChangeText('Ana & Paolo'));
    await act(async () => input.props.onSubmitEditing());

    expect(onSave).toHaveBeenCalledWith('Ana & Paolo');
  });

  test('keeps the draft when saving fails', async () => {
    const onSave = jest.fn().mockResolvedValue(false);
    const { tree, input } = client(onSave);

    act(() => input.props.onChangeText('Ana & Paolo'));
    await act(async () => input.props.onSubmitEditing());

    const field = tree.root.find((node) => typeof node.props.onChangeText === 'function');
    expect(field.props.value).toBe('Ana & Paolo');
  });

  test('does not save again while a save is running', () => {
    const onSave = jest.fn();
    const { input } = client(onSave, true);

    act(() => input.props.onChangeText('Ana & Paolo'));
    act(() => input.props.onSubmitEditing());

    expect(onSave).not.toHaveBeenCalled();
  });
});
