import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function UserLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="userDashboard" options={{ title: 'Home', tabBarIcon: ({ color }) => <Ionicons name="home" size={28} color={color} /> }} />
      <Tabs.Screen name="bookings" options={{ title: 'Bookings', tabBarIcon: ({ color }) => <Ionicons name="calendar" size={28} color={color} /> }} />
      <Tabs.Screen name="chores" options={{ title: 'Chores', tabBarIcon: ({ color }) => <Ionicons name="checkmark-circle" size={28} color={color} /> }} />
      <Tabs.Screen name="feedback" options={{ title: 'Feedback', tabBarIcon: ({ color }) => <Ionicons name="mail" size={28} color={color} /> }} />
      <Tabs.Screen name="calendars" options={{ title: 'Calendar', tabBarIcon: ({ color }) => <Ionicons name="calendar-outline" size={28} color={color} /> }} />
    </Tabs>
  );
}