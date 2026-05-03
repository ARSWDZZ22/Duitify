import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KATEGORI_COLORS, useFinance } from '@/context/FinanceContext';
import { useColors } from '@/hooks/useColors';
import { Kategori } from '@/types';
import { formatCurrency, formatDate, getDateRange } from '@/utils/format';

export default function ExportScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { saldo_awal, saldo_sekarang, transactions, getTotalByKategori } = useFinance();
  const [loading, setLoading] = useState(false);

  const totalPengeluaran = saldo_awal - saldo_sekarang;
  const kategoriData = getTotalByKategori();
  const topKategori = [...kategoriData].sort((a, b) => b.total - a.total)[0];
  const period = getDateRange(transactions);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const generateHTML = () => {
    const rows = transactions
      .slice()
      .sort((a, b) => b.createdAt - a.createdAt)
      .map(t => `
        <tr>
          <td>${formatDate(t.tanggal)}</td>
          <td>${t.jam}</td>
          <td>${t.nama_barang}</td>
          <td style="color:#A29BFE">${t.kategori}</td>
          <td class="amount">Rp ${t.harga.toLocaleString('id-ID')}</td>
        </tr>
      `).join('');

    const kategoriRows = kategoriData
      .filter(k => k.total > 0)
      .sort((a, b) => b.total - a.total)
      .map(k => `
        <tr>
          <td><span class="badge" style="background:${k.color}22;color:${k.color}">${k.kategori}</span></td>
          <td>${transactions.filter(t => t.kategori === k.kategori).length} transaksi</td>
          <td class="amount">Rp ${k.total.toLocaleString('id-ID')}</td>
        </tr>
      `).join('');

    return `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Laporan Pengeluaran</title>
        <style>
          * { margin:0; padding:0; box-sizing:border-box; }
          body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 36px; color: #1A1D23; background: #fff; font-size: 14px; }
          .header { text-align: center; margin-bottom: 28px; padding-bottom: 24px; border-bottom: 2px solid #00C9A7; }
          .logo { font-size: 28px; font-weight: 800; color: #00C9A7; letter-spacing: -1px; }
          .subtitle { font-size: 13px; color: #8A92A6; margin-top: 4px; }
          .period { font-size: 13px; color: #1A1D23; margin-top: 6px; font-weight: 600; }
          .summary { display: flex; gap: 12px; margin-bottom: 24px; }
          .card { flex: 1; border-radius: 12px; padding: 16px; }
          .card-in { background: #E8F9F6; }
          .card-out { background: #FFF1F2; }
          .card-bal { background: #F5F7FA; }
          .card-label { font-size: 11px; color: #8A92A6; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
          .card-value { font-size: 16px; font-weight: 700; }
          .in { color: #00C9A7; }
          .out { color: #FF5A5F; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          th { background: #00C9A7; color: #fff; padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 600; }
          td { padding: 10px 12px; border-bottom: 1px solid #F0F3F7; font-size: 13px; }
          tr:nth-child(even) td { background: #F5F7FA; }
          .amount { font-weight: 700; color: #FF5A5F; }
          .section-title { font-size: 15px; font-weight: 700; color: #1A1D23; margin-bottom: 12px; margin-top: 8px; }
          .badge { display: inline-block; border-radius: 6px; padding: 2px 8px; font-size: 11px; font-weight: 600; }
          .footer { text-align: center; color: #8A92A6; font-size: 11px; margin-top: 24px; border-top: 1px solid #E4E9F0; padding-top: 16px; }
          .empty { text-align: center; color: #8A92A6; padding: 24px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Money Tracker Mahasiswa</div>
          <div class="subtitle">Laporan Pengeluaran Harian</div>
          <div class="period">Periode: ${period}</div>
        </div>
        <div class="summary">
          <div class="card card-in"><div class="card-label">Saldo Awal</div><div class="card-value in">Rp ${saldo_awal.toLocaleString('id-ID')}</div></div>
          <div class="card card-out"><div class="card-label">Total Keluar</div><div class="card-value out">Rp ${totalPengeluaran.toLocaleString('id-ID')}</div></div>
          <div class="card card-bal"><div class="card-label">Sisa Saldo</div><div class="card-value">Rp ${saldo_sekarang.toLocaleString('id-ID')}</div></div>
        </div>
        <div class="section-title">Rincian per Kategori</div>
        ${kategoriData.some(k => k.total > 0) ? `
        <table>
          <thead><tr><th>Kategori</th><th>Jumlah Transaksi</th><th>Total</th></tr></thead>
          <tbody>${kategoriRows}</tbody>
        </table>` : '<p class="empty">Belum ada data kategori</p>'}
        <div class="section-title">Detail Transaksi</div>
        ${transactions.length > 0 ? `
        <table>
          <thead><tr><th>Tanggal</th><th>Jam</th><th>Nama Barang</th><th>Kategori</th><th>Harga</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>` : '<p class="empty">Belum ada transaksi</p>'}
        <div class="footer">Dibuat dengan Money Tracker Mahasiswa &bull; ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
      </body>
      </html>
    `;
  };

  const handleExportPDF = async () => {
    if (transactions.length === 0) return;
    setLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const html = generateHTML();
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Bagikan Laporan' });
      } else {
        alert('Fitur berbagi tidak tersedia di perangkat ini');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ label, value, color }: { label: string; value: string; color: string }) => (
    <View style={[styles.statCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Export</Text>
        <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>Laporan Pengeluaran</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.reportCard, { backgroundColor: colors.card }]}>
          <View style={[styles.reportBadge, { backgroundColor: '#00C9A718' }]}>
            <Feather name="file-text" size={14} color="#00C9A7" />
            <Text style={styles.reportBadgeText}>Laporan PDF</Text>
          </View>
          <Text style={[styles.reportTitle, { color: colors.foreground }]}>Money Tracker Mahasiswa</Text>
          <Text style={[styles.reportPeriod, { color: colors.mutedForeground }]}>Periode: {period}</Text>
          <Text style={[styles.reportCount, { color: colors.mutedForeground }]}>
            {transactions.length} transaksi tercatat
          </Text>
        </View>

        <View style={styles.statsRow}>
          <StatCard label="Saldo Awal" value={formatCurrency(saldo_awal)} color="#00C9A7" />
          <StatCard label="Total Keluar" value={formatCurrency(totalPengeluaran)} color="#FF5A5F" />
        </View>
        <View style={styles.statsRow}>
          <StatCard label="Sisa Saldo" value={formatCurrency(saldo_sekarang)} color={colors.foreground} />
          <StatCard
            label="Kategori Terbesar"
            value={topKategori && topKategori.total > 0 ? topKategori.kategori : '-'}
            color={topKategori ? KATEGORI_COLORS[topKategori.kategori as Kategori] : colors.mutedForeground}
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Rincian Kategori</Text>
        {kategoriData.map(k => (
          <View key={k.kategori} style={[styles.kategoriRow, { backgroundColor: colors.card }]}>
            <View style={[styles.kategoriDot, { backgroundColor: k.color }]} />
            <Text style={[styles.kategoriName, { color: colors.foreground }]}>{k.kategori}</Text>
            <View style={styles.barWrap}>
              <View
                style={[
                  styles.bar,
                  {
                    backgroundColor: k.color,
                    width: totalPengeluaran > 0 ? `${(k.total / totalPengeluaran) * 100}%` as any : '0%',
                  },
                ]}
              />
            </View>
            <Text style={[styles.kategoriAmount, { color: colors.mutedForeground }]}>
              {formatCurrency(k.total)}
            </Text>
          </View>
        ))}

        <View style={[styles.infoBox, { backgroundColor: '#E8F9F6' }]}>
          <Feather name="info" size={14} color="#00C9A7" />
          <Text style={styles.infoText}>
            Laporan akan diekspor sebagai PDF dan dapat dibagikan via WhatsApp, Email, dan lainnya.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16, backgroundColor: colors.background }]}>
        <TouchableOpacity
          onPress={handleExportPDF}
          disabled={loading || transactions.length === 0}
          style={[styles.exportBtn, { opacity: !loading && transactions.length > 0 ? 1 : 0.45 }]}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Feather name="download" size={18} color="#fff" />
              <Text style={styles.exportBtnText}>Export sebagai PDF</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerTitle: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  headerSub: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  reportCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  reportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 10,
  },
  reportBadgeText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#00C9A7' },
  reportTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  reportPeriod: { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 2 },
  reportCount: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  statLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', marginBottom: 6 },
  statValue: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', marginTop: 8, marginBottom: 10 },
  kategoriRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  kategoriDot: { width: 10, height: 10, borderRadius: 5 },
  kategoriName: { fontSize: 13, fontFamily: 'Inter_500Medium', width: 70 },
  barWrap: {
    flex: 1,
    height: 6,
    backgroundColor: '#E4E9F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  bar: { height: '100%', borderRadius: 3 },
  kategoriAmount: { fontSize: 12, fontFamily: 'Inter_600SemiBold', width: 90, textAlign: 'right' },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  infoText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', color: '#009B81', lineHeight: 18 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E4E9F0',
  },
  exportBtn: {
    backgroundColor: '#00C9A7',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#00C9A7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  exportBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_600SemiBold' },
});
