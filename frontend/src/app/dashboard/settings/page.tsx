'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import CustomDomainSettings from '@/components/CustomDomainSettings';
import GiftsTab from '@/components/settings/GiftsTab';
import AchievementsTab from '@/components/settings/AchievementsTab';
import { ApiService } from '@/lib/api';

interface Category {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface UserProfile {
  email: string;
  first_name: string;
  last_name: string;
  company: string;
  company_address: string;
  phone: string;
  store_logo: string;
  banner_image: string;
}

interface GeneralSettings {
  language: string;
  currency: string;
  email_notifications: boolean;
  marketing_notifications: boolean;
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
  const [notification, setNotification] = useState<{
    isVisible: boolean;
    type: 'success' | 'error';
    message: string;
  }>({ isVisible: false, type: 'success', message: '' });
  
  // Profile state
  const [profile, setProfile] = useState<UserProfile>({
    email: user?.email || '',
    first_name: '',
    last_name: '',
    company: '',
    company_address: '',
    phone: '',
    store_logo: '',
    banner_image: ''
  });

  // Categories state
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    category: Category | null;
  }>({ isOpen: false, category: null });

  // Gift state (managed by component)
  const [gifts, setGifts] = useState<{ id: number; name: string; is_active: boolean }[]>([]);
  const [giftDeleteModal, setGiftDeleteModal] = useState<{
    isOpen: boolean;
    gift: { id: number; name: string; is_active: boolean } | null;
  }>({ isOpen: false, gift: null });

  // Achievements state (managed by component)
  const [achievements, setAchievements] = useState<{ id: number; name: string; is_active: boolean }[]>([]);



