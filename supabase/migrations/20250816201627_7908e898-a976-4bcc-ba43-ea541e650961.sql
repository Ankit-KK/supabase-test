-- Add missing policies for predefined_queries table
CREATE POLICY "Allow public read access to predefined queries" 
ON predefined_queries 
FOR SELECT 
USING (true);

-- Add missing policies for audit_logs table  
CREATE POLICY "Allow authenticated users to view audit logs" 
ON audit_logs 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow system to insert audit logs" 
ON audit_logs 
FOR INSERT 
WITH CHECK (true);