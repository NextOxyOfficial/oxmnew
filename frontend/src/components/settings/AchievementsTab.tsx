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
      <div className="space-y-6">
        <div>
          {/* Create Achievement Form */}
          <div className="mb-8">
            <h4 className="text-lg font-medium text-white mb-4">Create Achievement</h4>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 max-w-md">
              <div className="space-y-4">
                {/* Type Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'orders' | 'amount' }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="orders" className="bg-gray-800">By Orders</option>
                    <option value="amount" className="bg-gray-800">By Purchased Amount</option>
                  </select>
                </div>

                {/* Value Input */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    {formData.type === 'orders' ? 'Number of Orders' : 'Amount ($)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder={formData.type === 'orders' ? 'e.g. 10' : 'e.g. 500'}
                  />
                </div>

                {/* Points Input */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Points</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.points}
                    onChange={(e) => setFormData(prev => ({ ...prev, points: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="e.g. 100"
                  />
                </div>

                {/* Create Button */}
                <button
                  onClick={handleCreateAchievement}
                  disabled={loading || !formData.value || !formData.points}
                  className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
                >
                  Create Achievement
                </button>
              </div>
            </div>
          </div>

          {/* Achievements List */}
          <div className="mb-8">
            <h4 className="text-lg font-medium text-white mb-4">Achievements</h4>
            <div className="max-w-2xl">
              {achievements.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>No achievements found. Create your first achievement above.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-200"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h5 className="font-medium text-white">{achievement.name}</h5>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            achievement.type === 'orders' 
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                              : 'bg-green-500/20 text-green-300 border border-green-400/30'
                          }`}>
                            {achievement.type === 'orders' ? '📦 Orders' : '💰 Amount'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>Target: {achievement.value} {achievement.type === 'orders' ? 'orders' : 'dollars'}</span>
                          <span>Points: {achievement.points}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleAchievement(achievement.id)}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                            achievement.is_active
                              ? 'bg-green-500/20 text-green-300 border border-green-400/30 hover:bg-green-500/30'
                              : 'bg-gray-500/20 text-gray-300 border border-gray-400/30 hover:bg-gray-500/30'
                          }`}
                        >
                          {achievement.is_active ? 'Active' : 'Inactive'}
                        </button>
                        <button
                          onClick={() => handleDeleteClick(achievement)}
                          className="p-2 bg-red-500/20 text-red-300 rounded-md hover:bg-red-500/30 border border-red-400/30 transition-all duration-200"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
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
