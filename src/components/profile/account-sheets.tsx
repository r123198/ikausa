import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { TextField } from '@/components/ui/text-field';
import { C, T } from '@/constants/theme';
import { errorMessage } from '@/hooks/use-async';
import {
  changeEmail,
  changePassword,
  deleteAccount,
  MAX_NAME_LENGTH,
  MIN_PASSWORD_LENGTH,
  updateDisplayName,
} from '@/lib/profile';

interface SheetProps {
  onClose: () => void;
  onDone: () => void;
}

/** Runs an async action with busy + error state for a sheet's primary button. */
function useSubmit(action: () => Promise<void>, onSuccess: () => void) {
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit() {
    setIsBusy(true);
    setError(null);
    try {
      await action();
      onSuccess();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setIsBusy(false);
    }
  }
  return { isBusy, error, submit };
}

function ErrorText({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <Text style={styles.error} accessibilityLiveRegion="polite">
      {message}
    </Text>
  );
}

export function NameSheet({ current, onClose, onDone }: SheetProps & { current: string }) {
  const [name, setName] = useState(current);
  const { isBusy, error, submit } = useSubmit(() => updateDisplayName(name), onDone);
  return (
    <Sheet visible onClose={onClose} title="Your name" subtitle="Shown on your photos and invites.">
      <TextField
        label="Name"
        value={name}
        onChangeText={setName}
        maxLength={MAX_NAME_LENGTH}
        autoFocus
        autoComplete="name"
        textContentType="name"
        onSubmitEditing={submit}
      />
      <ErrorText message={error} />
      <Button label="Save" isLoading={isBusy} disabled={name.trim().length === 0} onPress={submit} />
    </Sheet>
  );
}

export function EmailSheet({ current, onClose, onDone }: SheetProps & { current: string }) {
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);
  const { isBusy, error, submit } = useSubmit(() => changeEmail(email), () => setIsSent(true));
  return (
    <Sheet
      visible
      onClose={isSent ? onDone : onClose}
      title="Email"
      subtitle={`Currently ${current}. We’ll send a link to confirm the new address.`}>
      {isSent ? (
        <>
          <Text style={styles.notice}>
            Check {email.trim()} (and possibly your current inbox) for a confirmation link. Your email
            changes once it’s confirmed.
          </Text>
          <Button label="Done" variant="outline" onPress={onDone} />
        </>
      ) : (
        <>
          <TextField
            label="New email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            autoFocus
            onSubmitEditing={submit}
          />
          <ErrorText message={error} />
          <Button label="Send confirmation" isLoading={isBusy} disabled={!email.trim()} onPress={submit} />
        </>
      )}
    </Sheet>
  );
}

export function PasswordSheet({ onClose, onDone }: SheetProps) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const mismatch = confirm.length > 0 && next !== confirm;
  const { isBusy, error, submit } = useSubmit(() => changePassword(current, next), onDone);
  return (
    <Sheet visible onClose={onClose} title="Change password">
      <TextField
        label="Current password"
        value={current}
        onChangeText={setCurrent}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
      />
      <TextField
        label="New password"
        value={next}
        onChangeText={setNext}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
      />
      <TextField
        label="Confirm new password"
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        onSubmitEditing={submit}
      />
      <ErrorText message={mismatch ? 'The new passwords don’t match.' : error} />
      <Button
        label="Update password"
        isLoading={isBusy}
        disabled={!current || next.length < MIN_PASSWORD_LENGTH || next !== confirm}
        onPress={submit}
      />
    </Sheet>
  );
}

const CONFIRM_WORD = 'DELETE';

export function DeleteAccountSheet({ onClose, onDone }: SheetProps) {
  const [typed, setTyped] = useState('');
  const { isBusy, error, submit } = useSubmit(deleteAccount, onDone);
  return (
    <Sheet
      visible
      onClose={onClose}
      title="Delete account"
      subtitle="This permanently deletes your account, every roll you host (including guests’ photos in them), your shots in other people’s rolls, and any unused passes. It can’t be undone.">
      <TextField
        label={`Type ${CONFIRM_WORD} to confirm`}
        value={typed}
        onChangeText={setTyped}
        autoCapitalize="characters"
        autoCorrect={false}
      />
      <ErrorText message={error} />
      <Button
        label="Delete my account"
        variant="danger"
        isLoading={isBusy}
        disabled={typed.trim() !== CONFIRM_WORD}
        onPress={submit}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  error: { ...T.caption, fontSize: 14, color: C.error },
  notice: { ...T.bodyMd, fontSize: 15, lineHeight: 22, color: C.textSoft },
});
