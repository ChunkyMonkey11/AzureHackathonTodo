import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRecentlyDeletedTodos, restoreTodo, permanentlyDeleteTodo } from '../supabase';
import { supabase } from '../supabase';

const RecentlyDeleted = ({ isOpen, onClose, onRestore }) => {
  const [deletedTodos, setDeletedTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchDeletedTodos();
    }
  }, [isOpen]);

  const fetchDeletedTodos = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user');
      }
      setCurrentUser(user);

      console.log('Fetching deleted todos for user:', user.id);
      const todos = await getRecentlyDeletedTodos(user.id);
      console.log('Fetched deleted todos:', todos);
      setDeletedTodos(todos);
    } catch (err) {
      console.error('Error fetching deleted todos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (todoId) => {
    try {
      const restoredTodo = await restoreTodo(todoId);
      if (restoredTodo) {
        setDeletedTodos(deletedTodos.filter(todo => todo.id !== todoId));
        onRestore && onRestore({
          ...restoredTodo,
          isOwner: true
        });
      }
    } catch (err) {
      console.error('Error restoring todo:', err);
      alert('Failed to restore todo. Please try again.');
    }
  };

  const handlePermanentDelete = async (todoId) => {
    if (window.confirm('Are you sure you want to permanently delete this todo? This action cannot be undone.')) {
      try {
        const success = await permanentlyDeleteTodo(todoId);
        if (success) {
          setDeletedTodos(deletedTodos.filter(todo => todo.id !== todoId));
        }
      } catch (err) {
        console.error('Error permanently deleting todo:', err);
        alert('Failed to permanently delete todo. Please try again.');
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">Recently Deleted</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : error ? (
              <div className="text-center text-red-500 py-8">
                {error}
              </div>
            ) : deletedTodos.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No recently deleted todos
              </div>
            ) : (
              <div className="space-y-4">
                {deletedTodos.map(todo => (
                  <motion.div
                    key={todo.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-gray-50 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{todo.title}</h3>
                        {todo.description && (
                          <p className="text-sm text-gray-600 mt-1">{todo.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-gray-500">
                          <span>Deleted {formatDate(todo.deleted_at)}</span>
                          <span>•</span>
                          <span>Expires {formatDate(todo.expires_at)}</span>
                          {todo.is_shared && (
                            <>
                              <span>•</span>
                              <span>Shared {todo.deleted_by === todo.owner ? 'by you' : `by ${todo.owner}`}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleRestore(todo.id)}
                          className="text-green-600 hover:text-green-700"
                          title="Restore todo"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                          </svg>
                        </button>
                        {currentUser && todo.original_owner === currentUser.email && (
                          <button
                            onClick={() => handlePermanentDelete(todo.id)}
                            className="text-red-600 hover:text-red-700"
                            title="Permanently delete"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RecentlyDeleted; 