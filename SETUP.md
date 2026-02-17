# K-Vault Setup Guide

This guide will help you set up K-Vault from scratch with Supabase Storage.

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

### 1.2 Run Database Migrations

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Run migrations in order:
   - Copy and run `supabase/migrations/001_initial_schema.sql`
   - Copy and run `supabase/migrations/002_admin_policies.sql`
   - Copy and run `supabase/migrations/003_add_r2_storage.sql` (keeps storage column for backward compatibility)
4. Verify tables were created in **Table Editor**

### 1.3 Create Storage Bucket

1. Go to **Storage** in the sidebar
2. Click **New bucket**
3. Fill in:
   - Name: `k-vault`
   - Public bucket: **No** (private bucket)
4. Click **Create bucket**

### 1.4 Set Up Storage Policies

1. Go to **Storage** → **Policies**
2. Click on the `k-vault` bucket
3. Add policies to allow authenticated users to upload and download:

**Policy 1: Allow authenticated users to upload**
```sql
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'k-vault');
```

**Policy 2: Allow authenticated users to download**
```sql
CREATE POLICY "Authenticated users can download files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'k-vault');
```

**Policy 3: Allow authenticated users to delete (for cleanup)**
```sql
CREATE POLICY "Authenticated users can delete files"
ON storage.objects FOR DELETE
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
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2.3 Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 3: First User Setup

### 3.1 Create Admin User

1. Sign up with a KAIST email (@kaist.ac.kr)
2. Go to Supabase dashboard → **Table Editor** → `users`
3. Find your user and change `role` from `student` to `admin`
4. Refresh the app - you should now see admin features

## Step 4: Deployment

### 4.1 Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

### 4.2 Configure Supabase for Production

1. Update Supabase project settings if needed
2. Ensure storage bucket `k-vault` exists
3. Verify RLS policies are in place
4. Set up daily backups (recommended)

## File Upload Limits

- **Single upload limit**: 50MB (Supabase free tier)
- **Chunked uploads**: Files larger than 50MB are automatically split into 50MB chunks
- **Total storage**: 1GB on free tier (can be upgraded)

## Troubleshooting

### Upload Fails

- Check that the `k-vault` bucket exists in Supabase Storage
- Verify storage policies allow authenticated users to upload
- Check file size (must be ≤ 50MB for single upload, or will use chunked upload)

### Download Fails

- Verify storage policies allow authenticated users to download
- Check that the file exists in the bucket
- Ensure user is authenticated

### Chunked Upload Issues

- Check browser console for errors
- Verify all chunks uploaded successfully
- Check server logs for completion errors

## Next Steps

- Add more courses and resources
- Customize the UI
- Set up additional storage policies if needed
- Configure email notifications (optional)
