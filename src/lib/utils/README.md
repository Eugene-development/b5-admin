# Authentication Error Handling Utilities

This directory contains utilities for centralized error handling in the B5-Admin authentication system.

## Files

### `authErrorHandler.js`
Main error handling utilities with the following key functions:

#### Core Error Handlers
- `handleAuthError(error, operation, options)` - Centralized authentication error handling
- `handleNetworkError(error, options)` - Specialized network error handling  
- `handleTimeoutError(error, options)` - Specialized timeout error handling

#### Retry Mechanisms
- `retryAuthOperation(operation, operationType, options)` - Enhanced retry with exponential backoff
- `executeCriticalAuthOperation(operation, operationType, options)` - Wrapper for critical operations with automatic retry

#### Utility Functions
- `formatValidationErrors(validationErrors)` - Format API validation errors for display
- `isRecoverableError(error)` - Check if an error can be retried
- `createDebouncedErrorHandler(handler, delay)` - Create debounced error handlers

#### Constants
- `AUTH_ERROR_MESSAGES` - Predefined error messages in Russian
- `CRITICAL_OPERATIONS` - List of operations that should use retry mechanism

### `authWithErrorHandling.js`
Enhanced versions of auth API functions with integrated error handling:

- `loginUser(email, password, remember, options)` - Login with error handling and retry
- `registerUser(userData, options)` - Registration with error handling
- `logoutUser(options)` - Logout with error handling
- `getCurrentUser(options)` - Get user data with error handling
- `sendEmailVerification(options)` - Send verification email with error handling
- `resendEmailVerification(options)` - Resend verification email with error handling
- `verifyEmail(id, hash, signature, options)` - Verify email with error handling
- `batchAuthOperations(operations, options)` - Execute multiple operations in batch
- `authHealthCheck()` - Check authentication system health

## Usage Examples

### Basic Error Handling
```javascript
import { handleAuthError } from '$lib/utils/authErrorHandler.js';

try {
  // Some API call
} catch (error) {
  const errorInfo = handleAuthError(error, 'login', {
    showToast: true,
    redirectOnAuth: true
  });
  
  console.log('Error type:', errorInfo.type);
  console.log('Error message:', errorInfo.message);
}
```

### Using Enhanced Auth Functions
```javascript
import { loginUser } from '$lib/api/authWithErrorHandling.js';

// Login with automatic error handling and retry
const result = await loginUser('user@example.com', 'password', true, {
  showSuccessToast: true,
  showErrorToast: true,
  maxRetries: 2
});

if (result.success) {
  console.log('Login successful:', result.user);
} else {
  console.log('Login failed:', result.message);
  console.log('Validation errors:', result.formattedErrors);
}
```

### Retry Mechanism
```javascript
import { retryAuthOperation, CRITICAL_OPERATIONS } from '$lib/utils/authErrorHandler.js';

const result = await retryAuthOperation(
  () => someApiCall(),
  CRITICAL_OPERATIONS.LOGIN,
  {
    maxRetries: 3,
    initialDelay: 1000,
    exponentialBackoff: true,
    showRetryToasts: true
  }
);
```

### Custom Error Handling
```javascript
import { createDebouncedErrorHandler } from '$lib/utils/authErrorHandler.js';

const debouncedHandler = createDebouncedErrorHandler((error) => {
  console.error('Debounced error:', error);
}, 1000);

// Multiple rapid calls will be debounced
debouncedHandler(error1);
debouncedHandler(error2); // Only this one will execute after 1 second
```

## Integration with Toast System

The error handlers automatically integrate with the existing toast system:

- Error messages are displayed as error toasts
- Success messages are displayed as success toasts  
- Retry attempts show warning toasts
- Network errors show persistent toasts (don't auto-dismiss)

## Configuration Options

Most functions accept an options object with these common properties:

- `showToast: boolean` - Whether to show toast notifications (default: true)
- `showSuccessToast: boolean` - Whether to show success toasts (default: true)
- `showErrorToast: boolean` - Whether to show error toasts (default: true)
- `showRetryToasts: boolean` - Whether to show retry attempt toasts (default: true)
- `maxRetries: number` - Maximum retry attempts (default: varies by operation)
- `redirectOnAuth: boolean` - Whether to redirect on auth errors (default: true)
- `customMessage: string` - Custom error message to display

## Error Types

The system recognizes these error types:

- `network` - Network connectivity issues
- `timeout` - Request timeout errors
- `unauthorized` - 401 authentication errors
- `forbidden` - 403 authorization errors
- `validation` - 422 validation errors
- `rate_limited` - 429 rate limiting errors
- `server` - Generic server errors

## Testing

Tests are located in `__tests__/authErrorHandler.test.js` and cover:

- All error handling functions
- Retry mechanisms with different scenarios
- Validation error formatting
- Debounced error handling
- Error type detection

Run tests with:
```bash
npm test -- --run src/lib/utils/__tests__/authErrorHandler.test.js
```