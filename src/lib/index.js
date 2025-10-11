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


// place files you want to import through the `$lib` alias in this folder.
export { default as AgentsTable } from './components/AgentsTable.svelte';
export { default as UsersTable } from './components/UsersTable.svelte';
export { default as CompanyTable } from './components/CompanyTable.svelte';
export { default as CompanyViewModal } from './components/CompanyViewModal.svelte';
export { default as CompanyAddModal } from './components/CompanyAddModal.svelte';
export { default as CompanyEditModal } from './components/CompanyEditModal.svelte';
export { default as ActionAddModal } from './components/ActionAddModal.svelte';
export { default as UserViewModal } from './components/UserViewModal.svelte';
export { default as ProjectsTable } from './components/ProjectsTable.svelte';
export { default as ProjectEditModal } from './components/ProjectEditModal.svelte';
export { default as ProjectViewModal } from './components/ProjectViewModal.svelte';
export { default as OrderAddModal } from './components/OrderAddModal.svelte';
export { default as SearchBar } from './components/SearchBar.svelte';
export { default as ActionButtons } from './components/ActionButtons.svelte';
export { default as ConfirmationModal } from './components/ConfirmationModal.svelte';
export { default as StatusBadge } from './components/StatusBadge.svelte';
export { default as LoadingSpinner } from './components/LoadingSpinner.svelte';
export { default as LoadingOverlay } from './components/LoadingOverlay.svelte';
export { default as Toast } from './components/Toast.svelte';
export { default as ToastContainer } from './components/ToastContainer.svelte';
export { default as ErrorBoundary } from './components/ErrorBoundary.svelte';
export { default as EmptyState } from './components/EmptyState.svelte';
export { default as TruncatedText } from './components/TruncatedText.svelte';
export { default as DateDisplay } from './components/DateDisplay.svelte';
export { default as CurrencyDisplay } from './components/CurrencyDisplay.svelte';
export { default as AgentDisplay } from './components/AgentDisplay.svelte';
export { default as ProtectedRoute } from './components/ProtectedRoute.svelte';

// Export utilities
export * from './utils/index.js';

// Export authentication API
export * from './api/config.js';
export * from './api/client.js';
export * from './api/auth.js';

// Export orders API
export * from './api/orders.js';

// Export actions API
export * from './api/actions.js';

// Export authentication state store
export * from './state/auth.svelte.js';