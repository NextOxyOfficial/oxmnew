"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { ApiService, AuthToken } from "@/lib/api";

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  date_joined?: string;
  last_login?: string;
  is_active?: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
}

interface UserProfile {
  company?: string;
  company_address?: string;
  phone?: string;
  contact_number?: string;
  address?: string;
  city?: string;
  post_code?: string;
  store_logo?: string;
  banner_image?: string;
  sms_credits?: number;
  created_at?: string;
  updated_at?: string;
}

interface UserSettings {
  language?: string;
  currency?: string;
  currency_symbol?: string;
  email_notifications?: boolean;
  marketing_notifications?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  settings: UserSettings | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isAuthenticated: boolean;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  // Profile fields
  company?: string;
  phone?: string;
  address?: string;
  city?: string;
  post_code?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  const checkAuth = useCallback(async () => {
    // Only check auth after component is mounted
    if (!mounted) return;

    try {
      // First check if we have a token before making API call
      const token = AuthToken.get();
      if (!token) {
        setLoading(false);
        return;
      }

      if (ApiService.isAuthenticated()) {
        const profileData = await ApiService.getProfile();
        setUser(profileData.user);
        setProfile(profileData.profile);
        setSettings(profileData.settings);
      }
    } catch {
      // Token might be invalid, remove it
      AuthToken.remove();
      setUser(null);
      setProfile(null);
      setSettings(null);
    } finally {
      setLoading(false);
    }
  }, [mounted]);

  // Only run auth check after component is mounted
  useEffect(() => {
    if (mounted) {
      checkAuth();
    }
  }, [mounted, checkAuth]);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const response = await ApiService.login({ username, password });
      setUser(response.user);
      setProfile(response.profile);
      setSettings(response.settings);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    setLoading(true);
    try {
      const response = await ApiService.register(userData);
      setUser(response.user);
      setProfile(response.profile);
      setSettings(response.settings);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await ApiService.logout();
    } catch (error) {
      // Even if logout fails on server, clear local state
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setProfile(null);
      setSettings(null);
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    try {
      if (ApiService.isAuthenticated()) {
        const profileData = await ApiService.getProfile();
        setUser(profileData.user);
        setProfile(profileData.profile);
        setSettings(profileData.settings);
      }
    } catch (error) {
      console.error("Failed to refresh profile:", error);
    }
  };

  const value = {
    user,
    profile,
    settings,
    loading: loading || !mounted, // Keep loading true until mounted
    login,
    register,
    logout,
    refreshProfile,
    isAuthenticated: mounted && !!user, // Only show as authenticated after mounting
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
