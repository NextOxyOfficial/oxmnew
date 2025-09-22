import { Sale } from "@/hooks/useRecentSales";

// Helper function to format date and time
export const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return {
      date: "Today",
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  } else if (diffDays === 1) {
    return {
      date: "Yesterday",
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  } else if (diffDays <= 7) {
    return {
      date: `${diffDays} days ago`,
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  } else {
    return {
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  }
};

// Helper function to generate order ID from sale ID
export const generateOrderId = (saleId: number) => {
  return `#${1000 + saleId}`;
};

// Helper function to determine order status
export const getOrderStatus = (sale: Sale) => {
  // If the sale has an explicit status field, use it
  if (sale.status) {
    return sale.status === "draft" ? "Draft" : "Completed";
  }
  
  // For sales that came from orders, they should typically be "Completed"
  // since they represent finalized transactions with sales data
  // Only consider as draft if explicitly marked or if certain conditions are met
  
  // If the sale has very recent timestamp (within last hour) and no customer info,
  // it might be a draft being tested, but this is rare
  const saleDate = new Date(sale.sale_date);
  const now = new Date();
  const diffMinutes = (now.getTime() - saleDate.getTime()) / (1000 * 60);
  
  // Very recent sales (less than 5 minutes) with no customer info might be test drafts
  if (diffMinutes < 5 && !sale.customer_name && !sale.customer_phone) {
    return "Draft";
  }
  
  // All other sales should be considered completed
  return "Completed";
};
