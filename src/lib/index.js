// place files you want to import through the `$lib` alias in this folder.

// Authentication components
export { default as LoginForm } from './components/LoginForm.svelte';
export { default as RegisterForm } from './components/RegisterForm.svelte';
export { default as LogoutButton } from './components/LogoutButton.svelte';
export { default as ErrorDisplay } from './components/ErrorDisplay.svelte';
export { default as ErrorHandlerExample } from './components/ErrorHandlerExample.svelte';

// Authentication utilities
export * from './auth/auth.svelte.js';
export * from './auth/auth-guard.svelte.js';

// Utility functions
export * from './utils/errorHandler.svelte.js';
export { HttpClient, api, createHttpClient, initCsrf } from './utils/http-client.js';
