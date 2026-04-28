import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  addBooking,
  deleteBooking,
  listUsersBookings,
  checkExactBookingConflict,
} from '@/services/roomBookingService';
import { listAllBookables, listTypesForBookable, type Bookable } from '@/services/bookableService';

// ── Types ────────────────────────────────────────────────────────────────────

type Booking = {
  id: string;
  title: string;
  reservedSpot: string;
  description: string;
  site: string;
  user: string;
  checkIn: any;
  checkOut: any;
  approved: boolean;
  type: string;
  timeSlot?: string;
  category: string;
  isCompleted: boolean;
  createdAt: any;
};

type TabKey = 'all' | 'pending' | 'approved';

const TIME_SLOTS = [
  'Morning (8AM – 12PM)',
  'Afternoon (12PM – 4PM)',
  'Evening (4PM – 8PM)',
  'Full Day (8AM – 8PM)',
] as const;

// ── Helpers ──────────────────────────────────────────────────────────────────

function toDate(val: any): Date {
  if (!val) return new Date();
  if (val instanceof Date) return val;
  if (val?.seconds) return new Date(val.seconds * 1000);
  return new Date(val);
}

function formatDate(val: any): string {
  const d = toDate(val);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Inline Dropdown ───────────────────────────────────────────────────────────

type DropdownProps = {
  placeholder: string;
  value: string;
  options: string[];
  onSelect: (v: string) => void;
};

function Dropdown({ placeholder, value, options, onSelect }: DropdownProps) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <Pressable style={styles.dropdownTrigger} onPress={() => setOpen((o) => !o)}>
        <Text style={value ? styles.dropdownValue : styles.dropdownPlaceholder}>
          {value || placeholder}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={14} color="#888780" />
      </Pressable>
      {open && (
        <View style={styles.dropdownList}>
          {options.length === 0 ? (
            <Text style={styles.dropdownEmpty}>No options available</Text>
          ) : (
            options.map((opt) => (
              <Pressable
                key={opt}
                style={[styles.dropdownOption, value === opt && styles.dropdownOptionActive]}
                onPress={() => { onSelect(opt); setOpen(false); }}>
                <Text style={[styles.dropdownOptionText, value === opt && styles.dropdownOptionTextActive]}>
                  {opt}
                </Text>
              </Pressable>
            ))
          )}
        </View>
      )}
    </View>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Bookables from Firebase
  const [bookables, setBookables] = useState<Bookable[]>([]);
  const [bookablesLoading, setBookablesLoading] = useState(true);
  const [bookablesError, setBookablesError] = useState<string | null>(null);

  // Types for the selected room
  const [types, setTypes] = useState<string[]>([]);
  const [typesLoading, setTypesLoading] = useState(false);

  // Form state
  const [fTitle, setFTitle]         = useState('');
  const [fRoom, setFRoom]           = useState('');
  const [fType, setFType]           = useState('');
  const [fTimeSlot, setFTimeSlot]   = useState('');
  const [fDesc, setFDesc]           = useState('');
  const [fCheckIn, setFCheckIn]     = useState('');
  const [fCheckOut, setFCheckOut]   = useState('');

  const roomOptions = [...new Set(bookables.map((b) => b.name))].sort();

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listUsersBookings();
      setBookings(data as Booking[]);
    } catch {
      Alert.alert('Error', 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
    setBookablesLoading(true);
    setBookablesError(null);
    listAllBookables()
      .then((data) => {
        setBookables(data);
        if (data.length === 0) setBookablesError('No rooms found in Firebase. Check Firestore collection names and rules.');
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setBookablesError(`Failed to load rooms: ${msg}`);
      })
      .finally(() => setBookablesLoading(false));
  }, [fetchBookings]);

  // ── Derived data ───────────────────────────────────────────────────────────

  const filtered = bookings.filter((b) => {
    if (activeTab === 'pending')  return !b.approved;
    if (activeTab === 'approved') return b.approved;
    return true;
  });

  const totalCount    = bookings.length;
  const approvedCount = bookings.filter((b) => b.approved).length;
  const pendingCount  = totalCount - approvedCount;

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleAdd = async () => {
    if (!fTitle.trim() || !fRoom || !fType || !fTimeSlot || !fCheckIn || !fCheckOut) {
      Alert.alert('Required', 'Please fill in Title, Room, Type, Time Slot, and both dates.');
      return;
    }
    const checkIn  = new Date(fCheckIn  + 'T12:00:00');
    const checkOut = new Date(fCheckOut + 'T12:00:00');
    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      Alert.alert('Invalid date', 'Enter dates as YYYY-MM-DD.');
      return;
    }
    if (checkOut <= checkIn) {
      Alert.alert('Invalid dates', 'Check-out must be after check-in.');
      return;
    }
    try {
      setSubmitting(true);
      let isDuplicate = false;
      try {
        isDuplicate = await checkExactBookingConflict(fRoom, checkIn, checkOut, fTimeSlot);
      } catch {
        // If the conflict check fails (e.g. Firestore rules), proceed anyway
      }
      if (isDuplicate) {
        Alert.alert(
          'Already booked',
          `"${fRoom}" is already booked for those exact dates. Please choose different dates or a different room.`,
        );
        return;
      }
      const selectedBookable = bookables.find((b) => b.name === fRoom);
      await addBooking({
        title:        fTitle.trim(),
        description:  fDesc.trim(),
        dueDate:      checkOut,
        category:     'general',
        reservedSpot: fRoom,
        site:         selectedBookable?.site ?? fRoom,
        user:         '',
        checkIn,
        checkOut,
        approved:     false,
        type:         fType,
        timeSlot:     fTimeSlot,
      });
      closeModal();
      fetchBookings();
    } catch {
      Alert.alert('Error', 'Failed to add booking.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete booking', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            setBookings((prev) => prev.filter((x) => x.id !== id));
            await deleteBooking(id);
          } catch {
            Alert.alert('Error', 'Failed to delete booking.');
            fetchBookings();
          }
        },
      },
    ]);
  };

  // ── Modal helpers ──────────────────────────────────────────────────────────

  const handleRoomSelect = async (roomName: string) => {
    setFRoom(roomName);
    setFType('');
    setTypes([]);
    const bookable = bookables.find((b) => b.name === roomName);
    if (!bookable) return;
    setTypesLoading(true);
    try {
      const typeList = await listTypesForBookable(bookable);
      setTypes(typeList);
    } catch {
      setTypes([]);
    } finally {
      setTypesLoading(false);
    }
  };

  const openModal = () => {
    setFTitle(''); setFRoom(''); setFType(''); setFTimeSlot(''); setFDesc('');
    setTypes([]);
    setFCheckIn(new Date().toISOString().slice(0, 10));
    setFCheckOut(new Date().toISOString().slice(0, 10));
    setModalVisible(true);
  };

  const closeModal = () => setModalVisible(false);

  // ── Render ─────────────────────────────────────────────────────────────────

  const renderBooking = ({ item: b }: { item: Booking }) => (
    <View style={styles.card}>
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Text style={styles.cardTitle} numberOfLines={2}>{b.title}</Text>
          <Text style={[styles.statusBadge, b.approved ? styles.statusApproved : styles.statusPending]}>
            {b.approved ? 'Approved' : 'Pending'}
          </Text>
        </View>
        {!!b.description && (
          <Text style={styles.cardDesc} numberOfLines={1}>{b.description}</Text>
        )}
        <View style={styles.cardMeta}>
          {!!b.reservedSpot && (
            <View style={styles.metaPill}>
              <Ionicons name="home-outline" size={11} color="#5F5E5A" />
              <Text style={styles.metaPillText}>{b.reservedSpot}</Text>
            </View>
          )}
          {!!b.type && (
            <View style={styles.metaPill}>
              <Ionicons name="pricetag-outline" size={11} color="#5F5E5A" />
              <Text style={styles.metaPillText}>{b.type}</Text>
            </View>
          )}
          {!!b.timeSlot && (
            <View style={styles.metaPill}>
              <Ionicons name="time-outline" size={11} color="#5F5E5A" />
              <Text style={styles.metaPillText}>{b.timeSlot}</Text>
            </View>
          )}
        </View>
        <Text style={styles.dueText}>{formatDate(b.checkIn)} → {formatDate(b.checkOut)}</Text>
      </View>

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => handleDelete(b.id)}
        accessibilityLabel="Delete booking">
        <Text style={styles.deleteBtnText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.pageTitle}>Bookings</Text>
          <Text style={styles.pageSubtitle}>
            {pendingCount} pending · {approvedCount} approved
          </Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openModal}>
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        {[
          { label: 'Total',    value: totalCount },
          { label: 'Pending',  value: pendingCount },
          { label: 'Approved', value: approvedCount },
        ].map((s) => (
          <View key={s.label} style={styles.statCard}>
            <Text style={styles.statLabel}>{s.label}</Text>
            <Text style={styles.statValue}>{s.value}</Text>
          </View>
        ))}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['all', 'pending', 'approved'] as TabKey[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(b) => b.id}
          renderItem={renderBooking}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No bookings here</Text>}
        />
      )}

      {/* Add Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeModal}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>New booking</Text>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.modalScroll}>
              <Text style={styles.fieldLabel}>Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="Booking title"
                value={fTitle}
                onChangeText={setFTitle}
              />

              {bookablesError && (
                <Text style={styles.bookablesError}>{bookablesError}</Text>
              )}

              <Text style={styles.fieldLabel}>Room *</Text>
              {bookablesLoading ? (
                <ActivityIndicator style={{ marginVertical: 10 }} />
              ) : (
                <Dropdown
                  placeholder="Select a room"
                  value={fRoom}
                  options={roomOptions}
                  onSelect={handleRoomSelect}
                />
              )}

              <Text style={styles.fieldLabel}>Type *</Text>
              {typesLoading ? (
                <ActivityIndicator style={{ marginVertical: 10 }} />
              ) : (
                <Dropdown
                  placeholder={fRoom ? 'Select a type' : 'Select a room first'}
                  value={fType}
                  options={types}
                  onSelect={setFType}
                />
              )}

              <Text style={styles.fieldLabel}>Time Slot *</Text>
              <Dropdown
                placeholder="Select a time slot"
                value={fTimeSlot}
                options={[...TIME_SLOTS]}
                onSelect={setFTimeSlot}
              />

              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.inputMulti]}
                placeholder="Optional notes"
                value={fDesc}
                onChangeText={setFDesc}
                multiline
              />

              <Text style={styles.fieldLabel}>Check-in (YYYY-MM-DD) *</Text>
              <TextInput
                style={styles.input}
                placeholder="2025-12-01"
                value={fCheckIn}
                onChangeText={setFCheckIn}
              />

              <Text style={styles.fieldLabel}>Check-out (YYYY-MM-DD) *</Text>
              <TextInput
                style={styles.input}
                placeholder="2025-12-05"
                value={fCheckOut}
                onChangeText={setFCheckOut}
              />

              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.cancelBtn} onPress={closeModal} disabled={submitting}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveBtn, submitting && styles.saveBtnDisabled]} onPress={handleAdd} disabled={submitting}>
                  <Text style={styles.saveBtnText}>{submitting ? 'Checking…' : 'Save booking'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: '#F8F8F6' },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, paddingBottom: 12 },
  pageTitle:    { fontSize: 22, fontWeight: '600', color: '#1A1A18' },
  pageSubtitle: { fontSize: 13, color: '#888780', marginTop: 2 },
  addBtn:       { backgroundColor: '#1A1A18', paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10 },
  addBtnText:   { color: '#fff', fontSize: 13, fontWeight: '600' },

  stats:     { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 14 },
  statCard:  { flex: 1, backgroundColor: '#EDEDEA', borderRadius: 10, padding: 12 },
  statLabel: { fontSize: 12, color: '#888780', marginBottom: 3 },
  statValue: { fontSize: 22, fontWeight: '600', color: '#1A1A18' },

  tabs:          { flexDirection: 'row', marginHorizontal: 20, backgroundColor: '#EDEDEA', borderRadius: 10, padding: 3, marginBottom: 14 },
  tab:           { flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: 'center' },
  tabActive:     { backgroundColor: '#fff', borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.1)' },
  tabText:       { fontSize: 13, color: '#888780' },
  tabTextActive: { color: '#1A1A18', fontWeight: '500' },

  list:  { paddingHorizontal: 20, paddingBottom: 32, gap: 8 },
  empty: { textAlign: 'center', color: '#888780', fontSize: 14, marginTop: 48 },

  card:       { backgroundColor: '#fff', borderRadius: 12, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)', padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardBody:   { flex: 1, gap: 4 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  cardTitle:  { flex: 1, fontSize: 14, fontWeight: '500', color: '#1A1A18' },
  statusBadge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, fontSize: 11, fontWeight: '600', overflow: 'hidden' },
  statusApproved: { backgroundColor: '#E3F2DA', color: '#205A30' },
  statusPending:  { backgroundColor: '#F9EFD9', color: '#825102' },
  cardDesc:   { fontSize: 13, color: '#888780' },
  cardMeta:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  metaPill:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EDEDEA', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  metaPillText: { fontSize: 12, color: '#5F5E5A' },
  dueText:    { fontSize: 12, color: '#B4B2A9' },
  deleteBtn:     { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  deleteBtnText: { fontSize: 13, color: '#B4B2A9' },

  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  modal:      { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '90%' },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#1A1A18', marginBottom: 16 },
  fieldLabel: { fontSize: 13, color: '#888780', marginBottom: 5, marginTop: 10 },
  input:      { borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.15)', borderRadius: 10, padding: 10, fontSize: 14, color: '#1A1A18', backgroundColor: '#FAFAF8' },
  inputMulti: { minHeight: 72, textAlignVertical: 'top' },

  dropdownTrigger:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.15)', borderRadius: 10, padding: 10, backgroundColor: '#FAFAF8' },
  dropdownValue:        { fontSize: 14, color: '#1A1A18' },
  dropdownPlaceholder:  { fontSize: 14, color: '#B4B2A9' },
  dropdownList:         { borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.1)', borderRadius: 10, backgroundColor: '#fff', marginTop: 4, overflow: 'hidden' },
  dropdownOption:       { paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)' },
  dropdownOptionActive: { backgroundColor: '#EDEDEA' },
  dropdownOptionText:   { fontSize: 14, color: '#1A1A18' },
  dropdownOptionTextActive: { fontWeight: '600' },
  dropdownEmpty:        { paddingHorizontal: 14, paddingVertical: 11, fontSize: 13, color: '#B4B2A9' },

  modalFooter:     { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn:       { flex: 1, padding: 13, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.15)', borderRadius: 10, alignItems: 'center' },
  cancelBtnText:   { fontSize: 14, color: '#5F5E5A' },
  saveBtn:         { flex: 2, padding: 13, backgroundColor: '#1A1A18', borderRadius: 10, alignItems: 'center' },
  saveBtnText:     { fontSize: 14, color: '#fff', fontWeight: '600' },
  saveBtnDisabled: { opacity: 0.6 },
  bookablesError: { fontSize: 12, color: '#b91c1c', backgroundColor: '#fef2f2', borderRadius: 8, padding: 10, marginBottom: 4 },
  modalScroll: { paddingBottom: 8 },
});
