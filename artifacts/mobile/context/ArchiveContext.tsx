import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { RekapArchive } from '@/types';

const ARCHIVE_KEY = '@money_tracker_archives_v1';

interface ArchiveContextType {
  archives: RekapArchive[];
  isLoading: boolean;
  saveArchive: (archive: Omit<RekapArchive, 'id' | 'exportedAt'>) => Promise<RekapArchive>;
  deleteArchive: (id: string) => Promise<void>;
  renameArchive: (id: string, newTitle: string) => Promise<void>;
  importArchivesData: (data: RekapArchive[]) => Promise<void>;
}

const ArchiveContext = createContext<ArchiveContextType | null>(null);

export function ArchiveProvider({ children }: { children: React.ReactNode }) {
  const [archives, setArchives] = useState<RekapArchive[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(ARCHIVE_KEY);
        if (raw) setArchives(JSON.parse(raw));
      } catch (_) {}
      setIsLoading(false);
    })();
  }, []);

  const persist = async (data: RekapArchive[]) => {
    await AsyncStorage.setItem(ARCHIVE_KEY, JSON.stringify(data));
  };

  const saveArchive = async (archive: Omit<RekapArchive, 'id' | 'exportedAt'>): Promise<RekapArchive> => {
    const full: RekapArchive = {
      ...archive,
      id: `${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
      exportedAt: Date.now(),
    };
    const next = [full, ...archives];
    setArchives(next);
    await persist(next);
    return full;
  };

  const deleteArchive = async (id: string) => {
    const next = archives.filter(a => a.id !== id);
    setArchives(next);
    await persist(next);
  };

  const renameArchive = async (id: string, newTitle: string) => {
    const next = archives.map(a => a.id === id ? { ...a, title: newTitle.trim() } : a);
    setArchives(next);
    await persist(next);
  };

  const importArchivesData = async (data: RekapArchive[]) => {
    setArchives(data);
    await persist(data);
  };

  return (
    <ArchiveContext.Provider value={{ archives, isLoading, saveArchive, deleteArchive, renameArchive, importArchivesData }}>
      {children}
    </ArchiveContext.Provider>
  );
}

export function useArchive() {
  const ctx = useContext(ArchiveContext);
  if (!ctx) throw new Error('useArchive must be used within ArchiveProvider');
  return ctx;
}
