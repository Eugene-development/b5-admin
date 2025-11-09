<script>
	import { goto, invalidate } from '$app/navigation';
	import ActionTable from '$lib/components/ActionTable.svelte';
	import ActionViewModal from '$lib/components/ActionViewModal.svelte';
	import ActionAddModal from '$lib/components/ActionAddModal.svelte';
	import ActionEditModal from '$lib/components/ActionEditModal.svelte';
	import ActionsTableSkeleton from '$lib/components/ActionsTableSkeleton.svelte';
	import { ErrorBoundary, ConfirmationModal } from '$lib';
	import {
		toasts,
		addSuccessToast,
		addErrorToast,
		handleApiError,
		clearAllToasts,
		retryOperation
	} from '$lib/utils/toastStore.js';
	import { createAction, updateAction, deleteAction } from '$lib/api/actions.js';
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte';

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

	function handleSearch(actionsData) {
		hasSearched = true;
		isLoading = true;

		setTimeout(() => {
			if (searchTerm.trim()) {
				actions = actionsData.filter(
					(action) =>
						action.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
						action.action_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
						action.region.toLowerCase().includes(searchTerm.toLowerCase())
				);
			} else {
				actions = actionsData;
				hasSearched = false;
			}
			isLoading = false;
			updateCounter++;
		}, 300);
	}

	function clearSearch(actionsData) {
		searchTerm = '';
		hasSearched = false;
		actions = actionsData;
		updateCounter++;
	}

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
						<div class="px-4 py-8 sm:px-6 lg:px-8">
							<div class="mx-auto max-w-7xl">
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
						<div class="px-4 py-8 sm:px-6 lg:px-8">
							<div class="mx-auto max-w-7xl">
								<div class="rounded-lg bg-gray-800 p-12 text-center">
									<div class="text-6xl">📋</div>
									<h3 class="mt-4 text-xl font-semibold text-white">В системе пока нет акций</h3>
								</div>
							</div>
						</div>
					</div>
				{:else}
					<!-- Content when data is successfully loaded -->
					{@const displayActions = hasSearched ? actions : actionsData.actions}
					{@const allActionsData = actionsData.actions}
					{@const companiesData = actionsData.companies}

					<!-- Update local state -->
					{#if !actions.length && actionsData.actions.length}
						{((actions = actionsData.actions),
						(allActions = actionsData.actions),
						(companies = actionsData.companies),
						'')}
					{/if}

					<div class="min-h-screen bg-gray-50 dark:bg-gray-950">
						<div class="px-4 py-8 sm:px-6 lg:px-8">
							<div class="mx-auto max-w-7xl">
								<!-- Header with Refresh Button -->
								<div class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between">
									<div class="flex items-center justify-between">
										<div>
											<h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Акции</h1>
											<p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
												Управление акциями и промо-кампаниями системы
											</p>
										</div>
									</div>
									<div class="flex items-center space-x-3">
										<!-- Refresh Button -->
										<button
											type="button"
											onclick={refreshData}
											disabled={isRefreshing}
											class="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus-visible:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-700"
										>
											{#if isRefreshing}
												<svg
													class="mr-2 h-4 w-4 animate-spin"
													xmlns="http://www.w3.org/2000/svg"
													fill="none"
													viewBox="0 0 24 24"
												>
													<circle
														class="opacity-25"
														cx="12"
														cy="12"
														r="10"
														stroke="currentColor"
														stroke-width="4"
													></circle>
													<path
														class="opacity-75"
														fill="currentColor"
														d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
													></path>
												</svg>
											{:else}
												<svg
													class="mr-2 h-4 w-4"
													xmlns="http://www.w3.org/2000/svg"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
													></path>
												</svg>
											{/if}
											Обновить
										</button>
										<!-- Add Action Button -->
										<button
											type="button"
											onclick={handleAddAction}
											disabled={isActionLoading}
											class="inline-flex items-center rounded-md bg-cyan-700 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-cyan-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
										>
											<svg
												class="mr-2 h-4 w-4"
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
												aria-hidden="true"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M12 4v16m8-8H4"
												/>
											</svg>
											Добавить акцию
										</button>
									</div>
								</div>

								<!-- Separator -->
								<div class="my-4 border-t border-gray-200 dark:border-gray-700"></div>

								<!-- Search and Filters -->
								<div
									class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0"
								>
									<div class="flex flex-1 items-center space-x-4">
										<!-- Search Input -->
										<div class="relative max-w-md flex-1">
											<div
												class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
											>
												<svg
													class="h-5 w-5 text-gray-400"
													xmlns="http://www.w3.org/2000/svg"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
													aria-hidden="true"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
													/>
												</svg>
											</div>
											<input
												id="action-search"
												type="text"
												bind:value={searchTerm}
												oninput={() => handleSearch(allActionsData)}
												placeholder="Поиск по компании, акции или региону..."
												class="block w-full rounded-md border-0 py-1.5 pr-3 pl-10 text-gray-900 ring-1 ring-gray-300 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-600 focus:ring-inset sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-white dark:ring-gray-600 dark:placeholder:text-gray-500"
											/>
										</div>
										{#if hasSearched}
											<button
												type="button"
												onclick={() => clearSearch(allActionsData)}
												class="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-700"
											>
												Очистить
											</button>
										{/if}
									</div>
								</div>

								<!-- Results Summary -->
								{#if hasSearched}
									<div class="mt-4 text-sm text-gray-600 dark:text-gray-400">
										{#if displayActions.length === 0}
											Акции не найдены по запросу "{searchTerm}"
										{:else}
											Найдено {displayActions.length} акци{displayActions.length === 1
												? 'я'
												: displayActions.length < 5
													? 'и'
													: 'й'} по запросу "{searchTerm}"
										{/if}
									</div>
								{/if}

								<!-- Actions Table -->
								<div class="mt-8">
									<ActionTable
										actions={displayActions}
										{isLoading}
										{searchTerm}
										{hasSearched}
										{updateCounter}
										onViewAction={handleViewAction}
										onEditAction={handleEditAction}
										onDeleteAction={handleDeleteAction}
									/>
								</div>
							</div>
						</div>
					</div>
				{/if}
			{:catch error}
				<!-- Critical error state -->
				<div class="min-h-screen bg-gray-50 dark:bg-gray-950">
					<div class="px-4 py-8 sm:px-6 lg:px-8">
						<div class="mx-auto max-w-7xl">
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
