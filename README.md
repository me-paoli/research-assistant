# Research Interview Assistant

A powerful web application for uploading, indexing, and searching through user research interviews with advanced keyword analysis, categorization, and product-market fit insights.

## Features

### 🔐 **User Authentication & Multi-tenancy**
- **Secure user accounts** with email/password authentication
- **Company isolation** - each user's data is completely separate
- **Row Level Security (RLS)** - database-level data protection
- **User profiles** with company information
- **Shareable** - perfect for teams and multiple companies

### 📁 **File Management**
- Upload research interviews (PDF, DOC, DOCX, TXT)
- Automatic text extraction and indexing
- File organization with metadata (participant name, date, duration)
- Secure file storage with user isolation

### 🔍 **Advanced Search**
- Full-text search across all interviews
- Keyword-based filtering and categorization
- Relevance scoring and result highlighting
- Search by participant, date, or custom tags

### 🏷️ **Smart Categorization**
- Automatic keyword extraction from interview content
- Custom category creation and management
- Tag-based organization system
- Frequency analysis for key terms

### 📊 **Product-Market Fit Analytics**
- **Product profile management** - define your product, target audience, and key features
- **Sentiment analysis** - track positive, negative, and neutral feedback
- **Fit scoring** - automated product-market fit calculation (0-100 scale)
- **Trend analysis** - track fit score changes over time
- **Actionable insights** - get recommendations based on interview data

### 📈 **Analytics Dashboard**
- Interview statistics and trends
- Keyword frequency analysis
- Product-market fit metrics
- Sentiment distribution charts
- Export capabilities

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL with Row Level Security
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ 
- Supabase account
- Vercel account (for deployment)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd research-assistant
npm install
```

### 2. Set up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Set up Database

1. Run the database migration in your Supabase SQL editor:
   ```sql
   -- Copy and paste the contents of supabase/migrations/001_initial_schema.sql
   ```

2. Create a storage bucket named `interviews` in Supabase Storage

3. Set up storage policies:
   ```sql
   -- Allow authenticated users to upload files to their own folder
   CREATE POLICY "Users can upload own files" ON storage.objects
     FOR INSERT WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);
   
   -- Allow users to view their own files
   CREATE POLICY "Users can view own files" ON storage.objects
     FOR SELECT USING (auth.uid()::text = (storage.foldername(name))[1]);
   
   -- Allow users to update their own files
   CREATE POLICY "Users can update own files" ON storage.objects
     FOR UPDATE USING (auth.uid()::text = (storage.foldername(name))[1]);
   
   -- Allow users to delete their own files
   CREATE POLICY "Users can delete own files" ON storage.objects
     FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1]);
   ```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### 5. Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your environment variables in Vercel dashboard
4. Deploy!

## Usage

### First Time Setup

1. **Sign up** for an account with your email and company information
2. **Set up your product profile** in Settings:
   - Product name and description
   - Target audience
   - Key features
   - Product URL (optional)

### Uploading Interviews

1. Go to the **Upload** page
2. Select your interview file (PDF, DOC, DOCX, or TXT)
3. Add metadata:
   - Interview title
   - Participant name
   - Interview date
   - Duration
4. The system will automatically:
   - Extract text content
   - Identify keywords
   - Categorize the interview
   - Update product-market fit metrics

### Searching and Analysis

1. **Search** across all your interviews using the search bar
2. **Filter** by categories or tags
3. **View analytics** to see trends and insights
4. **Track product-market fit** scores over time

### Product-Market Fit Scoring

The system calculates a fit score (0-100) based on:
- **Base score**: 50 points
- **Positive sentiment**: Up to +40 points
- **Negative sentiment**: Up to -30 points

**Score interpretation**:
- 70-100: Excellent fit 🎉
- 50-69: Good fit 👍
- 30-49: Moderate fit ⚠️
- 0-29: Needs work 🚨

## Multi-tenancy Features

### Data Isolation
- Each user's data is completely isolated
- Row Level Security ensures users can only access their own data
- File storage is organized by user ID

### Company Management
- Users can specify their company during signup
- Company information appears in user profiles
- Perfect for sharing with multiple companies

### Security
- All API routes require authentication
- Database queries are automatically filtered by user
- File access is restricted to owner only

## API Endpoints

### Authentication Required
All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

### Upload Interview
```
POST /api/upload
Content-Type: multipart/form-data

- file: Interview file
- title: Interview title
- participantName: Participant name
- interviewDate: Interview date
- duration: Duration in minutes
```

### Search Interviews
```
GET /api/search?q=<query>&category=<category>&limit=<limit>
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue in the GitHub repository or contact the development team.

---

**Built with ❤️ for research teams everywhere**
