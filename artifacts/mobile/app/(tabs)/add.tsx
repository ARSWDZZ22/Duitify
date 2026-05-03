import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KATEGORI_COLORS, KATEGORI_ICONS, useFinance } from '@/context/FinanceContext';
import { useColors } from '@/hooks/useColors';
import { Kategori } from '@/types';

const KATEGORI_LIST: Kategori[] = ['Makan', 'Transport', 'Jajan', 'Lainnya'];

export default function AddScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addTransaction } = useFinance();

  const [namaBarang, setNamaBarang] = useState('');
  const [hargaText, setHargaText] = useState('');
  const [selectedKategori, setSelectedKategori] = useState<Kategori>('Makan');
  const [saving, setSaving] = useState(false);
  const [successAnim] = useState(new Animated.Value(0));
  const [showSuccess, setShowSuccess] = useState(false);

  const hargaInputRef = useRef<TextInput>(null);

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

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = insets.bottom + 90;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
    >
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.background }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Tambah Pengeluaran</Text>
        <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
          {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </Text>
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
                onPress={() => {
                  setSelectedKategori(k);
                  Haptics.selectionAsync();
                }}
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  headerTitle: { fontSize: 24, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  headerSub: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 20,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  prefix: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  input: { flex: 1, fontSize: 16, fontFamily: 'Inter_500Medium', padding: 0 },
  kategoriGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kategoriBtn: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  kategoriIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  kategoriLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  saveBtn: {
    backgroundColor: '#00C9A7',
    borderRadius: 16,
    paddingVertical: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    shadowColor: '#00C9A7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  hintText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginTop: 10,
  },
  successToast: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: '#00C9A7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  successText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});
