/**
 * Shared types and Bangla labels for জরুরি কাগজপত্র.
 *
 * The page and any future widget import from here so a document type or an
 * expiry state is spelled the same way everywhere — same arrangement as
 * `lib/vehicles.ts`.
 */

export interface ImportantDocument {
  id: number;
  title: string;
  doc_type: string;
  doc_type_display: string;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  extension: string;
  reference_number: string;
  issued_by: string;
  issue_date: string | null;
  expiry_date: string | null;
  /** Negative once lapsed; null when the paper never expires. */
  days_left: number | null;
  status: "expired" | "expiring" | "valid" | "permanent";
  notes: string;
  is_pinned: boolean;
  uploaded_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentStats {
  total: number;
  expired: number;
  expiring: number;
  valid: number;
  permanent: number;
  by_type: { doc_type: string; count: number; label: string }[];
}

/** Mirrors ImportantDocument.DOC_TYPES on the server — keep the two in step. */
export const DOC_TYPES = [
  { value: "trade_license", label: "ট্রেড লাইসেন্স" },
  { value: "tin", label: "টিন সার্টিফিকেট" },
  { value: "vat", label: "ভ্যাট / বিআইএন" },
  { value: "bank", label: "ব্যাংকের কাগজ" },
  { value: "rent_agreement", label: "দোকান ভাড়ার চুক্তি" },
  { value: "insurance", label: "ইনস্যুরেন্স" },
  { value: "fire_license", label: "ফায়ার লাইসেন্স" },
  { value: "nid", label: "এনআইডি / পরিচয়পত্র" },
  { value: "partnership", label: "পার্টনারশিপ দলিল" },
  { value: "utility", label: "বিদ্যুৎ / গ্যাস / পানির বিল" },
  { value: "tax_return", label: "আয়কর রিটার্ন" },
  { value: "other", label: "অন্যান্য" },
] as const;

export const ALLOWED_EXTENSIONS = [
  "pdf", "jpg", "jpeg", "png", "webp", "gif",
  "doc", "docx", "xls", "xlsx", "txt", "csv",
] as const;

/** Kept in step with ImportantDocument.MAX_FILE_SIZE on the server. */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const docTypeLabel = (value?: string | null) =>
  DOC_TYPES.find((t) => t.value === value)?.label ?? value ?? "অন্যান্য";

/** Badge class + wording for the four expiry states. */
export const expiryBadge = (doc: {
  status: string;
  days_left: number | null;
}): { className: string; label: string } => {
  const left = doc.days_left;
  switch (doc.status) {
    case "expired":
      return {
        className: "badge badge-danger",
        label: left === null ? "মেয়াদ শেষ" : `${Math.abs(left)} দিন আগে শেষ`,
      };
    case "expiring":
      return {
        className: "badge badge-warn",
        label: left === 0 ? "আজই শেষ" : `আর ${left} দিন`,
      };
    case "valid":
      return { className: "badge badge-success", label: "ঠিক আছে" };
    default:
      return { className: "badge badge-muted", label: "মেয়াদ নাই" };
  }
};

export const formatFileSize = (bytes?: number | null) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} বাইট`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} কেবি`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} এমবি`;
};

export const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("en-GB") : "—";

/**
 * Checks a file before it leaves the browser. The server validates the same
 * two things again — this only saves the user a round trip and a 400.
 */
export const validateFile = (file: File): string | null => {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!(ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
    return `এই ধরনের ফাইল রাখা যাবে না। যেগুলো চলবে: ${ALLOWED_EXTENSIONS.join(", ")}`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `ফাইল ${MAX_FILE_SIZE / (1024 * 1024)} এমবির বেশি বড় হলে চলবে না।`;
  }
  return null;
};
