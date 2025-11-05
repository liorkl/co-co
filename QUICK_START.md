# 🚀 Quick Start Guide

## Current Status ✅
- ✅ Git repository initialized and committed
- ✅ All dependencies installed
- ✅ Prisma Client generated
- ✅ TypeScript configured
- ✅ Project structure complete

## Next Steps (5 minutes)

### Step 1: Set Up Environment Variables
```bash
# Edit .env.local with your API keys
# See SETUP_ENV.md for detailed instructions

# Minimum required:
# - DATABASE_URL (get from Neon/Supabase - free)
# - RESEND_API_KEY (get from resend.com - free tier)
# - OPENAI_API_KEY (get from platform.openai.com)
```

### Step 2: Set Up Database
```bash
# After setting DATABASE_URL in .env.local:
npx prisma migrate dev

# This will:
# - Create all database tables
# - Enable pgvector extension
# - Generate Prisma Client
```

### Step 3: Start Development Server
```bash
npm run dev
```

### Step 4: Test the App
1. Open http://localhost:3000
2. Click "Get started"
3. Enter your email
4. Check email for magic link
5. Complete onboarding

## Getting API Keys (Free Tiers Available)

### 🌐 Database (Choose One)
- **Neon** (Recommended): https://neon.tech
  - Free tier: 0.5GB storage
  - Includes pgvector
  - Quick setup: 2 minutes

- **Supabase**: https://supabase.com
  - Free tier: 500MB database
  - Includes pgvector
  - Quick setup: 2 minutes

### 📧 Resend (Email)
- Website: https://resend.com
- Free tier: 3,000 emails/month
- Setup time: 3 minutes

### 🤖 OpenAI
- Website: https://platform.openai.com
- Requires: Payment method (pay-as-you-go)
- Setup time: 5 minutes

## Troubleshooting

### Database Connection Error
```bash
# Verify DATABASE_URL is correct
# For Neon: Connection string should end with ?schema=public
# Make sure pgvector extension is enabled:
# Run in your database: CREATE EXTENSION IF NOT EXISTS vector;
```

### Email Not Working
- Check Resend dashboard for errors
- Verify EMAIL_FROM matches your verified domain
- For testing, use Resend's test domain

### OpenAI API Error
- Check you have credits in OpenAI account
- Verify API key is correct
- Check rate limits

## Ready to Deploy?

Once everything works locally:
1. Push to GitHub (see GIT_SETUP.md)
2. Deploy to Vercel/Railway/Render
3. Set environment variables in hosting platform
4. Run production migrations: `npx prisma migrate deploy`

## Need Help?

- See `SETUP_ENV.md` for detailed environment setup
- See `NEXT_STEPS.md` for full checklist
- See `README.md` for project overview

