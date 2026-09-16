import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    PlayfairDisplay: require('@/assets/fonts/Playfair_Display/PlayfairDisplay-VariableFont_wght.ttf'),
    HankenGrotesk: require('@/assets/fonts/Hanken_Grotesk/HankenGrotesk-VariableFont_wght.ttf'),
    SpaceMono: require('@/assets/fonts/Space_Mono/SpaceMono-Regular.ttf'),
    'SpaceMono-Bold': require('@/assets/fonts/Space_Mono/SpaceMono-Bold.ttf'),
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <ThemeProvider value={DarkTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="roll/[id]" />
        <Stack.Screen name="camera/viewfinder" />
        <Stack.Screen name="developing/[id]" />
        <Stack.Screen name="gallery/[id]" />
        <Stack.Screen name="join/[code]" />
        <Stack.Screen name="join/limit-reached" />
        <Stack.Screen name="create/event-name" />
        <Stack.Screen name="create/finish-time" />
        <Stack.Screen name="create/reveal-settings" />
        <Stack.Screen name="create/guest-settings" />
        <Stack.Screen name="create/camera-selection" />
        <Stack.Screen name="create/invitation-card" />
        <Stack.Screen name="create/payment-summary" />
      </Stack>
    </ThemeProvider>
  );
}
