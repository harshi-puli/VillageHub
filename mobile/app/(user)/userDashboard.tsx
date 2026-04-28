import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { logoutResident } from '@/services/authService';
import { listAnnouncements } from '@/services/announcementService';

const logo = require('../../assets/images/TVS_logo.png');

type Announcement = {
  id: string;
  title: string;
  description?: string;
};

export default function UserDashboard() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const fetchHomeData = useCallback(async () => {
    const data = await listAnnouncements();
    setAnnouncements(data as Announcement[]);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        await fetchHomeData();
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [fetchHomeData]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchHomeData();
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    await logoutResident();
    router.replace('/');
  };

  const goToPage = (path: '/bookings' | '/chores' | '/feedback') => {
    setMenuOpen(false);
    router.push(path);
  };

  if (loading) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.cardContainer}>
        {/* BURGER MENU */}
        <Pressable style={styles.menuButton} onPress={() => setMenuOpen(!menuOpen)}>
          <Text style={styles.menuText}>☰</Text>
        </Pressable>

        {menuOpen && (
          <View style={styles.dropdown}>
            <Pressable style={styles.dropdownItem} onPress={() => goToPage('/bookings')}>
              <Text style={styles.dropdownText}>Bookings</Text>
            </Pressable>

            <Pressable style={styles.dropdownItem} onPress={() => goToPage('/chores')}>
              <Text style={styles.dropdownText}>Chores</Text>
            </Pressable>

            <Pressable style={styles.dropdownItem} onPress={() => goToPage('/feedback')}>
              <Text style={styles.dropdownText}>Feedback</Text>
            </Pressable>

            <Pressable style={styles.dropdownItem} onPress={handleLogout}>
              <Text style={[styles.dropdownText, styles.logoutText]}>Log Out</Text>
            </Pressable>
          </View>
        )}

        {/* HEADER */}
        <View style={styles.header}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
          <Text style={styles.appTitle}>Village Hub</Text>
          <Text style={styles.welcome}>
            Welcome back, <Text style={styles.bold}>User!</Text>
          </Text>
        </View>

        {/* CONTENT */}
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.dashboardCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardHeaderText}>New Announcements</Text>
            </View>

            <View style={styles.cardBody}>
              {announcements.length === 0 ? (
                <Text style={styles.emptyText}>No announcements yet.</Text>
              ) : (
                announcements.slice(0, 3).map((item) => (
                  <View key={item.id} style={styles.announcementItem}>
                    <Text style={styles.announcementTitle}>{item.title}</Text>
                    {!!item.description && (
                      <Text style={styles.announcementDescription}>{item.description}</Text>
                    )}
                  </View>
                ))
              )}
            </View>
          </View>

          <View style={styles.dashboardCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardHeaderText}>Personal Calendar</Text>
            </View>

            <View style={styles.cardBody}>
              <Text style={styles.emptyText}>No upcoming events.</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FBE9A6',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 12,
    paddingTop: 20,
  },

  menuButton: {
    position: 'absolute',
    top: 12,
    right: 16,
    zIndex: 20,
  },
  menuText: {
    fontSize: 26,
    color: '#007C83',
    fontWeight: '700',
  },
  dropdown: {
    position: 'absolute',
    top: 48,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D8D8D8',
    width: 160,
    zIndex: 30,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  dropdownText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007C83',
  },
  logoutText: {
    color: '#B91C1C',
  },

  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#007C83',
  },
  welcome: {
    fontSize: 20,
    color: '#007C83',
    marginTop: 8,
  },
  bold: {
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 40,
    paddingBottom: 30,
    gap: 30,
  },
  dashboardCard: {
    backgroundColor: '#E8E6E6',
    borderRadius: 10,
    overflow: 'hidden',
    width: '100%',
  },
  cardHeader: {
    backgroundColor: '#C9C7C7',
    padding: 12,
    alignItems: 'center',
  },
  cardHeaderText: {
    fontWeight: '700',
    fontSize: 18,
  },
  cardBody: {
    padding: 18,
    minHeight: 150,
  },
  announcementItem: {
    marginBottom: 10,
  },
  announcementTitle: {
    fontWeight: '700',
    fontSize: 16,
  },
  announcementDescription: {
    color: '#555',
    fontSize: 14,
  },
  emptyText: {
    color: '#777',
    fontSize: 15,
  },
});