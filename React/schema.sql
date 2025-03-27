-- Create user_profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  photo_url TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add index for email lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, display_name, photo_url, last_updated)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    display_name = COALESCE(EXCLUDED.display_name, user_profiles.display_name),
    photo_url = COALESCE(EXCLUDED.photo_url, user_profiles.photo_url),
    last_updated = CURRENT_TIMESTAMP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to automatically create profile for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for relevant tables
ALTER TABLE public.user_profiles REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_profiles;

-- Create todos table
CREATE TABLE todos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  category TEXT DEFAULT 'personal',
  due_date TIMESTAMP WITH TIME ZONE,
  priority TEXT DEFAULT 'medium',
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  owner TEXT NOT NULL,
  original_owner TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ai_content JSONB -- Store AI content as JSONB for better querying and flexibility
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);

-- Create shared_todos table
CREATE TABLE shared_todos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  todo_id UUID REFERENCES todos(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  permission TEXT DEFAULT 'view',
  owner_email TEXT NOT NULL,
  original_owner TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_shared_todos_recipient_email ON shared_todos(recipient_email);
CREATE INDEX IF NOT EXISTS idx_shared_todos_todo_id ON shared_todos(todo_id);

-- Create todo_invitations table
CREATE TABLE todo_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  todo_id UUID REFERENCES todos(id) ON DELETE CASCADE,
  todo_data JSONB NOT NULL,
  owner_email TEXT NOT NULL,
  original_owner TEXT NOT NULL,
  recipient_id UUID REFERENCES auth.users(id),
  recipient_email TEXT NOT NULL,
  permission TEXT DEFAULT 'view',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_todo_invitations_recipient_id ON todo_invitations(recipient_id);
CREATE INDEX IF NOT EXISTS idx_todo_invitations_todo_id ON todo_invitations(todo_id);

-- Create recently_deleted table
CREATE TABLE recently_deleted (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  priority TEXT,
  user_id UUID REFERENCES auth.users(id),
  owner TEXT NOT NULL,
  original_owner TEXT NOT NULL,
  is_shared BOOLEAN DEFAULT FALSE,
  shared_id UUID,
  shared_todo_id UUID,
  deleted_at TIMESTAMP WITH TIME ZONE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  deleted_by TEXT NOT NULL,
  permission TEXT DEFAULT NULL,
  ai_content JSONB -- Store AI content as JSONB for better querying and flexibility
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_recently_deleted_user_id ON recently_deleted(user_id);

-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE recently_deleted ENABLE ROW LEVEL SECURITY;

-- User Profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can check profile existence" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "System can create user profiles" ON user_profiles;

CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can check profile existence"
  ON user_profiles FOR SELECT
  USING (true);  -- Allow reading basic profile info for all authenticated users

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "System can create user profiles"
  ON user_profiles FOR INSERT
  WITH CHECK (true);  -- Allow the trigger to create profiles

-- Todos policies
DROP POLICY IF EXISTS "Users can view their own todos" ON todos;
DROP POLICY IF EXISTS "Users can create todos" ON todos;
DROP POLICY IF EXISTS "Users can update their own todos" ON todos;
DROP POLICY IF EXISTS "Users can delete their own todos" ON todos;
DROP POLICY IF EXISTS "Shared users can update todos" ON todos;
DROP POLICY IF EXISTS "Original owners can delete entire shared todos" ON todos;

CREATE POLICY "Users can view their own todos"
  ON todos FOR SELECT
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM shared_todos 
      WHERE shared_todos.todo_id = todos.id 
      AND shared_todos.recipient_email = auth.jwt()->>'email'
    )
  );

CREATE POLICY "Users can create todos"
  ON todos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own todos"
  ON todos FOR UPDATE
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM shared_todos 
      WHERE shared_todos.todo_id = todos.id 
      AND shared_todos.recipient_email = auth.jwt()->>'email'
      AND shared_todos.permission = 'edit'
    )
  );

