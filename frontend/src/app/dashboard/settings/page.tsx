'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import CustomDomainSettings from '@/components/CustomDomainSettings';

interface Category {
  id: number;
  name: string;
  is_active: boolean;
}

interface UserProfile {
  email: string;
  first_name: string;
  last_name: string;
  company: string;
  phone: string;
}

interface GeneralSettings {
  language: string;
  currency: string;
}

interface SecuritySettings {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  
  // Profile state
  const [profile, setProfile] = useState<UserProfile>({
    email: user?.email || '',
    first_name: '',
    last_name: '',
    company: '',
    phone: ''
  });

  // Categories state
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState('');

  // General settings state
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    language: 'en',
    currency: 'USD'
  });

  // Security settings state
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleProfileSave = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Profile saved:', profile);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    
    setLoading(true);
    try {
      const newCat: Category = {
        id: Date.now(),
        name: newCategory.trim(),
        is_active: true
      };
      setCategories([...categories, newCat]);
      setNewCategory('');
    } catch (error) {
      console.error('Error adding category:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = async (id: number) => {
    setCategories(categories.map(cat =>
      cat.id === id ? { ...cat, is_active: !cat.is_active } : cat
    ));
  };

  const deleteCategory = async (id: number) => {
    setCategories(categories.filter(cat => cat.id !== id));
  };

  const handleGeneralSettingsSave = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('General settings saved:', generalSettings);
    } catch (error) {
      console.error('Error saving general settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (securitySettings.newPassword !== securitySettings.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    
    if (securitySettings.newPassword.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Password changed successfully');
      setSecuritySettings({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      alert('Password changed successfully!');
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Error changing password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Password reset email sent to:', user?.email);
      alert(`Password reset instructions have been sent to ${user?.email}`);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      alert('Error sending password reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomDomainSave = async (settings: any) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Custom domain settings saved:', settings);
      alert('Custom domain settings saved successfully!');
    } catch (error) {
      console.error('Error saving custom domain settings:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'categories', label: 'Categories' },
    { id: 'general', label: 'General' }
  ];

  return (
    <div >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-300 text-lg">Manage your account preferences and configuration</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl mb-6">
          <div className="border-b border-white/20">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-400 text-blue-400'
                      : 'border-transparent text-gray-300 hover:text-white hover:border-gray-400'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-2">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-6">Profile Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={profile.first_name}
                        onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white placeholder-gray-400 text-sm backdrop-blur-sm"
                        placeholder="Enter your first name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={profile.last_name}
                        onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white placeholder-gray-400 text-sm backdrop-blur-sm"
                        placeholder="Enter your last name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white placeholder-gray-400 text-sm backdrop-blur-sm"
                        placeholder="Enter your email"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white placeholder-gray-400 text-sm backdrop-blur-sm"
                        placeholder="Enter your phone number"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Company
                      </label>
                      <input
                        type="text"
                        value={profile.company}
                        onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white placeholder-gray-400 text-sm backdrop-blur-sm"
                        placeholder="Enter your company name"
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={handleProfileSave}
                      disabled={loading}
                      className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 shadow-lg cursor-pointer"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Categories Tab */}
            {activeTab === 'categories' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-6">Category Management</h3>
                  
                  {/* Add Category */}
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 mb-6">
                    <h4 className="text-sm font-medium text-gray-300 mb-3">Add New Category</h4>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white placeholder-gray-400 text-sm backdrop-blur-sm"
                        placeholder="Category name"
                      />
                      <button
                        onClick={handleAddCategory}
                        disabled={loading || !newCategory.trim()}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 shadow-lg cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Categories List */}
                  <div className="space-y-3">
                    {categories.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <p>No categories found. Add your first category above.</p>
                      </div>
                    ) : (
                      categories.map((category) => (
                        <div
                          key={category.id}
                          className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-200"
                        >
                          <div className="flex items-center space-x-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              category.is_active
                                ? 'bg-green-500/20 text-green-300 border border-green-400/30'
                                : 'bg-gray-500/20 text-gray-300 border border-gray-400/30'
                            }`}>
                              {category.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <span className="text-sm font-medium text-white">{category.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => toggleCategory(category.id)}
                              className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 cursor-pointer ${
                                category.is_active
                                  ? 'bg-white/10 text-gray-300 hover:bg-white/20 border border-white/20'
                                  : 'bg-green-500/20 text-green-300 hover:bg-green-500/30 border border-green-400/30'
                              }`}
                            >
                              {category.is_active ? 'Disable' : 'Enable'}
                            </button>
                            <button
                              onClick={() => deleteCategory(category.id)}
                              className="px-3 py-1 bg-red-500/20 text-red-300 text-xs font-medium rounded-md hover:bg-red-500/30 border border-red-400/30 transition-all duration-200 cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-8">
                {/* Preferences */}
                <div>
                  <h3 className="text-xl font-semibold text-white mb-6">Preferences</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Language
                      </label>
                      <select
                        value={generalSettings.language}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, language: e.target.value })}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white text-sm backdrop-blur-sm"
                      >
                        <option value="en" className="bg-gray-800 text-white">English</option>
                        <option value="es" className="bg-gray-800 text-white">Spanish</option>
                        <option value="fr" className="bg-gray-800 text-white">French</option>
                        <option value="de" className="bg-gray-800 text-white">German</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Currency
                      </label>
                      <select
                        value={generalSettings.currency}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, currency: e.target.value })}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white text-sm backdrop-blur-sm"
                      >
                        <option value="USD" className="bg-gray-800 text-white">USD - US Dollar</option>
                        <option value="EUR" className="bg-gray-800 text-white">EUR - Euro</option>
                        <option value="GBP" className="bg-gray-800 text-white">GBP - British Pound</option>
                        <option value="JPY" className="bg-gray-800 text-white">JPY - Japanese Yen</option>
                        <option value="CAD" className="bg-gray-800 text-white">CAD - Canadian Dollar</option>
                        <option value="AUD" className="bg-gray-800 text-white">AUD - Australian Dollar</option>
                        <option value="CHF" className="bg-gray-800 text-white">CHF - Swiss Franc</option>
                        <option value="CNY" className="bg-gray-800 text-white">CNY - Chinese Yuan</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Security */}
                <div>
                  <h3 className="text-xl font-semibold text-white mb-6">Security</h3>
                  <div className="space-y-6">
                    {/* Change Password */}
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
                      <h4 className="text-lg font-medium text-white mb-4">Change Password</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Current Password
                          </label>
                          <input
                            type="password"
                            value={securitySettings.currentPassword}
                            onChange={(e) => setSecuritySettings({ ...securitySettings, currentPassword: e.target.value })}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white placeholder-gray-400 text-sm backdrop-blur-sm"
                            placeholder="Enter current password"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            New Password
                          </label>
                          <input
                            type="password"
                            value={securitySettings.newPassword}
                            onChange={(e) => setSecuritySettings({ ...securitySettings, newPassword: e.target.value })}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white placeholder-gray-400 text-sm backdrop-blur-sm"
                            placeholder="Enter new password"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            value={securitySettings.confirmPassword}
                            onChange={(e) => setSecuritySettings({ ...securitySettings, confirmPassword: e.target.value })}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white placeholder-gray-400 text-sm backdrop-blur-sm"
                            placeholder="Confirm new password"
                          />
                        </div>
                      </div>
                      <div className="mt-6 flex justify-between items-center">
                        <div className="text-xs text-gray-400">
                          Password must be at least 8 characters long
                        </div>
                        <button
                          onClick={handlePasswordChange}
                          disabled={loading || !securitySettings.currentPassword || !securitySettings.newPassword || !securitySettings.confirmPassword}
                          className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-medium rounded-lg hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-all duration-200 shadow-lg cursor-pointer"
                        >
                          {loading ? 'Changing...' : 'Change Password'}
                        </button>
                      </div>
                    </div>

                    {/* Forgot Password */}
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-medium text-white mb-2">Forgot Password</h4>
                          <p className="text-sm text-gray-400">
                            Send a password reset link to your email: <span className="text-blue-400">{user?.email}</span>
                          </p>
                        </div>
                        <button
                          onClick={handleForgotPassword}
                          disabled={loading}
                          className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-medium rounded-lg hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 transition-all duration-200 shadow-lg cursor-pointer"
                        >
                          {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Custom Domain & DNS */}
                <div>
                  <h3 className="text-xl font-semibold text-white mb-6">Domain & DNS</h3>
                  <CustomDomainSettings
                    loading={loading}
                    onSave={handleCustomDomainSave}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
