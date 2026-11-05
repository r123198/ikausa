import type { CameraType, CameraViewProps } from 'expo-camera';
import { useRef, useState, type ReactNode, type RefObject } from 'react';
import type { View } from 'react-native';

export interface Flash {
  /** False when this camera can't flash at all, so the button can be hidden. */
  isSupported: boolean;
  isOn: boolean;
  toggle: () => void;
  cameraProps: Pick<CameraViewProps, 'flash'>;
  /** Wrap the shutter call so the flash fires around it. */
  capture: <T>(take: () => Promise<T>) => Promise<T>;
  /** Re-checks what the active camera can do; call from onCameraReady. */
  onCameraReady: () => void;
  /** Full-screen layer for the web's screen flash; nothing on native. */
  overlay: ReactNode;
  /** The view wrapping CameraView; the web reads the video track through it. */
  viewfinderRef: RefObject<View | null>;
}

/** Native: the camera hardware fires the flash itself. */
export function useFlash(_facing: CameraType): Flash {
  const [isOn, setIsOn] = useState(false);
  const viewfinderRef = useRef<View>(null);
  return {
    isSupported: true,
    isOn,
    toggle: () => setIsOn((on) => !on),
    cameraProps: { flash: isOn ? 'on' : 'off' },
    capture: (take) => take(),
    onCameraReady: () => {},
    overlay: null,
    viewfinderRef,
  };
}
