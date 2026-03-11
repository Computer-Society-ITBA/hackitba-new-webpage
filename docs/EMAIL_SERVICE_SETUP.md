# Email Service Configuration

## Setting up Email Service for HackItBA

The email service has been successfully integrated into the Cloud Functions. Email templates are now stored in Firestore for easy editing without code deployment.

### Prerequisites

1. **Resend API Key** - For sending emails
2. **Firestore Email Templates** - Templates stored in database (see Template Setup below)

---

## 1. Get Your Resend API Key

1. Go to [https://resend.com](https://resend.com)
2. Sign up for a free account (100 emails/day free tier)
3. Navigate to **API Keys** section
4. Create a new API key (format: `re_xxxxxxxxxxxxxx`)
5. Copy the API key

### 2. Set Environment Variables in Firebase Console

#### Option A: Using Firebase CLI (Recommended)

```bash
# Set the Resend API Key
firebase functions:config:set resend.api_key="your_api_key_here" resend.app_url="https://hackitba.com"

# Deploy functions
firebase deploy --only functions:api
```

#### Option B: Using Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **webpage-36e40**
3. Navigate to **Functions** → **api** → **Runtime environment variables**
4. Add two environment variables:
   - Name: `RESEND_API_KEY` | Value: `re_xxxxx...`
   - Name: `APP_URL` | Value: `https://hackitba.com`
5. Click **Save** and wait for the function to update

### 3. Initialize Email Templates in Firestore

Email templates are now stored in Firestore (**database: hackitba**) instead of being hardcoded. This allows you to edit email content without redeploying code.

#### Setup Authentication (First Time Only)

Before running the initialization script, configure Firebase authentication:

**Option A: Using Service Account Credentials (Recommended)**

1. Go to [Firebase Console](https://console.firebase.google.com) → **webpage-36e40**
2. **Project Settings** → **Service accounts** → **Generate new private key**
3. Save as `functions/service-account-key.json`
4. Set environment variable:

```powershell
# Windows PowerShell
cd functions
$env:GOOGLE_APPLICATION_CREDENTIALS="$PWD\service-account-key.json"
```

**⚠️ Important:** The file is already in `.gitignore` - never commit credentials!

**Option B: Using Firebase CLI**

```bash
firebase login
firebase use webpage-36e40
```

#### Run the initialization script:

```bash
cd functions
npm run init-email-templates
```

This creates 7 email templates in the `emailTemplates` collection:
- ✅ `welcome` - Welcome email for new users
- ✅ `eventConfirmation` - Event registration confirmation
- ✅ `emailVerification` - Email verification  
- ✅ `passwordReset` - Password reset
- ✅ `teamNotification_joined` - New team member notification
- ✅ `teamNotification_removed` - Removed team member notification
- ✅ `teamNotification_updated` - Team update notification

**Verify templates were created:**

```bash
npx ts-node src/scripts/testEmailTemplates.ts
```

📚 **For more details on templates:** See [EMAIL_TEMPLATES_MIGRATION.md](./EMAIL_TEMPLATES_MIGRATION.md)

### 4. Verify Email Service is Working

After setting the variables, test by:

1. Creating a new user account - should receive a welcome email
2. Registering for the event - should receive an event confirmation email
3. Joining/Leaving a team - should receive team notification emails

### Available Email Endpoints

| Event | Email Type | When Triggered |
|-------|-----------|----------------|
| User Registration | Welcome | POST `/api/users/register` |
| Event Registration | Event Confirmation | POST `/api/users/register-event` |
| Password Reset | Password Reset | POST `/api/users/request-password-reset` |
| Team Member Added | Team Notification | POST `/api/teams/:label/join` |
| Team Member Removed | Team Notification | DELETE `/api/teams/:label/members/:userId` |

### Editing Email Templates

Email templates can be edited directly in Firestore without redeploying code:

1. Go to [Firebase Console](https://console.firebase.google.com) → Firestore
2. **Select database: hackitba** (dropdown at the top)
3. Navigate to `emailTemplates` collection
4. Select the template to edit (e.g., `welcome`)
5. Modify `subject` or `html` fields
6. Save changes - **they take effect immediately**

**Using variables in templates:**

Templates support dynamic content using `{{variable}}` syntax:

```html
<h2>¡Hola {{name}}!</h2>
<a href="{{dashboardUrl}}">Ver Dashboard</a>
```

Common variables: `{{name}}`, `{{dashboardUrl}}`, `{{appUrl}}`, `{{teamName}}`, etc.

📚 **Complete template documentation:** [EMAIL_TEMPLATES_GUIDE.md](./EMAIL_TEMPLATES_GUIDE.md)

### Troubleshooting

- **"Missing API key" error**: Make sure `RESEND_API_KEY` is set in Firebase
- **"Email template X not found" error**: Run the template initialization script: `npx ts-node src/scripts/initEmailTemplates.ts`
- **Emails not sending**: Check Firebase Cloud Functions logs for errors
- **Incorrect email address**: Verify `APP_URL` is set correctly
- **Rate limit**: Resend free tier allows 100 emails/day
- **Variables not replacing**: Ensure variable names match exactly and use `{{variable}}` syntax

### Testing Emails Locally

To test email functions locally without sending real emails, you can:

1. Set `RESEND_API_KEY=test_key` in `.env.local`
2. The functions will log warnings but won't send emails
3. Check the logs to verify email would have been sent

---

**Cost**: Free tier includes 100 emails/day. Paid plans start at ~$20/month for unlimited emails.
