"use client";

/**
 * App-wide user feedback: toasts and confirm dialogs.
 *
 * Replaces the browser's `alert()` / `confirm()`, which ignore the design
 * system, block the main thread and look like a different application.
 * One provider, mounted once in the root layout, so every screen shares the
 * same styling and behaviour instead of hand-rolling its own banner.
 *
 *   const toast = useToast();
 *   toast.success("সেভ হয়ে গেছে");
 *   toast.error("সেভ করা যায়নি");
 *
 *   const confirm = useConfirm();
 *   if (await confirm({ title: "ডিলিট করবেন?", danger: true })) { ... }
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, CheckCircle2, Info, X } from "lucide-react";

// ── Toasts ────────────────────────────────────────────────────────────

type ToastTone = "success" | "error" | "info";

/**
 * An offer to fix whatever the toast is complaining about.
 *
 * "প্রোফাইলে স্টোরের নাম পাওয়া যায়নি" tells the user what is wrong but leaves
 * them to hunt for the screen that fixes it. With an action the toast carries
 * the way out — one tap and they are on the field that was missing.
 */
export interface ToastAction {
  label: string;
  /** Where the fix lives. */
  href?: string;
  onClick?: () => void;
}

interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
  action?: ToastAction;
}

interface ToastApi {
  show: (message: string, tone?: ToastTone, action?: ToastAction) => void;
  success: (message: string, action?: ToastAction) => void;
  error: (message: string, action?: ToastAction) => void;
  info: (message: string, action?: ToastAction) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside <FeedbackProvider>");
  }
  return ctx;
}

const TONE_STYLES: Record<ToastTone, { badge: string; icon: React.ReactNode }> =
  {
    success: {
      badge: "badge badge-success",
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
    },
    error: {
      badge: "badge badge-danger",
      icon: <AlertTriangle className="h-4 w-4 text-rose-600" />,
    },
    info: {
      badge: "badge badge-info",
      icon: <Info className="h-4 w-4 text-cyan-600" />,
    },
  };

/** The "fix it" link inside a toast. */
function ToastActionButton({
  action,
  onDone,
}: {
  action: ToastAction;
  onDone: () => void;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        action.onClick?.();
        if (action.href) router.push(action.href);
        onDone();
      }}
      className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200"
    >
      {action.label}
      <ArrowRight className="h-3 w-3" />
    </button>
  );
}

// ── Confirm dialog ────────────────────────────────────────────────────

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Renders the primary action in red, for destructive operations. */
  danger?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used inside <FeedbackProvider>");
  }
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (message: string, tone: ToastTone = "info", action?: ToastAction) => {
      const id = nextId.current++;
      setToasts((prev) => [...prev, { id, tone, message, action }]);
      timers.current.set(
        id,
        // A toast offering a fix stays long enough to reach for it.
        setTimeout(() => dismiss(id), action ? 10000 : tone === "error" ? 6000 : 4000)
      );
    },
    [dismiss]
  );

  // Clear pending timers if the provider unmounts.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((t) => clearTimeout(t));
      pending.clear();
    };
  }, []);

  const toastApi = useMemo<ToastApi>(
    () => ({
      show,
      success: (m: string, a?: ToastAction) => show(m, "success", a),
      error: (m: string, a?: ToastAction) => show(m, "error", a),
      info: (m: string, a?: ToastAction) => show(m, "info", a),
    }),
    [show]
  );

  // Confirm state: the promise resolver is held until the user answers.
  const [confirmState, setConfirmState] = useState<{
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ options, resolve });
    });
  }, []);

  const answer = useCallback(
    (value: boolean) => {
      setConfirmState((current) => {
        current?.resolve(value);
        return null;
      });
    },
    []
  );

  // Escape closes the dialog as "cancel".
  useEffect(() => {
    if (!confirmState) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") answer(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmState, answer]);

  return (
    <ToastContext.Provider value={toastApi}>
      <ConfirmContext.Provider value={confirm}>
        {children}

        {/* Toast stack */}
        {toasts.length > 0 && (
          <div
            className="fixed bottom-4 right-4 z-[100] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2"
            role="status"
            aria-live="polite"
          >
            {toasts.map((t) => (
              <div
                key={t.id}
                className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-3 shadow-lg"
              >
                <span className="mt-0.5 shrink-0">
                  {TONE_STYLES[t.tone].icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-700">{t.message}</p>
                  {t.action && (
                    <ToastActionButton
                      action={t.action}
                      onDone={() => dismiss(t.id)}
                    />
                  )}
                </div>
                <button
                  onClick={() => dismiss(t.id)}
                  aria-label="বন্ধ করুন"
                  className="shrink-0 text-slate-400 hover:text-slate-700"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Confirm dialog */}
        {confirmState && (
          <div className="modal-backdrop" onClick={() => answer(false)}>
            <div
              className="modal max-w-md"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="modal-head">
                <h2 className="modal-title">{confirmState.options.title}</h2>
                <button
                  onClick={() => answer(false)}
                  aria-label="বন্ধ করুন"
                  className="text-slate-400 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {confirmState.options.message && (
                <div className="modal-body">
                  <p className="text-sm text-slate-600">
                    {confirmState.options.message}
                  </p>
                </div>
              )}

              <div className="modal-foot">
                <button className="btn btn-ghost" onClick={() => answer(false)}>
                  {confirmState.options.cancelLabel || "বাতিল"}
                </button>
                <button
                  className={`btn ${
                    confirmState.options.danger ? "btn-danger" : "btn-primary"
                  }`}
                  onClick={() => answer(true)}
                  autoFocus
                >
                  {confirmState.options.confirmLabel || "ঠিক আছে"}
                </button>
              </div>
            </div>
          </div>
        )}
      </ConfirmContext.Provider>
    </ToastContext.Provider>
  );
}
