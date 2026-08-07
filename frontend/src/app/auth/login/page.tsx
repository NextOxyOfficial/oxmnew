'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, ArrowLeft, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData.username, formData.password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'লগইন করা গেল না');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
            <h1 className="page-title">আবার স্বাগতম</h1>
            <p className="page-sub">অ্যাকাউন্টে লগইন করে কাজ শুরু করুন</p>
          </div>

          <div className="plane-section">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-600" />
                  <span className="text-sm text-rose-600">{error}</span>
                </div>
              )}

              {/* Username Field */}
              <div>
                <label htmlFor="username" className="label">
                  ইউজারনেম
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="input"
                  placeholder="আপনার ইউজারনেম লিখুন"
                />
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="label">
                  পাসওয়ার্ড
                </label>
                <div className="flex gap-2">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="input"
                    placeholder="আপনার পাসওয়ার্ড লিখুন"
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

              {/* Password help.
                  The "remember me" checkbox that used to sit here was removed:
                  the token is always stored in localStorage, so the session
                  already survives a browser restart — the box changed nothing.
                  There is also no self-serve reset (the backend's reset
                  endpoint needs an authenticated user), so the dead "#" link
                  now points at support, which actually works. */}
              <div className="flex justify-end">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-medium text-cyan-600 hover:text-cyan-700"
                >
                  পাসওয়ার্ড ভুলে গেছেন?
                </Link>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    লগইন হচ্ছে…
                  </>
                ) : (
                  'লগইন করুন'
                )}
              </button>
            </form>
          </div>

          {/* Sign up link */}
          <div className="plane-section text-center text-sm text-slate-600">
            অ্যাকাউন্ট নেই?{' '}
            <Link href="/auth/register" className="font-medium text-cyan-600 hover:text-cyan-700">
              ফ্রি অ্যাকাউন্ট খুলুন
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
