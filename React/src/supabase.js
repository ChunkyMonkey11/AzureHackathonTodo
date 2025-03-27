/**
 * Supabase Configuration and Utility Functions
 * 
 * This file contains all Supabase-related functionality including:
 * 1. Authentication
 *    - Google OAuth integration
 *    - Session management
 *    - User profile management
 * 
 * 2. Todo Management
 *    - CRUD operations
 *    - Recently deleted functionality
 *    - AI content integration
 * 
 * 3. Sharing System
 *    - Todo sharing
 *    - Permission management
 *    - Invitation handling
 * 
 * 4. Database Operations
 *    - User profiles
 *    - Todos
 *    - Shared todos
 *    - Recently deleted items
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Debug logs
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseAnonKey ? 'Present' : 'Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client instance
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Export the client for direct use
export const supabase = supabaseClient;

/**
 * Update or create a user profile
 * @param {Object} user - The Supabase Auth user object
 */
export const updateUserProfile = async (user) => {
  if (!user?.email) return;

  try {
    const { error } = await supabaseClient
      .from('user_profiles')
      .upsert({
        id: user.id,
        email: user.email,
        display_name: user.user_metadata?.full_name || user.email,
        photo_url: user.user_metadata?.avatar_url,
        last_updated: new Date().toISOString()
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error updating user profile:', error);
  }
};

/**
 * Sign in with Google OAuth
 * 
 * Handles the Google sign-in process:
 * 1. Initiates OAuth flow with Google
 * 2. Creates/updates user profile
 * 3. Handles error cases
 * 
 * @returns {Promise<Object>} The authenticated user object
 */
export const signInWithGoogle = async () => {
  try {
    console.log('Starting Google Sign-In process...');
    
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });

    if (error) {
      console.error('Google Sign-In Error:', error);
      throw error;
    }

    console.log('Google Sign-In successful:', data?.user?.id);
    
    // If we have a user, ensure their profile exists
    if (data?.user) {
      console.log('Checking for existing profile...');
      
      // Check if profile exists
      const { data: profile, error: profileError } = await supabaseClient
        .from('user_profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error checking profile:', profileError);
      }

      console.log('Profile check result:', profile ? 'Found' : 'Not found');

      // If no profile exists, create one
      if (!profile) {
        console.log('Creating new profile...');
        const { error: insertError } = await supabaseClient
          .from('user_profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            display_name: data.user.user_metadata?.full_name || data.user.email,
            photo_url: data.user.user_metadata?.avatar_url,
            last_updated: new Date().toISOString()
          });

        if (insertError) {
          console.error('Error creating profile:', insertError);
          // Try upsert if insert fails
          const { error: upsertError } = await supabaseClient
            .from('user_profiles')
            .upsert({
              id: data.user.id,
              email: data.user.email,
              display_name: data.user.user_metadata?.full_name || data.user.email,
              photo_url: data.user.user_metadata?.avatar_url,
              last_updated: new Date().toISOString()
            });

          if (upsertError) {
            console.error('Error upserting profile:', upsertError);
          }
        } else {
          console.log('Profile created successfully');
        }
      }
    }
    
    return data?.user;
  } catch (error) {
    console.error("Google Sign-In Process Error:", error);
    throw error;
  }
};

/**
 * Sign out the current user
 * 
 * Handles user sign-out process:
 * 1. Calls Supabase auth.signOut()
 * 2. Handles any errors during sign-out
 */
export const logOut = async () => {
  try {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error("Sign-Out Error", error);
    throw error;
  }
};

/**
 * Check if a user exists
 */
