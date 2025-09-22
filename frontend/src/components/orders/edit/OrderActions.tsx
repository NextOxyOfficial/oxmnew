"use client";

type Props = {
  onSubmit: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
  submitLabel: string;
};

export default function OrderActions({ onSubmit, onCancel, isSubmitting, submitLabel }: Props) {
  return (
    <div className="flex gap-3">
      <button
        onClick={onSubmit}
        disabled={isSubmitting}
        className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 transition-all duration-200 shadow-lg"
      >
        {isSubmitting ? "Saving..." : submitLabel}
      </button>

      <button
        onClick={onCancel}
        className="flex-1 px-6 py-3 bg-slate-600 text-slate-100 text-sm font-medium rounded-lg hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all duration-200"
      >
        Cancel
      </button>
    </div>
  );
}
