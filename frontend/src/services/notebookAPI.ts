// API service for notebook operations (uses centralized ApiService for base URL resolution)
import { ApiService } from "@/lib/api";

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
  async getNotebooks(): Promise<Notebook[]> {
    const data = await ApiService.get("/notebooks/");
    // Handle paginated response - extract results array
    if (data && typeof data === "object" && "results" in data) {
      return (data as { results: Notebook[] }).results;
    }
    return Array.isArray(data) ? (data as Notebook[]) : [];
  }

  async getNotebook(id: number): Promise<Notebook> {
    return ApiService.get(`/notebooks/${id}/`);
  }

  async createNotebook(data: NotebookCreateData): Promise<Notebook> {
    return ApiService.post("/notebooks/", data);
  }

  async updateNotebook(id: number, data: Partial<NotebookCreateData>): Promise<Notebook> {
    return ApiService.patch(`/notebooks/${id}/`, data);
  }

  async deleteNotebook(id: number): Promise<void> {
    await ApiService.delete(`/notebooks/${id}/`);
  }

  async togglePin(id: number): Promise<{ id: number; is_pinned: boolean; message: string }> {
    return ApiService.post(`/notebooks/${id}/toggle_pin/`, {});
  }

  async toggleActive(id: number): Promise<{ id: number; is_active: boolean; message: string }> {
    return ApiService.post(`/notebooks/${id}/toggle_active/`, {});
  }

  async addTag(id: number, tag: string): Promise<{ id: number; tags: string[]; message: string }> {
    return ApiService.post(`/notebooks/${id}/add_tag/`, { tag });
  }

  async removeTag(id: number, tag: string): Promise<{ id: number; tags: string[]; message: string }> {
    return ApiService.post(`/notebooks/${id}/remove_tag/`, { tag });
  }

  async getStats(): Promise<NotebookStats> {
    return ApiService.get("/notebooks/stats/");
  }

  async searchNotebooks(query: string): Promise<Notebook[]> {
    return ApiService.get(`/notebooks/?search=${encodeURIComponent(query)}`);
  }
}

export const notebookAPI = new NotebookAPI();
export type { Notebook, NotebookCreateData, NotebookStats };
