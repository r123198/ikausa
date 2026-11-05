import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { RollHero } from '@/components/roll-hero';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { ErrorState, LoadingState } from '@/components/ui/screen-state';
import { C, T } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { errorMessage, useFocusedAsync } from '@/hooks/use-async';
import { fetchEventPreview, JoinError, joinEvent } from '@/lib/events';
import { timeUntil } from '@/lib/format';
import { startGuestSession, validateGuestName } from '@/lib/guest';
import { MAX_NAME_LENGTH } from '@/lib/profile';
import { supabase } from '@/lib/supabase';

function joinErrorMessage(e: unknown): string {
  if (e instanceof JoinError && e.reason === 'event_ended') return 'This roll has already ended.';
  if (e instanceof JoinError && e.reason === 'event_full') return 'This roll is full.';
  if (e instanceof JoinError && e.reason === 'too_many_attempts') {
    return 'Too many invalid codes. Wait an hour, then try again.';
  }
  return errorMessage(e);
}

export default function JoinScreen() {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code: string }>();
  const { session } = useAuth();
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [guestName, setGuestName] = useState('');
  const {
    data: preview,
    error,
    isLoading,
    reload,
  } = useFocusedAsync(() => fetchEventPreview(code), [code]);

  if (preview === undefined && isLoading) return <LoadingState />;
  if (preview === undefined) return <ErrorState message={error ?? 'Unknown error'} onRetry={reload} />;
  if (preview === null) {
    return (
      <ErrorState
        message={`No roll found for code ${code.toUpperCase()}. Check the link and try again.`}
        onRetry={reload}
      />
    );
  }

  const hasEnded = preview.endsAt <= new Date();
  const isFull =
    preview.maxParticipants !== null && preview.memberCount >= preview.maxParticipants;

  function goToSignIn() {
    router.push({ pathname: '/sign-in', params: { next: `/join/${encodeURIComponent(code)}` } });
  }

  async function handleJoin() {
    if (!session) {
      goToSignIn();
      return;
    }
    setIsJoining(true);
    setJoinError(null);
    try {
      const eventId = await joinEvent(code);
      router.replace(`/roll/${eventId}`);
    } catch (e) {
      if (e instanceof JoinError && e.reason === 'event_full') {
        router.replace({ pathname: '/join/limit-reached', params: { name: preview!.name } });
        return;
      }
      setJoinError(joinErrorMessage(e));
    } finally {
      setIsJoining(false);
    }
  }

  /** No account: start a guest session with just a name, join, and go straight to the camera. */
  async function handleGuestJoin() {
    const problem = validateGuestName(guestName);
    if (problem) {
      setJoinError(problem);
      return;
    }
    setIsJoining(true);
    setJoinError(null);
    let didStartGuest = false;
    try {
      await startGuestSession(guestName);
      didStartGuest = true;
      const eventId = await joinEvent(code);
      router.replace(`/camera/${eventId}`);
    } catch (e) {
      // Don't leave a guest behind who never got into the roll.
      if (didStartGuest) {
        await supabase.auth.signOut({ scope: 'local' }).catch((signOutError: unknown) => {
          console.error('Could not clear the unused guest session', signOutError);
        });
      }
      setJoinError(joinErrorMessage(e));
    } finally {
      setIsJoining(false);
    }
  }

  const canJoinAsGuest = !session && !hasEnded;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <RollHero
          cover={preview.cover}
          eyebrow={`Invited by ${preview.hostName}`}
          title={preview.name}
          stats={[
            {
              value: preview.shotsPerPerson === null ? '∞' : String(preview.shotsPerPerson),
              label: 'Shots each',
            },
            { value: hasEnded ? 'Ended' : timeUntil(preview.endsAt), label: 'Left' },
            {
              value:
                preview.maxParticipants === null
                  ? String(preview.memberCount)
                  : `${preview.memberCount}/${preview.maxParticipants}`,
              label: 'People',
            },
          ]}
        />

        <SafeAreaView edges={['bottom']} style={styles.actions}>
        {joinError && <Text style={styles.error}>{joinError}</Text>}
        {hasEnded && (
          <Text style={styles.message}>
            This roll has ended. If you were part of it, sign in to open it.
          </Text>
        )}
        {session && (
          <Button
            label={hasEnded || isFull ? 'Open roll' : 'Join roll'}
            isLoading={isJoining}
            icon={<Icon ios="camera.fill" material="photo_camera" size={20} color={C.onPrimary} />}
            onPress={handleJoin}
          />
        )}
        {canJoinAsGuest && (
          <>
            <TextField
              label="Your name"
              value={guestName}
              onChangeText={setGuestName}
              placeholder="What friends call you"
              maxLength={MAX_NAME_LENGTH}
              autoComplete="name"
              textContentType="name"
              autoCapitalize="words"
              returnKeyType="go"
              onSubmitEditing={handleGuestJoin}
            />
            <Button
              label="Join as guest"
              isLoading={isJoining}
              disabled={guestName.trim().length === 0}
              icon={<Icon ios="camera.fill" material="photo_camera" size={20} color={C.onPrimary} />}
              onPress={handleGuestJoin}
            />
            <Text style={styles.message}>No account needed. Your name shows on the photos you take.</Text>
          </>
        )}
        {!session && (
          <Pressable
            accessibilityRole="button"
            onPress={goToSignIn}
            style={({ pressed }) => [styles.signIn, pressed && styles.pressed]}>
            <Text style={styles.signInText}>
              {hasEnded ? 'Were you part of it? ' : 'Have an account? '}
              <Text style={styles.signInLink}>Sign in</Text>
            </Text>
          </Pressable>
        )}
        </SafeAreaView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  scroll: { flexGrow: 1 },
  actions: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16, gap: 12 },
  message: { ...T.caption, fontSize: 14, textAlign: 'center' },
  error: { ...T.caption, fontSize: 14, color: C.error, textAlign: 'center' },
  pressed: { opacity: 0.8 },
  signIn: { alignSelf: 'center', paddingVertical: 8 },
  signInText: { ...T.bodyMd, fontSize: 15, color: C.textMuted },
  signInLink: { color: C.primary, fontWeight: '700' },
});
