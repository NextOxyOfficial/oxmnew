"use client";

import { useState, useEffect } from "react";
import { ApiService } from "../../../lib/api";

interface ProfileData {
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    date_joined: string;
    last_login: string;
    is_active: boolean;
    is_staff: boolean;
    is_superuser: boolean;
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
    created_at: string;
    updated_at: string;
  };
  settings: {
    language: string;
    currency: string;
    currency_symbol: string;
    email_notifications: boolean;
    marketing_notifications: boolean;
    created_at: string;
    updated_at: string;
  };
}

// Read-only value box that matches the input height, so rows stay aligned
function ReadOnlyValue({
  value,
  multiline = false,
}: {
  value?: string;
  multiline?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm ${
        value ? "text-slate-900" : "text-slate-400"
      } ${multiline ? "min-h-[80px] whitespace-pre-wrap" : ""}`}
    >
      {value || "দেওয়া নেই"}
    </div>
  );
}

export default function ProfilePage() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{
    isVisible: boolean;
    type: "success" | "error";
    message: string;
  }>({ isVisible: false, type: "success", message: "" });
  // The store fields (company, company_address) are edited in Settings now, but
  // they stay in this form so the updateProfile payload is sent back unchanged.
  const [editForm, setEditForm] = useState({
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

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ isVisible: true, type, message });
    setTimeout(() => {
      setNotification({ isVisible: false, type: "success", message: "" });
    }, 5000);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await ApiService.getProfile();
      setProfileData(data);
      setEditForm({
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
      showNotification(
        "error",
        "প্রোফাইলের তথ্য আনা গেল না। পেজটা একবার রিফ্রেশ করুন।"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (profileData) {
      setEditForm({
        first_name: profileData.user.first_name || "",
        last_name: profileData.user.last_name || "",
        email: profileData.user.email || "",
        company: profileData.profile.company || "",
        company_address: profileData.profile.company_address || "",
        phone: profileData.profile.phone || "",
        contact_number: profileData.profile.contact_number || "",
        address: profileData.profile.address || "",
        city: profileData.profile.city || "",
        post_code: profileData.profile.post_code || "",
      });
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await ApiService.updateProfile(editForm);
      await fetchProfile();
      setIsEditing(false);
      showNotification("success", "প্রোফাইল সেভ হয়ে গেছে!");
    } catch (error) {
      console.error("Failed to update profile:", error);
      showNotification("error", "প্রোফাইল সেভ করা গেল না। আরেকবার চেষ্টা করুন।");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <div className="page">
        <header className="page-head">
          <div>
            <h1 className="page-title">প্রোফাইল</h1>
            <p className="page-sub">নিজের অ্যাকাউন্টের তথ্য</p>
          </div>
        </header>
        <div className="plane">
          <div className="empty">প্রোফাইল লোড হচ্ছে…</div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="page">
        <header className="page-head">
          <div>
            <h1 className="page-title">প্রোফাইল</h1>
            <p className="page-sub">নিজের অ্যাকাউন্টের তথ্য</p>
          </div>
        </header>
        <div className="plane">
          <div className="empty"><span className="text-rose-600">প্রোফাইলের তথ্য আনা গেল না।</span></div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">প্রোফাইল</h1>
          <p className="page-sub">
            নিজের নাম, ইমেইল আর যোগাযোগের তথ্য এখানে দেখুন আর বদলান — স্টোরের সেটিং
            আছে সেটিংস পেজে
          </p>
        </div>
        {!isEditing ? (
          <button onClick={handleEdit} className="btn btn-primary">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            এডিট করুন
          </button>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button onClick={handleCancel} disabled={isSaving} className="btn btn-ghost">
              বাতিল
            </button>
            <button onClick={handleSave} disabled={isSaving} className="btn btn-primary">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                />
              </svg>
              {isSaving ? "সেভ হচ্ছে…" : "সেভ করুন"}
            </button>
          </div>
        )}
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
        {/* Account snapshot */}
        <div className="stat-strip">
          <div className="stat">
            <div className="stat-label">অ্যাকাউন্টের অবস্থা</div>
            <div className="stat-value text-base">
              <span className={`badge ${profileData.user.is_active ? "badge-success" : "badge-danger"}`}>
                {profileData.user.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="stat-meta">
              {profileData.user.is_superuser
                ? "সুপার অ্যাডমিন"
                : profileData.user.is_staff
                ? "স্টাফ"
                : "সাধারণ ইউজার"}
            </div>
          </div>
          <div className="stat">
            <div className="stat-label">সদস্য হয়েছেন</div>
            <div className="stat-value num text-base">
              {new Date(profileData.user.date_joined).toLocaleDateString()}
            </div>
            <div className="stat-meta">এই দিন থেকে</div>
          </div>
          <div className="stat">
            <div className="stat-label">শেষ লগইন</div>
            <div className="stat-value num text-base">
              {profileData.user.last_login
                ? new Date(profileData.user.last_login).toLocaleDateString()
                : "কখনো না"}
            </div>
            <div className="stat-meta">সবশেষ যেদিন ঢুকেছেন</div>
          </div>
        </div>

        {/* Account information */}
        <div className="plane-section">
          <div className="section-title">অ্যাকাউন্টের তথ্য</div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <span className="label">ইউজারনেম</span>
              <ReadOnlyValue value={profileData.user.username} />
            </div>
            <div>
              <label className="label" htmlFor="profile-email">ইমেইল</label>
              {isEditing ? (
                <input
                  id="profile-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="input"
                  placeholder="আপনার ইমেইল লিখুন"
                />
              ) : (
                <ReadOnlyValue value={profileData.user.email} />
              )}
            </div>
            <div>
              <label className="label" htmlFor="profile-first-name">নামের প্রথম অংশ</label>
              {isEditing ? (
                <input
                  id="profile-first-name"
                  type="text"
                  value={editForm.first_name}
                  onChange={(e) => handleInputChange("first_name", e.target.value)}
                  className="input"
                  placeholder="যেমন: করিম"
                />
              ) : (
                <ReadOnlyValue value={profileData.user.first_name} />
              )}
            </div>
            <div>
              <label className="label" htmlFor="profile-last-name">নামের শেষ অংশ</label>
              {isEditing ? (
                <input
                  id="profile-last-name"
                  type="text"
                  value={editForm.last_name}
                  onChange={(e) => handleInputChange("last_name", e.target.value)}
                  className="input"
                  placeholder="যেমন: উদ্দিন"
                />
              ) : (
                <ReadOnlyValue value={profileData.user.last_name} />
              )}
            </div>
          </div>
        </div>

        {/* Contact information */}
        <div className="plane-section">
          <div className="section-title">যোগাযোগের তথ্য</div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="profile-phone">ফোন</label>
              {isEditing ? (
                <input
                  id="profile-phone"
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="input"
                  placeholder="017xxxxxxxx"
                />
              ) : (
                <ReadOnlyValue value={profileData.profile.phone} />
              )}
            </div>
            <div>
              <label className="label" htmlFor="profile-contact">আরেকটা নম্বর</label>
              {isEditing ? (
                <input
                  id="profile-contact"
                  type="tel"
                  value={editForm.contact_number}
                  onChange={(e) => handleInputChange("contact_number", e.target.value)}
                  className="input"
                  placeholder="দরকারে যোগাযোগের নম্বর"
                />
              ) : (
                <ReadOnlyValue value={profileData.profile.contact_number} />
              )}
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="profile-address">ঠিকানা</label>
              {isEditing ? (
                <textarea
                  id="profile-address"
                  value={editForm.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  className="textarea resize-none"
                  placeholder="আপনার ঠিকানা লিখুন"
                  rows={3}
                />
              ) : (
                <ReadOnlyValue value={profileData.profile.address} multiline />
              )}
            </div>
            <div>
              <label className="label" htmlFor="profile-city">শহর / এলাকা</label>
              {isEditing ? (
                <input
                  id="profile-city"
                  type="text"
                  value={editForm.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  className="input"
                  placeholder="যেমন: ঢাকা"
                />
              ) : (
                <ReadOnlyValue value={profileData.profile.city} />
              )}
            </div>
            <div>
              <label className="label" htmlFor="profile-post-code">পোস্ট কোড</label>
              {isEditing ? (
                <input
                  id="profile-post-code"
                  type="text"
                  value={editForm.post_code}
                  onChange={(e) => handleInputChange("post_code", e.target.value)}
                  className="input"
                  placeholder="যেমন: ১২১৬"
                />
              ) : (
                <ReadOnlyValue value={profileData.profile.post_code} />
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