  // General settings state
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    language: 'en',
    currency: 'USD',
    email_notifications: true,
    marketing_notifications: false
  });

  // Security settings state
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchCategories();
    fetchProfile();
    fetchSettings();
    fetchGifts();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ isVisible: true, type, message });
    setTimeout(() => {
      setNotification({ isVisible: false, type: 'success', message: '' });
    }, 5000);
  };

  const fetchProfile = async () => {
    try {
      const response = await ApiService.getProfile();
      if (response.user && response.profile) {
        setProfile({
          email: response.user.email || '',
          first_name: response.user.first_name || '',
          last_name: response.user.last_name || '',
          company: response.profile.company || '',
          company_address: response.profile.company_address || '',
          phone: response.profile.phone || '',
          store_logo: response.profile.store_logo ? ApiService.getImageUrl(response.profile.store_logo) : '',
          banner_image: response.profile.banner_image ? ApiService.getImageUrl(response.profile.banner_image) : ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await ApiService.getCategories();
      if (response.categories) {
        setCategories(response.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await ApiService.getSettings();
      if (response.settings) {
        setGeneralSettings({
          language: response.settings.language || 'en',
          currency: response.settings.currency || 'USD',
          email_notifications: response.settings.email_notifications !== undefined ? response.settings.email_notifications : true,
          marketing_notifications: response.settings.marketing_notifications !== undefined ? response.settings.marketing_notifications : false
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchGifts = async () => {
    try {
      const response = await ApiService.getGifts();
      if (response.gifts) {
        setGifts(response.gifts);
      }
    } catch (error) {
      console.error('Error fetching gifts:', error);
    }
  };

  const handleProfileSave = async () => {
    setLoading(true);
    try {
      const response = await ApiService.updateProfile({
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        company: profile.company,
        company_address: profile.company_address,
        phone: profile.phone
      });
      
      console.log('Profile saved:', response);
      showNotification('success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      showNotification('error', 'Error saving profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File, type: 'logo' | 'banner') => {
    if (file) {
      setLoading(true);
      try {
        let response: any;
        if (type === 'logo') {
          response = await ApiService.uploadStoreLogo(file);
          setProfile(prevProfile => ({
            ...prevProfile,
            store_logo: ApiService.getImageUrl(response.store_logo_url)
          }));
        } else {
          response = await ApiService.uploadBannerImage(file);
          setProfile(prevProfile => ({
            ...prevProfile,
            banner_image: ApiService.getImageUrl(response.banner_image_url)
          }));
        }
        console.log('Image uploaded:', response);
        showNotification('success', `${type === 'logo' ? 'Store logo' : 'Banner image'} uploaded successfully!`);
      } catch (error) {
        console.error('Error uploading image:', error);
        showNotification('error', 'Error uploading image. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const removeImage = async (type: 'logo' | 'banner') => {
    setLoading(true);
    try {
      if (type === 'logo') {
        await ApiService.removeStoreLogo();
        setProfile(prevProfile => ({
          ...prevProfile,
          store_logo: ''
        }));
      } else {
        await ApiService.removeBannerImage();
        setProfile(prevProfile => ({
          ...prevProfile,
          banner_image: ''
        }));
      }
      console.log(`${type} removed successfully`);
      showNotification('success', `${type === 'logo' ? 'Store logo' : 'Banner image'} removed successfully!`);
    } catch (error) {
      console.error(`Error removing ${type}:`, error);
      showNotification('error', `Error removing ${type}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    
    setLoading(true);
    try {
      const response = await ApiService.createCategory({ name: newCategory.trim() });
      if (response.category) {
        setCategories([...categories, response.category]);
        setNewCategory('');
        console.log('Category added successfully');
        showNotification('success', 'Category added successfully!');
      }
    } catch (error) {
      console.error('Error adding category:', error);
      showNotification('error', 'Error adding category. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = async (id: number) => {
    setLoading(true);
    try {
      const response = await ApiService.toggleCategory(id);
      if (response.category) {
        setCategories(categories.map(cat => 
          cat.id === id ? { ...cat, is_active: response.category.is_active } : cat
        ));
        console.log('Category toggled successfully');
        showNotification('success', `Category ${response.category.is_active ? 'activated' : 'deactivated'} successfully!`);
      }
    } catch (error) {
      console.error('Error toggling category:', error);
      showNotification('error', 'Error updating category. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (id: number) => {
    setLoading(true);
    try {
      await ApiService.deleteCategory(id);
      setCategories(categories.filter(cat => cat.id !== id));
      console.log('Category deleted successfully');
      setDeleteModal({ isOpen: false, category: null });
      showNotification('success', 'Category deleted successfully!');
    } catch (error) {
      console.error('Error deleting category:', error);
      showNotification('error', 'Error deleting category. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (category: Category) => {
    setDeleteModal({ isOpen: true, category });
  };

  const handleDeleteConfirm = () => {
    if (deleteModal.category) {
      deleteCategory(deleteModal.category.id);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, category: null });
  };

  // Gift delete handlers
  const handleGiftDeleteClick = (gift: { id: number; name: string; is_active: boolean }) => {
    setGiftDeleteModal({ isOpen: true, gift });
  };

  const handleGiftDeleteConfirm = async () => {
    if (giftDeleteModal.gift) {
      try {
        await ApiService.deleteGift(giftDeleteModal.gift.id);
        setGifts(gifts.filter(gift => gift.id !== giftDeleteModal.gift!.id));
        setGiftDeleteModal({ isOpen: false, gift: null });
        showNotification('success', 'Gift deleted successfully!');
      } catch (error) {
        console.error('Error deleting gift:', error);
        showNotification('error', error instanceof Error ? error.message : 'Error deleting gift. Please try again.');
      }
    }
  };

  const handleGiftDeleteCancel = () => {
    setGiftDeleteModal({ isOpen: false, gift: null });
  };

  const handleGeneralSettingsSave = async () => {
    setLoading(true);
    try {
      const response = await ApiService.updateSettings({
        language: generalSettings.language,
        currency: generalSettings.currency,
        email_notifications: generalSettings.email_notifications,
        marketing_notifications: generalSettings.marketing_notifications
      });
      
      console.log('General settings saved:', response);
      showNotification('success', 'Settings updated successfully!');
    } catch (error) {
      console.error('Error saving general settings:', error);
      showNotification('error', 'Error saving settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (securitySettings.newPassword !== securitySettings.confirmPassword) {
      showNotification('error', 'New passwords do not match');
      return;
    }
    
    if (securitySettings.newPassword.length < 8) {
      showNotification('error', 'Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      const response = await ApiService.changePassword({
        current_password: securitySettings.currentPassword,
        new_password: securitySettings.newPassword,
        confirm_password: securitySettings.confirmPassword
      });
      
      console.log('Password changed successfully:', response);
      setSecuritySettings({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      showNotification('success', 'Password changed successfully!');
    } catch (error) {
      console.error('Error changing password:', error);
      showNotification('error', error instanceof Error ? error.message : 'Error changing password. Please try again.');
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
      showNotification('success', 'Custom domain settings saved successfully!');
    } catch (error) {
      console.error('Error saving custom domain settings:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Gift functions
  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'categories', label: 'Categories' },
    { id: 'general', label: 'General' },
    { id: 'gift', label: 'Gift' },
    { id: 'achievements', label: 'Achievements' }
  ];

  return (
    <div >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 px-2">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-300 text-lg">Manage your account preferences and configuration</p>
        </div>

        {/* Notification */}
        {notification.isVisible && (
          <div className={`mb-6 p-4 rounded-lg border ${
            notification.type === 'success' 
              ? 'bg-green-500/10 border-green-400/30 text-green-300' 
              : 'bg-red-500/10 border-red-400/30 text-red-300'
          } backdrop-blur-sm`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {notification.type === 'success' ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">
                  {notification.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white/5 backdrop-blur-xl border mb-6 border-white/10 rounded-2xl shadow-2xl">
          <div className="border-b border-white/10">
            <nav className="flex space-x-8 px-6 pt-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-all duration-200 cursor-pointer ${
                    activeTab === tab.id
                      ? 'border-blue-400 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  {/* Company Images */}
                  <div className="mb-8">
                    <h4 className="text-lg font-medium text-white mb-4">Company Images</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Store Logo */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Store Logo
                        </label>
                        <div className="w-full h-32 border-2 border-dashed border-white/20 rounded-lg flex items-center justify-center bg-white/5 backdrop-blur-sm hover:border-white/30 transition-all duration-200 cursor-pointer relative group"
                             onClick={() => {
                               const input = document.createElement('input');
                               input.type = 'file';
                               input.accept = 'image/*';
                               input.onchange = (e: any) => {
                                 const file = e.target.files[0];
                                 if (file) handleImageUpload(file, 'logo');
                               };
                               input.click();
                             }}>
                          {profile.store_logo ? (
                            <>
                              <img src={profile.store_logo} alt="Store Logo" className="w-full h-full object-contain rounded-lg" />
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const input = document.createElement('input');
                                      input.type = 'file';
                                      input.accept = 'image/*';
                                      input.onchange = (event: any) => {
                                        const file = event.target.files[0];
                                        if (file) handleImageUpload(file, 'logo');
                                      };
                                      input.click();
                                    }}
                                    className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeImage('logo');
                                    }}
                                    className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="text-center">
                              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <div className="mt-2 text-xs text-gray-400">
                                Click to upload logo
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Banner Image */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Banner Image
                        </label>
                        <div className="w-full h-32 border-2 border-dashed border-white/20 rounded-lg flex items-center justify-center bg-white/5 backdrop-blur-sm hover:border-white/30 transition-all duration-200 cursor-pointer relative group"
                             onClick={() => {
                               const input = document.createElement('input');
                               input.type = 'file';
                               input.accept = 'image/*';
                               input.onchange = (e: any) => {
                                 const file = e.target.files[0];
                                 if (file) handleImageUpload(file, 'banner');
                               };
                               input.click();
                             }}>
                          {profile.banner_image ? (
                            <>
                              <img src={profile.banner_image} alt="Banner" className="w-full h-full object-cover rounded-lg" />
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const input = document.createElement('input');
                                      input.type = 'file';
                                      input.accept = 'image/*';
                                      input.onchange = (event: any) => {
                                        const file = event.target.files[0];
                                        if (file) handleImageUpload(file, 'banner');
                                      };
                                      input.click();
                                    }}
                                    className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeImage('banner');
                                    }}
                                    className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="text-center">
                              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <div className="mt-2 text-xs text-gray-400">
                                Click to upload banner
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Company Address */}
                  <div className="mb-8">
                    <h4 className="text-lg font-medium text-white mb-4">Company Address</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Address
                      </label>
                      <textarea
                        rows={3}
                        value={profile.company_address}
                        onChange={(e) => setProfile({ ...profile, company_address: e.target.value })}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white placeholder-gray-400 text-sm backdrop-blur-sm resize-none"
                        placeholder="Enter your company address"
                      />
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div className="mb-8">
                    <h4 className="text-lg font-medium text-white mb-4">Personal Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  {/* Add Category */}
                  <div className="mb-8">
                    <h4 className="text-lg font-medium text-white mb-4">Add New Category</h4>
                    <div className="flex gap-3 max-w-md">
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
                  <div className="mb-8">
                    <h4 className="text-lg font-medium text-white mb-4">Categories</h4>
                    <div className="max-w-2xl">
                      {categories.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                          <p>No categories found. Add your first category above.</p>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-3">
                          {categories.map((category) => (
                            <div
                              key={category.id}
                              className="flex items-center gap-2 p-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-200"
                            >
                              <span 
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-all duration-200 ${
                                  category.is_active
                                    ? 'bg-green-500/20 text-green-300 border border-green-400/30 hover:bg-green-500/30'
                                    : 'bg-gray-500/20 text-gray-300 border border-gray-400/30 hover:bg-gray-500/30'
                                }`}
                                onClick={() => toggleCategory(category.id)}
                                title="Click to toggle active/inactive status"
                              >
                                {category.is_active ? 'Active' : 'Inactive'}
                              </span>
                              <span className="text-sm font-medium text-white whitespace-nowrap">{category.name}</span>
                              <button
                                onClick={() => handleDeleteClick(category)}
                                className="p-1.5 bg-red-500/20 text-red-300 rounded-md hover:bg-red-500/30 border border-red-400/30 transition-all duration-200 cursor-pointer"
                                title="Delete category"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                {/* Preferences */}
                <div className="mb-8">
                  <h4 className="text-lg font-medium text-white mb-4">Preferences</h4>
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
                        <option value="bn" className="bg-gray-800 text-white">Bangla</option>
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
                        <option value="BDT" className="bg-gray-800 text-white">BDT - Bangladeshi Taka</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Security */}
                <div className="mb-8">
                  {/* Change Password */}
                  <div className="mb-6">
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


                </div>

                {/* Custom Domain & DNS */}
                <div className="mb-8">
                  <CustomDomainSettings
                    loading={loading}
                    onSave={handleCustomDomainSave}
                  />
                </div>
              </div>
            )}

            {/* Gift Tab */}
            {activeTab === 'gift' && (
              <GiftsTab
                gifts={gifts}
                setGifts={setGifts}
                showNotification={showNotification}
                loading={loading}
                onDeleteClick={handleGiftDeleteClick}
              />
            )}

            {/* Achievements Tab */}
            {activeTab === 'achievements' && (
              <AchievementsTab
                achievements={achievements}
                setAchievements={setAchievements}
                showNotification={showNotification}
                loading={loading}
              />
            )}
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
                      Delete Category
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-300">
                        Are you sure you want to delete the category{' '}
                        <span className="font-semibold text-white">"{deleteModal.category?.name}"</span>? 
                        This action cannot be undone and will permanently remove this category from your system.
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

      {/* Gift Delete Confirmation Modal */}
      {giftDeleteModal.isOpen && (
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
                      Delete Gift
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-300">
                        Are you sure you want to delete the gift{' '}
                        <span className="font-semibold text-white">"{giftDeleteModal.gift?.name}"</span>? 
                        This action cannot be undone and will permanently remove this gift from your system.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse bg-white/5">
                <button
                  onClick={handleGiftDeleteConfirm}
                  disabled={loading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  onClick={handleGiftDeleteCancel}
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

    </div>
  );
}
