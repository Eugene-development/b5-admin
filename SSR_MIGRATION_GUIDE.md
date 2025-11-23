# SSR Migration Guide - b5-admin

## Overview

This document describes the migration from client-side data loading (localStorage + onMount) to server-side rendering (SSR) with httpOnly cookies for the b5-admin project.

## ✅ Completed Infrastructure

### 1. Server-Side Authentication ([hooks.server.js](src/hooks.server.js))

The `hooks.server.js` file now:
- Extracts JWT token from httpOnly cookie `b5_auth_token`
- Decodes JWT payload to get user data
- Adds user data and token to `event.locals` for use in server load functions
- Logs authentication status for debugging

**Key exports:**
- `event.locals.user` - User object from JWT payload
- `event.locals.token` - JWT token string
- `event.locals.isAuthenticated` - Boolean authentication status

### 2. HTTP Client Updates ([lib/api/client.js](src/lib/api/client.js))

- Added `credentials: 'include'` to all fetch requests to send httpOnly cookies
- Modified auth header logic to support both localStorage (fallback) and httpOnly cookies
- Maintains backward compatibility during migration

### 3. Authentication State ([lib/state/auth.svelte.js](src/lib/state/auth.svelte.js))

- Login/register still save token to localStorage for backward compatibility
- Added logging to indicate token is also stored in httpOnly cookie by backend
- Logout clears both localStorage and httpOnly cookie

### 4. Server-Side Utilities ([lib/api/server.js](src/lib/api/server.js))

New utility functions for SSR:
- `makeServerGraphQLRequest()` - Make GraphQL requests with JWT token on server
- `createFallbackData()` - Create consistent fallback data structures
- `categorizeError()` - Categorize errors by type
- `getUserFriendlyErrorMessage()` - Get user-friendly error messages
- `calculateStats()` - Calculate statistics for data arrays

### 5. Backend Documentation ([BACKEND_COOKIE_SETUP.md](BACKEND_COOKIE_SETUP.md))

Complete guide for backend developers on:
- Setting httpOnly cookie on login/register
- Clearing httpOnly cookie on logout
- CORS configuration
- Cookie specifications
- Security considerations

## ✅ Migrated Pages (Examples)

### 1. Agents Page
- **Server:** [agents/+page.server.js](src/routes/(protected)/(management)/agents/+page.server.js)
- **Client:** [agents/+page.svelte](src/routes/(protected)/(management)/agents/+page.svelte)

**Changes:**
- Removed `+page.js` (CSR-only file)
- Created `+page.server.js` with SSR data loading
- Updated `+page.svelte` to use server data via `let { data } = $props()`
- Removed `onMount()` for initial data load
- Kept `refreshData()` for manual refresh button

### 2. Clients Page
- **Server:** [clients/+page.server.js](src/routes/(protected)/(management)/clients/+page.server.js)
- **Client:** [clients/+page.svelte](src/routes/(protected)/(management)/clients/+page.svelte)

**Changes:**
- Updated existing `+page.server.js` with real SSR data loading
- Similar changes to agents page

## 🔄 Migration Pattern

### Before (Client-Side Rendering)

**+page.js:**
```javascript
export const ssr = false;
export const csr = true;
export function load() {
  return {};
}
```

**+page.svelte:**
```svelte
<script>
  import { onMount } from 'svelte';
  import { refreshData } from '$lib/api/...';

  let data = $state([]);
  let isLoading = $state(true);

  onMount(async () => {
    data = await refreshData();
    isLoading = false;
  });
</script>

{#if isLoading}
  <Loading />
{:else}
  <DataTable {data} />
{/if}
```

### After (Server-Side Rendering)

**+page.server.js:**
```javascript
import { makeServerGraphQLRequest, createFallbackData } from '$lib/api/server.js';

const QUERY = `
  {
    items {
      id
      name
      ...
    }
  }
