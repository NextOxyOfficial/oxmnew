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
  // Since we don't have explicit order status, we'll use some logic
  // Orders within last 24 hours could be "draft", others "completed"
  const saleDate = new Date(sale.sale_date);
  const now = new Date();
  const diffHours = (now.getTime() - saleDate.getTime()) / (1000 * 60 * 60);

  if (diffHours < 24) {
    return Math.random() > 0.5 ? "Draft" : "Completed";
  } else {
    return "Completed";
  }
};
