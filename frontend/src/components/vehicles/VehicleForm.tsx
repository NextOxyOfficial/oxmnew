"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, X } from "lucide-react";
import { ApiService } from "@/lib/api";
import { useToast } from "@/components/ui/Feedback";
import {
  Vehicle,
  VEHICLE_CONDITIONS,
  VEHICLE_TYPES,
} from "@/lib/vehicles";

interface Option {
  id: number;
  name: string;
}

export interface VehicleFormValues {
  product_name: string;
  vehicle_type: string;
  condition: string;
  engine_number: string;
  chassis_number: string;
  registration_number: string;
  color: string;
  model_year: string;
  odometer_km: string;
  supplier: string;
  buy_price: string;
  sell_price: string;
  purchase_date: string;
  location: string;
  notes: string;
}

const EMPTY: VehicleFormValues = {
  product_name: "",
  vehicle_type: "bike",
  condition: "new",
  engine_number: "",
  chassis_number: "",
  registration_number: "",
  color: "",
  model_year: "",
  odometer_km: "",
  supplier: "",
  buy_price: "",
  sell_price: "",
  purchase_date: "",
  location: "",
  notes: "",
};

const toFormValues = (vehicle: Vehicle): VehicleFormValues => ({
  product_name: vehicle.product_name || "",
  vehicle_type: vehicle.vehicle_type || "bike",
  condition: vehicle.condition || "new",
  engine_number: vehicle.engine_number || "",
  chassis_number: vehicle.chassis_number || "",
  registration_number: vehicle.registration_number || "",
  color: vehicle.color || "",
  model_year: vehicle.model_year ? String(vehicle.model_year) : "",
  odometer_km: vehicle.odometer_km ? String(vehicle.odometer_km) : "",
  supplier: vehicle.supplier ? String(vehicle.supplier) : "",
  buy_price: vehicle.buy_price != null ? String(vehicle.buy_price) : "",
  sell_price: vehicle.sell_price != null ? String(vehicle.sell_price) : "",
  purchase_date: vehicle.purchase_date || "",
  location: vehicle.location || "",
  notes: vehicle.notes || "",
});

/**
 * One form serving both "নতুন বাইক" and "এডিট" so the two screens can never
 * drift apart. `vehicle` being present switches it to edit mode.
 */