export const checkUserExists = async (email) => {
  if (!email) return false; // Return false if no email is provided
  
  try {
    const { data, error } = await supabaseClient
      .from('user_profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle(); // Use maybeSingle to avoid errors when no rows are found

    if (error) {
      console.error('Query error:', error); // Log the query error
      throw error; // Throw the error to be caught below
    }

    console.log('Query result:', data); // Log the result of the query
    return !!data; // Return true if data exists, false otherwise
  } catch (error) {
    console.error('Error checking user existence:', error); // Log the error
    return false; // Return false in case of an error
  }
};

/**
 * Create a todo invitation
 */
export const createTodoInvitation = async (todoId, ownerEmail, recipientEmail, permission = 'view') => {
  try {
    // Get the todo data
    const { data: todoData, error: todoError } = await supabaseClient
      .from('todos')
      .select('*')
      .eq('id', todoId)
      .single();

    if (todoError) throw todoError;
    if (!todoData) throw new Error('Todo not found');

    // Get recipient's user ID
    const { data: recipientData, error: recipientError } = await supabaseClient
      .from('user_profiles')
      .select('id')
      .eq('email', recipientEmail)
      .single();

    if (recipientError) throw recipientError;
    if (!recipientData) throw new Error('Recipient not found');

    // Create invitation
    const { error: invitationError } = await supabaseClient
      .from('todo_invitations')
      .insert({
        todo_id: todoId,
        todo_data: todoData,
        owner_email: ownerEmail,
        original_owner: todoData.original_owner || todoData.owner,
        recipient_id: recipientData.id,
        recipient_email: recipientEmail,
        permission,
        status: 'pending',
        created_at: new Date().toISOString()
      });

    if (invitationError) throw invitationError;
    return true;
  } catch (error) {
    console.error('Error creating todo invitation:', error);
    throw error;
  }
};

/**
 * Get pending todo invitations for a user
 */
export const getPendingInvitations = async (userEmail) => {
  try {
    // First get the user's ID
    const { data: userData, error: userError } = await supabaseClient
      .from('user_profiles')
      .select('id')
      .eq('email', userEmail)
      .single();

    if (userError) throw userError;
    if (!userData) throw new Error('User not found');

    // Then get their pending invitations
    const { data: invitations, error } = await supabaseClient
      .from('todo_invitations')
      .select(`
        *,
        todos (*)
      `)
      .eq('recipient_id', userData.id)
      .eq('status', 'pending');

    if (error) throw error;
    return invitations || [];
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return [];
  }
};

/**
 * Handle a todo invitation response
 */
export const handleInvitationResponse = async (userEmail, invitationId, todoId, accept) => {
  try {
    if (accept) {
      // Get the invitation data first
      const { data: invitation, error: invitationError } = await supabaseClient
        .from('todo_invitations')
        .select('*')
        .eq('id', invitationId)
        .single();

      if (invitationError) throw invitationError;

      // Create shared todo with all required fields
      const { error: shareError } = await supabaseClient
        .from('shared_todos')
        .insert({
          todo_id: todoId,
          recipient_email: userEmail,
          owner_email: invitation.owner_email,
          original_owner: invitation.original_owner,
          permission: invitation.permission,
          created_at: new Date().toISOString()
        });

      if (shareError) throw shareError;
    }

    // Update invitation status
    const { error: updateError } = await supabaseClient
      .from('todo_invitations')
      .update({ status: accept ? 'accepted' : 'rejected' })
      .eq('id', invitationId);

    if (updateError) throw updateError;
    return true;
  } catch (error) {
    console.error('Error handling invitation response:', error);
    throw error;
  }
};

/**
 * Get shared todos for a user
 */
export const getSharedTodos = async (userEmail) => {
  try {
    const { data: sharedTodos, error } = await supabaseClient
      .from('shared_todos')
      .select(`
        *,
        todos (*)
      `)
      .eq('recipient_email', userEmail);

    if (error) throw error;
    return sharedTodos || [];
  } catch (error) {
    console.error('Error fetching shared todos:', error);
    return [];
  }
};

/**
 * Revoke access to a shared todo
 */
export const revokeAccess = async (todoId, recipientEmail) => {
  try {
    const { error } = await supabaseClient
      .from('shared_todos')
      .delete()
      .eq('todo_id', todoId)
      .eq('recipient_email', recipientEmail);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error revoking access:', error);
    throw error;
  }
};

/**
 * Update shared todo permission
 */
export const updatePermission = async (todoId, recipientEmail, newPermission) => {
  try {
    const { error } = await supabaseClient
      .from('shared_todos')
      .update({ permission: newPermission })
      .eq('todo_id', todoId)
      .eq('recipient_email', recipientEmail);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating permission:', error);
    throw error;
  }
};

/**
 * Move a todo to recently deleted collection
 */
export const moveToRecentlyDeleted = async (todoId, todoData) => {
  try {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    // If this is a shared todo and the user is not the original owner,
    // we need to store the shared_todos information for restoration
    const isSharedUserDeleting = todoData.is_shared && todoData.owner !== todoData.original_owner;
    const isOwnerDeleting = todoData.owner === todoData.original_owner;

    const recentlyDeletedTodo = {
      id: todoId,
      title: todoData.title,
      description: todoData.description,
      category: todoData.category,
      due_date: todoData.due_date,
      priority: todoData.priority,
      user_id: todoData.user_id,
      owner: todoData.owner,
      original_owner: todoData.original_owner,
      is_shared: todoData.is_shared || false,
      shared_id: todoData.shared_id || null,
      shared_todo_id: todoData.shared_todo_id || null,
      permission: todoData.permission || null,
      deleted_at: todoData.deleted_at || now.toISOString(),
      deleted_by: todoData.deleted_by || todoData.owner,
      expires_at: todoData.expires_at || expiresAt.toISOString()
    };

    // Log the data being inserted
    console.log('Moving to recently deleted:', recentlyDeletedTodo);

    // Insert into recently_deleted for the current user
    const { data, error } = await supabaseClient
      .from('recently_deleted')
      .insert(recentlyDeletedTodo)
      .select()
      .single();

    if (error) {
      console.error('Error moving to recently deleted:', error);
      throw error;
    }

    // If the owner is deleting, we need to:
    // 1. Remove all sharing relationships (permanently)
    // 2. Delete the original todo
    if (isOwnerDeleting) {
      // Remove all sharing relationships
      const { error: removeSharesError } = await supabaseClient
        .from('shared_todos')
        .delete()
        .eq('todo_id', todoId);

      if (removeSharesError) {
        console.error('Error removing sharing relationships:', removeSharesError);
      }

      // Delete the original todo
      const { error: deleteTodoError } = await supabaseClient
        .from('todos')
        .delete()
        .eq('id', todoId);

      if (deleteTodoError) {
        console.error('Error deleting original todo:', deleteTodoError);
        throw deleteTodoError;
      }
    } 
    // If a shared user is deleting, just remove their access
    else if (isSharedUserDeleting && todoData.shared_id) {
      const { error: removeAccessError } = await supabaseClient
        .from('shared_todos')
        .delete()
        .eq('id', todoData.shared_id);

      if (removeAccessError) {
        console.error('Error removing shared access:', removeAccessError);
        throw removeAccessError;
      }
    }

    console.log('Successfully moved to recently deleted:', data);
    return true;
  } catch (error) {
    console.error('Error moving todo to recently deleted:', error);
    throw error;
  }
};

/**
 * Get recently deleted todos for the current user
 */
export const getRecentlyDeletedTodos = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log('Fetching recently deleted todos for user:', userId);

    const { data, error } = await supabaseClient
      .from('recently_deleted')
      .select('*')
      .eq('user_id', userId)
      .order('deleted_at', { ascending: false });

    if (error) {
      console.error('Error fetching recently deleted todos:', error);
      throw error;
    }

    console.log('Found recently deleted todos:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('Error in getRecentlyDeletedTodos:', error);
    throw error;
  }
};

