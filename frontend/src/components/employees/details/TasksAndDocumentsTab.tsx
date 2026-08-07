"use client";

import React, { useState, useEffect } from "react";
import { Trash2, X, Upload, Download, CheckCircle2, ClipboardList, FileText } from "lucide-react";
import { Task, Document } from "@/types/employee";
import employeeAPI from "@/lib/employeeAPI";

interface TasksAndDocumentsTabProps {
  tasks: Task[];
  documents: Document[];
  employeeId: string;
  onTasksUpdate: (tasks: Task[]) => void;
  onDocumentsUpdate: (documents: Document[]) => void;
}

export default function TasksAndDocumentsTab({ 
  tasks, 
  documents, 
  employeeId, 
  onTasksUpdate, 
  onDocumentsUpdate 
}: TasksAndDocumentsTabProps) {
  const [mounted, setMounted] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"tasks" | "documents">("tasks");
  const [showAssignTaskModal, setShowAssignTaskModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isAssigningTask, setIsAssigningTask] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [markingTaskDone, setMarkingTaskDone] = useState<number | null>(null);
  const [deletingDocumentId, setDeletingDocumentId] = useState<number | null>(
    null
  );
  const [actionError, setActionError] = useState<string | null>(null);
  
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    due_date: "",
    project: "",
    assigned_by: "Admin", // This would typically come from the logged-in user
  });

  const [newDocument, setNewDocument] = useState({
    name: "",
    category: "other" as Document["category"],
    file: null as File | null,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatDate = (dateString: string) => {
    if (!mounted) return dateString;
    return new Date(dateString).toLocaleDateString();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "urgent":
        return "badge badge-danger";
      case "high":
        return "badge badge-warn";
      case "medium":
        return "badge badge-info";
      case "low":
        return "badge badge-muted";
      default:
        return "badge badge-muted";
    }
  };

  const getPriorityLabel = (priority: Task["priority"]) => {
    switch (priority) {
      case "urgent":
        return "জরুরি";
      case "high":
        return "বেশি";
      case "medium":
        return "মাঝারি";
      case "low":
        return "কম";
      default:
        return priority;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "badge badge-success";
      case "in_progress":
        return "badge badge-info";
      case "pending":
        return "badge badge-warn";
      case "cancelled":
        return "badge badge-muted";
      case "overdue":
        return "badge badge-danger";
      default:
        return "badge badge-muted";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "শেষ";
      case "in_progress":
        return "চলছে";
      case "pending":
        return "পেন্ডিং";
      case "cancelled":
        return "বাতিল করা";
      case "overdue":
        return "সময় পার";
      default:
        return status;
    }
  };

  const getCategoryLabel = (category: Document["category"]) => {
    switch (category) {
      case "contract":
        return "চুক্তিপত্র";
      case "id_document":
        return "পরিচয়পত্র";
      case "certificate":
        return "সার্টিফিকেট";
      case "performance":
        return "পারফরম্যান্স রিভিউ";
      default:
        return "অন্যান্য";
    }
  };

  const handleAssignTask = async () => {
    if (!newTask.title || !newTask.due_date) return;

    setIsAssigningTask(true);
    setActionError(null);
    try {
      const createdTask = await employeeAPI.createTask(Number(employeeId), {
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        due_date: newTask.due_date,
        assigned_by: newTask.assigned_by,
        project: newTask.project,
      });
      onTasksUpdate([...tasks, createdTask]);

      setShowAssignTaskModal(false);
      setNewTask({
        title: "",
        description: "",
        priority: "medium",
        due_date: "",
        project: "",
        assigned_by: "Admin",
      });
    } catch (error) {
      console.error("Error assigning task:", error);
      setActionError("কাজটা অ্যাসাইন করা যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setIsAssigningTask(false);
    }
  };

  const handleMarkTaskDone = async (taskId: number) => {
    setMarkingTaskDone(taskId);
    setActionError(null);
    try {
      const updated = await employeeAPI.markTaskCompleted(taskId);
      onTasksUpdate(
        tasks.map((t) => (t.id === taskId ? { ...t, ...updated } : t))
      );
    } catch (error) {
      console.error("Error updating task:", error);
      setActionError("কাজটা শেষ হিসেবে দেওয়া যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setMarkingTaskDone(null);
    }
  };

  const handleFileUpload = async () => {
    if (!newDocument.file || !newDocument.name) return;

    setUploadingFile(true);
    setActionError(null);
    try {
      const uploadedDoc = await employeeAPI.uploadDocument(
        Number(employeeId),
        newDocument.file,
        newDocument.name,
        newDocument.category
      );
      onDocumentsUpdate([...documents, uploadedDoc]);

      setShowUploadModal(false);
      setNewDocument({
        name: "",
        category: "other",
        file: null,
      });
    } catch (error) {
      console.error("Error uploading document:", error);
      setActionError("কাগজটা আপলোড করা যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteDocument = async (documentId: number) => {
    setDeletingDocumentId(documentId);
    setActionError(null);
    try {
      await employeeAPI.deleteDocument(documentId);
      onDocumentsUpdate(documents.filter((d) => d.id !== documentId));
    } catch (error) {
      console.error("Error deleting document:", error);
      setActionError("কাগজটা ডিলিট করা যায়নি। আবার চেষ্টা করুন।");
    } finally {
      setDeletingDocumentId(null);
    }
  };

  return (
    <>
      {actionError && (
        <div
          className="plane-section flex flex-wrap items-center gap-2"
          role="status"
          aria-live="polite"
        >
          <span className="badge badge-danger">সমস্যা</span>
          <p className="text-sm text-slate-600">{actionError}</p>
        </div>
      )}

      {/* Sub-tabs for Tasks and Documents */}
      <div className="plane-section">
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab("tasks")}
            className={`btn btn-sm ${activeSubTab === "tasks" ? "btn-primary" : "btn-ghost"}`}
          >
            <ClipboardList className="h-4 w-4" />
            কাজ
          </button>
          <button
            onClick={() => setActiveSubTab("documents")}
            className={`btn btn-sm ${activeSubTab === "documents" ? "btn-primary" : "btn-ghost"}`}
          >
            <FileText className="h-4 w-4" />
            কাগজপত্র
          </button>
        </div>
      </div>

      {/* Tasks Section */}
      {activeSubTab === "tasks" && (
        <>
          <div className="plane-section">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="section-title mb-0">দেওয়া কাজ</div>
              <button
                onClick={() => setShowAssignTaskModal(true)}
                className="btn btn-primary btn-sm"
              >
                নতুন কাজ দিন
              </button>
            </div>
          </div>

          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>কাজ</th>
                  <th>গুরুত্ব</th>
                  <th>অবস্থা</th>
                  <th>শেষ তারিখ</th>
                  <th>কে দিয়েছে</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tasks.length > 0 ? (
                  tasks.map((task) => (
                    <tr key={task.id}>
                      <td>
                        <div className="cell-strong">{task.title}</div>
                        {task.description && (
                          <div className="text-slate-500">{task.description}</div>
                        )}
                        {task.project && (
                          <div className="text-slate-500">প্রজেক্ট: {task.project}</div>
                        )}
                      </td>
                      <td>
                        <span className={getPriorityColor(task.priority)}>
                          {getPriorityLabel(task.priority)}
                        </span>
                      </td>
                      <td>
                        <span className={getStatusColor(task.status)}>
                          {getStatusLabel(task.status)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap">{formatDate(task.due_date)}</td>
                      <td>
                        <div>{task.assigned_by}</div>
                        <div className="text-slate-500 whitespace-nowrap">
                          {formatDate(task.assigned_date)}
                        </div>
                      </td>
                      <td className="text-right">
                        {task.status !== "completed" && task.status !== "cancelled" && (
                          <button
                            onClick={() => handleMarkTaskDone(task.id)}
                            disabled={markingTaskDone === task.id}
                            className="text-slate-500 hover:text-cyan-600"
                            title="কাজটা শেষ হয়েছে বলে দিন"
                            aria-label="কাজটা শেষ হয়েছে বলে দিন"
                          >
                            {markingTaskDone === task.id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-500 border-t-transparent" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty">
                        <p>এখনো কোনো কাজ দেওয়া হয়নি।</p>
                        <div className="mt-4 flex justify-center">
                          <button
                            onClick={() => setShowAssignTaskModal(true)}
                            className="btn btn-primary btn-sm"
                          >
                            প্রথম কাজটা দিন
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Documents Section */}
      {activeSubTab === "documents" && (
        <>
          <div className="plane-section">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="section-title mb-0">কর্মচারীর কাগজপত্র</div>
              <button
                onClick={() => setShowUploadModal(true)}
                className="btn btn-primary btn-sm"
              >
                <Upload className="h-4 w-4" />
                কাগজ আপলোড করুন
              </button>
            </div>
          </div>

          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>কাগজের নাম</th>
                  <th>টাইপ</th>
                  <th className="cell-num">সাইজ</th>
                  <th>ফরম্যাট</th>
                  <th>আপলোডের তারিখ</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {documents.length > 0 ? (
                  documents.map((doc) => (
                    <tr key={doc.id}>
                      <td className="cell-strong">{doc.name}</td>
                      <td>
                        <span className="badge badge-info">
                          {getCategoryLabel(doc.category)}
                        </span>
                      </td>
                      <td className="cell-num whitespace-nowrap">{formatFileSize(doc.size)}</td>
                      <td>{doc.file_type.toUpperCase()}</td>
                      <td className="whitespace-nowrap">{formatDate(doc.upload_date)}</td>
                      <td className="text-right">
                        <div className="row-actions">
                          <a
                            href={doc.file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-500 hover:text-cyan-600"
                            title="ডাউনলোড করুন"
                            aria-label="ডাউনলোড করুন"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            disabled={deletingDocumentId === doc.id}
                            className="text-slate-500 hover:text-rose-600 disabled:opacity-50"
                            title="কাগজটা ডিলিট করুন"
                            aria-label="কাগজটা ডিলিট করুন"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty">
                        <p>এখনো কোনো কাগজপত্র আপলোড করা হয়নি।</p>
                        <div className="mt-4 flex justify-center">
                          <button
                            onClick={() => setShowUploadModal(true)}
                            className="btn btn-primary btn-sm"
                          >
                            <Upload className="h-4 w-4" />
                            প্রথম কাগজটা আপলোড করুন
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Assign Task Modal */}
      {showAssignTaskModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-head">
              <h2 className="modal-title">নতুন কাজ দিন</h2>
              <button
                type="button"
                onClick={() => setShowAssignTaskModal(false)}
                aria-label="বন্ধ করুন"
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="modal-body space-y-4">
              {/* Task Title */}
              <div>
                <label className="label">কাজের নাম *</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({ ...newTask, title: e.target.value })
                  }
                  className="input"
                  placeholder="কী কাজ, লিখুন"
                />
              </div>

              {/* Description */}
              <div>
                <label className="label">বিবরণ</label>
                <textarea
                  rows={3}
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({ ...newTask, description: e.target.value })
                  }
                  className="textarea resize-none"
                  placeholder="চাইলে কাজের বিস্তারিত লিখুন"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Priority */}
                <div>
                  <label className="label">গুরুত্ব *</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) =>
                      setNewTask({
                        ...newTask,
                        priority: e.target.value as "low" | "medium" | "high" | "urgent",
                      })
                    }
                    className="select"
                  >
                    <option value="low">কম</option>
                    <option value="medium">মাঝারি</option>
                    <option value="high">বেশি</option>
                    <option value="urgent">জরুরি</option>
                  </select>
                </div>

                {/* Due Date */}
                <div>
                  <label className="label">শেষ তারিখ *</label>
                  <input
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) =>
                      setNewTask({ ...newTask, due_date: e.target.value })
                    }
                    className="input"
                  />
                </div>
              </div>

              {/* Project */}
              <div>
                <label className="label">প্রজেক্ট</label>
                <input
                  type="text"
                  value={newTask.project}
                  onChange={(e) =>
                    setNewTask({ ...newTask, project: e.target.value })
                  }
                  className="input"
                  placeholder="চাইলে প্রজেক্টের নাম লিখুন"
                />
              </div>
            </div>

            <div className="modal-foot">
              <button
                type="button"
                onClick={() => setShowAssignTaskModal(false)}
                className="btn btn-ghost"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleAssignTask}
                disabled={isAssigningTask || !newTask.title || !newTask.due_date}
                className="btn btn-primary"
              >
                {isAssigningTask ? "দেওয়া হচ্ছে…" : "কাজ দিন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-head">
              <h2 className="modal-title">কাগজ আপলোড করুন</h2>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                aria-label="বন্ধ করুন"
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="modal-body space-y-4">
              {/* Document Name */}
              <div>
                <label className="label">কাগজের নাম *</label>
                <input
                  type="text"
                  value={newDocument.name}
                  onChange={(e) =>
                    setNewDocument({ ...newDocument, name: e.target.value })
                  }
                  className="input"
                  placeholder="কাগজের নাম লিখুন"
                />
              </div>

              {/* Category */}
              <div>
                <label className="label">টাইপ *</label>
                <select
                  value={newDocument.category}
                  onChange={(e) =>
                    setNewDocument({
                      ...newDocument,
                      category: e.target.value as Document["category"],
                    })
                  }
                  className="select"
                >
                  <option value="contract">চুক্তিপত্র</option>
                  <option value="id_document">পরিচয়পত্র</option>
                  <option value="certificate">সার্টিফিকেট</option>
                  <option value="performance">পারফরম্যান্স রিভিউ</option>
                  <option value="other">অন্যান্য</option>
                </select>
              </div>

              {/* File Upload */}
              <div>
                <label className="label">ফাইল বেছে নিন *</label>
                <input
                  type="file"
                  onChange={(e) =>
                    setNewDocument({
                      ...newDocument,
                      file: e.target.files?.[0] || null,
                    })
                  }
                  className="input file:mr-3 file:rounded file:border-0 file:px-2 file:py-1 file:text-sm file:font-medium"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <p className="mt-1 text-xs text-slate-500">
                  যেসব ফাইল চলবে: PDF, DOC, DOCX, JPG, PNG (সর্বোচ্চ 10MB)
                </p>
              </div>
            </div>

            <div className="modal-foot">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="btn btn-ghost"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleFileUpload}
                disabled={uploadingFile || !newDocument.file || !newDocument.name}
                className="btn btn-primary"
              >
                {uploadingFile ? "আপলোড হচ্ছে…" : "আপলোড করুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
