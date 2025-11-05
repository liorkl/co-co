#!/usr/bin/env node

/**
 * Test script to send a test email via Resend and verify it using MCP
 * Usage: node scripts/test-resend-email.js <your-email@example.com>
 */

require('dotenv').config({ path: '.env.local' });

const { Resend } = require('resend');

async function testResendEmail() {
  const recipientEmail = process.argv[2];
  
  if (!recipientEmail) {
    console.error('❌ Please provide an email address as an argument');
    console.log('Usage: node scripts/test-resend-email.js your-email@example.com');
    process.exit(1);
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM || 'onboarding@resend.dev';

  if (!resendApiKey) {
    console.error('❌ RESEND_API_KEY not found in .env.local');
    process.exit(1);
  }

  console.log('🧪 Testing Resend Email Sending...\n');
  console.log('Configuration:');
  console.log(`  From: ${emailFrom}`);
  console.log(`  To: ${recipientEmail}`);
  console.log(`  API Key: ${resendApiKey.substring(0, 10)}...\n`);

  try {
    const resend = new Resend(resendApiKey);

    // Format the from address
    let from = emailFrom;
    if (!from.includes('<')) {
      from = `FounderFinder <${from}>`;
    }

    console.log('📧 Sending test email...');
    
    const result = await resend.emails.send({
      from,
      to: recipientEmail,
      subject: 'Test Email from FounderFinder',
      html: `
        <h2>Test Email from FounderFinder</h2>
        <p>This is a test email to verify Resend integration is working.</p>
        <p>If you received this, your email setup is working correctly! ✅</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      `,
      text: 'Test Email from FounderFinder - This is a test email to verify Resend integration is working.',
    });

    console.log('\n✅ Email sent successfully!');
    console.log('📬 Email Details:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.id || result.data?.id) {
      const emailId = result.id || result.data?.id;
      console.log(`\n📧 Email ID: ${emailId}`);
      console.log('\n💡 Next steps:');
      console.log('1. Check your email inbox (and spam folder)');
      console.log('2. Check Resend dashboard: https://resend.com/emails');
      console.log('3. Verify email delivery using the Resend API:');
      console.log(`\n   npm run verify:email ${emailId}`);
      console.log('\n   Or in Cursor, ask:');
      console.log(`   "Check if email ${emailId} was sent via Resend"`);
    }

    return result;
  } catch (error) {
    console.error('\n❌ Error sending email:');
    console.error(error);
    
    if (error.message) {
      console.error(`\nError message: ${error.message}`);
    }
    
    if (error.response) {
      console.error('\nResend API Response:');
      console.error(JSON.stringify(error.response, null, 2));
    }
    
    process.exit(1);
  }
}

testResendEmail();

