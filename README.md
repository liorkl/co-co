# FounderFinder

A platform that helps CEOs find their tech cofounders (CTOs/first developers) and vice versa.

## Features

- **Magic link authentication** - Passwordless sign-in via email (separate signup/login flows)
- **Role-specific interviews** - Tailored questionnaires for CEOs and CTOs
- **AI-powered matching** - Uses embeddings and semantic similarity to find compatible matches
- **Match insights** - AI-generated rationale and detailed profile information for each match
- **Test data generation** - Scripts to populate test users for development

## Tech Stack

- **Next.js 14** (App Router) with TypeScript
- **Prisma** + PostgreSQL with pgvector
- **NextAuth.js** for authentication
- **OpenAI** for AI summarization and embeddings
- **Resend** for email (magic links)
- **Upstash** for rate limiting (optional)
- **Tailwind CSS** for styling

## Setup

### Prerequisites

- Node.js 18+ (with npm)
- PostgreSQL database with pgvector extension
- Resend API key (for email)
- OpenAI API key

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file in the root directory:
   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DBNAME?schema=public"
   NEXTAUTH_SECRET="your-secret-here"
   NEXTAUTH_URL="http://localhost:3000"
   RESEND_API_KEY="re_XXXXXXXXXXXXXXXXXXXXXXXXXXXX"
   EMAIL_FROM="FounderFinder <no-reply@yourdomain.com>"
   OPENAI_API_KEY="sk-..."
   UPSTASH_REDIS_REST_URL=""  # Optional
   UPSTASH_REDIS_REST_TOKEN=""  # Optional
   ```

3. **Set up database:**
   ```bash
   # Generate Prisma Client
   npx prisma generate
   
   # Run migrations (creates tables and enables pgvector)
   npx prisma migrate dev
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Setup

Make sure your PostgreSQL database has the pgvector extension enabled:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

The migration will attempt to enable it automatically, but you may need to run it manually if you don't have superuser permissions.

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── onboarding/        # CEO/CTO interview flows
│   └── matches/           # Matches display page
├── lib/                    # Utility functions
│   ├── ai.ts              # OpenAI integration
│   ├── db.ts              # Prisma client
│   ├── embeddings.ts      # Embedding generation
│   ├── match.ts           # Matching logic
│   └── rateLimit.ts       # Rate limiting
└── prisma/                 # Database schema and migrations
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run generate:test-data` - Generate test users (10 CEOs, 10 CTOs)
- `npm run test:signin <email>` - Create test session for development
- `npm run verify:neon` - Verify Neon database connection
- `npm run test:email` - Send test email via Resend

## Development

The app uses:
- **TypeScript** for type safety
- **Zod** for runtime validation
- **Tailwind CSS** for styling
- **Server Actions** for form submissions

## License

Private

