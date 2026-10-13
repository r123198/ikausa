import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, type Href } from 'expo-router';
import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import {
  DeleteAccountSheet,
  EmailSheet,
  NameSheet,
  PasswordSheet,
} from '@/components/profile/account-sheets';
import { Avatar } from '@/components/profile/avatar';
import { Button } from '@/components/ui/button';
import { ErrorState, LoadingState } from '@/components/ui/screen-state';
import { Sheet } from '@/components/ui/sheet';
import { useCoverSource } from '@/constants/covers';
import { C, FloatingTabBarSpace, T } from '@/constants/theme';
import { errorMessage, useFocusedAsync } from '@/hooks/use-async';
import { eventPhase, fetchMyEvents, type EventSummary } from '@/lib/events';
import { formatDate, pluralize, timeUntil } from '@/lib/format';
import { fetchMyProfile, removeAvatar, updateAvatar } from '@/lib/profile';
import { supabase } from '@/lib/supabase';

const AVATAR_PICK_QUALITY = 0.8;

type OpenSheet = 'photo' | 'name' | 'email' | 'password' | 'delete' | null;

async function loadProfile() {
  const [profile, events] = await Promise.all([fetchMyProfile(), fetchMyEvents()]);
  return { profile, events };
}

function RollRow({ event, detail, href }: { event: EventSummary; detail: string; href: Href }) {
  const router = useRouter();
  const cover = useCoverSource(event.cover);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${event.name}, ${detail}`}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      onPress={() => router.push(href)}>
      {cover ? (
        <Image source={cover} style={styles.thumb} contentFit="cover" />
      ) : (
        <View style={[styles.thumb, styles.thumbFallback]} />
      )}
      <View style={styles.rowText}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {event.name}
        </Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {detail}
        </Text>
      </View>
      <Icon ios="chevron.right" material="chevron_right" size={16} color={C.outline} />
    </Pressable>
  );
}

function SettingRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}: ${value}` : label}
      style={({ pressed }) => [styles.row, styles.settingRow, pressed && styles.pressed]}
      onPress={onPress}>
      <Text style={styles.settingLabel}>{label}</Text>
      {value && (
        <Text style={styles.settingValue} numberOfLines={1}>
          {value}
        </Text>
      )}
      <Icon ios="chevron.right" material="chevron_right" size={16} color={C.outline} />
    </Pressable>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.group}>{children}</View>
    </View>
  );
}

