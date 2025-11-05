#!/usr/bin/env node

/**
 * Create a test session by generating a magic link for a test user
 * Usage: node scripts/create-test-session.js <email>
 * Example: node scripts/create-test-session.js sarah.chen@test.founderfinder.com
 * 
 * This script uses the test API endpoint which properly generates tokens
 */

require('dotenv').config({ path: '.env.local' });
const http = require('http');

const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

async function createTestSession(email) {
  console.log(`🔐 Creating test session for: ${email}\n`);

  // Use the direct auth endpoint which bypasses token validation
  // Open directly in browser - the endpoint will set cookies via redirect
  const url = `${baseUrl}/api/test/auth?email=${encodeURIComponent(email)}`;
  
  console.log(`\n🔗 Direct auth URL:\n`);
  console.log(url);
  console.log(`\n📋 Opening in browser - this will directly sign you in.\n`);
  console.log(`💡 The endpoint will set a session cookie and redirect you.\n`);
  
  // Open directly in browser
  if (process.platform === 'darwin' || process.platform === 'linux') {
    const { exec } = require('child_process');
    exec(`open "${url}"`, (error) => {
      if (!error) {
        console.log('🌐 Opening in browser...\n');
      } else {
        console.error('❌ Could not open browser automatically');
        console.log(`\nPlease copy and paste this URL in your browser:\n${url}\n`);
      }
    });
  } else if (process.platform === 'win32') {
    const { exec } = require('child_process');
    exec(`start "${url}"`, (error) => {
      if (!error) {
        console.log('🌐 Opening in browser...\n');
      } else {
        console.error('❌ Could not open browser automatically');
        console.log(`\nPlease copy and paste this URL in your browser:\n${url}\n`);
      }
    });
  } else {
    console.log(`\nPlease copy and paste this URL in your browser:\n${url}\n`);
  }

  return url;
}

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Please provide an email address');
    console.log('\nUsage:');
    console.log('  node scripts/create-test-session.js <email>');
    console.log('\nExample:');
    console.log('  node scripts/create-test-session.js sarah.chen@test.founderfinder.com');
    console.log('\n💡 Make sure the dev server is running: npm run dev');
    process.exit(1);
  }

  try {
    await createTestSession(email);
  } catch (error) {
    console.error('❌ Error creating test session:', error);
    process.exit(1);
  }
}

main();

