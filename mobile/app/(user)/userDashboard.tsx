import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { logoutResident } from '@/services/authService';

export default function UserDashboard() {
  const handleLogout = async () => {
    await logoutResident();
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Dashboard</Text>

      <Pressable style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Log Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9fdbfff',
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#b91c1c',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignSelf: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
  },
});