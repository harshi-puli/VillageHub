import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function CalendarsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#ECEBE7',
          borderTopWidth: 1,
          paddingBottom: 6,
          paddingTop: 6,
          height: 58,
        },
        tabBarActiveTintColor: '#1A1A18',
        tabBarInactiveTintColor: '#B4B2A9',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}>
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bed-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="gardening"
        options={{
          title: 'Gardening',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="leaf-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}