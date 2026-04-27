import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Timestamp } from 'firebase/firestore';
import {
  createEvent,
  createGardeningSlot,
  listEvents,
  listGardeningSlots,
  type CalendarEvent,
  type GardeningSlot,
} from '@/services/calendarService';
import { listBooking, updateBooking } from '@/services/roomBookingService';

// ─── Types ────────────────────────────────────────────────────────────────────

type BookingRow = {
  id: string;
  title: string;
  description?: string;
  site?: string;
  reservedSpot?: string;
  user?: string;
  approved?: boolean;
  checkIn?: Timestamp | { seconds?: number } | Date;
  checkOut?: Timestamp | { seconds?: number } | Date;
};

type Tab = 'events' | 'bookings' | 'gardening';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDate(val: unknown): Date {
  if (!val) return new Date(0);
  if (val instanceof Date) return val;
  if (val instanceof Timestamp) return val.toDate();
  if (typeof val === 'object' && val !== null && 'seconds' in val) {
    return new Date((val as { seconds: number }).seconds * 1000);
  }
  return new Date(0);
}

function fmtDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getDayOfMonth(date: Date): string {
  return date.getDate().toString();
}

function getMonthAbbr(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
}

// Parse "MM/DD/YYYY" into a Date
function parseInputDate(str: string): Date | null {
  const parts = str.trim().split('/');
  if (parts.length !== 3) return null;
  const [m, d, y] = parts.map(Number);
  if (isNaN(m) || isNaN(d) || isNaN(y)) return null;
  return new Date(y, m - 1, d);
}

// ─── Add Event Modal ──────────────────────────────────────────────────────────

