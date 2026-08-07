"use client";

type Props = {
  onSubmit: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
  submitLabel: string;
};

export default function OrderActions({ onSubmit, onCancel, isSubmitting, submitLabel }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={onSubmit}
        disabled={isSubmitting}
        className="btn btn-primary flex-1"
      >
        {isSubmitting ? "সেভ হচ্ছে…" : submitLabel}
      </button>

      <button onClick={onCancel} className="btn btn-ghost flex-1">
        বাতিল
      </button>
    </div>
  );
}
