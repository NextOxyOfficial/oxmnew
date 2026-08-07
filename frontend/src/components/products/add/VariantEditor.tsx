"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useCurrencyFormatter } from "@/contexts/CurrencyContext";
import type { ColorSize } from "@/types/product-form";

interface Props {
  variants: ColorSize[];
  onChange: (variants: ColorSize[]) => void;
}

const COLORS = [
  "লাল", "নীল", "সবুজ", "কালো", "সাদা", "হলুদ", "গোলাপি",
  "ধূসর", "বাদামি", "কমলা", "বেগুনি", "সোনালি", "সিলভার",
];
const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "ফ্রি সাইজ"];
const WEIGHT_UNITS = ["g", "kg", "lb", "oz"] as const;

const CUSTOM = "নিজের";

const EMPTY_DRAFT = {
  color: "",
  size: "",
  weight: "",
  weight_unit: "g" as (typeof WEIGHT_UNITS)[number],
  custom_variant: "",
  buyPrice: "",
  sellPrice: "",
  stock: "",
};

/** Human label for a saved variant, skipping the parts that weren't filled in. */
export const variantLabel = (variant: ColorSize) =>
  [
    variant.color,
    variant.size,
    variant.weight ? `${variant.weight}${variant.weight_unit ?? ""}` : "",
    variant.custom_variant,
  ]
    .filter(Boolean)
    .join(" · ") || "ভ্যারিয়েন্ট";

/**
 * Add and list per-colour/size variants.
 *
 * Owns its own draft state — the page only ever sees the saved list, so a
 * half-typed variant can never leak into the product payload.
 */
