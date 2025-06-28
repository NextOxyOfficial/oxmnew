"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface ProductFormData {
  name: string;
  buyPrice: number;
  sellPrice: number;
  category: string;
  location: string;
  details: string;
  photo: File | null;
}

export default function AddProductPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    buyPrice: 0,
    sellPrice: 0,
    category: "",
    location: "",
    details: "",
    photo: null,
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculate profit
  const profit = formData.sellPrice - formData.buyPrice;
  const profitMargin = formData.sellPrice > 0 ? ((profit / formData.sellPrice) * 100).toFixed(1) : "0";

  const categories = [
    "Electronics",
    "Furniture",
    "Accessories",
    "Clothing",
    "Books",
    "Sports & Outdoors",
    "Home & Garden",
    "Automotive",
    "Health & Beauty",
    "Toys & Games",
    "Other"
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }

    if (name === "buyPrice" || name === "sellPrice") {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, photo: "Please select a valid image file" }));
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, photo: "Image size should be less than 5MB" }));
        return;
      }

      setFormData(prev => ({ ...prev, photo: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Clear photo error
      if (errors.photo) {
        setErrors(prev => ({ ...prev, photo: "" }));
      }
    }
  };

  const removePhoto = () => {
    setFormData(prev => ({ ...prev, photo: null }));
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Product name is required";
    }

    if (formData.buyPrice <= 0) {
      newErrors.buyPrice = "Buy price must be greater than 0";
    }

    if (formData.sellPrice <= 0) {
      newErrors.sellPrice = "Sell price must be greater than 0";
    }

    if (formData.sellPrice < formData.buyPrice) {
      newErrors.sellPrice = "Sell price should be higher than buy price";
    }

    if (!formData.category) {
      newErrors.category = "Please select a category";
    }

    if (!formData.location.trim()) {
      newErrors.location = "Location is required";
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
      // TODO: Implement actual API call
      console.log("Submitting product:", formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Success - redirect back to products page
      router.push("/dashboard/products");
    } catch (error) {
      console.error("Error adding product:", error);
      // Handle error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="max-w-4xl">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Add New Product
              </h1>
              <p className="text-gray-400 text-sm sm:text-base mt-2">
                Fill in the details below to add a new product to your inventory
              </p>
            </div>
          </div>
        </div>

        {/* Form Container - matching settings page style */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl shadow-lg">
          <div className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Product Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1.5">
                  Product Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full bg-slate-800/50 border ${errors.name ? 'border-red-500' : 'border-slate-700/50'} text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200`}
                  placeholder="Enter product name"
                />
                {errors.name && (
                  <p className="text-red-400 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Product Photo
                </label>
                <div className="space-y-2">
                  {/* Upload Area */}
                  <div 
                    className={`border-2 border-dashed ${errors.photo ? 'border-red-500' : 'border-slate-700/50'} rounded-lg p-3 text-center hover:border-slate-600 transition-all duration-200 cursor-pointer bg-slate-800/50`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {photoPreview ? (
                      <div className="relative inline-block">
                        <img
                          src={photoPreview}
                          alt="Product preview"
                          className="max-h-24 rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removePhoto();
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="py-4">
                        <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <p className="text-gray-400 text-sm mb-1">Click to upload product photo</p>
                        <p className="text-gray-500 text-xs">PNG, JPG, GIF up to 5MB</p>
                      </div>
                    )}
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  
                  {errors.photo && (
                    <p className="text-red-400 text-sm">{errors.photo}</p>
                  )}
                </div>
              </div>

              {/* Category and Location Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Category */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-slate-300 mb-1.5">
                    Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className={`w-full bg-slate-800/50 border ${errors.category ? 'border-red-500' : 'border-slate-700/50'} text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200`}
                  >
                    <option value="" className="bg-slate-800">Select a category</option>
                    {categories.map((category) => (
                      <option key={category} value={category} className="bg-slate-800">
                        {category}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="text-red-400 text-sm mt-1">{errors.category}</p>
                  )}
                </div>

                {/* Location */}
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-slate-300 mb-1.5">
                    Location *
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className={`w-full bg-slate-800/50 border ${errors.location ? 'border-red-500' : 'border-slate-700/50'} text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200`}
                    placeholder="Enter storage location"
                  />
                  {errors.location && (
                    <p className="text-red-400 text-sm mt-1">{errors.location}</p>
                  )}
                </div>
              </div>

              {/* Pricing Section */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-100">Pricing Information</h3>
                
                {/* Buy Price and Sell Price Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Buy Price */}
                  <div>
                    <label htmlFor="buyPrice" className="block text-sm font-medium text-slate-300 mb-1.5">
                      Buy Price *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                      <input
                        type="number"
                        id="buyPrice"
                        name="buyPrice"
                        value={formData.buyPrice || ""}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        className={`w-full bg-slate-800/50 border ${errors.buyPrice ? 'border-red-500' : 'border-slate-700/50'} text-white placeholder:text-gray-400 rounded-lg py-2 pl-8 pr-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200`}
                        placeholder="0.00"
                      />
                    </div>
                    {errors.buyPrice && (
                      <p className="text-red-400 text-sm mt-1">{errors.buyPrice}</p>
                    )}
                  </div>

                  {/* Sell Price */}
                  <div>
                    <label htmlFor="sellPrice" className="block text-sm font-medium text-slate-300 mb-1.5">
                      Sell Price *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                      <input
                        type="number"
                        id="sellPrice"
                        name="sellPrice"
                        value={formData.sellPrice || ""}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        className={`w-full bg-slate-800/50 border ${errors.sellPrice ? 'border-red-500' : 'border-slate-700/50'} text-white placeholder:text-gray-400 rounded-lg py-2 pl-8 pr-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200`}
                        placeholder="0.00"
                      />
                    </div>
                    {errors.sellPrice && (
                      <p className="text-red-400 text-sm mt-1">{errors.sellPrice}</p>
                    )}
                  </div>
                </div>

                {/* Profit Display */}
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Profit per Unit</p>
                      <p className={`text-base font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${profit.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Profit Margin</p>
                      <p className={`text-base font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {profitMargin}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Status</p>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        profit > 0 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                          : profit === 0 
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {profit > 0 ? 'Profitable' : profit === 0 ? 'Break Even' : 'Loss'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div>
                <label htmlFor="details" className="block text-sm font-medium text-slate-300 mb-1.5">
                  Product Details
                </label>
                <textarea
                  id="details"
                  name="details"
                  value={formData.details}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 resize-vertical"
                  placeholder="Enter detailed description, specifications, or any additional information about the product..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3 border-t border-slate-700/50">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 border border-slate-600 text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all duration-200"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200 shadow-lg flex items-center justify-center gap-2 ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Adding Product...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Product
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
