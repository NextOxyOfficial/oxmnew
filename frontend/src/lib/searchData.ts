// Mock data for search results - this would typically come from your API
export interface SearchResult {
  id: string;
  type: 'product' | 'customer' | 'order' | 'supplier';
  title: string;
  subtitle: string;
  href: string;
  badge?: string;
  avatar?: string;
}

export const mockSearchData: SearchResult[] = [
  // Products
  {
    id: '1',
    type: 'product',
    title: 'iPhone 15 Pro Max',
    subtitle: 'Electronics • $1,199.00 • 25 in stock',
    href: '/dashboard/products/1',
    badge: 'HIGH_STOCK'
  },
  {
    id: '2',
    type: 'product',
    title: 'Samsung Galaxy S24',
    subtitle: 'Electronics • $899.00 • 12 in stock',
    href: '/dashboard/products/2',
    badge: 'MEDIUM_STOCK'
  },
  {
    id: '3',
    type: 'product',
    title: 'MacBook Air M3',
    subtitle: 'Computers • $1,299.00 • 8 in stock',
    href: '/dashboard/products/3',
    badge: 'LOW_STOCK'
  },
  {
    id: '4',
    type: 'product',
    title: 'AirPods Pro 2nd Gen',
    subtitle: 'Audio • $249.00 • 45 in stock',
    href: '/dashboard/products/4',
    badge: 'HIGH_STOCK'
  },
  {
    id: '5',
    type: 'product',
    title: 'Dell XPS 13',
    subtitle: 'Computers • $999.00 • 3 in stock',
    href: '/dashboard/products/5',
    badge: 'LOW_STOCK'
  },

  // Customers
  {
    id: '6',
    type: 'customer',
    title: 'John Smith',
    subtitle: 'john.smith@example.com • +1 (555) 123-4567',
    href: '/dashboard/customers/6',
    avatar: 'JS'
  },
  {
    id: '7',
    type: 'customer',
    title: 'Sarah Johnson',
    subtitle: 'sarah.j@example.com • +1 (555) 987-6543',
    href: '/dashboard/customers/7',
    avatar: 'SJ'
  },
  {
    id: '8',
    type: 'customer',
    title: 'Michael Brown',
    subtitle: 'mike.brown@example.com • +1 (555) 555-0123',
    href: '/dashboard/customers/8',
    avatar: 'MB'
  },
  {
    id: '9',
    type: 'customer',
    title: 'Emily Davis',
    subtitle: 'emily.davis@example.com • +1 (555) 246-8101',
    href: '/dashboard/customers/9',
    avatar: 'ED'
  },

  // Orders
  {
    id: '10',
    type: 'order',
    title: 'Order #ORD-2024-001',
    subtitle: 'John Smith • $1,448.00 • Completed',
    href: '/dashboard/orders/10',
    badge: 'COMPLETED'
  },
  {
    id: '11',
    type: 'order',
    title: 'Order #ORD-2024-002',
    subtitle: 'Sarah Johnson • $899.00 • Processing',
    href: '/dashboard/orders/11',
    badge: 'PROCESSING'
  },
  {
    id: '12',
    type: 'order',
    title: 'Order #ORD-2024-003',
    subtitle: 'Michael Brown • $1,299.00 • Pending',
    href: '/dashboard/orders/12',
    badge: 'PENDING'
  },
  {
    id: '13',
    type: 'order',
    title: 'Order #ORD-2024-004',
    subtitle: 'Emily Davis • $249.00 • Shipped',
    href: '/dashboard/orders/13',
    badge: 'SHIPPED'
  },

  // Suppliers
  {
    id: '14',
    type: 'supplier',
    title: 'Apple Inc.',
    subtitle: 'Electronics Supplier • contact@apple.com',
    href: '/dashboard/suppliers/14'
  },
  {
    id: '15',
    type: 'supplier',
    title: 'Samsung Corporation',
    subtitle: 'Electronics Supplier • business@samsung.com',
    href: '/dashboard/suppliers/15'
  },
  {
    id: '16',
    type: 'supplier',
    title: 'Dell Technologies',
    subtitle: 'Computer Hardware • sales@dell.com',
    href: '/dashboard/suppliers/16'
  }
];

export function searchData(query: string): SearchResult[] {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const normalizedQuery = query.toLowerCase().trim();
  
  return mockSearchData.filter(item => 
    item.title.toLowerCase().includes(normalizedQuery) ||
    item.subtitle.toLowerCase().includes(normalizedQuery)
  ).slice(0, 8); // Limit to 8 results
}

export function getRecentSearches(): SearchResult[] {
  // Return last few searches - in real app this would come from localStorage or API
  return mockSearchData.slice(0, 4);
}

export function getPopularSearches(): SearchResult[] {
  // Return popular searches - in real app this would come from analytics
  return [
    mockSearchData[0], // iPhone 15 Pro Max
    mockSearchData[6], // John Smith
    mockSearchData[10], // Order #ORD-2024-001
    mockSearchData[14], // Apple Inc.
  ];
}
