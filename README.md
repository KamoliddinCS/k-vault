# K-Vault

A scalable, secure internal resource platform for KAIST students.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Storage**: Supabase Storage (with chunked uploads for files > 50MB)
- **State Management**: React Query
- **Hosting**: Vercel (Frontend), Supabase Cloud (Database & Files)

## Features

- 🔐 KAIST email authentication (@kaist.ac.kr)
- 📚 Course resource browsing and filtering
- 📄 File upload/download with secure signed URLs
- 👥 Role-based access (Student/Admin)
- 🔍 Full-text search
- 🎨 Modern UI with TailwindCSS

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/KamoliddinCS/k-vault.git
   cd k-vault
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Run the migration files in order:
     - `supabase/migrations/001_initial_schema.sql`
     - `supabase/migrations/002_admin_policies.sql`
     - `supabase/migrations/003_add_r2_storage.sql` (keeps storage column for backward compatibility)
   - Get your Supabase URL and anon key
   - Create a storage bucket named `k-vault` in Supabase Storage

4. **Configure environment variables**
   Create a `.env.local` file:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)**

## Database Schema

The application uses the following main tables:
- `users` - User profiles (extends Supabase auth)
- `departments` - Academic departments
- `courses` - Course information
- `professors` - Professor information
- `semesters` - Semester information
- `resources` - Course resources (files)
- `tags` - Resource tags (optional)

## API Routes

- `GET /api/courses` - List courses
- `GET /api/resources` - List resources (with filters)
- `POST /api/resources` - Create resource (admin only)
- `POST /api/upload` - Upload file (admin only, files ≤ 50MB)
- `POST /api/upload/chunk` - Upload file chunk (for files > 50MB)
- `POST /api/upload/complete` - Complete chunked upload
- `GET /api/download/[id]` - Get signed download URL
- `GET /api/departments` - List departments
- `GET /api/semesters` - List semesters
- `GET /api/professors` - List professors

## Security

- Row Level Security (RLS) enabled on all tables
- Students can only view approved resources
- File access via signed URLs (expires after 1 hour)
- KAIST email validation on signup/login
- Files stored in private Supabase Storage bucket
- Chunked uploads for files larger than 50MB (Supabase limit)
- All downloads require authentication and authorization

## Deployment

### Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Supabase

The database and storage are managed by Supabase. Make sure to:
- Enable daily backups
- Configure RLS policies
- Set up storage bucket (`k-vault`) with proper permissions
- Note: Supabase free tier has a 50MB limit per file upload, but supports chunked uploads for larger files

## License

MIT License - see LICENSE file for details
