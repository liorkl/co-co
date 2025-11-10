# Testing Guide - FounderFinder

## Testing Authentication Flow from Scratch

### Option 1: Browser Sign Out (Recommended)

1. **Sign Out:**
   - Go to: http://localhost:3000/auth/signout
   - This will clear your session and redirect you to the home page

2. **Clear Browser Data (Optional but recommended):**
   - Open Developer Tools (F12 or Cmd+Option+I)
   - Go to Application tab (Chrome) or Storage tab (Firefox)
   - Clear cookies for `localhost:3000`
   - Or use Incognito/Private mode for a completely fresh test

### Option 2: Use a Different Email

Simply use a different email address when requesting a magic link. This will create a new user account.

### Option 3: Clear Database (For Complete Reset)

If you want to completely reset your test data:

```bash
# Connect to your Neon database and delete test users
# Or use Prisma Studio to manually delete users
npx prisma studio
```

## Complete Testing Flow

### 1. Start Fresh
- Clear browser cookies or use Incognito mode
- Or visit: http://localhost:3000/auth/signout

### 2. Sign In
- Go to: http://localhost:3000
- Click "Get started"
- Enter your email address
- Click "Send magic link"

### 3. Check Email
- Check your email inbox (and spam folder)
- Click the "Sign in" link in the email

### 4. Expected Flow
- ✅ Magic link should redirect to `/onboarding/role`
- ✅ You should see the role selection page (CEO or CTO)
- ✅ After selecting a role, you should be redirected to the appropriate onboarding flow

### 5. Verify Authentication
- You should be redirected automatically based on your auth status
- Check terminal logs for authentication events
- Check browser console for any errors

## Debugging Tips

### Configure Integration Tests
- Copy `env.test.example` to `.env.test.local` and update `TEST_DATABASE_URL` with a database/branch safe for destructive resets.
- The integration suite automatically creates and drops isolated schemas, but it needs credentials with permission to create schemas.
- If `TEST_DATABASE_URL` is not provided, the tests fall back to `DATABASE_URL`; ensure this points to a non-production database before running `npm run test:integration`.

### Check Terminal Logs
Look for these log messages:
- `📧 Attempting to send email:` - Email sending started
- `✅ Email sent successfully!` - Email sent
- `🔐 signIn callback triggered:` - User signing in
- `🔀 Redirect callback:` - Redirect happening

### Check Database
```bash
# View your database in Prisma Studio
npx prisma studio
```

Check these tables:
- `User` - Should have your user record
- `VerificationToken` - Should have recent tokens (they get deleted after use)
- `Session` - Should have your active session

### Common Issues

1. **Magic link redirects to sign-in page:**
   - Check terminal logs for errors
   - Verify `NEXTAUTH_SECRET` is set
   - Check if token expired (24 hours max)

2. **Email not arriving:**
   - Check spam folder
   - Verify Resend API key is correct
   - Check Resend dashboard for delivery status

3. **Infinite redirect loop:**
   - Clear all cookies
   - Check browser console for errors
   - Verify `NEXTAUTH_URL` is set correctly

## Quick Test Commands

```bash
# Restart dev server
npm run dev

# Check database connection
npm run verify:neon

# Send test email
npm run test:email your.email@example.com

# Verify email was sent
npm run verify:email <email-id>
```

