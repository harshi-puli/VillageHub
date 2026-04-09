import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/state/auth';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ title: 'Log In' }} />
          <Stack.Screen name="user-dashboard" options={{ title: 'User Dashboard' }} />
          <Stack.Screen name="admin-dashboard" options={{ title: 'Admin Dashboard' }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          <Stack.Screen name="pages/admin/reviewFeedback" options={{ title: 'Feedback Manager' }} />
          <Stack.Screen name="pages/admin/manageBookings" options={{ title: 'Bookings Manager' }} />
          <Stack.Screen name="pages/admin/manageChores" options={{ title: 'Chores Manager' }} />
          <Stack.Screen name="pages/user/feedback" options={{ title: 'Feedback' }} />
          <Stack.Screen name="pages/user/bookings" options={{ title: 'Bookings' }} />
          <Stack.Screen name="pages/user/chores" options={{ title: 'Chores' }} />
        </Stack>
      </AuthProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
