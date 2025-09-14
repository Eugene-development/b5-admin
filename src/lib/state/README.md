# Authentication State Store

This directory contains the centralized authentication state management for B5-Admin using Svelte 5 runes.

## Auth Store (`auth.svelte.js`)

The auth store provides centralized state management for user authentication, including login, registration, logout, and email verification functionality.

### Usage

```javascript
import { 
  authState, 
  initializeAuth, 
  login, 
  register, 
  logout, 
  checkAuth,
  sendEmailVerificationNotification,
  isAuthenticated,
  getCurrentUserData,
  isEmailVerified,
  isLoading,
  clearError
} from '$lib/state/auth.svelte.js';

// Initialize authentication on app startup
await initializeAuth();

// Login user
const success = await login('user@example.com', 'password', true);
if (success) {
  console.log('Login successful');
} else {
  console.log('Login failed:', authState.loginError);
}

// Register new user
const userData = {
  name: 'John Doe',
  email: 'john@example.com',
  password: 'password123',
  password_confirmation: 'password123',
  city: 'New York',
  terms_accepted: true
};

const registerSuccess = await register(userData);
if (registerSuccess) {
  console.log('Registration successful');
}

// Check authentication status
if (isAuthenticated()) {
  console.log('User is authenticated:', getCurrentUserData());
}

// Logout user
await logout();
```

### State Structure

The `authState` object contains:

```javascript
{
  // User data
  user: null,                    // Current user object or null
  
  // Authentication status
  isAuthenticated: false,        // Whether user is authenticated
  emailVerified: false,          // Whether user's email is verified
  
  // Loading states
  loading: false,                // General loading state
  loginLoading: false,           // Login operation in progress
  registerLoading: false,        // Registration operation in progress
  logoutLoading: false,          // Logout operation in progress
  emailVerificationLoading: false, // Email verification in progress
  
  // Error states
  error: null,                   // General error message
  loginError: null,              // Login-specific error
  registerError: null,           // Registration-specific error
  emailVerificationError: null,  // Email verification error
  
  // Token data
  token: null,                   // Current auth token
  
  // Initialization status
  initialized: false             // Whether store has been initialized
}
```

### Functions

#### Core Authentication
- `initializeAuth()` - Initialize auth state from localStorage (call on app startup)
- `login(email, password, remember)` - Login user
- `register(userData)` - Register new user
- `logout()` - Logout current user
- `checkAuth()` - Check and refresh authentication status

#### Email Verification
- `sendEmailVerificationNotification()` - Send email verification
- `resendEmailVerificationNotification()` - Resend email verification
- `markEmailAsVerified()` - Mark email as verified (after successful verification)

#### Utility Functions
- `clearError()` - Clear all error states
- `isAuthenticated()` - Get authentication status
- `getCurrentUserData()` - Get current user data
- `isEmailVerified()` - Get email verification status
- `isLoading()` - Check if any operation is in progress
- `getError()` - Get current error message

### Integration with Components

```svelte
<script>
  import { authState, login, isLoading } from '$lib/state/auth.svelte.js';
  
  let email = '';
  let password = '';
  
  async function handleLogin() {
    const success = await login(email, password, false);
    if (success) {
      // Handle successful login
      goto('/dashboard');
    }
  }
</script>

{#if isLoading()}
  <div>Loading...</div>
{:else}
  <form on:submit|preventDefault={handleLogin}>
    <input bind:value={email} type="email" placeholder="Email" />
    <input bind:value={password} type="password" placeholder="Password" />
    <button type="submit">Login</button>
  </form>
  
  {#if authState.loginError}
    <div class="error">{authState.loginError}</div>
  {/if}
{/if}
```

### Requirements Fulfilled

This auth store implementation fulfills the following requirements from the specification:

- **6.1**: Centralized state management with reactive updates across components
- **6.2**: Error state management with specific error types for different operations
- **6.3**: Loading state management for all authentication operations
- **6.4**: Email verification functionality with proper state management

The store integrates seamlessly with the existing API layer (tasks 1 and 2) and provides the foundation for the UI components (tasks 4-12).