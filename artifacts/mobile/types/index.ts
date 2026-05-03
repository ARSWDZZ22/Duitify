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
