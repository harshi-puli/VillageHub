import { AuthProvider } from '@/state/auth';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
        <Stack.Screen name="index" />
        <Stack.Screen 
  name="(user)" 
  options={{ headerShown: false, animation: 'none' }} 
/>
<Stack.Screen 
  name="(admin)" 
  options={{ headerShown: false, animation: 'none' }} 
/>
      </Stack>
    </AuthProvider>
  );
}