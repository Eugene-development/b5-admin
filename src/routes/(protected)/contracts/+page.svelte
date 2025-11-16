<script>
	import {
		ContractsTable,
		ContractAddModal,
		ContractEditModal,
		ContractViewModal,
		ConfirmationModal,
		ErrorBoundary,
		TableSkeleton
	} from '$lib';
	import Pagination from '$lib/components/Pagination.svelte';
	import {
		addSuccessToast,
		addErrorToast,
		handleApiError,
		retryOperation,
		clearAllToasts
	} from '$lib/utils/toastStore.js';
	import { onMount } from 'svelte';
	import {
		createContract,
		updateContract,
		deleteContract,
		refreshContracts
	} from '$lib/api/contracts.js';
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte';

	let { data } = $props();

	// Search state management
	let searchTerm = $state('');

	// Pagination state
	let currentPage = $state(1);
	const itemsPerPage = 8;

	// Action state management
	let isActionLoading = $state(false);
	let showConfirmModal = $state(false);
	let confirmAction = $state(null);

	// Add modal state management
	let showAddModal = $state(false);

	// Edit modal state management
	let showEditModal = $state(false);
	let editingContract = $state(null);

	// View modal state management
	let showViewModal = $state(false);
	let viewingContract = $state(null);

	// Error boundary state
	let hasError = $state(false);
	let errorBoundaryError = $state(null);

	// Loading state for data refresh
	let isRefreshing = $state(false);

	// Local contracts state for updates
	let localContracts = $state([]);

	// Force update counter for reactivity
	let updateCounter = $state(0);

	// Check for server-side load errors
	let loadError = $state(null);

	// Computed filteredContracts reactive statement
	let filteredContracts = $derived.by(() => {
		// Filter out any undefined or null contracts first
		let filtered = localContracts.filter((contract) => contract != null);

		// Apply search filter
		if (searchTerm.trim()) {
			const term = searchTerm.toLowerCase().trim();
			filtered = filtered.filter((contract) => {
				const contractNumber = (contract.contract_number || '').toLowerCase();
				const projectName = (contract.project?.value || '').toLowerCase();
				const companyName = (contract.company?.name || '').toLowerCase();

				return (
					contractNumber.includes(term) || projectName.includes(term) || companyName.includes(term)
				);
			});
		}

		return filtered;
	});

	// Get paginated contracts
	let paginatedContracts = $derived.by(() => {
		const startIndex = (currentPage - 1) * itemsPerPage;
		const endIndex = startIndex + itemsPerPage;
		return filteredContracts.slice(startIndex, endIndex);
	});

	// Search handler function
	function handleSearch(term) {
		searchTerm = term;
		currentPage = 1;
	}

	// Reset to first page when filters change
	$effect(() => {
		searchTerm;
		currentPage = 1;
	});

	// Add contract handler
	function handleAddContract() {
		showAddModal = true;
		clearAllToasts();
	}

	// Edit contract handler
	function handleEditContract(contract) {
		editingContract = contract;
		showEditModal = true;
		clearAllToasts();
	}

	// View contract handler
	function handleViewContract(contract) {
		viewingContract = contract;
		showViewModal = true;
		clearAllToasts();
	}

	// Delete contract handler with confirmation
	function handleDeleteContract(contract) {
		confirmAction = {
			type: 'delete',
			contract: contract,
			title: 'Удалить контракт',
			message: `Вы уверены, что хотите НАВСЕГДА удалить контракт ${contract.contract_number || 'без номера'}? Это действие нельзя отменить.`,
			confirmText: 'Удалить навсегда',
			isDestructive: true
		};
		showConfirmModal = true;
		clearAllToasts();
	}

	// Execute confirmed action with retry mechanism
	async function confirmActionHandler() {
		if (!confirmAction) return;

		isActionLoading = true;

		try {
			const { type, contract } = confirmAction;

			await retryOperation(
				async () => {
					if (type === 'delete') {
						await deleteContract(contract.id);
						removeContractFromList(contract.id);
						addSuccessToast(`Контракт успешно удален.`);
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

	// Cancel action
	function cancelAction() {
		showConfirmModal = false;
		confirmAction = null;
		isActionLoading = false;
	}

	// Save new contract
	async function handleSaveNewContract(contractData) {
		isActionLoading = true;

		try {
			await retryOperation(
				async () => {
					const newContract = await createContract(contractData);
					localContracts = [newContract, ...localContracts];
					addSuccessToast('Контракт успешно создан.');
				},
				2,
				1000
			);
		} catch (error) {
			console.error('Contract creation failed after retries:', error);
		} finally {
			isActionLoading = false;
			showAddModal = false;
		}
	}

	// Cancel add contract
	function handleCancelAddContract() {
		showAddModal = false;
		isActionLoading = false;
	}

	// Save contract changes
	async function handleSaveContract(updatedContractData) {
		isActionLoading = true;

		try {
			await retryOperation(
				async () => {
					const updatedContract = await updateContract(updatedContractData);
					updateContractInList(updatedContract);
					addSuccessToast('Контракт успешно обновлен.');
				},
				2,
				1000
			);
		} catch (error) {
			console.error('Contract update failed after retries:', error);
		} finally {
			isActionLoading = false;
			showEditModal = false;
			editingContract = null;
		}
	}

	// Cancel edit contract
	function handleCancelEditContract() {
		showEditModal = false;
		editingContract = null;
		isActionLoading = false;
	}

	// Cancel view contract
	function handleCancelViewContract() {
		showViewModal = false;
		viewingContract = null;
	}

	// Remove contract from local state after deletion
	function removeContractFromList(contractId) {
		localContracts = localContracts.filter((contract) => contract && contract.id !== contractId);
		updateCounter++;
	}

	// Update contract in local state after editing
	function updateContractInList(updatedContract) {
		localContracts = localContracts.map((contract) =>
			contract && contract.id === updatedContract.id ? updatedContract : contract
		);
		updateCounter++;
	}

	// Refresh data from server
	async function refreshData(isInitialLoad = false) {
		isRefreshing = true;
		try {
			const contracts = await refreshContracts();
			localContracts = contracts;
			loadError = null;

			if (!isInitialLoad) {
				addSuccessToast('Данные успешно обновлены');
			}
		} catch (error) {
			handleApiError(
				error,
				isInitialLoad ? 'Не удалось загрузить данные' : 'Не удалось обновить данные'
			);
		} finally {
			isRefreshing = false;
		}
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
		await refreshData();
	}

	// Derived state that transforms streamed data without mutation
	function getProcessedContracts(contractsData) {
		if (!contractsData || !contractsData.contracts) {
			return [];
		}

		// Filter out any undefined or null contracts
		return [...contractsData.contracts].filter((contract) => contract != null && contract.id);
	}
</script>

<ProtectedRoute>
	{#snippet children()}
		<ErrorBoundary
			{hasError}
			error={errorBoundaryError}
			onError={handleErrorBoundaryError}
			onRetry={retryFromErrorBoundary}
			fallbackTitle="Contracts Page Error"
			fallbackMessage="An error occurred while loading the contracts page."
			showDetails={true}
		>
			<!-- Streamed Contracts Data with SSR -->
			{#await data.contractsData}
				<!-- Loading state: Show skeleton -->
				<TableSkeleton columns={10} />
			{:then contractsData}
				<!-- Success state: Show data -->
				{@const processedContracts = getProcessedContracts(contractsData)}

				<!-- Update local state only once when data arrives -->
				{#if localContracts.length === 0 && processedContracts.length > 0}
					{((localContracts = processedContracts), '')}
				{/if}

				<!-- Set load error if present -->
				{#if contractsData.error && !loadError}
					{((loadError = contractsData.error), '')}
				{/if}

				<!-- Skip link for keyboard navigation -->
				<a
					href="#main-content"
					class="sr-only z-50 rounded-md bg-indigo-600 px-4 py-2 text-white focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
				>
					Перейти к основному контенту
				</a>

				<div class="min-h-screen bg-gray-50 dark:bg-gray-950">
					<div class="px-4 py-8 sm:px-6 lg:px-8">
						<div class="mx-auto max-w-7xl">
							<!-- Page landmark -->
							<main id="main-content" aria-labelledby="page-title">
								<!-- Header with Refresh and Add Buttons -->
								<div class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between">
									<div class="flex items-center justify-between">
										<div>
											<h1
												id="page-title"
												class="text-2xl font-semibold text-gray-900 dark:text-white"
											>
												Контракты
											</h1>
											<p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
												Управление контрактами между проектами и компаниями
											</p>
										</div>
									</div>
									<div class="flex items-center space-x-3">
										<!-- Refresh Button -->
										<button
											type="button"
											onclick={(event) => {
												event.stopPropagation();
												refreshData();
											}}
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
										<!-- Add Button -->
										<button
											type="button"
											onclick={handleAddContract}
											disabled={isActionLoading}
											class="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
										>
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
													d="M12 4v16m8-8H4"
												/>
											</svg>
											Добавить контракт
										</button>
									</div>
								</div>

								<!-- Separator -->
								<div class="my-4 border-t border-gray-200 dark:border-gray-700"></div>

								<!-- Load Error Banner -->
								{#if loadError && loadError.canRetry}
									<div class="mb-4 rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/20">
										<div class="flex">
											<div class="flex-shrink-0">
												<svg
													class="h-5 w-5 text-yellow-400"
													viewBox="0 0 20 20"
													fill="currentColor"
													aria-hidden="true"
												>
													<path
														fill-rule="evenodd"
														d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
														clip-rule="evenodd"
													/>
												</svg>
											</div>
											<div class="ml-3">
												<h3 class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
													Ошибка загрузки данных
												</h3>
												<div class="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
													<p>{loadError.message}</p>
												</div>
												<div class="mt-4">
													<div class="-mx-2 -my-1.5 flex">
														<button
															type="button"
															onclick={refreshData}
															disabled={isRefreshing}
															class="rounded-md bg-yellow-50 px-2 py-1.5 text-sm font-medium text-yellow-800 hover:bg-yellow-100 focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:outline-none disabled:opacity-50 dark:bg-yellow-900/20 dark:text-yellow-200 dark:hover:bg-yellow-900/40"
														>
															{isRefreshing ? 'Retrying...' : 'Retry'}
														</button>
													</div>
												</div>
											</div>
										</div>
									</div>
								{/if}

								<!-- Search and Filters -->
								<div
									class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0"
								>
									<div class="flex flex-1 items-center space-x-4">
										<!-- Search Input -->
										<div
											class="relative max-w-md flex-1"
											role="search"
											aria-label="Contract search"
										>
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
												id="contract-search"
												type="text"
												bind:value={searchTerm}
												oninput={() => handleSearch(searchTerm)}
												placeholder="Поиск по номеру, проекту, компании..."
												class="block w-full rounded-md border-0 py-1.5 pr-3 pl-10 text-gray-900 ring-1 ring-gray-300 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-600 focus:ring-inset sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-white dark:ring-gray-600 dark:placeholder:text-gray-500"
											/>
										</div>
									</div>
								</div>

								<!-- Results summary -->
								{#if searchTerm.trim()}
									<div
										class="mt-4 text-sm text-gray-600 dark:text-gray-400"
										role="status"
										aria-live="polite"
										aria-atomic="true"
									>
										{#if filteredContracts.length === 0}
											Контракты не найдены по запросу "{searchTerm}"
										{:else}
											Найдено {filteredContracts.length} контракт{filteredContracts.length === 1
												? ''
												: filteredContracts.length < 5
													? 'а'
													: 'ов'} по запросу "{searchTerm}"
										{/if}
									</div>
								{/if}

								<!-- Contracts Table -->
								<div class="mt-8">
									<ContractsTable
										contracts={paginatedContracts}
										isLoading={isActionLoading}
										onEditContract={handleEditContract}
										onDeleteContract={handleDeleteContract}
										onViewContract={handleViewContract}
										{updateCounter}
										{searchTerm}
										hasSearched={searchTerm.trim().length > 0}
									/>
								</div>

								<!-- Pagination -->
								<Pagination
									bind:currentPage
									totalItems={filteredContracts.length}
									{itemsPerPage}
									filteredFrom={searchTerm.trim() ? localContracts.length : null}
								/>
							</main>
						</div>
					</div>
				</div>
			{:catch error}
				<!-- Critical error state -->
				<div class="flex min-h-screen items-center justify-center">
					<div class="rounded-lg border border-red-500/30 bg-red-500/20 p-8 text-center">
						<h3 class="mb-4 text-xl font-semibold text-white">Ошибка загрузки контрактов</h3>
						<p class="text-red-300">
							Не удалось загрузить контракты. Попробуйте обновить страницу.
						</p>
					</div>
				</div>
			{/await}
		</ErrorBoundary>
	{/snippet}
</ProtectedRoute>

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

<!-- Contract Add Modal -->
<ContractAddModal
	isOpen={showAddModal}
	onSave={handleSaveNewContract}
	onCancel={handleCancelAddContract}
	isLoading={isActionLoading}
/>

<!-- Contract Edit Modal -->
{#if editingContract}
	<ContractEditModal
		isOpen={showEditModal}
		contract={editingContract}
		onSave={handleSaveContract}
		onCancel={handleCancelEditContract}
		isLoading={isActionLoading}
	/>
{/if}

<!-- Contract View Modal -->
{#if viewingContract}
	<ContractViewModal
		isOpen={showViewModal}
		contract={viewingContract}
		onClose={handleCancelViewContract}
	/>
{/if}
