"use client";

import { useState, useEffect } from "react";
import { Product } from "@/types/product";
import { ApiService } from "@/lib/api";
import { 
  Store, 
  Package, 
  ShoppingCart, 
  FileText, 
  Shield, 
  Plus,
  Globe,
  Eye,
  EyeOff,
  Search,
  Filter,
  RefreshCw
} from "lucide-react";

interface OnlineProduct {
  id: number;
  product_id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  product?: Product;
}

interface Order {
  id: number;
  customer_name: string;
  email: string;
  phone: string;
  total_amount: number;
  status: string;
  created_at: string;
  items: OrderItem[];
}

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
}

export default function OnlineStorePage() {
  const [activeTab, setActiveTab] = useState<"products" | "orders" | "terms" | "privacy">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [onlineProducts, setOnlineProducts] = useState<OnlineProduct[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [terms, setTerms] = useState("");
  const [privacy, setPrivacy] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [customDomain, setCustomDomain] = useState<{
    domain: string;
    subdomain?: string;
    full_domain: string;
    is_active: boolean;
  } | null>(null);

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [productsData, onlineProductsData, ordersData, termsData, privacyData, domainData] = await Promise.all([
        ApiService.get("/products/"),
        ApiService.get("/online-store/products/").catch(() => ({ results: [] })),
        ApiService.get("/online-store/orders/").catch(() => ({ results: [] })),
        ApiService.get("/online-store/terms/").catch(() => ({ content: "" })),
        ApiService.get("/online-store/privacy/").catch(() => ({ content: "" })),
        ApiService.get("/custom-domain/").catch(() => ({ custom_domain: null }))
      ]);
      
      setProducts(productsData.results || []);
      setOnlineProducts(onlineProductsData.results || []);
      setOrders(ordersData.results || []);
      setTerms(termsData.content || "");
      setPrivacy(privacyData.content || "");
      
      // Set custom domain info
      if (domainData.custom_domain) {
        setCustomDomain({
          domain: domainData.custom_domain.domain,
          subdomain: domainData.custom_domain.subdomain,
          full_domain: domainData.custom_domain.full_domain,
          is_active: domainData.custom_domain.is_active
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublishProducts = async (product: Product) => {
    try {
      await ApiService.post("/online-store/products/", {
        product_id: product.id,
        name: product.name,
        description: product.details || "",
        price: product.sell_price || product.price || 0,
        category: product.category_name || "General",
        is_published: true
      });
      
      await fetchData(); // Refresh the data
      // Don't close modal to allow publishing more products
    } catch (error) {
      console.error("Error publishing product:", error);
    }
  };

  const toggleProductStatus = async (productId: number, currentStatus: boolean) => {
    try {
      if (currentStatus) {
        // If currently published, unpublish (delete from online store)
        await ApiService.delete(`/online-store/products/${productId}/`);
      } else {
        // If currently unpublished, publish it
        await ApiService.patch(`/online-store/products/${productId}/`, {
          is_published: true
        });
      }
      await fetchData();
    } catch (error) {
      console.error("Error updating product status:", error);
    }
  };

  const saveTermsAndConditions = async () => {
    setIsSaving(true);
    try {
      await ApiService.post("/online-store/terms/", { content: terms });
    } catch (error) {
      console.error("Error saving terms:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const savePrivacyPolicy = async () => {
    setIsSaving(true);
    try {
      await ApiService.post("/online-store/privacy/", { content: privacy });
    } catch (error) {
      console.error("Error saving privacy policy:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Filter products based on search only (all products shown are published)
  const filteredOnlineProducts = onlineProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const tabs = [
    { key: "products", label: "Products", icon: Package },
    { key: "orders", label: "Orders", icon: ShoppingCart },
    { key: "terms", label: "Terms & Conditions", icon: FileText },
    { key: "privacy", label: "Privacy Policy", icon: Shield }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-5 w-5 animate-spin text-cyan-500" />
          <span className="text-slate-400">Loading online store...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 p-3">
              <Store className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-100">Online Store</h1>
              <p className="text-sm text-slate-400 mt-1">Manage your e-commerce presence</p>
              {customDomain && customDomain.is_active && (
                <div className="flex items-center space-x-2 mt-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-green-400 font-medium">
                    Live at: {customDomain.full_domain}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {customDomain && customDomain.is_active ? (
              <button 
                onClick={() => window.open(`https://${customDomain.full_domain}`, '_blank')}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-medium rounded-lg hover:from-green-600 hover:to-green-700 transition-colors"
              >
                <Globe className="h-5 w-5" />
                <span>Visit Store</span>
              </button>
            ) : (
              <button 
                onClick={() => window.open('/dashboard/settings', '_self')}
                className="flex items-center space-x-2 px-6 py-3 bg-slate-800 text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors"
              >
                <Globe className="h-5 w-5" />
                <span>Setup Domain</span>
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl shadow-lg">
          <div className="border-b border-slate-700/50">
            <nav className="flex space-x-8 px-6 pt-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-all duration-200 cursor-pointer ${
                      activeTab === tab.key
                        ? "border-cyan-400 text-cyan-400"
                        : "border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "products" && (
              <ProductsTab
                products={filteredOnlineProducts}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                availableProducts={products.filter(p => !onlineProducts.map(op => op.product_id).includes(p.id))}
                selectedProductId={selectedProductId}
                setSelectedProductId={setSelectedProductId}
                onPublish={handlePublishProducts}
                onToggleStatus={toggleProductStatus}
                onRefresh={fetchData}
                customDomain={customDomain}
              />
            )}

            {activeTab === "orders" && (
              <OrdersTab orders={orders} />
            )}

            {activeTab === "terms" && (
              <TermsTab
                content={terms}
                setContent={setTerms}
                onSave={saveTermsAndConditions}
                isSaving={isSaving}
              />
            )}

            {activeTab === "privacy" && (
              <PrivacyTab
                content={privacy}
                setContent={setPrivacy}
                onSave={savePrivacyPolicy}
                isSaving={isSaving}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Products Tab Component
function ProductsTab({ 
  products, 
  searchTerm, 
  setSearchTerm, 
  availableProducts,
  selectedProductId,
  setSelectedProductId,
  onPublish,
  onToggleStatus,
  onRefresh,
  customDomain 
}: {
  products: OnlineProduct[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  availableProducts: Product[];
  selectedProductId: number | null;
  setSelectedProductId: (id: number | null) => void;
  onPublish: (product: Product) => void;
  onToggleStatus: (id: number, currentStatus: boolean) => void;
  onRefresh: () => void;
  customDomain: {
    domain: string;
    subdomain?: string;
    full_domain: string;
    is_active: boolean;
  } | null;
}) {
  const selectedProduct = availableProducts.find(p => p.id === selectedProductId);
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    if (!selectedProduct) return;
    
    setIsPublishing(true);
    try {
      await onPublish(selectedProduct);
      setSelectedProductId(null); // Reset selection after publishing
    } finally {
      setIsPublishing(false);
    }
  };
  return (
    <div className="space-y-6">
      {/* Add Products Section */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700">
        <h3 className="text-lg font-medium text-slate-100 mb-4">Add Products to Online Store</h3>
        
        {/* Domain Status Info */}
        {customDomain ? (
          <div className="mb-4 p-3 rounded-lg border border-slate-600 bg-slate-900/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-200">
                  Store URL: <span className="text-cyan-400">{customDomain.full_domain}</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Status: {customDomain.is_active ? (
                    <span className="text-green-400">Active & Live</span>
                  ) : (
                    <span className="text-yellow-400">Domain Configured (Verification Pending)</span>
                  )}
                </p>
              </div>
              <button
                onClick={() => window.open('/dashboard/settings', '_self')}
                className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Manage Domain
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-4 p-3 rounded-lg border border-slate-600 bg-slate-900/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-200">No custom domain configured</p>
                <p className="text-xs text-slate-400 mt-1">
                  Products will be accessible via your default store URL
                </p>
              </div>
              <button
                onClick={() => window.open('/dashboard/settings', '_self')}
                className="px-3 py-1 bg-cyan-500/20 text-cyan-400 text-sm rounded hover:bg-cyan-500/30 transition-colors"
              >
                Setup Domain
              </button>
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <select
              value={selectedProductId || ""}
              onChange={(e) => setSelectedProductId(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">Select a product to publish...</option>
              {availableProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} - ${product.sell_price || product.price || 0}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handlePublish}
            disabled={isPublishing || !selectedProduct}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPublishing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>Publish</span>
              </>
            )}
          </button>
        </div>
        
        {/* Selected Product Details */}
        {selectedProduct && (
          <div className="mt-4 p-4 rounded-lg border border-slate-600 bg-slate-900/50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-slate-100 text-sm mb-1">{selectedProduct.name}</h4>
                <p className="text-sm text-slate-400 mb-2">{selectedProduct.category_name || "Uncategorized"}</p>
                {selectedProduct.details && (
                  <p className="text-xs text-slate-500 mb-2">{selectedProduct.details}</p>
                )}
                <div className="flex items-center gap-4">
                  <p className="text-sm font-semibold text-cyan-400">
                    ${selectedProduct.sell_price || selectedProduct.price || 0}
                  </p>
                  <p className="text-xs text-slate-400">
                    Stock: {selectedProduct.stock || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-slate-800/50 rounded-lg p-6 max-w-md mx-auto">
            <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-300 mb-2">No products published</h3>
            <p className="text-sm text-slate-400 mb-4">Use the dropdown above to publish products to your online store</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-slate-100 mb-1 group-hover:text-cyan-400 transition-colors">{product.name}</h3>
                  <p className="text-sm text-slate-400 mb-2">{product.category}</p>
                  <p className="text-lg font-semibold text-cyan-400">${product.price}</p>
                </div>
                <button
                  onClick={() => onToggleStatus(product.id, product.is_published)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all text-sm font-medium ${
                    product.is_published
                      ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
                      : "bg-slate-700 text-slate-400 hover:bg-slate-600 border border-slate-600"
                  }`}
                >
                  {product.is_published ? (
                    <>
                      <EyeOff className="h-4 w-4" />
                      <span>Unpublish</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" />
                      <span>Publish</span>
                    </>
                  )}
                </button>
              </div>
              <div className="text-sm text-slate-400 space-y-2">
                <p className="line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                    Published
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(product.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Orders Tab Component
function OrdersTab({ orders }: { orders: Order[] }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-slate-100">Online Orders</h2>
        <span className="text-sm text-slate-400 bg-slate-800 px-3 py-1 rounded-lg">
          {orders.length} orders
        </span>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-slate-800/50 rounded-lg p-6 max-w-md mx-auto">
            <ShoppingCart className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-300 mb-2">No orders yet</h3>
            <p className="text-sm text-slate-400">Orders from your online store will appear here</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition-all">
              <div className="flex flex-col md:flex-row md:items-start justify-between mb-4 gap-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-medium text-slate-100">{order.customer_name}</h3>
                  <p className="text-sm text-slate-400">{order.email}</p>
                  <p className="text-sm text-slate-400">{order.phone}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-cyan-400 mb-1">${order.total_amount}</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    order.status === "completed"
                      ? "bg-green-500/20 text-green-400"
                      : order.status === "pending"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-red-500/20 text-red-400"
                  }`}>
                    {order.status.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="border-t border-slate-700 pt-4">
                <h4 className="text-sm font-medium text-slate-300 mb-3">Order Items</h4>
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm p-2 bg-slate-900/50 rounded">
                      <span className="text-slate-300 font-medium">{item.product_name}</span>
                      <div className="flex items-center space-x-3">
                        <span className="text-slate-400">Qty: {item.quantity}</span>
                        <span className="text-slate-200 font-medium">${item.total}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-700">
                <span className="text-xs text-slate-500">
                  Order placed on {new Date(order.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Terms Tab Component
function TermsTab({ 
  content, 
  setContent, 
  onSave, 
  isSaving 
}: { 
  content: string; 
  setContent: (content: string) => void; 
  onSave: () => void; 
  isSaving: boolean; 
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-slate-100">Terms & Conditions</h2>
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all disabled:opacity-50"
        >
          {isSaving ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          <span className="text-sm">{isSaving ? "Saving..." : "Save Changes"}</span>
        </button>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Enter your terms and conditions here..."
          className="w-full h-96 bg-slate-900/50 border border-slate-600 rounded-lg p-4 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none text-sm leading-relaxed"
        />
      </div>
    </div>
  );
}

// Privacy Tab Component
function PrivacyTab({ 
  content, 
  setContent, 
  onSave, 
  isSaving 
}: { 
  content: string; 
  setContent: (content: string) => void; 
  onSave: () => void; 
  isSaving: boolean; 
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-slate-100">Privacy Policy</h2>
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all disabled:opacity-50"
        >
          {isSaving ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Shield className="h-4 w-4" />
          )}
          <span className="text-sm">{isSaving ? "Saving..." : "Save Changes"}</span>
        </button>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Enter your privacy policy here..."
          className="w-full h-96 bg-slate-900/50 border border-slate-600 rounded-lg p-4 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none text-sm leading-relaxed"
        />
      </div>
    </div>
  );
}
