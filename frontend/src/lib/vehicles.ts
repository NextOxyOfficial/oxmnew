/**
 * Shared vehicle types and Bangla labels.
 *
 * Every vehicle screen imports from here so a status or document type is
 * spelled the same way on the list, the detail page and the customer profile.
 */

export interface VehicleDocument {
  id: number;
  doc_type: string;
  doc_type_display: string;
  title: string | null;
  file_url: string | null;
  file_name: string | null;
  received_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface VehiclePayment {
  id: number;
  amount: string | number;
  method: string;
  method_display: string;
  reference: string | null;
  notes: string | null;
  created_at: string;
}

export interface Vehicle {
  id: number;
  product: number;
  product_name: string;
  vehicle_type: string;
  vehicle_type_display: string;
  condition: string;
  engine_number: string;
  chassis_number: string;
  registration_number: string | null;
  color: string | null;
  model_year: number | null;
  odometer_km?: number | null;
  purchase_date?: string | null;
  buy_price: string | number;
  sell_price: string | number;
  status: string;
  status_display: string;
  location: string | null;
  supplier: number | null;
  supplier_name: string | null;
  customer: number | null;
  customer_name: string | null;
  order: number | null;
  order_number: string | null;
  sold_price: string | number | null;
  sold_at: string | null;
  due_amount?: string | number | null;
  paid_amount?: string | number | null;
  profit?: string | number | null;
  notes?: string | null;
  document_count?: number;
  documents?: VehicleDocument[];
  payments?: VehiclePayment[];
  created_at: string;
  updated_at?: string;
}

export const VEHICLE_TYPES = [
  { value: "bike", label: "বাইক" },
  { value: "scooter", label: "স্কুটার" },
  { value: "cng", label: "সিএনজি / অটো" },
  { value: "car", label: "গাড়ি" },
  { value: "truck", label: "ট্রাক / পিকআপ" },
  { value: "other", label: "অন্যান্য" },
] as const;

export const VEHICLE_STATUSES = [
  { value: "in_stock", label: "স্টকে আছে" },
  { value: "reserved", label: "বুকিং হয়ে আছে" },
  { value: "sold", label: "বিক্রি হয়ে গেছে" },
] as const;

export const VEHICLE_CONDITIONS = [
  { value: "new", label: "নতুন" },
  { value: "used", label: "পুরনো" },
] as const;

/** Papers a shop actually collects. `papers_receipt` is the প্রাপ্তি স্বীকারোক্তি —
 *  proof of the date the papers were handed over. */
export const DOCUMENT_TYPES = [
  { value: "papers_receipt", label: "কাগজ প্রাপ্তি স্বীকারোক্তি" },
  { value: "registration", label: "রেজিস্ট্রেশন" },
  { value: "tax_token", label: "ট্যাক্স টোকেন" },
  { value: "fitness", label: "ফিটনেস" },
  { value: "insurance", label: "ইনস্যুরেন্স" },
  { value: "delivery", label: "ডেলিভারি রসিদ" },
  { value: "nid", label: "ক্রেতার এনআইডি" },
  { value: "other", label: "অন্যান্য" },
] as const;

export const PAYMENT_METHODS = [
  { value: "cash", label: "ক্যাশ" },
  { value: "bkash", label: "বিকাশ" },
  { value: "nagad", label: "নগদ" },
  { value: "bank", label: "ব্যাংক" },
  { value: "cheque", label: "চেক" },
  { value: "card", label: "কার্ড" },
] as const;

const labelFrom = (
  list: readonly { value: string; label: string }[],
  value: string | null | undefined
) => list.find((item) => item.value === value)?.label ?? value ?? "";

export const vehicleTypeLabel = (v?: string | null) => labelFrom(VEHICLE_TYPES, v);
export const vehicleStatusLabel = (v?: string | null) => labelFrom(VEHICLE_STATUSES, v);
export const conditionLabel = (v?: string | null) => labelFrom(VEHICLE_CONDITIONS, v);
export const documentTypeLabel = (v?: string | null) => labelFrom(DOCUMENT_TYPES, v);
export const paymentMethodLabel = (v?: string | null) =>
  labelFrom(PAYMENT_METHODS, v);

/** Badge tone per status, matching the app's badge vocabulary. */
export const vehicleStatusBadge = (status?: string | null) => {
  switch (status) {
    case "in_stock":
      return "badge badge-success";
    case "reserved":
      return "badge badge-warn";
    case "sold":
      return "badge badge-info";
    default:
      return "badge badge-muted";
  }
};

export const toNumber = (value: string | number | null | undefined) =>
  value === null || value === undefined ? 0 : Number(value) || 0;
