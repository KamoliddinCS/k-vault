# K-Vault

> A scalable, secure internal resource platform for KAIST students.

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Overview

K-Vault is a modern web application designed to help KAIST students access and manage course resources, including past exams, lecture slides, textbooks, and assignments. The platform features role-based access control, secure file storage, and an intuitive user interface.

## ✨ Key Features

- 🔐 **KAIST Email Authentication** - Secure login with @kaist.ac.kr email validation
- 📚 **Course Resource Management** - Browse and filter resources by course, semester, and type
- 📄 **Large File Handling** - Support for files of any size with intelligent chunked uploads
- 👥 **Role-Based Access** - Student and Admin roles with granular permissions
- 🔍 **Advanced Search** - Full-text search across resources, courses, departments, and professors
- 📁 **Hierarchical Catalog** - Google Drive-style directory view of courses and resources
- 🎨 **Modern UI** - Responsive design with dark/light/system theme support
- ⚡ **Real-Time Progress** - Live upload and download progress tracking with speed/ETA
- 💬 **Feedback System** - User feedback collection with admin review interface
- 🗑️ **Smart Deletion** - Automatic cleanup of chunked files and storage optimization

## 🏗️ Architecture & Technical Highlights

### 1. **Intelligent Chunked Upload System**

**Problem Solved**: Vercel's 4.5MB body size limit and Supabase's 50MB per-file limit.

**Implementation**:
- **Client-Side Chunking**: Files are split into 40MB chunks using `File.slice()` API
- **Direct Storage Upload**: Chunks upload directly to Supabase Storage from the browser, completely bypassing Vercel's API routes
- **Retry Logic**: Exponential backoff retry mechanism (up to 3 attempts per chunk)
- **Progress Tracking**: Real-time progress with bytes uploaded, speed (MB/s), and ETA calculations
- **Chunk Management**: Chunks stored temporarily in `chunks/{uploadId}/` then moved to final location with `.chunk0`, `.chunk1` suffixes

```typescript
// Chunks are uploaded directly from client to Supabase Storage
const { data, error } = await supabase.storage
  .from("k-vault")
  .upload(chunkPath, chunk, { cacheControl: "3600", upsert: false })
```

**Key Innovation**: By uploading directly from the client, we bypass all server-side body size limits while maintaining security through Supabase's RLS policies.

### 2. **Streaming Download with Real-Time Progress**

**Problem Solved**: Large chunked files need to be reassembled and downloaded with progress feedback.

**Implementation**:
- **Server-Side Streaming**: Uses `ReadableStream` API to stream chunks sequentially
- **Client-Side Progress**: `XMLHttpRequest` tracks download progress in real-time
- **Chunk Detection**: Automatically detects chunked files by checking for `.chunk0` existence
- **Memory Efficient**: Chunks are streamed one-by-one instead of loading entire file into memory
- **Progress UI**: Real-time updates showing percentage, bytes downloaded, speed, and time remaining

```typescript
// Server streams chunks using ReadableStream
const stream = new ReadableStream({
  async start(controller) {
    for (const chunkPath of chunks) {
      const chunkData = await supabase.storage.download(chunkPath)
      controller.enqueue(new Uint8Array(await chunkData.arrayBuffer()))
    }
    controller.close()
  }
})
```

**Key Innovation**: Streaming allows the client to receive data incrementally, enabling real-time progress updates instead of waiting for the entire file to be assembled.

### 3. **Advanced Multi-Relation Search**

**Problem Solved**: Supabase's `.or()` doesn't work well with nested relations.

**Implementation**:
- **Client-Side Filtering**: Fetch all resources with relations, then filter in JavaScript
- **Multi-Field Search**: Searches across resource title, course code/name, department code/name, and professor name
- **Case-Insensitive**: Normalized string comparison for better results
- **Performance**: Efficient filtering using JavaScript's native array methods

```typescript
// Client-side search across multiple related fields
const filtered = resources.filter(resource => {
  const searchLower = searchQuery.toLowerCase()
  return (
    resource.title.toLowerCase().includes(searchLower) ||
    resource.course?.course_code.toLowerCase().includes(searchLower) ||
    resource.course?.course_name.toLowerCase().includes(searchLower) ||
    // ... more fields
  )
})
```

