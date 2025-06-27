'use client';

import { useState } from 'react';

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
}

export default function AchievementsTab({ achievements, setAchievements, showNotification, loading }: AchievementsTabProps) {
  const [formData, setFormData] = useState({
    type: 'orders' as 'orders' | 'amount',
    value: '',
    points: ''
  });
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    achievement: Achievement | null;
  }>({ isOpen: false, achievement: null });

  const handleCreateAchievement = async () => {
    if (!formData.value || !formData.points) {
      showNotification('error', 'Please fill in all fields');
      return;
    }
    
    const value = parseInt(formData.value);
    const points = parseInt(formData.points);
    
    if (value <= 0 || points <= 0) {
      showNotification('error', 'Value and points must be greater than 0');
      return;
    }
    
    try {
      const newAchievement: Achievement = {
        id: Date.now(),
        name: `${formData.type === 'orders' ? 'Complete' : 'Spend'} ${value} ${formData.type === 'orders' ? 'orders' : 'dollars'}`,
        type: formData.type,
        value: value,
        points: points,
        is_active: true
      };
      
      setAchievements([...achievements, newAchievement]);
      setFormData({ type: 'orders', value: '', points: '' });
      showNotification('success', 'Achievement created successfully!');
    } catch (error) {
      showNotification('error', 'Failed to create achievement');
    }
  };

  const toggleAchievement = async (id: number) => {
    try {
      setAchievements(achievements.map(achievement => 
        achievement.id === id ? { ...achievement, is_active: !achievement.is_active } : achievement
      ));
      const updatedAchievement = achievements.find(a => a.id === id);
      showNotification('success', `Achievement ${updatedAchievement?.is_active ? 'deactivated' : 'activated'} successfully!`);
    } catch (error) {
      showNotification('error', 'Error updating achievement. Please try again.');
    }
  };

  const deleteAchievement = async (id: number) => {
    try {
      setAchievements(achievements.filter(achievement => achievement.id !== id));
      setDeleteModal({ isOpen: false, achievement: null });
      showNotification('success', 'Achievement deleted successfully!');
    } catch (error) {
      showNotification('error', 'Error deleting achievement. Please try again.');
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
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h3 className="text-2xl font-bold text-white mb-2">Achievement System</h3>
          <p className="text-gray-400">Reward customers for their purchases and loyalty</p>
        </div>

        {/* Create Achievement Card */}
        <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h4 className="text-xl font-semibold text-white">Create New Achievement</h4>
              <p className="text-sm text-gray-400">Set up rewards for customer milestones</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Achievement Type */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-white">
                Achievement Type
              </label>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: 'orders' }))}
                  className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                    formData.type === 'orders'
                      ? 'border-blue-500 bg-blue-500/10 text-white'
                      : 'border-gray-600 bg-gray-800/30 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📦</span>
                    <div>
                      <div className="font-medium">Order Count</div>
                      <div className="text-xs text-gray-400">Based on number of orders</div>
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: 'amount' }))}
                  className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                    formData.type === 'amount'
                      ? 'border-green-500 bg-green-500/10 text-white'
                      : 'border-gray-600 bg-gray-800/30 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">💰</span>
                    <div>
                      <div className="font-medium">Purchase Amount</div>
                      <div className="text-xs text-gray-400">Based on total spending</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Target Value */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-white">
                Target {formData.type === 'orders' ? 'Orders' : 'Amount'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={formData.type === 'orders' ? '10' : '500'}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  {formData.type === 'orders' ? 'orders' : 'USD'}
                </div>
              </div>
              <p className="text-xs text-gray-400">
                {formData.type === 'orders' 
                  ? 'Customer needs to complete this many orders'
                  : 'Customer needs to spend this amount in total'
                }
              </p>
            </div>

            {/* Points Reward */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-white">
                Points Reward
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={formData.points}
                  onChange={(e) => setFormData(prev => ({ ...prev, points: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white text-lg font-medium focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="100"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-yellow-400">
                  ⭐
                </div>
              </div>
              <p className="text-xs text-gray-400">
                Points awarded when achievement is earned
              </p>
            </div>
          </div>

          {/* Preview & Create */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-gray-300">
                <span className="text-sm">Preview: </span>
                <span className="font-medium text-white">
                  {formData.value && formData.points ? (
                    <>
                      {formData.type === 'orders' ? 'Complete' : 'Spend'} {formData.value} {formData.type === 'orders' ? 'orders' : 'dollars'} → {formData.points} points
                    </>
                  ) : (
                    'Fill in the fields to see preview'
                  )}
                </span>
              </div>
              <button
                onClick={handleCreateAchievement}
                disabled={loading || !formData.value || !formData.points}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
              >
                {loading ? 'Creating...' : 'Create Achievement'}
              </button>
            </div>
          </div>
        </div>

        {/* Existing Achievements */}
        <div className="bg-gray-900/40 border border-gray-700 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div>
              <h4 className="text-xl font-semibold text-white">Your Achievements</h4>
              <p className="text-sm text-gray-400">{achievements.length} achievement{achievements.length !== 1 ? 's' : ''} created</p>
            </div>
          </div>

          {achievements.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🏆</span>
              </div>
              <h5 className="text-lg font-medium text-white mb-2">No achievements yet</h5>
              <p className="text-gray-400 mb-6">Create your first achievement above to start rewarding customers</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="group bg-gray-800/50 border border-gray-700 rounded-xl p-5 hover:bg-gray-800/70 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                        achievement.type === 'orders' 
                          ? 'bg-blue-500/20 border border-blue-500/30'
                          : 'bg-green-500/20 border border-green-500/30'
                      }`}>
                        {achievement.type === 'orders' ? '📦' : '💰'}
                      </div>
                      <div>
                        <h5 className="font-semibold text-white text-lg leading-tight">{achievement.name}</h5>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            achievement.type === 'orders' 
                              ? 'bg-blue-500/20 text-blue-300'
                              : 'bg-green-500/20 text-green-300'
                          }`}>
                            {achievement.type === 'orders' ? 'Order Based' : 'Amount Based'}
                          </span>
                          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs font-medium">
                            ⭐ {achievement.points} pts
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => toggleAchievement(achievement.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                          achievement.is_active
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                        }`}
                      >
                        {achievement.is_active ? 'Active' : 'Inactive'}
                      </button>
                      <button
                        onClick={() => handleDeleteClick(achievement)}
                        className="p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-gray-900/50 rounded-lg p-3">
                    <div className="text-sm text-gray-300">
                      <strong>Target:</strong> {achievement.value} {achievement.type === 'orders' ? 'orders' : 'dollars'}
                    </div>
                    <div className="text-sm text-gray-300 mt-1">
                      <strong>Reward:</strong> {achievement.points} loyalty points
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-black/75 backdrop-blur-sm"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white/10 backdrop-blur-xl rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-white/20">
              <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-500/20 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-white" id="modal-title">
                      Delete Achievement
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-300">
                        Are you sure you want to delete the achievement{' '}
                        <span className="font-semibold text-white">"{deleteModal.achievement?.name}"</span>? 
                        This action cannot be undone and will permanently remove this achievement from your system.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse bg-white/5">
                <button
                  onClick={handleDeleteConfirm}
                  disabled={loading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  onClick={handleDeleteCancel}
                  disabled={loading}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-white/20 shadow-sm px-4 py-2 bg-white/10 text-base font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