export default function ProfileScreen() {
  const { data, error, isLoading, reload } = useFocusedAsync(loadProfile, []);
  const [openSheet, setOpenSheet] = useState<OpenSheet>(null);
  const [isPhotoBusy, setIsPhotoBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  if (!data && isLoading) return <LoadingState />;
  if (!data) return <ErrorState message={error ?? 'Unknown error'} onRetry={reload} />;

  const { profile, events } = data;
  const now = new Date();
  const developing = events.filter((e) => eventPhase(e, now) === 'developing');
  const done = events.filter((e) => ['ready', 'expired'].includes(eventPhase(e, now)));
  const close = () => setOpenSheet(null);
  const closeAndReload = (message?: string) => {
    setOpenSheet(null);
    if (message) setNotice(message);
    reload();
  };

  async function changePhoto() {
    setOpenSheet(null);
    setNotice(null);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: AVATAR_PICK_QUALITY,
      });
      if (result.canceled || !result.assets[0]) return;
      setIsPhotoBusy(true);
      await updateAvatar(result.assets[0].uri);
      reload();
    } catch (e) {
      setNotice(errorMessage(e));
    } finally {
      setIsPhotoBusy(false);
    }
  }

  async function deletePhoto() {
    setOpenSheet(null);
    setIsPhotoBusy(true);
    try {
      await removeAvatar();
      reload();
    } catch (e) {
      setNotice(errorMessage(e));
    } finally {
      setIsPhotoBusy(false);
    }
  }

  async function signOut() {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) setNotice(errorMessage(signOutError));
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={reload} tintColor={C.primary} />
        }>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Change profile photo"
            disabled={isPhotoBusy}
            onPress={() => setOpenSheet('photo')}>
            <Avatar url={profile.avatarUrl} name={profile.displayName} size={84} />
            <View style={styles.avatarBadge}>
              {isPhotoBusy ? (
                <ActivityIndicator size="small" color={C.onPrimary} />
              ) : (
                <Icon ios="camera.fill" material="photo_camera" size={13} color={C.onPrimary} />
              )}
            </View>
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.name} numberOfLines={1}>
              {profile.displayName}
            </Text>
            <Text style={styles.email} numberOfLines={1}>
              {profile.email}
            </Text>
          </View>
        </View>

        {notice && (
          <Text style={styles.notice} accessibilityLiveRegion="polite">
            {notice}
          </Text>
        )}

        <Group title="Account">
          <SettingRow label="Name" value={profile.displayName} onPress={() => setOpenSheet('name')} />
          <SettingRow label="Email" value={profile.email} onPress={() => setOpenSheet('email')} />
          <SettingRow label="Password" value="••••••••" onPress={() => setOpenSheet('password')} />
        </Group>

        {developing.length > 0 && (
          <Group title="Developing">
            {developing.map((event) => (
              <RollRow
                key={event.id}
                event={event}
                href={`/developing/${event.id}`}
                detail={`Reveals in ${timeUntil(event.revealAt, now)} · ${pluralize(event.photoCount, 'photo')}`}
              />
            ))}
          </Group>
        )}

        {done.length > 0 && (
          <Group title="Done">
            {done.map((event) => (
              <RollRow
                key={event.id}
                event={event}
                href={`/roll/${event.id}`}
                detail={
                  eventPhase(event, now) === 'ready'
                    ? `${pluralize(event.photoCount, 'photo')} · Export until ${formatDate(event.exportUntil)}`
                    : `Export closed ${formatDate(event.exportUntil)}`
                }
              />
            ))}
          </Group>
        )}

        <View style={styles.footerActions}>
          <Button label="Sign out" variant="outline" onPress={signOut} />
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.deleteLink, pressed && styles.pressed]}
            onPress={() => setOpenSheet('delete')}>
            <Text style={styles.deleteText}>Delete account</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Sheet visible={openSheet === 'photo'} onClose={close} title="Profile photo">
        <Button
          label="Choose from library"
          icon={<Icon ios="photo" material="add_photo_alternate" size={18} color={C.onPrimary} />}
          onPress={changePhoto}
        />
        {profile.avatarPath && <Button label="Remove photo" variant="danger" onPress={deletePhoto} />}
      </Sheet>
      {openSheet === 'name' && (
        <NameSheet current={profile.displayName} onClose={close} onDone={() => closeAndReload('Name updated.')} />
      )}
      {openSheet === 'email' && (
        <EmailSheet current={profile.email} onClose={close} onDone={() => closeAndReload()} />
      )}
      {openSheet === 'password' && (
        <PasswordSheet onClose={close} onDone={() => closeAndReload('Password updated.')} />
      )}
      {openSheet === 'delete' && <DeleteAccountSheet onClose={close} onDone={close} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  content: { padding: 20, paddingBottom: FloatingTabBarSpace, gap: 28 },
  pressed: { opacity: 0.85 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 18, paddingTop: 8 },
  avatarBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.primary,
    borderWidth: 3,
    borderColor: C.background,
  },
  headerText: { flex: 1, gap: 2 },
  name: { ...T.headlineLgMobile, fontSize: 30, lineHeight: 36 },
  email: { ...T.caption, fontSize: 15 },
  notice: { ...T.caption, fontSize: 14, color: C.textSoft, marginTop: -12 },

  section: { gap: 12 },
  sectionTitle: { ...T.eyebrow },
  group: {
    backgroundColor: C.card,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.hairline,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, minHeight: 72 },
  settingRow: { minHeight: 56, paddingHorizontal: 16 },
  settingLabel: { ...T.bodyMd, fontSize: 16 },
  settingValue: { ...T.caption, fontSize: 14, flex: 1, textAlign: 'right' },
  thumb: { width: 52, height: 52, borderRadius: 12 },
  thumbFallback: { backgroundColor: C.surfaceHigh },
  rowText: { flex: 1, gap: 4 },
  rowTitle: { ...T.title, fontSize: 19, lineHeight: 24 },
  rowMeta: { ...T.caption, fontSize: 14, lineHeight: 20 },

  footerActions: { gap: 8 },
  deleteLink: { alignSelf: 'center', paddingVertical: 12, paddingHorizontal: 16 },
  deleteText: { ...T.bodyMd, fontSize: 15, color: C.error, fontWeight: '600' },
});
