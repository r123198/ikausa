import * as Application from 'expo-application';
import { Platform } from 'react-native';

const APP_CLIP_BUNDLE_SUFFIX = '.clip';

/**
 * True inside the iOS App Clip. Guests open it by scanning an invite, so it
 * only offers joining, the roll and the camera: no home tabs or roll creation.
 */
export const isAppClip =
  Platform.OS === 'ios' && (Application.applicationId?.endsWith(APP_CLIP_BUNDLE_SUFFIX) ?? false);
