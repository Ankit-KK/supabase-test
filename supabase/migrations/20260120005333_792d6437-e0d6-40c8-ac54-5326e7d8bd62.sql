-- Grant INSERT permission to anon and authenticated roles for the signup form
GRANT INSERT ON user_signups TO anon, authenticated;