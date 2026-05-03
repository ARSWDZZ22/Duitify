export type Kategori = 'Makan' | 'Transport' | 'Jajan' | 'Lainnya';

export interface Transaction {
  id: string;
  nama_barang: string;
  harga: number;
  kategori: Kategori;
  tanggal: string;
  jam: string;
  createdAt: number;
}

export interface FinanceData {
  saldo_awal: number;
  transactions: Transaction[];
}

export interface KategoriSummary {
  kategori: Kategori;
  total: number;
  jumlah: number;
}

export interface RekapArchive {
  id: string;
  title: string;
  exportedAt: number;
  period: string;
  saldo_awal: number;
  total_pengeluaran: number;
  sisa_saldo: number;
  jumlah_transaksi: number;
  transactions: Transaction[];
  kategoriSummary: KategoriSummary[];
}
