import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useRef } from 'react';
import { Alert, Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { KATEGORI_COLORS, KATEGORI_ICONS } from '@/context/FinanceContext';
import { useColors } from '@/hooks/useColors';
import { Transaction } from '@/types';
import { formatCurrency } from '@/utils/format';

interface Props {
  transaction: Transaction;
  onDelete?: (id: string) => void;
  showTime?: boolean;
}

export default function TransactionItem({ transaction, onDelete, showTime = true }: Props) {
  const colors = useColors();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const kategoriColor = KATEGORI_COLORS[transaction.kategori];
  const kategoriIcon = KATEGORI_ICONS[transaction.kategori] as any;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
  };

  const handleLongPress = () => {
    if (!onDelete) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Hapus Transaksi',
      `Hapus "${transaction.nama_barang}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: () => onDelete(transaction.id) },
      ],
    );
  };

  return (
    <TouchableOpacity onPress={handlePress} onLongPress={handleLongPress} activeOpacity={0.85}>
      <Animated.View style={[styles.row, { backgroundColor: colors.card, transform: [{ scale: scaleAnim }] }]}>
        <View style={[styles.iconBg, { backgroundColor: `${kategoriColor}18` }]}>
          <Feather name={kategoriIcon} size={18} color={kategoriColor} />
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
            {transaction.nama_barang}
          </Text>
          <View style={styles.metaRow}>
            {showTime && (
              <Text style={[styles.meta, { color: colors.mutedForeground }]}>{transaction.jam}</Text>
            )}
            <View style={[styles.badge, { backgroundColor: `${kategoriColor}18` }]}>
              <Text style={[styles.badgeText, { color: kategoriColor }]}>{transaction.kategori}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.amount}>{formatCurrency(transaction.harga)}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  meta: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  amount: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: '#FF5A5F',
  },
});