CREATE POLICY "Users can delete their own todos"
  ON todos FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Original owners can delete entire shared todos"
  ON todos FOR DELETE
  USING (
    auth.uid() = user_id AND 
    original_owner = auth.jwt()->>'email'
  );

-- Shared todos policies
DROP POLICY IF EXISTS "Users can view todos shared with them" ON shared_todos;
DROP POLICY IF EXISTS "Users can create shared todos" ON shared_todos;
DROP POLICY IF EXISTS "Users can delete shared todos" ON shared_todos;
DROP POLICY IF EXISTS "Users can view shared users list" ON shared_todos;
DROP POLICY IF EXISTS "Original owners can update shared todo permissions" ON shared_todos;
DROP POLICY IF EXISTS "Shared users can remove their access" ON shared_todos;
DROP POLICY IF EXISTS "Users can update shared todo status" ON shared_todos;

CREATE POLICY "Users can view todos shared with them"
  ON shared_todos FOR SELECT
  USING (
    recipient_email = auth.jwt()->>'email' OR 
    owner_email = auth.jwt()->>'email' OR
    original_owner = auth.jwt()->>'email'
  );

CREATE POLICY "Users can create shared todos"
  ON shared_todos FOR INSERT
  WITH CHECK (owner_email = auth.jwt()->>'email');

CREATE POLICY "Users can delete shared todos"
  ON shared_todos FOR DELETE
  USING (recipient_email = auth.jwt()->>'email' OR owner_email = auth.jwt()->>'email');

CREATE POLICY "Users can view shared users list"
  ON shared_todos FOR SELECT
  USING (
    owner_email = auth.jwt()->>'email' OR 
    original_owner = auth.jwt()->>'email' OR 
    recipient_email = auth.jwt()->>'email'
  );

CREATE POLICY "Original owners can update shared todo permissions"
  ON shared_todos FOR UPDATE
  USING (original_owner = auth.jwt()->>'email');

CREATE POLICY "Shared users can update shared todo status"
  ON shared_todos FOR UPDATE
  USING (
    recipient_email = auth.jwt()->>'email' OR 
    owner_email = auth.jwt()->>'email'
  );

-- Todo invitations policies
DROP POLICY IF EXISTS "Users can view their invitations" ON todo_invitations;
DROP POLICY IF EXISTS "Users can create invitations" ON todo_invitations;
DROP POLICY IF EXISTS "Users can update their invitations" ON todo_invitations;
DROP POLICY IF EXISTS "Users can delete their invitations" ON todo_invitations;

CREATE POLICY "Users can view their invitations"
  ON todo_invitations FOR SELECT
  USING (recipient_id = auth.uid() OR owner_email = auth.jwt()->>'email');

CREATE POLICY "Users can create invitations"
  ON todo_invitations FOR INSERT
  WITH CHECK (owner_email = auth.jwt()->>'email');

CREATE POLICY "Users can update their invitations"
  ON todo_invitations FOR UPDATE
  USING (recipient_id = auth.uid());

CREATE POLICY "Users can delete their invitations"
  ON todo_invitations FOR DELETE
  USING (recipient_id = auth.uid() OR owner_email = auth.jwt()->>'email');

-- Recently deleted policies
DROP POLICY IF EXISTS "Users can view their deleted todos" ON recently_deleted;
DROP POLICY IF EXISTS "Users can insert into recently deleted" ON recently_deleted;
DROP POLICY IF EXISTS "Users can update their deleted todos" ON recently_deleted;
DROP POLICY IF EXISTS "Users can delete their deleted todos" ON recently_deleted;

CREATE POLICY "Users can view their deleted todos"
  ON recently_deleted FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert into recently deleted"
  ON recently_deleted FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their deleted todos"
  ON recently_deleted FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their deleted todos"
  ON recently_deleted FOR DELETE
  USING (user_id = auth.uid()); 