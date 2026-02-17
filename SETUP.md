# K-Vault Setup Guide

This guide will help you set up K-Vault from scratch.

## Prerequisites

1. **Node.js 18+** and npm installed
2. **Supabase account** (free tier works)
3. **Git** (for version control)

## Step 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in:
   - Organization: Your org
   - Name: `k-vault` (or your choice)
   - Database Password: (save this securely)
   - Region: Choose closest to your users
4. Wait for project to be created (~2 minutes)

### 1.2 Run Database Migration

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the contents of `supabase/migrations/001_initial_schema.sql`
4. Paste and click **Run**
5. Verify tables were created in **Table Editor**

### 1.3 Create Storage Bucket

1. Go to **Storage** in Supabase dashboard
2. Click **New bucket**
3. Name: `k-vault`
4. **Important**: Make it **Private** (not public)
5. Click **Create bucket**

### 1.4 Set Storage Policies (Optional but Recommended)

In SQL Editor, run:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'k-vault');

-- Allow authenticated users to read their own files
CREATE POLICY "Authenticated users can read"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'k-vault');
```

### 1.5 Get API Keys

1. Go to **Settings** → **API**
2. Copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

## Step 2: Local Development Setup

### 2.1 Install Dependencies

```bash
npm install
```

### 2.2 Environment Variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 2.3 Seed Initial Data (Optional)

1. In Supabase SQL Editor, run `supabase/seed.sql`
2. This adds sample departments, courses, and semesters

### 2.4 Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Step 3: Create First Admin User

### 3.1 Sign Up

1. Go to `/login`
2. Use a KAIST email (`@kaist.ac.kr`)
3. Sign up with email/password
4. Check email and verify account

### 3.2 Promote to Admin

In Supabase SQL Editor, run:

```sql
UPDATE public.users
SET role = 'admin'
WHERE email = 'your-email@kaist.ac.kr';
```

## Step 4: Deploy to Vercel

### 4.1 Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/k-vault.git
git push -u origin main
```

### 4.2 Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **Add New Project**
3. Import your GitHub repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click **Deploy**

### 4.3 Update Supabase Auth Settings

1. In Supabase dashboard, go to **Authentication** → **URL Configuration**
2. Add your Vercel URL to:
   - **Site URL**: `https://your-app.vercel.app`
   - **Redirect URLs**: `https://your-app.vercel.app/auth/callback`

## Step 5: Testing

### 5.1 Test Authentication

- Sign up with KAIST email
- Verify email works
- Login works

### 5.2 Test Admin Features

- Upload a resource
- File appears in resource list
- Download works

### 5.3 Test Student Features

- Browse resources
- Search works
- Filters work
- Preview works

## Troubleshooting

### "Unauthorized" errors

- Check RLS policies are enabled
- Verify user role in `users` table
- Check Supabase API keys are correct

### File upload fails

- Verify storage bucket exists and is named `k-vault`
- Check bucket is private
- Verify storage policies allow uploads

### PDF preview doesn't work

- Check browser console for errors
- Verify PDF.js worker URL is accessible
- Try different PDF file

### Email verification not working

- Check Supabase email settings
- Verify redirect URL in Supabase dashboard
- Check spam folder

## Security Checklist

- [ ] RLS enabled on all tables
- [ ] Storage bucket is private
- [ ] Environment variables not committed to git
- [ ] Supabase anon key is public (this is OK - RLS protects data)
- [ ] Email verification enabled
- [ ] KAIST email validation working

## Next Steps

- Add more courses and departments
- Upload initial resources
- Customize UI/colors
- Set up analytics (optional)
- Configure backups in Supabase

## Support

For issues, check:
- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- Project README.md
