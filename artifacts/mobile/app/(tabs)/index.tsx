import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
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
import BalanceCard from '@/components/BalanceCard';
import TransactionItem from '@/components/TransactionItem';
import { KATEGORI_COLORS, useFinance } from '@/context/FinanceContext';
import { useColors } from '@/hooks/useColors';
import { Kategori } from '@/types';
import { formatCurrency, formatDate, getTodayString } from '@/utils/format';

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    saldo_awal, saldo_sekarang, transactions,
    isLoading, setSaldoAwal, deleteTransaction,
    getTotalToday, getTotalByKategori,
  } = useFinance();

  const [showModal, setShowModal] = useState(false);
  const [inputSaldo, setInputSaldo] = useState('');

  const totalToday = getTotalToday();
  const isLow = saldo_awal > 0 && saldo_sekarang < saldo_awal * 0.2;
  const recentTx = useMemo(() => transactions.slice(0, 5), [transactions]);
  const today = getTodayString();
  const todayTx = useMemo(() => transactions.filter(t => t.tanggal === today), [transactions, today]);
  const kategoriData = getTotalByKategori();
  const maxKategori = Math.max(...kategoriData.map(k => k.total), 1);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const handleSaveSaldo = async () => {
    const val = parseInt(inputSaldo.replace(/\D/g, ''), 10);
    if (!val || val <= 0) return;
    await setSaldoAwal(val);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowModal(false);
    setInputSaldo('');
  };

  const formatSaldoInput = (text: string) => {
    const digits = text.replace(/\D/g, '');
    const num = parseInt(digits, 10);
    if (!digits) return '';
    return num.toLocaleString('id-ID');
  };

  if (isLoading) {
    return <View style={[styles.container, { backgroundColor: colors.background }]} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { paddingTop: topPad + 16 }]}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Selamat datang,</Text>
            <Text style={[styles.appName, { color: colors.foreground }]}>Tracker Mahasiswa</Text>
          </View>
          <TouchableOpacity
            onPress={() => { setShowModal(true); setInputSaldo(''); }}
            style={[styles.editBalBtn, { backgroundColor: colors.card }]}
            activeOpacity={0.8}
          >
            <Feather name="edit-2" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {saldo_awal === 0 ? (
          <TouchableOpacity
            style={[styles.setupBanner, { backgroundColor: '#00C9A718', borderColor: '#00C9A7' }]}
            onPress={() => setShowModal(true)}
            activeOpacity={0.85}
          >
            <Feather name="plus-circle" size={20} color="#00C9A7" />
            <View style={{ flex: 1 }}>
              <Text style={styles.setupTitle}>Set Saldo Awal</Text>
              <Text style={styles.setupSub}>Masukkan jumlah uang yang kamu punya sekarang</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#00C9A7" />
          </TouchableOpacity>
        ) : (
          <BalanceCard
            saldo_awal={saldo_awal}
            saldo_sekarang={saldo_sekarang}
            totalToday={totalToday}
            isLow={isLow}
            onEditBalance={() => setShowModal(true)}
          />
        )}

        <View style={styles.quickStats}>
          <View style={[styles.statBox, { backgroundColor: colors.card }]}>
            <Feather name="shopping-bag" size={18} color="#00C9A7" />
            <Text style={[styles.statNum, { color: colors.foreground }]}>{transactions.length}</Text>
            <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>Total Transaksi</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: colors.card }]}>
            <Feather name="sun" size={18} color="#FF9F43" />
            <Text style={[styles.statNum, { color: colors.foreground }]}>{todayTx.length}</Text>
            <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>Hari Ini</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: colors.card }]}>
            <Feather name="trending-down" size={18} color="#FF5A5F" />
            <Text style={[styles.statNum, { color: '#FF5A5F' }]}>{formatCurrency(totalToday)}</Text>
            <Text style={[styles.statLbl, { color: colors.mutedForeground }]}>Keluar Hari Ini</Text>
          </View>
        </View>

        {transactions.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Kategori</Text>
            </View>
            <View style={[styles.kategoriCard, { backgroundColor: colors.card }]}>
              {kategoriData.map(k => (
                <View key={k.kategori} style={styles.kategoriRow}>
                  <View style={[styles.kategoriDot, { backgroundColor: k.color }]} />
                  <Text style={[styles.kategoriName, { color: colors.foreground }]}>{k.kategori}</Text>
                  <View style={styles.barWrap}>
                    <View
                      style={[
                        styles.bar,
                        {
                          backgroundColor: k.color,
                          width: `${(k.total / maxKategori) * 100}%` as any,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.kategoriAmt, { color: colors.mutedForeground }]}>
                    {formatCurrency(k.total)}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Transaksi Terbaru</Text>
          {transactions.length > 5 && (
            <Text style={[styles.seeAll, { color: colors.primary }]}>Lihat Semua</Text>
          )}
        </View>

        {recentTx.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: colors.card }]}>
            <Feather name="inbox" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Belum ada transaksi.{'\n'}Tap Tambah untuk mulai mencatat.
            </Text>
          </View>
        ) : (
          recentTx.map(tx => (
            <TransactionItem key={tx.id} transaction={tx} onDelete={deleteTransaction} showTime />
          ))
        )}
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowModal(false)}
        />
        <View style={[styles.modalSheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 16 }]}>
          <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>
            {saldo_awal > 0 ? 'Ubah Saldo Awal' : 'Set Saldo Awal'}
          </Text>
          <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
            Masukkan jumlah uang yang kamu miliki saat ini
          </Text>
          <View style={[styles.modalInput, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Text style={[styles.rpPrefix, { color: colors.mutedForeground }]}>Rp</Text>
            <TextInput
              style={[styles.modalTextInput, { color: colors.foreground }]}
              placeholder="Contoh: 300.000"
              placeholderTextColor={colors.mutedForeground}
              value={inputSaldo}
              onChangeText={v => setInputSaldo(formatSaldoInput(v))}
              keyboardType="numeric"
              autoFocus
            />
          </View>
          <TouchableOpacity
            onPress={handleSaveSaldo}
            style={[styles.modalBtn, { opacity: inputSaldo ? 1 : 0.4 }]}
            disabled={!inputSaldo}
            activeOpacity={0.85}
          >
            <Text style={styles.modalBtnText}>Simpan</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  appName: { fontSize: 22, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  editBalBtn: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1,
  },
  setupBanner: {
    marginHorizontal: 20, marginTop: 16, borderRadius: 20,
    borderWidth: 1.5, padding: 20,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  setupTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#00C9A7', marginBottom: 2 },
  setupSub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#009B81' },
  quickStats: {
    flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginTop: 16,
  },
  statBox: {
    flex: 1, borderRadius: 16, padding: 14, alignItems: 'center', gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  statNum: { fontSize: 14, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  statLbl: { fontSize: 10, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, marginTop: 20, marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  seeAll: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  kategoriCard: {
    marginHorizontal: 20, borderRadius: 16, padding: 16, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  kategoriRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kategoriDot: { width: 8, height: 8, borderRadius: 4 },
  kategoriName: { fontSize: 12, fontFamily: 'Inter_500Medium', width: 64 },
  barWrap: { flex: 1, height: 6, backgroundColor: '#E4E9F0', borderRadius: 3, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: 3 },
  kategoriAmt: { fontSize: 11, fontFamily: 'Inter_500Medium', width: 80, textAlign: 'right' },
  emptyBox: {
    marginHorizontal: 20, borderRadius: 16, padding: 28,
    alignItems: 'center', gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  emptyText: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  modalSheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingTop: 12,
  },
  modalHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  modalSub: { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 20 },
  modalInput: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14, gap: 8, marginBottom: 16,
  },
  rpPrefix: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  modalTextInput: { flex: 1, fontSize: 18, fontFamily: 'Inter_600SemiBold', padding: 0 },
  modalBtn: {
    backgroundColor: '#00C9A7', borderRadius: 14, paddingVertical: 15,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#00C9A7', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  modalBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_600SemiBold' },
});
