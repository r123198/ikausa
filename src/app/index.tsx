import { Redirect } from 'expo-router';

import { ClipHome } from '@/components/clip-home';
import { useAuth } from '@/context/auth-context';
import { isAppClip } from '@/lib/app-clip';

export default function Index() {
  const { session } = useAuth();
  if (session && isAppClip) return <ClipHome />;
  return <Redirect href={session ? '/(tabs)' : '/sign-in'} />;
}
