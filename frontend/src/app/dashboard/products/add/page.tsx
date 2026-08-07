"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, X } from "lucide-react";
import { ApiService } from "@/lib/api";
import { useCurrencyFormatter } from "@/contexts/CurrencyContext";
import { useToast } from "@/components/ui/Feedback";
import FileUploadTab from "@/components/products/add/FileUploadTab";
import PhotoUploader from "@/components/products/add/PhotoUploader";
import SuggestInput from "@/components/products/add/SuggestInput";
import VariantEditor from "@/components/products/add/VariantEditor";
import type {
  Category,
  ColorSize,
  ProductFormData,
  Supplier,
} from "@/types/product-form";

const EMPTY_FORM: ProductFormData = {
  name: "",
  buyPrice: 0,
  sellPrice: 0,
  stock: 1,
  category: "",
  supplier: "",
  productCode: "",
  location: "",
  details: "",
  photos: [],
  hasVariants: false,
  noStockRequired: false,
  colorSizeVariants: [],
};

export default function AddProductPage() {
  const router = useRouter();
  const toast = useToast();
  const formatCurrency = useCurrencyFormatter();

  const [activeTab, setActiveTab] = useState<"manual" | "file">("manual");
  const [form, setForm] = useState<ProductFormData>(EMPTY_FORM);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [categoryData, supplierData] = await Promise.all([
          ApiService.getCategories(),
          ApiService.getSuppliers(undefined, 200),
        ]);
        setCategories(
          Array.isArray(categoryData) ? categoryData : categoryData?.results ?? []
        );
        setSuppliers(
          Array.isArray(supplierData) ? supplierData : supplierData?.results ?? []
        );
      } catch {
        toast.error("ক্যাটাগরি বা সাপ্লায়ারের লিস্ট আনা যায়নি");
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setField = <K extends keyof ProductFormData>(
    field: K,
    value: ProductFormData[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field as string]) return prev;
      const next = { ...prev };
      delete next[field as string];
      return next;
    });
  };

  // Per-unit profit: a straight difference normally, the average across
  // variants when the product is priced per variant.
  const profit = form.hasVariants
    ? form.colorSizeVariants.length
      ? form.colorSizeVariants.reduce(
          (sum, v) => sum + (v.sellPrice - v.buyPrice),
          0
        ) / form.colorSizeVariants.length
      : 0
    : form.sellPrice - form.buyPrice;

  const avgSell = form.hasVariants
    ? form.colorSizeVariants.length
      ? form.colorSizeVariants.reduce((sum, v) => sum + v.sellPrice, 0) /
        form.colorSizeVariants.length
      : 0
    : form.sellPrice;

  const margin = avgSell > 0 ? (profit / avgSell) * 100 : 0;

  const validate = () => {
    const next: Record<string, string> = {};

    if (!form.name.trim()) next.name = "প্রোডাক্টের নাম দিন";

    if (form.hasVariants) {
      if (form.colorSizeVariants.length === 0) {
        next.variants = "অন্তত একটা ভ্যারিয়েন্ট যোগ করুন";
      }
    } else if (!form.noStockRequired) {
      if (form.buyPrice <= 0) next.buyPrice = "কেনা দাম দিন";
      if (form.sellPrice <= 0) next.sellPrice = "বিক্রির দাম দিন";
      else if (form.sellPrice < form.buyPrice)
        next.sellPrice = "বিক্রির দাম কেনা দামের সমান বা বেশি হতে হবে";
      if (form.stock <= 0) next.stock = "স্টক কত সেটা দিন";
    } else if (
      form.buyPrice > 0 &&
      form.sellPrice > 0 &&
      form.sellPrice < form.buyPrice
    ) {
      next.sellPrice = "বিক্রির দাম কেনা দামের সমান বা বেশি হতে হবে";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const created = await ApiService.createProduct({
        name: form.name.trim(),
        category: typeof form.category === "number" ? form.category : undefined,
        supplier: typeof form.supplier === "number" ? form.supplier : undefined,
        product_code: form.productCode.trim() || undefined,
        location: form.location.trim() || undefined,
        details: form.details,
        has_variants: form.hasVariants,
        no_stock_required: form.noStockRequired,
        buy_price: form.hasVariants ? 0 : form.buyPrice,
        sell_price: form.hasVariants ? 0 : form.sellPrice,
        stock: form.hasVariants || form.noStockRequired ? 0 : form.stock,
        variants: form.hasVariants
          ? form.colorSizeVariants.map((v) => ({
              color: v.color,
              size: v.size,
              weight: v.weight,
              weight_unit: v.weight_unit,
              custom_variant: v.custom_variant,
              buy_price: v.buyPrice,
              sell_price: v.sellPrice,
              stock: v.stock,
            }))
          : undefined,
        photos: form.photos.length ? form.photos : undefined,
      });

      if (created?.photo_upload_failed) {
        toast.error("প্রোডাক্ট যোগ হয়েছে, তবে ছবিগুলো আপলোড হয়নি");
      } else {
        toast.success("প্রোডাক্ট যোগ হয়েছে");
      }
      router.push("/dashboard/products");
    } catch (error) {
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : "প্রোডাক্ট যোগ করা গেল না। আরেকবার চেষ্টা করুন।",
      });
    } finally {
      setSaving(false);
    }
  };

  const showSinglePricing = !form.hasVariants;

  return (
    <div className="page page-narrow space-y-4">
      <div className="page-head">
        <div>
          <Link
            href="/dashboard/products"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            প্রোডাক্টের লিস্ট
          </Link>
          <h1 className="page-title mt-1">নতুন প্রোডাক্ট</h1>
          <p className="page-sub">
            নিচের তথ্যগুলো দিয়ে স্টকে নতুন প্রোডাক্ট যোগ করুন
          </p>
        </div>
      </div>

      <div className="plane">
        <div className="plane-section">
          <div className="flex flex-wrap items-center gap-2" role="tablist">
            {(
              [
                ["manual", "নিজে লিখে"],
                ["file", "ফাইল আপলোড"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={activeTab === value}
                onClick={() => setActiveTab(value)}
                className={`btn btn-sm ${
                  activeTab === value ? "btn-primary" : "btn-ghost"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "file" ? (
          <FileUploadTab />
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="plane-section">
              <div className="section-title">প্রোডাক্টের তথ্য</div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <SuggestInput
                    id="product-name"
                    label="প্রোডাক্টের নাম"
                    required
                    field="name"
                    value={form.name}
                    onChange={(value) => setField("name", value)}
                    placeholder="প্রোডাক্টের নাম লিখুন"
                    error={errors.name}
                    hint="একই নামে দুটো প্রোডাক্ট রাখা যাবে না"
                  />
                </div>

                <SuggestInput
                  id="product-code"
                  label="প্রোডাক্টের কোড"
                  field="code"
                  value={form.productCode}
                  onChange={(value) => setField("productCode", value)}
                  placeholder="যেমন: SKU, পার্ট নম্বর"
                  error={errors.productCode}
                />

                <div>
                  <label htmlFor="supplier" className="label">
                    সাপ্লায়ার
                  </label>
                  <select
                    id="supplier"
                    value={form.supplier}
                    onChange={(e) =>
                      setField(
                        "supplier",
                        e.target.value ? Number(e.target.value) : ""
                      )
                    }
                    className="select"
                  >
                    <option value="">সাপ্লায়ার সিলেক্ট করুন (ইচ্ছে হলে)</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="category" className="label">
                    ক্যাটাগরি
                  </label>
                  <select
                    id="category"
                    value={form.category}
                    onChange={(e) =>
                      setField(
                        "category",
                        e.target.value ? Number(e.target.value) : ""
                      )
                    }
                    className="select"
                  >
                    <option value="">ক্যাটাগরি সিলেক্ট করুন (ইচ্ছে হলে)</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="location" className="label">
                    কোথায় রাখা
                  </label>
                  <input
                    id="location"
                    type="text"
                    value={form.location}
                    onChange={(e) => setField("location", e.target.value)}
                    className="input"
                    placeholder="যেমন: শোরুম / গোডাউন-1"
                  />
                </div>

                <div className="sm:col-span-2">
                  <PhotoUploader
                    photos={form.photos}
                    onChange={(photos) => setField("photos", photos)}
                  />
                </div>
              </div>
            </div>

            <div className="plane-section">
              <div className="section-title">দামের ধরন</div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {(
                  [
                    [false, "একটাই দাম", "সবগুলোর জন্য একটাই কেনা/বিক্রির দাম"],
                    [true, "ভ্যারিয়েন্ট অনুযায়ী", "রঙ/সাইজ অনুযায়ী আলাদা দাম"],
                  ] as const
                ).map(([value, title, note]) => (
                  <button
                    key={String(value)}
                    type="button"
                    onClick={() => setField("hasVariants", value)}
                    aria-pressed={form.hasVariants === value}
                    className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${
                      form.hasVariants === value
                        ? "border-cyan-500 bg-cyan-50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span className="block text-sm font-medium text-slate-900">
                      {title}
                    </span>
                    <span className="block text-xs text-slate-500">{note}</span>
                  </button>
                ))}
              </div>
              {errors.variants && (
                <p className="mt-2 text-xs text-rose-600">{errors.variants}</p>
              )}
            </div>

            {showSinglePricing ? (
              <div className="plane-section">
                <div className="section-title">দাম ও স্টক</div>

                <label className="mb-3 flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.noStockRequired}
                    onChange={(e) => {
                      setField("noStockRequired", e.target.checked);
                      if (e.target.checked) setField("stock", 0);
                    }}
                    className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                  />
                  এই প্রোডাক্টের স্টক লাগবে না (সার্ভিস, ডিজিটাল প্রোডাক্ট ইত্যাদি)
                </label>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label htmlFor="buy-price" className="label">
                      কেনা দাম {!form.noStockRequired && "*"}
                    </label>
                    <input
                      id="buy-price"
                      type="number"
                      step="0.01"
                      value={form.buyPrice || ""}
                      onChange={(e) =>
                        setField("buyPrice", parseFloat(e.target.value) || 0)
                      }
                      className="input num"
                      placeholder="0.00"
                    />
                    {errors.buyPrice && (
                      <p className="mt-1 text-xs text-rose-600">{errors.buyPrice}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="sell-price" className="label">
                      বিক্রির দাম {!form.noStockRequired && "*"}
                    </label>
                    <input
                      id="sell-price"
                      type="number"
                      step="0.01"
                      value={form.sellPrice || ""}
                      onChange={(e) =>
                        setField("sellPrice", parseFloat(e.target.value) || 0)
                      }
                      className="input num"
                      placeholder="0.00"
                    />
                    {errors.sellPrice && (
                      <p className="mt-1 text-xs text-rose-600">{errors.sellPrice}</p>
                    )}
                  </div>

                  {!form.noStockRequired && (
                    <div>
                      <label htmlFor="stock" className="label">
                        স্টকের পরিমাণ *
                      </label>
                      <input
                        id="stock"
                        type="number"
                        value={form.stock || ""}
                        onChange={(e) =>
                          setField("stock", parseInt(e.target.value) || 0)
                        }
                        className="input num"
                        placeholder="0"
                      />
                      {errors.stock && (
                        <p className="mt-1 text-xs text-rose-600">{errors.stock}</p>
                      )}
                    </div>
                  )}
                </div>

                {form.buyPrice > 0 && form.sellPrice > 0 && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-slate-200 pt-3">
                    <span className="text-sm text-slate-600">প্রতি পিসে লাভ</span>
                    <span className="flex items-baseline gap-2">
                      <span
                        className={`text-sm font-semibold ${
                          profit > 0 ? "money-pos" : profit < 0 ? "money-neg" : "num"
                        }`}
                      >
                        {formatCurrency(Math.abs(profit))}
                      </span>
                      <span
                        className={`text-xs ${
                          profit > 0 ? "money-pos" : profit < 0 ? "money-neg" : "num"
                        }`}
                      >
                        ({margin.toFixed(1)}% লাভের হার)
                      </span>
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <VariantEditor
                variants={form.colorSizeVariants}
                onChange={(variants: ColorSize[]) =>
                  setField("colorSizeVariants", variants)
                }
              />
            )}

            <div className="plane-section">
              <div className="section-title">অতিরিক্ত তথ্য</div>
              <label htmlFor="details" className="label">
                বিবরণ
              </label>
              <textarea
                id="details"
                value={form.details}
                onChange={(e) => setField("details", e.target.value)}
                className="input min-h-24"
                placeholder="প্রোডাক্টের বিবরণ আর খুঁটিনাটি"
              />
            </div>

            {errors.submit && (
              <div className="plane-section">
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {errors.submit}
                </div>
              </div>
            )}

            <div className="plane-section">
              <div className="row-actions">
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/products")}
                  className="btn btn-ghost"
                  disabled={saving}
                >
                  <X className="h-4 w-4" />
                  বাতিল
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <Save className="h-4 w-4" />
                  {saving ? "যোগ হচ্ছে…" : "প্রোডাক্ট যোগ করুন"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
