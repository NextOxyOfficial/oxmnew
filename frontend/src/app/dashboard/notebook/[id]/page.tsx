"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Edit3, FileText, Calendar, Tag, User } from "lucide-react";
import { notebookAPI } from "@/services/notebookAPI";

interface Notebook {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  is_active: boolean;
  is_pinned: boolean;
  created_by_username: string;
  tag_count: number;
  sections_count?: number;
}

export default function NotebookViewPage() {
  const router = useRouter();
  const params = useParams();
  const notebookId = parseInt(params.id as string);
  
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
    if (!mounted || !dateString) return '';
    
    try {
      // Handle different date formats from the API
      const date = new Date(dateString);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date string:', dateString);
        return 'Invalid Date';
      }
      
      // Format the date consistently
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC'
      });
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return dateString; // Fallback to original string
    }
  };

  // Load notebook from database
  useEffect(() => {
    const fetchNotebook = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log('Fetching notebook with ID:', notebookId);

        const apiNotebook = await notebookAPI.getNotebook(notebookId);
        console.log('Received notebook:', apiNotebook);
        console.log('Created at:', apiNotebook.created_at, 'Type:', typeof apiNotebook.created_at);
        console.log('Updated at:', apiNotebook.updated_at, 'Type:', typeof apiNotebook.updated_at);
        
        setNotebook(apiNotebook);
        setEditForm({
          name: apiNotebook.name,
          description: apiNotebook.description || '',
          tags: apiNotebook.tags.join(', ')
        });
        
      } catch (err) {
        console.error('Failed to load notebook:', err);
        setError("Failed to load notebook. Please check if the notebook exists.");
      } finally {
        setIsLoading(false);
      }
    };

    if (notebookId) {
      fetchNotebook();
    }
  }, [notebookId]);

  const handleSave = async () => {
    if (!notebook) return;

    try {
      setIsSaving(true);
      
      const updateData = {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        tags: editForm.tags 
          ? editForm.tags.split(',').map(t => t.trim()).filter(t => t.length > 0)
          : []
      };

      console.log('Saving notebook with data:', updateData);
      const updatedNotebook = await notebookAPI.updateNotebook(notebook.id, updateData);
      console.log('Updated notebook:', updatedNotebook);
      
      // Merge the updated data with the existing notebook to preserve all fields
      const mergedNotebook = {
        ...notebook, // Keep original data
        ...updatedNotebook, // Override with updated data
        // Ensure essential fields are preserved if missing from update response
        created_at: updatedNotebook.created_at || notebook.created_at,
        created_by_username: updatedNotebook.created_by_username || notebook.created_by_username,
      };
      
      setNotebook(mergedNotebook);
      setLastSaved(new Date());
      setIsEditing(false);
      
    } catch (error) {
      console.error('Failed to save notebook:', error);
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

  const handleCancel = () => {
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
            <div className="h-8 bg-slate-700/50 rounded-lg w-48 mb-6"></div>
            <div className="space-y-4">
              <div className="h-12 bg-slate-700/50 rounded-lg"></div>
              <div className="h-32 bg-slate-700/50 rounded-lg"></div>
              <div className="h-8 bg-slate-700/50 rounded-lg w-64"></div>
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
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center space-x-2 text-slate-400 hover:text-slate-300 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
            <h3 className="text-lg font-semibold text-red-400 mb-2">
              Failed to Load Notebook
            </h3>
            <p className="text-red-400/70 mb-4">{error}</p>
            <div className="space-x-4">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors cursor-pointer"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push('/dashboard/notebook')}
                className="px-4 py-2 bg-slate-600/20 border border-slate-600/30 text-slate-400 rounded-lg hover:bg-slate-600/30 transition-colors cursor-pointer"
              >
                Back to Notebooks
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!notebook) return null;

  return (
    <div className="sm:p-6 p-1 space-y-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-slate-400 hover:text-slate-300 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Notebooks</span>
          </button>
          
          <div className="flex items-center space-x-3">
            {lastSaved && mounted && (
              <span className="text-xs text-slate-500">
                Last saved: {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Notebook Content */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl shadow-lg p-6 space-y-6">
          {/* Title */}
          <div>
            {isEditing ? (
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg text-xl font-semibold text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                placeholder="Enter notebook title"
              />
            ) : (
              <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-3">
                <FileText className="w-6 h-6 text-blue-400" />
                <span>{notebook.name}</span>
              </h1>
            )}
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700/30">
            <div className="flex items-center space-x-2 text-slate-400">
              <Calendar className="w-4 h-4" />
              <div>
                <span className="text-xs text-slate-500">Created</span>
                <p className="text-sm">{notebook.created_at ? formatDate(notebook.created_at) : 'Unknown'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-slate-400">
              <Calendar className="w-4 h-4" />
              <div>
                <span className="text-xs text-slate-500">Updated</span>
                <p className="text-sm">{notebook.updated_at ? formatDate(notebook.updated_at) : 'Unknown'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-slate-400">
              <User className="w-4 h-4" />
              <div>
                <span className="text-xs text-slate-500">Created by</span>
                <p className="text-sm">{notebook.created_by_username || 'Unknown'}</p>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Tags
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editForm.tags}
                onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                placeholder="tag1, tag2, tag3"
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {notebook.tags.length > 0 ? (
                  notebook.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-500/20 text-blue-300 text-sm rounded-full border border-blue-500/30 flex items-center space-x-1"
                    >
                      <Tag className="w-3 h-3" />
                      <span>{tag}</span>
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 italic">No tags</span>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description
            </label>
            {isEditing ? (
              <textarea
                rows={12}
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 resize-vertical min-h-[300px]"
                placeholder="Enter notebook description"
              />
            ) : (
              <div className="prose prose-invert max-w-none">
                {notebook.description ? (
                  <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {notebook.description}
                  </p>
                ) : (
                  <p className="text-slate-500 italic">No description available</p>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end items-center space-x-3 pt-4">
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-blue-600/20 border border-blue-500/30 text-blue-300 rounded-lg hover:bg-blue-600/30 hover:text-blue-200 transition-all duration-200 flex items-center space-x-2 cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-slate-400 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-green-600/20 border border-green-500/30 text-green-300 rounded-lg hover:bg-green-600/30 hover:text-green-200 transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Status indicators */}
          <div className="flex items-center space-x-4 pt-4 border-t border-slate-700/50">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
              notebook.is_active 
                ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                : 'bg-red-500/20 text-red-300 border border-red-500/30'
            }`}>
              <span className={`w-2 h-2 rounded-full ${notebook.is_active ? 'bg-green-400' : 'bg-red-400'}`}></span>
              <span>{notebook.is_active ? 'Active' : 'Inactive'}</span>
            </div>
            
            {notebook.is_pinned && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 rounded-full text-sm">
                <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                <span>Pinned</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}