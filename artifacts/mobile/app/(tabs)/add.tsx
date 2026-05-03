import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotes, Note } from '@/context/NotesContext';
import { KATEGORI_COLORS, KATEGORI_ICONS, useFinance } from '@/context/FinanceContext';
import { useColors } from '@/hooks/useColors';
import { Kategori } from '@/types';

const KATEGORI_LIST: Kategori[] = ['Makan', 'Transport', 'Jajan', 'Lainnya'];

function formatTime(ts: number) {
  return new Date(ts).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export default function AddScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addTransaction } = useFinance();
  const { notes, addNote, updateNote, deleteNote } = useNotes();

  const [namaBarang, setNamaBarang] = useState('');
  const [hargaText, setHargaText] = useState('');
  const [selectedKategori, setSelectedKategori] = useState<Kategori>('Makan');
  const [saving, setSaving] = useState(false);
  const [successAnim] = useState(new Animated.Value(0));
  const [showSuccess, setShowSuccess] = useState(false);

  const [showNotes, setShowNotes] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const hargaInputRef = useRef<TextInput>(null);
  const noteInputRef = useRef<TextInput>(null);

  const harga = parseInt(hargaText.replace(/\D/g, ''), 10) || 0;

  const formatHarga = (text: string) => {
    const digits = text.replace(/\D/g, '');
    const num = parseInt(digits, 10);
    if (!digits) return '';
    return num.toLocaleString('id-ID');
  };

  const isValid = namaBarang.trim().length > 0 && harga > 0;

  const handleSave = async () => {
    if (!isValid || saving) return;
    setSaving(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await addTransaction({ nama_barang: namaBarang.trim(), harga, kategori: selectedKategori });

    setShowSuccess(true);
    Animated.sequence([
      Animated.timing(successAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1200),
      Animated.timing(successAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setShowSuccess(false));

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setNamaBarang('');
    setHargaText('');
    setSelectedKategori('Makan');
    setSaving(false);
  };

  const handleSaveNote = async () => {
    if (!noteInput.trim()) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (editingNote) {
      await updateNote(editingNote.id, noteInput);
      setEditingNote(null);
    } else {
      await addNote(noteInput);
    }
    setNoteInput('');
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setNoteInput(note.text);
    setTimeout(() => noteInputRef.current?.focus(), 100);
  };

  const handleDeleteNote = (note: Note) => {
    Alert.alert('Hapus Catatan', 'Hapus catatan ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus', style: 'destructive',
        onPress: async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await deleteNote(note.id);
          if (editingNote?.id === note.id) {
            setEditingNote(null);
            setNoteInput('');
          }
        },
      },
    ]);
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = insets.bottom + 90;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.background }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Tambah Pengeluaran</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => { setShowNotes(true); Haptics.selectionAsync(); }}
          style={[styles.notesFab, { backgroundColor: notes.length > 0 ? '#A29BFE' : colors.card, borderColor: '#A29BFE' }]}
          activeOpacity={0.8}
        >
          <Feather name="file-text" size={16} color={notes.length > 0 ? '#fff' : '#A29BFE'} />
          {notes.length > 0 && (
            <View style={styles.notesBadge}>
              <Text style={styles.notesBadgeText}>{notes.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>NAMA BARANG</Text>
        <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="tag" size={18} color={colors.mutedForeground} />
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="Contoh: Nasi Goreng, GoRide..."
            placeholderTextColor={colors.mutedForeground}
            value={namaBarang}
            onChangeText={setNamaBarang}
            returnKeyType="next"
            onSubmitEditing={() => hargaInputRef.current?.focus()}
          />
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>HARGA</Text>
        <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.prefix, { color: colors.mutedForeground }]}>Rp</Text>
          <TextInput
            ref={hargaInputRef}
            style={[styles.input, { color: colors.foreground }]}
            placeholder="0"
            placeholderTextColor={colors.mutedForeground}
            value={hargaText}
            onChangeText={v => setHargaText(formatHarga(v))}
            keyboardType="numeric"
            returnKeyType="done"
          />
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>KATEGORI</Text>
        <View style={styles.kategoriGrid}>
          {KATEGORI_LIST.map(k => {
            const isSelected = selectedKategori === k;
            const color = KATEGORI_COLORS[k];
            const icon = KATEGORI_ICONS[k] as any;
            return (
              <TouchableOpacity
                key={k}
                onPress={() => { setSelectedKategori(k); Haptics.selectionAsync(); }}
                style={[
                  styles.kategoriBtn,
                  {
                    backgroundColor: isSelected ? color : colors.card,
                    borderColor: isSelected ? color : colors.border,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
                activeOpacity={0.8}
              >
                <View style={[styles.kategoriIcon, { backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : `${color}22` }]}>
                  <Feather name={icon} size={20} color={isSelected ? '#fff' : color} />
                </View>
                <Text style={[styles.kategoriLabel, { color: isSelected ? '#fff' : colors.foreground }]}>{k}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          onPress={handleSave}
          disabled={!isValid || saving}
          style={[styles.saveBtn, { opacity: isValid && !saving ? 1 : 0.4 }]}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Feather name="check-circle" size={20} color="#fff" />
              <Text style={styles.saveBtnText}>Simpan Pengeluaran</Text>
            </>
          )}
        </TouchableOpacity>

        {!isValid && (
          <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
            {!namaBarang.trim() ? 'Isi nama barang terlebih dahulu' : 'Isi harga terlebih dahulu'}
          </Text>
        )}
      </ScrollView>

      {showSuccess && (
        <Animated.View
          style={[
            styles.successToast,
            {
              opacity: successAnim,
              transform: [{ translateY: successAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
              bottom: bottomPad + 16,
            },
          ]}
        >
          <Feather name="check-circle" size={16} color="#fff" />
          <Text style={styles.successText}>Berhasil disimpan!</Text>
        </Animated.View>
      )}

      {/* ── Notes Modal ── */}
      <Modal visible={showNotes} transparent animationType="slide" onRequestClose={() => setShowNotes(false)}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowNotes(false)}
          />
          <View style={[styles.notesSheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 20 }]}>
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />

            <View style={styles.notesHeader}>
              <View style={styles.notesTitleRow}>
                <View style={[styles.notesIconWrap, { backgroundColor: '#A29BFE22' }]}>
                  <Feather name="file-text" size={18} color="#A29BFE" />
                </View>
                <View>
                  <Text style={[styles.notesTitle, { color: colors.foreground }]}>Catatan</Text>
                  <Text style={[styles.notesSub, { color: colors.mutedForeground }]}>
                    {notes.length} catatan tersimpan
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowNotes(false)}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {/* Input area */}
            <View style={[styles.noteInputWrap, { backgroundColor: colors.background, borderColor: editingNote ? '#A29BFE' : colors.border }]}>
              <TextInput
                ref={noteInputRef}
                style={[styles.noteInput, { color: colors.foreground }]}
                placeholder={editingNote ? 'Edit catatan...' : 'Tulis catatan, utang, reminder, dll...'}
                placeholderTextColor={colors.mutedForeground}
                value={noteInput}
                onChangeText={setNoteInput}
                multiline
                maxLength={500}
              />
              <View style={styles.noteInputFooter}>
                {editingNote && (
                  <TouchableOpacity onPress={() => { setEditingNote(null); setNoteInput(''); }}>
                    <Text style={[styles.cancelEditText, { color: colors.mutedForeground }]}>Batal</Text>
                  </TouchableOpacity>
                )}
                <Text style={[styles.charCount, { color: colors.mutedForeground }]}>{noteInput.length}/500</Text>
                <TouchableOpacity
                  onPress={handleSaveNote}
                  disabled={!noteInput.trim()}
                  style={[styles.noteSaveBtn, { backgroundColor: '#A29BFE', opacity: noteInput.trim() ? 1 : 0.4 }]}
                  activeOpacity={0.8}
                >
                  <Feather name={editingNote ? 'check' : 'plus'} size={14} color="#fff" />
                  <Text style={styles.noteSaveBtnText}>{editingNote ? 'Update' : 'Tambah'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Notes list */}
            <ScrollView
              style={styles.notesList}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {notes.length === 0 ? (
                <View style={styles.notesEmpty}>
                  <Feather name="edit-3" size={28} color={colors.mutedForeground} />
                  <Text style={[styles.notesEmptyText, { color: colors.mutedForeground }]}>
                    Belum ada catatan.{'\n'}Tulis apa saja — utang, reminder, ide.
                  </Text>
                </View>
              ) : (
                notes.map(note => (
                  <View
                    key={note.id}
                    style={[
                      styles.noteCard,
                      {
                        backgroundColor: editingNote?.id === note.id ? '#A29BFE18' : colors.background,
                        borderColor: editingNote?.id === note.id ? '#A29BFE' : colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.noteCardText, { color: colors.foreground }]}>{note.text}</Text>
                    <View style={styles.noteCardFooter}>
                      <Text style={[styles.noteCardDate, { color: colors.mutedForeground }]}>
                        {formatTime(note.updatedAt)}
                      </Text>
                      <View style={styles.noteCardActions}>
                        <TouchableOpacity onPress={() => handleEditNote(note)} style={styles.noteActionBtn}>
                          <Feather name="edit-2" size={14} color="#A29BFE" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteNote(note)} style={styles.noteActionBtn}>
                          <Feather name="trash-2" size={14} color={colors.expense} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  headerTitle: { fontSize: 24, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  headerSub: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  notesFab: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, marginTop: 4,
  },
  notesBadge: {
    position: 'absolute', top: -5, right: -5,
    backgroundColor: '#FF5A5F', borderRadius: 8, width: 16, height: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  notesBadgeText: { fontSize: 9, color: '#fff', fontFamily: 'Inter_700Bold' },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  sectionLabel: {
    fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1,
    textTransform: 'uppercase', marginTop: 20, marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 14,
    borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, gap: 10,
  },
  prefix: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  input: { flex: 1, fontSize: 16, fontFamily: 'Inter_500Medium', padding: 0 },
  kategoriGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kategoriBtn: {
    width: '47%', flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, padding: 14, gap: 10,
  },
  kategoriIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  kategoriLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  saveBtn: {
    backgroundColor: '#00C9A7', borderRadius: 16, paddingVertical: 17,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24,
    shadowColor: '#00C9A7', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 5,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  hintText: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 10 },
  successToast: {
    position: 'absolute', alignSelf: 'center', backgroundColor: '#00C9A7',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 6,
  },
  successText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  notesSheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 12, maxHeight: '85%',
  },
  modalHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  notesHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  notesTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  notesIconWrap: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  notesTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  notesSub: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  noteInputWrap: {
    borderRadius: 14, borderWidth: 1.5, padding: 12, marginBottom: 14,
  },
  noteInput: {
    fontSize: 15, fontFamily: 'Inter_400Regular', minHeight: 60, maxHeight: 120,
    textAlignVertical: 'top', padding: 0,
  },
  noteInputFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
  cancelEditText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  charCount: { fontSize: 11, fontFamily: 'Inter_400Regular', flex: 1, textAlign: 'right' },
  noteSaveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
  },
  noteSaveBtnText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  notesList: { maxHeight: 280 },
  notesEmpty: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  notesEmptyText: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
  noteCard: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8 },
  noteCardText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20, marginBottom: 8 },
  noteCardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  noteCardDate: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  noteCardActions: { flexDirection: 'row', gap: 12 },
  noteActionBtn: { padding: 2 },
});