### 4. **Hierarchical Course Catalog**

**Problem Solved**: Users need a Google Drive-like directory view to browse courses and resources.

**Implementation**:
- **Nested Data Structure**: Groups resources by course → semester → resources
- **Expandable UI**: React state management for expanded/collapsed folders
- **Efficient Rendering**: Uses `useMemo` to compute catalog structure only when resources change
- **Visual Hierarchy**: Folder icons, indentation, and hover effects for intuitive navigation

```typescript
// Efficient catalog structure computation
const catalogData = useMemo(() => {
  // Group resources by course and semester
  const courseMap = new Map()
  resources.forEach(resource => {
    // Build nested structure...
  })
  return Array.from(courseMap.values())
}, [resources])
```

### 5. **Row Level Security (RLS) Architecture**

**Problem Solved**: Database-level security without exposing sensitive data.

**Implementation**:
- **Granular Policies**: Separate RLS policies for SELECT, INSERT, UPDATE, DELETE operations
- **Role-Based Access**: Different policies for students vs admins
- **Storage RLS**: Policies on `storage.objects` for file uploads/downloads
- **User Context**: Policies use `auth.uid()` to enforce user-specific access

```sql
-- Example: Students can only view approved resources
CREATE POLICY "Students can view approved resources"
ON resources FOR SELECT
TO authenticated
USING (
  approved = true OR 
  uploaded_by = auth.uid() OR
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);
```

### 6. **Real-Time Progress Tracking**

**Problem Solved**: Users need feedback during long uploads/downloads.

**Implementation**:
- **Upload Progress**: Tracks bytes uploaded, calculates speed, and estimates time remaining
- **Download Progress**: Uses `XMLHttpRequest` progress events for chunked files
- **Smooth Updates**: Throttled updates (every 300-500ms) to prevent UI jank
- **Progress Modal**: Dedicated component showing percentage, bytes, speed, and ETA

```typescript
// Real-time progress calculation
xhr.addEventListener("progress", (e) => {
  const timeElapsed = (Date.now() - startTime) / 1000
  const speed = e.loaded / timeElapsed
  const timeRemaining = (e.total - e.loaded) / speed
  // Update UI...
})
```

### 7. **Feedback System with Admin Interface**

**Problem Solved**: Users need a way to provide feedback and admins need to review it.

**Implementation**:
- **Database Storage**: Feedback stored in `feedback` table with type (suggestion/bug/contribution)
- **User Enrichment**: Fetches user emails separately and enriches feedback data
- **Admin Panel**: Dedicated tab in admin panel with filtering and expandable messages
- **RLS Policies**: Users can only view their own feedback, admins can view all

### 8. **Theme System**

**Problem Solved**: Users prefer different color schemes (light/dark/system).

**Implementation**:
- **next-themes Integration**: Uses `next-themes` for theme management
- **System Preference**: Automatically detects and respects OS theme preference
- **Persistent Selection**: Theme choice persisted in localStorage
- **Smooth Transitions**: CSS transitions for theme switching

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **State Management**: React Query (TanStack Query)
- **File Handling**: Direct client-to-storage uploads, streaming downloads
- **Hosting**: Vercel (Frontend), Supabase Cloud (Backend)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/KamoliddinCS/k-vault.git
   cd k-vault
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run database migrations**:
   - Create a Supabase project at [supabase.com](https://supabase.com)
   - Run the migration files in `supabase/migrations/` in order:
     - `001_initial_schema.sql` - Core database schema
     - `002_admin_policies.sql` - RLS policies for admin operations
     - `003_add_r2_storage.sql` - Storage metadata columns
     - `004_add_feedback_table.sql` - Feedback system
     - `005_add_storage_policies.sql` - Storage bucket RLS policies
   - Create a storage bucket named `k-vault` in Supabase Storage (private bucket)
   - **Important**: Run `005_add_storage_policies.sql` to enable file uploads

5. **Start the development server**:
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)** in your browser

