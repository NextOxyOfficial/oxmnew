"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, FileText, NotebookPen, Crown, Lock, Search } from "lucide-react";
import { notebookAPI, Notebook as APINotebook, NotebookCreateData } from "@/services/notebookAPI";
import { useSubscription } from "@/hooks/useSubscription";
import { useConfirm, useToast } from "@/components/ui/Feedback";
import Pagination from "@/components/ui/Pagination";

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
  const toast = useToast();
  const confirm = useConfirm();
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
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
        const localNotebooks: Notebook[] = apiNotebooks.map((notebook: APINotebook) => ({
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
  setError("নোটবুক সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না। ইন্টারনেট আর সার্ভার সেটিংস দেখে আবার চেষ্টা করুন।");
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
      toast.error("নোটবুকের একটা নাম দিন");
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

      let errorMessage = "নোটবুক তৈরি করা গেল না। ";

      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          errorMessage += "সার্ভারে যোগাযোগ করা যাচ্ছে না। ব্যাকএন্ড চালু আছে কিনা দেখুন।";
        } else if (error.message.includes('404')) {
          errorMessage += "সার্ভারের ঠিকানাটা পাওয়া গেল না। সেটিংস একবার দেখুন।";
        } else if (error.message.includes('500')) {
          errorMessage += "সার্ভারে সমস্যা হয়েছে। ব্যাকএন্ডের লগ দেখুন।";
        } else {
          errorMessage += error.message;
        }
      } else {
        errorMessage += "কিছু একটা সমস্যা হয়েছে।";
      }

      toast.error(errorMessage);
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
    const ok = await confirm({
      title: `"${notebookName}" ডিলিট করে দেবেন?`,
      message: "একবার মুছলে আর ফেরত আসবে না।",
      confirmLabel: "ডিলিট করুন",
      danger: true,
    });
    if (!ok) {
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
      toast.error("নোটবুক ডিলিট করা গেল না। ইন্টারনেট সংযোগটা একবার দেখুন।");
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

  const totalItems = filteredNotebooks.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  // Reset to the first page whenever the search narrows the list
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Never leave the user stranded past the last page
  useEffect(() => {
    setCurrentPage((prev) => Math.min(Math.max(prev, 1), totalPages));
  }, [totalPages]);

  const paginatedNotebooks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredNotebooks.slice(start, start + itemsPerPage);
  }, [filteredNotebooks, currentPage, itemsPerPage]);

  // Loading state
  if (isLoading) {
    return (
      <div className="page">
        <header className="page-head">
          <div>
            <h1 className="page-title">নোটবুক</h1>
            <p className="page-sub">নাম আর বিবরণ দিয়ে সহজ নোট লিখে রাখুন</p>
          </div>
        </header>
        <div className="plane">
          <div className="empty">নোটবুক লোড হচ্ছে…</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="page">
        <header className="page-head">
          <div>
            <h1 className="page-title">নোটবুক</h1>
            <p className="page-sub">নাম আর বিবরণ দিয়ে সহজ নোট লিখে রাখুন</p>
          </div>
        </header>
        <div className="plane">
          <div className="plane-section text-center">
            <h3 className="mb-2 text-sm font-semibold text-rose-600">
              নোটবুক আনা গেল না
            </h3>
            <p className="mb-4 text-sm text-slate-600">{error}</p>
            <button onClick={() => window.location.reload()} className="btn btn-ghost">
              আবার চেষ্টা করুন
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">নোটবুক</h1>
          <p className="page-sub">নাম আর বিবরণ দিয়ে সহজ নোট লিখে রাখুন</p>
        </div>
        <button
          onClick={handleCreateClick}
          className={`btn ${isFree ? 'btn-ghost' : 'btn-primary'}`}
        >
          {isFree ? <Crown className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          <span>{isFree ? 'নতুন নোট (প্রো লাগবে)' : 'নতুন নোট'}</span>
        </button>
      </header>

      <div className="plane">
        {/* Counts */}
        <div className="stat-strip">
          <div className="stat">
            <div className="stat-label">মোট নোটবুক</div>
            <div className="stat-value num">{totalNotebooks}</div>
            <div className="stat-meta">সব মিলিয়ে</div>
          </div>
          <div className="stat">
            <div className="stat-label">ট্যাগ</div>
            <div className="stat-value num">{allTags.length}</div>
            <div className="stat-meta">আলাদা আলাদা</div>
          </div>
        </div>

        {/* Search */}
        <div className="plane-section">
          <div className="flex max-w-sm items-center gap-2">
            <Search className="h-4 w-4 flex-shrink-0 text-slate-500" />
            <input
              type="text"
              placeholder="নোটবুক খুঁজুন"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
              aria-label="নোটবুক খুঁজুন"
            />
          </div>
        </div>

        {/* Notebook list */}
        {filteredNotebooks.length > 0 ? (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>নোটবুক</th>
                  <th>ট্যাগ</th>
                  <th>শেষ বদল</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paginatedNotebooks.map((notebook) => (
                  <tr key={notebook.id}>
                    <td>
                      <button
                        onClick={() => handleViewNotebook(notebook)}
                        className="flex items-start gap-2 text-left"
                      >
                        <NotebookPen className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-500" />
                        <span className="min-w-0">
                          <span className="block font-medium text-slate-900">{notebook.name}</span>
                          {notebook.description && (
                            <span className="mt-0.5 block max-w-md truncate text-xs text-slate-500" title={notebook.description}>
                              {notebook.description}
                            </span>
                          )}
                        </span>
                      </button>
                    </td>
                    <td>
                      {notebook.tags.length > 0 ? (
                        <span className="flex flex-wrap gap-1">
                          {notebook.tags.map((tag, index) => (
                            <span key={index} className="badge badge-info">{tag}</span>
                          ))}
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="num whitespace-nowrap">{formatDate(notebook.updated_at)}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewNotebook(notebook);
                          }}
                          className="btn btn-ghost btn-sm"
                        >
                          দেখুন
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNotebook(notebook.id, notebook.name);
                          }}
                          className="btn btn-danger btn-sm"
                        >
                          ডিলিট
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">
            <FileText className="mx-auto mb-3 h-10 w-10 text-slate-600" />
            <div className="mb-1 font-medium text-slate-600">
              {searchTerm ? "কিছু পাওয়া যায়নি" : "এখনো কোনো নোটবুক নেই"}
            </div>
            <div>
              {searchTerm ? "অন্য কোনো শব্দ দিয়ে খুঁজে দেখুন" : "শুরু করতে প্রথম নোটবুকটা বানিয়ে ফেলুন"}
            </div>
          </div>
        )}

        <div className="plane-section">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onPageSizeChange={(pageSize) => {
              setItemsPerPage(pageSize);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Create notebook modal */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={handleCloseCreateModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2 className="modal-title">নতুন নোটবুক</h2>
              <button
                onClick={handleCloseCreateModal}
                className="text-slate-500 hover:text-slate-700"
                aria-label="বন্ধ করুন"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="modal-body space-y-4">
              <div>
                <label className="label" htmlFor="notebook-name">নোটবুকের নাম *</label>
                <input
                  id="notebook-name"
                  type="text"
                  value={newNotebook.name}
                  onChange={(e) => setNewNotebook({ ...newNotebook, name: e.target.value })}
                  className="input"
                  placeholder="নোটবুকের নাম লিখুন"
                />
              </div>

              <div>
                <label className="label" htmlFor="notebook-tags">ট্যাগ (মন্তব্য)</label>
                <input
                  id="notebook-tags"
                  type="text"
                  value={newNotebook.tags}
                  onChange={(e) => setNewNotebook({ ...newNotebook, tags: e.target.value })}
                  className="input"
                  placeholder="হিসাব, বাকি, নোট (কমা দিয়ে আলাদা করুন)"
                />
                <p className="mt-1 text-xs text-slate-500">
                  নোটবুকের নামের পাশে ছোট ব্যাজ হয়ে দেখা যাবে
                </p>
              </div>

              <div>
                <label className="label" htmlFor="notebook-description">বিবরণ</label>
                <textarea
                  id="notebook-description"
                  rows={12}
                  value={newNotebook.description}
                  onChange={(e) => setNewNotebook({ ...newNotebook, description: e.target.value })}
                  className="textarea min-h-[220px] max-h-[400px] resize-y"
                  placeholder="এই নোটবুকে কী লিখবেন সেটা এখানে লিখুন (না দিলেও চলবে)"
                />
                <p className="mt-1 text-xs text-slate-500">
                  কোণা ধরে টেনে ঘরটা বড়-ছোট করতে পারবেন
                </p>
              </div>
            </div>

            <div className="modal-foot">
              <button onClick={handleCloseCreateModal} className="btn btn-ghost">
                বাতিল
              </button>
              <button
                onClick={() => handleCreateNotebook()}
                disabled={isCreating || !newNotebook.name}
                className="btn btn-primary"
              >
                {isCreating ? 'তৈরি হচ্ছে…' : 'নোটবুক বানান'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pro subscription required modal */}
      {showProModal && (
        <div className="modal-backdrop" onClick={() => setShowProModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2 className="modal-title flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-600" />
                প্রো ফিচার
              </h2>
              <button
                onClick={() => setShowProModal(false)}
                className="text-slate-500 hover:text-slate-700"
                aria-label="বন্ধ করুন"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="modal-body space-y-4">
              <div className="flex items-start gap-3">
                <Lock className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    এই কাজটার জন্য প্রো লাগবে
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    নতুন নোটবুক বানানো প্রো প্ল্যানের সুবিধা। প্রো নিলে যত খুশি নোটবুক বানাতে পারবেন, সাথে আরও কিছু বাড়তি সুবিধা পাবেন।
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="section-title">প্রো তে যা যা পাবেন</div>
                <ul className="space-y-1 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                    <span>যত খুশি নোটবুক বানানো</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                    <span>এডিট করার বাড়তি সুবিধা</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                    <span>রেডি করা টেমপ্লেট</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                    <span>আগে আগে সাপোর্ট</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="modal-foot">
              <button onClick={() => setShowProModal(false)} className="btn btn-ghost">
                পরে দেখব
              </button>
              <button onClick={handleUpgradeClick} className="btn btn-primary">
                <Crown className="h-4 w-4" />
                <span>প্রো নিন</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
