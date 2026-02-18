# K-Vault

> A scalable, secure internal resource platform for KAIST students.

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Overview

K-Vault is a modern web application designed to help KAIST students access and manage course resources, including past exams, lecture slides, textbooks, and assignments. The platform features role-based access control, secure file storage, and an intuitive user interface.

## Features

- 🔐 **KAIST Email Authentication** - Secure login with @kaist.ac.kr email validation
- 📚 **Course Resource Management** - Browse and filter resources by course, semester, and type
- 📄 **File Upload/Download** - Support for large files with chunked uploads (up to 50MB per chunk)
- 👥 **Role-Based Access** - Student and Admin roles with appropriate permissions
- 🔍 **Advanced Search** - Search across resources, courses, departments, and professors
- 📁 **Course Catalog** - Hierarchical view of courses and resources (Google Drive-style)
- 🎨 **Modern UI** - Responsive design with dark mode support
- ⚡ **Real-Time Progress** - Upload and download progress tracking

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **State Management**: React Query
- **Hosting**: Vercel (Frontend), Supabase Cloud (Backend)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/KamoliddinCS/k-vault.git
   cd k-vault
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run database migrations:
   - Create a Supabase project at [supabase.com](https://supabase.com)
   - Run the migration files in `supabase/migrations/` in order
   - Create a storage bucket named `k-vault` in Supabase Storage
   - Configure storage policies for authenticated users

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
k-vault/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   └── login/             # Authentication pages
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── ...
├── lib/                   # Utility functions
│   ├── supabase/         # Supabase clients
│   └── types.ts          # TypeScript types
├── public/               # Static assets
└── supabase/            # Database migrations
```

## API Endpoints

- `GET /api/courses` - List all courses
- `GET /api/resources` - List resources with filters
- `POST /api/upload` - Upload file (admin only)
- `POST /api/upload/chunk` - Upload file chunk (for large files)
- `POST /api/upload/complete` - Complete chunked upload
- `GET /api/download/[id]` - Download resource
- `GET /api/departments` - List departments
- `GET /api/semesters` - List semesters
- `GET /api/professors` - List professors

## Security

- Row Level Security (RLS) enabled on all database tables
- KAIST email validation on authentication
- Signed URLs for secure file downloads (1-hour expiration)
- Role-based access control (Student/Admin)
- Private storage bucket with authenticated access only

## Deployment

### Vercel

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

### Supabase

- Ensure all migrations are applied
- Configure storage bucket and policies
- Enable daily backups (recommended)

## File Upload Limits

- **Single upload**: 40MB (safety margin for Supabase's 50MB limit)
- **Chunked uploads**: Files larger than 40MB are automatically split into 40MB chunks
- **Storage**: Managed by Supabase (1GB on free tier)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built for KAIST students
- Powered by [Supabase](https://supabase.com) and [Vercel](https://vercel.com)
