// API service for notebook operations
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface Notebook {
  id: number;
  name: string;
  description?: string;
  tags: string[];
  is_active: boolean;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  created_by_username: string;
  tag_count: number;
  sections_count?: number;
}

interface NotebookCreateData {
  name: string;
  description?: string;
  tags: string[];
  is_active?: boolean;
  is_pinned?: boolean;
}

interface NotebookStats {
  total_notebooks: number;
  active_notebooks: number;
  pinned_notebooks: number;
  total_sections: number;
  most_used_tags: string[];
  recent_notebooks: Notebook[];
}

class NotebookAPI {
  private getAuthHeaders(): HeadersInit {
    // For now, don't send any auth headers since we're using AllowAny permission
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    return headers;
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch (parseError) {
        // If JSON parsing fails, use status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    return response.json();
  }

  async getNotebooks(): Promise<Notebook[]> {
    console.log('Making API request to:', `${API_BASE_URL}/notebooks/`);
    try {
      const response = await fetch(`${API_BASE_URL}/notebooks/`, {
        headers: this.getAuthHeaders(),
      });
      console.log('API response status:', response.status);
      console.log('API response ok:', response.ok);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
      }
      const data = await this.handleResponse(response);
      console.log('API response data:', data);
      
      // Handle paginated response - extract results array
      if (data && typeof data === 'object' && 'results' in data) {
        return data.results as Notebook[];
      }
      
      // Fallback for direct array response
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  }

  async getNotebook(id: number): Promise<Notebook> {
    const response = await fetch(`${API_BASE_URL}/notebooks/${id}/`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async createNotebook(data: NotebookCreateData): Promise<Notebook> {
    const response = await fetch(`${API_BASE_URL}/notebooks/`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async updateNotebook(id: number, data: Partial<NotebookCreateData>): Promise<Notebook> {
    const response = await fetch(`${API_BASE_URL}/notebooks/${id}/`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async deleteNotebook(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/notebooks/${id}/`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}`);
    }
  }

  async togglePin(id: number): Promise<{ id: number; is_pinned: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/notebooks/${id}/toggle_pin/`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async toggleActive(id: number): Promise<{ id: number; is_active: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/notebooks/${id}/toggle_active/`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async addTag(id: number, tag: string): Promise<{ id: number; tags: string[]; message: string }> {
    const response = await fetch(`${API_BASE_URL}/notebooks/${id}/add_tag/`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ tag }),
    });
    return this.handleResponse(response);
  }

  async removeTag(id: number, tag: string): Promise<{ id: number; tags: string[]; message: string }> {
    const response = await fetch(`${API_BASE_URL}/notebooks/${id}/remove_tag/`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ tag }),
    });
    return this.handleResponse(response);
  }

  async getStats(): Promise<NotebookStats> {
    const response = await fetch(`${API_BASE_URL}/notebooks/stats/`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async searchNotebooks(query: string): Promise<Notebook[]> {
    const response = await fetch(`${API_BASE_URL}/notebooks/?search=${encodeURIComponent(query)}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }
}

export const notebookAPI = new NotebookAPI();
export type { Notebook, NotebookCreateData, NotebookStats };
