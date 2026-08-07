"use client";

import { useSearchParams } from "next/navigation";

import CustomDomainSettings from "@/components/CustomDomainSettings";
import OptimizedImage from "@/components/OptimizedImage";
import AchievementsTab from "@/components/settings/AchievementsTab";
import ApiDocs from "@/components/settings/ApiDocs";
import RoleSettingsTab from "@/components/settings/RoleSettingsTab";
import BrandTab from "@/components/settings/BrandTab";
import GiftsTab from "@/components/settings/GiftsTab";
import LevelTab from "@/components/settings/LevelTab";
import PaymentMethodsTab from "@/components/settings/PaymentMethodsTab";
import { useAuth } from "@/contexts/AuthContext";
import { CURRENCY_SYMBOLS, useCurrency } from "@/contexts/CurrencyContext";
import { ApiService } from "@/lib/api";
import { useEffect, useState } from "react";

interface Category {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface Achievement {
  id: number;
  name: string;
  type: "orders" | "amount";
  value: number;
  points: number;
  is_active: boolean;
}

interface APIKey {
  id: number;
  key: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_used: string | null;
  requests_per_hour: number;
  requests_per_day: number;
}

interface APIKeyUsageStats {
  api_key: string;
  is_active: boolean;
  created_at: string;
  last_used: string | null;
  rate_limits: {
    requests_per_hour: number;
    requests_per_day: number;
  };
  stats_last_30_days: {
    total_requests: number;
    successful_requests: number;
    failed_requests: number;
    success_rate: number;
  };
  daily_usage_last_7_days: Array<{
    date: string;
    requests: number;
  }>;
}

interface GeneralSettings {
  language: string;
  email_notifications: boolean;
  marketing_notifications: boolean;
}

// Store profile shape used by the store sections (moved here from the profile page)
interface StoreProfileData {
  user: {
    first_name: string;
    last_name: string;
    email: string;
  };
  profile: {
    company: string;
    company_address: string;
    phone: string;
    contact_number: string;
    address: string;
    city: string;
    post_code: string;
    store_logo: string;
    banner_image: string;
  };
}

// The full profile payload — untouched fields are sent back exactly as they came
interface StoreForm {
  first_name: string;
  last_name: string;
  email: string;
  company: string;
  company_address: string;
  phone: string;
  contact_number: string;
  address: string;
  city: string;
  post_code: string;
}

interface SecuritySettings {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Shared confirmation dialog so every delete flow uses the same plane language
function ConfirmDelete({
  title,
  name,
  note,
  loading,
  onCancel,
  onConfirm,
}: {
  title: string;
  name?: string;
  note: string;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3 className="modal-title">{title}</h3>
        </div>
        <div className="modal-body">
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">
              &ldquo;{name}&rdquo;
            </span>{" "}
            — {note}
          </p>
        </div>
        <div className="modal-foot">
          <button onClick={onCancel} disabled={loading} className="btn btn-ghost">
            বাতিল
          </button>
          <button onClick={onConfirm} disabled={loading} className="btn btn-danger">
            {loading ? "ডিলিট হচ্ছে…" : "ডিলিট করুন"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { currency, currencySymbol, setCurrency, refreshCurrency } =
    useCurrency();
  // Store is the first tab, so settings should open on it rather than
  // dropping the user on the second tab.
  // ?tab= lets a toast or a link land on the exact tab that fixes whatever
  // the user was told was missing.
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    () => searchParams.get("tab") || "store"
  );
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{
    isVisible: boolean;
    type: "success" | "error";
    message: string;
  }>({ isVisible: false, type: "success", message: "" });

  // Categories state
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    category: Category | null;
  }>({ isOpen: false, category: null });

  // Gift state (managed by component)
  const [gifts, setGifts] = useState<
    { id: number; name: string; is_active: boolean }[]
  >([]);
  const [giftDeleteModal, setGiftDeleteModal] = useState<{
    isOpen: boolean;
    gift: { id: number; name: string; is_active: boolean } | null;
  }>({ isOpen: false, gift: null });

  // Achievements state (managed by component)
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  // Level state (managed by component)
  const [levels, setLevels] = useState<
    { id: number; name: string; is_active: boolean }[]
  >([]);
  const [levelDeleteModal, setLevelDeleteModal] = useState<{
    isOpen: boolean;
    level: { id: number; name: string; is_active: boolean } | null;
  }>({ isOpen: false, level: null });

  // Brand state (managed by component)
  const [brands, setBrands] = useState<
    { id: number; name: string; is_active: boolean }[]
  >([]);
  const [brandDeleteModal, setBrandDeleteModal] = useState<{
    isOpen: boolean;
    brand: { id: number; name: string; is_active: boolean } | null;
  }>({ isOpen: false, brand: null });

  // Payment Methods state (managed by component)
  const [paymentMethods, setPaymentMethods] = useState<
    { id: number; name: string; is_active: boolean }[]
  >([]);
  const [paymentMethodDeleteModal, setPaymentMethodDeleteModal] = useState<{
    isOpen: boolean;
    paymentMethod: { id: number; name: string; is_active: boolean } | null;
  }>({ isOpen: false, paymentMethod: null });

  // General settings state — currency lives in CurrencyContext, not here
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    language: "en",
    email_notifications: true,
    marketing_notifications: false,
  });

  // Store profile state (moved here from the profile page)
  const [storeProfile, setStoreProfile] = useState<StoreProfileData | null>(
    null
  );
  const [storeForm, setStoreForm] = useState<StoreForm>({
    first_name: "",
    last_name: "",
    email: "",
    company: "",
    company_address: "",
    phone: "",
    contact_number: "",
    address: "",
    city: "",
    post_code: "",
  });
  const [isSavingStore, setIsSavingStore] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  // Security settings state
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // API Keys state
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [usageStats, setUsageStats] = useState<APIKeyUsageStats | null>(null);
  const [needsApiKey, setNeedsApiKey] = useState(false);
  const [showApiKeyValue, setShowApiKeyValue] = useState<number | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [apiKeyDeleteModal, setApiKeyDeleteModal] = useState<{
    isOpen: boolean;
    apiKey: APIKey | null;
  }>({ isOpen: false, apiKey: null });

