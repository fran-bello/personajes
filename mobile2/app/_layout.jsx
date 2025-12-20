import { Stack } from 'expo-router';
import { AuthProvider } from '../src/context/AuthContext';
import { 
  useFonts, 
  Truculenta_400Regular, 
  Truculenta_700Bold 
} from '@expo-google-fonts/truculenta';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../src/theme';
import { Text, TextInput } from 'react-native';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'Truculenta': Truculenta_400Regular,
    'Truculenta-Bold': Truculenta_700Bold,
    'Attack': require('../assets/fonts/Attack.ttf'),
  });

  // Aplica la tipografía por defecto a todos los textos y entradas apenas están cargadas
  if (loaded) {
    Text.defaultProps = {
      ...(Text.defaultProps || {}),
      style: [
        ...(Array.isArray(Text.defaultProps?.style) ? Text.defaultProps.style : [Text.defaultProps?.style].filter(Boolean)),
        { fontFamily: 'Truculenta' },
      ],
    };

    TextInput.defaultProps = {
      ...(TextInput.defaultProps || {}),
      style: [
        ...(Array.isArray(TextInput.defaultProps?.style) ? TextInput.defaultProps.style : [TextInput.defaultProps?.style].filter(Boolean)),
        { fontFamily: 'Truculenta' },
      ],
    };
  }

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack 
        screenOptions={{ 
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background }
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(auth)/register" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="create-game" />
        <Stack.Screen name="local-game" />
        <Stack.Screen name="how-to-play" />
        <Stack.Screen name="game/[roomCode]" />
      </Stack>
    </AuthProvider>
  );
}

