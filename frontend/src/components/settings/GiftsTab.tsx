'use client';

import { useState } from 'react';
import { ApiService } from '@/lib/api';

interface Gift {
  id: number;
  name: string;
  is_active: boolean;
}

interface GiftsTabProps {
  gifts: Gift[];
  setGifts: (gifts: Gift[]) => void;
  showNotification: (type: 'success' | 'error', message: string) => void;
  loading: boolean;
  onDeleteClick: (gift: Gift) => void;
}

export default function GiftsTab({ gifts, setGifts, showNotification, loading, onDeleteClick }: GiftsTabProps) {
  const [newGift, setNewGift] = useState('');

  const handleAddGift = async () => {
    if (!newGift.trim()) return;

    try {
      const response = await ApiService.createGift({
        name: newGift.trim(),
        is_active: true
      });

      const newGiftItem = response.gift;
      setGifts([...gifts, newGiftItem]);
      setNewGift('');
      showNotification('success', 'গিফট যোগ হয়ে গেছে!');
    } catch (error) {
      console.error('Error adding gift:', error);
      showNotification('error', error instanceof Error ? error.message : 'গিফট যোগ করা গেল না');
    }
  };

  const toggleGift = async (id: number) => {
    try {
      await ApiService.toggleGift(id);
      setGifts(gifts.map(gift =>
        gift.id === id ? { ...gift, is_active: !gift.is_active } : gift
      ));
      const updatedGift = gifts.find(g => g.id === id);
      showNotification('success', `গিফট ${!updatedGift?.is_active ? 'Active' : 'Inactive'} করা হয়েছে!`);
    } catch (error) {
      console.error('Error updating gift:', error);
      showNotification('error', error instanceof Error ? error.message : 'গিফট বদলানো গেল না। আরেকবার চেষ্টা করুন।');
    }
  };

  const handleDeleteClick = (gift: Gift) => {
    onDeleteClick(gift);
  };

  return (
    <>
      <div className="plane-section">
        <div className="section-title">নতুন গিফট</div>
        <div className="flex max-w-md flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={newGift}
            onChange={(e) => setNewGift(e.target.value)}
            className="input"
            placeholder="গিফটের নাম"
            aria-label="গিফটের নাম"
            onKeyPress={(e) => e.key === 'Enter' && handleAddGift()}
          />
          <button
            onClick={handleAddGift}
            disabled={loading || !newGift.trim()}
            className="btn btn-primary sm:w-auto"
          >
            যোগ করুন
          </button>
        </div>
      </div>

      <div className="plane-section">
        <div className="section-title">গিফটের তালিকা</div>
        {gifts.length === 0 ? (
          <div className="empty">এখনো কোনো গিফট নেই। উপরে থেকে প্রথমটা যোগ করুন।</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {gifts.map((gift) => (
              <div
                key={gift.id}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5"
              >
                <button
                  className={`badge ${gift.is_active ? 'badge-success' : 'badge-muted'}`}
                  onClick={() => toggleGift(gift.id)}
                  title="Active/Inactive করতে চাপ দিন"
                >
                  {gift.is_active ? 'Active' : 'Inactive'}
                </button>
                <span className="whitespace-nowrap text-sm font-medium text-slate-900">{gift.name}</span>
                <button
                  onClick={() => handleDeleteClick(gift)}
                  className="text-slate-400 transition-colors hover:text-rose-600"
                  title="গিফট ডিলিট করুন"
                  aria-label="গিফট ডিলিট করুন"
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
