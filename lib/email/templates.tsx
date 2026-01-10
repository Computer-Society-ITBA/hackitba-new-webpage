export const ONBOARDING_REMINDER_TEMPLATE = (name: string, role: string, onboardingStep: number) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: 'Inter', sans-serif;
      background-color: #14192d;
      color: #afeff3;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: rgba(30, 38, 66, 0.6);
      border: 1px solid rgba(175, 239, 243, 0.2);
      border-radius: 8px;
      padding: 40px;
    }
    .title {
      font-family: 'Courier New', monospace;
      color: #ef802f;
      font-size: 24px;
      margin-bottom: 20px;
    }
    .content {
      line-height: 1.6;
      margin-bottom: 30px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #ef802f;
      color: #14192d;
      text-decoration: none;
      border-radius: 4px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="title">[HackITBA] Complete Your Onboarding</div>
    <div class="content">
      <p>Hello ${name},</p>
      <p>We noticed you haven't completed your ${role} onboarding yet (Step ${onboardingStep + 1} of 3).</p>
      <p>Complete your profile to get full access to all HackITBA 2026 features and connect with mentors, sponsors, and other participants.</p>
    </div>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">Complete Onboarding →</a>
  </div>
</body>
</html>
`

export const SUBMISSION_DEADLINE_TEMPLATE = (name: string, eventTitle: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: 'Inter', sans-serif;
      background-color: #14192d;
      color: #afeff3;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: rgba(30, 38, 66, 0.6);
      border: 1px solid rgba(175, 239, 243, 0.2);
      border-radius: 8px;
      padding: 40px;
    }
    .title {
      font-family: 'Courier New', monospace;
      color: #ef802f;
      font-size: 24px;
      margin-bottom: 20px;
    }
    .content {
      line-height: 1.6;
      margin-bottom: 30px;
    }
    .warning {
      background-color: rgba(239, 128, 47, 0.1);
      border-left: 4px solid #ef802f;
      padding: 15px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="title">[HackITBA] Submission Deadline Passed</div>
    <div class="content">
      <p>Hello ${name},</p>
      <div class="warning">
        <strong>The submission deadline for ${eventTitle} has passed.</strong>
      </div>
      <p>We noticed you didn't submit a project for this event. Don't worry - there will be more opportunities to participate in future hackathons!</p>
      <p>Stay tuned for upcoming events and keep building amazing projects.</p>
    </div>
  </div>
</body>
</html>
`
