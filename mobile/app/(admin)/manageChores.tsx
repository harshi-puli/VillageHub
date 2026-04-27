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
  addChore,
  assignChore,
  deleteChore,
  listAllChores,
  listResidentsBySite,
  rotateChores,
  unassignChore,
  updateChore,
  type ChoreInput,
} from '@/services/choreService';

// ─── Types ────────────────────────────────────────────────────────────────────

type ChoreRow = {
  id: string;
  title: string;
  description?: string;
  assignedTo?: string | null;
  assignedName?: string | null;
  site?: string;
  dueDate?: Timestamp | { seconds?: number } | Date;
  isCompleted?: boolean;
};

type Resident = {
  uid: string;
  name: string;
  email: string;
  unitNumber: string;
  site: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDate(val: ChoreRow['dueDate']): Date {
  if (!val) return new Date(0);
  if (val instanceof Date) return val;
  if (val instanceof Timestamp) return val.toDate();
  if (typeof val === 'object' && 'seconds' in val && typeof val.seconds === 'number') {
    return new Date(val.seconds * 1000);
  }
  return new Date(0);
}

function parseInputDate(str: string): Date | null {
  const parts = str.trim().split('/');
  if (parts.length !== 3) return null;
  const [m, d, y] = parts.map(Number);
  if (isNaN(m) || isNaN(d) || isNaN(y)) return null;
  return new Date(y, m - 1, d);
}

function fmtDate(date: Date): string {
  if (date.getTime() === 0) return '—';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function dateToInput(val: ChoreRow['dueDate']): string {
  const d = toDate(val);
  if (d.getTime() === 0) return '';
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${m}/${day}/${d.getFullYear()}`;
}

// ─── Chore Form Modal ─────────────────────────────────────────────────────────

function ChoreFormModal({
  visible, onClose, onSaved, editing,
}: {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  editing?: ChoreRow | null;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [site, setSite] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setTitle(editing.title ?? '');
      setDescription(editing.description ?? '');
      setSite(editing.site ?? '');
      setDueDate(dateToInput(editing.dueDate));
    } else {
      setTitle(''); setDescription(''); setSite(''); setDueDate('');
    }
  }, [editing, visible]);

  const save = async () => {
    if (!title.trim()) return Alert.alert('Required', 'Please enter a title.');
    if (!site.trim()) return Alert.alert('Required', 'Please enter a site.');
    const parsedDate = parseInputDate(dueDate);
    if (!parsedDate) return Alert.alert('Invalid date', 'Enter due date as MM/DD/YYYY.');
    try {
      setSaving(true);
      if (editing) {
        await updateChore(editing.id, {
          title: title.trim(),
          description: description.trim(),
          site: site.trim(),
          dueDate: parsedDate,
        });
      } else {
        const input: ChoreInput = {
          title: title.trim(),
          description: description.trim(),
          site: site.trim(),
          dueDate: parsedDate,
        };
        await addChore(input);
      }
      onSaved();
      onClose();
    } catch {
      Alert.alert('Error', 'Could not save chore.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={modal.container}>
        <View style={modal.header}>
          <Text style={modal.title}>{editing ? 'Edit Chore' : 'New Chore'}</Text>
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={24} color="#1A1A18" />
          </Pressable>
        </View>
        <ScrollView style={modal.body} keyboardShouldPersistTaps="handled">
          <Text style={modal.label}>Title *</Text>
          <TextInput style={modal.input} value={title} onChangeText={setTitle} placeholder="Clean common area" placeholderTextColor="#C0BFB8" />

          <Text style={modal.label}>Description</Text>
          <TextInput style={[modal.input, modal.textarea]} value={description} onChangeText={setDescription} placeholder="Details about this chore…" placeholderTextColor="#C0BFB8" multiline numberOfLines={3} />

          <Text style={modal.label}>Site *</Text>
          <TextInput style={modal.input} value={site} onChangeText={setSite} placeholder="Building A, Pool, etc." placeholderTextColor="#C0BFB8" />

          <Text style={modal.label}>Due Date (MM/DD/YYYY) *</Text>
          <TextInput style={modal.input} value={dueDate} onChangeText={setDueDate} placeholder="06/15/2025" placeholderTextColor="#C0BFB8" keyboardType="numbers-and-punctuation" />
        </ScrollView>
        <View style={modal.footer}>
          <Pressable style={[modal.saveBtn, saving && modal.disabled]} onPress={save} disabled={saving}>
            <Text style={modal.saveBtnText}>{saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Chore'}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ─── Assign Picker Modal ──────────────────────────────────────────────────────

function AssignModal({
  visible, onClose, onAssigned, chore,
}: {
  visible: boolean;
  onClose: () => void;
  onAssigned: () => void;
  chore: ChoreRow | null;
}) {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !chore?.site) return;
    (async () => {
      try {
        setLoading(true);
        const data = await listResidentsBySite(chore.site!);
        setResidents(data);
      } catch {
        Alert.alert('Error', 'Could not load residents.');
      } finally {
        setLoading(false);
      }
    })();
  }, [visible, chore?.site]);

  const assign = async (resident: Resident) => {
    if (!chore) return;
    try {
      setActingId(resident.uid);
      await assignChore(chore.id, resident.uid, resident.name);
      onAssigned();
      onClose();
    } catch {
      Alert.alert('Error', 'Could not assign chore.');
    } finally {
      setActingId(null);
    }
  };

  const unassign = async () => {
    if (!chore) return;
    try {
      setActingId('unassign');
      await unassignChore(chore.id);
      onAssigned();
      onClose();
    } catch {
      Alert.alert('Error', 'Could not unassign chore.');
    } finally {
      setActingId(null);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={modal.container}>
        <View style={modal.header}>
          <View style={{ flex: 1 }}>
            <Text style={modal.title}>Assign Resident</Text>
            {!!chore?.site && (
              <Text style={{ fontSize: 12, color: '#6A6964', marginTop: 2 }}>
                Showing residents at {chore.site}
              </Text>
            )}
          </View>
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={24} color="#1A1A18" />
          </Pressable>
        </View>

        {loading ? (
          <View style={assign_.centered}>
            <ActivityIndicator />
          </View>
        ) : (
          <ScrollView style={modal.body}>
            {/* Unassign option if already assigned */}
            {!!chore?.assignedTo && (
              <Pressable
                style={assign_.unassignBtn}
                onPress={unassign}
                disabled={actingId === 'unassign'}>
                <Ionicons name="person-remove-outline" size={16} color="#b91c1c" />
                <Text style={assign_.unassignText}>
                  {actingId === 'unassign' ? 'Removing…' : 'Remove current assignment'}
                </Text>
              </Pressable>
            )}

            {residents.length === 0 ? (
              <View style={assign_.emptyWrap}>
                <Ionicons name="people-outline" size={36} color="#C8C7C0" />
                <Text style={assign_.empty}>No residents found for {chore?.site}.</Text>
              </View>
            ) : (
              residents.map((r) => {
                const isCurrentlyAssigned = chore?.assignedTo === r.uid;
                const busy = actingId === r.uid;
                return (
                  <Pressable
                    key={r.uid}
                    style={[assign_.card, isCurrentlyAssigned && assign_.cardActive]}
                    onPress={() => assign(r)}
                    disabled={!!actingId}>
                    <View style={assign_.cardLeft}>
                      <View style={assign_.avatar}>
                        <Text style={assign_.avatarText}>
                          {r.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View>
                        <Text style={assign_.name}>{r.name}</Text>
                        <Text style={assign_.meta}>Unit {r.unitNumber} · {r.email}</Text>
                      </View>
                    </View>
                    {isCurrentlyAssigned && (
                      <Ionicons name="checkmark-circle" size={20} color="#205A30" />
                    )}
                    {busy && !isCurrentlyAssigned && <ActivityIndicator size="small" />}
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

// ─── Rotate Modal ─────────────────────────────────────────────────────────────

function RotateModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [submitting, setSubmitting] = useState(false);

  const handleRotate = async () => {
    try {
      setSubmitting(true);
      await rotateChores();
      onClose();
      Alert.alert('Done', 'Chore rotation was recorded for the current week.');
    } catch {
      Alert.alert('Error', 'Unable to rotate chores.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.rotateModal}>
          <Text style={styles.rotateModalTitle}>Rotate chores now?</Text>
          <Text style={styles.rotateModalText}>This runs the admin rotation for the current week.</Text>
          <View style={styles.rotateModalFooter}>
            <Pressable style={styles.cancelBtn} onPress={onClose} disabled={submitting}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.confirmBtn} onPress={handleRotate} disabled={submitting}>
              <Text style={styles.confirmText}>{submitting ? 'Running…' : 'Rotate'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ManageChores() {
  const [chores, setChores] = useState<ChoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showRotate, setShowRotate] = useState(false);
  const [editingChore, setEditingChore] = useState<ChoreRow | null>(null);
  const [assigningChore, setAssigningChore] = useState<ChoreRow | null>(null);

  const load = useCallback(async () => {
    const data = await listAllChores();
    setChores(data as ChoreRow[]);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await load();
      } catch {
        Alert.alert('Error', 'Could not load chores.');
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

  const confirmDelete = (chore: ChoreRow) => {
    Alert.alert('Delete chore?', `"${chore.title}" will be permanently removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteChore(chore.id);
            await load();
          } catch {
            Alert.alert('Error', 'Could not delete chore.');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator />
      </View>
    );
  }

  const pending = chores.filter((c) => !c.isCompleted).length;
  const done = chores.filter((c) => c.isCompleted).length;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Manage chores</Text>
        <Text style={styles.subtitle}>{pending} pending · {done} completed</Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.addBtn} onPress={() => { setEditingChore(null); setShowForm(true); }}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.addBtnText}>Add chore</Text>
        </Pressable>
        <Pressable style={styles.rotateBtn} onPress={() => setShowRotate(true)}>
          <Ionicons name="refresh-outline" size={16} color="#1A1A18" />
          <Text style={styles.rotateBtnText}>Rotate</Text>
        </Pressable>
      </View>

      <FlatList
        data={chores}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="checkmark-circle-outline" size={36} color="#C8C7C0" />
            <Text style={styles.empty}>No chores yet. Tap Add chore to create one.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.cardLeft}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                {!!item.description && (
                  <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
                )}
                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={11} color="#B4B2A9" />
                  <Text style={styles.meta}>{item.site ?? '—'}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Ionicons name="calendar-outline" size={11} color="#B4B2A9" />
                  <Text style={styles.meta}>Due {fmtDate(toDate(item.dueDate))}</Text>
                </View>

                {/* Assignee row */}
                <Pressable
                  style={styles.assignRow}
                  onPress={() => setAssigningChore(item)}>
                  <Ionicons
                    name={item.assignedTo ? 'person-circle-outline' : 'person-add-outline'}
                    size={13}
                    color={item.assignedTo ? '#205A30' : '#2595eb'}
                  />
                  <Text style={[styles.assignText, item.assignedTo ? styles.assignedText : styles.unassignedText]}>
                    {item.assignedName ?? (item.assignedTo ? item.assignedTo.slice(0, 10) + '…' : 'Assign resident')}
                  </Text>
                  <Ionicons name="chevron-forward" size={11} color="#B4B2A9" />
                </Pressable>
              </View>

              <View style={styles.cardRight}>
                <Text style={[styles.badge, item.isCompleted ? styles.badgeDone : styles.badgePending]}>
                  {item.isCompleted ? 'Done' : 'Pending'}
                </Text>
                <Pressable style={styles.iconBtn} onPress={() => { setEditingChore(item); setShowForm(true); }}>
                  <Ionicons name="pencil-outline" size={16} color="#6A6964" />
                </Pressable>
                <Pressable style={styles.iconBtn} onPress={() => confirmDelete(item)}>
                  <Ionicons name="trash-outline" size={16} color="#b91c1c" />
                </Pressable>
              </View>
            </View>
          </View>
        )}
      />

      <ChoreFormModal
        visible={showForm}
        onClose={() => setShowForm(false)}
        onSaved={load}
        editing={editingChore}
      />
      <AssignModal
        visible={!!assigningChore}
        onClose={() => setAssigningChore(null)}
        onAssigned={load}
        chore={assigningChore}
      />
      <RotateModal visible={showRotate} onClose={() => setShowRotate(false)} />
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
  actions: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 10 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1A1A18', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20 },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  rotateBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#D9D8D2', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20 },
  rotateBtnText: { color: '#1A1A18', fontSize: 13, fontWeight: '600' },
  list: { paddingHorizontal: 20, paddingBottom: 32, gap: 10 },
  emptyWrap: { alignItems: 'center', marginTop: 60, gap: 10 },
  empty: { textAlign: 'center', color: '#8A8982', fontSize: 14 },
  card: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#ECEBE7', padding: 14 },
  cardTop: { flexDirection: 'row', gap: 10 },
  cardLeft: { flex: 1, gap: 5 },
  cardRight: { alignItems: 'flex-end', gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#1A1A18' },
  desc: { fontSize: 13, color: '#605F59' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { fontSize: 12, color: '#8A8982' },
  assignRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  assignText: { fontSize: 12, fontWeight: '500', flex: 1 },
  assignedText: { color: '#205A30' },
  unassignedText: { color: '#2595eb' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, fontSize: 11, fontWeight: '600', overflow: 'hidden' },
  badgePending: { backgroundColor: '#F9EFD9', color: '#825102' },
  badgeDone: { backgroundColor: '#E3F2DA', color: '#205A30' },
  iconBtn: { padding: 4 },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.32)', padding: 20 },
  rotateModal: { width: '100%', borderRadius: 14, backgroundColor: '#fff', padding: 18, gap: 10 },
  rotateModalTitle: { fontSize: 17, fontWeight: '600', color: '#1A1A18' },
  rotateModalText: { color: '#676660' },
  rotateModalFooter: { flexDirection: 'row', gap: 10, marginTop: 6 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: '#D9D8D2', borderRadius: 10, alignItems: 'center', paddingVertical: 10 },
  cancelText: { color: '#5D5C57' },
  confirmBtn: { flex: 1, backgroundColor: '#1A1A18', borderRadius: 10, alignItems: 'center', paddingVertical: 10 },
  confirmText: { color: '#fff', fontWeight: '600' },
});

const modal = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#ECEBE7' },
  title: { fontSize: 18, fontWeight: '600', color: '#1A1A18' },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 4 },
  label: { fontSize: 13, fontWeight: '500', color: '#6A6964', marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ECEBE7', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1A1A18' },
  textarea: { height: 80, textAlignVertical: 'top' },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#ECEBE7' },
  saveBtn: { backgroundColor: '#1A1A18', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  disabled: { opacity: 0.6 },
});

const assign_ = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyWrap: { alignItems: 'center', marginTop: 60, gap: 10 },
  empty: { textAlign: 'center', color: '#8A8982', fontSize: 14 },
  unassignBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, marginBottom: 8, backgroundColor: '#FEF2F2', borderRadius: 12, borderWidth: 1, borderColor: '#FECACA' },
  unassignText: { color: '#b91c1c', fontWeight: '600', fontSize: 14 },
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#ECEBE7', padding: 14, marginBottom: 8 },
  cardActive: { borderColor: '#205A30', backgroundColor: '#F0FAF2' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1A1A18', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  name: { fontSize: 15, fontWeight: '600', color: '#1A1A18' },
  meta: { fontSize: 12, color: '#8A8982', marginTop: 2 },
});
