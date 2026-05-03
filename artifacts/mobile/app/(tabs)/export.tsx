import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useArchive } from '@/context/ArchiveContext';
import { KATEGORI_COLORS, useFinance } from '@/context/FinanceContext';
import { useColors } from '@/hooks/useColors';
import { Kategori, RekapArchive, Transaction } from '@/types';
import { formatCurrency, formatDate, getDateRange } from '@/utils/format';

const BACKUP_VERSION = '1.0';

interface BackupFile {
  version: string;
  appName: string;
  exportedAt: number;
  finance: { saldo_awal: number; transactions: Transaction[] };
  archives: RekapArchive[];
}

// ─── HTML Report Generator ────────────────────────────────────────────────────

function buildHTML(opts: {
  title: string;
  period: string;
  exportedAt: string;
  saldo_awal: number;
  total_pengeluaran: number;
  sisa_saldo: number;
  transactions: Transaction[];
}) {
  const { title, period, exportedAt, saldo_awal, total_pengeluaran, sisa_saldo, transactions } = opts;

  const grouped: Record<string, Transaction[]> = {};
  transactions.forEach(t => {
    if (!grouped[t.tanggal]) grouped[t.tanggal] = [];
    grouped[t.tanggal].push(t);
  });
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const groupRows = sortedDates.map(date => {
    const txns = [...grouped[date]].sort((a, b) => b.createdAt - a.createdAt);
    const total = txns.reduce((s, t) => s + t.harga, 0);
    const txRows = txns.map(t => `
      <tr>
        <td style="padding:9px 12px;border-bottom:1px solid #F0F3F7;font-size:13px;">${t.jam}</td>
        <td style="padding:9px 12px;border-bottom:1px solid #F0F3F7;font-size:13px;">${t.nama_barang}</td>
        <td style="padding:9px 12px;border-bottom:1px solid #F0F3F7;font-size:13px;">
          <span style="background:${KATEGORI_COLORS[t.kategori]}22;color:${KATEGORI_COLORS[t.kategori]};padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700;">${t.kategori}</span>
        </td>
        <td style="padding:9px 12px;border-bottom:1px solid #F0F3F7;font-size:13px;font-weight:700;color:#FF5A5F;text-align:right;">Rp ${t.harga.toLocaleString('id-ID')}</td>
      </tr>`).join('');
    return `
      <tr><td colspan="4" style="background:#E8F9F6;padding:10px 12px;font-weight:700;color:#009B81;font-size:13px;border-top:2px solid #00C9A7;">
        ${formatDate(date)} — Total: Rp ${total.toLocaleString('id-ID')}
      </td></tr>${txRows}`;
  }).join('');

  const kategoriTotals: Record<Kategori, number> = { Makan: 0, Transport: 0, Jajan: 0, Lainnya: 0 };
  transactions.forEach(t => { kategoriTotals[t.kategori] += t.harga; });
  const kategoriRows = (Object.entries(kategoriTotals) as [Kategori, number][])
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([k, v]) => `
      <tr>
        <td style="padding:9px 12px;border-bottom:1px solid #F0F3F7;font-size:13px;">
          <span style="background:${KATEGORI_COLORS[k]}22;color:${KATEGORI_COLORS[k]};padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700;">${k}</span>
        </td>
        <td style="padding:9px 12px;border-bottom:1px solid #F0F3F7;font-size:13px;">${transactions.filter(t => t.kategori === k).length} item</td>
        <td style="padding:9px 12px;border-bottom:1px solid #F0F3F7;font-size:13px;font-weight:700;color:#FF5A5F;text-align:right;">Rp ${v.toLocaleString('id-ID')}</td>
      </tr>`).join('');

  return `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><title>${title}</title></head>
  <body style="font-family:'Helvetica Neue',Arial,sans-serif;padding:36px;color:#1A1D23;background:#fff;font-size:14px;margin:0;">
    <div style="text-align:center;margin-bottom:28px;padding-bottom:24px;border-bottom:3px solid #00C9A7;">
      <div style="font-size:26px;font-weight:800;color:#00C9A7;">Money Tracker Mahasiswa</div>
      <div style="font-size:16px;font-weight:700;margin-top:6px;">${title}</div>
      <div style="font-size:13px;color:#8A92A6;margin-top:4px;">Periode: ${period}</div>
      <div style="font-size:12px;color:#8A92A6;margin-top:2px;">Dicetak: ${exportedAt}</div>
    </div>
    <div style="display:flex;gap:12px;margin-bottom:24px;">
      <div style="flex:1;background:#E8F9F6;border-radius:12px;padding:16px;">
        <div style="font-size:11px;color:#8A92A6;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Saldo Awal</div>
        <div style="font-size:18px;font-weight:800;color:#00C9A7;">Rp ${saldo_awal.toLocaleString('id-ID')}</div>
      </div>
      <div style="flex:1;background:#FFF1F2;border-radius:12px;padding:16px;">
        <div style="font-size:11px;color:#8A92A6;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Total Keluar</div>
        <div style="font-size:18px;font-weight:800;color:#FF5A5F;">Rp ${total_pengeluaran.toLocaleString('id-ID')}</div>
      </div>
      <div style="flex:1;background:#F5F7FA;border-radius:12px;padding:16px;">
        <div style="font-size:11px;color:#8A92A6;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Sisa Saldo</div>
        <div style="font-size:18px;font-weight:800;color:#1A1D23;">Rp ${sisa_saldo.toLocaleString('id-ID')}</div>
      </div>
    </div>
    ${kategoriRows ? `
    <div style="font-size:16px;font-weight:700;margin-bottom:10px;">Rincian per Kategori</div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <thead><tr style="background:#00C9A7;">
        <th style="color:#fff;padding:10px 12px;text-align:left;font-size:12px;">Kategori</th>
        <th style="color:#fff;padding:10px 12px;text-align:left;font-size:12px;">Jumlah</th>
        <th style="color:#fff;padding:10px 12px;text-align:right;font-size:12px;">Total</th>
      </tr></thead>
      <tbody>${kategoriRows}</tbody>
    </table>` : ''}
    <div style="font-size:16px;font-weight:700;margin-bottom:10px;">Detail Transaksi (${transactions.length} item)</div>
    ${transactions.length > 0 ? `
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <thead><tr style="background:#00C9A7;">
        <th style="color:#fff;padding:10px 12px;text-align:left;font-size:12px;">Jam</th>
        <th style="color:#fff;padding:10px 12px;text-align:left;font-size:12px;">Nama Barang</th>
        <th style="color:#fff;padding:10px 12px;text-align:left;font-size:12px;">Kategori</th>
        <th style="color:#fff;padding:10px 12px;text-align:right;font-size:12px;">Harga</th>
      </tr></thead>
      <tbody>${groupRows}</tbody>
    </table>` : '<p style="color:#8A92A6;text-align:center;padding:20px;">Tidak ada transaksi.</p>'}
    <div style="text-align:center;color:#8A92A6;font-size:11px;border-top:1px solid #E4E9F0;padding-top:16px;margin-top:8px;">
      Money Tracker Mahasiswa &bull; ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
    </div>
  </body></html>`;
}

