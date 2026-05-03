import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

const NOTES_KEY = '@duitify_notes_v1';

export interface Note {
  id: string;
  text: string;
  createdAt: number;
  updatedAt: number;
}

interface NotesContextType {
  notes: Note[];
  addNote: (text: string) => Promise<void>;
  updateNote: (id: string, text: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
}

const NotesContext = createContext<NotesContextType | null>(null);

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(NOTES_KEY).then(raw => {
      if (raw) setNotes(JSON.parse(raw));
    });
  }, []);

  const persist = async (data: Note[]) => {
    await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(data));
  };

  const addNote = async (text: string) => {
    const now = Date.now();
    const note: Note = {
      id: `${now}${Math.random().toString(36).substr(2, 6)}`,
      text: text.trim(),
      createdAt: now,
      updatedAt: now,
    };
    const next = [note, ...notes];
    setNotes(next);
    await persist(next);
  };

  const updateNote = async (id: string, text: string) => {
    const next = notes.map(n => n.id === id ? { ...n, text: text.trim(), updatedAt: Date.now() } : n);
    setNotes(next);
    await persist(next);
  };

  const deleteNote = async (id: string) => {
    const next = notes.filter(n => n.id !== id);
    setNotes(next);
    await persist(next);
  };

  return (
    <NotesContext.Provider value={{ notes, addNote, updateNote, deleteNote }}>
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error('useNotes must be used within NotesProvider');
  return ctx;
}