export default function VariantEditor({ variants, onChange }: Props) {
  const formatCurrency = useCurrencyFormatter();
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [customColor, setCustomColor] = useState("");
  const [customSize, setCustomSize] = useState("");
  const [error, setError] = useState<string | null>(null);

  const setField = (field: keyof typeof EMPTY_DRAFT, value: string) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
    setError(null);
    if (field === "color" && value !== CUSTOM) setCustomColor("");
    if (field === "size" && value !== CUSTOM) setCustomSize("");
  };

  const handleAdd = () => {
    const color = draft.color === CUSTOM ? customColor.trim() : draft.color;
    const size = draft.size === CUSTOM ? customSize.trim() : draft.size;
    const weight = draft.weight ? Number(draft.weight) : undefined;
    const custom = draft.custom_variant.trim();

    if (!(color || size || weight || custom)) {
      setError("ভ্যারিয়েন্টটা চেনার জন্য অন্তত একটা ঘর ভরুন — রঙ, সাইজ, ওজন বা নিজের নাম");
      return;
    }
    if (Number(draft.buyPrice) <= 0 || Number(draft.sellPrice) <= 0) {
      setError("কেনা আর বিক্রির দাম দুটোই দিতে হবে");
      return;
    }
    if (Number(draft.stock) <= 0) {
      setError("স্টক কত সেটা দিন");
      return;
    }

    onChange([
      ...variants,
      {
        // Index keeps ids unique even when two are added in the same
        // millisecond, which Date.now() alone does not guarantee.
        id: `${Date.now()}-${variants.length}`,
        color,
        size,
        weight,
        weight_unit: weight ? draft.weight_unit : undefined,
        custom_variant: custom || undefined,
        buyPrice: Number(draft.buyPrice),
        sellPrice: Number(draft.sellPrice),
        stock: Number(draft.stock),
      },
    ]);

    setDraft(EMPTY_DRAFT);
    setCustomColor("");
    setCustomSize("");
  };

  const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);

  return (
    <>
      <div className="plane-section">
        <div className="section-title">নতুন ভ্যারিয়েন্ট</div>

        {error && (
          <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {error}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="label">রঙ</label>
            <select
              value={draft.color}
              onChange={(e) => setField("color", e.target.value)}
              className="select"
            >
              <option value="">রঙ সিলেক্ট করুন</option>
              {COLORS.map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
              <option value={CUSTOM}>{CUSTOM}</option>
            </select>
            {draft.color === CUSTOM && (
              <input
                type="text"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="input mt-1.5"
                placeholder="রঙের নাম লিখুন"
              />
            )}
          </div>

          <div>
            <label className="label">সাইজ</label>
            <select
              value={draft.size}
              onChange={(e) => setField("size", e.target.value)}
              className="select"
            >
              <option value="">সাইজ সিলেক্ট করুন</option>
              {SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
              <option value={CUSTOM}>{CUSTOM}</option>
            </select>
            {draft.size === CUSTOM && (
              <input
                type="text"
                value={customSize}
                onChange={(e) => setCustomSize(e.target.value)}
                className="input mt-1.5"
                placeholder="সাইজ লিখুন"
              />
            )}
          </div>

          <div>
            <label className="label">ওজন</label>
            <div className="flex gap-1.5">
              <input
                type="number"
                step="0.01"
                value={draft.weight}
                onChange={(e) => setField("weight", e.target.value)}
                className="input num min-w-0 flex-1"
                placeholder="0"
              />
              <select
                value={draft.weight_unit}
                onChange={(e) => setField("weight_unit", e.target.value)}
                className="select w-20 shrink-0"
                aria-label="ওজনের একক"
              >
                {WEIGHT_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">নিজের ভ্যারিয়েন্ট</label>
            <input
              type="text"
              value={draft.custom_variant}
              onChange={(e) => setField("custom_variant", e.target.value)}
              className="input"
              placeholder="যেমন: ৬৪ জিবি"
            />
          </div>

          <div>
            <label className="label">কেনা দাম *</label>
            <input
              type="number"
              step="0.01"
              value={draft.buyPrice}
              onChange={(e) => setField("buyPrice", e.target.value)}
              className="input num"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="label">বিক্রির দাম *</label>
            <input
              type="number"
              step="0.01"
              value={draft.sellPrice}
              onChange={(e) => setField("sellPrice", e.target.value)}
              className="input num"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="label">স্টক *</label>
            <input
              type="number"
              value={draft.stock}
              onChange={(e) => setField("stock", e.target.value)}
              className="input num"
              placeholder="0"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleAdd}
              className="btn btn-primary w-full"
            >
              <Plus className="h-4 w-4" />
              যোগ করুন
            </button>
          </div>
        </div>
      </div>

      <div className="plane-section">
        <div className="flex items-baseline justify-between gap-2">
          <span className="section-title mb-0">
            ভ্যারিয়েন্ট ({variants.length})
          </span>
          {variants.length > 0 && (
            <span className="num text-xs text-slate-500">
              মোট স্টক {totalStock}
            </span>
          )}
        </div>

        {variants.length === 0 ? (
          <div className="empty">
            এখনো কোনো ভ্যারিয়েন্ট যোগ করা হয়নি। রঙ বা সাইজ অনুযায়ী দাম আলাদা
            হলে উপরে যোগ করুন।
          </div>
        ) : (
          <div className="tbl-wrap mt-2">
            <table className="tbl">
              <thead>
                <tr>
                  <th>ভ্যারিয়েন্ট</th>
                  <th className="cell-num">কেনা</th>
                  <th className="cell-num">বিক্রি</th>
                  <th className="cell-num">স্টক</th>
                  <th className="cell-num">লাভ</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {variants.map((variant) => (
                  <tr key={variant.id}>
                    <td className="cell-strong">{variantLabel(variant)}</td>
                    <td className="cell-num num">
                      {formatCurrency(variant.buyPrice)}
                    </td>
                    <td className="cell-num num">
                      {formatCurrency(variant.sellPrice)}
                    </td>
                    <td className="cell-num num">{variant.stock}</td>
                    <td className="cell-num num">
                      <span
                        className={
                          variant.sellPrice - variant.buyPrice >= 0
                            ? "money-pos"
                            : "money-neg"
                        }
                      >
                        {formatCurrency(variant.sellPrice - variant.buyPrice)}
                      </span>
                    </td>
                    <td className="cell-num">
                      <button
                        type="button"
                        onClick={() =>
                          onChange(variants.filter((v) => v.id !== variant.id))
                        }
                        aria-label={`${variantLabel(variant)} মুছে দিন`}
                        title="মুছে দিন"
                        className="btn btn-ghost btn-sm text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
