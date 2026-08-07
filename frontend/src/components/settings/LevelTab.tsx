'use client';

import { useState } from 'react';
import { ApiService } from '@/lib/api';

interface Level {
  id: number;
  name: string;
  is_active: boolean;
}

interface LevelTabProps {
  levels: Level[];
  setLevels: (levels: Level[]) => void;
  showNotification: (type: 'success' | 'error', message: string) => void;
  loading: boolean;
  onDeleteClick: (level: Level) => void;
}

export default function LevelTab({ levels, setLevels, showNotification, loading, onDeleteClick }: LevelTabProps) {
  const [newLevel, setNewLevel] = useState('');

  const handleAddLevel = async () => {
    if (!newLevel.trim()) return;

    try {
      const response = await ApiService.createLevel({
        name: newLevel.trim(),
        is_active: true
      });

      const newLevelItem = response.level;
      setLevels([...levels, newLevelItem]);
      setNewLevel('');
      showNotification('success', 'লেভেল যোগ হয়ে গেছে!');
    } catch (error) {
      console.error('Error adding level:', error);
      showNotification('error', error instanceof Error ? error.message : 'লেভেল যোগ করা গেল না');
    }
  };

  const toggleLevel = async (id: number) => {
    try {
      await ApiService.toggleLevel(id);
      setLevels(levels.map(level =>
        level.id === id ? { ...level, is_active: !level.is_active } : level
      ));
      const updatedLevel = levels.find(l => l.id === id);
      showNotification('success', `লেভেল ${!updatedLevel?.is_active ? 'Active' : 'Inactive'} করা হয়েছে!`);
    } catch (error) {
      console.error('Error updating level:', error);
      showNotification('error', error instanceof Error ? error.message : 'লেভেল বদলানো গেল না। আরেকবার চেষ্টা করুন।');
    }
  };

  const handleDeleteClick = (level: Level) => {
    onDeleteClick(level);
  };

  return (
    <>
      <div className="plane-section">
        <div className="section-title">নতুন লেভেল</div>
        <div className="flex max-w-md flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={newLevel}
            onChange={(e) => setNewLevel(e.target.value)}
            className="input"
            placeholder="লেভেলের নাম"
            aria-label="লেভেলের নাম"
            onKeyPress={(e) => e.key === 'Enter' && handleAddLevel()}
          />
          <button
            onClick={handleAddLevel}
            disabled={loading || !newLevel.trim()}
            className="btn btn-primary sm:w-auto"
          >
            যোগ করুন
          </button>
        </div>
      </div>

      <div className="plane-section">
        <div className="section-title">লেভেলের তালিকা</div>
        {levels.length === 0 ? (
          <div className="empty">এখনো কোনো লেভেল নেই। উপরে থেকে প্রথমটা যোগ করুন।</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {levels.map((level) => (
              <div
                key={level.id}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5"
              >
                <button
                  className={`badge ${level.is_active ? 'badge-success' : 'badge-muted'}`}
                  onClick={() => toggleLevel(level.id)}
                  title="Active/Inactive করতে চাপ দিন"
                >
                  {level.is_active ? 'Active' : 'Inactive'}
                </button>
                <span className="whitespace-nowrap text-sm font-medium text-slate-900">{level.name}</span>
                <button
                  onClick={() => handleDeleteClick(level)}
                  className="text-slate-400 transition-colors hover:text-rose-600"
                  title="লেভেল ডিলিট করুন"
                  aria-label="লেভেল ডিলিট করুন"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
