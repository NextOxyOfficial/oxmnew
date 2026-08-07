'use client';

import { useState } from 'react';
import { ApiService } from '@/lib/api';

interface Achievement {
  id: number;
  name: string;
  type: 'orders' | 'amount';
  value: number;
  points: number;
  is_active: boolean;
}

interface AchievementsTabProps {
  achievements: Achievement[];
  setAchievements: (achievements: Achievement[]) => void;
  showNotification: (type: 'success' | 'error', message: string) => void;
  loading: boolean;
  onRefresh?: () => void;
}

export default function AchievementsTab({ achievements, setAchievements, showNotification, loading, onRefresh }: AchievementsTabProps) {
  const [formData, setFormData] = useState({
    type: 'orders' as 'orders' | 'amount',
    value: '',
    points: ''
  });
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    achievement: Achievement | null;
  }>({ isOpen: false, achievement: null });
  const [toggleLoading, setToggleLoading] = useState<Set<number>>(new Set());

  // Debug: Log achievements when they change
  console.log('AchievementsTab - Current achievements:', achievements);

  // Only show achievements from the backend, no dummy data mixing
  const displayAchievements = achievements;

  const handleCreateAchievement = async () => {
    if (!formData.value || !formData.points) {
      showNotification('error', 'সব ঘর পূরণ করুন');
      return;
    }

    const value = parseInt(formData.value);
    const points = parseInt(formData.points);

    if (value <= 0 || points <= 0) {
      showNotification('error', 'লক্ষ্য আর পয়েন্ট দুটোই 0 এর বেশি হতে হবে');
      return;
    }

    try {
      console.log('Creating achievement with data:', { type: formData.type, value, points });
      const response = await ApiService.createAchievement({
        type: formData.type,
        value: value,
        points: points,
        is_active: true
      });

      console.log('Create achievement response:', response);

      if (response.achievement) {
        setAchievements([...achievements, response.achievement]);
        setFormData({ type: 'orders', value: '', points: '' });
        showNotification('success', 'অ্যাচিভমেন্ট বানানো হয়ে গেছে!');
        // Refresh the achievements list
        if (onRefresh) {
          onRefresh();
        }
      }
    } catch (error) {
      console.error('Error creating achievement:', error);
      showNotification('error', error instanceof Error ? error.message : 'অ্যাচিভমেন্ট বানানো গেল না');
    }
  };

  const toggleAchievement = async (id: number) => {
    try {
      console.log('Toggling achievement with id:', id);
      setToggleLoading(prev => new Set(prev).add(id));
      const response = await ApiService.toggleAchievement(id);
      console.log('Toggle achievement response:', response);

      if (response.achievement) {
        console.log('Updating achievement in state:', response.achievement);
        setAchievements(achievements.map(achievement =>
          achievement.id === id ? response.achievement : achievement
        ));
        showNotification('success', `অ্যাচিভমেন্ট ${response.achievement.is_active ? 'Active' : 'Inactive'} করা হয়েছে!`);
      } else {
        console.error('No achievement in response:', response);
        showNotification('error', 'সার্ভার থেকে ঠিকমতো উত্তর আসেনি');
      }
    } catch (error) {
      console.error('Error toggling achievement:', error);
      showNotification('error', 'অ্যাচিভমেন্ট বদলানো গেল না। আরেকবার চেষ্টা করুন।');
    } finally {
      setToggleLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const deleteAchievement = async (id: number) => {
    try {
      await ApiService.deleteAchievement(id);
      setAchievements(achievements.filter(achievement => achievement.id !== id));
      setDeleteModal({ isOpen: false, achievement: null });
      showNotification('success', 'অ্যাচিভমেন্ট ডিলিট হয়ে গেছে!');
    } catch (error) {
      console.error('Error deleting achievement:', error);
      showNotification('error', 'অ্যাচিভমেন্ট ডিলিট করা গেল না। আরেকবার চেষ্টা করুন।');
    }
  };

  const handleDeleteClick = (achievement: Achievement) => {
    setDeleteModal({ isOpen: true, achievement });
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, achievement: null });
  };

  const handleDeleteConfirm = () => {
    if (deleteModal.achievement) {
      deleteAchievement(deleteModal.achievement.id);
    }
  };

  return (
    <>
      {/* Create achievement */}
      <div className="plane-section">
        <div className="section-title">নতুন অ্যাচিভমেন্ট</div>
        <p className="mb-3 text-xs text-slate-500">
          কাস্টমার কতটা কিনলে পুরস্কার পাবে সেটা ঠিক করে দিন
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Achievement type */}
          <div>
            <span className="label">কিসের হিসাবে</span>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: 'orders' }))}
                className={`btn ${formData.type === 'orders' ? 'btn-primary' : 'btn-ghost'}`}
              >
                অর্ডারের সংখ্যা
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: 'amount' }))}
                className={`btn ${formData.type === 'amount' ? 'btn-primary' : 'btn-ghost'}`}
              >
                কেনাকাটার টাকা
              </button>
            </div>
          </div>

          {/* Target value */}
          <div>
            <label className="label" htmlFor="achievement-value">
              লক্ষ্য {formData.type === 'orders' ? 'অর্ডার' : 'টাকার পরিমাণ'}
            </label>
            <input
              id="achievement-value"
              type="number"
              min="1"
              value={formData.value}
              onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
              className="input num"
              placeholder={formData.type === 'orders' ? '10' : '500'}
            />
            <p className="mt-1 text-xs text-slate-500">
              {formData.type === 'orders'
                ? 'এতগুলো অর্ডার করলে কাস্টমার পুরস্কার পাবে'
                : 'সব মিলিয়ে এত টাকার কেনাকাটা করলে পুরস্কার পাবে'
              }
            </p>
          </div>

          {/* Points reward */}
          <div>
            <label className="label" htmlFor="achievement-points">কত পয়েন্ট দেবেন</label>
            <input
              id="achievement-points"
              type="number"
              min="1"
              value={formData.points}
              onChange={(e) => setFormData(prev => ({ ...prev, points: e.target.value }))}
              className="input num"
              placeholder="100"
            />
            <p className="mt-1 text-xs text-slate-500">
              লক্ষ্য পূরণ হলে এই পয়েন্টটা জমা হবে
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            <span>এক নজরে: </span>
            <span className="text-sm font-medium text-slate-900">
              {formData.value && formData.points ? (
                <>
                  {formData.type === 'orders' ? `${formData.value} টা অর্ডার করলে` : `${formData.value} টাকার কেনাকাটা করলে`} → {formData.points} পয়েন্ট
                </>
              ) : (
                'ঘরগুলো পূরণ করলে এখানে দেখাবে'
              )}
            </span>
          </div>
          <button
            onClick={handleCreateAchievement}
            disabled={loading || !formData.value || !formData.points}
            className="btn btn-primary"
          >
            {loading && (
              <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {loading ? 'বানানো হচ্ছে…' : 'অ্যাচিভমেন্ট বানান'}
          </button>
        </div>
      </div>

      {/* Existing achievements */}
      <div className="plane-section">
        <div className="section-title">আপনার অ্যাচিভমেন্ট</div>
        <div className="num text-xs text-slate-500">{displayAchievements.length} টা বানানো হয়েছে</div>
      </div>

      {displayAchievements.length === 0 ? (
        <div className="empty">
          <div className="mb-1 font-medium text-slate-600">এখনো কোনো অ্যাচিভমেন্ট নেই</div>
          <div>উপরে থেকে প্রথমটা বানিয়ে কাস্টমারদের পুরস্কার দেওয়া শুরু করুন</div>
        </div>
      ) : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>অ্যাচিভমেন্ট</th>
                <th>টাইপ</th>
                <th className="cell-num">লক্ষ্য</th>
                <th className="cell-num">পয়েন্ট</th>
                <th>অবস্থা</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {displayAchievements.map((achievement) => (
                <tr key={achievement.id}>
                  <td className="cell-strong">{achievement.name}</td>
                  <td>
                    <span className={`badge ${achievement.type === 'orders' ? 'badge-info' : 'badge-success'}`}>
                      {achievement.type === 'orders' ? 'অর্ডারের হিসাবে' : 'টাকার হিসাবে'}
                    </span>
                  </td>
                  <td className="cell-num">
                    {achievement.value} {achievement.type === 'orders' ? 'অর্ডার' : 'টাকা'}
                  </td>
                  <td className="cell-num">{achievement.points}</td>
                  <td>
                    <button
                      onClick={() => toggleAchievement(achievement.id)}
                      disabled={toggleLoading.has(achievement.id)}
                      className={`badge ${achievement.is_active ? 'badge-success' : 'badge-muted'}`}
                      title="Active/Inactive করতে চাপ দিন"
                    >
                      {toggleLoading.has(achievement.id) && (
                        <svg className="h-3 w-3 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      {achievement.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="text-right">
                    <button
                      onClick={() => handleDeleteClick(achievement)}
                      className="text-slate-400 transition-colors hover:text-rose-600"
                      title="অ্যাচিভমেন্ট ডিলিট করুন"
                      aria-label="অ্যাচিভমেন্ট ডিলিট করুন"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteModal.isOpen && (
        <div className="modal-backdrop" onClick={handleDeleteCancel}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3 className="modal-title">অ্যাচিভমেন্ট ডিলিট করবেন?</h3>
            </div>
            <div className="modal-body">
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-slate-900">&ldquo;{deleteModal.achievement?.name}&rdquo;</span>
                {' '}— একবার মুছে ফেললে এই অ্যাচিভমেন্টটা আর ফেরত আসবে না।
              </p>
            </div>
            <div className="modal-foot">
              <button onClick={handleDeleteCancel} disabled={loading} className="btn btn-ghost">
                বাতিল
              </button>
              <button onClick={handleDeleteConfirm} disabled={loading} className="btn btn-danger">
                {loading && (
                  <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {loading ? 'ডিলিট হচ্ছে…' : 'ডিলিট করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
