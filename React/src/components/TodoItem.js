import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { checkUserExists, createTodoInvitation, getSharedUsers, revokeAccess, updatePermission } from '../supabase';

function TodoItem({ todo, onToggle, onDelete, onEdit, currentUserEmail }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareError, setShareError] = useState('');
  const [sharePermission, setSharePermission] = useState('view');
  const [showTooltip, setShowTooltip] = useState(false);
  const [editedText, setEditedText] = useState(todo.title);
  const [editedDescription, setEditedDescription] = useState(todo.description || '');
  const [editedCategory, setEditedCategory] = useState(todo.category || 'personal');
  const [editedDueDate, setEditedDueDate] = useState(todo.due_date || '');
  const [editedPriority, setEditedPriority] = useState(todo.priority || 'medium');
  const [isLoading, setIsLoading] = useState(false);
  const [showSharedUsers, setShowSharedUsers] = useState(false);
  const [sharedUsers, setSharedUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [updatingPermission, setUpdatingPermission] = useState(null);
  const [selectedStep, setSelectedStep] = useState(null);

  // Check if the current user can edit the todo
  const canEdit = todo.original_owner === currentUserEmail || 
                 (todo.isShared && todo.permission === 'edit');

  // Check if the current user can delete the todo
  // Users can always delete todos for themselves, but only owners can delete for everyone
  const canDelete = todo.isShared || todo.original_owner === currentUserEmail;

  // Get color based on difficulty
  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'text-green-200';
      case 'medium':
        return 'text-yellow-200';
      case 'hard':
        return 'text-red-200';
      default:
        return 'text-white/60';
    }
  };

  // Fetch shared users when component mounts and when showSharedUsers changes
  useEffect(() => {
    const fetchSharedUsers = async () => {
      if (!showSharedUsers || todo.original_owner !== currentUserEmail) return;
      
      setIsLoadingUsers(true);
      try {
        const users = await getSharedUsers(todo.id);
        setSharedUsers(users);
      } catch (error) {
        console.error('Error fetching shared users:', error);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchSharedUsers();
  }, [showSharedUsers, todo.id, currentUserEmail, todo.original_owner]);

  const handleShare = async (e) => {
    e.preventDefault();
    setShareError('');
    setIsLoading(true);

    try {
      if (!shareEmail.trim()) {
        setShareError('Please enter an email address');
        return;
      }

      // Check if user exists
      const exists = await checkUserExists(shareEmail);
      if (!exists) {
        setShareError('That email address is invalid.');
        return;
      }

      // Create invitation with permissions
      await createTodoInvitation(todo.id, currentUserEmail, shareEmail, sharePermission);
      setShareEmail('');
      setIsSharing(false);
    } catch (error) {
      console.error('Error sharing todo:', error);
      setShareError('Error sharing todo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (e) => {
    e.preventDefault();
    if (editedText.trim().length === 0) return;
    
    onEdit(todo.id, {
      title: editedText,
      description: editedDescription,
      category: editedCategory,
      due_date: editedDueDate,
      priority: editedPriority
    });
    
    setIsEditing(false);
  };

  const handlePermissionChange = async (userId, email, newPermission) => {
    try {
      setUpdatingPermission(userId);
      await updatePermission(todo.id, email, newPermission);
      setSharedUsers(users =>
        users.map(u =>
          u.id === userId 
            ? { ...u, permission: newPermission }
            : u
        )
      );
    } catch (error) {
      console.error('Error updating permission:', error);
      // Show error message to user
      alert('Failed to update permission. Please try again.');
    } finally {
      setUpdatingPermission(null);
    }
  };

  const handleRevokeAccess = async (userId, email) => {
    try {
      await revokeAccess(todo.id, email);
      setSharedUsers(users => users.filter(u => u.id !== userId));
    } catch (error) {
      console.error('Error revoking access:', error);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: '#DC2626',
      medium: '#F59E0B',
      low: '#10B981',
    };
    return colors[priority] || '#6B7280';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // If editing, show expanded form
  if (isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-white via-white to-blue-50/30 rounded-xl p-6 mb-4 shadow-lg border border-white/50"
      >
        <form onSubmit={handleEdit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
            <input
              type="text"
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Task title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Add a description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select 
                value={editedCategory}
                onChange={(e) => setEditedCategory(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="personal">Personal</option>
                <option value="work">Work</option>
                <option value="shopping">Shopping</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={editedPriority}
                onChange={(e) => setEditedPriority(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input
              type="date"
              value={editedDueDate}
              onChange={(e) => setEditedDueDate(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* AI Content Section */}
          {todo.aiContent && (
            <div className="space-y-4 bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900">AI Assistant Insights</h4>
              
              {/* Summary */}
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-700">Summary</h5>
                <p className="text-sm text-gray-600">{todo.aiContent.summary}</p>
              </div>

              {/* Task Info */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-gray-600">{todo.aiContent.estimatedTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-sm font-medium" style={{ color: getPriorityColor(todo.aiContent.difficulty) }}>
                    {todo.aiContent.difficulty}
                  </span>
                </div>
              </div>

              {/* Steps */}
              {todo.aiContent.steps && (
                <div className="space-y-3">
                  <h5 className="text-sm font-medium text-gray-700">Steps</h5>
                  <div className="space-y-2">
                    {todo.aiContent.steps.map((step, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-white rounded-lg shadow-sm"
                        onClick={() => setSelectedStep(index)}
                      >
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{step.step}</p>
                          {step.details && (
                            <p className="mt-1 text-sm text-gray-500">{step.details}</p>
                          )}
                          {step.resources && step.resources.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {step.resources.map((resource, rIndex) => (
                                <a
                                  key={rIndex}
                                  href={resource.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                  {resource.title}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Tasks */}
              {todo.aiContent.relatedTasks && todo.aiContent.relatedTasks.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-gray-700">Related Tasks</h5>
                  <ul className="list-disc list-inside space-y-1">
                    {todo.aiContent.relatedTasks.map((task, index) => (
                      <li key={index} className="text-sm text-gray-600">{task}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Show Shared Users section (only visible to original owner) */}
          {todo.original_owner === currentUserEmail && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowSharedUsers(!showSharedUsers)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                <svg
                  className={`w-5 h-5 transition-transform ${showSharedUsers ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
                Show Shared Users ({sharedUsers.length})
              </button>

              <AnimatePresence>
                {showSharedUsers && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    {isLoadingUsers ? (
                      <div className="text-center py-4">Loading shared users...</div>
                    ) : (
                      <div className="space-y-2">
                        {sharedUsers.map(user => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-900">{user.email}</span>
                              <span className="text-xs text-gray-500">({user.permission})</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <select
                                value={user.permission}
                                onChange={(e) => handlePermissionChange(user.id, user.email, e.target.value)}
                                disabled={updatingPermission === user.id}
                                className={`text-sm border border-gray-200 rounded px-2 py-1 ${
                                  updatingPermission === user.id ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                              >
                                <option value="view">View</option>
                                <option value="edit">Edit</option>
                              </select>
                              <button
                                type="button"
                                onClick={() => handleRevokeAccess(user.id, user.email)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </motion.div>
    );
  }

  // Regular todo item view
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-gradient-to-br from-white/95 via-white/90 to-blue-50/80 backdrop-blur-md rounded-2xl p-6 mb-4 group hover:bg-gradient-to-br hover:from-white/95 hover:via-white/95 hover:to-blue-100/80 transition-all duration-300 shadow-lg hover:shadow-xl border border-white/20 hover:border-white/40"
      onClick={() => {
        if (canEdit) {
          setIsEditing(true);
        }
      }}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle(todo.id);
          }}
          disabled={todo.isShared && todo.permission === 'view'}
          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 transition-all duration-300 ${
            todo.completed
              ? 'bg-gradient-to-br from-blue-400 to-blue-600 border-blue-400 scale-105'
              : 'border-gray-300 hover:border-blue-400 hover:scale-105'
          } ${todo.isShared && todo.permission === 'view' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {todo.completed && (
            <svg className="w-full h-full text-white p-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-2">
            <h3 className={`text-lg font-medium ${todo.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
              {todo.title}
            </h3>
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100/80 text-gray-600 backdrop-blur-sm">
              {todo.category}
            </span>
            {todo.priority && (
              <span 
                className="px-3 py-1 text-xs font-medium rounded-full backdrop-blur-sm" 
                style={{ 
                  backgroundColor: `${getPriorityColor(todo.priority)}15`,
                  color: getPriorityColor(todo.priority)
                }}
              >
                {todo.priority}
              </span>
            )}
          </div>
          
          {todo.description && (
            <p className={`text-sm mb-3 ${todo.completed ? 'text-gray-400' : 'text-gray-600'}`}>
              {todo.description}
            </p>
          )}

          <div className="flex items-center flex-wrap gap-4 text-sm text-gray-500">
            {/* Due Date */}
            {todo.due_date && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50/50 backdrop-blur-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{formatDate(todo.due_date)}</span>
              </div>
            )}

            {/* Category Icon */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50/50 backdrop-blur-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span className="capitalize">{todo.category}</span>
            </div>

            {/* Steps if available */}
            {todo.aiContent?.steps && (
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {todo.aiContent.steps.map((step, index) => (
                    <div
                      key={index}
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-all duration-300 ${
                        selectedStep === index
                          ? 'bg-gradient-to-br from-blue-400 to-blue-600 border-blue-400 text-white scale-110 z-10'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:scale-105'
                      }`}
                    >
                      {index + 1}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-95 group-hover:scale-100">
          {/* Share Button */}
          {todo.original_owner === currentUserEmail && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsSharing(true);
              }}
              className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50/50 rounded-xl transition-all duration-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          )}

          {/* Edit Button */}
          {canEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50/50 rounded-xl transition-all duration-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}

          {/* Delete Button */}
          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(todo.id, todo.isShared, todo.sharedId);
              }}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50/50 rounded-xl transition-all duration-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* AI Content Preview */}
      {todo.aiContent && (
        <div className="mt-4 pt-4 border-t border-gray-200/50">
          <div className="flex items-center flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50/50 backdrop-blur-sm">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-gray-600">{todo.aiContent.estimatedTime}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50/50 backdrop-blur-sm">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="font-medium" style={{ color: getPriorityColor(todo.aiContent.difficulty) }}>
                {todo.aiContent.difficulty}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      <AnimatePresence>
        {isSharing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setIsSharing(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-medium text-gray-900 mb-4">Share Todo</h3>
              <form onSubmit={handleShare} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="Enter email address"
                  />
                  {shareError && (
                    <p className="mt-1 text-sm text-red-500">{shareError}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Permission
                  </label>
                  <select
                    value={sharePermission}
                    onChange={(e) => setSharePermission(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="view">View Only</option>
                    <option value="edit">Can Edit</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSharing(false)}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Sharing...' : 'Share'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default TodoItem;
