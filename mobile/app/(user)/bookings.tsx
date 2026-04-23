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
} from 'react-native';
import {
  addBooking,
  updateBooking,
  deleteBooking,
  listUsersBookings,
  checkBookingConflicts,
  BookingInput,
} from '@/services/roomBookingService';

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
  category: string;
  isCompleted: boolean;
  createdAt: any;
};

type TabKey = 'all' | 'pending' | 'done';

const CATEGORIES = ['general', 'work', 'personal', 'health', 'travel'] as const;

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  general: { bg: '#E6F1FB', text: '#185FA5' },
  work:    { bg: '#EAF3DE', text: '#3B6D11' },
  personal:{ bg: '#EEEDFE', text: '#534AB7' },
  health:  { bg: '#E1F5EE', text: '#0F6E56' },
  travel:  { bg: '#FAEEDA', text: '#854F0B' },
};

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

// ── Main Component ────────────────────────────────────────────────────────────

export default function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [modalVisible, setModalVisible] = useState(false);

  // Form state
  const [fTitle, setFTitle]       = useState('');
  const [fSpot, setFSpot]         = useState('');
  const [fDesc, setFDesc]         = useState('');
  const [fSite, setFSite]         = useState('');
  const [fType, setFType]         = useState('');
  const [fCheckIn, setFCheckIn]   = useState('');
  const [fCheckOut, setFCheckOut] = useState('');
  const [fCategory, setFCategory] = useState<string>('general');

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listUsersBookings();
      setBookings(data as Booking[]);
    } catch (e) {
      Alert.alert('Error', 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  // ── Derived data ───────────────────────────────────────────────────────────

  const filtered = bookings.filter(b => {
    if (activeTab === 'pending') return !b.approved;
    if (activeTab === 'done')    return b.approved;
    return true;
  });

  const totalCount   = bookings.length;
  const doneCount    = bookings.filter(b => b.approved).length;
  const pendingCount = totalCount - doneCount;

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleAdd = async () => {
    if (!fTitle.trim() || !fSpot.trim() || !fSite.trim() || !fCheckIn || !fCheckOut) {
      Alert.alert('Required', 'Please fill in title, spot, site, check-in and check-out.');
      return;
    }
    const checkIn  = new Date(fCheckIn  + 'T12:00:00');
    const checkOut = new Date(fCheckOut + 'T12:00:00');
    if (checkOut <= checkIn) {
      Alert.alert('Invalid dates', 'Check-out must be after check-in.');
      return;
    }
    try {
      const proposed: BookingInput = {
        reservedSpot: fSpot.trim(),
        description:  fDesc.trim(),
        site:         fSite.trim(),
        user:         '',   // filled server-side via requireSignedInUid
        checkIn,
        checkOut,
        approved:     false,
        type:         fType.trim(),
      };
      const conflicts = await checkBookingConflicts(proposed);
      if (conflicts.length > 0) {
        Alert.alert('Conflict', 'This spot is already booked for the selected dates.');
        return;
      }
      await addBooking({
        title:        fTitle.trim(),
        description:  fDesc.trim(),
        dueDate:      checkOut,
        category:     fCategory,
        reservedSpot: fSpot.trim(),
        site:         fSite.trim(),
        user:         '',
        checkIn,
        checkOut,
        approved:     false,
        type:         fType.trim(),
      });
      closeModal();
      fetchBookings();
    } catch (e) {
      Alert.alert('Error', 'Failed to add booking.');
    }
  };

  const handleToggle = async (b: Booking) => {
    try {
      setBookings(prev =>
        prev.map(x => x.id === b.id ? { ...x, approved: !x.approved } : x)
      );
      await updateBooking(b.id, { approved: !b.approved });
    } catch (e) {
      Alert.alert('Error', 'Failed to update booking.');
      fetchBookings();
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete booking', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            setBookings(prev => prev.filter(x => x.id !== id));
            await deleteBooking(id);
          } catch (e) {
            Alert.alert('Error', 'Failed to delete booking.');
            fetchBookings();
          }
        },
      },
    ]);
  };

  // ── Modal helpers ──────────────────────────────────────────────────────────

  const openModal = () => {
    setFTitle(''); setFSpot(''); setFDesc(''); setFSite(''); setFType('');
    setFCheckIn(new Date().toISOString().slice(0, 10));
    setFCheckOut(new Date().toISOString().slice(0, 10));
    setFCategory('general');
    setModalVisible(true);
  };

  const closeModal = () => setModalVisible(false);

  // ── Render ─────────────────────────────────────────────────────────────────

  const renderBooking = ({ item: b }: { item: Booking }) => {
    const catColor = CATEGORY_COLORS[b.category || 'general'] ?? CATEGORY_COLORS.general;

    return (
      <View style={[styles.card, b.approved && styles.cardDone]}>
        {/* Approve toggle */}
        <TouchableOpacity
          style={[styles.checkBtn, b.approved && styles.checkBtnDone]}
          onPress={() => handleToggle(b)}
          accessibilityLabel={b.approved ? 'Mark unapproved' : 'Mark approved'}
        >
          {b.approved && <Text style={styles.checkMark}>✓</Text>}
        </TouchableOpacity>

        {/* Content */}
        <View style={styles.cardBody}>
          <Text style={[styles.cardTitle, b.approved && styles.cardTitleDone]}>
            {b.title}
          </Text>
          {!!b.description && (
            <Text style={styles.cardDesc} numberOfLines={1}>{b.description}</Text>
          )}
          <View style={styles.cardMeta}>
            <View style={[styles.badge, { backgroundColor: catColor.bg }]}>
              <Text style={[styles.badgeText, { color: catColor.text }]}>{b.category}</Text>
            </View>
            {!!b.reservedSpot && (
              <View style={styles.spotBadge}>
                <Text style={styles.spotText}>{b.reservedSpot}</Text>
              </View>
            )}
            <Text style={styles.dueText}>
              {formatDate(b.checkIn)} → {formatDate(b.checkOut)}
            </Text>
          </View>
        </View>

        {/* Delete */}
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleDelete(b.id)}
          accessibilityLabel="Delete booking"
        >
          <Text style={styles.deleteBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.pageTitle}>Bookings</Text>
          <Text style={styles.pageSubtitle}>
            {pendingCount} pending · {doneCount} approved
          </Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openModal}>
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        {[
          { label: 'Total',     value: totalCount },
          { label: 'Pending',   value: pendingCount },
          { label: 'Approved',  value: doneCount },
        ].map(s => (
          <View key={s.label} style={styles.statCard}>
            <Text style={styles.statLabel}>{s.label}</Text>
            <Text style={styles.statValue}>{s.value}</Text>
          </View>
        ))}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['all', 'pending', 'done'] as TabKey[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
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
          keyExtractor={b => b.id}
          renderItem={renderBooking}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>No bookings here</Text>
          }
        />
      )}

      {/* Add Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeModal}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>New booking</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Title *</Text>
              <TextInput style={styles.input} placeholder="Booking title" value={fTitle} onChangeText={setFTitle} />

              <Text style={styles.fieldLabel}>Reserved spot *</Text>
              <TextInput style={styles.input} placeholder="e.g. Room 3A, Desk 12" value={fSpot} onChangeText={setFSpot} />

              <Text style={styles.fieldLabel}>Site *</Text>
              <TextInput style={styles.input} placeholder="e.g. Main Office, Campus B" value={fSite} onChangeText={setFSite} />

              <Text style={styles.fieldLabel}>Type</Text>
              <TextInput style={styles.input} placeholder="e.g. desk, room, equipment" value={fType} onChangeText={setFType} />

              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput style={[styles.input, styles.inputMulti]} placeholder="Optional notes" value={fDesc} onChangeText={setFDesc} multiline />

              <Text style={styles.fieldLabel}>Check-in (YYYY-MM-DD) *</Text>
              <TextInput style={styles.input} placeholder="2025-12-01" value={fCheckIn} onChangeText={setFCheckIn} />

              <Text style={styles.fieldLabel}>Check-out (YYYY-MM-DD) *</Text>
              <TextInput style={styles.input} placeholder="2025-12-05" value={fCheckOut} onChangeText={setFCheckOut} />

              <Text style={styles.fieldLabel}>Category</Text>
              <View style={styles.catRow}>
                {CATEGORIES.map(cat => {
                  const c = CATEGORY_COLORS[cat];
                  const active = fCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.catChip, { backgroundColor: active ? c.bg : 'transparent' }, active && { borderColor: c.text }]}
                      onPress={() => setFCategory(cat)}
                    >
                      <Text style={[styles.catChipText, { color: active ? c.text : '#888' }]}>{cat}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
                <Text style={styles.saveBtnText}>Save booking</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen:          { flex: 1, backgroundColor: '#F8F8F6' },
  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, paddingBottom: 12 },
  pageTitle:       { fontSize: 22, fontWeight: '600', color: '#1A1A18' },
  pageSubtitle:    { fontSize: 13, color: '#888780', marginTop: 2 },
  addBtn:          { backgroundColor: '#1A1A18', paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10 },
  addBtnText:      { color: '#fff', fontSize: 13, fontWeight: '600' },

  stats:           { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 14 },
  statCard:        { flex: 1, backgroundColor: '#EDEDEA', borderRadius: 10, padding: 12 },
  statLabel:       { fontSize: 12, color: '#888780', marginBottom: 3 },
  statValue:       { fontSize: 22, fontWeight: '600', color: '#1A1A18' },

  tabs:            { flexDirection: 'row', marginHorizontal: 20, backgroundColor: '#EDEDEA', borderRadius: 10, padding: 3, marginBottom: 14 },
  tab:             { flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: 'center' },
  tabActive:       { backgroundColor: '#fff', borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.1)' },
  tabText:         { fontSize: 13, color: '#888780' },
  tabTextActive:   { color: '#1A1A18', fontWeight: '500' },

  list:            { paddingHorizontal: 20, paddingBottom: 32, gap: 8 },
  empty:           { textAlign: 'center', color: '#888780', fontSize: 14, marginTop: 48 },

  card:            { backgroundColor: '#fff', borderRadius: 12, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)', padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cardDone:        { opacity: 0.55 },
  checkBtn:        { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.2)', marginTop: 1, alignItems: 'center', justifyContent: 'center' },
  checkBtnDone:    { backgroundColor: '#D4F0E4', borderColor: '#0F6E56' },
  checkMark:       { fontSize: 12, color: '#0F6E56', fontWeight: '700' },
  cardBody:        { flex: 1 },
  cardTitle:       { fontSize: 14, fontWeight: '500', color: '#1A1A18', marginBottom: 2 },
  cardTitleDone:   { textDecorationLine: 'line-through' },
  cardDesc:        { fontSize: 13, color: '#888780', marginBottom: 6 },
  cardMeta:        { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  badge:           { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText:       { fontSize: 11 },
  spotBadge:       { backgroundColor: '#EDEDEA', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  spotText:        { fontSize: 12, color: '#5F5E5A' },
  dueText:         { fontSize: 12, color: '#B4B2A9' },
  dueOverdue:      { color: '#D85A30' },
  deleteBtn:       { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  deleteBtnText:   { fontSize: 13, color: '#B4B2A9' },

  overlay:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  modal:           { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '90%' },
  modalTitle:      { fontSize: 17, fontWeight: '600', color: '#1A1A18', marginBottom: 20 },
  fieldLabel:      { fontSize: 13, color: '#888780', marginBottom: 5, marginTop: 10 },
  input:           { borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.15)', borderRadius: 10, padding: 10, fontSize: 14, color: '#1A1A18', backgroundColor: '#FAFAF8' },
  inputMulti:      { minHeight: 72, textAlignVertical: 'top' },
  catRow:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  catChip:         { borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  catChipText:     { fontSize: 12 },
  modalFooter:     { flexDirection: 'row', gap: 10, marginTop: 24 },
  cancelBtn:       { flex: 1, padding: 13, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.15)', borderRadius: 10, alignItems: 'center' },
  cancelBtnText:   { fontSize: 14, color: '#5F5E5A' },
  saveBtn:         { flex: 2, padding: 13, backgroundColor: '#1A1A18', borderRadius: 10, alignItems: 'center' },
  saveBtnText:     { fontSize: 14, color: '#fff', fontWeight: '600' },
});