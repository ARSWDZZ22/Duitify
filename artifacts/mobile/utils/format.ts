const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export function formatCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (dateStr === today) return 'Hari Ini';
  if (dateStr === yesterday) return 'Kemarin';
  const day = DAYS[date.getDay()];
  const month = MONTHS[date.getMonth()];
  return `${day}, ${date.getDate()} ${month} ${date.getFullYear()}`;
}

export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function getDateRange(transactions: { tanggal: string }[]): string {
  if (transactions.length === 0) return '-';
  const dates = transactions.map(t => t.tanggal).sort();
  const first = dates[0];
  const last = dates[dates.length - 1];
  if (first === last) return formatDate(first);
  const d1 = new Date(first + 'T00:00:00');
  const d2 = new Date(last + 'T00:00:00');
  return `${d1.getDate()} ${MONTHS[d1.getMonth()]} - ${d2.getDate()} ${MONTHS[d2.getMonth()]} ${d2.getFullYear()}`;
}
