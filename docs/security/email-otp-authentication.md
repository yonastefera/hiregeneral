# Email OTP authentication

HireGeneral uses a passwordless email-first flow for `/signin`, `/signup`, and
`/forgot-password`. An email address receives a six-digit code, and a successful
verification creates the Supabase session. Existing users are routed by their
stored role; users without a role continue to `/auth/choose-role`.

Google OAuth remains available as an alternative sign-in method. The legacy
password endpoints remain temporarily for already-issued recovery links and
rollback safety, but the public UI no longer creates or requests passwords.

## Supabase production configuration

Configure this separately in every Supabase project used by HireGeneral.

### Custom SMTP

In **Authentication → Emails → SMTP Settings**, enable custom SMTP and use:

- Sender name: `HireGeneral`
- Sender email: `no-reply@mail.hiregeneral.com`
- Host: `smtp.resend.com`
- Port: `465`
- Username: `resend`
- Password: a Resend API key with sending access

Never commit the SMTP password or expose it through a `NEXT_PUBLIC_` variable.

### Magic Link / OTP template

In **Authentication → Emails → Templates → Magic Link**, use `{{ .Token }}`.
Do not include `{{ .ConfirmationURL }}` in this template: Supabase sends a
clickable magic link when that variable is present and sends an OTP when the
token variable is present.

Suggested subject:

```text
{{ .Token }} is your HireGeneral sign-in code
```

Suggested body:

```html
<h2>Your HireGeneral sign-in code</h2>
<p>Enter this code in the HireGeneral sign-in page:</p>
<p style="font-size:32px;font-weight:700;letter-spacing:8px">{{ .Token }}</p>
<p>
  This code expires shortly. If you did not request it, you can ignore this
  email.
</p>
```

Keep the template transactional and disable provider click tracking for auth
emails.

## Verification checklist

1. Request a code for an existing job seeker and confirm it routes to `/jobs`.
2. Request a code for an existing recruiter and confirm it routes to the
   employer dashboard.
3. Request a code for a new email and confirm it routes to role selection.
4. Confirm an invalid and an expired code show the same safe error.
5. Confirm resending is disabled for 60 seconds and repeated requests receive
   `429` responses.
6. Confirm the browser receives the Supabase session cookie only after a valid
   code.
