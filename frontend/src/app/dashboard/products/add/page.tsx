"use client";

import { useCurrencyFormatter } from "@/contexts/CurrencyContext";
import { ApiService } from "@/lib/api";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";

// Add interface for suggestion products
interface SuggestionProduct {
  id: number;
  name: string;
  product_code?: string;
  stock?: number;
  total_stock?: number;
  sell_price?: number;
  average_sell_price?: number;
}

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

interface ColorSize {
  id: string;
  color: string;
  size: string;
  weight?: number;
  weight_unit?: "g" | "kg" | "lb" | "oz";
  custom_variant?: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
}

interface ProductFormData {
  name: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  category: number | "";
  supplier: number | "";
  productCode: string;
  location: string;
  details: string;
  photos: File[];
  hasVariants: boolean;
  noStockRequired: boolean;
  colorSizeVariants: ColorSize[];
}

export default function AddProductPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formatCurrency = useCurrencyFormatter();

  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    buyPrice: 0,
    sellPrice: 0,
    stock: 0,
    category: "",
    supplier: "",
    productCode: "",
    location: "",
    details: "",
    photos: [],
    hasVariants: false,
    noStockRequired: false,
    colorSizeVariants: [],
  });

  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [newVariant, setNewVariant] = useState({
    color: "",
    size: "",
    weight: 0,
    weight_unit: "g" as "g" | "kg" | "lb" | "oz",
    custom_variant: "",
    buyPrice: 0,
    sellPrice: 0,
    stock: 0,
  });
  const [customColor, setCustomColor] = useState("");
  const [customSize, setCustomSize] = useState("");
  const [customWeight, setCustomWeight] = useState("");

  // Product search suggestions state
  const [nameSuggestions, setNameSuggestions] = useState<SuggestionProduct[]>(
    []
  );
  const [codeSuggestions, setCodeSuggestions] = useState<SuggestionProduct[]>(
    []
  );
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const [showCodeSuggestions, setShowCodeSuggestions] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  // CSV Upload state
  const [activeTab, setActiveTab] = useState<"manual" | "file">("manual");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadResults, setUploadResults] = useState<{
    success: boolean;
    products_created: number;
    successful_rows?: Array<{ row: number; name: string }>;
    errors: string[];
    message: string;
  } | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // Calculate profit (for single pricing or average if variants exist)
  const profit = formData.hasVariants
    ? formData.colorSizeVariants.length > 0
      ? formData.colorSizeVariants.reduce(
          (sum, variant) => sum + (variant.sellPrice - variant.buyPrice),
          0
        ) / formData.colorSizeVariants.length
      : 0
    : formData.sellPrice - formData.buyPrice;

  const profitMargin = formData.hasVariants
    ? formData.colorSizeVariants.length > 0
      ? (
          (profit /
            (formData.colorSizeVariants.reduce(
              (sum, variant) => sum + variant.sellPrice,
              0
            ) /
              formData.colorSizeVariants.length)) *
          100
        ).toFixed(1)
      : "0"
    : formData.sellPrice > 0
    ? ((profit / formData.sellPrice) * 100).toFixed(1)
    : "0";

  const commonColors = [
    "Red",
    "Blue",
    "Green",
    "Yellow",
    "Black",
    "White",
    "Gray",
    "Pink",
    "Purple",
    "Orange",
  ];
  const commonSizes = ["XS", "S", "M", "L", "XL", "XXL", "One Size"];

  // Search for products based on name or product code
  const searchProducts = async (query: string, searchType: "name" | "code") => {
    if (!query || query.trim().length < 2) {
      if (searchType === "name") {
        setNameSuggestions([]);
        setShowNameSuggestions(false);
      } else {
        setCodeSuggestions([]);
        setShowCodeSuggestions(false);
      }
      return;
    }

    try {
      const results = await ApiService.searchProducts(query);

      if (searchType === "name") {
        // Filter results that match the name
        const nameMatches = results.filter((product: SuggestionProduct) =>
          product.name.toLowerCase().includes(query.toLowerCase())
        );
        setNameSuggestions(nameMatches.slice(0, 5)); // Limit to 5 suggestions
        setShowNameSuggestions(nameMatches.length > 0);
      } else {
        // Filter results that match the product code
        const codeMatches = results.filter(
          (product: SuggestionProduct) =>
            product.product_code &&
            product.product_code.toLowerCase().includes(query.toLowerCase())
        );
        setCodeSuggestions(codeMatches.slice(0, 5)); // Limit to 5 suggestions
        setShowCodeSuggestions(codeMatches.length > 0);
      }
    } catch (error) {
      console.error("Error searching products:", error);
    }
  };

  // Fetch categories and suppliers on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingData(true);
        console.log("Fetching categories and suppliers...");
        const [categoriesResponse, suppliersResponse] = await Promise.all([
          ApiService.getCategories(),
          ApiService.getSuppliers(),
        ]);

        console.log("Categories response:", categoriesResponse);
        console.log("Suppliers response:", suppliersResponse);

        // Handle categories response format {categories: [...]}
        const processedCategories =
          categoriesResponse?.categories || categoriesResponse || [];
        const processedSuppliers = Array.isArray(suppliersResponse) 
          ? suppliersResponse 
          : suppliersResponse?.suppliers || suppliersResponse?.results || [];

        console.log("Processed categories:", processedCategories);
        console.log("Processed suppliers:", processedSuppliers);

        setCategories(processedCategories);
        setSuppliers(processedSuppliers);
      } catch (error) {
        console.error("Error fetching categories and suppliers:", error);
        setErrors((prev) => ({
          ...prev,
          data: "Failed to load categories and suppliers. Please refresh the page.",
        }));
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, []);

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

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
        ...(name === "noStockRequired" && checked ? { stock: 0 } : {}),
      }));
    } else if (name === "buyPrice" || name === "sellPrice" || name === "stock") {
      setFormData((prev) => ({
        ...prev,
        [name]: parseFloat(value) || 0,
      }));
    } else if (name === "category" || name === "supplier") {
      setFormData((prev) => ({
        ...prev,
        [name]: value ? parseInt(value) : "",
      }));
    } else if (name === "hasVariants") {
      const hasVariants = value === "true";
      setFormData((prev) => ({
        ...prev,
        hasVariants,
        // Reset pricing if switching to variants
        buyPrice: hasVariants ? 0 : prev.buyPrice,
        sellPrice: hasVariants ? 0 : prev.sellPrice,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));

      // Trigger search for product name or product code
      if (name === "name" || name === "productCode") {
        // Clear existing timeout
        if (searchTimeout) {
          clearTimeout(searchTimeout);
        }

        // Set new timeout for delayed search
        const newTimeout = setTimeout(() => {
          if (name === "name") {
            searchProducts(value, "name");
          } else if (name === "productCode") {
            searchProducts(value, "code");
          }
        }, 300); // 300ms delay

        setSearchTimeout(newTimeout);
      }
    }
  };

  // Handle selecting a suggestion
  const handleSuggestionSelect = (
    product: SuggestionProduct,
    type: "name" | "code"
  ) => {
    if (type === "name") {
      setFormData((prev) => ({ ...prev, name: product.name }));
      setShowNameSuggestions(false);
    } else {
      setFormData((prev) => ({
        ...prev,
        productCode: product.product_code || "",
      }));
      setShowCodeSuggestions(false);
    }
  };

  // Handle clicking outside to close suggestions
  const handleInputBlur = (type: "name" | "code") => {
    // Use setTimeout to allow click on suggestion to work
    setTimeout(() => {
      if (type === "name") {
        setShowNameSuggestions(false);
      } else {
        setShowCodeSuggestions(false);
      }
    }, 200);
  };

  const handleVariantChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (
      name === "buyPrice" ||
      name === "sellPrice" ||
      name === "stock" ||
      name === "weight"
    ) {
      setNewVariant((prev) => ({
        ...prev,
        [name]: parseFloat(value) || 0,
      }));
    } else {
      setNewVariant((prev) => ({
        ...prev,
        [name]: value,
      }));

      // Clear custom inputs when user selects a different option
      if (name === "color" && value !== "Custom") {
        setCustomColor("");
      }
      if (name === "size" && value !== "Custom") {
        setCustomSize("");
      }
    }
  };

  const addVariant = () => {
    // Determine the actual color and size values
    const actualColor =
      newVariant.color === "Custom" ? customColor : newVariant.color;
    const actualSize =
      newVariant.size === "Custom" ? customSize : newVariant.size;
    const actualWeight = customWeight
      ? parseFloat(customWeight)
      : newVariant.weight > 0
      ? newVariant.weight
      : undefined;
    const actualCustomVariant = newVariant.custom_variant || "";

    // Validation: require at least one identifying field (color, size, weight, or custom_variant)
    // and valid pricing and stock
    const hasIdentifyingField =
      actualColor || actualSize || actualWeight || actualCustomVariant;

    if (
      !hasIdentifyingField ||
      newVariant.buyPrice <= 0 ||
      newVariant.sellPrice <= 0 ||
      newVariant.stock <= 0
    ) {
      return;
    }

    const variant: ColorSize = {
      id: Date.now().toString(),
      color: actualColor,
      size: actualSize,
      weight: actualWeight,
      weight_unit: actualWeight ? newVariant.weight_unit : undefined,
      custom_variant: actualCustomVariant || undefined,
      buyPrice: newVariant.buyPrice,
      sellPrice: newVariant.sellPrice,
      stock: newVariant.stock,
    };

    setFormData((prev) => ({
      ...prev,
      colorSizeVariants: [...prev.colorSizeVariants, variant],
    }));

    // Reset form and custom inputs
    setNewVariant({
      color: "",
      size: "",
      weight: 0,
      weight_unit: "g",
      custom_variant: "",
      buyPrice: 0,
      sellPrice: 0,
      stock: 0,
    });
    setCustomColor("");
    setCustomSize("");
    setCustomWeight("");
  };

  const removeVariant = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      colorSizeVariants: prev.colorSizeVariants.filter(
        (variant) => variant.id !== id
      ),
    }));
  };

  // Image compression utility function
  const compressImage = (
    file: File,
    maxWidth: number = 800,
    quality: number = 0.8
  ): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new window.Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxWidth) {
            width = (width * maxWidth) / height;
            height = maxWidth;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          file.type,
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    setIsCompressing(true);

    // Check total number of photos limit
    const remainingSlots = 8 - formData.photos.length;
    if (files.length > remainingSlots) {
      setErrors((prev) => ({
        ...prev,
        photo: `Can only add ${remainingSlots} more photo(s). Maximum 8 photos allowed.`,
      }));
      setIsCompressing(false);
      return;
    }

    try {
      const validFiles: File[] = [];
      const newPreviews: string[] = [];

      // Process all files sequentially
      for (const file of files) {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          setErrors((prev) => ({
            ...prev,
            photo: "Please select valid image files only",
          }));
          continue;
        }

        // Validate file size (10MB max before compression)
        if (file.size > 10 * 1024 * 1024) {
          setErrors((prev) => ({
            ...prev,
            photo: "Image size should be less than 10MB",
          }));
          continue;
        }

        try {
          // Compress the image
          const compressedFile = await compressImage(file, 800, 0.8);
          validFiles.push(compressedFile);

          // Create preview using Promise for FileReader
          const preview = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(compressedFile);
          });

          newPreviews.push(preview);
        } catch (error) {
          console.error("Error processing image:", error);
          setErrors((prev) => ({
            ...prev,
            photo: "Error processing image. Please try again.",
          }));
          continue;
        }
      }

      // Update state only once with all processed files
      if (validFiles.length > 0) {
        setFormData((prev) => ({
          ...prev,
          photos: [...prev.photos, ...validFiles],
        }));
        setPhotoPreviews((prev) => [...prev, ...newPreviews]);

        // Clear photo error if files were processed successfully
        if (errors.photo) {
          setErrors((prev) => ({ ...prev, photo: "" }));
        }
      }
    } catch (error) {
      console.error("Error uploading photos:", error);
      setErrors((prev) => ({
        ...prev,
        photo: "Error processing images. Please try again.",
      }));
    } finally {
      setIsCompressing(false);

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Product name is required";
    }

    // Validate pricing based on variant mode
    if (!formData.hasVariants) {
      // Only validate prices if stock is required, or if prices are provided
      if (!formData.noStockRequired) {
        if (formData.buyPrice <= 0) {
          newErrors.buyPrice = "Buy price must be greater than 0";
        }

        if (formData.sellPrice <= 0) {
          newErrors.sellPrice = "Sell price must be greater than 0";
        }

        if (formData.sellPrice < formData.buyPrice) {
          newErrors.sellPrice = "Sell price should be higher than buy price";
        }

        // Only validate stock if stock tracking is required
        if (formData.stock <= 0) {
          newErrors.stock = "Stock quantity must be greater than 0";
        }
      } else {
        // For no-stock products, only validate if prices are provided and non-zero
        if (formData.buyPrice > 0 && formData.sellPrice > 0 && formData.sellPrice < formData.buyPrice) {
          newErrors.sellPrice = "Sell price should be higher than buy price";
        }
      }
    } else {
      if (formData.colorSizeVariants.length === 0) {
        newErrors.variants = "Please add at least one color/size variant";
      } else {
        // Validate each variant
        const invalidVariant = formData.colorSizeVariants.find(
          (variant) =>
            variant.buyPrice <= 0 ||
            variant.sellPrice <= 0 ||
            variant.sellPrice < variant.buyPrice ||
            variant.stock <= 0
        );
        if (invalidVariant) {
          newErrors.variants =
            "All variants must have valid prices and stock quantity greater than 0";
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
      // Prepare data for API
      const productData = {
        name: formData.name,
        category:
          typeof formData.category === "number" ? formData.category : undefined,
        supplier:
          typeof formData.supplier === "number" ? formData.supplier : undefined,
        product_code: formData.productCode || undefined,
        location: formData.location.trim() || undefined,
        details: formData.details,
        has_variants: formData.hasVariants,
        no_stock_required: formData.noStockRequired,
        buy_price: formData.hasVariants ? 0 : formData.buyPrice,
        sell_price: formData.hasVariants ? 0 : formData.sellPrice,
        stock: formData.hasVariants ? 0 : (formData.noStockRequired ? 0 : formData.stock),
        variants: formData.hasVariants
          ? formData.colorSizeVariants.map((variant) => ({
              color: variant.color,
              size: variant.size,
              weight: variant.weight,
              weight_unit: variant.weight_unit,
              custom_variant: variant.custom_variant,
              buy_price: variant.buyPrice,
              sell_price: variant.sellPrice,
              stock: variant.stock,
            }))
          : undefined,
        photos: formData.photos.length > 0 ? formData.photos : undefined,
      };

      console.log("=== FORM SUBMISSION DEBUG ===");
      console.log("Form data:", formData);
      console.log("Prepared product data:", productData);
      console.log("Form data types:", {
        name: typeof formData.name,
        category: typeof formData.category,
        supplier: typeof formData.supplier,
        buyPrice: typeof formData.buyPrice,
        sellPrice: typeof formData.sellPrice,
        hasVariants: typeof formData.hasVariants,
      });

      // Call API to create product
      const result = await ApiService.createProduct(productData);
      console.log("Product created successfully:", result);

      // Success - redirect back to products page
      router.push("/dashboard/products");
    } catch (error) {
      console.error("Error adding product:", error);
      console.error(
        "Error details:",
        error instanceof Error ? error.message : error
      );
      // You can add toast notification here
      setErrors({
        submit: `Failed to create product: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // File Upload handlers (CSV, XLSX, XLS)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = [
        "text/csv",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
        "application/vnd.ms-excel", // .xls
      ];
      const validExtensions = [".csv", ".xlsx", ".xls"];

      const hasValidType = validTypes.includes(file.type);
      const hasValidExtension = validExtensions.some((ext) =>
        file.name.toLowerCase().endsWith(ext)
      );

      if (hasValidType || hasValidExtension) {
        setUploadFile(file);
        setUploadResults(null);
      } else {
        alert("Please select a valid file (CSV, XLSX, or XLS)");
        e.target.value = "";
      }
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFile) {
      alert("Please select a file first");
      return;
    }

    setIsUploadingFile(true);
    setUploadResults(null);

    try {
      let result;
      const fileName = uploadFile.name.toLowerCase();

      if (fileName.endsWith(".csv")) {
        // Handle CSV upload
        result = await ApiService.uploadProductsCSV(uploadFile);
      } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
        // Handle Excel upload by converting to CSV first
        const csvData = await convertExcelToCSV(uploadFile);
        const csvBlob = new Blob([csvData], { type: "text/csv" });
        const csvFile = new File([csvBlob], "converted.csv", {
          type: "text/csv",
        });
        result = await ApiService.uploadProductsCSV(csvFile);
      } else {
        throw new Error("Unsupported file format");
      }

      setUploadResults(result);

      // Note: No automatic redirect after file upload
      // Users can manually navigate to products page if desired
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadResults({
        success: false,
        products_created: 0,
        successful_rows: [],
        errors: [error instanceof Error ? error.message : "Unknown error"],
        message: "Failed to upload file",
      });
    } finally {
      setIsUploadingFile(false);
    }
  };

  // Convert Excel file to CSV format
  const convertExcelToCSV = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });

          // Get the first worksheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          // Convert to CSV
          const csv = XLSX.utils.sheet_to_csv(worksheet);
          resolve(csv);
        } catch (error) {
          reject(
            new Error("Failed to parse Excel file: " + (error as Error).message)
          );
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await ApiService.downloadProductsCSVTemplate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "products_template.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading template:", error);
      alert("Failed to download CSV template");
    }
  };

  const handleDownloadExcelTemplate = async () => {
    try {
      const blob = await ApiService.downloadProductsExcelTemplate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "products_template.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading Excel template:", error);
      alert("Failed to download Excel template");
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="sm:p-6 p-1 space-y-6">
      {/* Custom styles for scrollbar */}
      <style jsx>{`
        .scrollbar-thin {
          scrollbar-width: thin;
        }
        .scrollbar-thumb-slate-600::-webkit-scrollbar-thumb {
          background-color: #475569;
          border-radius: 6px;
        }
        .scrollbar-track-slate-800::-webkit-scrollbar-track {
          background-color: #1e293b;
        }
        .scrollbar-thin::-webkit-scrollbar {
          height: 6px;
        }
      `}</style>

      <div className="max-w-6xl">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <svg
                className="w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
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
          {/* Tabs */}
          <div className="border-b border-slate-700/50">
            <nav className="flex space-x-8 px-4 pt-4">
              <button
                type="button"
                onClick={() => setActiveTab("manual")}
                className={`py-2 px-1 border-b-2 font-medium text-sm cursor-pointer ${
                  activeTab === "manual"
                    ? "border-cyan-500 text-cyan-400"
                    : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300"
                }`}
              >
                Manual Entry
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("file")}
                className={`py-2 px-1 border-b-2 font-medium text-sm cursor-pointer ${
                  activeTab === "file"
                    ? "border-cyan-500 text-cyan-400"
                    : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300"
                }`}
              >
                File Upload
              </button>
            </nav>
          </div>

          <div className="sm:p-4 p-2">
            {errors.data && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                <p className="text-red-400 text-sm">{errors.data}</p>
              </div>
            )}

            {/* Manual Entry Tab */}
            {activeTab === "manual" && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Product Name */}
                <div className="relative">
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-slate-300 mb-1.5"
                  >
                    Product Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    onBlur={() => handleInputBlur("name")}
                    onFocus={() =>
                      formData.name.trim().length >= 2 &&
                      setShowNameSuggestions(nameSuggestions.length > 0)
                    }
                    className={`w-full bg-slate-800/50 border ${
                      errors.name ? "border-red-500" : "border-slate-700/50"
                    } text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200`}
                    placeholder="Enter product name"
                  />

                  {/* Name Suggestions Dropdown */}
                  {showNameSuggestions && nameSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      <div className="p-2 border-b border-slate-600">
                        <p className="text-xs text-yellow-400 font-medium">
                          ⚠️ Similar products found - Check to avoid duplicates
                        </p>
                      </div>
                      {Array.isArray(nameSuggestions) && nameSuggestions.map((product) => (
                        <div
                          key={product.id}
                          onClick={() =>
                            handleSuggestionSelect(product, "name")
                          }
                          className="flex items-center justify-between p-3 hover:bg-slate-700 cursor-pointer border-b border-slate-700/50 last:border-b-0"
                        >
                          <div className="flex-1">
                            <p className="text-white font-medium">
                              {product.name}
                            </p>
                            <div className="flex gap-4 text-xs text-slate-400 mt-1">
                              {product.product_code && (
                                <span>Code: {product.product_code}</span>
                              )}
                              <span>
                                Stock:{" "}
                                {product.total_stock || product.stock || 0}
                              </span>
                              <span className="text-green-400">
                                $
                                {product.sell_price ||
                                  product.average_sell_price ||
                                  0}
                              </span>
                            </div>
                          </div>
                          <div className="ml-2 text-xs text-slate-500">
                            Click to use
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {errors.name && (
                    <p className="text-red-400 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Supplier and Product Code Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Supplier */}
                  <div>
                    <label
                      htmlFor="supplier"
                      className="block text-sm font-medium text-slate-300 mb-1.5"
                    >
                      Supplier
                    </label>
                    <select
                      id="supplier"
                      name="supplier"
                      value={formData.supplier}
                      onChange={handleInputChange}
                      disabled={isLoadingData}
                      className={`w-full bg-slate-800/50 border ${
                        errors.supplier
                          ? "border-red-500"
                          : "border-slate-700/50"
                      } text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 ${
                        isLoadingData ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      <option value="" className="bg-slate-800">
                        {isLoadingData
                          ? "Loading suppliers..."
                          : "Select a supplier (optional)"}
                      </option>
                      {Array.isArray(suppliers) && suppliers.map((supplier) => (
                        <option
                          key={supplier.id}
                          value={supplier.id}
                          className="bg-slate-800"
                        >
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                    {errors.supplier && (
                      <p className="text-red-400 text-sm mt-1">
                        {errors.supplier}
                      </p>
                    )}
                  </div>

                  {/* Product/Parts Code */}
                  <div className="relative">
                    <label
                      htmlFor="productCode"
                      className="block text-sm font-medium text-slate-300 mb-1.5"
                    >
                      Product/Parts Code
                    </label>
                    <input
                      type="text"
                      id="productCode"
                      name="productCode"
                      value={formData.productCode}
                      onChange={handleInputChange}
                      onBlur={() => handleInputBlur("code")}
                      onFocus={() =>
                        formData.productCode.trim().length >= 2 &&
                        setShowCodeSuggestions(codeSuggestions.length > 0)
                      }
                      className={`w-full bg-slate-800/50 border ${
                        errors.productCode
                          ? "border-red-500"
                          : "border-slate-700/50"
                      } text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200`}
                      placeholder="Enter product or parts code (e.g., SKU, part number)"
                    />

                    {/* Code Suggestions Dropdown */}
                    {showCodeSuggestions && codeSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <div className="p-2 border-b border-slate-600">
                          <p className="text-xs text-yellow-400 font-medium">
                            ⚠️ Similar product codes found - Check to avoid
                            duplicates
                          </p>
                        </div>
                        {Array.isArray(codeSuggestions) && codeSuggestions.map((product) => (
                          <div
                            key={product.id}
                            onClick={() =>
                              handleSuggestionSelect(product, "code")
                            }
                            className="flex items-center justify-between p-3 hover:bg-slate-700 cursor-pointer border-b border-slate-700/50 last:border-b-0"
                          >
                            <div className="flex-1">
                              <p className="text-white font-medium">
                                {product.name}
                              </p>
                              <div className="flex gap-4 text-xs text-slate-400 mt-1">
                                <span className="text-cyan-400">
                                  Code: {product.product_code}
                                </span>
                                <span>
                                  Stock:{" "}
                                  {product.total_stock || product.stock || 0}
                                </span>
                                <span className="text-green-400">
                                  $
                                  {product.sell_price ||
                                    product.average_sell_price ||
                                    0}
                                </span>
                              </div>
                            </div>
                            <div className="ml-2 text-xs text-slate-500">
                              Click to use
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {errors.productCode && (
                      <p className="text-red-400 text-sm mt-1">
                        {errors.productCode}
                      </p>
                    )}
                  </div>
                </div>

                {/* Photo Upload */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Product Photos ({formData.photos.length}/8)
                  </label>
                  <div className="flex gap-3">
                    {/* Upload Area - Left Side */}
                    <div className="flex-shrink-0 w-32">
                      <div
                        className={`border-2 border-dashed ${
                          errors.photo
                            ? "border-red-500"
                            : "border-slate-700/50"
                        } rounded-lg p-3 text-center hover:border-slate-600 transition-all duration-200 cursor-pointer bg-slate-800/50 h-32 flex flex-col items-center justify-center ${
                          formData.photos.length >= 8 || isCompressing
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        onClick={() =>
                          !isCompressing &&
                          formData.photos.length < 8 &&
                          fileInputRef.current?.click()
                        }
                      >
                        {isCompressing ? (
                          <>
                            <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-1"></div>
                            <p className="text-cyan-400 text-xs mb-1">
                              Compressing...
                            </p>
                            <p className="text-gray-500 text-xs">Please wait</p>
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-6 h-6 text-gray-400 mb-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                            <p className="text-gray-400 text-xs mb-1">
                              {formData.photos.length >= 8
                                ? "Max Reached"
                                : "Add Photos"}
                            </p>
                            <p className="text-gray-500 text-xs">
                              Max 10MB each
                            </p>
                          </>
                        )}
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />

                      {errors.photo && (
                        <p className="text-red-400 text-xs mt-1">
                          {errors.photo}
                        </p>
                      )}

                      {!errors.photo && (
                        <p className="text-slate-500 text-xs mt-1 text-center">
                          Auto-compression enabled
                        </p>
                      )}
                    </div>

                    {/* Photos Gallery - Right Side with Horizontal Scroll */}
                    {photoPreviews.length > 0 && (
                      <div className="flex-1 min-w-0">
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800 relative z-10">
                          {photoPreviews.map((preview, index) => (
                            <div
                              key={index}
                              className="relative flex-shrink-0 group"
                            >
                              <Image
                                src={preview}
                                alt={`Product preview ${index + 1}`}
                                width={128}
                                height={128}
                                className="w-32 h-32 object-cover rounded-lg border border-slate-700/50"
                              />
                              <button
                                type="button"
                                onClick={() => removePhoto(index)}
                                className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors opacity-0 group-hover:opacity-100 z-20 shadow-lg cursor-pointer"
                              >
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Category and Location Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Category */}
                  <div>
                    <label
                      htmlFor="category"
                      className="block text-sm font-medium text-slate-300 mb-1.5"
                    >
                      Category
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      disabled={isLoadingData}
                      className={`w-full bg-slate-800/50 border ${
                        errors.category
                          ? "border-red-500"
                          : "border-slate-700/50"
                      } text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 ${
                        isLoadingData ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      <option value="" className="bg-slate-800">
                        {isLoadingData
                          ? "Loading categories..."
                          : "Select a category (optional)"}
                      </option>
                      {Array.isArray(categories) && categories.map((category) => (
                        <option
                          key={category.id}
                          value={category.id}
                          className="bg-slate-800"
                        >
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="text-red-400 text-sm mt-1">
                        {errors.category}
                      </p>
                    )}
                  </div>

                  {/* Location */}
                  <div>
                    <label
                      htmlFor="location"
                      className="block text-sm font-medium text-slate-300 mb-1.5"
                    >
                      Location
                    </label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className={`w-full bg-slate-800/50 border ${
                        errors.location
                          ? "border-red-500"
                          : "border-slate-700/50"
                      } text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200`}
                      placeholder="Enter storage location (optional)"
                    />
                    {errors.location && (
                      <p className="text-red-400 text-sm mt-1">
                        {errors.location}
                      </p>
                    )}
                  </div>
                </div>

                {/* Variants Toggle */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Pricing Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                        !formData.hasVariants
                          ? "border-cyan-500 bg-cyan-500/10"
                          : "border-slate-700/50 bg-slate-800/50 hover:border-slate-600"
                      }`}
                    >
                      <input
                        type="radio"
                        name="hasVariants"
                        value="false"
                        checked={!formData.hasVariants}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">
                          Single Price
                        </div>
                        <div className="text-xs text-gray-400">
                          One buy/sell price for all items
                        </div>
                      </div>
                    </label>

                    <label
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                        formData.hasVariants
                          ? "border-cyan-500 bg-cyan-500/10"
                          : "border-slate-700/50 bg-slate-800/50 hover:border-slate-600"
                      }`}
                    >
                      <input
                        type="radio"
                        name="hasVariants"
                        value="true"
                        checked={formData.hasVariants}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">
                          By Variants
                        </div>
                        <div className="text-xs text-gray-400">
                          Different prices for colors/sizes
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Pricing Section */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-slate-100">
                    Pricing Information
                  </h3>

                  {/* No Stock Required Checkbox - moved here */}
                  <div className="flex items-center p-3 bg-slate-800/30 border border-slate-700/50 rounded-lg">
                    <input
                      type="checkbox"
                      id="noStockRequired"
                      name="noStockRequired"
                      checked={formData.noStockRequired}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-slate-600 rounded bg-slate-800 transition-all duration-200"
                    />
                    <label
                      htmlFor="noStockRequired"
                      className="ml-3 block text-sm text-slate-300"
                    >
                      This product has no stock (for services, digital products, etc.)
                    </label>
                  </div>

                  {!formData.hasVariants ? (
                    /* Single Pricing */
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        {/* Buy Price */}
                        <div>
                          <label
                            htmlFor="buyPrice"
                            className="block text-sm font-medium text-slate-300 mb-1.5"
                          >
                            Buy Price {!formData.noStockRequired && "*"}
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                              {formatCurrency(0)
                                .replace(/\d|[.,]/g, "")
                                .trim()}
                            </span>
                            <input
                              type="number"
                              id="buyPrice"
                              name="buyPrice"
                              value={formData.buyPrice || ""}
                              onChange={handleInputChange}
                              min="0"
                              step="0.01"
                              className={`w-full bg-slate-800/50 border ${
                                errors.buyPrice
                                  ? "border-red-500"
                                  : "border-slate-700/50"
                              } text-white placeholder:text-gray-400 rounded-lg py-2 pl-8 pr-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200`}
                              placeholder="0.00"
                            />
                          </div>
                          {errors.buyPrice && (
                            <p className="text-red-400 text-sm mt-1">
                              {errors.buyPrice}
                            </p>
                          )}
                        </div>

                        {/* Sell Price */}
                        <div>
                          <label
                            htmlFor="sellPrice"
                            className="block text-sm font-medium text-slate-300 mb-1.5"
                          >
                            Sell Price {!formData.noStockRequired && "*"}
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                              {formatCurrency(0)
                                .replace(/\d|[.,]/g, "")
                                .trim()}
                            </span>
                            <input
                              type="number"
                              id="sellPrice"
                              name="sellPrice"
                              value={formData.sellPrice || ""}
                              onChange={handleInputChange}
                              min="0"
                              step="0.01"
                              className={`w-full bg-slate-800/50 border ${
                                errors.sellPrice
                                  ? "border-red-500"
                                  : "border-slate-700/50"
                              } text-white placeholder:text-gray-400 rounded-lg py-2 pl-8 pr-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200`}
                              placeholder="0.00"
                            />
                          </div>
                          {errors.sellPrice && (
                            <p className="text-red-400 text-sm mt-1">
                              {errors.sellPrice}
                            </p>
                          )}
                        </div>

                        {/* Stock */}
                        <div>
                          <label
                            htmlFor="stock"
                            className="block text-sm font-medium text-slate-300 mb-1.5"
                          >
                            Stock Quantity {!formData.noStockRequired && "*"}
                          </label>
                          
                          <input
                            type="number"
                            id="stock"
                            name="stock"
                            value={formData.stock || ""}
                            onChange={handleInputChange}
                            min={formData.noStockRequired ? "0" : "1"}
                            step="1"
                            disabled={formData.noStockRequired}
                            className={`w-full bg-slate-800/50 border ${
                              errors.stock
                                ? "border-red-500"
                                : "border-slate-700/50"
                            } text-white placeholder:text-gray-400 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 ${
                              formData.noStockRequired ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            placeholder={formData.noStockRequired ? "N/A" : "1"}
                          />
                          {errors.stock && (
                            <p className="text-red-400 text-sm mt-1">
                              {errors.stock}
                            </p>
                          )}
                        </div>

                        {/* Profit per Unit */}
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-1.5">
                            Profit per Unit
                          </label>
                          <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3 h-[42px] flex items-center justify-between">
                            <p
                              className={`text-sm font-bold ${
                                profit > 0
                                  ? "text-green-400"
                                  : profit < 0
                                  ? "text-red-400"
                                  : "text-yellow-400"
                              }`}
                            >
                              {profit > 0 ? "+" : profit < 0 ? "-" : ""}
                              {formatCurrency(Math.abs(profit))}
                            </p>
                            <p
                              className={`text-xs ${
                                profit > 0
                                  ? "text-green-400/70"
                                  : profit < 0
                                  ? "text-red-400/70"
                                  : "text-yellow-400/70"
                              }`}
                            >
                              {profit > 0 ? "+" : profit < 0 ? "-" : ""}
                              {Math.abs(parseFloat(profitMargin)).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Variant Pricing */
                    <>
                      {/* Add New Variant */}
                      <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3">
                        <h4 className="text-sm font-medium text-slate-300 mb-1">
                          Add Product Variant
                        </h4>
                        <p className="text-xs text-slate-400 mb-3">
                          Fill at least one field (color, size, weight, or
                          custom variant) to identify the variant. All fields
                          are optional except pricing.
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-3">
                          {/* Color */}
                          <div>
                            <select
                              name="color"
                              value={newVariant.color}
                              onChange={handleVariantChange}
                              className="w-full bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-1.5 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                              <option value="" className="bg-slate-800">
                                Color
                              </option>
                              {commonColors.map((color) => (
                                <option
                                  key={color}
                                  value={color}
                                  className="bg-slate-800"
                                >
                                  {color}
                                </option>
                              ))}
                              <option value="Custom" className="bg-slate-800">
                                Custom
                              </option>
                            </select>
                          </div>

                          {/* Size */}
                          <div>
                            <select
                              name="size"
                              value={newVariant.size}
                              onChange={handleVariantChange}
                              className="w-full bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-1.5 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                              <option value="" className="bg-slate-800">
                                Size
                              </option>
                              {commonSizes.map((size) => (
                                <option
                                  key={size}
                                  value={size}
                                  className="bg-slate-800"
                                >
                                  {size}
                                </option>
                              ))}
                              <option value="Custom" className="bg-slate-800">
                                Custom
                              </option>
                            </select>
                          </div>

                          {/* Weight */}
                          <div>
                            <input
                              type="number"
                              name="weight"
                              value={newVariant.weight || ""}
                              onChange={handleVariantChange}
                              placeholder="Weight"
                              min="0"
                              step="0.01"
                              className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-1.5 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                          </div>

                          {/* Weight Unit */}
                          <div>
                            <select
                              name="weight_unit"
                              value={newVariant.weight_unit}
                              onChange={handleVariantChange}
                              className="w-full bg-slate-800/50 border border-slate-700/50 text-white rounded-lg py-1.5 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                              <option value="g" className="bg-slate-800">
                                g
                              </option>
                              <option value="kg" className="bg-slate-800">
                                kg
                              </option>
                              <option value="lb" className="bg-slate-800">
                                lb
                              </option>
                              <option value="oz" className="bg-slate-800">
                                oz
                              </option>
                            </select>
                          </div>

                          {/* Custom Variant */}
                          <div className="md:col-span-2">
                            <input
                              type="text"
                              name="custom_variant"
                              value={newVariant.custom_variant}
                              onChange={handleVariantChange}
                              placeholder="Custom variant (optional)"
                              className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-1.5 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                          </div>
                        </div>

                        {/* Custom Color, Size, and Weight Inputs */}
                        {(newVariant.color === "Custom" ||
                          newVariant.size === "Custom" ||
                          customWeight) && (
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            {/* Custom Color Input */}
                            {newVariant.color === "Custom" && (
                              <input
                                type="text"
                                value={customColor}
                                onChange={(e) => setCustomColor(e.target.value)}
                                placeholder="Enter custom color"
                                className="bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-1.5 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                              />
                            )}

                            {/* Custom Size Input */}
                            {newVariant.size === "Custom" && (
                              <input
                                type="text"
                                value={customSize}
                                onChange={(e) => setCustomSize(e.target.value)}
                                placeholder="Enter custom size"
                                className="bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-1.5 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                              />
                            )}

                            {/* Custom Weight Input */}
                            <input
                              type="number"
                              value={customWeight}
                              onChange={(e) => setCustomWeight(e.target.value)}
                              placeholder="Custom weight"
                              min="0"
                              step="0.01"
                              className="bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-1.5 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                          </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                          {/* Buy Price */}
                          <div>
                            <input
                              type="number"
                              name="buyPrice"
                              value={newVariant.buyPrice || ""}
                              onChange={handleVariantChange}
                              placeholder="Buy Price"
                              min="0"
                              step="0.01"
                              className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-1.5 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                          </div>

                          {/* Sell Price */}
                          <div>
                            <input
                              type="number"
                              name="sellPrice"
                              value={newVariant.sellPrice || ""}
                              onChange={handleVariantChange}
                              placeholder="Sell Price"
                              min="0"
                              step="0.01"
                              className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-1.5 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                          </div>

                          {/* Stock */}
                          <div>
                            <input
                              type="number"
                              name="stock"
                              value={newVariant.stock || ""}
                              onChange={handleVariantChange}
                              placeholder="Stock (min 1)"
                              min="1"
                              className="w-full bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-gray-400 rounded-lg py-1.5 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={addVariant}
                            className="px-4 py-1.5 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-medium rounded-lg hover:bg-cyan-500/30 transition-colors cursor-pointer"
                          >
                            Add Variant
                          </button>
                        </div>
                      </div>

                      {/* Variants List */}
                      {formData.colorSizeVariants.length > 0 && (
                        <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3">
                          <h4 className="text-sm font-medium text-slate-300 mb-3">
                            Product Variants (
                            {formData.colorSizeVariants.length})
                          </h4>

                          {/* Headers */}
                          <div className="grid grid-cols-7 gap-2 text-xs text-slate-400 mb-2 px-2">
                            <span>Color</span>
                            <span>Size</span>
                            <span>Weight</span>
                            <span>Custom</span>
                            <span>Buy Price</span>
                            <span>Sell Price</span>
                            <span>Stock</span>
                          </div>

                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {formData.colorSizeVariants.map((variant) => (
                              <div
                                key={variant.id}
                                className="flex items-center gap-2 bg-slate-700/30 rounded-lg p-2"
                              >
                                <div className="flex-1 grid grid-cols-7 gap-2 text-xs">
                                  <span className="text-white font-medium">
                                    {variant.color}
                                  </span>
                                  <span className="text-gray-300">
                                    {variant.size}
                                  </span>
                                  <span className="text-purple-400">
                                    {variant.weight && variant.weight_unit
                                      ? `${variant.weight}${variant.weight_unit}`
                                      : "-"}
                                  </span>
                                  <span className="text-orange-400 truncate">
                                    {variant.custom_variant || "-"}
                                  </span>
                                  <span className="text-red-400">
                                    {formatCurrency(variant.buyPrice)}
                                  </span>
                                  <span className="text-green-400">
                                    {formatCurrency(variant.sellPrice)}
                                  </span>
                                  <span className="text-cyan-400">
                                    {variant.stock} pcs
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeVariant(variant.id)}
                                  className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>

                          {/* Average Profit Display for Variants */}
                          <div className="mt-3 pt-3 border-t border-slate-700/50">
                            <div className="grid grid-cols-3 gap-3 text-center">
                              <div>
                                <p className="text-xs text-slate-400 mb-1">
                                  Avg Profit/Unit
                                </p>
                                <div className="flex items-center justify-between">
                                  <p
                                    className={`text-sm font-bold ${
                                      profit > 0
                                        ? "text-green-400"
                                        : profit < 0
                                        ? "text-red-400"
                                        : "text-yellow-400"
                                    }`}
                                  >
                                    {profit > 0 ? "+" : profit < 0 ? "-" : ""}
                                    {formatCurrency(Math.abs(profit))}
                                  </p>
                                  <p
                                    className={`text-xs ${
                                      profit > 0
                                        ? "text-green-400/70"
                                        : profit < 0
                                        ? "text-red-400/70"
                                        : "text-yellow-400/70"
                                    }`}
                                  >
                                    {profit > 0 ? "+" : profit < 0 ? "-" : ""}
                                    {Math.abs(parseFloat(profitMargin)).toFixed(
                                      1
                                    )}
                                    %
                                  </p>
                                </div>
                              </div>
                              <div>
                                <p className="text-xs text-slate-400 mb-1">
                                  Avg Buy Price
                                </p>
                                <p className="text-sm font-bold text-slate-300">
                                  {formatCurrency(
                                    formData.colorSizeVariants.length > 0
                                      ? formData.colorSizeVariants.reduce(
                                          (sum, v) => sum + v.buyPrice,
                                          0
                                        ) / formData.colorSizeVariants.length
                                      : 0
                                  )}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-400 mb-1">
                                  Total Stock
                                </p>
                                <p className="text-sm font-bold text-cyan-400">
                                  {formData.colorSizeVariants.reduce(
                                    (sum, v) => sum + v.stock,
                                    0
                                  )}{" "}
                                  pcs
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {errors.variants && (
                        <p className="text-red-400 text-sm">
                          {errors.variants}
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Details */}
                <div>
                  <label
                    htmlFor="details"
                    className="block text-sm font-medium text-slate-300 mb-1.5"
                  >
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

                {/* Submit Error */}
                {errors.submit && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <p className="text-red-400 text-sm">{errors.submit}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-3 border-t border-slate-700/50">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-2 border border-slate-600 text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all duration-200 cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-6 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200 shadow-lg flex items-center justify-center gap-2 ${
                      isSubmitting
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
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
                        Adding Product...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                        Add Product
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* File Upload Tab */}
            {activeTab === "file" && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-white mb-2">
                    Upload Products via File
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Upload multiple products at once using CSV, Excel (.xlsx),
                    or Excel (.xls) files
                  </p>
                </div>

                {/* Instructions Panel */}
                <div className="bg-slate-800/30 border border-slate-700/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <svg
                      className="w-5 h-5 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <h4 className="text-white font-medium">
                      Quick Start Guide
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-slate-700/30 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-cyan-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                          1
                        </span>
                        <span className="text-cyan-400 font-medium">
                          Download Template
                        </span>
                      </div>
                      <p className="text-gray-400 text-xs">
                        Download CSV or Excel template with sample data and
                        correct column headers.
                      </p>
                    </div>
                    <div className="bg-slate-700/30 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                          2
                        </span>
                        <span className="text-green-400 font-medium">
                          Fill Your Data
                        </span>
                      </div>
                      <p className="text-gray-400 text-xs">
                        Replace sample data with your products. Keep the headers
                        unchanged.
                      </p>
                    </div>
                    <div className="bg-slate-700/30 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-purple-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                          3
                        </span>
                        <span className="text-purple-400 font-medium">
                          Upload & Review
                        </span>
                      </div>
                      <p className="text-gray-400 text-xs">
                        Upload your file and review results. Fix any errors if
                        needed.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Download Templates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* CSV Template */}
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <svg
                            className="w-4 h-4 text-cyan-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <h4 className="text-white font-medium">
                            CSV Template
                          </h4>
                        </div>
                        <p className="text-gray-400 text-sm">
                          Comma-separated format, works with Excel/Sheets
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          • UTF-8 encoding • Small file size • Universal
                          compatibility
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleDownloadTemplate}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                          />
                        </svg>
                        Download CSV
                      </button>
                    </div>
                  </div>

                  {/* Excel Template */}
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <svg
                            className="w-4 h-4 text-green-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <h4 className="text-white font-medium">
                            Excel Template
                          </h4>
                        </div>
                        <p className="text-gray-400 text-sm">
                          Native Excel format with formatted columns
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          • Better formatting • Auto-sized columns • Excel
                          optimized
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleDownloadExcelTemplate}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                          />
                        </svg>
                        Download XLSX
                      </button>
                    </div>
                  </div>
                </div>

                {/* File Requirements & Structure Documentation */}
                <div className="bg-slate-800/30 border border-slate-700/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <svg
                      className="w-5 h-5 text-amber-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                    <h4 className="text-white font-medium">
                      File Structure & Requirements
                    </h4>
                  </div>

                  {/* Column Requirements */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h5 className="text-red-400 font-medium mb-3 flex items-center gap-2">
                        <span className="text-red-500">*</span>
                        Required Columns
                      </h5>
                      <div className="space-y-3">
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                          <div className="flex justify-between items-start mb-1">
                            <code className="text-red-400 font-mono text-sm">
                              name
                            </code>
                            <span className="text-xs text-red-300 bg-red-500/20 px-2 py-1 rounded">
                              Required
                            </span>
                          </div>
                          <p className="text-gray-400 text-xs">
                            Product name (max 200 chars). Must be unique for
                            your account.
                          </p>
                          <p className="text-red-300 text-xs mt-1">
                            Example: &ldquo;iPhone 15 Pro&rdquo;, &ldquo;Samsung
                            Galaxy S24&rdquo;
                          </p>
                        </div>
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                          <div className="flex justify-between items-start mb-1">
                            <code className="text-red-400 font-mono text-sm">
                              buy_price
                            </code>
                            <span className="text-xs text-red-300 bg-red-500/20 px-2 py-1 rounded">
                              Required
                            </span>
                          </div>
                          <p className="text-gray-400 text-xs">
                            Purchase price. Must be a positive number &gt; 0.
                          </p>
                          <p className="text-red-300 text-xs mt-1">
                            Example: 50.00, 125.99, 1500
                          </p>
                        </div>
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                          <div className="flex justify-between items-start mb-1">
                            <code className="text-red-400 font-mono text-sm">
                              sell_price
                            </code>
                            <span className="text-xs text-red-300 bg-red-500/20 px-2 py-1 rounded">
                              Required
                            </span>
                          </div>
                          <p className="text-gray-400 text-xs">
                            Selling price. Must be ≥ buy_price and &gt; 0.
                          </p>
                          <p className="text-red-300 text-xs mt-1">
                            Example: 75.00, 199.99, 2000
                          </p>
                        </div>
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                          <div className="flex justify-between items-start mb-1">
                            <code className="text-red-400 font-mono text-sm">
                              stock
                            </code>
                            <span className="text-xs text-red-300 bg-red-500/20 px-2 py-1 rounded">
                              Required
                            </span>
                          </div>
                          <p className="text-gray-400 text-xs">
                            Initial stock quantity. Must be a positive integer ≥
                            1.
                          </p>
                          <p className="text-red-300 text-xs mt-1">
                            Example: 50, 100, 25
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h5 className="text-green-400 font-medium mb-3 flex items-center gap-2">
                        <span className="text-green-500">○</span>
                        Optional Columns
                      </h5>
                      <div className="space-y-3">
                        <div className="bg-slate-700/30 border border-slate-600/30 rounded-lg p-3">
                          <code className="text-green-400 font-mono text-sm">
                            product_code
                          </code>
                          <p className="text-gray-400 text-xs mt-1">
                            SKU, part number, or barcode (max 100 chars)
                          </p>
                          <p className="text-green-300 text-xs">
                            Example: &ldquo;SKU001&rdquo;,
                            &ldquo;PART-12345&rdquo;
                          </p>
                        </div>
                        <div className="bg-slate-700/30 border border-slate-600/30 rounded-lg p-3">
                          <code className="text-green-400 font-mono text-sm">
                            category
                          </code>
                          <p className="text-gray-400 text-xs mt-1">
                            Product category (auto-created if new)
                          </p>
                          <p className="text-green-300 text-xs">
                            Example: &ldquo;Electronics&rdquo;,
                            &ldquo;Clothing&rdquo;
                          </p>
                        </div>
                        <div className="bg-slate-700/30 border border-slate-600/30 rounded-lg p-3">
                          <code className="text-green-400 font-mono text-sm">
                            supplier
                          </code>
                          <p className="text-gray-400 text-xs mt-1">
                            Supplier name (auto-created if new)
                          </p>
                          <p className="text-green-300 text-xs">
                            Example: &ldquo;Apple Inc&rdquo;,
                            &ldquo;Samsung&rdquo;
                          </p>
                        </div>
                        <div className="bg-slate-700/30 border border-slate-600/30 rounded-lg p-3">
                          <code className="text-green-400 font-mono text-sm">
                            location
                          </code>
                          <p className="text-gray-400 text-xs mt-1">
                            Storage location (max 200 chars)
                          </p>
                          <p className="text-green-300 text-xs">
                            Example: &ldquo;Warehouse A&rdquo;, &ldquo;Store
                            Room B&rdquo;
                          </p>
                        </div>
                        <div className="bg-slate-700/30 border border-slate-600/30 rounded-lg p-3">
                          <code className="text-green-400 font-mono text-sm">
                            details
                          </code>
                          <p className="text-gray-400 text-xs mt-1">
                            Product description and specifications
                          </p>
                          <p className="text-green-300 text-xs">
                            Example: &ldquo;Latest model with titanium
                            build&rdquo;
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sample File Structure */}
                  <div className="mb-6">
                    <h5 className="text-purple-400 font-medium mb-3 flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                      </svg>
                      Sample File Structure
                    </h5>
                    <div className="bg-slate-900/50 border border-slate-600/30 rounded-lg p-4 overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-slate-600/50">
                            <th className="text-red-400 py-2 px-3 font-mono">
                              name
                            </th>
                            <th className="text-green-400 py-2 px-3 font-mono">
                              product_code
                            </th>
                            <th className="text-green-400 py-2 px-3 font-mono">
                              category
                            </th>
                            <th className="text-green-400 py-2 px-3 font-mono">
                              supplier
                            </th>
                            <th className="text-red-400 py-2 px-3 font-mono">
                              buy_price
                            </th>
                            <th className="text-red-400 py-2 px-3 font-mono">
                              sell_price
                            </th>
                            <th className="text-red-400 py-2 px-3 font-mono">
                              stock
                            </th>
                          </tr>
                        </thead>
                        <tbody className="text-gray-300">
                          <tr className="border-b border-slate-700/30">
                            <td className="py-2 px-3">iPhone 15 Pro</td>
                            <td className="py-2 px-3">IP15PRO</td>
                            <td className="py-2 px-3">Electronics</td>
                            <td className="py-2 px-3">Apple Inc</td>
                            <td className="py-2 px-3">800.00</td>
                            <td className="py-2 px-3">1200.00</td>
                            <td className="py-2 px-3">50</td>
                          </tr>
                          <tr className="border-b border-slate-700/30">
                            <td className="py-2 px-3">Samsung Galaxy S24</td>
                            <td className="py-2 px-3 text-gray-500 italic">
                              empty
                            </td>
                            <td className="py-2 px-3">Electronics</td>
                            <td className="py-2 px-3">Samsung</td>
                            <td className="py-2 px-3">700.00</td>
                            <td className="py-2 px-3">1100.00</td>
                            <td className="py-2 px-3">30</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3">Wireless Earbuds</td>
                            <td className="py-2 px-3">WE001</td>
                            <td className="py-2 px-3">Audio</td>
                            <td className="py-2 px-3 text-gray-500 italic">
                              empty
                            </td>
                            <td className="py-2 px-3">25.00</td>
                            <td className="py-2 px-3">49.99</td>
                            <td className="py-2 px-3">100</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      <span className="text-red-400">Red columns</span> are
                      required,
                      <span className="text-green-400 ml-2">
                        green columns
                      </span>{" "}
                      are optional. Empty cells are allowed for optional
                      columns.
                    </p>
                  </div>

                  {/* Validation Rules */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-yellow-400 font-medium mb-3 flex items-center gap-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.846-.833-2.616 0L4.198 15.5c-.77.833.192 2.5 1.732 2.5z"
                          />
                        </svg>
                        Validation Rules
                      </h5>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-start gap-2">
                          <span className="text-yellow-400 mt-0.5">•</span>
                          <span className="text-gray-400">
                            Product names must be unique within your account
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-yellow-400 mt-0.5">•</span>
                          <span className="text-gray-400">
                            Sell price must be greater than or equal to buy
                            price
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-yellow-400 mt-0.5">•</span>
                          <span className="text-gray-400">
                            Stock must be a whole number (no decimals)
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-yellow-400 mt-0.5">•</span>
                          <span className="text-gray-400">
                            All prices must be positive numbers
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-yellow-400 mt-0.5">•</span>
                          <span className="text-gray-400">
                            Empty rows will be skipped automatically
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-yellow-400 mt-0.5">•</span>
                          <span className="text-gray-400">
                            Upload errors will specify exact row numbers for
                            easy identification and fixing
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h5 className="text-blue-400 font-medium mb-3 flex items-center gap-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Important Notes
                      </h5>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-start gap-2">
                          <span className="text-blue-400 mt-0.5">•</span>
                          <span className="text-gray-400">
                            Existing categories will be reused, new ones created
                            if needed
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-blue-400 mt-0.5">•</span>
                          <span className="text-gray-400">
                            Suppliers are created per user - existing ones will
                            be reused for your account
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-blue-400 mt-0.5">•</span>
                          <span className="text-gray-400">
                            File upload only supports single-pricing products
                            (no variants)
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-blue-400 mt-0.5">•</span>
                          <span className="text-gray-400">
                            Maximum file size: 25MB for Excel, 10MB for CSV
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-blue-400 mt-0.5">•</span>
                          <span className="text-gray-400">
                            Recommended batch size: 100-500 products per file
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-blue-400 mt-0.5">•</span>
                          <span className="text-gray-400">
                            Photos must be added manually after product creation
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-blue-400 mt-0.5">•</span>
                          <span className="text-gray-400">
                            Any upload errors will show the exact row number
                            from your file for easy fixing
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* File Upload */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <svg
                      className="w-5 h-5 text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <label className="text-white font-medium">
                      Select Your File
                    </label>
                  </div>
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-slate-500 transition-colors">
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-cyan-600 file:text-white hover:file:bg-cyan-700 file:cursor-pointer cursor-pointer"
                      />
                      <p className="text-gray-400 text-xs mt-2">
                        Supported formats: CSV (.csv), Excel (.xlsx, .xls)
                      </p>
                    </div>
                    {uploadFile && (
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-green-400 text-sm">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="font-medium">File Selected:</span>
                          <span>{uploadFile.name}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                          <span>
                            Format:{" "}
                            {uploadFile.name.toLowerCase().endsWith(".csv")
                              ? "CSV"
                              : uploadFile.name.toLowerCase().endsWith(".xlsx")
                              ? "Excel (XLSX)"
                              : "Excel (XLS)"}
                          </span>
                          <span>
                            Size: {(uploadFile.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload Button */}
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={handleFileUpload}
                    disabled={!uploadFile || isUploadingFile}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg"
                  >
                    {isUploadingFile ? (
                      <>
                        <svg
                          className="w-5 h-5 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
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
                        Processing File...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        Upload Products
                      </>
                    )}
                  </button>
                </div>

                {/* Upload Results */}
                {uploadResults && (
                  <div
                    className={`border rounded-lg p-4 ${
                      uploadResults.success
                        ? "border-green-500/20 bg-green-500/10"
                        : "border-red-500/20 bg-red-500/10"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <svg
                        className={`w-5 h-5 ${
                          uploadResults.success
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        {uploadResults.success ? (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        ) : (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        )}
                      </svg>
                      <h4
                        className={`font-medium ${
                          uploadResults.success
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {uploadResults.success
                          ? "Upload Completed"
                          : "Upload Completed with Issues"}
                      </h4>
                    </div>

                    {/* Upload Summary */}
                    <div className="bg-slate-800/50 border border-slate-600/30 rounded-lg p-3 mb-4">
                      <h5 className="text-white font-medium text-sm mb-2">
                        Upload Summary
                      </h5>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                          <span className="text-gray-300">
                            Products Created:
                            <span className="text-green-400 font-semibold ml-1">
                              {uploadResults.products_created}
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                          <span className="text-gray-300">
                            Rows with Issues:
                            <span className="text-red-400 font-semibold ml-1">
                              {uploadResults.errors
                                ? uploadResults.errors.length
                                : 0}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <p
                      className={`text-sm mb-3 ${
                        uploadResults.success
                          ? "text-green-300"
                          : "text-red-300"
                      }`}
                    >
                      {uploadResults.message}
                    </p>

                    {uploadResults.success &&
                      uploadResults.products_created > 0 && (
                        <div className="bg-slate-700/50 rounded p-3 mb-3">
                          <p className="text-white text-sm">
                            Successfully created{" "}
                            <strong>{uploadResults.products_created}</strong>{" "}
                            products
                          </p>

                          {/* Show successful rows details */}
                          {uploadResults.successful_rows &&
                            uploadResults.successful_rows.length > 0 && (
                              <div className="mt-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <svg
                                    className="w-4 h-4 text-green-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                  <span className="text-green-400 text-sm font-medium">
                                    Successfully Added Products:
                                  </span>
                                </div>
                                <div className="bg-slate-800/50 rounded p-2 max-h-32 overflow-y-auto">
                                  {uploadResults.successful_rows.map(
                                    (item, index) => (
                                      <div
                                        key={index}
                                        className="flex items-center gap-2 text-xs text-green-300 mb-1"
                                      >
                                        <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded font-mono text-xs">
                                          Row {item.row}
                                        </span>
                                        <span className="text-gray-300">
                                          {item.name}
                                        </span>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}

                          <p className="text-gray-400 text-xs mt-1">
                            Products have been added to your inventory. You can
                            view them in the Products page or continue adding
                            more products.
                          </p>

                          {/* Navigation Button */}
                          <div className="flex gap-3 mt-3 pt-3 border-t border-slate-600/30">
                            <button
                              type="button"
                              onClick={() => router.push("/dashboard/products")}
                              className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                                />
                              </svg>
                              View Products
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setUploadResults(null);
                                setUploadFile(null);
                              }}
                              className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                              Upload More Products
                            </button>
                          </div>
                        </div>
                      )}

                    {uploadResults.errors &&
                      uploadResults.errors.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-red-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <h5 className="text-red-400 font-medium text-sm">
                              Issues Found ({uploadResults.errors.length} rows):
                            </h5>
                          </div>
                          <div className="bg-slate-700/50 rounded p-3 max-h-48 overflow-y-auto">
                            {uploadResults.errors.map((error, index) => {
                              // Extract row number from error message for highlighting
                              const rowMatch = error.match(/^Row (\d+):/);
                              const rowNumber = rowMatch ? rowMatch[1] : null;
                              const errorMessage = rowMatch
                                ? error.replace(/^Row \d+:\s*/, "")
                                : error;

                              return (
                                <div
                                  key={index}
                                  className="flex items-start gap-2 mb-2 last:mb-0"
                                >
                                  {rowNumber && (
                                    <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-mono text-xs flex-shrink-0">
                                      Row {rowNumber}
                                    </span>
                                  )}
                                  <span className="text-red-300 text-xs leading-relaxed">
                                    {errorMessage}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                          <div className="bg-amber-500/10 border border-amber-500/20 rounded p-2">
                            <p className="text-amber-400 text-xs">
                              💡 <strong>Tip:</strong> Fix the errors above by
                              editing your file at the specified row numbers,
                              then try uploading again. Row numbers correspond
                              to your Excel/CSV file (including the header).
                            </p>
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
