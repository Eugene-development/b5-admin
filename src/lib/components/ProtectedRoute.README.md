# ProtectedRoute Component

The `ProtectedRoute` component provides authentication and authorization protection for administrative pages in B5-Admin. It automatically handles user authentication checks, email verification requirements, and redirects users to appropriate pages based on their authentication status.

## Features

- **Authentication Check**: Verifies if the user is logged in
- **Email Verification**: Optionally requires email verification
- **Automatic Redirects**: Redirects to login or email verification pages as needed
- **Loading States**: Shows loading spinner during authentication operations
- **Flexible Configuration**: Supports custom redirect URLs

## Usage

### Basic Protection (Authentication Only)

```svelte
<script>
  import { ProtectedRoute } from '$lib';
</script>

<ProtectedRoute>
  {#snippet children()}
    <div>
      <h1>Protected Admin Content</h1>
      <p>This content is only visible to authenticated users.</p>
    </div>
  {/snippet}
</ProtectedRoute>
```

### With Email Verification Required

```svelte
<script>
  import { ProtectedRoute } from '$lib';
</script>

<ProtectedRoute requireEmailVerification={true}>
  {#snippet children()}
    <div>
      <h1>Highly Protected Content</h1>
      <p>This content requires both authentication and email verification.</p>
    </div>
  {/snippet}
</ProtectedRoute>
```

### With Custom Redirect URL

```svelte
<script>
  import { ProtectedRoute } from '$lib';
</script>

<ProtectedRoute redirectTo="/dashboard">
  {#snippet children()}
    <div>
      <h1>Admin Panel</h1>
      <p>After login, user will be redirected to /dashboard</p>
    </div>
  {/snippet}
</ProtectedRoute>
```

### Protecting Entire Pages

You can wrap entire page content in a ProtectedRoute:

```svelte
<!-- src/routes/admin/+page.svelte -->
<script>
  import { ProtectedRoute } from '$lib';
  import { AgentsTable, ProjectsTable } from '$lib';
  
  let { data } = $props();
</script>

<ProtectedRoute requireEmailVerification={true}>
  {#snippet children()}
    <div class="admin-dashboard">
      <h1>Admin Dashboard</h1>
      
      <section>
        <h2>Agents</h2>
        <AgentsTable agents={data.agents} />
      </section>
      
      <section>
        <h2>Projects</h2>
        <ProjectsTable projects={data.projects} />
      </section>
    </div>
  {/snippet}
</ProtectedRoute>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `requireEmailVerification` | `boolean` | `false` | Whether to require email verification in addition to authentication |
| `redirectTo` | `string` | `undefined` | Custom URL to redirect to after successful login. If not provided, uses current page URL |
| `children` | `snippet` | required | Content to render when access is granted |

## Behavior

### Authentication Flow

1. **Initialization**: Component checks if auth state is initialized
2. **Authentication Check**: Verifies if user is authenticated
3. **Email Verification Check**: If `requireEmailVerification` is true, checks email verification status
4. **Access Decision**: Grants or denies access based on checks
5. **Redirect**: If access is denied, redirects to appropriate page

### Redirect Logic

- **Not Authenticated**: Redirects to `/login?redirectTo=<current-or-custom-url>`
- **Authenticated but Email Not Verified**: Redirects to `/email-verify`
- **Fully Authenticated**: Renders protected content

### Loading States

The component shows a loading spinner in these situations:
- Auth state is not yet initialized
- Authentication operations are in progress
- During redirect operations

## Integration with Auth System

The ProtectedRoute component integrates with the B5-Admin authentication system:

- Uses `authState` from `$lib/state/auth.svelte.js`
- Calls `initializeAuth()` if auth is not initialized
- Uses helper functions: `isAuthenticated()`, `isEmailVerified()`, `isLoading()`

## Error Handling

The component gracefully handles various error scenarios:
- Network connectivity issues during auth check
- Invalid or expired tokens
- Server errors during authentication

## Accessibility

- Provides proper loading indicators for screen readers
- Maintains focus management during redirects
- Uses semantic HTML structure

## Examples in Existing Routes

To protect existing routes, wrap the main content:

```svelte
<!-- Before -->
<main>
  <h1>Agents</h1>
  <AgentsTable agents={data.agents} />
</main>

<!-- After -->
<ProtectedRoute>
  {#snippet children()}
    <main>
      <h1>Agents</h1>
      <AgentsTable agents={data.agents} />
    </main>
  {/snippet}
</ProtectedRoute>
```

## Testing

The component includes comprehensive tests covering:
- Authentication state scenarios
- Email verification requirements
- Redirect behavior
- Loading states
- Error conditions

Run tests with:
```bash
npm test -- ProtectedRoute.test.js
```

## Requirements Satisfied

This component satisfies the following requirements from the specification:

- **4.1**: Redirects unauthenticated users to login page
- **4.2**: Redirects to originally requested page after login
- **4.3**: Handles token expiration and invalid tokens
- **4.4**: Checks authentication status on app load