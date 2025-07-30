# Troubleshooting Authentication Issues

## Common Issues and Solutions

### 1. "Invalid login credentials" Error

**Problem**: Demo login fails with invalid credentials error.

**Solutions**:
1. **Use the "Try Demo Account" button** - This automatically creates the demo user if it doesn't exist
2. **Check your Supabase setup**:
   - Ensure you've run the `simple-setup.sql` script
   - Verify your environment variables are correct
   - Make sure your Supabase project is active

3. **Manual demo user creation**:
   - Go to your Supabase dashboard
   - Navigate to Authentication > Users
   - Click "Add user" and create:
     - Email: owner@detergent.com
     - Password: password123
     - Confirm password: password123

### 2. Environment Variables Issues

**Check your `.env.local` file**:
\`\`\`
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
\`\`\`

**How to get these values**:
1. Go to your Supabase project dashboard
2. Click Settings > API
3. Copy the Project URL and API keys

### 3. Database Setup Issues

**Run this in your Supabase SQL Editor**:
\`\`\`sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
\`\`\`

If tables are missing, run the `simple-setup.sql` script.

### 4. User Creation Issues

**If signup fails**:
1. Check browser console for detailed error messages
2. Ensure email confirmation is disabled in Supabase (for testing)
3. Try with a different email address

**To disable email confirmation** (for development):
1. Go to Supabase Dashboard > Authentication > Settings
2. Turn off "Enable email confirmations"

### 5. Testing Steps

1. **First, try creating a new account**:
   - Click "Don't have an account? Sign up"
   - Fill in your details
   - Click "Create Account"

2. **Then try the demo account**:
   - Click "Try Demo Account" button
   - Wait for the setup to complete

3. **Check browser console**:
   - Open Developer Tools (F12)
   - Look for any error messages
   - Share these with support if needed

### 6. Reset Everything

If nothing works:
1. Delete all data from your Supabase project
2. Run `simple-setup.sql` again
3. Restart your development server
4. Try creating a new account

### 7. Contact Support

If you're still having issues:
1. Check the browser console for errors
2. Verify your Supabase project is active
3. Ensure your environment variables are correct
4. Try the troubleshooting steps above
