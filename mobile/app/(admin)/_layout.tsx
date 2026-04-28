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

export default function AdminLayout() {
  return (
    <Tabs screenOptions={{ headerTitle: () => <LogoHeader /> }}>
      <Tabs.Screen name="adminDashboard" options={{ title: 'Home', tabBarIcon: ({ color }) => <Ionicons name="home" size={28} color={color} /> }} />
      <Tabs.Screen name="manageBookings" options={{ title: 'Manage Bookings', tabBarIcon: ({ color }) => <Ionicons name="calendar" size={28} color={color} /> }} />
      <Tabs.Screen name="manageChores" options={{ title: 'Manage Chores', tabBarIcon: ({ color }) => <Ionicons name="checkmark-circle" size={28} color={color} /> }} />
      <Tabs.Screen name="reviewFeedback" options={{ title: 'Feedback', tabBarIcon: ({ color }) => <Ionicons name="mail" size={28} color={color} /> }} />
      <Tabs.Screen name="calendars" options={{ title: 'Calendar', tabBarIcon: ({ color }) => <Ionicons name="calendar-outline" size={28} color={color} /> }} />
    </Tabs>
  );
}
