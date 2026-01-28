"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, FileText, Edit3, Eye, NotebookPen, Crown, Lock } from "lucide-react";
import { notebookAPI, Notebook as APINotebook, NotebookCreateData } from "@/services/notebookAPI";
import { useSubscription } from "@/hooks/useSubscription";

// Interface for notebook data
interface Notebook {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  tags: string[];
}

export default function NotebookPage() {
  const router = useRouter();
  const { isPro, isFree, subscriptionStatus, isLoading: subscriptionLoading } = useSubscription();
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newNotebook, setNewNotebook] = useState({
    name: '',
    description: '',
    tags: ''
  });
  const [mounted, setMounted] = useState(false);

  // Mock employees data - removed as not needed
  
  // Ensure component is mounted before rendering dates
  useEffect(() => {
    setMounted(true);
    
    // Clear any invalid auth tokens that might be causing issues
    const token = localStorage.getItem('authToken');
    if (token && (token === 'null' || token === 'undefined' || token.trim() === '')) {
      localStorage.removeItem('authToken');
      console.log('Cleared invalid auth token');
    }
  }, []);

  // Helper function for consistent date formatting
  const formatDate = (dateString: string) => {
    if (!mounted) return ''; // Return empty string during SSR
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  // Load notebooks from Django API
  useEffect(() => {
    const fetchNotebooks = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log('Starting to fetch notebooks...');

        const apiNotebooks = await notebookAPI.getNotebooks();
        console.log('Received notebooks from API:', apiNotebooks);
        
        // Convert API format to local format
        const localNotebooks: Notebook[] = apiNotebooks.map(notebook => ({
          id: notebook.id,
          name: notebook.name,
          description: notebook.description || '',
          created_at: notebook.created_at,
          updated_at: notebook.updated_at,
          tags: notebook.tags
        }));
        setNotebooks(localNotebooks);
        console.log('Notebooks loaded from database:', localNotebooks.length);
        
      } catch (err) {
  console.error('Failed to load notebooks from database:', err);
  console.error('Error details:', err instanceof Error ? err.message : String(err));
  setError("Unable to connect to the notebook service. Please check your server configuration and network, then try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotebooks();
  }, []);

  // Calculate stats
  const totalNotebooks = notebooks.length;

  // Get unique tags for filters
  const allTags = Array.from(new Set(notebooks.flatMap(n => n.tags)));

  // Handle create notebook
  const handleCreateNotebook = async () => {
    if (!newNotebook.name.trim()) {
      alert("Please enter a notebook name");
      return;
    }

    try {
      setIsCreating(true);
      
      const createData: NotebookCreateData = {
        name: newNotebook.name.trim(),
        description: newNotebook.description.trim() || '',
        tags: newNotebook.tags 
          ? newNotebook.tags.split(',').map(t => t.trim()).filter(t => t.length > 0)
          : [],
        is_active: true,
        is_pinned: false
      };

  console.log('Creating notebook with data:', createData);
      
      const apiNotebook = await notebookAPI.createNotebook(createData);
      console.log('API response:', apiNotebook);
      
      // Convert to local format and add to list
      const localNotebook: Notebook = {
        id: apiNotebook.id,
        name: apiNotebook.name,
        description: apiNotebook.description || '',
        created_at: apiNotebook.created_at,
        updated_at: apiNotebook.updated_at,
        tags: apiNotebook.tags
      };
      
      setNotebooks(prev => [localNotebook, ...prev]);
      console.log('Notebook created successfully:', localNotebook.name);
      
      // Reset form and close modal
      setNewNotebook({ name: '', description: '', tags: '' });
      setShowCreateModal(false);
      
    } catch (error) {
      console.error('Detailed error creating notebook:', error);
      
      let errorMessage = "Failed to create notebook. ";
      
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          errorMessage += "Unable to connect to the server. Please check if the backend is running.";
        } else if (error.message.includes('404')) {
          errorMessage += "API endpoint not found. Please check the server configuration.";
        } else if (error.message.includes('500')) {
          errorMessage += "Server error occurred. Please check the backend logs.";
        } else {
          errorMessage += error.message;
        }
      } else {
        errorMessage += "Unknown error occurred.";
      }
      
      alert(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCloseCreateModal = () => {
    setNewNotebook({ name: '', description: '', tags: '' });
    setShowCreateModal(false);
  };

  // Handle create notebook button click with subscription check
  const handleCreateClick = () => {
    if (isFree) {
      setShowProModal(true);
    } else if (isPro) {
      setShowCreateModal(true);
    }
  };

  // Handle navigation to subscriptions page
  const handleUpgradeClick = () => {
    setShowProModal(false);
    router.push('/dashboard/subscriptions');
  };

  // Handle delete notebook
  const handleDeleteNotebook = async (notebookId: number, notebookName: string) => {
    if (!confirm(`Are you sure you want to delete "${notebookName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await notebookAPI.deleteNotebook(notebookId);
      console.log('Notebook deleted from database:', notebookName);
      
      // Update local state
      const updatedNotebooks = notebooks.filter(n => n.id !== notebookId);
      setNotebooks(updatedNotebooks);
      
    } catch (error) {
      console.error('Error deleting notebook:', error);
      alert("Failed to delete notebook. Please check your connection to the database.");
    }
  };

  // Handle view notebook
  const handleViewNotebook = (notebook: Notebook) => {
    console.log('Navigating to notebook:', notebook.id);
    router.push(`/dashboard/notebook/${notebook.id}`);
  };

  // Filter notebooks
  const filteredNotebooks = notebooks
    .filter((notebook) => {
      const matchesSearch = notebook.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           notebook.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           notebook.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesSearch;
    })
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  // Loading state
  if (isLoading) {
    return (
      <div className="sm:p-6 p-1 space-y-6">
        <div className="max-w-7xl">
          {/* Loading skeleton */}
          <div className="animate-pulse">
            <div className="h-8 bg-slate-700 rounded w-48 mb-6"></div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4"
                >
                  <div className="h-4 bg-slate-700 rounded mb-2"></div>
                  <div className="h-8 bg-slate-700 rounded mb-2"></div>
                  <div className="h-3 bg-slate-700 rounded"></div>
                </div>
              ))}
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
        <div className="max-w-7xl">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
            <h3 className="text-lg font-semibold text-red-400 mb-2">
              Failed to Load Notebooks
            </h3>
            <p className="text-red-400/70 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors cursor-pointer"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sm:p-6 p-1 space-y-6">
      <div className="max-w-7xl">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Notebooks
              </h1>
              <p className="text-gray-400 text-sm sm:text-base mt-2">
                Create and manage simple notes with titles and descriptions
              </p>
            </div>
            
          </div>
        </div>

        {/* Controls */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl shadow-lg py-4 px-2">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Create Notebook Button */}
            <button
              onClick={handleCreateClick}
              className={`px-4 py-2 text-white text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 shadow-lg cursor-pointer whitespace-nowrap flex items-center space-x-2 ${
                isFree 
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 focus:ring-amber-500' 
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:ring-blue-500'
              }`}
            >
              {isFree ? <Crown className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{isFree ? 'Create New Note (Pro)' : 'Create New Note'}</span>
            </button>
            
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search notebooks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-slate-100 placeholder-slate-400 text-sm pl-10 pr-4"
                />
              </div>
            </div>
          </div>

          {/* Notebook List */}
          <div className="mt-6">
            {filteredNotebooks.length > 0 ? (
              <div className="space-y-4">
                {filteredNotebooks.map((notebook) => (
                  <div
                    key={notebook.id}
                    className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 hover:bg-slate-800/50 hover:border-slate-600/50 transition-all duration-200 group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 cursor-pointer" onClick={() => handleViewNotebook(notebook)}>
                        <div className="flex items-center space-x-2 mb-2">
                          <NotebookPen className="w-5 h-5 text-slate-400 group-hover:text-slate-300" />
                          <h3 className="text-lg font-semibold text-slate-200 group-hover:text-white">
                            {notebook.name}
                          </h3>
                        </div>
                        {notebook.description && (
                          <p className="text-slate-400 text-sm mb-3 line-clamp-2">
                            {notebook.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-4">
                          {/* Tags */}
                          {notebook.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {notebook.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full border border-blue-500/30"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          {/* Date */}
                          <span className="text-slate-500 text-xs">
                            Updated: {formatDate(notebook.updated_at)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewNotebook(notebook);
                          }}
                          className="px-3 py-1 bg-blue-600/20 text-blue-300 text-xs rounded-full border border-blue-500/30 hover:bg-blue-600/30 hover:text-blue-200 hover:border-blue-400/40 transition-all duration-200 cursor-pointer"
                        >
                          View
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNotebook(notebook.id, notebook.name);
                          }}
                          className="px-3 py-1 bg-red-600/20 text-red-300 text-xs rounded-full border border-red-500/30 hover:bg-red-600/30 hover:text-red-200 hover:border-red-400/40 transition-all duration-200 cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-300 mb-2">
                  {searchTerm ? "No notebooks found" : "No notebooks yet"}
                </h3>
                <p className="text-slate-400 mb-4">
                  {searchTerm ? "Try adjusting your search terms" : "Create your first notebook to get started"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Create Notebook Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
            <div className="min-h-full flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700/50 rounded-xl shadow-xl max-w-2xl w-full my-4">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
                  <h2 className="text-lg font-semibold text-slate-100">Create New Notebook</h2>
                  <button 
                    onClick={handleCloseCreateModal}
                    className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-4 space-y-4">
                  {/* Notebook Name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Notebook Name *
                    </label>
                    <input
                      type="text"
                      value={newNotebook.name}
                      onChange={(e) => setNewNotebook({ ...newNotebook, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-slate-100 placeholder-slate-400 text-sm"
                      placeholder="Enter notebook name"
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Tags (Remarks)
                    </label>
                    <input
                      type="text"
                      value={newNotebook.tags}
                      onChange={(e) => setNewNotebook({ ...newNotebook, tags: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-slate-100 placeholder-slate-400 text-sm"
                      placeholder="analysis, visualization, notes (comma-separated)"
                    />
                    <p className="text-slate-400 text-xs mt-1">
                      These will appear as badges next to your notebook title
                    </p>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Description
                    </label>
                    <textarea
                      rows={12}
                      value={newNotebook.description}
                      onChange={(e) => setNewNotebook({ ...newNotebook, description: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-slate-100 placeholder-slate-400 text-sm resize-vertical min-h-[280px] max-h-[400px]"
                      placeholder="Describe what this notebook will do (optional)"
                    />
                    <p className="text-slate-400 text-xs mt-1">
                      You can resize this field by dragging the corner
                    </p>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-between items-center p-4 border-t border-slate-700/50">
                  <button
                    onClick={handleCloseCreateModal}
                    className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleCreateNotebook()}
                    disabled={isCreating || !newNotebook.name}
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 shadow-lg cursor-pointer"
                  >
                    {isCreating ? 'Creating...' : 'Create Notebook'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pro Subscription Required Modal */}
        {showProModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800/95 rounded-xl border border-slate-700/50 shadow-2xl max-w-md w-full mx-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-amber-500/20 to-amber-600/20 rounded-lg">
                    <Crown className="w-5 h-5 text-amber-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-100">Pro Feature</h2>
                </div>
                <button 
                  onClick={() => setShowProModal(false)}
                  className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-amber-500/20 to-amber-600/20 rounded-full flex items-center justify-center mb-4">
                  <Lock className="w-8 h-8 text-amber-400" />
                </div>
                
                <h3 className="text-xl font-semibold text-slate-100">
                  Upgrade to Pro Required
                </h3>
                
                <p className="text-slate-300 leading-relaxed">
                  Creating new notebooks is a Pro feature. Upgrade your subscription to unlock unlimited notebook creation and advanced features.
                </p>

                <div className="bg-slate-700/30 rounded-lg p-4 text-left">
                  <h4 className="text-sm font-semibold text-amber-400 mb-2">Pro Features Include:</h4>
                  <ul className="text-sm text-slate-300 space-y-1">
                    <li className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                      <span>Unlimited notebook creation</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                      <span>Advanced editing features</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                      <span>Premium templates</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                      <span>Priority support</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex space-x-3 p-4 border-t border-slate-700/50">
                <button
                  onClick={() => setShowProModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-300 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg transition-all duration-200 cursor-pointer"
                >
                  Maybe Later
                </button>
                <button
                  onClick={handleUpgradeClick}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-medium rounded-lg hover:from-amber-600 hover:to-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-200 shadow-lg cursor-pointer flex items-center justify-center space-x-2"
                >
                  <Crown className="w-4 h-4" />
                  <span>Upgrade to Pro</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