function AddEventModal({ visible, onClose, onSaved }: { visible: boolean; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => { setTitle(''); setDescription(''); setLocation(''); setStartDate(''); setEndDate(''); };

  const save = async () => {
    if (!title.trim()) return Alert.alert('Required', 'Please enter a title.');
    const start = parseInputDate(startDate);
    const end = parseInputDate(endDate);
    if (!start) return Alert.alert('Invalid date', 'Enter start date as MM/DD/YYYY.');
    if (!end) return Alert.alert('Invalid date', 'Enter end date as MM/DD/YYYY.');
    if (end < start) return Alert.alert('Invalid date', 'End date must be after start date.');
    try {
      setSaving(true);
      await createEvent({
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        startDate: Timestamp.fromDate(start),
        endDate: Timestamp.fromDate(end),
      });
      reset();
      onSaved();
      onClose();
    } catch {
      Alert.alert('Error', 'Could not create event.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={modal.container}>
        <View style={modal.header}>
          <Text style={modal.title}>New Event</Text>
          <Pressable onPress={() => { reset(); onClose(); }}>
            <Ionicons name="close" size={24} color="#1A1A18" />
          </Pressable>
        </View>
        <ScrollView style={modal.body} keyboardShouldPersistTaps="handled">
          <Text style={modal.label}>Title *</Text>
          <TextInput style={modal.input} value={title} onChangeText={setTitle} placeholder="Community BBQ" placeholderTextColor="#C0BFB8" />
          <Text style={modal.label}>Description</Text>
          <TextInput style={[modal.input, modal.textarea]} value={description} onChangeText={setDescription} placeholder="Details about the event…" placeholderTextColor="#C0BFB8" multiline numberOfLines={3} />
          <Text style={modal.label}>Location</Text>
          <TextInput style={modal.input} value={location} onChangeText={setLocation} placeholder="Clubhouse, Pool, etc." placeholderTextColor="#C0BFB8" />
          <Text style={modal.label}>Start Date (MM/DD/YYYY) *</Text>
          <TextInput style={modal.input} value={startDate} onChangeText={setStartDate} placeholder="06/15/2025" placeholderTextColor="#C0BFB8" keyboardType="numbers-and-punctuation" />
          <Text style={modal.label}>End Date (MM/DD/YYYY) *</Text>
          <TextInput style={modal.input} value={endDate} onChangeText={setEndDate} placeholder="06/15/2025" placeholderTextColor="#C0BFB8" keyboardType="numbers-and-punctuation" />
        </ScrollView>
        <View style={modal.footer}>
          <Pressable style={[modal.saveBtn, saving && modal.disabled]} onPress={save} disabled={saving}>
            <Text style={modal.saveBtnText}>{saving ? 'Saving…' : 'Create Event'}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ─── Add Gardening Modal ──────────────────────────────────────────────────────

function AddGardeningModal({ visible, onClose, onSaved }: { visible: boolean; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [plot, setPlot] = useState('');
  const [date, setDate] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => { setTitle(''); setDescription(''); setPlot(''); setDate(''); };

  const save = async () => {
    if (!title.trim()) return Alert.alert('Required', 'Please enter a title.');
    const d = parseInputDate(date);
    if (!d) return Alert.alert('Invalid date', 'Enter date as MM/DD/YYYY.');
    try {
      setSaving(true);
      await createGardeningSlot({
        title: title.trim(),
        description: description.trim(),
        plot: plot.trim(),
        date: Timestamp.fromDate(d),
      });
      reset();
      onSaved();
      onClose();
    } catch {
      Alert.alert('Error', 'Could not create gardening slot.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={modal.container}>
        <View style={modal.header}>
          <Text style={modal.title}>New Gardening Session</Text>
          <Pressable onPress={() => { reset(); onClose(); }}>
            <Ionicons name="close" size={24} color="#1A1A18" />
          </Pressable>
        </View>
        <ScrollView style={modal.body} keyboardShouldPersistTaps="handled">
          <Text style={modal.label}>Title *</Text>
          <TextInput style={modal.input} value={title} onChangeText={setTitle} placeholder="Spring Planting Day" placeholderTextColor="#C0BFB8" />
          <Text style={modal.label}>Description</Text>
          <TextInput style={[modal.input, modal.textarea]} value={description} onChangeText={setDescription} placeholder="What's happening this session…" placeholderTextColor="#C0BFB8" multiline numberOfLines={3} />
          <Text style={modal.label}>Plot</Text>
          <TextInput style={modal.input} value={plot} onChangeText={setPlot} placeholder="Plot A3" placeholderTextColor="#C0BFB8" />
          <Text style={modal.label}>Date (MM/DD/YYYY) *</Text>
          <TextInput style={modal.input} value={date} onChangeText={setDate} placeholder="06/15/2025" placeholderTextColor="#C0BFB8" keyboardType="numbers-and-punctuation" />
        </ScrollView>
        <View style={modal.footer}>
          <Pressable style={[modal.saveBtn, saving && modal.disabled]} onPress={save} disabled={saving}>
            <Text style={modal.saveBtnText}>{saving ? 'Saving…' : 'Create Session'}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AdminCalendars() {
  const [tab, setTab] = useState<Tab>('events');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [gardeningSlots, setGardeningSlots] = useState<GardeningSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showGardeningModal, setShowGardeningModal] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [evts, bkgs, garden] = await Promise.all([
      listEvents(),
      listBooking() as Promise<BookingRow[]>,
      listGardeningSlots(),
    ]);
    setEvents(evts);
    setBookings(bkgs.sort((a, b) => toDate(a.checkIn).getTime() - toDate(b.checkIn).getTime()));
    setGardeningSlots(garden);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await load();
      } catch {
        Alert.alert('Error', 'Could not load calendar data.');
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await load();
    } catch {
      Alert.alert('Error', 'Could not refresh.');
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const toggleApproval = (booking: BookingRow) => {
    const next = !booking.approved;
    Alert.alert(
      next ? 'Approve booking?' : 'Mark as pending?',
      next ? 'This will approve the booking.' : 'This will set the booking back to pending.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: next ? 'Approve' : 'Mark pending',
          style: next ? 'default' : 'destructive',
          onPress: async () => {
            try {
              setActingId(booking.id);
              await updateBooking(booking.id, { approved: next });
              await load();
            } catch {
              Alert.alert('Error', 'Could not update booking.');
            } finally {
              setActingId(null);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator />
      </View>
    );
  }

  const addButton = (onPress: () => void) => (
    <Pressable style={styles.addBtn} onPress={onPress}>
      <Ionicons name="add" size={18} color="#fff" />
      <Text style={styles.addBtnText}>Add</Text>
    </Pressable>
  );

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Calendars</Text>
        <Text style={styles.subtitle}>Manage community schedule</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['events', 'bookings', 'gardening'] as const).map((t) => (
          <Pressable key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Events Tab */}
      {tab === 'events' && (
        <>
          <View style={styles.listHeader}>
            <Text style={styles.listCount}>{events.length} event{events.length !== 1 ? 's' : ''}</Text>
            {addButton(() => setShowEventModal(true))}
          </View>
          <FlatList
            data={events}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Ionicons name="calendar-outline" size={36} color="#C8C7C0" />
                <Text style={styles.empty}>No events yet. Tap Add to create one.</Text>
              </View>
            }
            renderItem={({ item }) => {
              const start = toDate(item.startDate);
              const end = toDate(item.endDate);
              return (
                <View style={styles.card}>
                  <View style={styles.dateBadge}>
                    <Text style={styles.dateBadgeDay}>{getDayOfMonth(start)}</Text>
                    <Text style={styles.dateBadgeMon}>{getMonthAbbr(start)}</Text>
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                    {!!item.description && <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>}
                    <View style={styles.metaRow}>
                      <Ionicons name="time-outline" size={11} color="#B4B2A9" />
                      <Text style={styles.meta}>{fmtDate(start)} → {fmtDate(end)}</Text>
                    </View>
                    {!!item.location && (
                      <View style={styles.metaRow}>
                        <Ionicons name="location-outline" size={11} color="#B4B2A9" />
                        <Text style={styles.meta}>{item.location}</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            }}
          />
          <AddEventModal visible={showEventModal} onClose={() => setShowEventModal(false)} onSaved={load} />
        </>
      )}

      {/* Bookings Tab */}
      {tab === 'bookings' && (
        <>
          <View style={styles.listHeader}>
            <Text style={styles.listCount}>{bookings.length} booking{bookings.length !== 1 ? 's' : ''}</Text>
            <Text style={styles.listNote}>Approve or pend below</Text>
          </View>
          <FlatList
            data={bookings}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Ionicons name="bed-outline" size={36} color="#C8C7C0" />
                <Text style={styles.empty}>No bookings yet.</Text>
              </View>
            }
            renderItem={({ item }) => {
              const checkIn = toDate(item.checkIn);
              const checkOut = toDate(item.checkOut);
              const busy = actingId === item.id;
              return (
                <View style={styles.card}>
                  <View style={styles.dateBadge}>
                    <Text style={styles.dateBadgeDay}>{getDayOfMonth(checkIn)}</Text>
                    <Text style={styles.dateBadgeMon}>{getMonthAbbr(checkIn)}</Text>
                  </View>
                  <View style={styles.cardBody}>
                    <View style={styles.rowTop}>
                      <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={[styles.badge, item.approved ? styles.badgeOk : styles.badgeWait]}>
                        {item.approved ? 'Approved' : 'Pending'}
                      </Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Ionicons name="location-outline" size={11} color="#B4B2A9" />
                      <Text style={styles.meta}>{item.site ?? '—'} · {item.reservedSpot ?? '—'}</Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Ionicons name="time-outline" size={11} color="#B4B2A9" />
                      <Text style={styles.meta}>{fmtDate(checkIn)} → {fmtDate(checkOut)}</Text>
                    </View>
                    {item.user && <Text style={styles.uid}>Resident: {item.user.slice(0, 8)}…</Text>}
                    <Pressable
                      style={[item.approved ? styles.pendingBtn : styles.approveBtn, busy && styles.btnDisabled]}
                      onPress={() => toggleApproval(item)}
                      disabled={busy}>
                      <Text style={item.approved ? styles.pendingBtnText : styles.approveBtnText}>
                        {busy ? 'Saving…' : item.approved ? 'Mark pending' : 'Approve'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            }}
          />
        </>
      )}

      {/* Gardening Tab */}
      {tab === 'gardening' && (
        <>
          <View style={styles.listHeader}>
            <Text style={styles.listCount}>{gardeningSlots.length} session{gardeningSlots.length !== 1 ? 's' : ''}</Text>
            {addButton(() => setShowGardeningModal(true))}
          </View>
          <FlatList
            data={gardeningSlots}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Ionicons name="leaf-outline" size={36} color="#C8C7C0" />
                <Text style={styles.empty}>No sessions yet. Tap Add to create one.</Text>
              </View>
            }
            renderItem={({ item }) => {
              const date = toDate(item.date);
              return (
                <View style={styles.card}>
                  <View style={[styles.dateBadge, styles.dateBadgeGreen]}>
                    <Text style={[styles.dateBadgeDay, styles.dateBadgeDayGreen]}>{getDayOfMonth(date)}</Text>
                    <Text style={[styles.dateBadgeMon, styles.dateBadgeMonGreen]}>{getMonthAbbr(date)}</Text>
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                    {!!item.description && <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>}
                    <View style={styles.metaRow}>
                      <Ionicons name="calendar-outline" size={11} color="#B4B2A9" />
                      <Text style={styles.meta}>{fmtDate(date)}</Text>
                    </View>
                    {!!item.plot && (
                      <View style={styles.metaRow}>
                        <Ionicons name="map-outline" size={11} color="#B4B2A9" />
                        <Text style={styles.meta}>{item.plot}</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            }}
          />
          <AddGardeningModal visible={showGardeningModal} onClose={() => setShowGardeningModal(false)} onSaved={load} />
        </>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8F8F6' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '600', color: '#1A1A18' },
  subtitle: { marginTop: 4, fontSize: 13, color: '#6A6964' },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: '#EDEDEA',
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: '#fff', borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)' },
  tabText: { fontSize: 13, color: '#888780' },
  tabTextActive: { color: '#1A1A18', fontWeight: '600' },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 8 },
  listCount: { fontSize: 13, color: '#6A6964' },
  listNote: { fontSize: 12, color: '#B4B2A9' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1A1A18', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  list: { paddingHorizontal: 20, paddingBottom: 32, gap: 10 },
  emptyWrap: { alignItems: 'center', marginTop: 60, gap: 10 },
  empty: { textAlign: 'center', color: '#8A8982', fontSize: 14 },
  card: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#ECEBE7', padding: 14, flexDirection: 'row', gap: 12 },
  dateBadge: { width: 44, height: 48, backgroundColor: '#F2F1ED', borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  dateBadgeGreen: { backgroundColor: '#EDF4EB' },
  dateBadgeDay: { fontSize: 18, fontWeight: '700', color: '#1A1A18', lineHeight: 20 },
  dateBadgeDayGreen: { color: '#205A30' },
  dateBadgeMon: { fontSize: 10, fontWeight: '600', color: '#6A6964', letterSpacing: 0.5 },
  dateBadgeMonGreen: { color: '#3A7D47' },
  cardBody: { flex: 1, gap: 4 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1A1A18' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, fontSize: 11, fontWeight: '600', overflow: 'hidden' },
  badgeWait: { backgroundColor: '#F9EFD9', color: '#825102' },
  badgeOk: { backgroundColor: '#E3F2DA', color: '#205A30' },
  desc: { fontSize: 13, color: '#605F59' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { fontSize: 12, color: '#8A8982' },
  uid: { fontSize: 11, color: '#B4B2A9' },
  approveBtn: { marginTop: 6, backgroundColor: '#1A1A18', borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  approveBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  pendingBtn: { marginTop: 6, borderWidth: 1, borderColor: '#D9D8D2', borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  pendingBtnText: { color: '#5D5C57', fontWeight: '600', fontSize: 13 },
  btnDisabled: { opacity: 0.6 },
});

const modal = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#ECEBE7' },
  title: { fontSize: 18, fontWeight: '600', color: '#1A1A18' },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  label: { fontSize: 13, fontWeight: '500', color: '#6A6964', marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ECEBE7', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1A1A18' },
  textarea: { height: 80, textAlignVertical: 'top' },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#ECEBE7' },
  saveBtn: { backgroundColor: '#1A1A18', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  disabled: { opacity: 0.6 },
});