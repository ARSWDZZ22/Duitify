import { Feather } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { FlatList, Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TransactionItem from '@/components/TransactionItem';
import { useFinance } from '@/context/FinanceContext';
import { useColors } from '@/hooks/useColors';
import { formatCurrency, formatDate } from '@/utils/format';

type ListItem =
  | { type: 'header'; date: string; total: number; key: string }
  | { type: 'transaction'; id: string; date: string; key: string };

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { transactions, deleteTransaction, getTransactionsByDate } = useFinance();

  const groups = useMemo(() => getTransactionsByDate(), [transactions]);

  const totalAll = transactions.reduce((s, t) => s + t.harga, 0);

  const listData = useMemo((): ListItem[] => {
    const items: ListItem[] = [];
    groups.forEach(g => {
      items.push({ type: 'header', date: g.date, total: g.total, key: `h-${g.date}` });
      g.transactions.forEach(t => {
        items.push({ type: 'transaction', id: t.id, date: g.date, key: `t-${t.id}` });
      });
    });
    return items;
  }, [groups]);

  const txMap = useMemo(() => {
    const m: Record<string, (typeof transactions)[0]> = {};
    transactions.forEach(t => { m[t.id] = t; });
    return m;
  }, [transactions]);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  if (transactions.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 16 }]}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Riwayat</Text>
        </View>
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
            <Feather name="inbox" size={32} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Belum Ada Transaksi</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Mulai catat pengeluaranmu di tab Tambah
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Riwayat</Text>
        <View style={[styles.totalBadge, { backgroundColor: '#FF5A5F18' }]}>
          <Text style={[styles.totalText, { color: '#FF5A5F' }]}>Total: {formatCurrency(totalAll)}</Text>
        </View>
      </View>

      <FlatList
        data={listData}
        keyExtractor={item => item.key}
        scrollEnabled={!!listData.length}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return (
              <View style={[styles.dateHeader, { backgroundColor: colors.background }]}>
                <Text style={[styles.dateText, { color: colors.foreground }]}>{formatDate(item.date)}</Text>
                <Text style={[styles.dateTotalText, { color: '#FF5A5F' }]}>{formatCurrency(item.total)}</Text>
              </View>
            );
          }
          const tx = txMap[item.id];
          if (!tx) return null;
          return <TransactionItem transaction={tx} onDelete={deleteTransaction} showTime />;
        }}
      />
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
  headerTitle: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  totalBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  totalText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  dateText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.3 },
  dateTotalText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
});
