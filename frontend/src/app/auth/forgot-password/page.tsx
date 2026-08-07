"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Inbox, Mail, MessageSquare, ShieldCheck } from "lucide-react";
import { ApiService } from "@/lib/api";
import { useToast } from "@/components/ui/Feedback";

type Step = "identify" | "code" | "password";
type Channel = "email" | "sms";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const toast = useToast();

  const [step, setStep] = useState<Step>("identify");
  const [channel, setChannel] = useState<Channel>("email");
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fail = (err: unknown, fallback: string) =>
    setError(err instanceof Error && err.message ? err.message : fallback);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier.trim()) {
      setError("ইউজারনেম, ইমেইল বা ফোন নম্বর দিন");
      return;
    }
    setBusy(true);
    try {
      const result = await ApiService.requestPasswordReset({
        identifier: identifier.trim(),
        channel,
      });
      setSentTo(result?.sent_to ?? "");
      setStep("code");
    } catch (err) {
      fail(err, "কোড পাঠানো গেল না। আরেকবার চেষ্টা করুন।");
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (code.trim().length !== 6) {
      setError("6 অঙ্কের কোডটা দিন");
      return;
    }
    setBusy(true);
    try {
      await ApiService.verifyPasswordResetCode({
        identifier: identifier.trim(),
        code: code.trim(),
      });
      setStep("password");
    } catch (err) {
      fail(err, "কোডটা মেলেনি");
    } finally {
      setBusy(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("পাসওয়ার্ড অন্তত 6 অক্ষরের হতে হবে");
      return;
    }
    if (password !== confirmPassword) {
      setError("দুটো পাসওয়ার্ড মিলছে না");
      return;
    }
    setBusy(true);
    try {
      await ApiService.confirmPasswordReset({
        identifier: identifier.trim(),
        code: code.trim(),
        password,
      });
      toast.success("পাসওয়ার্ড বদলে গেছে — এখন লগইন করুন");
      router.push("/auth/login");
    } catch (err) {
      fail(err, "পাসওয়ার্ড বদলানো গেল না");
    } finally {
      setBusy(false);
    }
  };

  const steps: { key: Step; label: string }[] = [
    { key: "identify", label: "অ্যাকাউন্ট" },
    { key: "code", label: "কোড" },
    { key: "password", label: "নতুন পাসওয়ার্ড" },
  ];
  const stepIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="app-shell flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <Link href="/" className="inline-flex">
            <Image
              src="/logo.png"
              alt="OxyManager"
              width={378}
              height={96}
              className="h-10 w-auto"
              priority
            />
          </Link>
        </div>

        <div className="plane">
          <div className="plane-section">
            <h1 className="page-title">পাসওয়ার্ড ভুলে গেছেন?</h1>
            <p className="page-sub">
              ইমেইল বা এসএমএসে কোড পাঠাব, সেটা দিয়ে নতুন পাসওয়ার্ড বসাবেন
            </p>

            {/* Three dots rather than a progress bar: the user needs to know
                where they are, not how far along a percentage they got. */}
            <ol className="mt-3 flex items-center gap-2">
              {steps.map((item, index) => (
                <li key={item.key} className="flex flex-1 items-center gap-2">
                  <span
                    className={`num flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      index < stepIndex
                        ? "bg-emerald-100 text-emerald-700"
                        : index === stepIndex
                        ? "bg-cyan-600 text-white"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {index < stepIndex ? "✓" : index + 1}
                  </span>
                  <span
                    className={`truncate text-xs ${
                      index === stepIndex
                        ? "font-medium text-slate-900"
                        : "text-slate-500"
                    }`}
                  >
                    {item.label}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {error && (
            <div className="plane-section">
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </div>
            </div>
          )}

          {step === "identify" && (
            <form onSubmit={handleRequest}>
              <div className="plane-section space-y-4">
                <div>
                  <label className="label" htmlFor="identifier">
                    ইউজারনেম, ইমেইল বা ফোন নম্বর
                  </label>
                  <input
                    id="identifier"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="input"
                    placeholder="যেমন: alimulislam50 বা 01711000000"
                    autoComplete="username"
                  />
                </div>

                <div>
                  <span className="label">কোথায় কোড পাঠাব</span>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { value: "email", label: "ইমেইলে", icon: Mail },
                        { value: "sms", label: "এসএমএসে", icon: MessageSquare },
                      ] as const
                    ).map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setChannel(option.value)}
                        className={`btn ${
                          channel === option.value
                            ? "btn-ghost border-cyan-500 bg-cyan-50 text-cyan-800 ring-1 ring-cyan-400"
                            : "btn-ghost"
                        }`}
                      >
                        <option.icon className="h-4 w-4" />
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="plane-section">
                <button type="submit" className="btn btn-primary w-full" disabled={busy}>
                  {busy ? "পাঠানো হচ্ছে…" : "কোড পাঠান"}
                </button>
              </div>
            </form>
          )}

          {step === "code" && (
            <form onSubmit={handleVerify}>
              <div className="plane-section space-y-4">
                <div className="flex items-start gap-2.5 rounded-lg bg-slate-50 px-3 py-2.5 text-sm">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600" />
                  <span className="text-slate-600">
                    {sentTo ? (
                      <>
                        <span className="num font-medium text-slate-900">
                          {sentTo}
                        </span>{" "}
                        এ কোড পাঠানো হয়েছে।
                      </>
                    ) : (
                      "অ্যাকাউন্ট থাকলে কোড পাঠানো হয়েছে।"
                    )}{" "}
                    কোডটা 10 মিনিট চলবে।
                  </span>
                </div>

                {/* Mail from a new sending domain very often lands in spam the
                    first time. Saying so here saves a support message and a
                    second "কোড আসেনি" attempt that burns another code. */}
                {channel === "email" && (
                  <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm">
                    <Inbox className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <span className="text-amber-900">
                      <span className="font-medium">ইমেইল না পেলে</span> স্প্যাম
                      বা জাংক ফোল্ডারটা দেখুন — অনেক সময় মেইল ওখানে চলে যায়।
                      পেলে <span className="font-medium">&quot;Not spam&quot;</span>{" "}
                      দিয়ে দিলে পরেরবার থেকে ইনবক্সেই আসবে।
                    </span>
                  </div>
                )}

                <div>
                  <label className="label" htmlFor="code">
                    6 অঙ্কের কোড
                  </label>
                  <input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    className="input num text-center text-lg tracking-[0.4em]"
                    placeholder="------"
                    autoComplete="one-time-code"
                  />
                </div>
              </div>

              <div className="plane-section flex flex-col gap-2">
                <button type="submit" className="btn btn-primary w-full" disabled={busy}>
                  {busy ? "মিলিয়ে দেখা হচ্ছে…" : "পরের ধাপ"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCode("");
                    setError(null);
                    setStep("identify");
                  }}
                  className="btn btn-ghost w-full"
                  disabled={busy}
                >
                  <ArrowLeft className="h-4 w-4" />
                  আবার কোড চান
                </button>
              </div>
            </form>
          )}

          {step === "password" && (
            <form onSubmit={handleConfirm}>
              <div className="plane-section space-y-4">
                <div>
                  <label className="label" htmlFor="new-password">
                    নতুন পাসওয়ার্ড
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input"
                    placeholder="অন্তত 6 অক্ষর"
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="confirm-password">
                    আবার লিখুন
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div className="plane-section">
                <button type="submit" className="btn btn-primary w-full" disabled={busy}>
                  {busy ? "সেভ হচ্ছে…" : "পাসওয়ার্ড বদলান"}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-slate-500">
          মনে পড়েছে?{" "}
          <Link href="/auth/login" className="font-medium text-cyan-700 hover:underline">
            লগইন করুন
          </Link>
        </p>
      </div>
    </div>
  );
}
