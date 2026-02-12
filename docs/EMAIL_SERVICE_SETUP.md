# Email Service Configuration

## Setting up Email Service for HackItBA

The email service has been successfully integrated into the Cloud Functions. To enable emails, follow these steps:

### 1. Get Your Resend API Key

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

### 3. Verify Email Service is Working

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

### Troubleshooting

- **"Missing API key" error**: Make sure `RESEND_API_KEY` is set in Firebase
- **Emails not sending**: Check Firebase Cloud Functions logs for errors
- **Incorrect email address**: Verify `APP_URL` is set correctly
- **Rate limit**: Resend free tier allows 100 emails/day

### Testing Emails Locally

To test email functions locally without sending real emails, you can:

1. Set `RESEND_API_KEY=test_key` in `.env.local`
2. The functions will log warnings but won't send emails
3. Check the logs to verify email would have been sent

---

**Cost**: Free tier includes 100 emails/day. Paid plans start at ~$20/month for unlimited emails.
