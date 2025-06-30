import { ApiService } from './api';

// Search result interface for unified search results
export interface SearchResult {
  id: string;
  type: 'product' | 'customer' | 'order' | 'supplier';
  title: string;
  subtitle: string;
  href: string;
  badge?: string;
  avatar?: string;
}

// Search API functions
export async function searchData(query: string): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    // Use the unified search endpoint
    const response = await ApiService.get(`/search/?q=${encodeURIComponent(query)}`);
    return response.results || [];
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

// Helper functions
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Recent searches (stored in localStorage)
export function getRecentSearches(): SearchResult[] {
  try {
    if (typeof window === 'undefined') return [];
    const recent = localStorage.getItem('recentSearches');
    return recent ? JSON.parse(recent) : [];
  } catch {
    return [];
  }
}

export function addToRecentSearches(result: SearchResult): void {
  try {
    if (typeof window === 'undefined') return;
    
    const recent = getRecentSearches();
    const filtered = recent.filter(item => item.id !== result.id || item.type !== result.type);
    const updated = [result, ...filtered].slice(0, 4); // Keep only 4 recent searches
    
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  } catch {
    // Silently fail if localStorage is not available
  }
}

// Popular searches (this could come from analytics in a real app)
export function getPopularSearches(): SearchResult[] {
  // For now, return empty array since we don't have analytics data
  // In a real app, this would come from your analytics/tracking system
  return [];
}
