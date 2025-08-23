# Manual Authentication Testing Guide for B5-Admin

This guide provides step-by-step instructions to manually test the complete authentication system.

## Prerequisites

1. Ensure the B5-Admin application is running (`npm run dev`)
2. Ensure the Laravel authentication API is running and accessible
3. Have access to email for verification testing

## Test Scenarios

### 1. Full Registration → Email Verification → Login → Access → Logout Flow

#### Step 1: Registration
1. Navigate to `/register`
2. Fill out the registration form:
   - **Name**: Test User
   - **City**: Test City  
   - **Email**: test@example.com (use a real email you can access)
   - **Password**: password123
   - **Confirm Password**: password123
   - **Terms**: Check the terms acceptance checkbox
3. Click "Зарегистрироваться"
4. **Expected**: Success toast message, redirect to `/email-verify`

#### Step 2: Email Verification
1. Should be on `/email-verify` page
2. **Expected**: Page shows "Проверьте вашу почту" with your email address
3. Check your email for verification message
4. Click the verification link in the email
5. **Expected**: Redirect back to app with success message, email marked as verified

#### Step 3: Login
1. Navigate to `/login`
2. Enter credentials:
   - **Email**: test@example.com
   - **Password**: password123
   - **Remember me**: Check this box
3. Click "Войти"
4. **Expected**: Success toast, redirect to `/dashboard`

#### Step 4: Access Protected Pages
1. Should be on `/dashboard`
2. **Expected**: Dashboard content visible, user info in header
3. Navigate to `/agents`
4. **Expected**: Agents page loads without redirect
5. Navigate to `/projects`
6. **Expected**: Projects page loads without redirect

#### Step 5: Logout
1. Click the user menu in the header
2. Click "Выйти"
3. **Expected**: Confirmation dialog appears
4. Confirm logout
5. **Expected**: Success toast, redirect to `/login`, user info cleared

### 2. Protected Routes Testing

#### Test Unauthenticated Access
1. Ensure you're logged out
2. Navigate directly to `/dashboard`
3. **Expected**: Redirect to `/login?redirectTo=%2Fdashboard`
4. Navigate directly to `/agents`
5. **Expected**: Redirect to `/login?redirectTo=%2Fagents`

#### Test Redirect After Login
1. From the login page with redirectTo parameter
2. Login with valid credentials
3. **Expected**: Redirect to the originally requested page

#### Test Email Verification Requirement
1. Register a new user but don't verify email
2. Try to access pages that require email verification
3. **Expected**: Redirect to `/email-verify`

### 3. Error Handling Scenarios

#### Invalid Login Credentials
1. Navigate to `/login`
2. Enter invalid credentials:
   - **Email**: test@example.com
   - **Password**: wrongpassword
3. Click "Войти"
4. **Expected**: Error toast with "Неверный email или пароль"

#### Registration with Existing Email
1. Navigate to `/register`
2. Try to register with an email that already exists
3. **Expected**: Error toast with "Пользователь с таким email уже существует"

#### Form Validation Errors
1. Navigate to `/login`
2. Submit form with empty fields
3. **Expected**: Validation errors under each field
4. Navigate to `/register`
5. Submit form with invalid data (short password, mismatched passwords, etc.)
6. **Expected**: Appropriate validation errors

#### Network Error Simulation
1. Disconnect from internet or stop the API server
2. Try to login
3. **Expected**: Error toast with network error message

### 4. Remember Me Functionality

#### Test Token Persistence
1. Login with "Remember me" checked
2. Close the browser completely
3. Reopen browser and navigate to the app
4. **Expected**: Should be automatically logged in

#### Test Token Expiration
1. Login normally
2. Manually clear the auth token from localStorage
3. Refresh the page
4. **Expected**: Should be redirected to login

### 5. Integration with B5-Admin Components

#### Toast Notifications
1. Perform various actions (login, logout, errors)
2. **Expected**: Appropriate toast notifications appear and disappear

