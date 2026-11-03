import '@/lib/install-storage';

import { Platform } from 'react-native';

import { isAppClip } from '@/lib/app-clip';

const SEEN_KEY = 'ikausa.onboarding.seen';

/** True once the first-launch slides have been finished or skipped on this install. */
export function hasSeenOnboarding(): boolean {
  // Static web rendering has no storage; never show the slides there.
  if (typeof localStorage === 'undefined') return true;
  try {
    return localStorage.getItem(SEEN_KEY) === '1';
  } catch (error) {
    console.error('Could not read onboarding flag', error);
    return true;
  }
}

export function markOnboardingSeen(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch (error) {
    console.error('Could not save onboarding flag', error);
  }
}

/** The slides are for new installs of the mobile app; the web and the App Clip skip them. */
export function shouldShowOnboarding(): boolean {
  return Platform.OS !== 'web' && !isAppClip && !hasSeenOnboarding();
}
