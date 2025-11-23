# Backend Configuration for httpOnly Cookies

## Overview

This document describes the required backend changes to support httpOnly cookie authentication for the b5-admin frontend.

## Required Changes

### 1. Login Endpoint (`POST /api/login`)

The login endpoint must set an httpOnly cookie named `b5_auth_token` containing the JWT token.

**Laravel Example:**

```php
public function login(Request $request)
{
    // Validate credentials
    $credentials = $request->validate([
        'email' => 'required|email',
        'password' => 'required',
        'remember' => 'boolean'
    ]);

    // Attempt authentication
    if (!Auth::attempt(['email' => $credentials['email'], 'password' => $credentials['password']])) {
        return response()->json(['message' => 'Invalid credentials'], 401);
    }

    $user = Auth::user();

    // Generate JWT token
    $token = JWTAuth::fromUser($user);

    // Set httpOnly cookie
    $cookie = cookie(
        'b5_auth_token',           // Cookie name
        $token,                     // JWT token
        config('jwt.ttl'),          // Expiration time (minutes)
        '/',                        // Path
        config('app.domain'),       // Domain (null for same domain)
        config('app.env') === 'production', // Secure (HTTPS only in production)
        true,                       // HttpOnly
        false,                      // Raw
        'lax'                       // SameSite
    );

    return response()->json([
        'success' => true,
        'user' => $user,
        'token' => $token,  // Also return in response for client-side storage (optional)
        'message' => 'Login successful'
    ])->cookie($cookie);
}
```

### 2. Logout Endpoint (`POST /api/logout`)

The logout endpoint must clear the httpOnly cookie.

**Laravel Example:**

```php
public function logout(Request $request)
{
    try {
        // Invalidate JWT token if possible
        JWTAuth::invalidate(JWTAuth::getToken());
    } catch (\Exception $e) {
        // Token might already be invalid
    }

    // Clear the httpOnly cookie
    $cookie = cookie()->forget('b5_auth_token');

    return response()->json([
        'success' => true,
        'message' => 'Logout successful'
    ])->cookie($cookie);
}
```

### 3. Register Endpoint (`POST /api/register`)

Similar to login, the register endpoint should set the httpOnly cookie.

**Laravel Example:**

```php
public function register(Request $request)
{
    // Validate registration data
    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|string|email|max:255|unique:users',
        'password' => 'required|string|min:8|confirmed',
        // ... other fields
    ]);

    // Create user
    $user = User::create([
        'name' => $validated['name'],
        'email' => $validated['email'],
        'password' => Hash::make($validated['password']),
        // ... other fields
    ]);

    // Generate JWT token
    $token = JWTAuth::fromUser($user);

    // Set httpOnly cookie
    $cookie = cookie(
        'b5_auth_token',
        $token,
        config('jwt.ttl'),
        '/',
        config('app.domain'),
        config('app.env') === 'production',
        true,
        false,
        'lax'
    );

    return response()->json([
        'success' => true,
        'user' => $user,
        'token' => $token,
        'message' => 'Registration successful'
    ])->cookie($cookie);
}
```

### 4. CORS Configuration

Ensure CORS is configured to allow credentials.

**config/cors.php:**

```php
return [
    'paths' => ['api/*', 'graphql'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'http://localhost:5173',  // Vite dev server
        'http://localhost:4173',  // Vite preview
        env('FRONTEND_URL'),      // Production frontend URL
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,  // IMPORTANT: Must be true
];
```

### 5. Cookie Configuration

**config/session.php:**

```php
return [
    // ...
    'domain' => env('SESSION_DOMAIN', null),
    'secure' => env('SESSION_SECURE_COOKIE', false),
    'http_only' => true,
    'same_site' => 'lax',
];
```

## Cookie Specifications

- **Name**: `b5_auth_token`
- **Value**: JWT token (string)
- **HttpOnly**: `true` (prevents JavaScript access)
- **Secure**: `true` in production (HTTPS only)
- **SameSite**: `lax` (protection against CSRF)
- **Path**: `/`
- **Domain**: Same domain as frontend (or parent domain for subdomains)
- **MaxAge**: Same as JWT expiration time

## Testing

### Test Login Cookie

```bash
curl -X POST http://localhost:8001/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  -c cookies.txt -v
```

Check that the response includes a `Set-Cookie` header with `b5_auth_token`.

### Test Authenticated Request

```bash
curl -X GET http://localhost:8000/graphql \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"query":"{ users { id name email } }"}' \
  -v
```

The cookie should be automatically sent with the request.

### Test Logout

```bash
curl -X POST http://localhost:8001/api/logout \
  -b cookies.txt \
  -c cookies.txt \
  -v
```

Check that the `Set-Cookie` header clears the `b5_auth_token` cookie.

## Security Considerations

1. **HTTPS in Production**: Always use HTTPS in production and set `Secure` flag to `true`
2. **SameSite Protection**: Use `lax` or `strict` to prevent CSRF attacks
3. **HttpOnly**: Prevents XSS attacks by making cookie inaccessible to JavaScript
4. **Domain**: Set appropriate domain to prevent cookie leakage
5. **Expiration**: Set appropriate expiration time matching JWT validity

## Frontend Integration

The frontend has been updated to:
- Send `credentials: 'include'` with all fetch requests
- Read JWT from `event.locals.token` in server-side load functions
- Extract user data from JWT payload in `hooks.server.js`

## Troubleshooting

### Cookie Not Being Set

- Check CORS `supports_credentials` is `true`
- Verify frontend sends `credentials: 'include'`
- Check cookie domain matches frontend domain
- Verify response includes `Set-Cookie` header

### Cookie Not Being Sent

- Check `credentials: 'include'` in fetch options
- Verify cookie domain allows sending to API domain
- Check cookie hasn't expired
- Verify SameSite policy allows request

### 401 Errors

- Check JWT token is valid and not expired
- Verify backend correctly reads `Authorization` header or cookie
- Check JWT secret is correct
- Verify user exists and has proper permissions