#### Loading States
1. Perform login/registration actions
2. **Expected**: Loading overlays appear during API calls

#### User Display in Layout
1. Login successfully
2. **Expected**: User name and email appear in the header/sidebar
3. User avatar placeholder is displayed

#### Mobile Menu Integration
1. Test on mobile or narrow screen
2. **Expected**: Mobile menu shows user info and logout option when authenticated

### 6. Dashboard and Admin Pages Access

#### Dashboard Access
1. Login successfully
2. Navigate to `/dashboard`
3. **Expected**: Dashboard content loads, shows welcome message

#### Admin Pages Protection
1. Ensure all admin pages (`/agents`, `/projects`, `/clients`, etc.) are protected
2. **Expected**: All require authentication to access

### 7. Form Validation and User Experience

#### Client-side Validation
1. Test all form fields for proper validation
2. **Expected**: Immediate feedback on invalid input

#### Server-side Validation
1. Test with data that passes client validation but fails server validation
2. **Expected**: Server errors are properly displayed

#### Form State Management
1. Fill forms partially, navigate away, come back
2. **Expected**: Form state is handled appropriately

## Test Results Checklist

Mark each test as ✅ Pass, ❌ Fail, or ⚠️ Issue:

### Core Functionality
- [ ] Registration flow works end-to-end
- [ ] Email verification works
- [ ] Login works with valid credentials
- [ ] Logout works and clears state
- [ ] Remember me persists authentication
- [ ] Protected routes redirect unauthenticated users
- [ ] Redirect after login works correctly

### Error Handling
- [ ] Invalid login credentials show appropriate error
- [ ] Registration errors are handled properly
- [ ] Form validation works on client and server
- [ ] Network errors are handled gracefully
- [ ] Token expiration is handled correctly

### User Experience
- [ ] Loading states are shown during operations
- [ ] Toast notifications work correctly
- [ ] User information is displayed in layout
- [ ] Mobile menu works with authentication
- [ ] Form validation provides good feedback

### Integration
- [ ] Dashboard loads for authenticated users
- [ ] All admin pages are properly protected
- [ ] Navigation works correctly
- [ ] Layout updates based on auth state

## Common Issues and Solutions

### Issue: Email verification not working
- **Check**: Email server configuration
- **Check**: Verification link format
- **Check**: API endpoint accessibility

### Issue: Token not persisting
- **Check**: localStorage is working
- **Check**: Token format is correct
- **Check**: Browser settings allow localStorage

### Issue: Redirects not working
- **Check**: Route configuration
- **Check**: ProtectedRoute component implementation
- **Check**: Navigation logic

### Issue: API errors
- **Check**: API server is running
- **Check**: CORS configuration
- **Check**: API endpoint URLs

## Performance Considerations

### Loading Times
- [ ] Initial app load is reasonable
- [ ] Authentication check is fast
- [ ] API calls complete in reasonable time
- [ ] Page transitions are smooth

### Memory Usage
- [ ] No memory leaks in auth state
- [ ] Proper cleanup on logout
- [ ] Efficient state management

## Security Verification

### Token Security
- [ ] Tokens are stored securely
- [ ] Tokens are cleared on logout
- [ ] Invalid tokens are handled properly

### Route Protection
- [ ] All admin routes are protected
- [ ] No unauthorized access possible
- [ ] Proper error handling for auth failures

## Browser Compatibility

Test in multiple browsers:
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

## Mobile Testing

Test on mobile devices:
- [ ] Touch interactions work
- [ ] Mobile menu functions correctly
- [ ] Forms are usable on mobile
- [ ] Responsive design works

## Final Verification

After completing all tests:
- [ ] All core functionality works as expected
- [ ] Error handling is robust
- [ ] User experience is smooth
- [ ] Integration with existing components is seamless
- [ ] Performance is acceptable
- [ ] Security measures are in place

## Notes

Use this section to record any issues found during testing:

```
Date: ___________
Tester: ___________

Issues Found:
1. 
2. 
3. 

Recommendations:
1. 
2. 
3. 
```