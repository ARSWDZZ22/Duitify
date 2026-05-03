import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { formatCurrency } from '@/utils/format';

interface Props {
  saldo_awal: number;
  saldo_sekarang: number;
  totalToday: number;
  isLow: boolean;
  onEditBalance: () => void;
}

export default function BalanceCard({ saldo_awal, saldo_sekarang, totalToday, isLow, onEditBalance }: Props) {
  const colors = useColors();
  const percentage = saldo_awal > 0 ? Math.max(0, Math.min(100, (saldo_sekarang / saldo_awal) * 100)) : 0;

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={isLow ? ['#FF5A5F', '#C0392B'] : ['#00C9A7', '#009B81']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.topRow}>
          <Text style={styles.label}>Saldo Tersisa</Text>
          <TouchableOpacity onPress={onEditBalance} style={styles.editBtn}>
            <Text style={styles.editText}>Ubah Saldo</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.balance}>{formatCurrency(saldo_sekarang)}</Text>

        {isLow && (
          <View style={styles.warningBadge}>
            <Text style={styles.warningText}>Saldo Menipis!</Text>
          </View>
        )}

        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${percentage}%` as any }]} />
        </View>

        <View style={styles.bottomRow}>
          <View>
            <Text style={styles.subLabel}>Saldo Awal</Text>
            <Text style={styles.subValue}>{formatCurrency(saldo_awal)}</Text>
          </View>
          <View style={styles.divider} />
          <View>
            <Text style={styles.subLabel}>Keluar Hari Ini</Text>
            <Text style={styles.subValue}>{formatCurrency(totalToday)}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 24,
    shadowColor: '#00C9A7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    borderRadius: 24,
    padding: 24,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  editBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  editText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  balance: {
    color: '#FFFFFF',
    fontSize: 36,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -1,
    marginBottom: 4,
  },
  warningBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  warningText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  progressBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 2,
    marginVertical: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  subLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginBottom: 2,
  },
  subValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
});
