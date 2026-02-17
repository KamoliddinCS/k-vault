#!/bin/bash

# Setup script to create .env.local file

if [ -f .env.local ]; then
  echo ".env.local already exists. Skipping..."
  exit 0
fi

cat > .env.local << 'EOF'
# Supabase Configuration
# Replace these with your actual Supabase project credentials
# Get these from: https://app.supabase.com -> Your Project -> Settings -> API

NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Instructions:
# 1. Go to https://app.supabase.com
# 2. Select your project (or create a new one)
# 3. Go to Settings -> API
# 4. Copy the "Project URL" and paste it as NEXT_PUBLIC_SUPABASE_URL
# 5. Copy the "anon public" key and paste it as NEXT_PUBLIC_SUPABASE_ANON_KEY
EOF

echo "✅ Created .env.local file"
echo "⚠️  Please edit .env.local and add your Supabase credentials"
