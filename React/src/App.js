/**
 * Main App Component
 * Handles the core application logic including:
 * - User authentication
 * - Todo management (CRUD operations)
 * - Filtering and sorting
 * - Sharing functionality
 * - UI state management
 */

import React, { useState, useEffect } from 'react';
import TodoForm from './components/TodoForm';
import TodoList from './components/TodoList';
import TubelightNavbar from './components/TubelightNavbar';
import LoginPage from './components/LoginPage';
import { supabase, signInWithGoogle, signInWithMicrosoft, logOut } from "./supabase";
import { AnimatePresence } from 'framer-motion';
import InvitationsModal from './components/InvitationsModal';
import { getPendingInvitations, moveToRecentlyDeleted, handleInvitationResponse, getSharedUsers } from './supabase';
import RecentlyDeleted from './components/RecentlyDeleted';
import TabFilter from './components/TabFilter';
import { motion } from 'framer-motion';

function App() {
  // State management for todos and UI
  const [todos, setTodos] = useState([]); // List of all todos (owned + shared)
  const [activeTab, setActiveTab] = useState('all'); // Current filter tab (all/pending/completed)
  const [sortBy, setSortBy] = useState('date'); // Current sort method (date/priority)
  const [user, setUser] = useState(null); // Current authenticated user
  const [showForm, setShowForm] = useState(false); // Toggle for new todo form
  const [filterCategory, setFilterCategory] = useState('all'); // Current category filter
  const [invitations, setInvitations] = useState([]); // List of pending todo invitations
  const [showInvitations, setShowInvitations] = useState(false); // Toggle for invitations modal
  const [showRecentlyDeleted, setShowRecentlyDeleted] = useState(false);
  const [selectedStep, setSelectedStep] = useState(null);

  /**
   * Authentication State Observer
   * Updates the user state whenever the authentication state changes
   */
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Todo Fetching Effect
   * Fetches both owned and shared todos when the user logs in
   */
  useEffect(() => {
    if (!user) return;

    const fetchTodos = async () => {
      try {
        console.log('Fetching todos for user:', user.email);
        
        // Fetch todos owned by the current user
        const { data: ownedTodos, error: ownedError } = await supabase
          .from('todos')
          .select('*')
          .eq('user_id', user.id);

        if (ownedError) {
          console.error('Error fetching owned todos:', ownedError);
          throw ownedError;
        }

        console.log('Owned todos:', ownedTodos);

        // Fetch todos shared with the current user
        const { data: sharedTodos, error: sharedError } = await supabase
          .from('shared_todos')
          .select(`
            *,
            todos (*)
          `)
          .eq('recipient_email', user.email);

        if (sharedError) {
          console.error('Error fetching shared todos:', sharedError);
          throw sharedError;
        }

        console.log('Shared todos:', sharedTodos);

        // Transform the data
        const transformedOwnedTodos = ownedTodos.map(todo => ({
          id: todo.id,
          title: todo.title,
          description: todo.description,
          completed: todo.completed,
          category: todo.category,
          due_date: todo.due_date,
          priority: todo.priority,
          user_id: todo.user_id,
          owner: todo.owner,
          original_owner: todo.original_owner,
          created_at: todo.created_at,
          updated_at: todo.updated_at,
          aiContent: todo.ai_content ? JSON.parse(todo.ai_content) : null,
          isOwner: true
        }));

        const transformedSharedTodos = sharedTodos.map(share => ({
          id: share.todos.id,
          title: share.todos.title,
          description: share.todos.description,
          completed: share.todos.completed,
          category: share.todos.category,
          due_date: share.todos.due_date,
          priority: share.todos.priority,
          user_id: share.todos.user_id,
          owner: share.owner_email,
          original_owner: share.original_owner,
          created_at: share.todos.created_at,
          updated_at: share.todos.updated_at,
          aiContent: share.todos.ai_content ? JSON.parse(share.todos.ai_content) : null,
          isShared: true,
          sharedId: share.id,
          ownerEmail: share.owner_email,
          permission: share.permission
        }));

        const allTodos = [...transformedOwnedTodos, ...transformedSharedTodos];
        console.log('Setting todos:', allTodos);
        setTodos(allTodos);
      } catch (error) {
        console.error("Error fetching todos:", error);
      }
    };

    fetchTodos();

    // Subscribe to real-time changes
    const todosSubscription = supabase
      .channel('todos')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'todos' },
        (payload) => {
          console.log('Todos change received:', payload);
          if (payload.new.user_id === user.id || payload.new.original_owner === user.email) {
            fetchTodos();
          }
        }
      )
      .subscribe();

    const sharedTodosSubscription = supabase
      .channel('shared_todos')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'shared_todos' },
        (payload) => {
          console.log('Shared todos change received:', payload);
          if (payload.new.recipient_email === user.email || payload.new.owner_email === user.email) {
            fetchTodos();
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up subscriptions');
      todosSubscription.unsubscribe();
      sharedTodosSubscription.unsubscribe();
    };
  }, [user]);

  /**
   * Invitations Fetching Effect
   */
  useEffect(() => {
    if (!user?.email) return;

    const fetchInvitations = async () => {
      const pendingInvitations = await getPendingInvitations(user.email);
      setInvitations(pendingInvitations);
      if (pendingInvitations.length > 0) {
        setShowInvitations(true);
      }
    };

    fetchInvitations();
  }, [user]);

  /**
   * Add a new todo
   */
  const addTodo = async (todoData) => {
    if (!user || todoData.text.trim().length === 0) return;

    try {
      console.log('Adding new todo:', todoData);
      
      const newTodo = {
        title: todoData.text.trim(),
        description: todoData.description ? todoData.description.trim() : '',
        completed: false,
        category: todoData.category || 'personal',
        due_date: todoData.dueDate ? new Date(todoData.dueDate).toISOString() : null,
        priority: todoData.priority || 'medium',
        user_id: user.id,
        owner: user.email,
        original_owner: user.email,
        ai_content: todoData.aiContent ? JSON.stringify(todoData.aiContent) : null
      };

      const { data, error } = await supabase
        .from('todos')
        .insert([newTodo])
        .select('*')
        .single();

      if (error) {
        console.error('Error adding todo:', error);
        throw error;
      }
      
      console.log('Todo added successfully:', data);
      
      // Transform the data to match the frontend format
      const transformedTodo = {
        ...data,
        aiContent: data.ai_content ? JSON.parse(data.ai_content) : null,
        isOwner: true
      };
      
      setTodos(prevTodos => [transformedTodo, ...prevTodos]);
      setShowForm(false);
    } catch (error) {
      console.error("Error adding todo:", error);
      alert('Failed to add todo. Please try again.');
    }
  };

  /**
   * Toggle todo completion status
   */
  const toggleTodo = async (id) => {
    const todo = todos.find(todo => todo.id === id);
    if (!todo) return;

    // Prevent toggling shared todos with view-only permission
    if (todo.isShared && todo.permission === 'view') return;

    try {
      const updatedTodo = { ...todo, completed: !todo.completed };
      
      if (todo.isShared) {
        // Update shared todo
        const { error } = await supabase
          .from('shared_todos')
          .update({ 
            'todo_data.completed': updatedTodo.completed,
            'todo_data.updated_at': new Date().toISOString()
          })
          .eq('id', todo.sharedId);

        if (error) throw error;
      } else {
        // Update original todo
        const { error } = await supabase
          .from('todos')
          .update({ 
            completed: updatedTodo.completed,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);

        if (error) throw error;
      }

      setTodos(todos.map(t => (t.id === id ? updatedTodo : t)));
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  /**
   * Delete a todo
   */
  const deleteTodo = async (id, isShared, sharedId) => {
    if (!id || !user?.id) return;

    try {
      const todo = todos.find(t => t.id === id);
      if (!todo) return;

      if (isShared) {
        if (todo.original_owner === user.email) {
          // Original owner deleting - remove for everyone
          // First move to recently deleted for all users
          const sharedUsers = await getSharedUsers(id);
          
          // Move to recently deleted for original owner
          await moveToRecentlyDeleted(id, {
            ...todo,
            user_id: user.id,
            is_shared: true,
            shared_todo_id: id,
            deleted_at: new Date().toISOString(),
            deleted_by: user.email,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          });

          // Move to recently deleted for all shared users
          for (const sharedUser of sharedUsers) {
            const { data: userData } = await supabase
              .from('user_profiles')
              .select('id')
              .eq('email', sharedUser.email)
              .single();

            if (userData) {
              await moveToRecentlyDeleted(id, {
                ...todo,
                user_id: userData.id,
                is_shared: true,
                shared_id: sharedUser.id,
                shared_todo_id: id,
                deleted_at: new Date().toISOString(),
                deleted_by: user.email,
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
              });
            }
          }

          // Delete the original todo
          const { error: deleteError } = await supabase
            .from('todos')
            .delete()
            .eq('id', id);

          if (deleteError) throw deleteError;

          // This will cascade delete all shared_todos entries
          setTodos(todos.filter(t => t.id !== id));
        } else {
          // Shared user removing their access
          // Move to recently deleted just for this user
          await moveToRecentlyDeleted(id, {
            ...todo,
            user_id: user.id,
            is_shared: true,
            shared_id: sharedId,
            shared_todo_id: id,
            deleted_at: new Date().toISOString(),
            deleted_by: user.email,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          });

          // Remove their shared access
          const { error } = await supabase
            .from('shared_todos')
            .delete()
            .eq('id', sharedId);

          if (error) throw error;
          setTodos(todos.filter(t => t.sharedId !== sharedId));
        }
      } else {
        // Regular todo deletion
        await moveToRecentlyDeleted(id, {
          ...todo,
          user_id: user.id,
          deleted_at: new Date().toISOString(),
          deleted_by: user.email,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });

        const { error: deleteError } = await supabase
          .from('todos')
          .delete()
          .eq('id', id);

        if (deleteError) throw deleteError;

        setTodos(todos.filter(t => t.id !== id));
      }
    } catch (error) {
      console.error("Error deleting todo:", error);
    }
  };

  /**
   * Edit a todo
   */
  const editTodo = async (id, updatedTodo) => {
    const todo = todos.find(todo => todo.id === id);
    if (!todo) return;

    // Prevent editing shared todos with view-only permission
    if (todo.isShared && todo.permission === 'view') {
      console.log('Cannot edit: User has view-only permission');
      return;
    }

    try {
      // Always update the original todo in the todos table
      const { error: updateError } = await supabase
        .from('todos')
        .update({
          ...updatedTodo,
          updated_at: new Date().toISOString(),
          last_edited_by: user.email // Track who made the last edit
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Update local state
      setTodos(todos.map(t => 
        t.id === id 
          ? { 
              ...t, 
              ...updatedTodo, 
              updated_at: new Date().toISOString(),
              last_edited_by: user.email 
            } 
          : t
      ));
    } catch (error) {
      console.error("Error editing todo:", error);
    }
  };

  /**
   * Filter todos based on completion status and category
   */
  const filteredTodos = todos.filter(todo => {
    // Filter by completion status
    const statusFilter = 
      activeTab === 'completed' ? todo.completed :
      activeTab === 'pending' ? !todo.completed :
      true;

    // Filter by category
    const categoryFilter = 
      filterCategory === 'all' ? true :
      todo.category === filterCategory;

    return statusFilter && categoryFilter;
  });

  /**
   * Sort todos based on selected criteria
   */
  const sortedTodos = [...filteredTodos].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.created_at) - new Date(a.created_at);
    } else if (sortBy === 'priority') {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    return 0;
  });

  /**
   * Handle invitation response
   */
  const handleInvitation = async (invitationId, todoId, accept) => {
    try {
      const success = await handleInvitationResponse(user.email, invitationId, todoId, accept);
      if (success) {
        // Remove the invitation from the list
        setInvitations(invitations.filter(inv => inv.id !== invitationId));
        
        if (accept) {
          // Fetch the complete todo data
          const { data: todoData, error: todoError } = await supabase
            .from('todos')
            .select('*')
            .eq('id', todoId)
            .single();

          if (todoError) throw todoError;

          // Fetch the shared todo entry
          const { data: sharedData, error: sharedError } = await supabase
            .from('shared_todos')
            .select('*')
            .eq('todo_id', todoId)
            .eq('recipient_email', user.email)
            .single();

          if (sharedError) throw sharedError;

          // Add the shared todo to the list
          const sharedTodo = {
            ...todoData,
            id: todoData.id,
            isShared: true,
            sharedId: sharedData.id,
            ownerEmail: sharedData.owner_email,
            originalOwner: sharedData.original_owner,
            permission: sharedData.permission
          };

          setTodos(prevTodos => [sharedTodo, ...prevTodos]);
        }
      }
    } catch (error) {
      console.error('Error handling invitation:', error);
    }
  };

  const handleRestoredTodo = (restoredTodo) => {
    setTodos(prevTodos => [restoredTodo, ...prevTodos]);
  };

  const handleAddTodo = (todo) => {
    addTodo({
      text: todo.text,
      description: todo.description,
      category: todo.category,
      dueDate: todo.dueDate,
      priority: todo.priority,
      aiContent: todo.aiContent
    });
  };

  // Render the application
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_center,#6495ED,#95b3ed)]">
      {user ? (
        <>
          <div className="bg-white/5 backdrop-blur-lg">
            <div className="container mx-auto px-4 py-8">
              <div className="flex flex-col items-center justify-center gap-6">
                {/* Logo and Title in a white rounded square */}
                <div className="bg-white rounded-2xl p-4 shadow-lg flex items-center gap-3">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  <span className="text-xl font-semibold text-blue-600">BlueTask</span>
                </div>

                {/* Centered Filter Tabs */}
                <div className="w-full max-w-md">
                  <TabFilter
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    filterCategory={filterCategory}
                    setFilterCategory={setFilterCategory}
                  />
                </div>

                {/* Action Buttons - Positioned Absolutely */}
                <div className="absolute right-8 top-8 flex items-center gap-4">
                  <button
                    onClick={() => setShowRecentlyDeleted(true)}
                    className="text-white/80 hover:text-white transition-colors"
                    title="Recently Deleted"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <button
                    onClick={logOut}
                    className="text-white/80 hover:text-white transition-colors"
                    title="Sign Out"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-4 py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl mx-auto"
            >
              <AnimatePresence mode="wait">
                {showForm ? (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <TodoForm onSubmit={handleAddTodo} onClose={() => setShowForm(false)} />
                  </motion.div>
                ) : (
                  <motion.button
                    key="add-button"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => setShowForm(true)}
                    className="w-full py-3 px-4 bg-white/10 backdrop-blur-lg text-white rounded-xl font-medium hover:bg-white/20 transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Add New Task
                  </motion.button>
                )}
              </AnimatePresence>

              <div className="mt-8">
                <TodoList
                  todos={sortedTodos}
                  onToggle={toggleTodo}
                  onDelete={deleteTodo}
                  onEdit={editTodo}
                  currentUserEmail={user?.email}
                  selectedStep={selectedStep}
                  setSelectedStep={setSelectedStep}
                />
              </div>
            </motion.div>

            <InvitationsModal
              isOpen={showInvitations}
              onClose={() => setShowInvitations(false)}
              invitations={invitations}
              onRespond={handleInvitation}
              userEmail={user.email}
              onInvitationHandled={() => {
                const fetchInvitations = async () => {
                  const pendingInvitations = await getPendingInvitations(user.email);
                  setInvitations(pendingInvitations);
                };
                fetchInvitations();
              }}
            />

            <RecentlyDeleted
              isOpen={showRecentlyDeleted}
              onClose={() => setShowRecentlyDeleted(false)}
              onRestore={handleRestoredTodo}
            />
          </div>
        </>
      ) : (
        <LoginPage onGoogleSignIn={signInWithGoogle} onMicrosoftSignIn={signInWithMicrosoft} />
      )}
    </div>
  );
}

export default App;
