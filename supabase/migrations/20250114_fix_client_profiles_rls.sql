-- Add RLS policies for client_profiles table
-- This fixes the 406 error when clients try to access their profile

-- Drop existing policies if any (cleanup)
DROP POLICY IF EXISTS "Users can view their own client profile" ON client_profiles;
DROP POLICY IF EXISTS "Admins can view all client profiles" ON client_profiles;
DROP POLICY IF EXISTS "Admins can insert client profiles" ON client_profiles;
DROP POLICY IF EXISTS "Admins can update client profiles" ON client_profiles;
DROP POLICY IF EXISTS "Admins can delete client profiles" ON client_profiles;

-- Policy: Users can view their own client profile
CREATE POLICY "Users can view their own client profile" ON client_profiles
    FOR SELECT USING (
        auth.uid() = user_id
    );

-- Policy: Admins can view all client profiles
CREATE POLICY "Admins can view all client profiles" ON client_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- Policy: Admins can insert client profiles
CREATE POLICY "Admins can insert client profiles" ON client_profiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- Policy: Admins can update client profiles
CREATE POLICY "Admins can update client profiles" ON client_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- Policy: Admins can delete client profiles
CREATE POLICY "Admins can delete client profiles" ON client_profiles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );
