# Research Interview Assistant

A streamlined application for uploading, managing, and analyzing research interview documents with powerful search and analytics capabilities.

## Features

- **📁 File Upload** - Upload research interviews in PDF, DOC, DOCX, and TXT formats
- **🔍 Search** - Powerful search through uploaded interviews with keyword highlighting
- **📊 Analytics** - Comprehensive insights with sentiment analysis and keyword tracking
- **📋 Interview Management** - Browse and manage your interview collection
- **☁️ Cloud Storage** - Secure file storage with Supabase

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Storage**: Supabase Storage
- **File Upload**: React Dropzone

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### 1. Clone the repository

```bash
git clone <repository-url>
cd research-assistant
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to your project dashboard
3. Navigate to **Storage** in the sidebar
4. Create a new bucket called `research-documents`
5. Set the bucket to **Public** (for demo purposes) or configure RLS policies as needed

### 4. Configure environment variables

Copy the example environment file:

```bash
cp env.example .env.local
```

Update `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your Supabase project dashboard under **Settings** > **API**.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Usage

### Uploading Files

1. Navigate to the **Upload** page
2. Drag and drop files or click to select
3. Supported formats: PDF, DOC, DOCX, TXT
4. Maximum file size: 10MB per file
5. Files are automatically uploaded to Supabase storage

### Searching Interviews

1. Go to the **Search** page
2. Enter keywords or phrases
3. View highlighted search results
4. Filter by relevance and metadata

### Viewing Analytics

1. Visit the **Analytics** page
2. View sentiment analysis breakdown
3. Explore top keywords and trends
4. Review AI-generated recommendations

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── upload/            # Upload page
│   ├── search/            # Search page
│   ├── interviews/        # Interviews list
│   └── analytics/         # Analytics dashboard
├── components/            # React components
├── lib/                   # Utility libraries
│   ├── supabase.ts       # Supabase client
│   └── storage.ts        # Storage service
└── types/                # TypeScript type definitions
```

## API Endpoints

- `POST /api/upload` - Upload a file to storage
- `GET /api/upload` - List uploaded files

## Storage Configuration

The application uses Supabase Storage with the following configuration:

- **Bucket**: `research-documents`
- **Folder**: `uploads/`
- **File naming**: UUID-based for security
- **Access**: Public URLs for file access

## Future Enhancements

- [ ] Text extraction from PDF files
- [ ] AI-powered keyword extraction
- [ ] Sentiment analysis processing
- [ ] Advanced search filters
- [ ] User authentication
- [ ] Team collaboration features
- [ ] Export functionality
- [ ] Real-time notifications

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
