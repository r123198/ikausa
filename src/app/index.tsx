import { Redirect } from 'expo-router';

import { ClipHome } from '@/components/clip-home';
import { useAuth } from '@/context/auth-context';
import { isAppClip } from '@/lib/app-clip';
import { shouldShowOnboarding } from '@/lib/onboarding';

export default function Index() {
  const { session } = useAuth();
  if (session && isAppClip) return <ClipHome />;
  if (session) return <Redirect href="/(tabs)" />;
  return <Redirect href={shouldShowOnboarding() ? '/onboarding' : '/sign-in'} />;
}
