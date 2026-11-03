import { Redirect, Stack, usePathname, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { Logo } from '@/components/logo';
import { StudioContext } from '@/components/studio/studio-context';
import { Button } from '@/components/ui/button';
import { ErrorState, LoadingState } from '@/components/ui/screen-state';
import { C, T } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useFocusedAsync } from '@/hooks/use-async';
import { fetchOrganizerStatus, type OrganizerStatus } from '@/lib/studio';

const NOT_ORGANIZER: OrganizerStatus = { isOrganizer: false, isAdmin: false };

function InviteOnly() {
  const router = useRouter();
  return (
    <View style={styles.gate}>
      <Logo size={56} />
      <Text style={styles.gateTitle}>Studio is invite-only</Text>
      <Text style={styles.gateText}>
        Ikausa Studio is for event planners and photographers who run rolls for their clients. If
        you’d like access, ask the Ikausa team for an invite link.
      </Text>
      <Button label="Back to Ikausa" variant="outline" onPress={() => router.replace('/')} />
    </View>
  );
}

/**
 * Private web portal for organizers. Access is checked in the database too;
 * this gate only decides what to show. The invite page stays open to anyone
 * so a new organizer can redeem their link.
 */
export default function StudioLayout() {
  const pathname = usePathname();
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const isInvitePage = pathname.startsWith('/studio/invite/');
  const {
    data: status,
    error,
    isLoading,
    reload,
  } = useFocusedAsync(
    () => (userId ? fetchOrganizerStatus(userId) : Promise.resolve(NOT_ORGANIZER)),
    [userId]
  );

  if (Platform.OS !== 'web') return <Redirect href="/" />;

  function renderBody() {
    if (isInvitePage) return <Stack screenOptions={{ headerShown: false }} />;
    if (!session) return <Redirect href={{ pathname: '/sign-in', params: { next: pathname } }} />;
    if (!status && isLoading) return <LoadingState />;
    if (!status) return <ErrorState message={error ?? 'Unknown error'} onRetry={reload} />;
    if (!status.isOrganizer) return <InviteOnly />;
    return <Stack screenOptions={{ headerShown: false }} />;
  }

  return (
    <StudioContext.Provider value={{ status: status ?? NOT_ORGANIZER, reloadStatus: reload }}>
      <Head>
        <title>Ikausa Studio</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      {renderBody()}
    </StudioContext.Provider>
  );
}

const styles = StyleSheet.create({
  gate: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 32,
    backgroundColor: C.background,
  },
  gateTitle: { ...T.title, fontSize: 32, lineHeight: 40, textAlign: 'center' },
  gateText: { ...T.bodyMd, color: C.textSoft, textAlign: 'center', maxWidth: 460 },
});
