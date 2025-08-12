# Supabase Migration Guide

## Step 1: Create Supabase Project

1. Go to https://supabase.com and sign up/login
2. Create a new project
3. Choose a region close to your users
4. Wait for the project to be created (takes ~2 minutes)

## Step 2: Get Your Supabase Credentials

1. In your Supabase dashboard, go to Settings > API
2. Copy the following values:
   - Project URL (looks like: https://abcdefghijklmnop.supabase.co)
   - Anon/Public Key (starts with: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)
   - Service Role Key (starts with: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... but different from anon key)

## Step 3: Update Environment Variables

Update your `.env.local` file with your actual Supabase credentials:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-actual-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-actual-anon-key-here"
SUPABASE_SERVICE_ROLE_KEY="your-actual-service-role-key-here"

# NextAuth
NEXTAUTH_SECRET="your-super-secret-key-for-development-123"
NEXTAUTH_URL="http://localhost:3000"

# Environment
NODE_ENV="development"
```

## Step 4: Create Database Schema

1. In your Supabase dashboard, go to SQL Editor
2. Create a new query
3. Copy and paste the contents of `supabase-schema.sql`
4. Run the query to create all tables and initial data

## Step 5: Migrate Data from SQLite

Run the migration script:
```bash
node migrate-to-supabase.js
```

## Step 6: Update NextAuth Configuration

Update the NextAuth configuration to work with Supabase for user authentication.

## Step 7: Test the Application

1. Start the development server: `npm run dev`
2. Test login functionality
3. Verify all CRUD operations work
4. Check that data is properly displaying

## Important Notes

1. **Row Level Security (RLS)**: The schema includes basic RLS policies. You may need to adjust these based on your security requirements.

2. **Password Hashing**: Make sure to update the user passwords in the schema with actual bcrypt hashed passwords.

3. **Service Role**: The service role key has full access to your database. Keep it secure and never expose it in client-side code.

4. **Environment Variables**: The `NEXT_PUBLIC_` prefix makes variables available to the client-side. Only use this for non-sensitive data like the Supabase URL and anon key.

## Troubleshooting

- If you get authentication errors, double-check your environment variables
- If RLS policies are blocking requests, you may need to adjust the policies in the SQL Editor
- Check the Supabase logs in the dashboard for detailed error messages
