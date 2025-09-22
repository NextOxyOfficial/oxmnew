"use client";

import React, { useState, useEffect } from "react";
import { Trash2, X, Upload, Download, Clock, CheckCircle2, ClipboardList, FileText } from "lucide-react";
import { Task, Document, CreateTaskData } from "@/types/employee";

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
        return "bg-red-500/20 text-red-300 border-red-400/30";
      case "high":
        return "bg-orange-500/20 text-orange-300 border-orange-400/30";
      case "medium":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-400/30";
      case "low":
        return "bg-green-500/20 text-green-300 border-green-400/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-400/30";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-300 border-green-400/30";
      case "in_progress":
        return "bg-blue-500/20 text-blue-300 border-blue-400/30";
      case "pending":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-400/30";
      case "cancelled":
        return "bg-red-500/20 text-red-300 border-red-400/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-400/30";
    }
  };

  const handleAssignTask = async () => {
    if (!newTask.title || !newTask.due_date) return;
    
    setIsAssigningTask(true);
    try {
      // API call would go here
      console.log("Assigning task:", newTask);
      // const createdTask = await employeeAPI.assignTask(employeeId, newTask);
      // onTasksUpdate([...tasks, createdTask]);
      
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
    } finally {
      setIsAssigningTask(false);
    }
  };

  const handleMarkTaskDone = async (taskId: number) => {
    setMarkingTaskDone(taskId);
    try {
      // API call would go here
      console.log("Marking task as done:", taskId);
      // await employeeAPI.updateTaskStatus(taskId, "completed");
      // onTasksUpdate(tasks.map(t => t.id === taskId ? {...t, status: "completed"} : t));
    } catch (error) {
      console.error("Error updating task:", error);
    } finally {
      setMarkingTaskDone(null);
    }
  };

  const handleFileUpload = async () => {
    if (!newDocument.file || !newDocument.name) return;
    
    setUploadingFile(true);
    try {
      // API call would go here
      console.log("Uploading document:", newDocument);
      // const uploadedDoc = await employeeAPI.uploadDocument(employeeId, newDocument);
      // onDocumentsUpdate([...documents, uploadedDoc]);
      
      setShowUploadModal(false);
      setNewDocument({
        name: "",
        category: "other",
        file: null,
      });
    } catch (error) {
      console.error("Error uploading document:", error);
    } finally {
      setUploadingFile(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Sub-tabs for Tasks and Documents */}
        <div className="flex border-b border-slate-700/50 mb-6">
          <button
            onClick={() => setActiveSubTab("tasks")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 flex items-center gap-2 cursor-pointer ${
              activeSubTab === "tasks"
                ? "border-cyan-400 text-cyan-400"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600"
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Tasks
          </button>
          <button
            onClick={() => setActiveSubTab("documents")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 flex items-center gap-2 cursor-pointer ${
              activeSubTab === "documents"
                ? "border-cyan-400 text-cyan-400"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600"
            }`}
          >
            <FileText className="w-4 h-4" />
            Documents
          </button>
        </div>

        {/* Tasks Section */}
        {activeSubTab === "tasks" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-medium text-slate-100">
                Assigned Tasks
              </h4>
              <button
                onClick={() => setShowAssignTaskModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200 shadow-lg cursor-pointer"
              >
                Assign New Task
              </button>
            </div>

            <div className="max-w-6xl">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden">
                {tasks.length > 0 ? (
                  <div className="divide-y divide-white/5">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className="px-6 py-4 hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h5 className="text-sm font-medium text-slate-100">
                                {task.title}
                              </h5>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}
                              >
                                {task.priority}
                              </span>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}
                              >
                                {task.status}
                              </span>
                            </div>
                            
                            {task.description && (
                              <p className="text-sm text-slate-400 mb-2">
                                {task.description}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-4 text-xs text-slate-400">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>Due: {formatDate(task.due_date)}</span>
                              </div>
                              <span>Assigned: {formatDate(task.assigned_date)}</span>
                              <span>By: {task.assigned_by}</span>
                              {task.project && <span>Project: {task.project}</span>}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {task.status !== "completed" && task.status !== "cancelled" && (
                              <button
                                onClick={() => handleMarkTaskDone(task.id)}
                                disabled={markingTaskDone === task.id}
                                className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                title="Mark as completed"
                              >
                                {markingTaskDone === task.id ? (
                                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-green-400 border-t-transparent" />
                                ) : (
                                  <CheckCircle2 className="w-4 h-4" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-slate-400">No tasks assigned yet.</p>
                    <button
                      onClick={() => setShowAssignTaskModal(true)}
                      className="mt-4 px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all duration-200 cursor-pointer"
                    >
                      Assign First Task
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Documents Section */}
        {activeSubTab === "documents" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-medium text-slate-100">
                Employee Documents
              </h4>
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-200 shadow-lg cursor-pointer"
              >
                Upload Document
              </button>
            </div>

            <div className="max-w-6xl">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden">
                {documents.length > 0 ? (
                  <div className="divide-y divide-white/5">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="px-6 py-4 hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h5 className="text-sm font-medium text-slate-100">
                                {doc.name}
                              </h5>
                              <span
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-400/30"
                              >
                                {doc.category}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-slate-400">
                              <span>{formatFileSize(doc.size)}</span>
                              <span>{doc.file_type.toUpperCase()}</span>
                              <span>Uploaded: {formatDate(doc.upload_date)}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <a
                              href={doc.file}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Download document"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                            <button
                              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Delete document"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-slate-400">No documents uploaded yet.</p>
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="mt-4 px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all duration-200 cursor-pointer"
                    >
                      Upload First Document
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Assign Task Modal */}
      {showAssignTaskModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700/50 rounded-xl shadow-xl max-w-lg w-full my-8">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                <h2 className="text-xl font-semibold text-slate-100">
                  Assign New Task
                </h2>
                <button
                  onClick={() => setShowAssignTaskModal(false)}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                {/* Task Title */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) =>
                      setNewTask({ ...newTask, title: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
                    placeholder="Enter task title"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={newTask.description}
                    onChange={(e) =>
                      setNewTask({ ...newTask, description: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm resize-none"
                    placeholder="Enter task description (optional)"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Priority */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Priority *
                    </label>
                    <select
                      value={newTask.priority}
                      onChange={(e) =>
                        setNewTask({
                          ...newTask,
                          priority: e.target.value as "low" | "medium" | "high" | "urgent",
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 text-sm cursor-pointer"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  {/* Due Date */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Due Date *
                    </label>
                    <input
                      type="date"
                      value={newTask.due_date}
                      onChange={(e) =>
                        setNewTask({ ...newTask, due_date: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 text-sm cursor-pointer"
                    />
                  </div>
                </div>

                {/* Project */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Project
                  </label>
                  <input
                    type="text"
                    value={newTask.project}
                    onChange={(e) =>
                      setNewTask({ ...newTask, project: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
                    placeholder="Enter project name (optional)"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-3 p-6 border-t border-slate-700/50">
                <button
                  onClick={() => setShowAssignTaskModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignTask}
                  disabled={isAssigningTask || !newTask.title || !newTask.due_date}
                  className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 transition-all duration-200 shadow-lg cursor-pointer"
                >
                  {isAssigningTask ? "Assigning..." : "Assign Task"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto">
          <div className="min-h-full flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700/50 rounded-xl shadow-xl max-w-md w-full my-8">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                <h2 className="text-xl font-semibold text-slate-100">
                  Upload Document
                </h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">
                {/* Document Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Document Name *
                  </label>
                  <input
                    type="text"
                    value={newDocument.name}
                    onChange={(e) =>
                      setNewDocument({ ...newDocument, name: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 placeholder-slate-400 text-sm"
                    placeholder="Enter document name"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Category *
                  </label>
                  <select
                    value={newDocument.category}
                    onChange={(e) =>
                      setNewDocument({
                        ...newDocument,
                        category: e.target.value as Document["category"],
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 text-sm cursor-pointer"
                  >
                    <option value="contract">Contract</option>
                    <option value="id_document">ID Document</option>
                    <option value="certificate">Certificate</option>
                    <option value="performance">Performance Review</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Choose File *
                  </label>
                  <input
                    type="file"
                    onChange={(e) =>
                      setNewDocument({
                        ...newDocument,
                        file: e.target.files?.[0] || null,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-slate-100 text-sm file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:font-medium file:bg-cyan-500/20 file:text-cyan-400 hover:file:bg-cyan-500/30"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Accepted formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB)
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end space-x-3 p-6 border-t border-slate-700/50">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFileUpload}
                  disabled={uploadingFile || !newDocument.file || !newDocument.name}
                  className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 transition-all duration-200 shadow-lg cursor-pointer"
                >
                  {uploadingFile ? "Uploading..." : "Upload Document"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
