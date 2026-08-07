"use client";

import { useState, useEffect } from "react";
import { Save, Check } from "lucide-react";

interface CompanySettings {
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  website?: string;
  logo?: string;
}

export default function CompanySettingsComponent() {
  const [settings, setSettings] = useState<CompanySettings>({
    name: "",
    address: "",
    city: "",
    phone: "",
    email: "",
    website: "",
    logo: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("companySettings");
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
      } catch (error) {
        console.error("Error parsing company settings:", error);
      }
    }
  }, []);

  const handleInputChange = (field: keyof CompanySettings, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Save to localStorage (you can replace this with API call)
      localStorage.setItem("companySettings", JSON.stringify(settings));

      // Here you would normally make an API call to save to your backend
      // await ApiService.updateCompanySettings(settings);

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error("Error saving company settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="plane">
      <div className="plane-section">
        <div className="section-title">স্টোরের তথ্য</div>
        <p className="text-xs text-slate-500">
          ইনভয়েস আর কাগজপত্রে স্টোরের যে তথ্য বসবে সেটা এখানে দিন
        </p>
      </div>

      <div className="plane-section">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="company-name">স্টোরের নাম *</label>
            <input
              id="company-name"
              type="text"
              value={settings.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="আপনার স্টোরের নাম"
              className="input"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="label" htmlFor="company-address">ঠিকানা *</label>
            <input
              id="company-address"
              type="text"
              value={settings.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="রোড, বাড়ি নম্বর"
              className="input"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="label" htmlFor="company-city">এলাকা, জেলা ও পোস্ট কোড *</label>
            <input
              id="company-city"
              type="text"
              value={settings.city}
              onChange={(e) => handleInputChange("city", e.target.value)}
              placeholder="যেমন: মিরপুর, ঢাকা 1216"
              className="input"
            />
          </div>

          <div>
            <label className="label" htmlFor="company-phone">ফোন নম্বর *</label>
            <input
              id="company-phone"
              type="tel"
              value={settings.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              placeholder="017xxxxxxxx"
              className="input"
            />
          </div>

          <div>
            <label className="label" htmlFor="company-email">ইমেইল *</label>
            <input
              id="company-email"
              type="email"
              value={settings.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="info@yourshop.com"
              className="input"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="label" htmlFor="company-website">ওয়েবসাইট (না দিলেও চলবে)</label>
            <input
              id="company-website"
              type="url"
              value={settings.website}
              onChange={(e) => handleInputChange("website", e.target.value)}
              placeholder="www.yourshop.com"
              className="input"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isLoading || !settings.name || !settings.address || !settings.city || !settings.phone || !settings.email}
            className="btn btn-primary"
          >
            {isLoading ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
                সেভ হচ্ছে…
              </>
            ) : isSaved ? (
              <>
                <Check className="h-4 w-4" />
                সেভ হয়ে গেছে!
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                সেভ করুন
              </>
            )}
          </button>
        </div>
      </div>

      <div className="plane-section">
        <p className="text-xs text-slate-500">
          এই তথ্যগুলো আপনার সব ইনভয়েস আর অফিসিয়াল কাগজে দেখা যাবে, তাই সব ঠিকঠাক আছে কিনা মিলিয়ে নিন।
        </p>
      </div>
    </div>
  );
}
