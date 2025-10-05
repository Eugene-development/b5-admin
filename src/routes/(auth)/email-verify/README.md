# Email Verification Page

This page handles email verification for B5-Admin users. It supports both automatic verification via email links and manual resend functionality.

## Features

### Automatic Verification
- Processes verification links from email with `id`, `hash`, and `signature` parameters
- Automatically verifies the email and redirects to dashboard on success
- Shows appropriate error messages on failure

### Manual Verification
- Displays pending verification state for users who visit the page directly
- Shows the user's email address that needs verification
- Provides a resend button with cooldown timer (60 seconds)
- Allows navigation back to dashboard

### Authentication Checks
- Redirects unauthenticated users to login page with return URL
- Redirects users with already verified emails to dashboard
- Shows success message for already verified users

## URL Parameters

The page accepts the following URL parameters for email verification links:

- `id` - User ID from the verification email
- `hash` - Hash from the verification email

Example verification URL:
```
/email-verify?id=123&hash=abc123
```

## States

The page has four main states:

1. **Pending** - User needs to check their email for verification link
2. **Verifying** - Processing a verification link from email
3. **Success** - Email successfully verified
4. **Error** - Verification failed or link invalid

## Integration

### Auth Store Integration
- Uses `authState` for user data and loading states
- Calls `verifyEmailAddress()` for link verification
- Calls `resendEmailVerificationNotification()` for resending emails
- Uses `isAuthenticated()` to check authentication status

### Navigation Integration
- Redirects to `/login` for unauthenticated users
- Redirects to `/dashboard` after successful verification
- Preserves return URL for post-login redirect

### Toast Integration
- Shows success messages for completed actions
- Shows error messages for failed operations
- Uses existing toast system from `toastStore.js`

## Components Used

- `LoadingOverlay` - Shows loading state during verification
- Standard Tailwind CSS styling matching B5-Admin design
- Responsive design for mobile and desktop

## Error Handling

The page handles various error scenarios:

- Invalid or expired verification links
- Network errors during API calls
- Already verified email addresses
- Unauthenticated access attempts
- Rate limiting on resend requests

## Accessibility

- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader friendly messages
- High contrast design elements
- Semantic HTML structure

## Testing

The page includes comprehensive error handling and state management. Key test scenarios:

- Authentication checks and redirects
- Verification link processing
- Resend functionality with cooldown
- Error state handling
- Navigation between states

## Usage in Registration Flow

This page is automatically used in the registration flow:

1. User registers via `/register`
2. Registration redirects to `/email-verify`
3. User receives verification email
4. User clicks link in email
5. Page processes verification and redirects to dashboard

## Security Considerations

- All verification parameters are validated server-side
- Expired or invalid links are properly rejected
- Rate limiting prevents spam resend requests
- Secure token handling via auth store
- HTTPS required for production use