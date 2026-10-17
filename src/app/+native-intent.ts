import type { NativeIntent } from 'expo-router';

const APP_CLIP_DEFAULT_HOST = 'appclip.apple.com';

/**
 * The App Clip's default App Store link (https://appclip.apple.com/id?p=...) has
 * no route of its own, so send it to the start screen instead of a 404.
 */
export const redirectSystemPath: NativeIntent['redirectSystemPath'] = ({ path }) => {
  try {
    return new URL(path).hostname === APP_CLIP_DEFAULT_HOST ? '/' : path;
  } catch {
    // Plain paths like "/join/abc" aren't absolute URLs; leave them as they are.
    return path;
  }
};