## Project Structure

```
k-vault/
├── app/
│   ├── api/                    # API routes
│   │   ├── upload/            # Upload endpoints (single, chunk, complete)
│   │   ├── download/          # Download with streaming support
│   │   ├── feedback/          # Feedback submission and retrieval
│   │   └── ...                # Other CRUD endpoints
│   ├── dashboard/             # Dashboard pages
│   └── login/                 # Authentication pages
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── upload-modal.tsx       # Chunked upload with progress
│   ├── course-catalog.tsx     # Hierarchical course view
│   ├── download-progress.tsx  # Real-time download progress
│   └── feedback-modal.tsx     # User feedback interface
├── lib/
│   ├── supabase/             # Supabase client configurations
│   └── types.ts              # TypeScript type definitions
└── supabase/
    └── migrations/           # Database migrations (gitignored)
```

## API Endpoints

### File Operations
- `POST /api/upload` - Single file upload (≤40MB, direct to Supabase)
- `POST /api/upload/complete-single` - Create resource record after client upload
- `POST /api/upload/chunk` - Upload individual chunk (legacy, not used)
- `POST /api/upload/complete` - Finalize chunked upload (move chunks to final location)
- `GET /api/download/[id]` - Download resource (streams chunked files, signed URLs for regular files)

### Resource Management
- `GET /api/resources` - List resources with advanced filtering and search
- `POST /api/resources` - Create resource (admin only)
- `PUT /api/resources/[id]` - Update resource (admin only)
- `DELETE /api/resources/[id]` - Delete resource and cleanup storage (admin only)

### Feedback
- `POST /api/feedback` - Submit feedback (all users)
- `GET /api/feedback` - Get feedback list (admin only, with filtering)

### Other Endpoints
- `GET /api/courses`, `POST /api/courses` - Course management
- `GET /api/departments`, `POST /api/departments` - Department management
- `GET /api/semesters`, `POST /api/semesters` - Semester management
- `GET /api/professors`, `POST /api/professors` - Professor management

## Security Architecture

### Row Level Security (RLS)
- **Database Tables**: All tables have RLS enabled with role-based policies
- **Storage Bucket**: RLS policies on `storage.objects` for file operations
- **Policy Types**: Separate policies for SELECT, INSERT, UPDATE, DELETE operations
- **User Context**: Policies use `auth.uid()` and role checks for access control

### Authentication & Authorization
- **KAIST Email Validation**: Only @kaist.ac.kr emails allowed
- **Role-Based Access**: Student and Admin roles with different permissions
- **Signed URLs**: File downloads use time-limited signed URLs (1-hour expiration)
- **Storage Access**: Direct client uploads still require authentication via Supabase client

## Performance Optimizations

1. **Client-Side Uploads**: Bypass server entirely for file uploads, reducing server load
2. **Streaming Downloads**: Memory-efficient chunk streaming instead of loading entire files
3. **Query Optimization**: Efficient database queries with proper indexes
4. **React Query Caching**: Intelligent caching and invalidation for API responses
5. **Lazy Loading**: Components and data loaded on-demand

## File Upload System

### Upload Flow

1. **File Size Check**: 
   - ≤40MB: Direct upload to Supabase Storage from client
   - >40MB: Automatic chunking into 40MB chunks

2. **Chunked Upload Process**:
   ```
   Client → Split file into 40MB chunks
          → Upload each chunk directly to Supabase Storage
          → Store chunks in temporary location: chunks/{uploadId}/
          → Call /api/upload/complete to finalize
          → Server moves chunks to final location with .chunk0, .chunk1 suffixes
          → Create resource record in database
   ```

3. **Download Process**:
   ```
   Client → Request download
          → Server detects if file is chunked
          → If chunked: Stream chunks sequentially using ReadableStream
          → If regular: Generate signed URL
          → Client tracks progress via XMLHttpRequest
   ```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built for KAIST students
- Powered by [Supabase](https://supabase.com) and [Vercel](https://vercel.com)
