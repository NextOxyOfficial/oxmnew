"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, FileText, Edit3, Eye } from "lucide-react";

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

export default function NotebookPage() {
  const router = useRouter();
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterEmployee, setFilterEmployee] = useState("all");
  const [sortBy, setSortBy] = useState("updated_at");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newNotebook, setNewNotebook] = useState({
    name: '',
    description: '',
    tags: '',
    assigned_employees: [] as string[]
  });
  const [mounted, setMounted] = useState(false);

  // Mock employees data
  const availableEmployees = [
    "John Smith", "Sarah Johnson", "Mike Davis", "Emily Chen", 
    "Alex Rodriguez", "Lisa Wang", "David Wilson", "Anna Martinez",
    "Chris Brown", "Jessica Taylor", "Michael Lee", "Rachel Green"
  ];

  // Ensure component is mounted before rendering dates
  useEffect(() => {
    setMounted(true);
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

  // Mock data for demonstration
  useEffect(() => {
    const fetchNotebooks = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock notebook data
        const mockNotebooks: Notebook[] = [
          {
            id: 1,
            name: "Sales Data Analysis",
            description: "Comprehensive analysis of monthly sales performance with visualizations and predictions",
            created_at: "2025-06-15T09:30:00Z",
            updated_at: "2025-06-30T10:15:00Z",
            author: "Data Team",
            tags: ["sales", "analysis", "visualization"],
            status: "published",
            assigned_employees: ["John Smith", "Sarah Johnson"]
          },
          {
            id: 2,
            name: "Customer Segmentation Model",
            description: "Machine learning model to segment customers based on purchasing behavior",
            created_at: "2025-06-20T14:20:00Z",
            updated_at: "2025-06-28T16:45:00Z",
            author: "Marketing Team",
            tags: ["customers", "ml", "clustering", "segmentation"],
            status: "draft",
            assigned_employees: ["Mike Davis", "Emily Chen", "Alex Rodriguez"]
          },
          {
            id: 3,
            name: "Inventory Optimization",
            description: "JavaScript-based inventory optimization and demand forecasting",
            created_at: "2025-06-25T11:10:00Z",
            updated_at: "2025-06-29T09:30:00Z",
            author: "Operations Team",
            tags: ["inventory", "optimization"],
            status: "draft",
            assigned_employees: ["Lisa Wang"]
          },
          {
            id: 4,
            name: "Financial Reporting Dashboard",
            description: "Comprehensive financial analysis and reporting system",
            created_at: "2025-06-10T08:15:00Z",
            updated_at: "2025-06-30T07:20:00Z",
            author: "Finance Team",
            tags: ["finance", "reporting"],
            status: "published",
            assigned_employees: ["David Wilson", "Anna Martinez"]
          }
        ];

        setNotebooks(mockNotebooks);
      } catch (err) {
        setError("Failed to load notebooks. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotebooks();
  }, []);

  // Calculate stats
  const totalNotebooks = notebooks.length;
  const publishedNotebooks = notebooks.filter(n => n.status === 'published').length;
  const draftNotebooks = notebooks.filter(n => n.status === 'draft').length;

  // Get unique tags for filters
  const allTags = Array.from(new Set(notebooks.flatMap(n => n.tags)));

  // Get unique employees for filters
  const allEmployees = Array.from(new Set(notebooks.flatMap(n => n.assigned_employees)));

  // Handle create notebook
  const handleCreateNotebook = async (status: 'draft' | 'published' = 'draft') => {
    if (!newNotebook.name) {
      alert("Please enter a notebook name");
      return;
    }

    try {
      setIsCreating(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create new notebook object
      const notebook: Notebook = {
        id: Date.now(),
        name: newNotebook.name,
        description: newNotebook.description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        author: "Current User",
        tags: newNotebook.tags ? newNotebook.tags.split(',').map(t => t.trim()) : [],
        status: status,
        assigned_employees: newNotebook.assigned_employees
      };
      
      // Add to notebooks list
      setNotebooks(prev => [notebook, ...prev]);
      
      // Reset form and close modal
      setNewNotebook({ name: '', description: '', tags: '', assigned_employees: [] });
      setShowCreateModal(false);
      
      // Navigate to the new notebook
      router.push(`/dashboard/notebook/${notebook.id}`);
    } catch (error) {
      alert("Failed to create notebook. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCloseCreateModal = () => {
    setNewNotebook({ name: '', description: '', tags: '', assigned_employees: [] });
    setShowCreateModal(false);
  };

  // Handle employee selection
  const handleEmployeeToggle = (employee: string) => {
    setNewNotebook(prev => ({
      ...prev,
      assigned_employees: prev.assigned_employees.includes(employee)
        ? prev.assigned_employees.filter(emp => emp !== employee)
        : [...prev.assigned_employees, employee]
    }));
  };

  // Handle view notebook
  const handleViewNotebook = (notebook: Notebook) => {
    router.push(`/dashboard/notebook/${notebook.id}`);
  };

  // Filter and sort notebooks
  const filteredNotebooks = notebooks
    .filter((notebook) => {
      const matchesSearch = notebook.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           notebook.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           notebook.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           notebook.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = filterStatus === "all" || notebook.status === filterStatus;
      const matchesEmployee = filterEmployee === "all" || notebook.assigned_employees.includes(filterEmployee);
      return matchesSearch && matchesStatus && matchesEmployee;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "created_at":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "updated_at":
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        default:
          return 0;
      }
    });

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
              className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
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
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Notebooks
          </h1>
          <p className="text-gray-400 text-sm sm:text-base mt-2">
            Create and manage simple notes with titles and descriptions
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {/* Total Notebooks */}
          <div className="bg-gradient-to-br from-blue-500/15 to-blue-600/8 border border-blue-500/25 rounded-lg p-2.5 backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <div className="rounded-md bg-blue-500/20 p-1.5">
                <FileText className="h-7 w-7 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-blue-300 font-medium">Total Notebooks</p>
                <p className="text-base font-bold text-blue-400">
                  {totalNotebooks}
                </p>
                <p className="text-xs text-blue-500 opacity-80">All notebooks</p>
              </div>
            </div>
          </div>

          {/* Published Notebooks */}
          <div className="bg-gradient-to-br from-green-500/15 to-green-600/8 border border-green-500/25 rounded-lg p-2.5 backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <div className="rounded-md bg-green-500/20 p-1.5">
                <FileText className="h-7 w-7 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-green-300 font-medium">Published</p>
                <p className="text-base font-bold text-green-400">
                  {publishedNotebooks}
                </p>
                <p className="text-xs text-green-500 opacity-80">Ready to use</p>
              </div>
            </div>
          </div>

          {/* Draft Notebooks */}
          <div className="bg-gradient-to-br from-yellow-500/15 to-yellow-600/8 border border-yellow-500/25 rounded-lg p-2.5 backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <div className="rounded-md bg-yellow-500/20 p-1.5">
                <Edit3 className="h-7 w-7 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-yellow-300 font-medium">Drafts</p>
                <p className="text-base font-bold text-yellow-400">
                  {draftNotebooks}
                </p>
                <p className="text-xs text-yellow-500 opacity-80">In progress</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls and Filters */}
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Left side - Create Button and Search */}
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Create Notebook Button */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg cursor-pointer whitespace-nowrap flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>New Notebook</span>
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

            {/* Filters and Sort */}
            <div className="flex flex-wrap gap-3">
              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-slate-100 text-sm min-w-[140px]"
              >
                <option value="all" className="bg-slate-800">
                  All Status
                </option>
                <option value="draft" className="bg-slate-800">
                  Draft
                </option>
                <option value="published" className="bg-slate-800">
                  Published
                </option>
                <option value="archived" className="bg-slate-800">
                  Archived
                </option>
              </select>

              {/* Employee Filter */}
              <select
                value={filterEmployee}
                onChange={(e) => setFilterEmployee(e.target.value)}
                className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-slate-100 text-sm min-w-[160px]"
              >
                <option value="all" className="bg-slate-800">
                  All Employees
                </option>
                {allEmployees.map((employee) => (
                  <option key={employee} value={employee} className="bg-slate-800">
                    {employee}
                  </option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-slate-100 text-sm min-w-[160px]"
              >
                <option value="updated_at" className="bg-slate-800">
                  Recently Updated
                </option>
                <option value="created_at" className="bg-slate-800">
                  Recently Created
                </option>
                <option value="name" className="bg-slate-800">
                  Name A-Z
                </option>
              </select>
            </div>
          </div>

          {/* Notebook Grid */}
          <div className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredNotebooks.map((notebook) => (
                <div
                  key={notebook.id}
                  className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800/70 transition-all duration-200 group"
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => handleViewNotebook(notebook)}
                        className="text-left w-full group-inner"
                      >
                        <h3 className="text-lg font-semibold text-slate-100 line-clamp-1 group-inner-hover:text-blue-400 cursor-pointer transition-colors">
                          {notebook.name}
                        </h3>
                      </button>
                      <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                        {notebook.description || "No description"}
                      </p>
                    </div>
                    
                    {/* Status Badge */}
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ml-3 ${
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
                    <div className="flex flex-wrap gap-1 mb-4">
                      {notebook.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                      {notebook.tags.length > 3 && (
                        <span className="px-2 py-1 bg-slate-700/50 text-slate-400 text-xs rounded-md">
                          +{notebook.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Assigned Employees */}
                  {notebook.assigned_employees.length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs text-slate-500 mb-1">Assigned to:</div>
                      <div className="flex flex-wrap gap-1">
                        {notebook.assigned_employees.slice(0, 2).map((employee) => (
                          <span
                            key={employee}
                            className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-md"
                          >
                            {employee}
                          </span>
                        ))}
                        {notebook.assigned_employees.length > 2 && (
                          <span className="px-2 py-1 bg-slate-600/50 text-slate-400 text-xs rounded-md">
                            +{notebook.assigned_employees.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="text-xs text-slate-400 mb-4">
                    <div>By {notebook.author}</div>
                    <div>Updated: {formatDate(notebook.updated_at)}</div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewNotebook(notebook)}
                      className="w-full bg-blue-500/20 text-blue-400 hover:text-blue-300 hover:bg-blue-500/30 p-2 rounded-lg transition-colors cursor-pointer text-xs font-medium flex items-center justify-center space-x-1"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* No notebooks found */}
            {filteredNotebooks.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-300 mb-2">
                  No notebooks found
                </h3>
                <p className="text-slate-400 mb-4">
                  {searchTerm ? "Try adjusting your search criteria" : "Create your first notebook to get started"}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                  >
                    Create Notebook
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Create Notebook Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
            <div className="min-h-full flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700/50 rounded-xl shadow-xl max-w-3xl w-full my-8">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                  <h2 className="text-xl font-semibold text-slate-100">Create New Notebook</h2>
                  <button 
                    onClick={handleCloseCreateModal}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6">
                  {/* Notebook Name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
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

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Description
                    </label>
                    <textarea
                      rows={4}
                      value={newNotebook.description}
                      onChange={(e) => setNewNotebook({ ...newNotebook, description: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-slate-100 placeholder-slate-400 text-sm resize-vertical min-h-[100px] max-h-[300px]"
                      placeholder="Describe what this notebook will do (optional)"
                    />
                    <p className="text-slate-400 text-xs mt-1">
                      You can resize this field by dragging the corner
                    </p>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Tags
                    </label>
                    <input
                      type="text"
                      value={newNotebook.tags}
                      onChange={(e) => setNewNotebook({ ...newNotebook, tags: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-slate-100 placeholder-slate-400 text-sm"
                      placeholder="analysis, visualization, ml (comma-separated)"
                    />
                  </div>

                  {/* Assigned Employees */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">
                      Assign Employees
                    </label>
                    <div className="max-h-48 overflow-y-auto border border-slate-700/50 rounded-lg p-3">
                      <div className="grid grid-cols-2 gap-2">
                        {availableEmployees.map((employee) => (
                          <label
                            key={employee}
                            className="flex items-center space-x-2 p-2 hover:bg-slate-700/30 rounded cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={newNotebook.assigned_employees.includes(employee)}
                              onChange={() => handleEmployeeToggle(employee)}
                              className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                            />
                            <span className="text-sm text-slate-300">{employee}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    {newNotebook.assigned_employees.length > 0 && (
                      <p className="text-slate-400 text-xs mt-2">
                        Selected: {newNotebook.assigned_employees.join(', ')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-between items-center p-6 border-t border-slate-700/50">
                  <button
                    onClick={handleCloseCreateModal}
                    className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleCreateNotebook('draft')}
                      disabled={isCreating || !newNotebook.name}
                      className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 transition-all duration-200 shadow-lg cursor-pointer"
                    >
                      {isCreating ? 'Saving...' : 'Save as Draft'}
                    </button>
                    <button
                      onClick={() => handleCreateNotebook('published')}
                      disabled={isCreating || !newNotebook.name}
                      className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 shadow-lg cursor-pointer"
                    >
                      {isCreating ? 'Publishing...' : 'Create & Publish'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
