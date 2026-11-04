import * as Clipboard from 'expo-clipboard';
import { useEffect, useRef, useState } from 'react';

const COPIED_RESET_MS = 2000;

interface CopyState {
  isCopied: boolean;
  copy: (text: string) => Promise<void>;
}

/** Copies text and briefly flags it, for a button that confirms the copy. */
export function useCopy(): CopyState {
  const [isCopied, setIsCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy(text: string) {
    await Clipboard.setStringAsync(text);
    setIsCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setIsCopied(false), COPIED_RESET_MS);
  }

  return { isCopied, copy };
}
