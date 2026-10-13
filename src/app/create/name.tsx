import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { WizardScreen } from '@/components/create/wizard-screen';
import { Icon } from '@/components/icon';
import { C, T } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useCreateEvent } from '@/context/create-event-context';

const MAX_NAME_LENGTH = 60;

function suggestionsFor(name: string | undefined): string[] {
  const owner = name?.trim().split(/\s+/)[0];
  const personal = owner
    ? [`${owner}'s party`, `${owner}'s Birthday`, `${owner}'s Wedding day`]
    : ['Birthday party', 'Wedding day'];
  return [...personal, 'Our Anniversary', 'Salo-salo', 'Family Reunion'];
}

export default function NameStep() {
  const router = useRouter();
  const { session } = useAuth();
  const { name, setName } = useCreateEvent();
  const suggestions = suggestionsFor(session?.user.user_metadata.display_name as string | undefined);

  return (
    <WizardScreen
      step={1}
      title="What is the name of your event?"
      subtitle={'Choose the perfect title for your roll.\nEveryone you invite will see it.'}
      canContinue={name.trim().length > 0}
      onNext={() => router.push('/create/finish')}>
      <View style={styles.inputWrap}>
        <Icon ios="pencil" material="edit" size={18} color={C.textMuted} />
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter your roll title"
          placeholderTextColor={C.textMuted}
          maxLength={MAX_NAME_LENGTH}
          accessibilityLabel="Roll name"
          autoFocus
          returnKeyType="next"
          onSubmitEditing={() => name.trim() && router.push('/create/finish')}
        />
      </View>

      <View style={styles.suggestions}>
        <Text style={styles.eyebrow}>Suggestions</Text>
        {suggestions.map((s) => (
          <Pressable
            key={s}
            accessibilityRole="button"
            style={({ pressed }) => [styles.chip, name === s && styles.chipActive, pressed && styles.pressed]}
            onPress={() => setName(s)}>
            <Text style={[styles.chipText, name === s && styles.chipTextActive]}>{s}</Text>
          </Pressable>
        ))}
      </View>
    </WizardScreen>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.8 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 60,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.hairline,
  },
  input: { ...T.bodyMd, flex: 1, paddingVertical: 14, outlineWidth: 0 },
  suggestions: { gap: 10, alignItems: 'flex-start' },
  eyebrow: { ...T.eyebrow, marginBottom: 4 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.hairline,
  },
  chipActive: { borderColor: C.primary, backgroundColor: 'rgba(255,196,153,0.08)' },
  chipText: { ...T.bodyMd, fontSize: 15, color: C.textSoft },
  chipTextActive: { color: C.primary },
});
