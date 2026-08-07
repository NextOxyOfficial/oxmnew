'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    company: '',
    phone: '',
    address: '',
    city: '',
    post_code: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('দুই পাসওয়ার্ড মিলছে না');
      return;
    }

    if (formData.password.length < 6) {
      setError('পাসওয়ার্ড কমপক্ষে 6 অক্ষরের হতে হবে');
      return;
    }

    setLoading(true);

    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        company: formData.company,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        post_code: formData.post_code,
      });

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'অ্যাকাউন্ট খোলা গেল না');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('দরকারি ঘরগুলো পূরণ করুন');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('দুই পাসওয়ার্ড মিলছে না');
      return;
    }

    if (formData.password.length < 6) {
      setError('পাসওয়ার্ড কমপক্ষে 6 অক্ষরের হতে হবে');
      return;
    }

    setError('');
    setStep(2);
  };

  const handleBack = () => {
    setError('');
    setStep(1);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-6 flex justify-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-600 text-base font-bold text-white">
              O
            </span>
            <span className="text-lg font-semibold text-slate-900">OxyManager</span>
          </Link>
        </div>

        <div className="plane">
          <div className="plane-section">
            <h1 className="page-title">নতুন অ্যাকাউন্ট খুলুন</h1>
            <p className="page-sub">
              ধাপ {step === 1 ? '1' : '2'}/2 — {step === 1 ? 'অ্যাকাউন্টের তথ্য' : 'ব্যবসার তথ্য'}
            </p>

            {/* Progress Bar */}
            <div className="mt-3 flex items-center gap-2">
              <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-cyan-600' : 'bg-slate-200'}`}></div>
              <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-cyan-600' : 'bg-slate-200'}`}></div>
            </div>
          </div>

          <div className="plane-section">
            {/* Error Message */}
            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-600" />
                <span className="text-sm text-rose-600">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Step 1: Account Details */}
              {step === 1 && (
                <>
                  {/* Name Fields */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="label">নামের প্রথম অংশ</label>
                      <input
                        name="first_name"
                        type="text"
                        value={formData.first_name}
                        onChange={handleChange}
                        className="input"
                        placeholder="করিম"
                      />
                    </div>
                    <div>
                      <label className="label">নামের শেষ অংশ</label>
                      <input
                        name="last_name"
                        type="text"
                        value={formData.last_name}
                        onChange={handleChange}
                        className="input"
                        placeholder="উদ্দিন"
                      />
                    </div>
                  </div>

                  {/* Username */}
                  <div>
                    <label className="label">ইউজারনেম *</label>
                    <input
                      name="username"
                      type="text"
                      required
                      value={formData.username}
                      onChange={handleChange}
                      className="input"
                      placeholder="karimuddin"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="label">ইমেইল *</label>
                    <input
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="input"
                      placeholder="karim@example.com"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="label">পাসওয়ার্ড *</label>
                    <div className="flex gap-2">
                      <input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className="input"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                        className="flex w-10 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="label">পাসওয়ার্ড আবার লিখুন *</label>
                    <div className="flex gap-2">
                      <input
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="input"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        aria-label={showConfirmPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                        className="flex w-10 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Next Button */}
                  <button
                    type="button"
                    onClick={handleNext}
                    className="btn btn-primary w-full"
                  >
                    পরের ধাপ
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </>
              )}

              {/* Step 2: Business Information */}
              {step === 2 && (
                <>
                  {/* Company */}
                  <div>
                    <label className="label">ব্যবসার নাম</label>
                    <input
                      name="company"
                      type="text"
                      value={formData.company}
                      onChange={handleChange}
                      className="input"
                      placeholder="আপনার স্টোর বা ব্যবসার নাম"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="label">মোবাইল নম্বর</label>
                    <input
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      className="input"
                      placeholder="+880 1XXX-XXXXXX"
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <label className="label">ঠিকানা</label>
                    <textarea
                      name="address"
                      rows={2}
                      value={formData.address}
                      onChange={handleChange}
                      className="textarea resize-none"
                      placeholder="ব্যবসার ঠিকানা লিখুন"
                    />
                  </div>

                  {/* City and Post Code */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="label">শহর</label>
                      <input
                        name="city"
                        type="text"
                        value={formData.city}
                        onChange={handleChange}
                        className="input"
                        placeholder="ঢাকা"
                      />
                    </div>
                    <div>
                      <label className="label">পোস্ট কোড</label>
                      <input
                        name="post_code"
                        type="text"
                        value={formData.post_code}
                        onChange={handleChange}
                        className="input"
                        placeholder="1205"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="btn btn-ghost flex-1"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      আগের ধাপ
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn btn-primary flex-1"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          খোলা হচ্ছে…
                        </>
                      ) : (
                        'অ্যাকাউন্ট খুলুন'
                      )}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>

          {/* Footer Links */}
          <div className="plane-section text-center text-sm text-slate-600">
            আগে থেকেই অ্যাকাউন্ট আছে?{' '}
            <Link href="/auth/login" className="font-medium text-cyan-600 hover:text-cyan-700">
              লগইন করুন
            </Link>
          </div>
        </div>

        {/* Back to home */}
        <div className="mt-5 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            হোমে ফিরে যান
          </Link>
        </div>
      </div>
    </div>
  );
}
