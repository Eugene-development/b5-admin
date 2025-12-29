<script>
	import { goto, invalidate } from '$app/navigation';
	import ActionTable from '$lib/components/business-processes/actions/ActionTable.svelte';
	import ActionViewModal from '$lib/components/business-processes/actions/ActionViewModal.svelte';
	import ActionAddModal from '$lib/components/business-processes/actions/ActionAddModal.svelte';
	import ActionEditModal from '$lib/components/business-processes/actions/ActionEditModal.svelte';
	import ActionsTableSkeleton from '$lib/components/business-processes/actions/ActionsTableSkeleton.svelte';
	import Pagination from '$lib/components/common/Pagination.svelte';
	import { ErrorBoundary, ConfirmationModal, RefreshButton, AddButton, SearchBar } from '$lib';
	import TablePageLayout from '$lib/components/common/TablePageLayout.svelte';
	import {
		toasts,
		addSuccessToast,
		addErrorToast,
		handleApiError,
		clearAllToasts,
		retryOperation
	} from '$lib/utils/toastStore.js';
	import { createAction, updateAction, deleteAction } from '$lib/api/actions.js';
	import ProtectedRoute from '$lib/components/common/ProtectedRoute.svelte';

	/** @type {import('./$types').PageData} */
	let { data } = $props();

	// State management - will be initialized from actionsData
	let actions = $state([]);
	let allActions = $state([]); // Keep original data for filtering
	let companies = $state([]); // Companies for action creation
	let isLoading = $state(false);
	let isRefreshing = $state(false);
	let searchTerm = $state('');
	let hasSearched = $state(false);
	let updateCounter = $state(0);

	// Pagination state
	let currentPage = $state(1);
	const itemsPerPage = 10;

	// Modal state
	let selectedAction = $state(null);
	let isViewModalOpen = $state(false);
	let showAddModal = $state(false);
	let showEditModal = $state(false);
	let showConfirmModal = $state(false);
	let confirmAction = $state(null);
	let isActionLoading = $state(false);

	// Error boundary state
	let hasError = $state(false);
	let errorBoundaryError = $state(null);

	// Refresh data from server
	async function refreshData() {
		isRefreshing = true;
		try {
			console.log('🔄 Refreshing actions data...');
			// Invalidate the actions page data
			// This will trigger the load function to re-run
			await invalidate(() => true); // Invalidate all data
			console.log('✅ Actions data refreshed');
			addSuccessToast('Данные успешно обновлены');
		} catch (error) {
			console.error('❌ Failed to refresh data:', error);
			handleApiError(error, 'Не удалось обновить данные');
		} finally {
			isRefreshing = false;
		}
	}

	// Handle retry functionality
	async function handleRetry() {
		// Reload the page to retry data loading
		goto('/actions', { replaceState: true });
	}

	function handleViewAction(action) {
		selectedAction = action;
		isViewModalOpen = true;
	}

	function handleEditAction(action) {
		// Use original GraphQL data for editing
		selectedAction = {
			id: action.id,
			name: action.action_name,
			description: action.description,
			start: action.start_date,
			end: action.end_date,
			company_id: action.company_id,
			is_active: action.is_active
		};
		showEditModal = true;
		clearAllToasts();
	}

	function handleDeleteAction(action) {
		confirmAction = {
			type: 'delete',
			action: action,
			title: 'Удалить акцию',
			message: `Вы уверены, что хотите НАВСЕГДА удалить акцию "${action.action_name}"?`,
			confirmText: 'Удалить навсегда',
			isDestructive: true
		};
		showConfirmModal = true;
		clearAllToasts();
	}

	async function confirmActionHandler() {
		if (!confirmAction) return;
		isActionLoading = true;

		try {
			const { type, action } = confirmAction;
			await retryOperation(
				async () => {
					if (type === 'delete') {
						await deleteAction(action.id);
						await invalidate(() => true);
						addSuccessToast(`Акция "${action.action_name}" успешно удалена.`);
					}
				},
				2,
				1000
			);
		} catch (error) {
			console.error('Action failed after retries:', error);
		} finally {
			isActionLoading = false;
			showConfirmModal = false;
			confirmAction = null;
		}
	}

	function cancelAction() {
		showConfirmModal = false;
		confirmAction = null;
		isActionLoading = false;
	}

	function closeViewModal() {
		isViewModalOpen = false;
		selectedAction = null;
	}

	// Open add modal
	function handleAddAction() {
		showAddModal = true;
		clearAllToasts();
	}

	// Save new action
	async function handleSaveNewAction(actionData) {
		isActionLoading = true;

		try {
			await retryOperation(
				async () => {
					const newAction = await createAction(actionData);
					await invalidate(() => true);
					addSuccessToast(`Акция "${actionData.name}" успешно добавлена.`);
				},
				2,
				1000
			);
		} catch (error) {
			console.error('Failed to create action:', error);
		} finally {
			isActionLoading = false;
			showAddModal = false;
		}
	}

	// Cancel add action
	function handleCancelAddAction() {
		showAddModal = false;
		isActionLoading = false;
	}

	// Save updated action
	async function handleSaveUpdatedAction(actionData) {
		isActionLoading = true;

		try {
			await retryOperation(
				async () => {
					const updatedAction = await updateAction(actionData);
					await invalidate(() => true);
					addSuccessToast(`Акция "${actionData.name}" успешно обновлена.`);
				},
				2,
				1000
			);
		} catch (error) {
			console.error('Failed to update action:', error);
		} finally {
			isActionLoading = false;
			showEditModal = false;
			selectedAction = null;
		}
	}

	// Cancel edit action
	function handleCancelEditAction() {
		showEditModal = false;
		isActionLoading = false;
		selectedAction = null;
	}

	// Computed filtered actions
	let filteredActions = $derived.by(() => {
		if (!searchTerm.trim()) {
			return allActions;
		}

		const term = searchTerm.toLowerCase().trim();
		return allActions.filter(
			(action) =>
				action.company_name.toLowerCase().includes(term) ||
				action.action_name.toLowerCase().includes(term) ||
				action.region.toLowerCase().includes(term)
		);
	});

	// Get paginated actions
	let paginatedActions = $derived.by(() => {
		const startIndex = (currentPage - 1) * itemsPerPage;
		const endIndex = startIndex + itemsPerPage;
		return filteredActions.slice(startIndex, endIndex);
	});

	function handleSearch(term) {
		searchTerm = term;
		hasSearched = searchTerm.trim().length > 0;
		currentPage = 1;
		updateCounter++;
	}

	function clearSearch() {
		searchTerm = '';
		hasSearched = false;
		currentPage = 1;
		updateCounter++;
	}

	// Reset to first page when filters change
	$effect(() => {
		searchTerm;
		currentPage = 1;
	});

	// Handle error boundary errors
	function handleErrorBoundaryError(error) {
		hasError = true;
		errorBoundaryError = error;
		handleApiError(error, 'Критическая ошибка');
	}

	// Retry from error boundary
	async function retryFromErrorBoundary() {
		hasError = false;
		errorBoundaryError = null;
		await handleRetry();
	}
