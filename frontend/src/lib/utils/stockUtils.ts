import { Product, ProductVariant } from "@/hooks/useLowStock";

// Helper function to get stock status
export const getStockStatus = (product: Product) => {
  const totalStock = getTotalStock(product);

  if (totalStock === 0) {
    return "out-of-stock";
  } else if (totalStock <= 5) {
    return "critical";
  } else if (totalStock <= 10) {
    return "low";
  } else {
    return "normal";
  }
};

// Helper function to get total stock for a product
export const getTotalStock = (product: Product): number => {
  if (product.has_variants && product.variants) {
    return product.variants.reduce(
      (total, variant) => total + variant.stock,
      0
    );
  }
  return product.stock;
};

// Helper function to get stock status color
export const getStockStatusColor = (status: string) => {
  switch (status) {
    case "out-of-stock":
      return "red";
    case "critical":
      return "red";
    case "low":
      return "orange";
    case "normal":
      return "green";
    default:
      return "gray";
  }
};

// Helper function to get stock status text
export const getStockStatusText = (status: string) => {
  switch (status) {
    case "out-of-stock":
      return "Out of Stock";
    case "critical":
      return "Critical Stock";
    case "low":
      return "Low Stock";
    case "normal":
      return "In Stock";
    default:
      return "Unknown";
  }
};

// Helper function to get the lowest stock variant for products with variants
export const getLowestStockVariant = (
  product: Product
): ProductVariant | null => {
  if (
    !product.has_variants ||
    !product.variants ||
    product.variants.length === 0
  ) {
    return null;
  }

  return product.variants.reduce((lowest, variant) =>
    variant.stock < lowest.stock ? variant : lowest
  );
};

// Helper function to format variant display name
export const formatVariantName = (variant: ProductVariant): string => {
  let name = `${variant.color} - ${variant.size}`;
  if (variant.custom_variant) {
    name += ` (${variant.custom_variant})`;
  }
  return name;
};

// Helper function to calculate restock suggestion
export const getRestockSuggestion = (
  product: Product,
  targetStock: number = 50
): number => {
  const currentStock = getTotalStock(product);
  return Math.max(0, targetStock - currentStock);
};
