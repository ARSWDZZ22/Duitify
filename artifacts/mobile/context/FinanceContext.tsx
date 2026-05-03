import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { FinanceData, Kategori, Transaction } from '@/types';

const STORAGE_KEY = '@money_tracker_v1';

interface FinanceContextType {
  saldo_awal: number;
  saldo_sekarang: number;
  transactions: Transaction[];
  isLoading: boolean;
  setSaldoAwal: (amount: number) => Promise<void>;
  addTransaction: (data: { nama_barang: string; harga: number; kategori: Kategori }) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  getTotalToday: () => number;
  getTransactionsByDate: () => { date: string; transactions: Transaction[]; total: number }[];
  getTotalByKategori: () => { kategori: Kategori; total: number; color: string }[];
}

const FinanceContext = createContext<FinanceContextType | null>(null);

export const KATEGORI_COLORS: Record<Kategori, string> = {
  Makan: '#FF6B6B',
  Transport: '#4ECDC4',
  Jajan: '#FFB347',
  Lainnya: '#A29BFE',
};

export const KATEGORI_ICONS: Record<Kategori, string> = {
  Makan: 'coffee',
  Transport: 'map-pin',
  Jajan: 'shopping-bag',
  Lainnya: 'more-horizontal',
};

async function saveData(data: FinanceData) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [saldo_awal, setSaldoAwalState] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const data: FinanceData = JSON.parse(raw);
          setSaldoAwalState(data.saldo_awal);
          setTransactions(data.transactions ?? []);
        }
      } catch (_) {}
      setIsLoading(false);
    })();
  }, []);

  const saldo_sekarang = saldo_awal - transactions.reduce((s, t) => s + t.harga, 0);

  const setSaldoAwal = async (amount: number) => {
    setSaldoAwalState(amount);
    await saveData({ saldo_awal: amount, transactions });
  };

  const addTransaction = async (data: { nama_barang: string; harga: number; kategori: Kategori }) => {
    const now = new Date();
    const tanggal = now.toISOString().split('T')[0];
    const jam = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const id = `${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    const tx: Transaction = { id, ...data, tanggal, jam, createdAt: now.getTime() };
    const next = [tx, ...transactions];
    setTransactions(next);
    await saveData({ saldo_awal, transactions: next });
  };

  const deleteTransaction = async (id: string) => {
    const next = transactions.filter(t => t.id !== id);
    setTransactions(next);
    await saveData({ saldo_awal, transactions: next });
  };

  const getTotalToday = () => {
    const today = new Date().toISOString().split('T')[0];
    return transactions.filter(t => t.tanggal === today).reduce((s, t) => s + t.harga, 0);
  };

  const getTransactionsByDate = () => {
    const grouped: Record<string, Transaction[]> = {};
    transactions.forEach(t => {
      if (!grouped[t.tanggal]) grouped[t.tanggal] = [];
      grouped[t.tanggal].push(t);
    });
    return Object.entries(grouped)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, txns]) => ({
        date,
        transactions: [...txns].sort((a, b) => b.createdAt - a.createdAt),
        total: txns.reduce((s, t) => s + t.harga, 0),
      }));
  };

  const getTotalByKategori = () => {
    const totals: Record<Kategori, number> = { Makan: 0, Transport: 0, Jajan: 0, Lainnya: 0 };
    transactions.forEach(t => { totals[t.kategori] += t.harga; });
    return (Object.entries(totals) as [Kategori, number][]).map(([kategori, total]) => ({
      kategori,
      total,
      color: KATEGORI_COLORS[kategori],
    }));
  };

  return (
    <FinanceContext.Provider value={{
      saldo_awal, saldo_sekarang, transactions, isLoading,
      setSaldoAwal, addTransaction, deleteTransaction,
      getTotalToday, getTransactionsByDate, getTotalByKategori,
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
  return ctx;
}
