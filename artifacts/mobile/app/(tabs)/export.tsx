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
  const { saldo_awal, saldo_sekarang, transactions, getTotalByKategori, getTransactionsByDate } = useFinance();
  const [loading, setLoading] = useState(false);

  const totalPengeluaran = saldo_awal - saldo_sekarang;
  const kategoriData = getTotalByKategori();
  const grouped = getTransactionsByDate();
  const topKategori = [...kategoriData].sort((a, b) => b.total - a.total)[0];
  const period = getDateRange(transactions);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const generateHTML = () => {
    const groupRows = grouped.map(g => {
      const txRows = g.transactions.map(t => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #F0F3F7;font-size:13px;">${t.jam}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #F0F3F7;font-size:13px;">${t.nama_barang}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #F0F3F7;font-size:13px;">
            <span style="background:${KATEGORI_COLORS[t.kategori]}22;color:${KATEGORI_COLORS[t.kategori]};padding:2px 8px;border-radius:6px;font-size:11px;font-weight:600;">${t.kategori}</span>
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #F0F3F7;font-size:13px;font-weight:700;color:#FF5A5F;text-align:right;">Rp ${t.harga.toLocaleString('id-ID')}</td>
        </tr>
      `).join('');
      return `
        <tr><td colspan="4" style="background:#E8F9F6;padding:10px 12px;font-weight:700;color:#009B81;font-size:13px;border-top:2px solid #00C9A7;">
          ${formatDate(g.date)} — Total: Rp ${g.total.toLocaleString('id-ID')}
        </td></tr>
        ${txRows}
      `;
    }).join('');

    const kategoriRows = kategoriData
      .filter(k => k.total > 0)
      .sort((a, b) => b.total - a.total)
      .map(k => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #F0F3F7;font-size:13px;">
            <span style="background:${k.color}22;color:${k.color};padding:2px 8px;border-radius:6px;font-size:11px;font-weight:600;">${k.kategori}</span>
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #F0F3F7;font-size:13px;">${transactions.filter(t => t.kategori === k.kategori).length} item</td>
          <td style="padding:10px 12px;border-bottom:1px solid #F0F3F7;font-size:13px;font-weight:700;color:#FF5A5F;text-align:right;">Rp ${k.total.toLocaleString('id-ID')}</td>
        </tr>
      `).join('');

    return `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Laporan Pengeluaran</title>
      </head>
      <body style="font-family:'Helvetica Neue',Arial,sans-serif;padding:36px;color:#1A1D23;background:#fff;font-size:14px;margin:0;">
        <div style="text-align:center;margin-bottom:28px;padding-bottom:24px;border-bottom:3px solid #00C9A7;">
          <div style="font-size:28px;font-weight:800;color:#00C9A7;letter-spacing:-1px;">Money Tracker Mahasiswa</div>
          <div style="font-size:13px;color:#8A92A6;margin-top:4px;">Laporan Pengeluaran Harian</div>
          <div style="font-size:14px;color:#1A1D23;margin-top:8px;font-weight:600;">Periode: ${period}</div>
          <div style="font-size:12px;color:#8A92A6;margin-top:4px;">Dicetak: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>

        <div style="display:flex;gap:12px;margin-bottom:24px;">
          <div style="flex:1;background:#E8F9F6;border-radius:12px;padding:16px;">
            <div style="font-size:11px;color:#8A92A6;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Saldo Awal</div>
            <div style="font-size:18px;font-weight:800;color:#00C9A7;">Rp ${saldo_awal.toLocaleString('id-ID')}</div>
          </div>
          <div style="flex:1;background:#FFF1F2;border-radius:12px;padding:16px;">
            <div style="font-size:11px;color:#8A92A6;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Total Keluar</div>
            <div style="font-size:18px;font-weight:800;color:#FF5A5F;">Rp ${totalPengeluaran.toLocaleString('id-ID')}</div>
          </div>
          <div style="flex:1;background:#F5F7FA;border-radius:12px;padding:16px;">
            <div style="font-size:11px;color:#8A92A6;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Sisa Saldo</div>
            <div style="font-size:18px;font-weight:800;color:#1A1D23;">Rp ${saldo_sekarang.toLocaleString('id-ID')}</div>
          </div>
        </div>

        ${kategoriData.some(k => k.total > 0) ? `
        <div style="font-size:16px;font-weight:700;margin-bottom:10px;margin-top:4px;">Rincian per Kategori</div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <thead>
            <tr style="background:#00C9A7;">
              <th style="color:#fff;padding:10px 12px;text-align:left;font-size:12px;font-weight:600;">Kategori</th>
              <th style="color:#fff;padding:10px 12px;text-align:left;font-size:12px;font-weight:600;">Jumlah</th>
              <th style="color:#fff;padding:10px 12px;text-align:right;font-size:12px;font-weight:600;">Total</th>
            </tr>
          </thead>
          <tbody>${kategoriRows}</tbody>
        </table>` : ''}

        <div style="font-size:16px;font-weight:700;margin-bottom:10px;">Detail Transaksi (${transactions.length} item)</div>
        ${transactions.length > 0 ? `
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <thead>
            <tr style="background:#00C9A7;">
              <th style="color:#fff;padding:10px 12px;text-align:left;font-size:12px;font-weight:600;">Jam</th>
              <th style="color:#fff;padding:10px 12px;text-align:left;font-size:12px;font-weight:600;">Nama Barang</th>
              <th style="color:#fff;padding:10px 12px;text-align:left;font-size:12px;font-weight:600;">Kategori</th>
              <th style="color:#fff;padding:10px 12px;text-align:right;font-size:12px;font-weight:600;">Harga</th>
            </tr>
          </thead>
          <tbody>${groupRows}</tbody>
        </table>` : '<p style="color:#8A92A6;text-align:center;padding:24px;">Belum ada transaksi</p>'}

        <div style="text-align:center;color:#8A92A6;font-size:11px;border-top:1px solid #E4E9F0;padding-top:16px;margin-top:8px;">
          Money Tracker Mahasiswa &bull; ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
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
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Bagikan Laporan Pengeluaran' });
      } else {
        alert('Fitur berbagi tidak tersedia di perangkat ini.');
      }
    } catch (e) {
      console.error(e);
      alert('Gagal membuat PDF. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Export Laporan</Text>
        <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>Rekap pengeluaran siap cetak</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 90 }]}
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
          <View style={[styles.statCard, { backgroundColor: '#E8F9F6' }]}>
            <Text style={[styles.statLabel, { color: '#009B81' }]}>Saldo Awal</Text>
            <Text style={[styles.statValue, { color: '#00C9A7' }]}>{formatCurrency(saldo_awal)}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FFF1F2' }]}>
            <Text style={[styles.statLabel, { color: '#CC4040' }]}>Total Keluar</Text>
            <Text style={[styles.statValue, { color: '#FF5A5F' }]}>{formatCurrency(totalPengeluaran)}</Text>
          </View>
        </View>
        <View style={[styles.statCardFull, { backgroundColor: colors.card }]}>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Sisa Saldo</Text>
          <Text style={[styles.statValue, { color: colors.foreground }]}>{formatCurrency(saldo_sekarang)}</Text>
        </View>

        {transactions.length > 0 && (
          <>
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

            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Pratinjau Transaksi</Text>
            {grouped.map(g => (
              <View key={g.date} style={{ marginBottom: 8 }}>
                <View style={[styles.dateGroupHeader, { backgroundColor: '#E8F9F6' }]}>
                  <Text style={styles.dateGroupText}>{formatDate(g.date)}</Text>
                  <Text style={styles.dateGroupTotal}>{formatCurrency(g.total)}</Text>
                </View>
                {g.transactions.map(t => (
                  <View key={t.id} style={[styles.txRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={[styles.txTime, { backgroundColor: colors.muted }]}>
                      <Text style={[styles.txTimeText, { color: colors.mutedForeground }]}>{t.jam}</Text>
                    </View>
                    <View style={styles.txInfo}>
                      <Text style={[styles.txName, { color: colors.foreground }]} numberOfLines={1}>{t.nama_barang}</Text>
                      <View style={[styles.txBadge, { backgroundColor: `${KATEGORI_COLORS[t.kategori]}18` }]}>
                        <Text style={[styles.txBadgeText, { color: KATEGORI_COLORS[t.kategori] }]}>{t.kategori}</Text>
                      </View>
                    </View>
                    <Text style={styles.txAmount}>Rp {t.harga.toLocaleString('id-ID')}</Text>
                  </View>
                ))}
              </View>
            ))}
          </>
        )}

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
              <Feather name="download" size={20} color="#fff" />
              <Text style={styles.exportBtnText}>Cetak / Export PDF</Text>
            </>
          )}
        </TouchableOpacity>

        {transactions.length === 0 && (
          <View style={[styles.emptyBox, { backgroundColor: colors.card }]}>
            <Feather name="inbox" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Belum ada transaksi untuk diekspor.{'\n'}Tambahkan pengeluaran terlebih dahulu.
            </Text>
          </View>
        )}

        <View style={[styles.infoBox, { backgroundColor: '#E8F9F6' }]}>
          <Feather name="info" size={14} color="#00C9A7" />
          <Text style={styles.infoText}>
            PDF berisi rekap lengkap: tanggal, jam, nama barang, kategori, dan harga. Bisa dibagikan via WhatsApp, Email, Google Drive, dll.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 8 },
  headerTitle: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  headerSub: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  reportCard: {
    borderRadius: 20, padding: 20, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  reportBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginBottom: 10,
  },
  reportBadgeText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#00C9A7' },
  reportTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  reportPeriod: { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 2 },
  reportCount: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  statCard: {
    flex: 1, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  statCardFull: {
    borderRadius: 16, padding: 16, marginBottom: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  statLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', marginBottom: 6 },
  statValue: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', marginTop: 20, marginBottom: 10 },
  kategoriRow: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 12,
    padding: 12, marginBottom: 8, gap: 10,
  },
  kategoriDot: { width: 10, height: 10, borderRadius: 5 },
  kategoriName: { fontSize: 13, fontFamily: 'Inter_500Medium', width: 70 },
  barWrap: { flex: 1, height: 6, backgroundColor: '#E4E9F0', borderRadius: 3, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: 3 },
  kategoriAmount: { fontSize: 12, fontFamily: 'Inter_600SemiBold', width: 90, textAlign: 'right' },
  dateGroupHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, marginBottom: 4,
  },
  dateGroupText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#009B81' },
  dateGroupTotal: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#FF5A5F' },
  txRow: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 12,
    borderWidth: 1, padding: 10, marginBottom: 6, gap: 10,
  },
  txTime: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  txTimeText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  txInfo: { flex: 1, gap: 3 },
  txName: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  txBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start' },
  txBadgeText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  txAmount: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#FF5A5F' },
  exportBtn: {
    backgroundColor: '#00C9A7', borderRadius: 16, paddingVertical: 17,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20,
    shadowColor: '#00C9A7', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 4,
  },
  exportBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  emptyBox: {
    borderRadius: 16, padding: 28, alignItems: 'center', gap: 10, marginTop: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  emptyText: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderRadius: 12, padding: 14, marginTop: 12,
  },
  infoText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', color: '#009B81', lineHeight: 18 },
});
