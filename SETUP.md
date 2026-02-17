# K-Vault Setup Guide

This guide will help you set up K-Vault from scratch with Cloudflare R2 storage.

## Prerequisites

1. **Node.js 18+** and npm installed
2. **Supabase account** (free tier works)
3. **Cloudflare account** with R2 enabled
4. **Git** (for version control)

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
   - Copy and run `supabase/migrations/003_add_r2_storage.sql`
4. Verify tables were created in **Table Editor**

### 1.3 Get API Keys

1. Go to **Settings** → **API**
2. Copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

## Step 2: Cloudflare R2 Setup

### 2.1 Enable R2

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your account
3. Go to **R2** in the sidebar
4. If not enabled, click **Enable R2** (may require payment method)

### 2.2 Create R2 Bucket

1. Click **Create bucket**
2. Name: `k-vault`
3. Location: Choose closest to your users
4. Click **Create bucket**

### 2.3 Create API Token

1. Go to **Manage R2 API Tokens**
2. Click **Create API token**
3. Fill in:
   - Token name: `k-vault-upload`
   - Permissions: **Object Read & Write**
   - TTL: (optional, leave blank for no expiry)
4. Click **Create API Token**
5. **IMPORTANT**: Save these values immediately (you won't see them again):
   - **Access Key ID**
   - **Secret Access Key**
   - **Account ID** (shown in R2 dashboard URL or settings)

### 2.4 Get Endpoint URL

The R2 endpoint follows this pattern:
```
https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

You can find your Account ID in:
- R2 dashboard URL
- Cloudflare dashboard → Right sidebar → Account ID

## Step 3: Local Development Setup

### 3.1 Install Dependencies

```bash
npm install
```

### 3.2 Environment Variables

Create `.env.local` in the project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=k-vault
R2_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com
```

**Where to find each value:**
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase Dashboard → Settings → API → Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase Dashboard → Settings → API → anon public key
- `R2_ACCOUNT_ID`: Cloudflare Dashboard → Right sidebar → Account ID
- `R2_ACCESS_KEY_ID`: From R2 API token creation (Step 2.3)
- `R2_SECRET_ACCESS_KEY`: From R2 API token creation (Step 2.3)
- `R2_BUCKET_NAME`: `k-vault` (or your bucket name)
- `R2_ENDPOINT`: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`

### 3.3 Seed Initial Data (Optional)

1. In Supabase SQL Editor, run `supabase/seed.sql`
2. This adds sample departments, courses, and semesters

### 3.4 Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Step 4: Create First Admin User

### 4.1 Sign Up

1. Go to `/login`
2. Use a KAIST email (`@kaist.ac.kr`)
3. Sign up with email/password
4. Check email and verify account

### 4.2 Promote to Admin

In Supabase SQL Editor, run:

```sql
UPDATE public.users
SET role = 'admin'
WHERE email = 'your-email@kaist.ac.kr';
```

## Step 5: Deploy to Vercel

### 5.1 Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/k-vault.git
git push -u origin main
```

### 5.2 Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **Add New Project**
3. Import your GitHub repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `R2_ACCOUNT_ID`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET_NAME`
   - `R2_ENDPOINT`
5. Click **Deploy**

### 5.3 Update Supabase Auth Settings

1. In Supabase dashboard, go to **Authentication** → **URL Configuration**
2. Add your Vercel URL to:
   - **Site URL**: `https://your-app.vercel.app`
   - **Redirect URLs**: `https://your-app.vercel.app/auth/callback`

## Step 6: Testing

### 6.1 Test Authentication

- Sign up with KAIST email
- Verify email works
- Login works

### 6.2 Test Admin Features

- Upload a resource
- File should be stored in R2
- File appears in resource list
- Download works

### 6.3 Test Student Features

- Browse resources
- Search works
- Filters work
- Preview works
- Download works

## Troubleshooting

### "Unauthorized" errors

- Check RLS policies are enabled
- Verify user role in `users` table
- Check Supabase API keys are correct

### File upload fails

- Verify R2 bucket exists and is named `k-vault`
- Check R2 API token has Read & Write permissions
- Verify all R2 environment variables are set correctly
- Check R2 endpoint URL format

### File download fails

- Verify resource has `file_key` set
- Check `storage` column is set to `r2`
- Verify R2 credentials are correct
- Check signed URL generation is working

### R2 connection errors

- Verify `R2_ENDPOINT` format: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
- Check Account ID matches your Cloudflare account
- Verify API token hasn't expired
- Check bucket name matches `R2_BUCKET_NAME`

## Security Checklist

- [ ] RLS enabled on all tables
- [ ] R2 bucket is private (no public access)
- [ ] Environment variables not committed to git
- [ ] Supabase anon key is public (this is OK - RLS protects data)
- [ ] R2 credentials are secret (never commit to git)
- [ ] Email verification enabled
- [ ] KAIST email validation working
- [ ] Signed URLs expire after 1 hour

## File Storage Structure

Files are stored in R2 with this structure:
```
{dept_code}/{course_code}/{year}-{term}/{uuid}-{filename}
```

Example:
```
CS/CS101/2024-Fall/550e8400-e29b-41d4-a716-446655440000-midterm.pdf
```

## Migration from Supabase Storage

If you have existing files in Supabase Storage:

1. Files will continue to work (backward compatible)
2. New uploads go to R2
3. Download route handles both storage types
4. To migrate existing files, you'll need a migration script

## Next Steps

- Add more courses and departments
- Upload initial resources
- Customize UI/colors
- Set up analytics (optional)
- Configure backups in Supabase
- Set up R2 lifecycle policies (optional)

## Support

For issues, check:
- [Supabase Docs](https://supabase.com/docs)
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [Next.js Docs](https://nextjs.org/docs)
- Project README.md
