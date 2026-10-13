import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { C, T } from '@/constants/theme';
import { errorMessage } from '@/hooks/use-async';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

type Mode = 'sign-in' | 'sign-up';

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Only allow in-app paths so a crafted link can't redirect elsewhere. */
function safeNext(next: string | string[] | undefined): Href {
  const value = Array.isArray(next) ? next[0] : next;
  return value && value.startsWith('/') && !value.startsWith('//') ? (value as Href) : '/';
}

function validate(mode: Mode, name: string, email: string, password: string): string | null {
  if (mode === 'sign-up' && name.trim().length === 0) return 'Enter your name.';
  if (!EMAIL_PATTERN.test(email.trim())) return 'Enter a valid email address.';
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
}

export default function SignInScreen() {
  const router = useRouter();
  const { next } = useLocalSearchParams<{ next?: string | string[] }>();
  const [mode, setMode] = useState<Mode>('sign-in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignUp = mode === 'sign-up';

  function switchMode() {
    setMode(isSignUp ? 'sign-in' : 'sign-up');
    setError(null);
    setNotice(null);
  }

  async function handleSubmit() {
    const problem = validate(mode, name, email, password);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setNotice(null);
    setIsSubmitting(true);

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { display_name: name.trim() } },
        });
        if (signUpError) throw signUpError;
        if (!data.session) {
          // Email confirmation is on: the account exists but needs verifying.
          setNotice('Check your email to confirm your account, then sign in.');
          setMode('sign-in');
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
      }
      router.replace(safeNext(next));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>{isSignUp ? 'Create your account' : 'Welcome back'}</Text>
            <Text style={styles.subtitle}>
              {isSignUp
                ? 'Start rolls, invite friends and shoot together.'
                : 'Sign in to see your rolls.'}
            </Text>
          </View>

          {!isSupabaseConfigured && (
            <Text style={styles.error}>
              Supabase isn't configured. Add EXPO_PUBLIC_SUPABASE_URL and
              EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env and restart the dev server.
            </Text>
          )}

          <View style={styles.form}>
            {isSignUp && (
              <Field
                label="Name"
                value={name}
                onChangeText={setName}
                autoComplete="name"
                textContentType="name"
                placeholder="What friends call you"
              />
            )}
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoComplete="email"
              textContentType="emailAddress"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="you@example.com"
            />
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              textContentType={isSignUp ? 'newPassword' : 'password'}
              secureTextEntry
              autoCapitalize="none"
              placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
              onSubmitEditing={handleSubmit}
            />
          </View>

          {error && (
            <Text style={styles.error} accessibilityLiveRegion="polite">
              {error}
            </Text>
          )}
          {notice && (
            <Text style={styles.notice} accessibilityLiveRegion="polite">
              {notice}
            </Text>
          )}

          <Button
            label={isSignUp ? 'Create account' : 'Sign in'}
            onPress={handleSubmit}
            isLoading={isSubmitting}
          />

          <Pressable accessibilityRole="button" onPress={switchMode} style={styles.switch}>
            <Text style={styles.switchText}>
              {isSignUp ? 'Already have an account? ' : "New here? "}
              <Text style={styles.switchLink}>{isSignUp ? 'Sign in' : 'Create an account'}</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type FieldProps = React.ComponentProps<typeof TextInput> & { label: string };

function Field({ label, ...inputProps }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor={`${C.onSurfaceVariant}80`}
        accessibilityLabel={label}
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 20 },

  header: { gap: 8, marginBottom: 8 },
  title: { ...T.headlineLgMobile },
  subtitle: { ...T.bodyMd, color: C.onSurfaceVariant },

  form: { gap: 16 },
  field: { gap: 6 },
  fieldLabel: { ...T.bodyMd, fontSize: 14, fontWeight: '600', color: C.onSurfaceVariant },
  input: {
    ...T.bodyMd,
    minHeight: 52,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.outlineVariant,
    backgroundColor: C.surface,
  },

  error: { ...T.bodyMd, fontSize: 14, color: C.error },
  notice: { ...T.bodyMd, fontSize: 14, color: C.primary },

  switch: { alignSelf: 'center', paddingVertical: 12 },
  switchText: { ...T.bodyMd, fontSize: 15, color: C.onSurfaceVariant },
  switchLink: { color: C.primary, fontWeight: '700' },
});
