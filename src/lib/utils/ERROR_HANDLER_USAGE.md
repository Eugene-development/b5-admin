# Error Handler Usage Guide

This document explains how to use the centralized error handling utilities in the B5-agent application.

## Overview

The error handler provides consistent error processing across the application, handling different types of errors (validation, authentication, authorization, network, server) and formatting them for display in the UI.

## Core Components

### 1. Error Handler Module (`errorHandler.svelte.js`)

The main error handling utilities:

```javascript
import { 
  handleApiError,
  ERROR_TYPES,
  HTTP_STATUS,
  createDisplayMessages,
  getFirstErrorMessage,
  hasErrors,
  clearErrorFields,
  mergeErrors
} from './errorHandler.svelte.js';
```

### 2. Error Display Component (`ErrorDisplay.svelte`)

A reusable component for displaying errors consistently:

```svelte
<ErrorDisplay 
  errors={errorObject} 
  field="email"           <!-- Optional: show errors for specific field -->
  showFirst={true}        <!-- Optional: show only first error -->
  className="custom-css"  <!-- Optional: additional CSS classes -->
  separator=" | "         <!-- Optional: separator for multiple messages -->
/>
```

### 3. Integration with Auth Module

The auth module automatically uses the centralized error handler:

```javascript
import { 
  authState, 
  clearErrorFields, 
  hasAuthErrors, 
  getFirstAuthError 
} from './auth.svelte.js';
```

## Usage Examples

### Basic Error Handling

```javascript
try {
  const response = await api.post('/endpoint', data);
} catch (error) {
  // Centralized error handling
  const formattedErrors = handleApiError(error);
  
  // Use the formatted errors in your component
  setErrors(formattedErrors);
}
```

### Displaying Errors in Components

```svelte
<script>
  import ErrorDisplay from './ErrorDisplay.svelte';
  import { authState } from './auth.svelte.js';
</script>

<!-- Show all errors -->
<ErrorDisplay errors={authState.errors} />

<!-- Show only validation errors for email field -->
<ErrorDisplay errors={authState.errors} field="email" />

<!-- Show first error only (useful for notifications) -->
<ErrorDisplay errors={authState.errors} showFirst={true} />
```

### Working with Error States

```javascript
// Check if there are any errors
if (hasErrors(errorObject)) {
  // Handle errors
}

// Get first error message for notifications
const firstError = getFirstErrorMessage(errorObject);

// Clear specific error fields
const updatedErrors = clearErrorFields(errorObject, ['email', 'password']);

// Merge multiple error objects
const allErrors = mergeErrors(validationErrors, networkErrors);

// Create display-friendly messages
const displayMessages = createDisplayMessages(errorObject, ' | ');
```

## Error Types

The error handler categorizes errors into these types:

- **VALIDATION** (422): Form validation errors
- **AUTHENTICATION** (401): Login/authentication failures
- **AUTHORIZATION** (403): Permission denied errors
- **NETWORK**: Connection/network issues
- **SERVER** (5xx): Server-side errors
- **UNKNOWN**: Unrecognized errors

## Error Object Format

Errors are formatted as objects with field-specific message arrays:

```javascript
{
  email: ['Email is required', 'Email must be valid'],
  password: ['Password is too short'],
  auth: ['Authentication failed'],
  network: ['Connection timeout'],
  general: ['An unexpected error occurred']
}
```

## Integration with Forms

### Login Form Example

```svelte
<script>
  import { login, authState, clearErrorFields } from './auth.svelte.js';
  import ErrorDisplay from './ErrorDisplay.svelte';

  let email = $state('');
  let clientErrors = $state({});

  function handleInputChange(field) {
    // Clear server-side errors for this field
    clearErrorFields(field);
    
    // Clear client-side errors
    if (clientErrors[field]) {
      const newErrors = { ...clientErrors };
      delete newErrors[field];
      clientErrors = newErrors;
    }
  }

  async function handleSubmit() {
    try {
      await login(email, password);
    } catch (error) {
      // Error is automatically handled by auth module
    }
  }
</script>

<form onsubmit={handleSubmit}>
  <!-- General errors -->
  <ErrorDisplay errors={authState.errors} showFirst={true} />
  
  <input 
    bind:value={email}
    oninput={() => handleInputChange('email')}
  />
  
  <!-- Field-specific errors -->
  <ErrorDisplay 
    errors={{...clientErrors, ...authState.errors}} 
    field="email" 
  />
</form>
```

## Best Practices

1. **Use centralized handling**: Always use `handleApiError()` for API errors
2. **Clear field errors on input**: Clear errors when user starts typing
3. **Show appropriate error types**: Use field-specific errors for forms, general errors for notifications
4. **Provide user-friendly messages**: The error handler provides default messages, but you can customize them
5. **Handle loading states**: Show loading indicators during API calls
6. **Accessibility**: Error messages include proper ARIA attributes

## Customization

### Custom Error Messages

```javascript
const customError = handleApiError(error, {
  redirectOnAuth: false,  // Don't redirect on auth errors
  authRedirectPath: '/custom-login'  // Custom redirect path
});
```

### Custom Error Display

```svelte
<!-- Custom styling -->
<ErrorDisplay 
  errors={errors} 
  className="my-custom-error-style"
/>

<style>
  :global(.my-custom-error-style .error-message) {
    background: #custom-color;
    border-radius: 8px;
  }
</style>
```

## Testing

The error handler includes comprehensive tests. Run them with:

```bash
npm test -- errorHandler.test.js
```

## Requirements Fulfilled

- **6.1**: Validation error handling with field-specific messages
- **6.2**: Authentication and authorization error handling
- **6.3**: Network error handling with user-friendly messages
- **6.4**: Server error handling and unknown error fallbacks