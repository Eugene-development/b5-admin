# LoadingOverlay Component

A full-screen overlay component for displaying loading states during authentication processes and other long-running operations in B5-Admin.

## Features

- **Full-screen overlay**: Covers the entire viewport with a semi-transparent backdrop
- **Customizable messages**: Support for custom loading messages
- **Spinner integration**: Uses the existing LoadingSpinner component with configurable size and color
- **Body scroll prevention**: Automatically prevents body scrolling when overlay is shown
- **Accessibility**: Proper ARIA attributes and screen reader support
- **Dark mode support**: Tailwind CSS dark mode classes
- **Backdrop blur**: Modern blur effect for better visual separation
- **B5-Admin design system**: Consistent styling with the existing design system

## Usage

### Basic Usage

```svelte
<script>
  import LoadingOverlay from '$lib/components/LoadingOverlay.svelte';
  
  let showLoading = false;
  
  async function performAction() {
    showLoading = true;
    try {
      // Perform some async operation
      await someAsyncOperation();
    } finally {
      showLoading = false;
    }
  }
</script>

<LoadingOverlay show={showLoading} />
<button onclick={performAction}>Start Action</button>
```

### Custom Message

```svelte
<LoadingOverlay 
  show={isAuthenticating} 
  message="Authenticating user..." 
/>
```

### Custom Spinner Configuration

```svelte
<LoadingOverlay 
  show={isLoading}
  message="Processing request..."
  spinnerSize="xl"
  spinnerColor="white"
/>
```

### Disable Body Scroll Prevention

```svelte
<LoadingOverlay 
  show={isLoading}
  preventBodyScroll={false}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `show` | `boolean` | `false` | Controls overlay visibility |
| `message` | `string` | `'Loading...'` | Custom loading message to display |
| `spinnerSize` | `string` | `'lg'` | Size of the loading spinner: 'sm', 'md', 'lg', 'xl' |
| `spinnerColor` | `string` | `'primary'` | Color of the loading spinner: 'primary', 'white', 'gray', 'red', 'yellow', 'green' |
| `preventBodyScroll` | `boolean` | `true` | Whether to prevent body scrolling when overlay is shown |
| `class` | `string` | `''` | Additional CSS classes |

## Accessibility

The component includes proper accessibility features:

- `role="status"` for screen readers
- `aria-live="polite"` for live region announcements
- `aria-label` with the loading message
- `aria-hidden="true"` on decorative backdrop element

## Styling

The component uses Tailwind CSS classes and follows the B5-Admin design system:

- **Backdrop**: Semi-transparent gray with blur effect
- **Content container**: White/gray background with rounded corners and shadow
- **Dark mode**: Automatic dark mode support with appropriate color adjustments
- **Z-index**: High z-index (50) to ensure overlay appears above other content

## Integration with Authentication

This component is specifically designed for use in the B5-Admin authentication system:

```svelte
<script>
  import { authState } from '$lib/state/auth.svelte.js';
  import LoadingOverlay from '$lib/components/LoadingOverlay.svelte';
</script>

<LoadingOverlay 
  show={authState.loading} 
  message="Authenticating..." 
/>
```

## Best Practices

1. **Always provide meaningful messages**: Use descriptive messages that inform users what's happening
2. **Keep loading times reasonable**: Don't use for operations that take more than a few seconds
3. **Handle errors gracefully**: Always ensure the overlay is hidden even if operations fail
4. **Test accessibility**: Verify that screen readers announce the loading state properly
5. **Consider mobile experience**: The component is optimized for mobile touch interfaces

## Examples

### Authentication Flow

```svelte
<script>
  import LoadingOverlay from '$lib/components/LoadingOverlay.svelte';
  
  let isLoggingIn = false;
  
  async function handleLogin() {
    isLoggingIn = true;
    try {
      await login(email, password);
    } catch (error) {
      // Handle error
    } finally {
      isLoggingIn = false;
    }
  }
</script>

<LoadingOverlay 
  show={isLoggingIn} 
  message="Signing you in..." 
  spinnerColor="primary"
/>
```

### Data Loading

```svelte
<script>
  import LoadingOverlay from '$lib/components/LoadingOverlay.svelte';
  
  let isLoadingData = false;
  
  async function loadData() {
    isLoadingData = true;
    try {
      const data = await fetchData();
      // Process data
    } finally {
      isLoadingData = false;
    }
  }
</script>

<LoadingOverlay 
  show={isLoadingData} 
  message="Loading data..." 
  spinnerSize="lg"
/>
```