/**
 * Restore a todo from recently deleted
 */
export const restoreTodo = async (todoId) => {
  try {
    console.log('Starting todo restoration for ID:', todoId);

    // Get the todo data
    const { data: todoData, error: fetchError } = await supabaseClient
      .from('recently_deleted')
      .select('*')
      .eq('id', todoId)
      .single();

    if (fetchError) {
      console.error('Error fetching todo data:', fetchError);
      throw fetchError;
    }

    if (!todoData) {
      throw new Error('Todo not found in recently deleted');
    }

    console.log('Found todo data:', todoData);

    // If this was a shared todo that was deleted by a shared user
    if (todoData.is_shared && todoData.shared_id && todoData.owner !== todoData.original_owner) {
      console.log('Restoring shared todo access');
      
      // Restore the sharing relationship only
      const { error: shareError } = await supabaseClient
        .from('shared_todos')
        .insert({
          todo_id: todoData.shared_todo_id,
          recipient_email: todoData.owner,
          owner_email: todoData.original_owner,
          original_owner: todoData.original_owner,
          permission: todoData.permission || 'view',
          created_at: new Date().toISOString()
        });

      if (shareError) {
        console.error('Error restoring share relationship:', shareError);
        throw shareError;
      }
    } else {
      // This is a todo being restored by its owner
      // Remove fields that shouldn't be restored
      const {
        deleted_at,
        expires_at,
        is_shared,
        shared_id,
        shared_todo_id,
        deleted_by,
        permission,
        ...restoreData
      } = todoData;

      // Create a fresh todo without any sharing information
      const newTodo = {
        ...restoreData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        shared_count: 0 // Reset shared count since this is a fresh todo
      };

      console.log('Preparing to restore with data:', newTodo);

      // Add back to todos collection as a fresh todo
      const { data: restoredTodo, error: restoreError } = await supabaseClient
        .from('todos')
        .insert(newTodo)
        .select()
        .single();

      if (restoreError) {
        console.error('Error restoring todo:', restoreError);
        throw restoreError;
      }

      console.log('Successfully restored todo:', restoredTodo);
    }

    // Delete from recently deleted
    const { error: deleteError } = await supabaseClient
      .from('recently_deleted')
      .delete()
      .eq('id', todoId);

    if (deleteError) {
      console.error('Error removing from recently deleted:', deleteError);
      // Don't throw here as the todo is already restored
    }
    
    return todoData;
  } catch (error) {
    console.error('Error in restoreTodo:', error);
    throw error;
  }
};

/**
 * Permanently delete a todo
 */
export const permanentlyDeleteTodo = async (todoId) => {
  try {
    const { error } = await supabaseClient
      .from('recently_deleted')
      .delete()
      .eq('id', todoId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error permanently deleting todo:', error);
    return false;
  }
};

/**
 * Get shared users for a todo
 */
export const getSharedUsers = async (todoId) => {
  try {
    const { data, error } = await supabaseClient
      .from('shared_todos')
      .select(`
        id,
        recipient_email,
        permission,
        user_profiles (
          id,
          display_name,
          photo_url
        )
      `)
      .eq('todo_id', todoId);

    if (error) throw error;
    return data.map(share => ({
      id: share.user_profiles.id,
      email: share.recipient_email,
      permission: share.permission,
      displayName: share.user_profiles.display_name,
      photoUrl: share.user_profiles.photo_url
    })) || [];
  } catch (error) {
    console.error('Error fetching shared users:', error);
    return [];
  }
}; 