export default function VehicleForm({ vehicle }: { vehicle?: Vehicle }) {
  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(vehicle);

  const [values, setValues] = useState<VehicleFormValues>(
    vehicle ? toFormValues(vehicle) : EMPTY
  );
  const [products, setProducts] = useState<Option[]>([]);
  const [suppliers, setSuppliers] = useState<Option[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        // A big page_size on purpose: these feed the name datalist and the
        // supplier select, so a partial list would hide what already exists.
        const [productResponse, supplierResponse] = await Promise.all([
          ApiService.getProducts({ page_size: 200 }),
          ApiService.getSuppliers(undefined, 200),
        ]);
        const productRows = Array.isArray(productResponse)
          ? productResponse
          : productResponse?.results ?? [];
        const supplierRows = Array.isArray(supplierResponse)
          ? supplierResponse
          : supplierResponse?.results ?? [];
        setProducts(productRows);
        setSuppliers(supplierRows);
      } catch {
        toast.error("প্রোডাক্ট বা সাপ্লায়ারের লিস্ট আনা যায়নি");
      }
    };
    loadOptions();
    // toast is stable; options only need loading once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Does the typed name already exist? Drives the hint under the name field so
  // the user knows whether they are adding to an existing model or creating one.
  const matchedProduct = products.find(
    (p) =>
      p.name.trim().toLowerCase() === values.product_name.trim().toLowerCase()
  );

  const setField = (field: keyof VehicleFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!values.product_name.trim())
      next.product_name = "বাইকের নাম লিখুন";
    if (values.buy_price && Number(values.buy_price) < 0)
      next.buy_price = "দাম শূন্যের কম হতে পারে না";
    if (values.sell_price && Number(values.sell_price) < 0)
      next.sell_price = "দাম শূন্যের কম হতে পারে না";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        product_name: values.product_name.trim(),
        vehicle_type: values.vehicle_type,
        condition: values.condition,
        engine_number: values.engine_number.trim(),
        chassis_number: values.chassis_number.trim(),
        registration_number: values.registration_number.trim() || null,
        color: values.color.trim() || null,
        model_year: values.model_year ? Number(values.model_year) : null,
        odometer_km: values.odometer_km ? Number(values.odometer_km) : null,
        supplier: values.supplier ? Number(values.supplier) : null,
        buy_price: values.buy_price || 0,
        sell_price: values.sell_price || 0,
        purchase_date: values.purchase_date || null,
        location: values.location.trim() || null,
        notes: values.notes.trim() || null,
      };

      if (isEdit && vehicle) {
        await ApiService.updateVehicle(vehicle.id, payload);
        toast.success("বাইকের তথ্য সেভ হয়েছে");
        router.push(`/dashboard/vehicles/${vehicle.id}`);
      } else {
        const created = await ApiService.createVehicle(payload);
        toast.success("নতুন বাইক যোগ হয়েছে");
        router.push(`/dashboard/vehicles/${created.id}`);
      }
    } catch (err) {
      // DRF returns {field: [message]} — surface those next to the fields
      // instead of a single generic toast.
      const raw = err instanceof Error ? err.message : "";
      let handled = false;
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          const fieldErrors: Record<string, string> = {};
          Object.entries(parsed).forEach(([key, value]) => {
            fieldErrors[key] = Array.isArray(value) ? String(value[0]) : String(value);
          });
          if (Object.keys(fieldErrors).length) {
            setErrors(fieldErrors);
            handled = true;
          }
        }
      } catch {
        // Not JSON — fall through to the toast.
      }
      if (!handled) toast.error(raw || "সেভ করা গেল না। আরেকবার চেষ্টা করুন।");
    } finally {
      setSaving(false);
    }
  };

  const fieldError = (field: string) =>
    errors[field] ? (
      <p className="mt-1 text-xs text-rose-600">{errors[field]}</p>
    ) : null;

  return (
    <form onSubmit={handleSubmit} className="plane">
      <div className="plane-section">
        <div className="section-title">বাইকের পরিচয়</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">বাইকের নাম *</label>
            {/* Free text, not a dropdown: the shopkeeper types the model. A
                datalist offers what they already have so the same bike doesn't
                get entered under three spellings, but never blocks a new name. */}
            <input
              type="text"
              list="vehicle-model-names"
              value={values.product_name}
              onChange={(e) => setField("product_name", e.target.value)}
              className="input"
              placeholder="যেমন: Honda CB150R"
              autoComplete="off"
            />
            <datalist id="vehicle-model-names">
              {products.map((p) => (
                <option key={p.id} value={p.name} />
              ))}
            </datalist>
            <p className="mt-1 text-xs text-slate-500">
              {matchedProduct ? (
                <>
                  আগে থেকেই আছে — এই বাইকটা{" "}
                  <span className="font-medium text-slate-700">
                    {matchedProduct.name}
                  </span>{" "}
                  এর নিচে জমা হবে
                </>
              ) : values.product_name.trim() ? (
                "নতুন নাম — প্রোডাক্ট লিস্টেও এটা যোগ হয়ে যাবে"
              ) : (
                "একই নামের সব বাইক একসাথে গোনা হবে, আর প্রোডাক্ট লিস্টেও দেখাবে"
              )}
            </p>
            {fieldError("product_name")}
            {fieldError("product")}
          </div>

          <div>
            <label className="label">টাইপ</label>
            <select
              value={values.vehicle_type}
              onChange={(e) => setField("vehicle_type", e.target.value)}
              className="select"
            >
              {VEHICLE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">কন্ডিশন</label>
            <select
              value={values.condition}
              onChange={(e) => setField("condition", e.target.value)}
              className="select"
            >
              {VEHICLE_CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">ইঞ্জিন নম্বর</label>
            <input
              type="text"
              value={values.engine_number}
              onChange={(e) => setField("engine_number", e.target.value)}
              className="input num"
              placeholder="যেমন: JC61E-1234567"
            />
            <p className="mt-1 text-xs text-slate-500">
              কাগজ না এলে পরে দিলেও চলবে
            </p>
            {fieldError("engine_number")}
          </div>

          <div>
            <label className="label">চেসিস নম্বর</label>
            <input
              type="text"
              value={values.chassis_number}
              onChange={(e) => setField("chassis_number", e.target.value)}
              className="input num"
              placeholder="যেমন: ME4JC618XKT123456"
            />
            <p className="mt-1 text-xs text-slate-500">
              একই নম্বর দুবার দেওয়া যাবে না
            </p>
            {fieldError("chassis_number")}
          </div>

          <div>
            <label className="label">রেজিস্ট্রেশন নম্বর</label>
            <input
              type="text"
              value={values.registration_number}
              onChange={(e) => setField("registration_number", e.target.value)}
              className="input"
              placeholder="রেজিস্ট্রেশন হয়ে থাকলে দিন"
            />
            {fieldError("registration_number")}
          </div>

          <div>
            <label className="label">রঙ</label>
            <input
              type="text"
              value={values.color}
              onChange={(e) => setField("color", e.target.value)}
              className="input"
              placeholder="যেমন: লাল"
            />
          </div>

          <div>
            <label className="label">মডেল ইয়ার</label>
            <input
              type="number"
              value={values.model_year}
              onChange={(e) => setField("model_year", e.target.value)}
              className="input num"
              placeholder="যেমন: 2024"
            />
          </div>

          {values.condition === "used" && (
            <div>
              <label className="label">চলেছে (কিমি)</label>
              <input
                type="number"
                value={values.odometer_km}
                onChange={(e) => setField("odometer_km", e.target.value)}
                className="input num"
                placeholder="যেমন: 12000"
              />
            </div>
          )}
        </div>
      </div>

      <div className="plane-section">
        <div className="section-title">কেনা ও দাম</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="label">কেনা দাম</label>
            <input
              type="number"
              step="0.01"
              value={values.buy_price}
              onChange={(e) => setField("buy_price", e.target.value)}
              className="input num"
              placeholder="0.00"
            />
            {fieldError("buy_price")}
          </div>
          <div>
            <label className="label">বিক্রির দাম</label>
            <input
              type="number"
              step="0.01"
              value={values.sell_price}
              onChange={(e) => setField("sell_price", e.target.value)}
              className="input num"
              placeholder="0.00"
            />
            {fieldError("sell_price")}
          </div>
          <div>
            <label className="label">কেনার তারিখ</label>
            <input
              type="date"
              value={values.purchase_date}
              onChange={(e) => setField("purchase_date", e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label">সাপ্লায়ার</label>
            <select
              value={values.supplier}
              onChange={(e) => setField("supplier", e.target.value)}
              className="select"
            >
              <option value="">সাপ্লায়ার সিলেক্ট করুন</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="plane-section">
        <div className="section-title">অতিরিক্ত তথ্য</div>
        <div className="grid gap-3">
          <div>
            <label className="label">কোথায় রাখা আছে</label>
            <input
              type="text"
              value={values.location}
              onChange={(e) => setField("location", e.target.value)}
              className="input"
              placeholder="যেমন: শোরুম / গোডাউন-১"
            />
          </div>
          <div>
            <label className="label">নোট</label>
            <textarea
              value={values.notes}
              onChange={(e) => setField("notes", e.target.value)}
              className="input min-h-24"
              placeholder="আলাদা কিছু মনে রাখার থাকলে লিখুন"
            />
          </div>
        </div>
      </div>

      <div className="plane-section">
        <div className="row-actions">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn btn-ghost"
            disabled={saving}
          >
            <X className="h-4 w-4" />
            বাতিল
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "সেভ হচ্ছে…" : isEdit ? "সেভ করুন" : "বাইক যোগ করুন"}
          </button>
        </div>
      </div>
    </form>
  );
}
