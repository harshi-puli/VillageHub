import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image, Text, View } from 'react-native';

function LogoHeader() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Image
        source={require('@/assets/images/logo.png')}
        style={{ width: 30, height: 30, resizeMode: 'contain' }}
      />
      <Text style={{ fontSize: 17, fontWeight: '700', color: '#1A1A18' }}>Village Hub</Text>
    </View>
  );
}

export default function UserLayout() {
  return (
    <Tabs screenOptions={{ headerTitle: () => <LogoHeader /> }}>
      <Tabs.Screen name="userDashboard" options={{ title: 'Home', tabBarIcon: ({ color }) => <Ionicons name="home" size={28} color={color} /> }} />
      <Tabs.Screen name="bookings" options={{ title: 'Bookings', tabBarIcon: ({ color }) => <Ionicons name="calendar" size={28} color={color} /> }} />
      <Tabs.Screen name="chores" options={{ title: 'Chores', tabBarIcon: ({ color }) => <Ionicons name="checkmark-circle" size={28} color={color} /> }} />
      <Tabs.Screen name="feedback" options={{ title: 'Feedback', tabBarIcon: ({ color }) => <Ionicons name="mail" size={28} color={color} /> }} />
      <Tabs.Screen name="calendars" options={{ title: 'Calendar', tabBarIcon: ({ color }) => <Ionicons name="calendar-outline" size={28} color={color} /> }} />
    </Tabs>
  );
}
