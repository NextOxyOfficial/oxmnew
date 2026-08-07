"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Edit3, FileText, Tag } from "lucide-react";
import { notebookAPI } from "@/services/notebookAPI";
import { useToast } from "@/components/ui/Feedback";

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
  const toast = useToast();

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
        return 'তারিখ ঠিক নেই';
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
        setError("নোটবুকটা আনা গেল না। নোটবুকটা আছে কিনা একবার দেখুন।");
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
      toast.error("নোটবুক সেভ করা গেল না। আরেকবার চেষ্টা করুন।");
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
      <div className="page">
        <header className="page-head">
          <div>
            <h1 className="page-title">নোটবুক</h1>
            <p className="page-sub">নোটটা খোলা হচ্ছে</p>
          </div>
        </header>
        <div className="plane">
          <div className="empty">লোড হচ্ছে…</div>
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
            <p className="page-sub">নোটটা খোলা যায়নি</p>
          </div>
          <button onClick={() => router.back()} className="btn btn-ghost">
            <ArrowLeft className="h-4 w-4" />
            <span>ফিরে যান</span>
          </button>
        </header>

        <div className="plane">
          <div className="plane-section text-center">
            <h3 className="mb-2 text-sm font-semibold text-rose-600">
              নোটবুক আনা গেল না
            </h3>
            <p className="mb-4 text-sm text-slate-600">{error}</p>
            <div className="flex flex-wrap justify-center gap-2">
              <button onClick={() => window.location.reload()} className="btn btn-ghost">
                আবার চেষ্টা করুন
              </button>
              <button onClick={() => router.push('/dashboard/notebook')} className="btn btn-ghost">
                নোটবুকের তালিকায় যান
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!notebook) return null;

  return (
    <div className="page">
      <header className="page-head">
        <div className="min-w-0">
          <h1 className="page-title truncate" title={notebook.name}>{notebook.name}</h1>
          <p className="page-sub">
            {lastSaved && mounted
              ? `শেষ সেভ হয়েছে ${lastSaved.toLocaleTimeString()} এ`
              : 'নোটের বিস্তারিত'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => router.back()} className="btn btn-ghost">
            <ArrowLeft className="h-4 w-4" />
            <span>নোটবুকের তালিকা</span>
          </button>
          {!isEditing ? (
            <button onClick={handleEdit} className="btn btn-primary">
              <Edit3 className="h-4 w-4" />
              <span>এডিট করুন</span>
            </button>
          ) : (
            <>
              <button onClick={handleCancel} className="btn btn-ghost">
                বাতিল
              </button>
              <button onClick={handleSave} disabled={isSaving} className="btn btn-primary">
                <Save className="h-4 w-4" />
                <span>{isSaving ? 'সেভ হচ্ছে…' : 'সেভ করুন'}</span>
              </button>
            </>
          )}
        </div>
      </header>

      <div className="plane">
        {/* Title */}
        <div className="plane-section">
          <div className="section-title">নোটের নাম</div>
          {isEditing ? (
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="input"
              placeholder="নোটবুকের নাম লিখুন"
              aria-label="নোটবুকের নাম"
            />
          ) : (
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <FileText className="h-5 w-5 flex-shrink-0 text-cyan-600" />
              <span className="min-w-0 break-words">{notebook.name}</span>
            </h2>
          )}
        </div>

        {/* Metadata */}
        <div className="plane-section">
          <div className="section-title">তথ্য</div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="text-xs text-slate-500">কবে বানানো</div>
              <p className="num text-sm text-slate-900">{notebook.created_at ? formatDate(notebook.created_at) : 'জানা নেই'}</p>
            </div>
            <div>
              <div className="text-xs text-slate-500">শেষ বদল</div>
              <p className="num text-sm text-slate-900">{notebook.updated_at ? formatDate(notebook.updated_at) : 'জানা নেই'}</p>
            </div>
            <div className="min-w-0">
              <div className="text-xs text-slate-500">কে বানিয়েছে</div>
              <p className="truncate text-sm text-slate-900" title={notebook.created_by_username || ''}>
                {notebook.created_by_username || 'জানা নেই'}
              </p>
            </div>
            <div>
              <div className="text-xs text-slate-500">অবস্থা</div>
              <div className="mt-0.5 flex flex-wrap gap-1">
                <span className={`badge ${notebook.is_active ? 'badge-success' : 'badge-danger'}`}>
                  {notebook.is_active ? 'Active' : 'Inactive'}
                </span>
                {notebook.is_pinned && (
                  <span className="badge badge-warn">পিন করা</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="plane-section">
          <div className="section-title">ট্যাগ</div>
          {isEditing ? (
            <input
              type="text"
              value={editForm.tags}
              onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
              className="input"
              placeholder="হিসাব, বাকি, নোট (কমা দিয়ে আলাদা করুন)"
              aria-label="ট্যাগ"
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {notebook.tags.length > 0 ? (
                notebook.tags.map((tag, index) => (
                  <span key={index} className="badge badge-info">
                    <Tag className="h-3 w-3" />
                    <span>{tag}</span>
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-500">কোনো ট্যাগ নেই</span>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        <div className="plane-section">
          <div className="section-title">বিবরণ</div>
          {isEditing ? (
            <textarea
              rows={12}
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              className="textarea min-h-[260px] resize-y"
              placeholder="নোটবুকের বিবরণ লিখুন"
              aria-label="বিবরণ"
            />
          ) : notebook.description ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
              {notebook.description}
            </p>
          ) : (
            <p className="text-sm text-slate-500">কোনো বিবরণ লেখা নেই</p>
          )}
        </div>
      </div>
    </div>
  );
}
