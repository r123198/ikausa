import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { AuthProvider, useAuth } from '@/context/auth-context';
import { CreateEventProvider } from '@/context/create-event-context';

SplashScreen.preventAutoHideAsync();

function RootStack() {
  const { session, isReady } = useAuth();
  const [fontsLoaded, fontError] = useFonts({
    PlayfairDisplay: require('@/assets/fonts/Playfair_Display/PlayfairDisplay-VariableFont_wght.ttf'),
    'PlayfairDisplay-Italic': require('@/assets/fonts/Playfair_Display/PlayfairDisplay-Italic-VariableFont_wght.ttf'),
    HankenGrotesk: require('@/assets/fonts/Hanken_Grotesk/HankenGrotesk-VariableFont_wght.ttf'),
  });
  const isLoaded = (fontsLoaded || Boolean(fontError)) && isReady;

  useEffect(() => {
    if (isLoaded) SplashScreen.hideAsync();
  }, [isLoaded]);

  if (!isLoaded) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={Boolean(session)}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="roll/[id]" />
        <Stack.Screen name="camera/[id]" />
        <Stack.Screen name="developing/[id]" />
        <Stack.Screen name="join/limit-reached" />
        <Stack.Screen name="create/name" />
        <Stack.Screen name="create/finish" />
        <Stack.Screen name="create/reveal" />
        <Stack.Screen name="create/camera" />
        <Stack.Screen name="create/cover" />
        <Stack.Screen name="create/guests" />
      </Stack.Protected>
      {/* Reachable signed out: invite links preview the event before sign-in. */}
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="join/[code]" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider value={DarkTheme}>
      <AuthProvider>
        <CreateEventProvider>
          <RootStack />
        </CreateEventProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