`;

async function loadData(token, fetch) {
  try {
    const result = await makeServerGraphQLRequest(token, QUERY, {}, fetch);
    return {
      items: result.items || [],
      error: null
    };
  } catch (error) {
    return {
      ...createFallbackData(),
      error: error.message
    };
  }
}

export async function load({ locals, fetch }) {
  if (!locals.isAuthenticated) {
    return {
      data: createFallbackData({ needsClientLoad: true })
    };
  }

  const data = await loadData(locals.token, fetch);
  return { data };
}
```

**+page.svelte:**
```svelte
<script>
  import { refreshData } from '$lib/api/...'; // Only for manual refresh

  let { data } = $props();
  let localData = $state(data.data?.items || []);
  let isLoading = $state(false); // No initial loading

  // Removed onMount() - data already loaded on server

  async function handleRefresh() {
    isLoading = true;
    localData = await refreshData();
    isLoading = false;
  }
</script>

<!-- No loading skeleton on initial render - data already available -->
<DataTable data={localData} />
<button onclick={handleRefresh}>Refresh</button>
```

## 📋 Remaining Pages to Migrate

### Management Pages (4 remaining)
- ✅ clients - DONE
- ✅ agents - DONE
- ⏳ curators
- ⏳ designers
- ⏳ managers
- ⏳ profile

### Business Process Pages (6 remaining)
- ⏳ order
- ⏳ projects
- ⏳ complaints
- ⏳ contracts
- ⏳ actions
- ⏳ tz

### Counterparties Pages (4 remaining)
- ⏳ suppliers
- ⏳ contractors
- ⏳ services
- ⏳ delivery

### Other Pages (3 remaining)
- ⏳ dashboard
- ⏳ homepage (/)
- ⏳ email-verify

## 🔧 Migration Steps for Each Page

1. **Create/Update +page.server.js:**
   ```javascript
   // Copy from agents/+page.server.js as template
   // Update GraphQL query for your data
   // Update permission checks
   // Update data processing logic
   ```

2. **Remove +page.js** (if exists with `ssr = false`)

3. **Update +page.svelte:**
   - Add `let { data } = $props()`
   - Initialize local state from `data.yourData?.items`
   - Remove `onMount()` call that loads initial data
   - Keep `refreshData()` for manual refresh
   - Set `isInitialLoading = false`

4. **Test:**
   - Check SSR works (view page source, data should be pre-rendered)
   - Check manual refresh still works
   - Check mutations (create/update/delete) still work
   - Check error handling

## 🔐 Security Benefits

1. **XSS Protection:** Token in httpOnly cookie can't be accessed by JavaScript
2. **SSR:** Data rendered on server, better SEO and initial load performance
3. **Token Management:** Token lifecycle managed by backend, more secure

## 🎯 Performance Benefits

1. **Faster Initial Load:** No client-side loading delay, data arrives with HTML
2. **Better UX:** No loading skeletons on initial render
3. **SEO:** Search engines can index pre-rendered content

## ⚠️ Important Notes

1. **Backend Setup Required:** Backend must be configured to set/clear httpOnly cookies (see BACKEND_COOKIE_SETUP.md)
2. **CORS:** Backend must have `supports_credentials: true` in CORS config
3. **Client-Side Operations:** Mutations (create/update/delete) and manual refresh still use client-side API calls
4. **Backward Compatibility:** Token still saved to localStorage during migration for pages not yet migrated

## 🧪 Testing Checklist

For each migrated page:

- [ ] SSR works (check page source for pre-rendered data)
- [ ] Authentication required (redirects if not authenticated)
- [ ] Permissions checked (shows error if insufficient permissions)
- [ ] Manual refresh works
- [ ] Create operation works (if applicable)
- [ ] Update operation works (if applicable)
- [ ] Delete operation works (if applicable)
- [ ] Search/filter works
- [ ] Pagination works
- [ ] Error handling works (try with backend offline)

## 📚 Reference Files

- **Template +page.server.js:** `agents/+page.server.js`
- **Server utilities:** `lib/api/server.js`
- **Auth hooks:** `src/hooks.server.js`
- **Backend setup:** `BACKEND_COOKIE_SETUP.md`
