<script>
	import {
		ContractsTable,
		ContractAddModal,
		ContractEditModal,
		ContractViewModal,
		ConfirmationModal,
		ErrorBoundary,
		TableSkeleton,
		RefreshButton,
		AddButton,
		SearchBar,
		PageTitle
	} from '$lib';
	import Pagination from '$lib/components/common/Pagination.svelte';
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
		refreshContracts,
		getContractStatuses,
		addContractComment,
		updateContractComment
	} from '$lib/api/contracts.js';
	import { getPartnerPaymentStatuses } from '$lib/api/finances.js';
	import ProtectedRoute from '$lib/components/common/ProtectedRoute.svelte';

	let { data } = $props();

	// Search state management
	let searchTerm = $state('');

	// Pagination state
	let currentPage = $state(1);
	const itemsPerPage = 10;

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
	let isLoading = $state(true); // Start with true to show skeleton initially

	// Local contracts state for updates
	let localContracts = $state([]);

	// Force update counter for reactivity
	let updateCounter = $state(0);

	// Check for server-side load errors
	let loadError = $state(null);

	// Partner payment statuses
	let partnerPaymentStatuses = $state([]);

	// Contract statuses
	let contractStatuses = $state([]);

	// Computed filteredContracts reactive statement
	let filteredContracts = $derived.by(() => {
		// Explicitly depend on updateCounter to ensure reactivity
		updateCounter;

		// Filter out any undefined or null contracts first
		let filtered = localContracts.filter((contract) => contract != null);

		// Sort by created_at in descending order (newest first)
		filtered = filtered.sort((a, b) => {
			const dateA = new Date(a.created_at || 0);
			const dateB = new Date(b.created_at || 0);
			return dateB - dateA; // Descending order
		});

		// Apply search filter
		if (searchTerm.trim()) {
			const term = searchTerm.toLowerCase().trim();
			filtered = filtered.filter((contract) => {
				const contractNumber = (contract.contract_number || '').toLowerCase();
				const projectName = (contract.project?.project_number || '').toLowerCase();
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

	// Calculate total pages
	let totalPages = $derived(Math.ceil(filteredContracts.length / itemsPerPage));

	// Auto-correct currentPage if it exceeds total pages after deletion
	$effect(() => {
		if (totalPages > 0 && currentPage > totalPages) {
			currentPage = totalPages;
		}
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
			title: 'Удалить договор',
			message: `Вы уверены, что хотите НАВСЕГДА удалить договор ${contract.contract_number || 'без номера'}? Это действие нельзя отменить.`,
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
						addSuccessToast(`Договор удален.`);
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
	async function handleSaveNewContract(contractData, comment = null) {
		isActionLoading = true;

		try {
			await retryOperation(
				async () => {
					const newContract = await createContract(contractData);

					// Если есть комментарий, добавляем его
					if (comment) {
						const newComment = await addContractComment(newContract.id, comment);
						newContract.comments = [newComment];
					}

					localContracts = [newContract, ...localContracts];
					addSuccessToast('Договор создан.');
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
	async function handleSaveContract(updatedContractData, commentData = null) {
		isActionLoading = true;

		try {
			await retryOperation(
				async () => {
					const updatedContract = await updateContract(updatedContractData);

					// Обрабатываем комментарий
					if (commentData && commentData.value) {
						if (commentData.commentId) {
							// Обновляем существующий комментарий
							const updatedComment = await updateContractComment(
								commentData.commentId,
								commentData.value
							);
							updatedContract.comments = [updatedComment];
						} else {
							// Добавляем новый комментарий
							const newComment = await addContractComment(updatedContract.id, commentData.value);
							updatedContract.comments = [newComment];
						}
					}

					updateContractInList(updatedContract);
					addSuccessToast('Договор обновлен.');
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

		// Check if current page is now empty and adjust if needed
		const newTotalPages = Math.ceil(
			(searchTerm.trim()
				? localContracts.filter((contract) => {
						const term = searchTerm.toLowerCase().trim();
						const contractNumber = (contract.contract_number || '').toLowerCase();
						const projectName = (contract.project?.project_number || '').toLowerCase();
						const companyName = (contract.company?.name || '').toLowerCase();
						return (
							contractNumber.includes(term) ||
							projectName.includes(term) ||
							companyName.includes(term)
						);
					}).length
				: localContracts.length) / itemsPerPage
		);

		if (newTotalPages > 0 && currentPage > newTotalPages) {
			currentPage = newTotalPages;
		}
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
			const [contracts, paymentStatuses, statuses] = await Promise.all([
				refreshContracts(),
				getPartnerPaymentStatuses(),
				getContractStatuses()
			]);
			localContracts = contracts;
			partnerPaymentStatuses = paymentStatuses;
			contractStatuses = statuses;
			loadError = null;

			if (!isInitialLoad) {
				addSuccessToast('Данные обновлены');
			}
		} catch (error) {
			handleApiError(
				error,
				isInitialLoad ? 'Не удалось загрузить данные' : 'Не удалось обновить данные'
			);
		} finally {
			isRefreshing = false;
			isLoading = false; // Set to false after first load
		}
	}

	// Handle partner payment status change
	function handlePartnerPaymentStatusChange(contractId, result) {
		// Simply trigger a refresh to get updated data from server
		refreshData();
	}

	// Handle contract status change
	function handleContractStatusChange(contractId, result) {
		// Update local state with new status
		localContracts = localContracts.map((contract) =>
			contract && contract.id === contractId
				? { ...contract, status: result.status, status_id: result.status_id }
				: contract
		);
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

	// Handle initial load
	onMount(async () => {
		console.log('🚀 Contracts page onMount called');

		if (loadError) {
			addErrorToast(loadError.message, { duration: 0 });
		}

		// Always load statuses
		try {
			const [paymentStatuses, statuses] = await Promise.all([
				partnerPaymentStatuses.length === 0
					? getPartnerPaymentStatuses()
					: Promise.resolve(partnerPaymentStatuses),
				contractStatuses.length === 0 ? getContractStatuses() : Promise.resolve(contractStatuses)
			]);
			partnerPaymentStatuses = paymentStatuses;
			contractStatuses = statuses;
		} catch (error) {
			console.error('Failed to load statuses:', error);
		}

		// Check if we have SSR data
		console.log('📊 Checking SSR data:', {
			hasData: !!data.contractsData,
			contractsCount: data.contractsData?.contracts?.length,
			localContractsCount: localContracts.length
		});

		// If we have SSR data, use it and stop loading
		if (data.contractsData?.contracts?.length > 0) {
			console.log('✅ Using SSR data');
			localContracts = data.contractsData.contracts;
			isLoading = false;
		} else if (!localContracts.length && !loadError) {
			// Load data if we have empty initial data
			console.log('⚠️ No SSR data, loading client-side');
			refreshData(true);
		} else {
			isLoading = false;
		}
	});
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
			{@const contractsData = data.contractsData}
			{@const processedContracts = getProcessedContracts(contractsData)}

			<!-- Update local state only once when data arrives -->
			{#if localContracts.length === 0 && processedContracts.length > 0}
				{((localContracts = processedContracts), '')}
			{/if}

			<!-- Set load error if present -->
			{#if contractsData.error && !loadError}
				{((loadError = contractsData.error), '')}
			{/if}

			<!-- Show skeleton during initial load or refresh when no data is available -->
			{#if isLoading || (isRefreshing && localContracts.length === 0)}
				<TableSkeleton columns={10} />
			{:else}
				<!-- Skip link for keyboard navigation -->
				<a
					href="#main-content"
					class="sr-only z-50 rounded-md bg-indigo-600 px-4 py-2 text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
				>
					Перейти к основному контенту
				</a>

				<div class="min-h-screen bg-gray-50 dark:bg-gray-950">
					<div class="px-4 py-7 sm:px-6 lg:px-7">
						<div class="mx-auto">
							<!-- Page landmark -->
							<main id="main-content" aria-labelledby="page-title">
								<!-- Header with H1, Search and Refresh Button -->
								<div
									class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0"
								>
									<PageTitle title="Договора" />
									<div class="flex items-center space-x-3">
										<div class="w-80">
											<SearchBar
												bind:value={searchTerm}
												onSearch={handleSearch}
												placeholder="Поиск по таблице Договора..."
											/>
										</div>
										<!-- Add Button -->
										<AddButton onclick={handleAddContract} disabled={isActionLoading} />
										<!-- Refresh Button -->
										<RefreshButton
											{isRefreshing}
											onclick={(event) => {
												event.stopPropagation();
												refreshData();
											}}
										/>
									</div>
								</div>

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
															class="rounded-md bg-yellow-50 px-2 py-1.5 text-sm font-medium text-yellow-800 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2 focus:ring-offset-yellow-50 disabled:opacity-50 dark:bg-yellow-900/20 dark:text-yellow-200 dark:hover:bg-yellow-900/40"
														>
															{isRefreshing ? 'Retrying...' : 'Retry'}
														</button>
													</div>
												</div>
											</div>
										</div>
									</div>
								{/if}

								<!-- Results summary -->
								{#if searchTerm.trim()}
									<div
										class="mt-4 text-sm text-gray-600 dark:text-gray-400"
										role="status"
										aria-live="polite"
										aria-atomic="true"
									>
										{#if filteredContracts.length === 0}
											Договора не найдены по запросу "{searchTerm}"
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
								<div class="mt-4">
									<ContractsTable
										contracts={paginatedContracts}
										isLoading={isActionLoading}
										onEditContract={handleEditContract}
										onDeleteContract={handleDeleteContract}
										onViewContract={handleViewContract}
										onPartnerPaymentStatusChange={handlePartnerPaymentStatusChange}
										onContractStatusChange={handleContractStatusChange}
										{partnerPaymentStatuses}
										{contractStatuses}
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
			{/if}
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
		{partnerPaymentStatuses}
		onPartnerPaymentStatusChange={(result) => {
			handlePartnerPaymentStatusChange(viewingContract.id, result);
			viewingContract = { ...viewingContract, ...result };
		}}
	/>
{/if}
