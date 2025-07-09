"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ApiService } from "@/lib/api";
import { ShoppingCart, Plus, Minus, Star, ArrowLeft } from "lucide-react";

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
      setError("Store not found or unavailable");
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading store...</p>
        </div>
      </div>
    );
  }

  if (error || !storeInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mb-2">Store Not Found</h1>
          <p className="text-slate-400 mb-4">{error || "This store is not available."}</p>
          <button 
            onClick={() => window.history.back()}
            className="flex items-center space-x-2 mx-auto px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur-md border-b border-slate-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              {storeInfo.store_logo && (
                <img 
                  src={storeInfo.store_logo} 
                  alt="Store Logo" 
                  className="h-10 w-10 rounded-lg object-cover"
                />
              )}
              <div>
                <h1 className="text-xl font-bold text-slate-100">{storeInfo.store_name}</h1>
                {storeInfo.store_description && (
                  <p className="text-sm text-slate-400">{storeInfo.store_description}</p>
                )}
              </div>
            </div>
            
            <button
              onClick={() => setShowCart(!showCart)}
              className="relative flex items-center space-x-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
            >
              <ShoppingCart className="h-5 w-5" />
              <span>Cart</span>
              {getTotalItems() > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Filter */}
        {getCategories().length > 0 && (
          <div className="mb-8">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === "all"
                    ? "bg-cyan-500 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                All Products
              </button>
              {getCategories().map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? "bg-cyan-500 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition-all group">
              {product.image_url && (
                <div className="aspect-square bg-slate-700 rounded-lg mb-4 overflow-hidden">
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <h3 className="font-semibold text-slate-100 group-hover:text-cyan-400 transition-colors">
                  {product.name}
                </h3>
                
                {product.description && (
                  <p className="text-sm text-slate-400 line-clamp-2">
                    {product.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-cyan-400">
                    ${product.price.toFixed(2)}
                  </span>
                  
                  {product.stock !== undefined && (
                    <span className="text-xs text-slate-400">
                      Stock: {product.stock}
                    </span>
                  )}
                </div>
                
                <button
                  onClick={() => addToCart(product)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add to Cart</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-slate-800/50 rounded-lg p-8 max-w-md mx-auto">
              <h3 className="text-lg font-medium text-slate-300 mb-2">No products available</h3>
              <p className="text-sm text-slate-400">This store doesn't have any products yet.</p>
            </div>
          </div>
        )}
      </div>

      {/* Cart Sidebar */}
      {showCart && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCart(false)}></div>
          <div className="absolute right-0 top-0 h-full w-96 bg-slate-900 border-l border-slate-700 shadow-xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-100">Shopping Cart</h3>
                <button
                  onClick={() => setShowCart(false)}
                  className="text-slate-400 hover:text-slate-300"
                >
                  ✕
                </button>
              </div>

              {cart.length === 0 ? (
                <p className="text-slate-400 text-center py-8">Your cart is empty</p>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3 bg-slate-800/50 rounded-lg p-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-100 text-sm">{item.name}</h4>
                        <p className="text-cyan-400 text-sm">${item.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="w-6 h-6 bg-slate-700 rounded text-slate-300 hover:bg-slate-600 flex items-center justify-center"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-slate-100 w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => addToCart(item)}
                          className="w-6 h-6 bg-slate-700 rounded text-slate-300 hover:bg-slate-600 flex items-center justify-center"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="border-t border-slate-700 pt-4">
                    <div className="flex justify-between text-lg font-semibold text-slate-100 mb-4">
                      <span>Total:</span>
                      <span>${getTotalPrice().toFixed(2)}</span>
                    </div>
                    <button className="w-full bg-cyan-500 text-white py-3 rounded-lg hover:bg-cyan-600 transition-colors">
                      Checkout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
