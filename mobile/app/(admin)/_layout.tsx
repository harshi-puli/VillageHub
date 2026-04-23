import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AdminLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="adminDashboard" options={{ title: 'Home', tabBarIcon: ({ color }) => <Ionicons name="home" size={28} color={color} /> }} />
      <Tabs.Screen name="manageBookings" options={{ title: 'Manage Bookings', tabBarIcon: ({ color }) => <Ionicons name="calendar" size={28} color={color} /> }} />
      <Tabs.Screen name="manageChores" options={{ title: 'Manage Chores', tabBarIcon: ({ color }) => <Ionicons name="checkmark-circle" size={28} color={color} /> }} />
      <Tabs.Screen name="reviewFeedback" options={{ title: 'Feedback', tabBarIcon: ({ color }) => <Ionicons name="mail" size={28} color={color} /> }} />
    </Tabs>
  );
}