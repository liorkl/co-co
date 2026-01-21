# Environment Variables Setup

## Quick Setup

Your `.env.local` file has been created. You need to add your API keys and database URL.

### 1. Update NEXTAUTH_SECRET
The file already has a generated secret. If you want to regenerate it:
```bash
openssl rand -base64 32
```

### 2. Add Your Database URL

#### Option A: Use Neon (Recommended - Free & Easy)
1. Go to https://neon.tech
2. Sign up (free)
3. Create a new project
4. Copy the connection string
5. Add `?schema=public` to the end if not present
6. Paste into `.env.local` as `DATABASE_URL`

#### Option B: Use Supabase
1. Go to https://supabase.com
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string
5. Paste into `.env.local` as `DATABASE_URL`

#### Option C: Local PostgreSQL
If you have PostgreSQL installed locally:
```bash
# Install pgvector extension first
psql -d your_database -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Then use:
DATABASE_URL="postgresql://postgres:password@localhost:5432/founderfinder?schema=public"
```

### 3. Get Resend API Key
1. Go to https://resend.com
2. Sign up (free tier available)
3. Go to API Keys
4. Create a new API key
5. Copy it to `RESEND_API_KEY` in `.env.local`
6. Set `EMAIL_FROM` to your verified domain or use their test domain

### 4. Get OpenAI API Key
1. Go to https://platform.openai.com
2. Sign up (requires payment method)
3. Go to API Keys
4. Create a new key
5. Copy it to `OPENAI_API_KEY` in `.env.local`

### 5. Upstash (Optional)
Only needed if you want production-grade rate limiting:
1. Go to https://upstash.com
2. Create a Redis database
3. Copy REST URL and token
4. Add to `.env.local`

## Your Current .env.local

Edit `.env.local` and replace the placeholder values:

```env
DATABASE_URL="postgresql://..."  # ← Get from Neon/Supabase
NEXTAUTH_SECRET="<run: openssl rand -base64 32>"  # ← Generate your own secret
NEXTAUTH_URL="http://localhost:3000"
RESEND_API_KEY="re_..."  # ← Get from Resend
EMAIL_FROM="FounderFinder <no-reply@yourdomain.com>"  # ← Your email
OPENAI_API_KEY="sk-..."  # ← Get from OpenAI
```

## After Setting Up

Once you have all the keys, run:
```bash
npx prisma migrate dev
npm run dev
```

