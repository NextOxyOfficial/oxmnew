"use client";

import { useCurrencyFormatter } from "@/contexts/CurrencyContext";
import { ApiService } from "@/lib/api";
import { compressImages } from "@/lib/imageCompression";
import {
  ArrowLeft,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Category {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
}

interface Supplier {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  contact_person?: string;
  notes?: string;
  is_active: boolean;
}

interface ProductPhoto {
  id: number;
  image: string;
  alt_text?: string | null;
  order?: number;
}

type WeightUnit = "g" | "kg" | "lb" | "oz";

interface ProductVariant {
  id: number;
  color?: string | null;
  size?: string | null;
  weight?: number | string | null;
  weight_unit?: WeightUnit | null;
  custom_variant?: string | null;
  buy_price: number | string;
  sell_price: number | string;
  stock: number;
}

/** Shape of the variant editor row before it is sent to the API. */
interface VariantDraft {
  color: string;
  size: string;
  weight: number | "";
  weight_unit: WeightUnit;
  custom_variant: string;
  buyPrice: number | "";
  sellPrice: number | "";
  stock: number | "";
}

const EMPTY_VARIANT: VariantDraft = {
  color: "",
  size: "",
  weight: "",
  weight_unit: "g",
  custom_variant: "",
  buyPrice: "",
  sellPrice: "",
  stock: "",
};

interface Product {
  id: number;
  name: string;
  product_code?: string;
  category?: number;
  category_name?: string;
  supplier?: number;
  supplier_name?: string;
  location: string;
  details?: string;
  buy_price?: number;
  sell_price?: number;
  cost?: number;
  price?: number;
  stock?: number;
  is_active: boolean;
  has_variants: boolean;
  no_stock_required?: boolean;
  photos?: ProductPhoto[];
  variants?: ProductVariant[];
  created_at: string;
  updated_at: string;
}

interface ProductFormData {
  name: string;
  productCode: string;
  category: number | "";
  supplier: number | "";
  location: string;
  details: string;
  buyPrice: number | "";
  sellPrice: number | "";
  stock: number | "";
  is_active: boolean;
  no_stock_required: boolean;
}

/**
 * The colour / size / weight / price row used both for adding a new variant
 * and for editing an existing one, so the two stay in sync.
 */
function VariantFields({
  value,
  onChange,
}: {
  value: VariantDraft;
  onChange: (next: VariantDraft) => void;
}) {
  const set = (patch: Partial<VariantDraft>) =>
    onChange({ ...value, ...patch });

  const num = (raw: string): number | "" => {
    if (raw === "") return "";
    const n = parseFloat(raw);
    return Number.isNaN(n) ? "" : n;
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="label">রঙ</label>
          <input
            type="text"
            className="input"
            value={value.color}
            onChange={(e) => set({ color: e.target.value })}
            placeholder="যেমন: লাল"
          />
        </div>
        <div>
          <label className="label">সাইজ</label>
          <input
            type="text"
            className="input"
            value={value.size}
            onChange={(e) => set({ size: e.target.value })}
            placeholder="যেমন: XL"
          />
        </div>
        <div>
          <label className="label">ওজন</label>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              step="0.01"
              className="input num"
              value={value.weight}
              onChange={(e) => set({ weight: num(e.target.value) })}
              placeholder="0"
            />
            <select
              className="select w-24 shrink-0"
              value={value.weight_unit}
              onChange={(e) =>
                set({ weight_unit: e.target.value as WeightUnit })
              }
              aria-label="ওজনের একক"
            >
              <option value="g">গ্রাম</option>
              <option value="kg">কেজি</option>
              <option value="lb">পাউন্ড</option>
              <option value="oz">আউন্স</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">নিজের মতো</label>
          <input
            type="text"
            className="input"
            value={value.custom_variant}
            onChange={(e) => set({ custom_variant: e.target.value })}
            placeholder="অন্য কোনো রকম"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="label">কেনা দাম</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="input num"
            value={value.buyPrice}
            onChange={(e) => set({ buyPrice: num(e.target.value) })}
            placeholder="0"
          />
        </div>
        <div>
          <label className="label">বিক্রির দাম</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="input num"
            value={value.sellPrice}
            onChange={(e) => set({ sellPrice: num(e.target.value) })}
            placeholder="0"
          />
        </div>
        <div>
          <label className="label">স্টক</label>
          <input
            type="number"
            min="0"
            step="1"
            className="input num"
            value={value.stock}
            onChange={(e) => set({ stock: num(e.target.value) })}
            placeholder="0"
          />
        </div>
      </div>
    </div>
  );
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    productCode: "",
    category: "",
    supplier: "",
    location: "",
    details: "",
    buyPrice: 0,
    sellPrice: 0,
    stock: 0,
    is_active: true,
    no_stock_required: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [product, setProduct] = useState<Product | null>(null);

  // ── Photos ──────────────────────────────────────────────────────────
  const [photos, setPhotos] = useState<ProductPhoto[]>([]);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState<number | null>(null);

  // ── Variants ────────────────────────────────────────────────────────
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [newVariant, setNewVariant] = useState<VariantDraft>(EMPTY_VARIANT);
  const [editingVariantId, setEditingVariantId] = useState<number | null>(null);
  const [variantDraft, setVariantDraft] = useState<VariantDraft>(EMPTY_VARIANT);
  const [variantBusy, setVariantBusy] = useState(false);
  const [variantError, setVariantError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    isVisible: boolean;
    type: "success" | "error";
    message: string;
  }>({ isVisible: false, type: "success", message: "" });

  const formatCurrency = useCurrencyFormatter();

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ isVisible: true, type, message });
    setTimeout(() => {
      setNotification({ isVisible: false, type: "success", message: "" });
    }, 5000);
  };

  // Helper function to get numeric value from form field
  const getNumericValue = (value: number | string): number => {
    return typeof value === "number" ? value : parseFloat(value || "0");
  };

  // Fetch product data and supporting data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setErrors({});

        const [productData, categoriesResponse, suppliersResponse] =
          await Promise.all([
            ApiService.getProduct(parseInt(productId)),
            ApiService.getCategories(),
            ApiService.getSuppliers(),
          ]);

        // Handle categories response format {categories: [...]}
        const processedCategories =
          categoriesResponse?.categories || categoriesResponse || [];
        const processedSuppliers = suppliersResponse || [];

        setProduct(productData);
        setCategories(processedCategories);
        setSuppliers(processedSuppliers);
        setPhotos(productData.photos || []);
        setVariants(productData.variants || []);
        setHasVariants(Boolean(productData.has_variants));

        // Populate form with product data
        setFormData({
          name: productData.name || "",
          productCode: productData.product_code || "",
          category: productData.category || "",
          supplier: productData.supplier || "",
          location: productData.location || "",
          details: productData.details || "",
          buyPrice: productData.buy_price || productData.cost || 0,
          sellPrice: productData.sell_price || productData.price || 0,
          stock: productData.stock || 0,
          is_active: productData.is_active,
          no_stock_required: productData.no_stock_required || false,
        });
      } catch (error) {
        console.error("Error fetching data:", error);
        setErrors({
          data: "প্রোডাক্টের তথ্য আনা যায়নি। পেজটা একবার রিফ্রেশ করুন।",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (productId) {
      fetchData();
    }
  }, [productId]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
        // If enabling no stock required, reset stock to 0
        ...(name === "no_stock_required" && checked ? { stock: 0 } : {}),
      }));
    } else if (
      name === "buyPrice" ||
      name === "sellPrice" ||
      name === "stock"
    ) {
      // Allow empty string for numeric fields so users can clear the input
      const numericValue = value === "" ? "" : parseFloat(value);
      setFormData((prev) => ({
        ...prev,
        [name]: isNaN(numericValue as number) ? "" : numericValue,
      }));
    } else if (name === "category" || name === "supplier") {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? "" : parseInt(value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "প্রোডাক্টের নাম দিন";
    }

    // Location is now optional, so no validation needed

    if (!hasVariants) {
      // Convert empty strings to 0 for validation
      const buyPrice = getNumericValue(formData.buyPrice);
      const sellPrice = getNumericValue(formData.sellPrice);
      const stock = getNumericValue(formData.stock);

      // Only validate prices if stock is required, or if prices are provided
      if (!formData.no_stock_required) {
        if (buyPrice < 0) {
          newErrors.buyPrice = "কেনা দাম মাইনাস হতে পারবে না";
        }

        if (sellPrice < 0) {
          newErrors.sellPrice = "বিক্রির দাম মাইনাস হতে পারবে না";
        }

        if (sellPrice > 0 && buyPrice > 0 && sellPrice < buyPrice) {
          newErrors.sellPrice =
            "বিক্রির দাম কেনা দামের সমান বা তার বেশি হতে হবে";
        }

        // Allow stock to be zero or more
        if (stock < 0) {
          newErrors.stock = "স্টকের পরিমাণ মাইনাস হতে পারবে না";
        }
      } else {
        // For no-stock products, only validate if prices are provided and non-zero
        if (buyPrice > 0 && sellPrice > 0 && sellPrice < buyPrice) {
          newErrors.sellPrice =
            "বিক্রির দাম কেনা দামের সমান বা তার বেশি হতে হবে";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data for API - use null instead of undefined so fields are included in PATCH
      const updateData: Record<string, unknown> = {
        name: formData.name,
        product_code: formData.productCode || "",
        category:
          typeof formData.category === "number" ? formData.category : null,
        supplier:
          typeof formData.supplier === "number" ? formData.supplier : null,
        location: formData.location.trim() || "",
        details: formData.details,
        is_active: formData.is_active,
        no_stock_required: formData.no_stock_required,
        has_variants: hasVariants,
      };

      // Only include pricing data for non-variant products
      if (!hasVariants) {
        // Convert empty strings to 0 for API submission
        const buyPrice = getNumericValue(formData.buyPrice);
        const sellPrice = getNumericValue(formData.sellPrice);
        const stock = getNumericValue(formData.stock);

        Object.assign(updateData, {
          buy_price: buyPrice,
          sell_price: sellPrice,
          stock: formData.no_stock_required ? 0 : stock,
        });
      }

      // Call API to update product
      await ApiService.updateProduct(
        parseInt(productId),
        updateData
      );

      // Show success notification
      showNotification("success", "প্রোডাক্টটা আপডেট হয়ে গেছে!");

      // Navigate back to products list after a short delay
      setTimeout(() => {
        router.push("/dashboard/products");
      }, 1500);
    } catch (error) {
      console.error("Error updating product:", error);
      showNotification(
        "error",
        error instanceof Error
          ? error.message
          : "প্রোডাক্টটা আপডেট করা যায়নি। আবার চেষ্টা করুন।"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  // ── Photo handlers ──────────────────────────────────────────────────

  const handlePhotoSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ""; // let the same file be picked again after a delete
    if (!files.length) return;

    setIsUploadingPhotos(true);
    try {
      // Shrink client-side first so uploads stay small on slow connections.
      const compressed = await compressImages(files, {
        maxWidth: 800,
        quality: 0.8,
      });
      const created = await ApiService.addProductPhotos(
        parseInt(productId),
        compressed
      );
      const added: ProductPhoto[] = Array.isArray(created) ? created : [created];
      setPhotos((prev) => [...prev, ...added]);
      showNotification("success", "ছবি যোগ হয়ে গেছে");
    } catch (error) {
      console.error("Error uploading photos:", error);
      showNotification("error", "ছবি আপলোড করা যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setIsUploadingPhotos(false);
    }
  };

  const handlePhotoDelete = async (photoId: number) => {
    setDeletingPhotoId(photoId);
    try {
      await ApiService.deleteProductPhoto(parseInt(productId), photoId);
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      showNotification("success", "ছবিটা মুছে ফেলা হয়েছে");
    } catch (error) {
      console.error("Error deleting photo:", error);
      showNotification("error", "ছবিটা মুছতে পারলাম না। আবার চেষ্টা করুন।");
    } finally {
      setDeletingPhotoId(null);
    }
  };

  // ── Variant handlers ────────────────────────────────────────────────

  /** Every variant needs at least one distinguishing attribute. */
  const describesVariant = (v: VariantDraft) =>
    Boolean(
      v.color.trim() ||
        v.size.trim() ||
        v.custom_variant.trim() ||
        (typeof v.weight === "number" && v.weight > 0)
    );

  const validateVariant = (v: VariantDraft): string | null => {
    if (!describesVariant(v)) {
      return "রঙ, সাইজ, ওজন বা নিজের মতো — অন্তত একটা দিন";
    }
    const buy = getNumericValue(v.buyPrice);
    const sell = getNumericValue(v.sellPrice);
    const stock = getNumericValue(v.stock);
    if (buy < 0 || sell < 0) return "দাম মাইনাস হতে পারবে না";
    if (sell > 0 && buy > 0 && sell < buy) {
      return "বিক্রির দাম কেনা দামের সমান বা তার বেশি হতে হবে";
    }
    if (stock < 0) return "স্টক মাইনাস হতে পারবে না";
    return null;
  };

  const draftToPayload = (v: VariantDraft) => ({
    color: v.color.trim(),
    size: v.size.trim(),
    weight: typeof v.weight === "number" && v.weight > 0 ? v.weight : null,
    weight_unit:
      typeof v.weight === "number" && v.weight > 0 ? v.weight_unit : null,
    custom_variant: v.custom_variant.trim() || null,
    buy_price: getNumericValue(v.buyPrice),
    sell_price: getNumericValue(v.sellPrice),
    stock: getNumericValue(v.stock),
  });

  const variantToDraft = (v: ProductVariant): VariantDraft => ({
    color: v.color || "",
    size: v.size || "",
    weight: v.weight === null || v.weight === undefined ? "" : Number(v.weight),
    weight_unit: (v.weight_unit as WeightUnit) || "g",
    custom_variant: v.custom_variant || "",
    buyPrice: Number(v.buy_price) || 0,
    sellPrice: Number(v.sell_price) || 0,
    stock: v.stock ?? 0,
  });

  const handleAddVariant = async () => {
    const problem = validateVariant(newVariant);
    if (problem) {
      setVariantError(problem);
      return;
    }
    setVariantError(null);
    setVariantBusy(true);
    try {
      // A product must be flagged as variant-based before variants attach.
      if (!hasVariants || !product?.has_variants) {
        await ApiService.updateProduct(parseInt(productId), {
          has_variants: true,
        } as never);
        setHasVariants(true);
        setProduct((prev) => (prev ? { ...prev, has_variants: true } : prev));
      }
      const created = await ApiService.addProductVariant(
        parseInt(productId),
        draftToPayload(newVariant)
      );
      setVariants((prev) => [...prev, created]);
      setNewVariant(EMPTY_VARIANT);
      showNotification("success", "ভ্যারিয়েন্ট যোগ হয়েছে");
    } catch (error) {
      console.error("Error adding variant:", error);
      setVariantError("ভ্যারিয়েন্ট যোগ করা যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setVariantBusy(false);
    }
  };

  const handleSaveVariant = async (variantId: number) => {
    const problem = validateVariant(variantDraft);
    if (problem) {
      setVariantError(problem);
      return;
    }
    setVariantError(null);
    setVariantBusy(true);
    try {
      const updated = await ApiService.updateProductVariant(
        parseInt(productId),
        variantId,
        draftToPayload(variantDraft)
      );
      setVariants((prev) =>
        prev.map((v) => (v.id === variantId ? { ...v, ...updated } : v))
      );
      setEditingVariantId(null);
      showNotification("success", "ভ্যারিয়েন্ট আপডেট হয়েছে");
    } catch (error) {
      console.error("Error updating variant:", error);
      setVariantError("ভ্যারিয়েন্ট আপডেট করা যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setVariantBusy(false);
    }
  };

  const handleDeleteVariant = async (variantId: number) => {
    setVariantBusy(true);
    try {
      await ApiService.deleteProductVariant(parseInt(productId), variantId);
      setVariants((prev) => prev.filter((v) => v.id !== variantId));
      if (editingVariantId === variantId) setEditingVariantId(null);
      showNotification("success", "ভ্যারিয়েন্ট মুছে ফেলা হয়েছে");
    } catch (error) {
      console.error("Error deleting variant:", error);
      showNotification("error", "ভ্যারিয়েন্ট মুছতে পারলাম না।");
    } finally {
      setVariantBusy(false);
    }
  };

  /** Label like "লাল / XL / 500 g" for the table's first column. */
  const variantLabel = (v: ProductVariant) => {
    const parts = [v.color, v.size].filter(
      (p) => p && String(p).trim()
    ) as string[];
    if (v.weight) parts.push(`${v.weight} ${v.weight_unit || ""}`.trim());
    if (v.custom_variant) parts.push(v.custom_variant);
    return parts.length ? parts.join(" / ") : "—";
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="page">
        <header className="page-head">
          <div>
            <h1 className="page-title">প্রোডাক্ট এডিট করুন</h1>
            <p className="page-sub">লোড হচ্ছে…</p>
          </div>
        </header>

        <div className="plane">
          <div className="plane-section">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 rounded-lg bg-slate-100"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (errors.data) {
    return (
      <div className="page">
        <header className="page-head">
          <div>
            <h1 className="page-title">প্রোডাক্ট এডিট করুন</h1>
            <p className="page-sub">প্রোডাক্টের তথ্য আর দাম আপডেট করুন</p>
          </div>
        </header>

        <div className="plane">
          <div className="empty">
            <p className="text-sm font-medium text-slate-900">
              কিছু একটা সমস্যা হয়েছে
            </p>
            <p className="mt-1 text-sm text-slate-600">{errors.data}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-ghost mt-4"
            >
              আবার চেষ্টা করুন
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="page">
        <header className="page-head">
          <div>
            <h1 className="page-title">প্রোডাক্ট এডিট করুন</h1>
            <p className="page-sub">প্রোডাক্টের তথ্য আর দাম আপডেট করুন</p>
          </div>
        </header>

        <div className="plane">
          <div className="empty">
            <p className="text-sm font-medium text-slate-900">
              প্রোডাক্টটা পাওয়া যায়নি
            </p>
            <p className="mt-1 text-sm text-slate-600">
              যে প্রোডাক্টটা খুঁজছেন সেটা আর নেই বা খুঁজে পাওয়া যাচ্ছে না।
            </p>
            <button
              onClick={() => router.push("/dashboard/products")}
              className="btn btn-ghost mt-4"
            >
              প্রোডাক্টের তালিকায় ফিরুন
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page page-narrow">
      <header className="page-head">
        <div>
          <Link
            href="/dashboard/products"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            প্রোডাক্টের লিস্ট
          </Link>
          <h1 className="page-title mt-1">প্রোডাক্ট এডিট</h1>
          <p className="page-sub">প্রোডাক্টের তথ্য আর দাম আপডেট করুন</p>
        </div>
        <span
          className={`badge ${
            formData.is_active ? "badge-success" : "badge-muted"
          }`}
        >
          {formData.is_active ? "Active" : "Inactive"}
        </span>
      </header>

      <form onSubmit={handleSubmit}>
        <div className="plane">
          {/* Notification */}
          {notification.isVisible && (
            <div
              className="plane-section flex flex-wrap items-center gap-2"
              role="status"
              aria-live="polite"
            >
              <span
                className={`badge ${
                  notification.type === "success"
                    ? "badge-success"
                    : "badge-danger"
                }`}
              >
                {notification.type === "success" ? "হয়ে গেছে" : "সমস্যা"}
              </span>
              <p className="text-sm text-slate-600">{notification.message}</p>
            </div>
          )}

          {/* Basic information */}
          <div className="plane-section">
            <div className="section-title">প্রোডাক্টের তথ্য</div>

            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="label">
                  প্রোডাক্টের নাম *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`input ${errors.name ? "border-rose-600" : ""}`}
                  placeholder="প্রোডাক্টের নাম লিখুন"
                />
                {errors.name && (
                  <p className="text-xs text-rose-600 mt-1">{errors.name}</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="productCode" className="label">
                    প্রোডাক্টের কোড
                  </label>
                  <input
                    type="text"
                    id="productCode"
                    name="productCode"
                    value={formData.productCode}
                    onChange={handleInputChange}
                    className={`input ${
                      errors.productCode ? "border-rose-600" : ""
                    }`}
                    placeholder="কোড, SKU বা পার্ট নম্বর দিন"
                  />
                  {errors.productCode && (
                    <p className="text-xs text-rose-600 mt-1">
                      {errors.productCode}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="location" className="label">
                    কোথায় রাখা আছে
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className={`input ${
                      errors.location ? "border-rose-600" : ""
                    }`}
                    placeholder="মালটা কোথায় রাখা (ইচ্ছা হলে দিন)"
                  />
                  {errors.location && (
                    <p className="text-xs text-rose-600 mt-1">
                      {errors.location}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="category" className="label">
                    ক্যাটাগরি
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="select"
                  >
                    <option value="">ক্যাটাগরি সিলেক্ট করুন</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="supplier" className="label">
                    সাপ্লায়ার
                  </label>
                  <select
                    id="supplier"
                    name="supplier"
                    value={formData.supplier}
                    onChange={handleInputChange}
                    className="select"
                  >
                    <option value="">সাপ্লায়ার সিলেক্ট করুন</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing and Stock (only for non-variant products) */}
          {/* Pricing type — chosen before the fields it governs */}
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
                  onClick={() => setHasVariants(value)}
                  aria-pressed={hasVariants === value}
                  className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${
                    hasVariants === value
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

          </div>

          {!hasVariants && (
            <div className="plane-section">
              <div className="section-title">দাম ও স্টক</div>

              <div className="space-y-4">
                {/* No Stock Required Checkbox */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="no_stock_required"
                    name="no_stock_required"
                    checked={formData.no_stock_required}
                    onChange={handleInputChange}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-200 text-cyan-600"
                  />
                  <label
                    htmlFor="no_stock_required"
                    className="text-sm text-slate-600"
                  >
                    এই প্রোডাক্টের স্টক লাগবে না (সার্ভিস, ডিজিটাল প্রোডাক্ট ইত্যাদি)
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label htmlFor="buyPrice" className="label">
                      কেনা দাম (
                      {formatCurrency(0)
                        .replace(/\d|[.,]/g, "")
                        .trim()}
                      ) {!formData.no_stock_required && "*"}
                    </label>
                    <input
                      type="number"
                      id="buyPrice"
                      name="buyPrice"
                      value={formData.buyPrice}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className={`input num ${
                        errors.buyPrice ? "border-rose-600" : ""
                      }`}
                      placeholder="0.00"
                    />
                    {errors.buyPrice && (
                      <p className="text-xs text-rose-600 mt-1">
                        {errors.buyPrice}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="sellPrice" className="label">
                      বিক্রির দাম (
                      {formatCurrency(0)
                        .replace(/\d|[.,]/g, "")
                        .trim()}
                      ) {!formData.no_stock_required && "*"}
                    </label>
                    <input
                      type="number"
                      id="sellPrice"
                      name="sellPrice"
                      value={formData.sellPrice}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className={`input num ${
                        errors.sellPrice ? "border-rose-600" : ""
                      }`}
                      placeholder="0.00"
                    />
                    {errors.sellPrice && (
                      <p className="text-xs text-rose-600 mt-1">
                        {errors.sellPrice}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="stock" className="label">
                      স্টকের পরিমাণ {!formData.no_stock_required && "*"}
                    </label>
                    <input
                      type="number"
                      id="stock"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      min={formData.no_stock_required ? "0" : "0"}
                      step="1"
                      disabled={formData.no_stock_required}
                      className={`input num ${
                        errors.stock ? "border-rose-600" : ""
                      }`}
                      placeholder={formData.no_stock_required ? "লাগবে না" : "0"}
                    />
                    {errors.stock && (
                      <p className="text-xs text-rose-600 mt-1">
                        {errors.stock}
                      </p>
                    )}
                  </div>
                </div>

                {/* Profit Display (only for non-variant products) — amount and
                    margin share one row so the pricing block stays compact. */}
                {!hasVariants &&
                  getNumericValue(formData.buyPrice) > 0 &&
                  getNumericValue(formData.sellPrice) > 0 &&
                  (() => {
                    const buy = getNumericValue(formData.buyPrice);
                    const sell = getNumericValue(formData.sellPrice);
                    const profit = sell - buy;
                    const margin = sell > 0 ? (profit / sell) * 100 : 0;
                    const tone =
                      profit > 0
                        ? "money-pos"
                        : profit < 0
                        ? "money-neg"
                        : "num text-amber-700";

                    return (
                      <div className="border-t border-slate-200 pt-3">
                        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                          <span className="text-sm text-slate-600">
                            প্রতি পিসে লাভ
                          </span>
                          <span className="flex items-baseline gap-2">
                            <span className={`text-sm font-semibold ${tone}`}>
                              {formatCurrency(Math.abs(profit))}
                            </span>
                            <span className={`text-xs ${tone}`}>
                              ({margin.toFixed(1)}% লাভের হার)
                            </span>
                          </span>
                        </div>
                      </div>
                    );
                  })()}
              </div>
            </div>
          )}

          {/* Photos */}
          <div className="plane-section">
            <div className="section-title">প্রোডাক্টের ছবি</div>

            <div className="flex flex-wrap gap-3">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative h-24 w-24 overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                >
                  <Image
                    src={photo.image}
                    alt={photo.alt_text || "প্রোডাক্টের ছবি"}
                    fill
                    sizes="96px"
                    className="object-cover"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={() => handlePhotoDelete(photo.id)}
                    disabled={deletingPhotoId === photo.id}
                    title="ছবিটা মুছে ফেলুন"
                    aria-label="ছবিটা মুছে ফেলুন"
                    className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-rose-600 shadow-sm hover:bg-white disabled:opacity-50"
                  >
                    {deletingPhotoId === photo.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <X className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              ))}

              <label
                className={`flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-200 text-slate-500 hover:border-cyan-600 hover:text-cyan-600 ${
                  isUploadingPhotos ? "pointer-events-none opacity-60" : ""
                }`}
              >
                {isUploadingPhotos ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <ImagePlus className="h-5 w-5" />
                )}
                <span className="text-xs">
                  {isUploadingPhotos ? "যোগ হচ্ছে…" : "ছবি যোগ"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </label>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              একসাথে কয়েকটা ছবি দিতে পারেন। আপলোডের আগে ছবি ছোট করে নেওয়া হয়।
            </p>
          </div>

          {/* Variants — only when this product is priced per variant */}
          {hasVariants && (
          <div className="plane-section">
            <div className="section-title">ভ্যারিয়েন্ট</div>

            <div className="mt-4 space-y-4">
                {variants.length > 0 && (
                  <div className="tbl-wrap">
                    <table className="tbl">
                      <thead>
                        <tr>
                          <th>ভ্যারিয়েন্ট</th>
                          <th className="cell-num">কেনা দাম</th>
                          <th className="cell-num">বিক্রির দাম</th>
                          <th className="cell-num">স্টক</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {variants.map((v) =>
                          editingVariantId === v.id ? (
                            <tr key={v.id}>
                              <td colSpan={5}>
                                <VariantFields
                                  value={variantDraft}
                                  onChange={setVariantDraft}
                                />
                                <div className="mt-3 flex justify-end gap-2">
                                  <button
                                    type="button"
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => {
                                      setEditingVariantId(null);
                                      setVariantError(null);
                                    }}
                                    disabled={variantBusy}
                                  >
                                    বাতিল
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-primary btn-sm"
                                    onClick={() => handleSaveVariant(v.id)}
                                    disabled={variantBusy}
                                  >
                                    {variantBusy ? "সেভ হচ্ছে…" : "সেভ করুন"}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            <tr key={v.id}>
                              <td className="cell-strong">{variantLabel(v)}</td>
                              <td className="cell-num">
                                {formatCurrency(Number(v.buy_price) || 0)}
                              </td>
                              <td className="cell-num">
                                {formatCurrency(Number(v.sell_price) || 0)}
                              </td>
                              <td className="cell-num">{v.stock}</td>
                              <td className="text-right whitespace-nowrap">
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-sm"
                                  title="এডিট করুন"
                                  aria-label="ভ্যারিয়েন্ট এডিট করুন"
                                  onClick={() => {
                                    setEditingVariantId(v.id);
                                    setVariantDraft(variantToDraft(v));
                                    setVariantError(null);
                                  }}
                                  disabled={variantBusy}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-sm ml-1 text-rose-600"
                                  title="ডিলিট করুন"
                                  aria-label="ভ্যারিয়েন্ট ডিলিট করুন"
                                  onClick={() => handleDeleteVariant(v.id)}
                                  disabled={variantBusy}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Add a new variant */}
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="mb-3 text-sm font-medium text-slate-900">
                    নতুন ভ্যারিয়েন্ট যোগ করুন
                  </p>
                  <VariantFields value={newVariant} onChange={setNewVariant} />
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={handleAddVariant}
                      disabled={variantBusy}
                    >
                      {variantBusy ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Plus className="h-3.5 w-3.5" />
                      )}
                      যোগ করুন
                    </button>
                  </div>
                </div>

                {variantError && (
                  <p className="text-xs text-rose-600">{variantError}</p>
                )}

                {variants.length === 0 && (
                  <p className="text-xs text-slate-500">
                    এখনো কোনো ভ্যারিয়েন্ট নেই। উপরে থেকে যোগ করুন — ভ্যারিয়েন্ট
                    থাকলে দাম আর স্টক ভ্যারিয়েন্ট অনুযায়ী হিসাব হবে।
                  </p>
                )}
            </div>
          </div>
          )}

          {/* Extra information */}
          <div className="plane-section">
            <div className="section-title">অতিরিক্ত তথ্য</div>

            <div className="space-y-4">
              <div>
                <label htmlFor="details" className="label">
                  বিবরণ
                </label>
                <textarea
                  id="details"
                  name="details"
                  value={formData.details}
                  onChange={handleInputChange}
                  rows={4}
                  className="textarea resize-none"
                  placeholder="প্রোডাক্ট সম্পর্কে বাড়তি কিছু লিখুন…"
                />
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-200 text-cyan-600"
                />
                <label htmlFor="is_active" className="text-sm text-slate-600">
                  প্রোডাক্টটা চালু আছে — বন্ধ করলে বিক্রির সময় আর দেখাবে না
                </label>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="plane-section">
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="btn btn-ghost"
              >
                বাতিল
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    সেভ হচ্ছে…
                  </>
                ) : (
                  <>
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    সেভ করুন
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