async function sharePDF(html: string, dialogTitle: string) {
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle });
  } else {
    alert('Fitur berbagi tidak tersedia di perangkat ini.');
  }
}

// ─── Archive Card ─────────────────────────────────────────────────────────────

function ArchiveCard({
  archive,
  onExport,
  onDelete,
  onRename,
}: {
  archive: RekapArchive;
  onExport: () => void;
  onDelete: () => void;
  onRename: (newTitle: string) => void;
}) {
  const colors = useColors();
  const [showRename, setShowRename] = useState(false);
  const [renameText, setRenameText] = useState(archive.title);

  const exportedDate = new Date(archive.exportedAt).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
  const exportedTime = new Date(archive.exportedAt).toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit',
  });

  const handleRenameConfirm = () => {
    if (renameText.trim()) {
      onRename(renameText.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setShowRename(false);
  };

  return (
    <>
      <View style={[archiveStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={archiveStyles.cardTop}>
          <View style={[archiveStyles.iconBox, { backgroundColor: '#00C9A718' }]}>
            <Feather name="archive" size={18} color="#00C9A7" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[archiveStyles.cardTitle, { color: colors.foreground }]} numberOfLines={1}>
              {archive.title}
            </Text>
            <Text style={[archiveStyles.cardMeta, { color: colors.mutedForeground }]}>
              {exportedDate} pukul {exportedTime}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => { setRenameText(archive.title); setShowRename(true); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={archiveStyles.iconBtn}
          >
            <Feather name="edit-2" size={15} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={archiveStyles.iconBtn}>
            <Feather name="trash-2" size={15} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        <View style={[archiveStyles.cardDivider, { backgroundColor: colors.border }]} />

        <View style={archiveStyles.statsRow}>
          <View style={archiveStyles.statItem}>
            <Text style={[archiveStyles.statLabel, { color: colors.mutedForeground }]}>Saldo Awal</Text>
            <Text style={[archiveStyles.statValue, { color: '#00C9A7' }]}>{formatCurrency(archive.saldo_awal)}</Text>
          </View>
          <View style={[archiveStyles.statDivider, { backgroundColor: colors.border }]} />
          <View style={archiveStyles.statItem}>
            <Text style={[archiveStyles.statLabel, { color: colors.mutedForeground }]}>Total Keluar</Text>
            <Text style={[archiveStyles.statValue, { color: '#FF5A5F' }]}>{formatCurrency(archive.total_pengeluaran)}</Text>
          </View>
          <View style={[archiveStyles.statDivider, { backgroundColor: colors.border }]} />
          <View style={archiveStyles.statItem}>
            <Text style={[archiveStyles.statLabel, { color: colors.mutedForeground }]}>Sisa</Text>
            <Text style={[archiveStyles.statValue, { color: colors.foreground }]}>{formatCurrency(archive.sisa_saldo)}</Text>
          </View>
        </View>

        <View style={archiveStyles.cardFooter}>
          <Text style={[archiveStyles.periodText, { color: colors.mutedForeground }]}>
            {archive.period} · {archive.jumlah_transaksi} transaksi
          </Text>
          <TouchableOpacity
            onPress={onExport}
            style={[archiveStyles.reExportBtn, { backgroundColor: '#00C9A718' }]}
            activeOpacity={0.8}
          >
            <Feather name="download" size={13} color="#00C9A7" />
            <Text style={archiveStyles.reExportText}>Export Ulang</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Rename Modal ── */}
      <Modal visible={showRename} transparent animationType="slide" onRequestClose={() => setShowRename(false)}>
        <TouchableOpacity style={archiveStyles.modalOverlay} activeOpacity={1} onPress={() => setShowRename(false)} />
        <View style={[archiveStyles.modalSheet, { backgroundColor: colors.card }]}>
          <View style={[archiveStyles.modalHandle, { backgroundColor: colors.border }]} />
          <Text style={[archiveStyles.modalTitle, { color: colors.foreground }]}>Ganti Nama Rekap</Text>
          <Text style={[archiveStyles.modalSub, { color: colors.mutedForeground }]}>
            Beri nama yang mudah diingat, misalnya "Uang Kost Mei" atau "Minggu Pertama Juni"
          </Text>
          <View style={[archiveStyles.modalInputWrapper, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Feather name="edit-2" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[archiveStyles.modalInput, { color: colors.foreground }]}
              value={renameText}
              onChangeText={setRenameText}
              placeholder="Nama rekap..."
              placeholderTextColor={colors.mutedForeground}
              autoFocus
              selectTextOnFocus
              returnKeyType="done"
              onSubmitEditing={handleRenameConfirm}
              maxLength={60}
            />
            {renameText.length > 0 && (
              <TouchableOpacity onPress={() => setRenameText('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name="x-circle" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>
          <View style={archiveStyles.modalBtns}>
            <TouchableOpacity
              onPress={() => setShowRename(false)}
              style={[archiveStyles.modalBtnCancel, { borderColor: colors.border, backgroundColor: colors.background }]}
              activeOpacity={0.8}
            >
              <Text style={[archiveStyles.modalBtnCancelText, { color: colors.mutedForeground }]}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleRenameConfirm}
              disabled={!renameText.trim()}
              style={[archiveStyles.modalBtnSave, { opacity: renameText.trim() ? 1 : 0.4 }]}
              activeOpacity={0.85}
            >
              <Feather name="check" size={16} color="#fff" />
              <Text style={archiveStyles.modalBtnSaveText}>Simpan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const archiveStyles = StyleSheet.create({
  card: {
    borderRadius: 18, borderWidth: 1, marginBottom: 12, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  iconBtn: { padding: 4 },
  cardTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  cardMeta: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  cardDivider: { height: 1, marginHorizontal: 16 },
  statsRow: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 16 },
  statItem: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 10, fontFamily: 'Inter_400Regular', marginBottom: 4 },
  statValue: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  statDivider: { width: 1, marginHorizontal: 4 },
  cardFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14, paddingTop: 4,
  },
  periodText: { fontSize: 11, fontFamily: 'Inter_400Regular', flex: 1 },
  reExportBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6,
  },
  reExportText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#00C9A7' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingTop: 12, paddingBottom: 36,
  },
  modalHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  modalSub: { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 20, lineHeight: 20 },
  modalInputWrapper: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 20,
  },
  modalInput: { flex: 1, fontSize: 16, fontFamily: 'Inter_500Medium', padding: 0 },
  modalBtns: { flexDirection: 'row', gap: 10 },
  modalBtnCancel: {
    flex: 1, borderRadius: 14, paddingVertical: 14, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  modalBtnCancelText: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  modalBtnSave: {
    flex: 2, backgroundColor: '#00C9A7', borderRadius: 14, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    shadowColor: '#00C9A7', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  modalBtnSaveText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ExportScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { saldo_awal, saldo_sekarang, transactions, getTotalByKategori, getTransactionsByDate, importFinanceData, getRawData } = useFinance();
  const { archives, saveArchive, deleteArchive, renameArchive, importArchivesData } = useArchive();
  const [loading, setLoading] = useState(false);
  const [reExporting, setReExporting] = useState<string | null>(null);
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const totalPengeluaran = saldo_awal - saldo_sekarang;
  const kategoriData = getTotalByKategori();
  const grouped = getTransactionsByDate();
  const period = getDateRange(transactions);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const handleExportCurrent = async () => {
    if (transactions.length === 0) return;
    setLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const exportedAt = new Date().toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      });

      const now = new Date();
      const monthName = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      const title = `Rekap ${monthName}`;

      const html = buildHTML({
        title,
        period,
        exportedAt,
        saldo_awal,
        total_pengeluaran: totalPengeluaran,
        sisa_saldo: saldo_sekarang,
        transactions,
      });

      await sharePDF(html, 'Bagikan Laporan Pengeluaran');

      await saveArchive({
        title,
        period,
        saldo_awal,
        total_pengeluaran: totalPengeluaran,
        sisa_saldo: saldo_sekarang,
        jumlah_transaksi: transactions.length,
        transactions: [...transactions],
        kategoriSummary: kategoriData.map(k => ({
          kategori: k.kategori as Kategori,
          total: k.total,
          jumlah: transactions.filter(t => t.kategori === k.kategori).length,
        })),
      });
    } catch (e) {
      console.error(e);
      alert('Gagal membuat PDF. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleReExport = async (archive: RekapArchive) => {
    setReExporting(archive.id);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const exportedAt = new Date(archive.exportedAt).toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      });
      const html = buildHTML({
        title: archive.title,
        period: archive.period,
        exportedAt,
        saldo_awal: archive.saldo_awal,
        total_pengeluaran: archive.total_pengeluaran,
        sisa_saldo: archive.sisa_saldo,
        transactions: archive.transactions,
      });
      await sharePDF(html, `Bagikan ${archive.title}`);
    } catch (e) {
      alert('Gagal membuat PDF. Coba lagi.');
    } finally {
      setReExporting(null);
    }
  };

  const handleDeleteArchive = (archive: RekapArchive) => {
    Alert.alert(
      'Hapus Arsip',
      `Hapus "${archive.title}"? Tindakan ini tidak dapat dibatalkan.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus', style: 'destructive',
          onPress: async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await deleteArchive(archive.id);
          },
        },
      ],
    );
  };

  const handleBackup = async () => {
    setBackingUp(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const backup: BackupFile = {
        version: BACKUP_VERSION,
        appName: 'Duitify',
        exportedAt: Date.now(),
        finance: getRawData(),
        archives,
      };
      const json = JSON.stringify(backup, null, 2);
      const date = new Date().toISOString().split('T')[0];
      const filename = `duitify_backup_${date}.json`;
      const path = `${FileSystem.cacheDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(path, json, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(path, { mimeType: 'application/json', dialogTitle: 'Simpan File Backup' });
    } catch (e) {
      Alert.alert('Gagal', 'Backup gagal. Coba lagi.');
    } finally {
      setBackingUp(false);
    }
  };

  const handleRestore = async () => {
    Alert.alert(
      'Restore Data',
      'Data saat ini (transaksi & saldo) akan diganti dengan data dari file backup. Arsip akan digabung. Lanjutkan?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Restore', style: 'destructive',
          onPress: async () => {
            setRestoring(true);
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            try {
              const result = await DocumentPicker.getDocumentAsync({
                type: 'application/json',
                copyToCacheDirectory: true,
              });
              if (result.canceled || !result.assets?.[0]) {
                setRestoring(false);
                return;
              }
              const fileUri = result.assets[0].uri;
              const content = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.UTF8 });
              const backup: BackupFile = JSON.parse(content);
              if (!backup.version || backup.appName !== 'Duitify' || !backup.finance) {
                Alert.alert('File Tidak Valid', 'File yang dipilih bukan file backup Duitify.');
                setRestoring(false);
                return;
              }
              await importFinanceData(backup.finance);
              if (backup.archives?.length) {
                const existingIds = new Set(archives.map(a => a.id));
                const merged = [...archives, ...backup.archives.filter(a => !existingIds.has(a.id))];
                await importArchivesData(merged);
              }
              Alert.alert('Berhasil!', `Data berhasil dipulihkan.\n${backup.finance.transactions.length} transaksi & ${backup.archives?.length ?? 0} arsip.`);
            } catch (e) {
              Alert.alert('Gagal', 'File backup rusak atau tidak valid.');
            } finally {
              setRestoring(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Export & Arsip</Text>
        <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>Rekap pengeluaran tersimpan otomatis</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Rekap Aktif ── */}
        <View style={styles.sectionHeaderRow}>
          <View style={[styles.sectionBadge, { backgroundColor: '#00C9A718' }]}>
            <Feather name="zap" size={12} color="#00C9A7" />
            <Text style={styles.sectionBadgeText}>REKAP AKTIF</Text>
          </View>
        </View>

        <View style={[styles.currentCard, { backgroundColor: colors.card, borderColor: '#00C9A740' }]}>
          <View style={styles.currentCardHeader}>
            <View>
              <Text style={[styles.currentTitle, { color: colors.foreground }]}>
                Rekap {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
              </Text>
              <Text style={[styles.currentMeta, { color: colors.mutedForeground }]}>
                {transactions.length} transaksi · Periode: {period}
              </Text>
            </View>
          </View>

          <View style={styles.currentStats}>
            <View style={[styles.cStatBox, { backgroundColor: '#E8F9F6' }]}>
              <Text style={[styles.cStatLabel, { color: '#009B81' }]}>Saldo Awal</Text>
              <Text style={[styles.cStatValue, { color: '#00C9A7' }]}>{formatCurrency(saldo_awal)}</Text>
            </View>
            <View style={[styles.cStatBox, { backgroundColor: '#FFF1F2' }]}>
              <Text style={[styles.cStatLabel, { color: '#CC4040' }]}>Total Keluar</Text>
              <Text style={[styles.cStatValue, { color: '#FF5A5F' }]}>{formatCurrency(totalPengeluaran)}</Text>
            </View>
            <View style={[styles.cStatBox, { backgroundColor: colors.muted }]}>
              <Text style={[styles.cStatLabel, { color: colors.mutedForeground }]}>Sisa Saldo</Text>
              <Text style={[styles.cStatValue, { color: colors.foreground }]}>{formatCurrency(saldo_sekarang)}</Text>
            </View>
          </View>

          {/* Mini transaction preview */}
          {grouped.slice(0, 2).map(g => (
            <View key={g.date} style={{ marginBottom: 6 }}>
              <View style={[styles.dateGroupHeader, { backgroundColor: colors.muted }]}>
                <Text style={[styles.dateGroupText, { color: colors.mutedForeground }]}>{formatDate(g.date)}</Text>
                <Text style={[styles.dateGroupTotal, { color: '#FF5A5F' }]}>{formatCurrency(g.total)}</Text>
              </View>
              {g.transactions.slice(0, 3).map(t => (
                <View key={t.id} style={[styles.miniTxRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.miniTxTime, { color: colors.mutedForeground }]}>{t.jam}</Text>
                  <Text style={[styles.miniTxName, { color: colors.foreground }]} numberOfLines={1}>{t.nama_barang}</Text>
                  <Text style={styles.miniTxAmount}>Rp {t.harga.toLocaleString('id-ID')}</Text>
                </View>
              ))}
              {g.transactions.length > 3 && (
                <Text style={[styles.moreText, { color: colors.mutedForeground }]}>
                  +{g.transactions.length - 3} transaksi lainnya...
                </Text>
              )}
            </View>
          ))}
          {grouped.length > 2 && (
            <Text style={[styles.moreText, { color: colors.mutedForeground }]}>
              +{grouped.length - 2} hari lainnya...
            </Text>
          )}

          <TouchableOpacity
            onPress={handleExportCurrent}
            disabled={loading || transactions.length === 0}
            style={[styles.exportBtn, { opacity: !loading && transactions.length > 0 ? 1 : 0.4 }]}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Feather name="download" size={18} color="#fff" />
                <Text style={styles.exportBtnText}>Cetak / Export PDF</Text>
              </>
            )}
          </TouchableOpacity>
          {transactions.length === 0 && (
            <Text style={[styles.noTxHint, { color: colors.mutedForeground }]}>
              Tambahkan transaksi terlebih dahulu sebelum export.
            </Text>
          )}
        </View>

        {/* ── Arsip Rekap ── */}
        <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
          <View style={[styles.sectionBadge, { backgroundColor: '#A29BFE22' }]}>
            <Feather name="archive" size={12} color="#A29BFE" />
            <Text style={[styles.sectionBadgeText, { color: '#A29BFE' }]}>ARSIP REKAP</Text>
          </View>
          {archives.length > 0 && (
            <Text style={[styles.archiveCount, { color: colors.mutedForeground }]}>
              {archives.length} tersimpan
            </Text>
          )}
        </View>

        {archives.length === 0 ? (
          <View style={[styles.emptyArchive, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="archive" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyArchiveTitle, { color: colors.foreground }]}>Belum Ada Arsip</Text>
            <Text style={[styles.emptyArchiveText, { color: colors.mutedForeground }]}>
              Setelah kamu export rekap, laporan akan otomatis tersimpan di sini untuk dibuka kembali kapan saja.
            </Text>
          </View>
        ) : (
          archives.map(archive => (
            <ArchiveCard
              key={archive.id}
              archive={archive}
              onExport={() => handleReExport(archive)}
              onDelete={() => handleDeleteArchive(archive)}
              onRename={(newTitle) => renameArchive(archive.id, newTitle)}
            />
          ))
        )}

        <View style={[styles.infoBox, { backgroundColor: '#E8F9F6' }]}>
          <Feather name="info" size={14} color="#00C9A7" />
          <Text style={styles.infoText}>
            Setiap kali kamu export, rekap otomatis disimpan di Arsip. Data transaksi terbaru tidak akan terhapus.
          </Text>
        </View>

        {/* ── Backup & Restore ── */}
        <View style={[styles.sectionHeaderRow, { marginTop: 20 }]}>
          <View style={[styles.sectionBadge, { backgroundColor: '#4ECDC422' }]}>
            <Feather name="shield" size={12} color="#4ECDC4" />
            <Text style={[styles.sectionBadgeText, { color: '#4ECDC4' }]}>BACKUP & RESTORE</Text>
          </View>
        </View>

        <View style={[styles.backupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {Platform.OS === 'web' ? (
            <View style={styles.backupWebNote}>
              <Feather name="smartphone" size={16} color="#4ECDC4" />
              <Text style={[styles.backupWebNoteText, { color: colors.mutedForeground }]}>
                Fitur Backup & Restore hanya tersedia di aplikasi HP (Android/iOS). Buka via Expo Go untuk menggunakannya.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.backupBtnRow}>
                <TouchableOpacity
                  onPress={handleBackup}
                  disabled={backingUp}
                  style={[styles.backupBtn, { backgroundColor: '#4ECDC4' }]}
                  activeOpacity={0.85}
                >
                  {backingUp ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Feather name="download-cloud" size={15} color="#fff" />
                      <Text style={styles.backupBtnText}>Backup</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleRestore}
                  disabled={restoring}
                  style={[styles.backupBtn, { backgroundColor: colors.muted, borderWidth: 1.5, borderColor: '#4ECDC4' }]}
                  activeOpacity={0.85}
                >
                  {restoring ? (
                    <ActivityIndicator color="#4ECDC4" size="small" />
                  ) : (
                    <>
                      <Feather name="upload-cloud" size={15} color="#4ECDC4" />
                      <Text style={[styles.backupBtnText, { color: '#4ECDC4' }]}>Restore</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
              <Text style={[styles.backupHint, { color: colors.mutedForeground }]}>
                Simpan backup ke Google Drive atau WhatsApp agar data aman saat ganti HP.
              </Text>
            </>
          )}
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
  sectionHeaderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10,
  },
  sectionBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
  },
  sectionBadgeText: {
    fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 0.8, color: '#00C9A7',
  },
  archiveCount: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  currentCard: {
    borderRadius: 20, borderWidth: 1.5, padding: 16,
    shadowColor: '#00C9A7', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 3,
  },
  currentCardHeader: { marginBottom: 12 },
  currentTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  currentMeta: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  currentStats: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  cStatBox: { flex: 1, borderRadius: 12, padding: 10 },
  cStatLabel: { fontSize: 10, fontFamily: 'Inter_400Regular', marginBottom: 4 },
  cStatValue: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  dateGroupHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginBottom: 4,
  },
  dateGroupText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  dateGroupTotal: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  miniTxRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 7,
    paddingHorizontal: 4, borderBottomWidth: 1, gap: 8,
  },
  miniTxTime: { fontSize: 11, fontFamily: 'Inter_500Medium', width: 38 },
  miniTxName: { flex: 1, fontSize: 12, fontFamily: 'Inter_500Medium' },
  miniTxAmount: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#FF5A5F' },
  moreText: { fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingVertical: 6 },
  exportBtn: {
    backgroundColor: '#00C9A7', borderRadius: 14, paddingVertical: 15,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14,
    shadowColor: '#00C9A7', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  exportBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  noTxHint: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 8 },
  emptyArchive: {
    borderRadius: 18, borderWidth: 1, padding: 28,
    alignItems: 'center', gap: 10,
  },
  emptyArchiveTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  emptyArchiveText: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderRadius: 12, padding: 14, marginTop: 12,
  },
  infoText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', color: '#009B81', lineHeight: 18 },
  backupCard: {
    borderRadius: 16, borderWidth: 1, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  backupWebNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  backupWebNoteText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  backupBtnRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  backupBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderRadius: 10, paddingVertical: 11,
  },
  backupBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  backupHint: { fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 16, textAlign: 'center' },
});