</script>

<svelte:head>
	<title>Акции - B5 Admin</title>
	<meta name="description" content="Управление акциями системы" />
</svelte:head>

<ProtectedRoute>
	{#snippet children()}
		<ErrorBoundary
			{hasError}
			error={errorBoundaryError}
			onError={handleErrorBoundaryError}
			onRetry={retryFromErrorBoundary}
			fallbackTitle="Actions Page Error"
			fallbackMessage="An error occurred while loading the actions page."
			showDetails={true}
		>
			<!-- Streamed Actions Data -->
			{#await data.actionsData}
				<!-- Loading state: Show skeleton -->
				<ActionsTableSkeleton />
			{:then actionsData}
				<!-- Success state: Show data -->
				{#if actionsData.error}
					<!-- Error state -->
					<div class="min-h-screen bg-gray-50 dark:bg-gray-950">
						<div class="px-4 py-7 sm:px-6 lg:px-7">
							<div class="mx-auto">
								<div class="rounded-lg border border-red-500/30 bg-red-500/20 p-8 text-center">
									<h3 class="mb-4 text-xl font-semibold text-white">Ошибка загрузки акций</h3>
									<p class="mb-4 text-red-300">{actionsData.error}</p>
									{#if actionsData.canRetry}
										<button
											onclick={handleRetry}
											class="rounded-lg bg-red-600 px-6 py-2 font-semibold text-white hover:bg-red-700"
										>
											Попробовать снова
										</button>
									{/if}
								</div>
							</div>
						</div>
					</div>
				{:else if !actionsData.actions || actionsData.actions.length === 0}
					<!-- Empty state -->
					<div class="min-h-screen bg-gray-50 dark:bg-gray-950">
						<div class="px-4 py-7 sm:px-6 lg:px-7">
							<div class="mx-auto">
								<div class="rounded-lg bg-gray-800 p-12 text-center">
									<div class="text-6xl">📋</div>
									<h3 class="mt-4 text-xl font-semibold text-white">В системе пока нет акций</h3>
								</div>
							</div>
						</div>
					</div>
				{:else}
					<!-- Content when data is successfully loaded -->
					{@const companiesData = actionsData.companies}

					<!-- Update local state -->
					{#if !allActions.length && actionsData.actions.length}
						{((allActions = actionsData.actions), (companies = actionsData.companies), '')}
					{/if}

					<div class="min-h-screen bg-gray-50 dark:bg-gray-950">
						<div class="px-4 py-7 sm:px-6 lg:px-7">
							<div class="mx-auto">
								<main id="main-content" aria-labelledby="page-title">
									<!-- Header with SearchBar -->
									<div class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
										<div class="flex flex-1 items-center justify-start">
											<div class="w-full max-w-md">
												<SearchBar bind:value={searchTerm} onSearch={handleSearch} placeholder="Поиск по таблице Акции..." />
											</div>
										</div>
										<div class="flex items-center justify-end space-x-3">
											<!-- Add Action Button -->
											<AddButton onclick={handleAddAction} disabled={isActionLoading} />

											<!-- Refresh Button -->
											<RefreshButton {isRefreshing} onclick={refreshData} />
										</div>
									</div>

									<!-- Hidden H1 for accessibility -->
									<h1 id="page-title" class="sr-only">
										Акции
									</h1>

									<!-- Results info -->
									{#if hasSearched}
										<div class="mb-4 text-sm text-gray-600 dark:text-gray-400">
											{#if filteredActions.length === 0}
												Акции не найдены по запросу "{searchTerm}"
											{:else}
												Найдено {filteredActions.length} акци{filteredActions.length === 1
													? 'я'
													: filteredActions.length < 5
														? 'и'
														: 'й'} по запросу "{searchTerm}"
											{/if}
										</div>
									{/if}

									<!-- Table -->
									<ActionTable
										actions={paginatedActions}
										{isLoading}
										{searchTerm}
										{hasSearched}
										{updateCounter}
										onViewAction={handleViewAction}
										onEditAction={handleEditAction}
										onDeleteAction={handleDeleteAction}
									/>

									<!-- Pagination -->
									<Pagination
										bind:currentPage
										totalItems={filteredActions.length}
										{itemsPerPage}
										filteredFrom={searchTerm.trim() ? allActions.length : null}
									/>
								</main>
							</div>
						</div>
					</div>
				{/if}
			{:catch error}
				<!-- Critical error state -->
				<div class="min-h-screen bg-gray-50 dark:bg-gray-950">
					<div class="px-4 py-8 sm:px-6 lg:px-8">
						<div class="mx-auto">
							<div class="rounded-lg border border-red-500/30 bg-red-500/20 p-8 text-center">
								<h3 class="mb-4 text-xl font-semibold text-white">Ошибка загрузки акций</h3>
								<p class="text-red-300">
									Не удалось загрузить акции. Попробуйте обновить страницу.
								</p>
							</div>
						</div>
					</div>
				</div>
			{/await}
		</ErrorBoundary>
	{/snippet}
</ProtectedRoute>

<!-- View Modal -->
<ActionViewModal action={selectedAction} isOpen={isViewModalOpen} onClose={closeViewModal} />

<!-- Add Action Modal -->
<ActionAddModal
	isOpen={showAddModal}
	onSave={handleSaveNewAction}
	onCancel={handleCancelAddAction}
	isLoading={isActionLoading}
	{companies}
/>

<!-- Edit Action Modal -->
<ActionEditModal
	isOpen={showEditModal}
	action={selectedAction}
	onSave={handleSaveUpdatedAction}
	onCancel={handleCancelEditAction}
	isLoading={isActionLoading}
	{companies}
/>

<!-- Confirmation Modal -->
{#if confirmAction}
	<ConfirmationModal
		isOpen={showConfirmModal}
		title={confirmAction.title}
		message={confirmAction.message}
		confirmText={confirmAction.confirmText}
		cancelText="Отмена"
		onConfirm={confirmActionHandler}
		onCancel={cancelAction}
		isDestructive={confirmAction.isDestructive}
		isLoading={isActionLoading}
	/>
{/if}
