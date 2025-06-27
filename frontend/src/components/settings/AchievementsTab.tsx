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

  // Dummy achievements for design preview
  const dummyAchievements: Achievement[] = [
    {
      id: 1,
      name: 'Complete 5 orders',
      type: 'orders',
      value: 5,
      points: 50,
      is_active: true
    },
    {
      id: 2,
      name: 'Spend 100 dollars',
      type: 'amount',
      value: 100,
      points: 75,
      is_active: true
    },
    {
      id: 3,
      name: 'Complete 10 orders',
      type: 'orders',
      value: 10,
      points: 100,
      is_active: false
    },
    {
      id: 4,
      name: 'Spend 500 dollars',
      type: 'amount',
      value: 500,
      points: 200,
      is_active: true
    }
  ];

  // Only show achievements from the backend, no dummy data mixing
  const displayAchievements = achievements;

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
        showNotification('success', 'Achievement created successfully!');
        // Refresh the achievements list
        if (onRefresh) {
          onRefresh();
        }
      }
    } catch (error) {
      console.error('Error creating achievement:', error);
      showNotification('error', error instanceof Error ? error.message : 'Failed to create achievement');
    }
  };

  const toggleAchievement = async (id: number) => {
    try {
      setToggleLoading(prev => new Set(prev).add(id));
      const response = await ApiService.toggleAchievement(id);
      
      if (response.achievement) {
        setAchievements(achievements.map(achievement => 
          achievement.id === id ? response.achievement : achievement
        ));
        showNotification('success', `Achievement ${response.achievement.is_active ? 'activated' : 'deactivated'} successfully!`);
      }
    } catch (error) {
      console.error('Error toggling achievement:', error);
      showNotification('error', 'Error updating achievement. Please try again.');
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
      showNotification('success', 'Achievement deleted successfully!');
    } catch (error) {
      console.error('Error deleting achievement:', error);
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
        {/* Create Achievement Card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h4 className="text-lg font-medium text-white">Create New Achievement</h4>
              <p className="text-xs text-gray-400">Set up rewards for customer milestones</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Achievement Type */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">
                Achievement Type
              </label>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: 'orders' }))}
                  className={`w-full p-3 rounded-lg border transition-all duration-200 text-left cursor-pointer ${
                    formData.type === 'orders'
                      ? 'border-blue-500 bg-blue-500/10 text-white'
                      : 'border-gray-600 bg-gray-800/30 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📦</span>
                    <div>
                      <div className="text-sm font-medium">Order Count</div>
                      <div className="text-xs text-gray-400">Based on number of orders</div>
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: 'amount' }))}
                  className={`w-full p-3 rounded-lg border transition-all duration-200 text-left cursor-pointer ${
                    formData.type === 'amount'
                      ? 'border-green-500 bg-green-500/10 text-white'
                      : 'border-gray-600 bg-gray-800/30 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💰</span>
                    <div>
                      <div className="text-sm font-medium">Purchase Amount</div>
                      <div className="text-xs text-gray-400">Based on total spending</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Target Value */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">
                Target {formData.type === 'orders' ? 'Orders' : 'Amount'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={formData.type === 'orders' ? '10' : '500'}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
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
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">
                Points Reward
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={formData.points}
                  onChange={(e) => setFormData(prev => ({ ...prev, points: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="100"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-400 text-sm">
                  ⭐
                </div>
              </div>
              <p className="text-xs text-gray-400">
                Points awarded when achievement is earned
              </p>
            </div>
          </div>

          {/* Preview & Create */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-gray-300">
                <span className="text-xs">Preview: </span>
                <span className="text-sm font-medium text-white">
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
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer flex items-center gap-2"
              >
                {loading && (
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {loading ? 'Creating...' : 'Create Achievement'}
              </button>
            </div>
          </div>
        </div>

        {/* Existing Achievements */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div>
              <h4 className="text-lg font-medium text-white">Your Achievements</h4>
              <p className="text-xs text-gray-400">{displayAchievements.length} achievement{displayAchievements.length !== 1 ? 's' : ''} created</p>
            </div>
          </div>

          {displayAchievements.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🏆</span>
              </div>
              <h5 className="text-base font-medium text-white mb-2">No achievements yet</h5>
              <p className="text-sm text-gray-400 mb-4">Create your first achievement above to start rewarding customers</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {displayAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="group bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${
                        achievement.type === 'orders' 
                          ? 'bg-blue-500/20 border border-blue-500/30'
                          : 'bg-green-500/20 border border-green-500/30'
                      }`}>
                        {achievement.type === 'orders' ? '📦' : '💰'}
                      </div>
                      <div>
                        <h5 className="font-medium text-white text-sm leading-tight">{achievement.name}</h5>
                        <div className="flex items-center gap-1 mt-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            achievement.type === 'orders' 
                              ? 'bg-blue-500/20 text-blue-300'
                              : 'bg-green-500/20 text-green-300'
                          }`}>
                            {achievement.type === 'orders' ? 'Order Based' : 'Amount Based'}
                          </span>
                          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 rounded-full text-xs font-medium">
                            ⭐ {achievement.points} pts
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => toggleAchievement(achievement.id)}
                        disabled={toggleLoading.has(achievement.id)}
                        className={`px-2 py-1 rounded text-xs font-medium transition-all cursor-pointer flex items-center gap-1 ${
                          achievement.is_active
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {toggleLoading.has(achievement.id) && (
                          <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        )}
                        {achievement.is_active ? 'Active' : 'Inactive'}
                      </button>
                      <button
                        onClick={() => handleDeleteClick(achievement)}
                        className="p-1.5 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 transition-all cursor-pointer"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-gray-900/30 rounded p-2">
                    <div className="text-xs text-gray-300">
                      <strong>Target:</strong> {achievement.value} {achievement.type === 'orders' ? 'orders' : 'dollars'}
                    </div>
                    <div className="text-xs text-gray-300 mt-1">
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
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer items-center gap-2"
                >
                  {loading && (
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  onClick={handleDeleteCancel}
                  disabled={loading}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-white/20 shadow-sm px-4 py-2 bg-white/10 text-base font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
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