  useEffect(() => {
    fetchCategories();
    fetchSettings();
    fetchGifts();
    fetchAchievements();
    fetchLevels();
    fetchBrands();
    fetchPaymentMethods();
    fetchApiKeys();
    fetchStoreProfile();
  }, []);

  // Fetch data when specific tabs become active
  useEffect(() => {
    if (activeTab === "achievements") {
      fetchAchievements();
    } else if (activeTab === "levels") {
      fetchLevels();
    } else if (activeTab === "api-keys") {
      fetchApiKeys(); // This will fetch usage stats if API keys exist
    } else if (activeTab === "store") {
      fetchStoreProfile();
    }
  }, [activeTab]);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ isVisible: true, type, message });
    setTimeout(() => {
      setNotification({ isVisible: false, type: "success", message: "" });
    }, 5000);
  };

  const fetchCategories = async () => {
    try {
      const response = await ApiService.getCategories();
      console.log("Categories response:", response);
      if (Array.isArray(response)) {
        setCategories(response);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await ApiService.getSettings();
      if (response.settings) {
        setGeneralSettings({
          language: response.settings.language || "en",
          email_notifications:
            response.settings.email_notifications !== undefined
              ? response.settings.email_notifications
              : true,
          marketing_notifications:
            response.settings.marketing_notifications !== undefined
              ? response.settings.marketing_notifications
              : false,
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const fetchStoreProfile = async () => {
    try {
      const data = await ApiService.getProfile();
      setStoreProfile(data);
      setStoreForm({
        first_name: data.user.first_name || "",
        last_name: data.user.last_name || "",
        email: data.user.email || "",
        company: data.profile.company || "",
        company_address: data.profile.company_address || "",
        phone: data.profile.phone || "",
        contact_number: data.profile.contact_number || "",
        address: data.profile.address || "",
        city: data.profile.city || "",
        post_code: data.profile.post_code || "",
      });
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      setStoreProfile(null);
    }
  };

  const fetchGifts = async () => {
    try {
      const response = await ApiService.getGifts();
      if (Array.isArray(response)) {
        setGifts(response);
      } else {
        setGifts([]);
      }
    } catch (error) {
      console.error("Error fetching gifts:", error);
      setGifts([]);
    }
  };

  const fetchAchievements = async () => {
    try {
      const response = await ApiService.getAchievements();
      console.log("Achievements response:", response); // Debug log
      if (Array.isArray(response)) {
        setAchievements(response);
      } else {
        // If no achievements property, set empty array
        setAchievements([]);
      }
    } catch (error) {
      console.error("Error fetching achievements:", error);
      // Set empty array on error to show "no achievements" state
      setAchievements([]);
      showNotification("error", "অ্যাচিভমেন্ট আনা গেল না");
    }
  };

  const fetchLevels = async () => {
    try {
      const response = await ApiService.getLevels();
      console.log("Levels response:", response); // Debug log
      if (Array.isArray(response)) {
        setLevels(response);
      } else {
        // If no levels property, set empty array
        setLevels([]);
      }
    } catch (error) {
      console.error("Error fetching levels:", error);
      // Set empty array on error to show "no levels" state
      setLevels([]);
      showNotification("error", "লেভেল আনা গেল না");
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await ApiService.getBrands();
      console.log("Brands response:", response); // Debug log
      if (Array.isArray(response)) {
        setBrands(response);
      } else {
        // If no brands property, set empty array
        setBrands([]);
      }
    } catch (error) {
      console.error("Error fetching brands:", error);
      // Set empty array on error to show "no brands" state
      setBrands([]);
      showNotification("error", "ব্র্যান্ড আনা গেল না");
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await ApiService.getPaymentMethods();
      console.log("Payment methods response:", response); // Debug log
      if (Array.isArray(response)) {
        setPaymentMethods(response);
      } else {
        // If no payment methods property, set empty array
        setPaymentMethods([]);
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      // Set empty array on error to show "no payment methods" state
      setPaymentMethods([]);
      showNotification("error", "পেমেন্ট মাধ্যম আনা গেল না");
    }
  };

  const fetchApiKeys = async () => {
    console.log("=== FETCHING API KEYS ===");
    try {
      const apiKeys = await ApiService.getAPIKeys();
      console.log("API Keys fetched:", apiKeys);
      console.log("API Keys length:", apiKeys.length);
      if (apiKeys.length > 0) {
        console.log("First API Key details:", apiKeys[0]);
      }
      setApiKeys(apiKeys);

      // Also fetch usage stats if we have API keys
      if (apiKeys && apiKeys.length > 0) {
        console.log("Fetching usage stats...");
        await fetchUsageStats();
      }
    } catch (error) {
      console.error("Error fetching API keys:", error);
      setApiKeys([]);
      showNotification("error", "API কী আনা গেল না");
    }
  };

  const fetchUsageStats = async () => {
    console.log("=== FETCHING USAGE STATS ===");
    try {
      const stats = await ApiService.getAPIKeyUsageStats();
      console.log("Usage stats fetched:", stats);
      setUsageStats(stats || null);
      setNeedsApiKey(false);
    } catch (error: any) {
      console.error("Error fetching usage stats:", error);
      // Check if the error is about missing API key
      if (error.message && error.message.includes("No API key found")) {
        setNeedsApiKey(true);
        setUsageStats(null);
      } else {
        setNeedsApiKey(false);
        setUsageStats(null);
      }
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;

    setLoading(true);
    try {
      const response = await ApiService.createCategory({
        name: newCategory.trim(),
      });
      if (response.category) {
        setCategories([...categories, response.category]);
        setNewCategory("");
        console.log("Category added successfully");
        showNotification("success", "ক্যাটাগরি যোগ হয়ে গেছে!");
      }
    } catch (error) {
      console.error("Error adding category:", error);
      showNotification("error", "ক্যাটাগরি যোগ করা গেল না। আরেকবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = async (id: number) => {
    setLoading(true);
    try {
      const response = await ApiService.toggleCategory(id);
      if (response.category) {
        setCategories(
          categories.map((cat) =>
            cat.id === id
              ? { ...cat, is_active: response.category.is_active }
              : cat
          )
        );
        console.log("Category toggled successfully");
        showNotification(
          "success",
          `ক্যাটাগরি ${
            response.category.is_active ? "Active" : "Inactive"
          } করা হয়েছে!`
        );
      }
    } catch (error) {
      console.error("Error toggling category:", error);
      showNotification("error", "ক্যাটাগরি বদলানো গেল না। আরেকবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (id: number) => {
    setLoading(true);
    try {
      await ApiService.deleteCategory(id);
      setCategories(categories.filter((cat) => cat.id !== id));
      console.log("Category deleted successfully");
      setDeleteModal({ isOpen: false, category: null });
      showNotification("success", "ক্যাটাগরি ডিলিট হয়ে গেছে!");
    } catch (error) {
      console.error("Error deleting category:", error);
      showNotification("error", "ক্যাটাগরি ডিলিট করা গেল না। আরেকবার চেষ্টা করুন।");
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
  const handleGiftDeleteClick = (gift: {
    id: number;
    name: string;
    is_active: boolean;
  }) => {
    setGiftDeleteModal({ isOpen: true, gift });
  };

  const handleGiftDeleteConfirm = async () => {
    if (giftDeleteModal.gift) {
      try {
        await ApiService.deleteGift(giftDeleteModal.gift.id);
        setGifts(gifts.filter((gift) => gift.id !== giftDeleteModal.gift!.id));
        setGiftDeleteModal({ isOpen: false, gift: null });
        showNotification("success", "গিফট ডিলিট হয়ে গেছে!");
      } catch (error) {
        console.error("Error deleting gift:", error);
        showNotification(
          "error",
          error instanceof Error
            ? error.message
            : "গিফট ডিলিট করা গেল না। আরেকবার চেষ্টা করুন।"
        );
      }
    }
  };

  const handleGiftDeleteCancel = () => {
    setGiftDeleteModal({ isOpen: false, gift: null });
  };

  // Level delete handlers
  const handleLevelDeleteClick = (level: {
    id: number;
    name: string;
    is_active: boolean;
  }) => {
    setLevelDeleteModal({ isOpen: true, level });
  };

  const handleLevelDeleteConfirm = async () => {
    if (levelDeleteModal.level) {
      try {
        await ApiService.deleteLevel(levelDeleteModal.level.id);
        setLevels(
          levels.filter((level) => level.id !== levelDeleteModal.level!.id)
        );
        setLevelDeleteModal({ isOpen: false, level: null });
        showNotification("success", "লেভেল ডিলিট হয়ে গেছে!");
      } catch (error) {
        console.error("Error deleting level:", error);
        showNotification(
          "error",
          error instanceof Error
            ? error.message
            : "লেভেল ডিলিট করা গেল না। আরেকবার চেষ্টা করুন।"
        );
      }
    }
  };

  const handleLevelDeleteCancel = () => {
    setLevelDeleteModal({ isOpen: false, level: null });
  };

  // Brand delete handlers
  const handleBrandDeleteClick = (brand: {
    id: number;
    name: string;
    is_active: boolean;
  }) => {
    setBrandDeleteModal({ isOpen: true, brand });
  };

  const handleBrandDeleteConfirm = async () => {
    if (brandDeleteModal.brand) {
      try {
        await ApiService.deleteBrand(brandDeleteModal.brand.id);
        setBrands(
          brands.filter((brand) => brand.id !== brandDeleteModal.brand!.id)
        );
        setBrandDeleteModal({ isOpen: false, brand: null });
        showNotification("success", "ব্র্যান্ড ডিলিট হয়ে গেছে!");
      } catch (error) {
        console.error("Error deleting brand:", error);
        showNotification(
          "error",
          error instanceof Error
            ? error.message
            : "ব্র্যান্ড ডিলিট করা গেল না। আরেকবার চেষ্টা করুন।"
        );
      }
    }
  };

  const handleBrandDeleteCancel = () => {
    setBrandDeleteModal({ isOpen: false, brand: null });
  };

  // Payment Method delete handlers
  const handlePaymentMethodDeleteClick = (paymentMethod: {
    id: number;
    name: string;
    is_active: boolean;
  }) => {
    setPaymentMethodDeleteModal({ isOpen: true, paymentMethod });
  };

  const handlePaymentMethodDeleteConfirm = async () => {
    if (paymentMethodDeleteModal.paymentMethod) {
      try {
        await ApiService.deletePaymentMethod(
          paymentMethodDeleteModal.paymentMethod.id
        );
        setPaymentMethods(
          paymentMethods.filter(
            (pm) => pm.id !== paymentMethodDeleteModal.paymentMethod!.id
          )
        );
        setPaymentMethodDeleteModal({ isOpen: false, paymentMethod: null });
        showNotification("success", "পেমেন্ট মাধ্যম ডিলিট হয়ে গেছে!");
      } catch (error) {
        console.error("Error deleting payment method:", error);
        showNotification(
          "error",
          error instanceof Error
            ? error.message
            : "পেমেন্ট মাধ্যম ডিলিট করা গেল না। আরেকবার চেষ্টা করুন।"
        );
      }
    }
  };

  const handlePaymentMethodDeleteCancel = () => {
    setPaymentMethodDeleteModal({ isOpen: false, paymentMethod: null });
  };

  // CurrencyContext stays the single source of truth for the selected currency
  const handleCurrencyChange = (code: string) => {
    setCurrency(code, CURRENCY_SYMBOLS[code] || currencySymbol);
  };

  const handleStoreInputChange = (field: keyof StoreForm, value: string) => {
    setStoreForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleStoreSave = async () => {
    try {
      setIsSavingStore(true);
      await ApiService.updateProfile(storeForm);
      await fetchStoreProfile();
      showNotification("success", "স্টোরের তথ্য সেভ হয়ে গেছে!");
    } catch (error) {
      console.error("Failed to update profile:", error);
      showNotification(
        "error",
        "স্টোরের তথ্য সেভ করা গেল না। আরেকবার চেষ্টা করুন।"
      );
    } finally {
      setIsSavingStore(false);
    }
  };

  const handleStoreImageUpload = async (
    type: "logo" | "banner",
    file: File
  ) => {
    try {
      console.log(`Starting ${type} upload...`);

      // Set loading state
      if (type === "logo") {
        setIsUploadingLogo(true);
      } else {
        setIsUploadingBanner(true);
      }

      let response;

      if (type === "logo") {
        response = await ApiService.uploadStoreLogo(file);
        showNotification("success", "স্টোরের লোগো আপলোড হয়ে গেছে!");
      } else {
        response = await ApiService.uploadBannerImage(file);
        showNotification("success", "ব্যানার ছবি আপলোড হয়ে গেছে!");
      }

      console.log(`${type} upload response:`, response);

      // Force refresh profile data after successful upload
      await new Promise((resolve) => setTimeout(resolve, 500)); // Small delay to ensure backend processing
      await fetchStoreProfile();

      console.log(`Profile refreshed after ${type} upload`);
    } catch (error) {
      console.error(`Failed to upload ${type}:`, error);
      showNotification(
        "error",
        type === "logo"
          ? "লোগো আপলোড করা গেল না। আরেকবার চেষ্টা করুন।"
          : "ব্যানার আপলোড করা গেল না। আরেকবার চেষ্টা করুন।"
      );
    } finally {
      // Clear loading state
      if (type === "logo") {
        setIsUploadingLogo(false);
      } else {
        setIsUploadingBanner(false);
      }
    }
  };

  const handleStoreImageRemove = async (type: "logo" | "banner") => {
    try {
      if (type === "logo") {
        await ApiService.removeStoreLogo();
        showNotification("success", "স্টোরের লোগো সরানো হয়েছে!");
      } else {
        await ApiService.removeBannerImage();
        showNotification("success", "ব্যানার ছবি সরানো হয়েছে!");
      }
      await fetchStoreProfile();
    } catch (error) {
      console.error(`Failed to remove ${type}:`, error);
      showNotification(
        "error",
        type === "logo"
          ? "লোগো সরানো গেল না। আরেকবার চেষ্টা করুন।"
          : "ব্যানার সরানো গেল না। আরেকবার চেষ্টা করুন।"
      );
    }
  };

  const handleGeneralSettingsSave = async () => {
    setLoading(true);
    try {
      const response = await ApiService.updateSettings({
        language: generalSettings.language,
        currency: currency,
        email_notifications: generalSettings.email_notifications,
        marketing_notifications: generalSettings.marketing_notifications,
      });

      console.log("General settings saved:", response);

      // Refresh currency context to update symbol across the app
      await refreshCurrency();

      showNotification("success", "সেটিংস সেভ হয়ে গেছে!");
    } catch (error) {
      console.error("Error saving general settings:", error);
      showNotification("error", "সেটিংস সেভ করা গেল না। আরেকবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (securitySettings.newPassword !== securitySettings.confirmPassword) {
      showNotification("error", "নতুন পাসওয়ার্ড দুটো মিলছে না");
      return;
    }

    if (securitySettings.newPassword.length < 8) {
      showNotification("error", "পাসওয়ার্ড অন্তত 8 অক্ষরের হতে হবে");
      return;
    }

    setLoading(true);
    try {
      const response = await ApiService.changePassword({
        current_password: securitySettings.currentPassword,
        new_password: securitySettings.newPassword,
        confirm_password: securitySettings.confirmPassword,
      });

      console.log("Password changed successfully:", response);
      setSecuritySettings({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      showNotification("success", "পাসওয়ার্ড বদলে গেছে!");
    } catch (error) {
      console.error("Error changing password:", error);
      showNotification(
        "error",
        error instanceof Error
          ? error.message
          : "পাসওয়ার্ড বদলানো গেল না। আরেকবার চেষ্টা করুন।"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCustomDomainSave = async (settings: any) => {
    setLoading(true);
    try {
      // The API call is now handled within the CustomDomainSettings component
      // This function is kept for compatibility but the actual save happens in the component
      showNotification("success", "ডোমেইনের সেটিংস সেভ হয়ে গেছে!");
    } catch (error) {
      console.error("Error saving custom domain settings:", error);
      showNotification("error", "ডোমেইনের সেটিংস সেভ করা গেল না!");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // API Key functions
  const handleCreateApiKey = async () => {
    setLoading(true);
    try {
      const apiKey = await ApiService.createAPIKey({
        name: "My API Key", // Default name since it's not user-provided anymore
      });
      // Since users can only have one API key, replace the array
      setApiKeys([apiKey]);
      setShowApiKeyValue(apiKey.id);
      showNotification("success", "API কী বানানো হয়ে গেছে!");
      // Refresh usage stats
      fetchUsageStats();
    } catch (error) {
      console.error("Error creating API key:", error);
      showNotification("error", "API কী বানানো গেল না। আরেকবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  const toggleApiKey = async (id: number) => {
    setLoading(true);
    try {
      const apiKey = apiKeys.find((key) => key.id === id);
      if (!apiKey) return;

      const updatedApiKey = await ApiService.updateAPIKey(id, {
        is_active: !apiKey.is_active,
      });
      // Update the single API key
      setApiKeys([updatedApiKey]);
      showNotification(
        "success",
        `API কী ${
          updatedApiKey.is_active ? "Active" : "Inactive"
        } করা হয়েছে!`
      );
    } catch (error) {
      console.error("Error toggling API key:", error);
      showNotification("error", "API কী বদলানো গেল না। আরেকবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  const regenerateApiKey = async () => {
    setLoading(true);
    try {
      const apiKey = await ApiService.regenerateAPIKey();
      // Update the single API key
      setApiKeys([apiKey]);
      setShowApiKeyValue(apiKey.id);
      showNotification("success", "নতুন API কী বানানো হয়ে গেছে!");
    } catch (error) {
      console.error("Error regenerating API key:", error);
      showNotification(
        "error",
        "নতুন API কী বানানো গেল না। আরেকবার চেষ্টা করুন।"
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteApiKey = async (id: number) => {
    setLoading(true);
    try {
      await ApiService.deleteAPIKey(id);
      setApiKeys([]); // Clear the single API key
      setApiKeyDeleteModal({ isOpen: false, apiKey: null });
      showNotification("success", "API কী ডিলিট হয়ে গেছে!");
      // Refresh usage stats
      fetchUsageStats();
    } catch (error) {
      console.error("Error deleting API key:", error);
      showNotification("error", "API কী ডিলিট করা গেল না। আরেকবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    if (!text) {
      showNotification("error", "কপি করার মতো কোনো API কী নেই");
      return;
    }

    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopySuccess(true);
        showNotification("success", "API কী কপি হয়ে গেছে!");
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
        showNotification("error", "API কী কপি করা গেল না");
      });
  };

  const handleApiKeyDeleteClick = (apiKey: APIKey) => {
    setApiKeyDeleteModal({ isOpen: true, apiKey });
  };

  const handleApiKeyDeleteConfirm = () => {
    if (apiKeyDeleteModal.apiKey) {
      deleteApiKey(apiKeyDeleteModal.apiKey.id);
    }
  };

  const handleApiKeyDeleteCancel = () => {
    setApiKeyDeleteModal({ isOpen: false, apiKey: null });
  };

  // Gift functions
  const tabs = [
    { id: "store", label: "স্টোর" },
    { id: "categories", label: "ক্যাটাগরি" },
    { id: "general", label: "সাধারণ" },
    { id: "roles", label: "রোল সেটিংস" },
    { id: "api-keys", label: "API কী" },
    { id: "gift", label: "গিফট" },
    { id: "achievements", label: "অ্যাচিভমেন্ট" },
    { id: "levels", label: "লেভেল" },
    { id: "brand", label: "ব্র্যান্ড" },
    { id: "payment-methods", label: "পেমেন্ট মাধ্যম" },
  ];

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">সেটিংস</h1>
          <p className="page-sub">
            স্টোরের সব সেটিং একজায়গায় — ক্যাটাগরি, টাকার টাইপ, ভাষা, স্টোরের তথ্য,
            পাসওয়ার্ড আর API
          </p>
        </div>
      </header>

      {/* Notification */}
      {notification.isVisible && (
        <div
          className={`mb-3 flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
            notification.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
          role="status"
        >
          <svg
            className="mt-0.5 h-4 w-4 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={notification.type === "success" ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"}
            />
          </svg>
          <p className="font-medium">{notification.message}</p>
        </div>
      )}

      <div className="plane">
        {/* Tabs live at the top of the same plane */}
        <div className="plane-section">
          <div className="flex flex-wrap items-center gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`btn btn-sm ${activeTab === tab.id ? "btn-primary" : "btn-ghost"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Categories */}
        {activeTab === "categories" && (
          <>
            <div className="plane-section">
              <div className="section-title">নতুন ক্যাটাগরি</div>
              <div className="flex max-w-md flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="input"
                  placeholder="ক্যাটাগরির নাম"
                  aria-label="ক্যাটাগরির নাম"
                />
                <button
                  onClick={handleAddCategory}
                  disabled={loading || !newCategory.trim()}
                  className="btn btn-primary sm:w-auto"
                >
                  যোগ করুন
                </button>
              </div>
            </div>

            <div className="plane-section">
              <div className="section-title">ক্যাটাগরির তালিকা</div>
              {categories.length === 0 ? (
                <div className="empty">এখনো কোনো ক্যাটাগরি নেই। উপরে থেকে প্রথমটা যোগ করুন।</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5"
                    >
                      <button
                        className={`badge ${category.is_active ? "badge-success" : "badge-muted"}`}
                        onClick={() => toggleCategory(category.id)}
                        title="Active/Inactive করতে চাপ দিন"
                      >
                        {category.is_active ? "Active" : "Inactive"}
                      </button>
                      <span className="whitespace-nowrap text-sm font-medium text-slate-900">
                        {category.name}
                      </span>
                      <button
                        onClick={() => handleDeleteClick(category)}
                        className="text-slate-500 transition-colors hover:text-rose-600"
                        title="ক্যাটাগরি ডিলিট করুন"
                        aria-label="ক্যাটাগরি ডিলিট করুন"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* General */}
        {activeTab === "general" && (
          <>
            {/* Currency — reads and writes CurrencyContext directly */}
            <div className="plane-section">
              <div className="section-title">টাকার টাইপ</div>
              <div className="max-w-md">
                <label className="label" htmlFor="setting-currency">
                  কোন মুদ্রায় হিসাব দেখবেন
                </label>
                <select
                  id="setting-currency"
                  value={currency}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  className="select"
                >
                  <option value="USD">USD - ইউএস ডলার</option>
                  <option value="EUR">EUR - ইউরো</option>
                  <option value="GBP">GBP - ব্রিটিশ পাউন্ড</option>
                  <option value="JPY">JPY - জাপানি ইয়েন</option>
                  <option value="CAD">CAD - কানাডিয়ান ডলার</option>
                  <option value="AUD">AUD - অস্ট্রেলিয়ান ডলার</option>
                  <option value="CHF">CHF - সুইস ফ্রাঁ</option>
                  <option value="CNY">CNY - চাইনিজ ইউয়ান</option>
                  <option value="BDT">BDT - বাংলাদেশি টাকা</option>
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  এখন দেখাচ্ছে{" "}
                  <span className="num">
                    {currency} ({currencySymbol})
                  </span>{" "}
                  — সেভ করলে অ্যাপের সব দাম আর হিসাব এই মুদ্রায় দেখাবে
                </p>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleGeneralSettingsSave}
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? "সেভ হচ্ছে…" : "সেভ করুন"}
                </button>
              </div>
            </div>

            <div className="plane-section">
              <div className="section-title">ভাষা</div>
              <div className="max-w-md">
                <label className="label" htmlFor="setting-language">
                  অ্যাপের ভাষা
                </label>
                <select
                  id="setting-language"
                  value={generalSettings.language}
                  onChange={(e) =>
                    setGeneralSettings({
                      ...generalSettings,
                      language: e.target.value,
                    })
                  }
                  className="select"
                >
                  <option value="en">ইংরেজি</option>
                  <option value="bn">বাংলা</option>
                </select>
                <p className="mt-1 text-xs text-slate-500">অ্যাপের লেখা কোন ভাষায় দেখবেন</p>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleGeneralSettingsSave}
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? "সেভ হচ্ছে…" : "সেভ করুন"}
                </button>
              </div>
            </div>

            <div className="plane-section">
              <div className="section-title">পাসওয়ার্ড বদলান</div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="label" htmlFor="current-password">এখনকার পাসওয়ার্ড</label>
                  <input
                    id="current-password"
                    type="password"
                    value={securitySettings.currentPassword}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        currentPassword: e.target.value,
                      })
                    }
                    className="input"
                    placeholder="এখন যেটা ব্যবহার করছেন"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="new-password">নতুন পাসওয়ার্ড</label>
                  <input
                    id="new-password"
                    type="password"
                    value={securitySettings.newPassword}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        newPassword: e.target.value,
                      })
                    }
                    className="input"
                    placeholder="নতুন পাসওয়ার্ড লিখুন"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="confirm-password">নতুন পাসওয়ার্ড আবার</label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={securitySettings.confirmPassword}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="input"
                    placeholder="মিলিয়ে দেখার জন্য আবার লিখুন"
                  />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  পাসওয়ার্ড অন্তত 8 অক্ষরের হতে হবে
                </div>
                <button
                  onClick={handlePasswordChange}
                  disabled={
                    loading ||
                    !securitySettings.currentPassword ||
                    !securitySettings.newPassword ||
                    !securitySettings.confirmPassword
                  }
                  className="btn btn-primary"
                >
                  {loading ? "বদলানো হচ্ছে…" : "পাসওয়ার্ড বদলান"}
                </button>
              </div>
            </div>

            <CustomDomainSettings loading={loading} onSave={handleCustomDomainSave} />
          </>
        )}

        {/* Store details and images */}
        {activeTab === "store" && (
          <>
            {!storeProfile ? (
              <div className="plane-section">
                <div className="empty">স্টোরের তথ্য লোড হচ্ছে…</div>
              </div>
            ) : (
              <>
                <div className="plane-section">
                  <div className="section-title">স্টোরের তথ্য</div>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="label" htmlFor="store-company">
                        স্টোরের নাম
                      </label>
                      <input
                        id="store-company"
                        type="text"
                        value={storeForm.company}
                        onChange={(e) =>
                          handleStoreInputChange("company", e.target.value)
                        }
                        className="input"
                        placeholder="স্টোরের নাম লিখুন"
                      />
                    </div>
                    <div>
                      <label className="label" htmlFor="store-company-address">
                        স্টোরের ঠিকানা
                      </label>
                      <textarea
                        id="store-company-address"
                        value={storeForm.company_address}
                        onChange={(e) =>
                          handleStoreInputChange(
                            "company_address",
                            e.target.value
                          )
                        }
                        className="textarea resize-none"
                        placeholder="স্টোরের ঠিকানা লিখুন"
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={handleStoreSave}
                      disabled={isSavingStore}
                      className="btn btn-primary"
                    >
                      {isSavingStore ? "সেভ হচ্ছে…" : "সেভ করুন"}
                    </button>
                  </div>
                </div>

                <div className="plane-section">
                  <div className="section-title">স্টোরের ছবি</div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Store logo */}
                    <div>
                      <span className="label">স্টোরের লোগো</span>
                      <div className="group relative flex h-32 w-full items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-slate-200 bg-slate-50">
                        {isUploadingLogo ? (
                          <div className="text-center text-sm text-slate-500">
                            লোগো আপলোড হচ্ছে…
                          </div>
                        ) : storeProfile.profile.store_logo ? (
                          <div className="relative h-full w-full overflow-hidden">
                            <OptimizedImage
                              src={storeProfile.profile.store_logo}
                              alt="স্টোরের লোগো"
                              className="h-full w-full max-w-full max-h-full rounded-lg object-contain"
                              fallbackText="লোগো দেখানো গেল না"
                            />
                            <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-lg bg-white/50 opacity-0 transition-opacity group-hover:opacity-100">
                              <label
                                className={`btn btn-ghost btn-sm ${
                                  isUploadingLogo ? "opacity-50" : ""
                                }`}
                              >
                                বদলান
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  disabled={isUploadingLogo}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file && !isUploadingLogo)
                                      handleStoreImageUpload("logo", file);
                                  }}
                                />
                              </label>
                              <button
                                onClick={() => handleStoreImageRemove("logo")}
                                className="btn btn-danger btn-sm"
                              >
                                সরান
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label
                            className={`flex h-full w-full cursor-pointer items-center justify-center ${
                              isUploadingLogo ? "opacity-50" : ""
                            }`}
                          >
                            <div className="text-center">
                              <p className="mb-2 text-sm text-slate-500">
                                কোনো লোগো দেওয়া নেই
                              </p>
                              <span className="btn btn-primary btn-sm">লোগো দিন</span>
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={isUploadingLogo}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file && !isUploadingLogo)
                                  handleStoreImageUpload("logo", file);
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Banner image */}
                    <div>
                      <span className="label">ব্যানার ছবি</span>
                      <div className="group relative flex h-32 w-full items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-slate-200 bg-slate-50">
                        {isUploadingBanner ? (
                          <div className="text-center text-sm text-slate-500">
                            ব্যানার আপলোড হচ্ছে…
                          </div>
                        ) : storeProfile.profile.banner_image ? (
                          <div className="relative h-full w-full overflow-hidden">
                            <OptimizedImage
                              src={storeProfile.profile.banner_image}
                              alt="ব্যানার ছবি"
                              className="h-full w-full max-w-full max-h-full rounded-lg object-cover"
                              fallbackText="ব্যানার দেখানো গেল না"
                            />
                            <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-lg bg-white/50 opacity-0 transition-opacity group-hover:opacity-100">
                              <label
                                className={`btn btn-ghost btn-sm ${
                                  isUploadingBanner ? "opacity-50" : ""
                                }`}
                              >
                                বদলান
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  disabled={isUploadingBanner}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file && !isUploadingBanner)
                                      handleStoreImageUpload("banner", file);
                                  }}
                                />
                              </label>
                              <button
                                onClick={() => handleStoreImageRemove("banner")}
                                className="btn btn-danger btn-sm"
                              >
                                সরান
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label
                            className={`flex h-full w-full cursor-pointer items-center justify-center ${
                              isUploadingBanner ? "opacity-50" : ""
                            }`}
                          >
                            <div className="text-center">
                              <p className="mb-2 text-sm text-slate-500">
                                কোনো ব্যানার দেওয়া নেই
                              </p>
                              <span className="btn btn-primary btn-sm">ব্যানার দিন</span>
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={isUploadingBanner}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file && !isUploadingBanner)
                                  handleStoreImageUpload("banner", file);
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* API keys */}
        {activeTab === "api-keys" && (
          <>
            {usageStats && (
              <div className="stat-strip">
                <div className="stat">
                  <div className="stat-label">মোট রিকোয়েস্ট</div>
                  <div className="stat-value num">
                    {usageStats.stats_last_30_days?.total_requests?.toLocaleString() || "0"}
                  </div>
                  <div className="stat-meta">গত 30 দিনে</div>
                </div>
                <div className="stat">
                  <div className="stat-label">সফল</div>
                  <div className="stat-value num money-pos">
                    {usageStats.stats_last_30_days?.successful_requests?.toLocaleString() || "0"}
                  </div>
                  <div className="stat-meta">ঠিকমতো হয়েছে</div>
                </div>
                <div className="stat">
                  <div className="stat-label">ব্যর্থ</div>
                  <div className="stat-value num money-neg">
                    {usageStats.stats_last_30_days?.failed_requests?.toLocaleString() || "0"}
                  </div>
                  <div className="stat-meta">হয়নি</div>
                </div>
                <div className="stat">
                  <div className="stat-label">সফলতার হার</div>
                  <div className="stat-value num">
                    {usageStats.stats_last_30_days?.success_rate?.toFixed(1) || "0"}%
                  </div>
                  <div className="stat-meta">গড় হিসাব</div>
                </div>
              </div>
            )}

            {apiKeys.length === 0 && (
              <div className="plane-section">
                <div className="section-title">API কী বানান</div>
                <button
                  onClick={handleCreateApiKey}
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? (
                    <>
                      <svg
                        className="h-4 w-4 animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      বানানো হচ্ছে…
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
                        />
                      </svg>
                      API কী বানান
                    </>
                  )}
                </button>
                <p className="mt-2 text-xs text-slate-500">
                  একটা অ্যাকাউন্টে একটাই API কী রাখা যায়। নতুন বানালে আগেরটা বাতিল হয়ে যাবে।
                </p>
              </div>
            )}

            <div className="plane-section">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="section-title">আপনার API কী</div>
                {apiKeys.length > 0 && (
                  <button onClick={regenerateApiKey} disabled={loading} className="btn btn-ghost btn-sm">
                    নতুন করে বানান
                  </button>
                )}
              </div>

              {apiKeys.length === 0 ? (
                <div className="empty">
                  <svg
                    className="mx-auto mb-3 h-10 w-10 text-slate-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
                    />
                  </svg>
                  <div className="mb-1 font-medium text-slate-600">এখনো কোনো API কী বানানো হয়নি</div>
                  <div>নিজের প্রোগ্রাম থেকে প্রোডাক্টের তথ্য নিতে চাইলে প্রথম কী-টা বানিয়ে নিন।</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {apiKeys.map((apiKey) => (
                    <div key={apiKey.id}>
                      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h5 className="font-medium text-slate-900">{apiKey.name}</h5>
                          <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-slate-500">
                            <span className="num">
                              বানানো হয়েছে {new Date(apiKey.created_at).toLocaleDateString()}
                            </span>
                            {apiKey.last_used && (
                              <span className="num">
                                শেষ ব্যবহার {new Date(apiKey.last_used).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            className={`badge ${apiKey.is_active ? "badge-success" : "badge-muted"}`}
                            onClick={() => toggleApiKey(apiKey.id)}
                            title="Active/Inactive করতে চাপ দিন"
                          >
                            {apiKey.is_active ? "Active" : "Inactive"}
                          </button>
                          <button
                            onClick={() => handleApiKeyDeleteClick(apiKey)}
                            className="text-slate-500 transition-colors hover:text-rose-600"
                            title="API কী ডিলিট করুন"
                            aria-label="API কী ডিলিট করুন"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="label">API কী</div>
                            {showApiKeyValue === apiKey.id ? (
                              <div className="break-all font-mono text-sm text-slate-900">
                                {apiKey.key}
                              </div>
                            ) : (
                              <div className="font-mono text-sm text-slate-500">
                                pak_••••••••••••••••••••••••••••••••
                              </div>
                            )}
                          </div>
                          <div className="flex flex-shrink-0 gap-2">
                            <button
                              onClick={() =>
                                setShowApiKeyValue(
                                  showApiKeyValue === apiKey.id ? null : apiKey.id
                                )
                              }
                              className="btn btn-ghost btn-sm"
                              title={showApiKeyValue === apiKey.id ? "কী লুকান" : "কী দেখুন"}
                              aria-label={showApiKeyValue === apiKey.id ? "কী লুকান" : "কী দেখুন"}
                            >
                              {showApiKeyValue === apiKey.id ? (
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                                  />
                                </svg>
                              ) : (
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                </svg>
                              )}
                            </button>
                            <button
                              onClick={() => copyToClipboard(apiKey.key)}
                              className="btn btn-ghost btn-sm"
                              title="API কী কপি করুন"
                              aria-label="API কী কপি করুন"
                            >
                              {copySuccess ? (
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              ) : (
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                  />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                        <div>
                          <span className="text-slate-500">ঘণ্টায় সর্বোচ্চ:</span>
                          <span className="num ml-2 text-slate-900">
                            {apiKey.requests_per_hour?.toLocaleString() || "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">দিনে সর্বোচ্চ:</span>
                          <span className="num ml-2 text-slate-900">
                            {apiKey.requests_per_day?.toLocaleString() || "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <ApiDocs />
          </>
        )}

        {/* Gift */}
        {/* Role settings — who may sign in and what they may do */}
        {activeTab === "roles" && <RoleSettingsTab />}

        {activeTab === "gift" && (
          <GiftsTab
            gifts={gifts}
            setGifts={setGifts}
            showNotification={showNotification}
            loading={loading}
            onDeleteClick={handleGiftDeleteClick}
          />
        )}

        {/* Achievements */}
        {activeTab === "achievements" && (
          <AchievementsTab
            achievements={achievements}
            setAchievements={setAchievements}
            showNotification={showNotification}
            loading={loading}
            onRefresh={fetchAchievements}
          />
        )}

        {/* Levels */}
        {activeTab === "levels" && (
          <LevelTab
            levels={levels}
            setLevels={setLevels}
            showNotification={showNotification}
            loading={loading}
            onDeleteClick={handleLevelDeleteClick}
          />
        )}

        {/* Brand */}
        {activeTab === "brand" && (
          <BrandTab
            brands={brands}
            setBrands={setBrands}
            showNotification={showNotification}
            loading={loading}
            onDeleteClick={handleBrandDeleteClick}
          />
        )}

        {/* Payment methods */}
        {activeTab === "payment-methods" && (
          <PaymentMethodsTab
            paymentMethods={paymentMethods}
            setPaymentMethods={setPaymentMethods}
            showNotification={showNotification}
            loading={loading}
            onDeleteClick={handlePaymentMethodDeleteClick}
          />
        )}
      </div>

      {/* Delete confirmations */}
      {deleteModal.isOpen && (
        <ConfirmDelete
          title="ক্যাটাগরি ডিলিট করবেন?"
          name={deleteModal.category?.name}
          note="একবার মুছে ফেললে এই ক্যাটাগরিটা আর ফেরত আসবে না।"
          loading={loading}
          onCancel={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
        />
      )}

      {giftDeleteModal.isOpen && (
        <ConfirmDelete
          title="গিফট ডিলিট করবেন?"
          name={giftDeleteModal.gift?.name}
          note="একবার মুছে ফেললে এই গিফটটা আর ফেরত আসবে না।"
          loading={loading}
          onCancel={handleGiftDeleteCancel}
          onConfirm={handleGiftDeleteConfirm}
        />
      )}

      {levelDeleteModal.isOpen && (
        <ConfirmDelete
          title="লেভেল ডিলিট করবেন?"
          name={levelDeleteModal.level?.name}
          note="একবার মুছে ফেললে এই লেভেলটা আর ফেরত আসবে না।"
          loading={loading}
          onCancel={handleLevelDeleteCancel}
          onConfirm={handleLevelDeleteConfirm}
        />
      )}

      {brandDeleteModal.isOpen && (
        <ConfirmDelete
          title="ব্র্যান্ড ডিলিট করবেন?"
          name={brandDeleteModal.brand?.name}
          note="একবার মুছে ফেললে এই ব্র্যান্ডটা আর ফেরত আসবে না।"
          loading={loading}
          onCancel={handleBrandDeleteCancel}
          onConfirm={handleBrandDeleteConfirm}
        />
      )}

      {paymentMethodDeleteModal.isOpen && (
        <ConfirmDelete
          title="পেমেন্ট মাধ্যম ডিলিট করবেন?"
          name={paymentMethodDeleteModal.paymentMethod?.name}
          note="একবার মুছে ফেললে এই পেমেন্ট মাধ্যমটা আর ফেরত আসবে না।"
          loading={loading}
          onCancel={handlePaymentMethodDeleteCancel}
          onConfirm={handlePaymentMethodDeleteConfirm}
        />
      )}

      {apiKeyDeleteModal.isOpen && (
        <ConfirmDelete
          title="API কী ডিলিট করবেন?"
          name={apiKeyDeleteModal.apiKey?.name}
          note="মুছে ফেললে এই কী দিয়ে চলা সব অ্যাপ সাথে সাথে বন্ধ হয়ে যাবে।"
          loading={loading}
          onCancel={handleApiKeyDeleteCancel}
          onConfirm={handleApiKeyDeleteConfirm}
        />
      )}
    </div>
  );
}
