# Neon Database Setup Guide

## Step-by-Step Instructions

### Step 1: Create Neon Account & Project

1. **Go to Neon:**
   - Open https://neon.tech in your browser
   - Click "Sign Up" (top right)
   - Sign up with GitHub, Google, or email (free)

2. **Create a New Project:**
   - After signing in, click "Create Project"
   - Project name: `founder-finder` (or any name you prefer)
   - Region: Choose closest to your users (e.g., `us-east-1` for US)
   - PostgreSQL version: Use the default (latest stable)
   - Click "Create Project"

3. **Set Up Cursor Integration (Recommended):**
   - Neon may prompt you to run `npx neonctl@latest init` for Cursor integration
   - **Do it!** This enables Cursor IDE features like:
     - Database management within Cursor
     - Query tools and schema introspection
     - Branch management from your IDE
   - Run this in your terminal:
     ```bash
     npx neonctl@latest init
     ```
   - Follow the prompts to authenticate and link your project
   - This won't interfere with Prisma - they work together

4. **Get Your Connection String:**
   - Once the project is created, look for "Connection Details" or "Connection String"
   - You'll see something like:
     ```
     postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require
     ```
   - Click "Copy" to copy the connection string

5. **Important:** Add `?schema=public` to the connection string if it's not already there:
   - If your connection string ends with `?sslmode=require`, change it to:
     ```
     postgresql://...?sslmode=require&schema=public
     ```
   - Or if it doesn't have any query params, add:
     ```
     postgresql://...?schema=public
     ```

### Step 2: Configure Your Project

1. **Update `.env.local`:**
   - Open `.env.local` in your project root
   - Find the `DATABASE_URL` line
   - Replace it with your Neon connection string:
     ```env
     DATABASE_URL="postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require&schema=public"
     ```

2. **(Recommended) Create a dedicated test branch/database:**
   - In the Neon dashboard, go to **Branches → New branch** and name it `tests` (or similar).
   - Copy the connection string for that branch.
   - Update `.env.test.local` (create from `env.test.example`) with:
     ```env
     TEST_DATABASE_URL="postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require&schema=public"
     ```
   - The integration tests will create isolated schemas on this branch and tear them down automatically.
   - **Important:** Use the direct endpoint host (no `-pooler` suffix) for `TEST_DATABASE_URL`. Prisma’s schema sync runs DDL statements that are incompatible with Neon’s transaction pooler, while your application runtime can continue to point `DATABASE_URL` at the pooled endpoint.

3. **Verify pgvector is enabled:**
   - Neon comes with pgvector pre-installed
   - Your migration will enable it automatically

### Step 3: Run Database Migrations

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations (creates all tables and enables pgvector)
npm run prisma:migrate
```

### Step 4: Verify Connection

Run this to test your connection:
```bash
npm run dev
```

Then check the console - you should see no database connection errors.

## Troubleshooting

### Connection Issues
- **"SSL required"**: Make sure your connection string includes `?sslmode=require`
- **"Connection timeout"**: Check if your IP is allowed (Neon allows all IPs by default)
- **"Invalid credentials"**: Verify you copied the entire connection string

### pgvector Extension
- If you get errors about the vector extension, run:
  ```sql
  CREATE EXTENSION IF NOT EXISTS vector;
  ```
  In Neon's SQL Editor (available in the dashboard)

### Migration Issues
- If migrations fail, check that `schema=public` is in your connection string
- Make sure you're using the main branch connection string (not a branch)

## Neon Features You Can Use Later

### Neon CLI & Cursor Integration
- **Run `npx neonctl@latest init`** to enable Cursor IDE integration
- Provides database management, query tools, and branch switching within Cursor
- Works seamlessly with Prisma - you get both CLI tools and Prisma migrations
- Highly recommended if you're using Cursor IDE

### Database Branches
- Create separate databases for dev/staging/prod
- Useful for testing migrations without affecting production
- Access from Neon dashboard → Branches

### Connection Pooling
- Neon automatically handles connection pooling
- Your Prisma client will work efficiently with serverless functions

### Monitoring
- Check database usage in Neon dashboard
- View query performance and connection metrics

## Next Steps

Once your database is set up:
1. ✅ Connection string configured
2. ✅ Migrations run successfully
3. ✅ Test the connection with `npm run dev`

Your database is ready for your FounderFinder app!

