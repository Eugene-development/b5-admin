// place files you want to import through the `$lib` alias in this folder.

// Authentication components
export { default as LoginForm } from './components/auth/LoginForm.svelte';
export { default as RegisterForm } from './components/auth/RegisterForm.svelte';
export { default as LogoutButton } from './components/auth/LogoutButton.svelte';
export { default as ErrorDisplay } from './components/common/ErrorDisplay.svelte';
export { default as ErrorHandlerExample } from './components/common/ErrorHandlerExample.svelte';

// Authentication utilities
export * from './auth/auth.svelte.js';
export * from './auth/auth-guard.svelte.js';

// Utility functions
export * from './utils/errorHandler.svelte.js';
export { HttpClient, api, createHttpClient } from './utils/http-client.js';

// Management components
export { default as AgentsTable } from './components/management/agents/AgentsTable.svelte';
export { default as UsersTable } from './components/management/users/UsersTable.svelte';
export { default as UserViewModal } from './components/management/users/UserViewModal.svelte';
export { default as UserEditModal } from './components/management/users/UserEditModal.svelte';
export { default as UserAddModal } from './components/management/users/UserAddModal.svelte';

// Counterparties components
export { default as CompanyTable } from './components/counterparties/companies/CompanyTable.svelte';
export { default as CompanyViewModal } from './components/counterparties/companies/CompanyViewModal.svelte';
export { default as CompanyAddModal } from './components/counterparties/companies/CompanyAddModal.svelte';
export { default as CompanyEditModal } from './components/counterparties/companies/CompanyEditModal.svelte';

// Business-processes components
export { default as ContractsTable } from './components/business-processes/contracts/ContractsTable.svelte';
export { default as ContractAddModal } from './components/business-processes/contracts/ContractAddModal.svelte';
export { default as ContractEditModal } from './components/business-processes/contracts/ContractEditModal.svelte';
export { default as ContractViewModal } from './components/business-processes/contracts/ContractViewModal.svelte';
export { default as ContractActionButtons } from './components/business-processes/contracts/ContractActionButtons.svelte';

export { default as ComplaintsTable } from './components/business-processes/complaints/ComplaintsTable.svelte';
export { default as ComplaintAddModal } from './components/business-processes/complaints/ComplaintAddModal.svelte';
export { default as ComplaintEditModal } from './components/business-processes/complaints/ComplaintEditModal.svelte';
export { default as ComplaintViewModal } from './components/business-processes/complaints/ComplaintViewModal.svelte';

export { default as ActionAddModal } from './components/business-processes/actions/ActionAddModal.svelte';
export { default as ActionButtons } from './components/business-processes/actions/ActionButtons.svelte';

export { default as ProjectsTable } from './components/business-processes/projects/ProjectsTable.svelte';
export { default as ProjectStatusBadge } from './components/business-processes/projects/ProjectStatusBadge.svelte';
export { default as ProjectEditModal } from './components/business-processes/projects/ProjectEditModal.svelte';
export { default as ProjectViewModal } from './components/business-processes/projects/ProjectViewModal.svelte';

export { default as OrderAddModal } from './components/business-processes/order/OrderAddModal.svelte';

export { default as TzCreateModal } from './components/business-processes/tz/TzCreateModal.svelte';

export { default as FinancesBonusTable } from './components/business-processes/finances/FinancesBonusTable.svelte';
export { default as BonusPaymentStatusBadge } from './components/business-processes/finances/BonusPaymentStatusBadge.svelte';

// Common components
export { default as SearchBar } from './components/common/SearchBar.svelte';
export { default as ConfirmationModal } from './components/common/ConfirmationModal.svelte';
export { default as StatusBadge } from './components/common/StatusBadge.svelte';
export { default as LoadingSpinner } from './components/common/LoadingSpinner.svelte';
export { default as LoadingOverlay } from './components/common/LoadingOverlay.svelte';
export { default as RefreshButton } from './components/common/RefreshButton.svelte';
export { default as AddButton } from './components/common/AddButton.svelte';
export { default as Toast } from './components/common/Toast.svelte';
export { default as ToastContainer } from './components/common/ToastContainer.svelte';
export { default as ErrorBoundary } from './components/common/ErrorBoundary.svelte';
export { default as EmptyState } from './components/common/EmptyState.svelte';
export { default as TableSkeleton } from './components/common/TableSkeleton.svelte';
export { default as TruncatedText } from './components/common/TruncatedText.svelte';
export { default as DateDisplay } from './components/common/DateDisplay.svelte';
export { default as DateBadge } from './components/common/DateBadge.svelte';
export { default as CurrencyDisplay } from './components/common/CurrencyDisplay.svelte';
export { default as AgentDisplay } from './components/common/AgentDisplay.svelte';
export { default as ProtectedRoute } from './components/common/ProtectedRoute.svelte';
export { default as Pagination } from './components/common/Pagination.svelte';
export { default as TablePageLayout } from './components/common/TablePageLayout.svelte';
export { default as ActionButton } from './components/common/ActionButton.svelte';
export { default as MobileActionButton } from './components/common/MobileActionButton.svelte';
export { default as PageTitle } from './components/common/PageTitle.svelte';

// Modals
export { default as FileUploadModal } from './components/modals/FileUploadModal.svelte';

// UI components
export { default as Sparkles } from './components/ui/Sparkles/Sparkles.svelte';

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

// Export complaints API
export * from './api/complaints.js';

// Export authentication state store
export * from './state/auth.svelte.js';

// Export finances API
export * from './api/finances.js';
