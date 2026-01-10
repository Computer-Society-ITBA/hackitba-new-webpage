# Vercel Cron Jobs Documentation

This application uses Vercel Cron Jobs to automate recurring tasks.

## Configured Cron Jobs

### 1. Onboarding Reminders
- **Path**: `/api/cron/onboarding-reminders`
- **Schedule**: `0 9 * * *` (Daily at 9:00 AM UTC)
- **Purpose**: Send reminder emails to users who haven't completed onboarding
- **Target Users**: All users with `onboardingStep < 3`

### 2. Submission Deadline Enforcement
- **Path**: `/api/cron/submission-deadline`
- **Schedule**: `0 0 * * *` (Daily at midnight UTC)
- **Purpose**: 
  - Close events that have passed their end date
  - Notify participants who haven't submitted projects
- **Actions**:
  - Updates event status from "active" to "completed"
  - Sends notifications to participants without submissions

## Environment Variables Required

```bash
CRON_SECRET=your-secret-key-here
NEXT_PUBLIC_APP_URL=https://your-app-url.com
```

## Security

All cron endpoints are protected with a bearer token. The request must include:

```
Authorization: Bearer ${CRON_SECRET}
```

## Testing Cron Jobs

### Test Endpoint
```bash
curl https://your-app.vercel.app/api/cron/test
```

### Test Onboarding Reminders
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-app.vercel.app/api/cron/onboarding-reminders
```

### Test Submission Deadline
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-app.vercel.app/api/cron/submission-deadline
```

## Monitoring

Check cron job execution logs in Vercel Dashboard:
1. Go to your project
2. Navigate to "Deployments"
3. Click on a deployment
4. View "Functions" tab
5. Check logs for cron endpoints

## Email Integration

Currently, emails are logged in development mode. To enable actual email sending:

1. Choose an email provider (SendGrid, Resend, etc.)
2. Add provider credentials to environment variables
3. Update `lib/email/send-email.ts` with provider integration

## Cron Schedule Format

Vercel uses standard cron syntax:
```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-7, Sunday = 0 or 7)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

Examples:
- `0 9 * * *` - Daily at 9:00 AM
- `0 0 * * *` - Daily at midnight
- `0 */6 * * *` - Every 6 hours
- `0 0 * * 0` - Weekly on Sunday at midnight
