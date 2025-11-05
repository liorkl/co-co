#!/usr/bin/env node

/**
 * Verification script for Neon database setup
 * Run this after setting up your Neon connection string
 * Usage: node scripts/verify-neon.js
 */

// Load .env.local if dotenv is available, otherwise rely on environment variables
try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {
  // dotenv not installed, assume env vars are already set
  console.log('ℹ️  Loading environment variables from .env.local (if available)\n');
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyNeon() {
  console.log('🔍 Verifying Neon database connection...\n');

  try {
    // 1. Test basic connection
    console.log('1. Testing database connection...');
    await prisma.$connect();
    console.log('   ✅ Connected successfully\n');

    // 2. Check pgvector extension
    console.log('2. Checking pgvector extension...');
    const vectorCheck = await prisma.$queryRaw`
      SELECT EXISTS(
        SELECT 1 FROM pg_extension WHERE extname = 'vector'
      ) as exists;
    `;
    const hasVector = vectorCheck[0]?.exists;
    if (hasVector) {
      console.log('   ✅ pgvector extension is enabled\n');
    } else {
      console.log('   ⚠️  pgvector extension not found. Run: CREATE EXTENSION vector;\n');
    }

    // 3. Check if tables exist
    console.log('3. Checking database schema...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    const expectedTables = [
      'User', 'Profile', 'Startup', 'TechBackground', 
      'InterviewResponse', 'ProfileSummary', 'Embedding', 'Match'
    ];
    
    const existingTables = tables.map(t => t.table_name);
    const missingTables = expectedTables.filter(t => !existingTables.includes(t));
    
    if (missingTables.length === 0) {
      console.log(`   ✅ All ${expectedTables.length} tables exist\n`);
    } else {
      console.log(`   ⚠️  Missing tables: ${missingTables.join(', ')}\n`);
      console.log('   Run: npm run prisma:migrate\n');
    }

    // 4. Check connection string format
    console.log('4. Verifying connection string format...');
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.log('   ❌ DATABASE_URL not found in .env.local\n');
      process.exit(1);
    }
    
    if (dbUrl.includes('neon.tech')) {
      console.log('   ✅ Using Neon database\n');
    } else {
      console.log('   ⚠️  Connection string doesn\'t appear to be from Neon\n');
    }
    
    if (dbUrl.includes('sslmode=require')) {
      console.log('   ✅ SSL mode is configured\n');
    } else {
      console.log('   ⚠️  SSL mode not specified (recommended: ?sslmode=require)\n');
    }

    console.log('✅ Database verification complete!\n');
    console.log('Your Neon database is ready to use. 🎉\n');

  } catch (error) {
    console.error('\n❌ Database verification failed:\n');
    console.error(error.message);
    
    if (error.message.includes('P1001')) {
      console.error('\n💡 Tip: Check your DATABASE_URL in .env.local');
      console.error('   Make sure it includes ?sslmode=require');
    } else if (error.message.includes('P1003')) {
      console.error('\n💡 Tip: Database might not exist. Check your connection string.');
    } else if (error.message.includes('P1000')) {
      console.error('\n💡 Tip: Authentication failed. Verify your credentials.');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyNeon();

