-- Update RLS policies to be more permissive for test user
ALTER POLICY "Enable read for users own tasks" ON tasks
    USING (true);

ALTER POLICY "Enable insert for users own tasks" ON tasks
    WITH CHECK (true);

ALTER POLICY "Enable update for users own tasks" ON tasks
    USING (true);

ALTER POLICY "Enable delete for users own tasks" ON tasks
    USING (true);

-- Repeat for recordings
ALTER POLICY "Enable read for users own recordings" ON recordings
    USING (true);

ALTER POLICY "Enable insert for users own recordings" ON recordings
    WITH CHECK (true);

ALTER POLICY "Enable update for users own recordings" ON recordings
    USING (true);

ALTER POLICY "Enable delete for users own recordings" ON recordings
    USING (true);

-- Repeat for folders
ALTER POLICY "Enable read for users own folders" ON folders
    USING (true);

ALTER POLICY "Enable insert for users own folders" ON folders
    WITH CHECK (true);

ALTER POLICY "Enable update for users own folders" ON folders
    USING (true);

ALTER POLICY "Enable delete for users own folders" ON folders
    USING (true);

-- Add similar policies for other tables
ALTER POLICY "Users can view their own focus sessions" ON focus_sessions
    USING (true);

ALTER POLICY "Users can insert their own focus sessions" ON focus_sessions
    WITH CHECK (true);

ALTER POLICY "Users can update their own focus sessions" ON focus_sessions
    USING (true);

ALTER POLICY "Users can delete their own focus sessions" ON focus_sessions
    USING (true);

ALTER POLICY "Users can view their own unavailable times" ON unavailable_times
    USING (true);

ALTER POLICY "Users can insert their own unavailable times" ON unavailable_times
    WITH CHECK (true);

ALTER POLICY "Users can update their own unavailable times" ON unavailable_times
    USING (true);

ALTER POLICY "Users can delete their own unavailable times" ON unavailable_times
    USING (true);

ALTER POLICY "Users can view their own notes" ON notes
    USING (true);

ALTER POLICY "Users can insert their own notes" ON notes
    WITH CHECK (true);

ALTER POLICY "Users can update their own notes" ON notes
    USING (true);

ALTER POLICY "Users can delete their own notes" ON notes
    USING (true); 