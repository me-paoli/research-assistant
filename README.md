# Research Interview Assistant

A modern, secure platform for uploading, managing, and analyzing research interview documents with AI-powered search and insights. Built for privacy, accessibility, and robust user authentication.

## Features

- **🔒 Auth-Gated Actions** – All uploads, edits, deletes, and form submissions require authentication. Unauthenticated users are prompted to sign in/sign up.
- **📁 File Upload** – Upload interviews and product documentation (PDF, DOCX) to user-specific folders in Supabase Storage
- **🧠 AI Insights** – OpenAI-powered aggregate insights, trends, and recommendations based on your interviews and product context
- **🔍 Search** – Hybrid semantic and keyword search with relevance ranking
- **📊 Analytics** – Sentiment analysis, PMF scoring, and trend visualization
- **☁️ Secure Storage** – Supabase Storage with Row Level Security (RLS) and JWT-authenticated access
- **🧾 Product Context** – Add product details and upload supporting documentation for more contextualized AI analysis
- **🧑‍💼 Interview Management** – Browse, search, and manage your interviews with full CRUD (create, read, update, delete)
- **⚡️ Vercel-Ready** – Instant deployment with environment variable support

## Architecture Overview

```
[ Next.js 15 (App Router) ]
        |
[ React 19 Components ]
        |
[ AuthContext (Supabase Auth) ]
        |
[ API Routes (app/api/*) ]
        |
[ Supabase (DB, Storage, Auth) ]
        |
[ OpenAI (Insights, Summaries) ]
```

- **Frontend**: Next.js (React), Tailwind CSS, Headless UI
- **Backend/API**: Next.js API routes, Supabase client (JWT-auth)
- **Storage**: Supabase Storage (user-specific folders, RLS)
- **AI**: OpenAI API for insights and recommendations

## Authentication & Security

- All sensitive actions (upload, edit, delete, form submit) are gated by authentication.
- Unauthenticated users are shown a sign-in/sign-up modal when attempting restricted actions.
- Supabase Row Level Security (RLS) ensures users can only access their own data/files.
- All API/database operations use a Supabase client initialized with the user's JWT.

## Upload & Interview Flow

1. **User logs in** (or is prompted to sign in when clicking upload/new interview)
2. **Uploads** are stored in Supabase Storage under a user-specific folder (`<user_id>/`)
3. **Interview metadata** is saved in the database, linked to the user
4. **AI processing** (OpenAI) generates summaries, insights, and recommendations
5. **User can view, search, and manage their interviews** (including delete)
6. **Product context and documentation** can be uploaded for more relevant AI analysis

## Product Context & Documentation

- Users can add/edit product details (name, description, URL)
- Users can upload supporting documentation (PRDs, specs, etc.)
- Documentation is stored in a separate bucket/folder, also user-specific
- AI insights use both interview data and product context/docs

## API Endpoints (Key)

- `POST /api/upload` – Upload an interview file (auth required)
- `POST /api/process` – Trigger AI processing for an interview (auth required)
- `GET /api/interviews` – List user interviews
- `DELETE /api/interviews/[id]` – Delete an interview (auth required)
- `POST /api/product-context` – Save product context (auth required)
- `POST /api/product-documentation` – Upload product documentation (auth required)
- `POST /api/insights` – Generate aggregate AI insights (auth required)

## Storage Configuration

- **Buckets**: `interviews`, `product-documents`
- **Folder Structure**: Each user has a folder named by their Supabase user ID
- **RLS**: Only the authenticated user can access their files/rows
- **File Naming**: UUID-based for security

## Environment Variables

Set these in Vercel (or `.env.local` for local dev):

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=your_openai_api_key
```

## Deployment (Vercel)

1. Connect your GitHub repo to Vercel
2. Set all required environment variables in the Vercel dashboard
3. Push to `main` – Vercel will auto-deploy
4. Test authentication, uploads, and AI insights in production

## Project Structure

```
src/
├── app/
│   ├── api/                  # API routes (auth required for all sensitive actions)
│   ├── interviews/           # Interview management UI
│   ├── upload/               # Upload page
│   ├── insights/             # AI insights dashboard
│   ├── account/              # Product context & documentation
│   └── layout.tsx, page.tsx  # App shell
├── components/
│   ├── ui/                   # UI components (Upload, Cards, Toast, etc.)
│   └── Navigation.tsx        # Navigation bar
├── context/                  # AuthContext
├── hooks/                    # Custom React hooks (auth, upload, interviews, etc.)
├── lib/                      # Supabase, storage, AI, validation
└── types/                    # TypeScript types
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License

## Support

For support, please open an issue in the GitHub repository or contact the development team.

---

**Built with ❤️ for research teams everywhere**
