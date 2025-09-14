# B5-Admin Authentication API

This directory contains the authentication infrastructure for B5-Admin, implementing Laravel Sanctum integration.

## Files Overview

### `config.js`
- API configuration and endpoints for Laravel Sanctum
- Token management functions (get, set, remove from localStorage)
- User data management functions
- Storage keys and headers configuration

### `client.js`
- HTTP client with Bearer token support
- Automatic error handling for different HTTP status codes
- Request timeout management
- Automatic token cleanup on 401 errors

### `auth.js`
- Specialized authentication API functions
- Login, register, logout operations
- Email verification functions
- User data retrieval

## Usage Examples

### Basic Authentication Flow

```javascript
import { loginUser, getCurrentUser, logoutUser } from '$lib/api/auth.js';
import { setAuthToken, setUserData, removeAuthToken } from '$lib/api/config.js';

// Login
const loginResult = await loginUser('user@example.com', 'password', true);
if (loginResult.success) {
  setAuthToken(loginResult.token);
  setUserData(loginResult.user);
}

// Get current user
const userResult = await getCurrentUser();
if (userResult.success) {
  console.log('Current user:', userResult.user);
}

// Logout
const logoutResult = await logoutUser();
if (logoutResult.success) {
  removeAuthToken();
}
```

### Registration Flow

```javascript
import { registerUser } from '$lib/api/auth.js';

const userData = {
  name: 'John Doe',
  email: 'john@example.com',
  password: 'password123',
  password_confirmation: 'password123',
  city: 'New York',
  terms_accepted: true
};

const result = await registerUser(userData);
if (result.success) {
  console.log('Registration successful');
} else {
  console.log('Registration errors:', result.errors);
}
```

### Direct HTTP Client Usage

```javascript
import { get, post } from '$lib/api/client.js';

// GET request with authentication
const response = await get('/api/protected-endpoint', {}, true);

// POST request without authentication
const response = await post('/api/public-endpoint', { data: 'value' });
```

## Error Handling

The API client automatically handles common error scenarios:

- **401 Unauthorized**: Clears token and redirects to login
- **422 Validation Error**: Returns validation errors in response
- **Network Errors**: Returns user-friendly error messages
- **Timeouts**: Automatically aborts requests after 10 seconds

## Configuration

Environment variables required:
- `VITE_API_AUTH`: Base URL for the authentication API (e.g., "http://localhost:8001")

## Testing

Run tests with:
```bash
npm test -- --run src/lib/api/__tests__
```

All API functions are fully tested with unit tests covering success and error scenarios.