"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ApiService } from "@/lib/api";
import { ShoppingCart, Plus, Minus, ArrowLeft, X } from "lucide-react";

interface StoreProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
  stock?: number;
}

interface StoreInfo {
  store_name: string;
  store_description?: string;
  store_logo?: string;
  products: StoreProduct[];
  terms_content?: string;
  privacy_content?: string;
}

interface CartItem extends StoreProduct {
  quantity: number;
}

export default function PublicStorePage() {
  const params = useParams();
  const domain = params.domain as string;

  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showCheckout, setShowCheckout] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderPlacedId, setOrderPlacedId] = useState<number | null>(null);
  const [buyer, setBuyer] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });

  useEffect(() => {
    if (domain) {
      loadStoreData();
    }
  }, [domain]);

  const loadStoreData = async () => {
    try {
      setLoading(true);
      // Call the backend API to get store data by domain
      const response = await ApiService.get(`/store/${domain}/`);
      setStoreInfo(response);
    } catch (error) {
      console.error("Error loading store:", error);
      setError("স্টোরটি পাওয়া যায়নি বা এখন বন্ধ আছে");
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: StoreProduct) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prevCart => {
      return prevCart.reduce((acc, item) => {
        if (item.id === productId) {
          if (item.quantity > 1) {
            acc.push({ ...item, quantity: item.quantity - 1 });
          }
        } else {
          acc.push(item);
        }
        return acc;
      }, [] as CartItem[]);
    });
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  // Sends the cart to the public storefront endpoint
  // (POST online-store/orders/create/<domain>/). Until now the checkout
  // button had no handler at all, so orders could never be placed.
  const handlePlaceOrder = async () => {
    if (!buyer.name.trim() || !buyer.phone.trim()) {
      setOrderError("নাম আর ফোন নম্বর দিন");
      return;
    }
    if (cart.length === 0) return;

    setPlacingOrder(true);
    setOrderError(null);
    try {
      const result = await ApiService.post(
        `/online-store/orders/create/${domain}/`,
        {
          customer: {
            name: buyer.name.trim(),
            phone: buyer.phone.trim(),
            email: buyer.email.trim(),
            address: buyer.address.trim(),
          },
          items: cart.map((item) => ({
            product_id: item.id,
            quantity: item.quantity,
          })),
          notes: buyer.notes.trim(),
        }
      );
      setOrderPlacedId(result?.order_id ?? null);
      setCart([]);
      setShowCheckout(false);
      setBuyer({ name: "", phone: "", email: "", address: "", notes: "" });
    } catch (error) {
      console.error("Error placing order:", error);
      setOrderError("অর্ডারটা পাঠানো যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setPlacingOrder(false);
    }
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCategories = () => {
    if (!storeInfo?.products) return [];
    const categories = [...new Set(storeInfo.products.map(p => p.category))];
    return categories.filter(Boolean);
  };

  const filteredProducts = storeInfo?.products?.filter(product =>
    selectedCategory === "all" || product.category === selectedCategory
  ) || [];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-cyan-600 border-t-transparent"></div>
          <p className="text-sm text-slate-500">স্টোর লোড হচ্ছে…</p>
        </div>
      </div>
    );
  }

  if (error || !storeInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="plane w-full max-w-md">
          <div className="plane-section text-center">
            <h1 className="page-title">স্টোর পাওয়া যায়নি</h1>
            <p className="page-sub">{error || "এই স্টোরটি এখন খোলা নেই।"}</p>
            <button
              onClick={() => window.history.back()}
              className="btn btn-ghost mx-auto mt-4"
            >
              <ArrowLeft className="h-4 w-4" />
              ফিরে যান
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-14 max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            {storeInfo.store_logo && (
              <img
                src={storeInfo.store_logo}
                alt={storeInfo.store_name}
                className="h-9 w-9 flex-shrink-0 rounded-lg object-cover"
              />
            )}
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold text-slate-900" title={storeInfo.store_name}>
                {storeInfo.store_name}
              </h1>
              {storeInfo.store_description && (
                <p className="truncate text-xs text-slate-500" title={storeInfo.store_description}>
                  {storeInfo.store_description}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => setShowCart(!showCart)}
            className="btn btn-primary relative"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>কার্ট</span>
            {getTotalItems() > 0 && (
              <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-[0.6875rem] num">
                {getTotalItems()}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="page">
        <div className="plane">
          {/* Category Filter */}
          {getCategories().length > 0 && (
            <div className="plane-section">
              <div className="section-title">ক্যাটাগরি</div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`btn btn-sm ${selectedCategory === "all" ? "btn-primary" : "btn-ghost"}`}
                >
                  সব প্রোডাক্ট
                </button>
                {getCategories().map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`btn btn-sm ${selectedCategory === category ? "btn-primary" : "btn-ghost"}`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Products Grid — hairline-divided cells, no nested cards */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-px bg-slate-200 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => (
                <div key={product.id} className="group flex flex-col bg-white p-4">
                  {product.image_url && (
                    <div className="mb-3 aspect-square overflow-hidden rounded-lg bg-slate-100">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                  )}

                  <h3 className="truncate font-medium text-slate-900" title={product.name}>
                    {product.name}
                  </h3>

                  {product.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                      {product.description}
                    </p>
                  )}

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="num text-base font-semibold text-slate-900">
                      ${product.price.toFixed(2)}
                    </span>

                    {product.stock !== undefined && (
                      <span className="badge badge-muted num">
                        স্টক: {product.stock}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => addToCart(product)}
                    className="btn btn-primary mt-3 w-full"
                  >
                    <Plus className="h-4 w-4" />
                    কার্টে যোগ করুন
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">এখানে এখনো কোনো প্রোডাক্ট নেই</div>
          )}
        </div>
      </div>

      {/* Cart Sidebar */}
      {showCart && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-white/45" onClick={() => setShowCart(false)}></div>
          <div className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col border-l border-slate-200 bg-white">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5">
              <h2 className="modal-title">আপনার কার্ট</h2>
              <button
                onClick={() => setShowCart(false)}
                aria-label="কার্ট বন্ধ করুন"
                className="text-slate-500 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="empty">কার্ট এখন খালি</div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 border-b border-slate-200 px-5 py-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-medium text-slate-900" title={item.name}>
                          {item.name}
                        </h3>
                        <p className="num text-sm text-slate-500">${item.price.toFixed(2)}</p>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-2">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          aria-label="একটি কমান"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="num w-6 text-center text-sm text-slate-900">{item.quantity}</span>
                        <button
                          onClick={() => addToCart(item)}
                          aria-label="একটি বাড়ান"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
                  <div className="mb-3 flex items-center justify-between text-base font-semibold text-slate-900">
                    <span>মোট</span>
                    <span className="num">${getTotalPrice().toFixed(2)}</span>
                  </div>
                  <button
                    className="btn btn-primary w-full"
                    onClick={() => {
                      setOrderError(null);
                      setShowCheckout(true);
                    }}
                  >
                    অর্ডার করুন
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Checkout — collects the buyer's details, then posts the order */}
      {showCheckout && (
        <div className="modal-backdrop" onClick={() => setShowCheckout(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2 className="modal-title">অর্ডারের তথ্য দিন</h2>
              <button
                onClick={() => setShowCheckout(false)}
                aria-label="বন্ধ করুন"
                className="text-slate-500 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="modal-body space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">আপনার নাম *</label>
                  <input
                    className="input"
                    value={buyer.name}
                    onChange={(e) =>
                      setBuyer({ ...buyer, name: e.target.value })
                    }
                    placeholder="নাম লিখুন"
                  />
                </div>
                <div>
                  <label className="label">ফোন নম্বর *</label>
                  <input
                    className="input"
                    value={buyer.phone}
                    onChange={(e) =>
                      setBuyer({ ...buyer, phone: e.target.value })
                    }
                    placeholder="01XXXXXXXXX"
                  />
                </div>
              </div>

              <div>
                <label className="label">ইমেইল</label>
                <input
                  type="email"
                  className="input"
                  value={buyer.email}
                  onChange={(e) => setBuyer({ ...buyer, email: e.target.value })}
                  placeholder="ইমেইল (না দিলেও চলবে)"
                />
              </div>

              <div>
                <label className="label">ঠিকানা</label>
                <textarea
                  className="textarea resize-none"
                  rows={2}
                  value={buyer.address}
                  onChange={(e) =>
                    setBuyer({ ...buyer, address: e.target.value })
                  }
                  placeholder="কোথায় পাঠাবো"
                />
              </div>

              <div>
                <label className="label">কিছু বলার থাকলে</label>
                <textarea
                  className="textarea resize-none"
                  rows={2}
                  value={buyer.notes}
                  onChange={(e) => setBuyer({ ...buyer, notes: e.target.value })}
                  placeholder="বাড়তি কোনো কথা"
                />
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-sm font-semibold text-slate-900">
                <span>মোট</span>
                <span className="num">${getTotalPrice().toFixed(2)}</span>
              </div>

              {orderError && (
                <p className="text-xs text-rose-600">{orderError}</p>
              )}
            </div>

            <div className="modal-foot">
              <button
                className="btn btn-ghost"
                onClick={() => setShowCheckout(false)}
                disabled={placingOrder}
              >
                বাতিল
              </button>
              <button
                className="btn btn-primary"
                onClick={handlePlaceOrder}
                disabled={placingOrder}
              >
                {placingOrder ? "পাঠানো হচ্ছে…" : "অর্ডার কনফার্ম করুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order placed */}
      {orderPlacedId !== null && (
        <div className="modal-backdrop" onClick={() => setOrderPlacedId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2 className="modal-title">অর্ডার হয়ে গেছে</h2>
              <button
                onClick={() => setOrderPlacedId(null)}
                aria-label="বন্ধ করুন"
                className="text-slate-500 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="modal-body">
              <p className="text-sm text-slate-600">
                আপনার অর্ডার নম্বর{" "}
                <span className="num font-semibold text-slate-900">
                  #{orderPlacedId}
                </span>
                । স্টোর থেকে শিগগিরই যোগাযোগ করা হবে।
              </p>
            </div>
            <div className="modal-foot">
              <button
                className="btn btn-primary"
                onClick={() => setOrderPlacedId(null)}
              >
                ঠিক আছে
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
