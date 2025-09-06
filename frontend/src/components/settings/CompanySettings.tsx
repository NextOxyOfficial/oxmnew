"use client";

import { useState, useEffect } from "react";
import { Building, Save, Check } from "lucide-react";

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
    <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
          <Building className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-200">Company Information</h2>
          <p className="text-slate-400 text-sm">
            Configure your company details for invoices and documents
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Company Name */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Company Name *
          </label>
          <input
            type="text"
            value={settings.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder="Your Company Name"
            className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Street Address *
          </label>
          <input
            type="text"
            value={settings.address}
            onChange={(e) => handleInputChange("address", e.target.value)}
            placeholder="123 Business Street"
            className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
          />
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            City, State & ZIP *
          </label>
          <input
            type="text"
            value={settings.city}
            onChange={(e) => handleInputChange("city", e.target.value)}
            placeholder="City, State 12345"
            className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
          />
        </div>

        {/* Phone & Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              value={settings.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              placeholder="(555) 123-4567"
              className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="info@yourcompany.com"
              className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
            />
          </div>
        </div>

        {/* Website */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Website (Optional)
          </label>
          <input
            type="url"
            value={settings.website}
            onChange={(e) => handleInputChange("website", e.target.value)}
            placeholder="www.yourcompany.com"
            className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-slate-700/50">
          <button
            onClick={handleSave}
            disabled={isLoading || !settings.name || !settings.address || !settings.city || !settings.phone || !settings.email}
            className={`px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200 shadow-lg flex items-center gap-2 ${
              isLoading || !settings.name || !settings.address || !settings.city || !settings.phone || !settings.email
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer"
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
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
                Saving...
              </>
            ) : isSaved ? (
              <>
                <Check className="w-4 h-4" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info Note */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-400/30 rounded-lg">
        <p className="text-blue-300 text-sm">
          <span className="font-semibold">Note:</span> This information will appear on all your 
          invoices and official documents. Make sure all details are accurate and up-to-date.
        </p>
      </div>
    </div>
  );
}
