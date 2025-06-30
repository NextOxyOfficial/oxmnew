"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Edit3, FileText } from "lucide-react";

interface Notebook {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  author: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  assigned_employees: string[];
}

export default function NotebookViewPage() {
  const router = useRouter();
  const params = useParams();
  const notebookId = params.id as string;
  
  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    tags: ''
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Helper function for consistent date formatting
  const formatDate = (dateString: string) => {
    if (!mounted) return '';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  // Mock data - in real app this would fetch from API
  useEffect(() => {
    const fetchNotebook = async () => {
      try {
        setIsLoading(true);
        setError(null);

        await new Promise(resolve => setTimeout(resolve, 800));

        // Mock notebook data based on ID
        const mockNotebook: Notebook = {
          id: parseInt(notebookId),
          name: "Sales Data Analysis",
          description: "Comprehensive analysis of monthly sales performance with visualizations and predictions. This notebook contains detailed insights into revenue trends, customer segments, and product performance metrics.",
          created_at: "2025-06-15T09:30:00Z",
          updated_at: "2025-06-30T10:15:00Z",
          author: "Data Team",
          tags: ["sales", "analysis", "visualization"],
          status: "published",
          assigned_employees: ["John Smith", "Sarah Johnson"]
        };

        setNotebook(mockNotebook);
        setEditForm({
          name: mockNotebook.name,
          description: mockNotebook.description || '',
          tags: mockNotebook.tags.join(', ')
        });
      } catch (err) {
        setError("Failed to load notebook. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotebook();
  }, [notebookId]);

  const handleSave = async () => {
    if (!notebook) return;

    try {
      setIsSaving(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update notebook with form data
      const updatedNotebook: Notebook = {
        ...notebook,
        name: editForm.name,
        description: editForm.description,
        tags: editForm.tags ? editForm.tags.split(',').map(t => t.trim()) : [],
        updated_at: new Date().toISOString()
      };
      
      setNotebook(updatedNotebook);
      setLastSaved(new Date());
      setIsEditing(false);
    } catch (error) {
      alert("Failed to save notebook. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = () => {
    if (!notebook) return;
    setEditForm({
      name: notebook.name,
      description: notebook.description || '',
      tags: notebook.tags.join(', ')
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (notebook) {
      setEditForm({
        name: notebook.name,
        description: notebook.description || '',
        tags: notebook.tags.join(', ')
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="sm:p-6 p-1 space-y-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-700 rounded w-48 mb-6"></div>
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6">
              <div className="h-6 bg-slate-700 rounded mb-4"></div>
              <div className="h-4 bg-slate-700 rounded mb-2"></div>
              <div className="h-4 bg-slate-700 rounded mb-2"></div>
              <div className="h-4 bg-slate-700 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="sm:p-6 p-1 space-y-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
            <h3 className="text-lg font-semibold text-red-400 mb-2">
              Failed to Load Notebook
            </h3>
            <p className="text-red-400/70 mb-4">{error}</p>
            <button
              onClick={() => router.push('/dashboard/notebook')}
              className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
            >
              Back to Notebooks
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!notebook) {
    return (
      <div className="sm:p-6 p-1 space-y-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6 text-center">
            <h3 className="text-lg font-semibold text-yellow-400 mb-2">
              Notebook Not Found
            </h3>
            <p className="text-yellow-400/70 mb-4">
              The notebook you're looking for doesn't exist or has been removed.
            </p>
            <button
              onClick={() => router.push('/dashboard/notebook')}
              className="px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors"
            >
              Back to Notebooks
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sm:p-6 p-1 space-y-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard/notebook')}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                {isEditing ? 'Edit Notebook' : 'View Notebook'}
              </h1>
              {lastSaved && (
                <p className="text-slate-400 text-sm mt-1">
                  Last saved: {formatDate(lastSaved.toISOString())}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-slate-700/50 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save'}</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit</span>
              </button>
            )}
          </div>
        </div>

        {/* Notebook Content */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl shadow-lg">
          {isEditing ? (
            // Edit Mode
            <div className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-slate-100 placeholder-slate-400"
                  placeholder="Enter notebook title..."
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={8}
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-slate-100 placeholder-slate-400 resize-vertical"
                  placeholder="Enter notebook description..."
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  value={editForm.tags}
                  onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-slate-100 placeholder-slate-400"
                  placeholder="Enter tags separated by commas..."
                />
                <p className="text-slate-400 text-xs mt-1">
                  Separate multiple tags with commas
                </p>
              </div>
            </div>
          ) : (
            // View Mode
            <div className="p-6">
              {/* Notebook Header */}
              <div className="mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-slate-100 mb-2">
                      {notebook.name}
                    </h2>
                    <div className="flex items-center space-x-4 text-sm text-slate-400">
                      <span>By {notebook.author}</span>
                      <span>•</span>
                      <span>Created {formatDate(notebook.created_at)}</span>
                      <span>•</span>
                      <span>Updated {formatDate(notebook.updated_at)}</span>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    notebook.status === 'published' 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : notebook.status === 'draft'
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                  }`}>
                    {notebook.status}
                  </div>
                </div>

                {/* Tags */}
                {notebook.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {notebook.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-slate-700/50 text-slate-300 text-sm rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Assigned Employees */}
                {notebook.assigned_employees.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-slate-300 mb-2">Assigned Employees</h4>
                    <div className="flex flex-wrap gap-2">
                      {notebook.assigned_employees.map((employee) => (
                        <span
                          key={employee}
                          className="px-3 py-1 bg-blue-500/20 text-blue-300 text-sm rounded-full border border-blue-500/30"
                        >
                          {employee}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="bg-slate-800/30 rounded-lg p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <FileText className="w-5 h-5 text-slate-400" />
                  <h3 className="text-lg font-semibold text-slate-200">Description</h3>
                </div>
                {notebook.description ? (
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {notebook.description}
                  </p>
                ) : (
                  <p className="text-slate-400 italic">
                    No description provided.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}