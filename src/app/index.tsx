import { Redirect } from 'expo-router';

import { ClipHome } from '@/components/clip-home';
import { useAuth } from '@/context/auth-context';
import { isAppClip } from '@/lib/app-clip';
import { shouldShowOnboarding } from '@/lib/onboarding';

export default function Index() {
  const { session, isGuest } = useAuth();
  // Guests and App Clip users have no Home: open the roll they joined.
  if (session && (isAppClip || isGuest)) return <ClipHome />;
  if (session) return <Redirect href="/(tabs)" />;
  return <Redirect href={shouldShowOnboarding() ? '/onboarding' : '/sign-in'} />;
}
