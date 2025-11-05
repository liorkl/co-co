#!/usr/bin/env node

/**
 * Verify Resend email status using Resend API
 * Usage: node scripts/verify-resend-email.js <email-id>
 */

require('dotenv').config({ path: '.env.local' });

const { Resend } = require('resend');

async function verifyResendEmail() {
  const emailId = process.argv[2];
  
  if (!emailId) {
    console.error('❌ Please provide an email ID as an argument');
    console.log('Usage: node scripts/verify-resend-email.js <email-id>');
    console.log('\nExample:');
    console.log('  node scripts/verify-resend-email.js aca1e6e2-0f29-4fe8-8e0c-04755340e05e');
    process.exit(1);
  }

  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    console.error('❌ RESEND_API_KEY not found in .env.local');
    process.exit(1);
  }

  console.log('🔍 Verifying Resend Email Status...\n');
  console.log(`Email ID: ${emailId}\n`);

  try {
    const resend = new Resend(resendApiKey);

    console.log('📧 Fetching email from Resend API...\n');
    
    // Use Resend API to get email by ID
    const result = await resend.emails.get(emailId);
    
    if (result.error) {
      console.error('❌ Error fetching email:');
      console.error(`   ${result.error.message}`);
      console.error(`   Error type: ${result.error.name}`);
      
      if (result.error.name === 'restricted_api_key') {
        console.error('\n💡 Your API key is restricted to sending emails only.');
        console.error('   To verify emails via API, you need an API key with "full_access" permissions.');
        console.error('   Options:');
        console.error('   1. Create a new API key with full access in Resend dashboard');
        console.error('   2. Check Resend Dashboard: https://resend.com/emails');
        console.error('   3. Use Resend MCP in Cursor (if configured with full access key)');
      }
      process.exit(1);
    }
    
    if (result.data) {
      console.log('✅ Email found in Resend!\n');
      console.log('📬 Email Details:');
      console.log(JSON.stringify(result.data, null, 2));
      
      // Extract key information
      const email = result.data;
      console.log('\n📊 Summary:');
      console.log(`   ID: ${email.id || emailId}`);
      if (email.from) console.log(`   From: ${email.from}`);
      if (email.to) console.log(`   To: ${Array.isArray(email.to) ? email.to.join(', ') : email.to}`);
      if (email.subject) console.log(`   Subject: ${email.subject}`);
      if (email.created_at) console.log(`   Created: ${email.created_at}`);
      if (email.last_event) console.log(`   Last Event: ${email.last_event}`);
      
      return result.data;
    } else {
      console.log('⚠️  Email not found in Resend API response');
      console.log('   This might mean:');
      console.log('   - Email ID is invalid');
      console.log('   - Email was sent but not yet processed');
      console.log('   - Check Resend Dashboard: https://resend.com/emails');
      return null;
    }
  } catch (error) {
    console.error('\n❌ Error verifying email:');
    console.error(error);
    
    if (error.message) {
      console.error(`\nError message: ${error.message}`);
    }
    
    process.exit(1);
  }
}

verifyResendEmail();

