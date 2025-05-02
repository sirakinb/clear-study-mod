-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;

DROP POLICY IF EXISTS "Users can view their own focus sessions" ON focus_sessions;
DROP POLICY IF EXISTS "Users can insert their own focus sessions" ON focus_sessions;
DROP POLICY IF EXISTS "Users can update their own focus sessions" ON focus_sessions;
DROP POLICY IF EXISTS "Users can delete their own focus sessions" ON focus_sessions;

DROP POLICY IF EXISTS "Users can view their own unavailable times" ON unavailable_times;
DROP POLICY IF EXISTS "Users can insert their own unavailable times" ON unavailable_times;
DROP POLICY IF EXISTS "Users can update their own unavailable times" ON unavailable_times;
DROP POLICY IF EXISTS "Users can delete their own unavailable times" ON unavailable_times;

DROP POLICY IF EXISTS "Users can view their own notes" ON notes;
DROP POLICY IF EXISTS "Users can insert their own notes" ON notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON notes;

DROP POLICY IF EXISTS "Users can view their own recordings" ON recordings;
DROP POLICY IF EXISTS "Users can insert their own recordings" ON recordings;
DROP POLICY IF EXISTS "Users can update their own recordings" ON recordings;
DROP POLICY IF EXISTS "Users can delete their own recordings" ON recordings;

DROP POLICY IF EXISTS "Users can view their own folders" ON folders;
DROP POLICY IF EXISTS "Users can insert their own folders" ON folders;
DROP POLICY IF EXISTS "Users can update their own folders" ON folders;
DROP POLICY IF EXISTS "Users can delete their own folders" ON folders;

-- Create new policies that work with test user ID regardless of auth
CREATE POLICY "Enable read for users own tasks"
    ON tasks FOR SELECT
    USING (user_id = '00000000-0000-0000-0000-000000000000' OR auth.uid() = user_id);

CREATE POLICY "Enable insert for users own tasks"
    ON tasks FOR INSERT
    WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000' OR auth.uid() = user_id);

CREATE POLICY "Enable update for users own tasks"
    ON tasks FOR UPDATE
    USING (user_id = '00000000-0000-0000-0000-000000000000' OR auth.uid() = user_id);

CREATE POLICY "Enable delete for users own tasks"
    ON tasks FOR DELETE
    USING (user_id = '00000000-0000-0000-0000-000000000000' OR auth.uid() = user_id);

-- Repeat for recordings
CREATE POLICY "Enable read for users own recordings"
    ON recordings FOR SELECT
    USING (user_id = '00000000-0000-0000-0000-000000000000' OR auth.uid() = user_id);

CREATE POLICY "Enable insert for users own recordings"
    ON recordings FOR INSERT
    WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000' OR auth.uid() = user_id);

CREATE POLICY "Enable update for users own recordings"
    ON recordings FOR UPDATE
    USING (user_id = '00000000-0000-0000-0000-000000000000' OR auth.uid() = user_id);

CREATE POLICY "Enable delete for users own recordings"
    ON recordings FOR DELETE
    USING (user_id = '00000000-0000-0000-0000-000000000000' OR auth.uid() = user_id);

-- Repeat for folders
CREATE POLICY "Enable read for users own folders"
    ON folders FOR SELECT
    USING (user_id = '00000000-0000-0000-0000-000000000000' OR auth.uid() = user_id);

CREATE POLICY "Enable insert for users own folders"
    ON folders FOR INSERT
    WITH CHECK (user_id = '00000000-0000-0000-0000-000000000000' OR auth.uid() = user_id);

CREATE POLICY "Enable update for users own folders"
    ON folders FOR UPDATE
    USING (user_id = '00000000-0000-0000-0000-000000000000' OR auth.uid() = user_id);

CREATE POLICY "Enable delete for users own folders"
    ON folders FOR DELETE
    USING (user_id = '00000000-0000-0000-0000-000000000000' OR auth.uid() = user_id); 