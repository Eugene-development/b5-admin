<script>
	import ComplaintsTable from '$lib/components/ComplaintsTable.svelte';
	import ComplaintAddModal from '$lib/components/ComplaintAddModal.svelte';
	import ComplaintEditModal from '$lib/components/ComplaintEditModal.svelte';
	import ComplaintViewModal from '$lib/components/ComplaintViewModal.svelte';
	import { ConfirmationModal, ErrorBoundary, TableSkeleton } from '$lib';
	import Pagination from '$lib/components/Pagination.svelte';
	import {
		addSuccessToast,
		addErrorToast,
		handleApiError,
		retryOperation,
		clearAllToasts
	} from '$lib/utils/toastStore.js';
	import {
		createComplaint,
		updateComplaint,
		deleteComplaint,
		refreshComplaints
	} from '$lib/api/complaints.js';
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte';
	import { onMount } from 'svelte';

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
	let editingComplaint = $state(null);

	// View modal state management
	let showViewModal = $state(false);
	let viewingComplaint = $state(null);

	// Error boundary state
	let hasError = $state(false);
	let errorBoundaryError = $state(null);

	// Loading state for data refresh
	let isRefreshing = $state(false);
	let isInitialLoading = $state(true);

	// Local state for complaints, contracts, and orders
	let localComplaints = $state([]);
	let localContracts = $state([]);
	let localOrders = $state([]);

	// Force update counter for reactivity
	let updateCounter = $state(0);

	// Check for server-side load errors
	let loadError = $state(null);

	// Computed filteredComplaints reactive statement
	let filteredComplaints = $derived.by(() => {
		// Filter out any undefined or null complaints first
		let filtered = localComplaints.filter((complaint) => complaint != null);

		// Apply search filter
		if (searchTerm.trim()) {
			const term = searchTerm.toLowerCase().trim();
			filtered = filtered.filter((complaint) => {
				const title = (complaint.title || '').toLowerCase();
				const description = (complaint.description || '').toLowerCase();
				const contractNumber = (complaint.contract?.contract_number || '').toLowerCase();
				const orderNumber = (complaint.order?.order_number || '').toLowerCase();
				const responsiblePerson = (complaint.responsible_person || '').toLowerCase();
				const guiltyParty = (complaint.guilty_party || '').toLowerCase();

				return (
					title.includes(term) ||
					description.includes(term) ||
					contractNumber.includes(term) ||
					orderNumber.includes(term) ||
					responsiblePerson.includes(term) ||
					guiltyParty.includes(term)
				);
			});
		}

		return filtered;
	});

	// Get paginated complaints
	let paginatedComplaints = $derived.by(() => {
		const startIndex = (currentPage - 1) * itemsPerPage;
		const endIndex = startIndex + itemsPerPage;
		return filteredComplaints.slice(startIndex, endIndex);
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

	// Add complaint handler
	function handleAddComplaint() {
		showAddModal = true;
		clearAllToasts();
	}

	// Edit complaint handler
	function handleEditComplaint(complaint) {
		editingComplaint = complaint;
		showEditModal = true;
		clearAllToasts();
	}

	// View complaint handler
	function handleViewComplaint(complaint) {
		viewingComplaint = complaint;
		showViewModal = true;
		clearAllToasts();
	}

	// Delete complaint handler with confirmation
	function handleDeleteComplaint(complaint) {
		confirmAction = {
			type: 'delete',
			complaint: complaint,
			title: 'Удалить рекламацию',
			message: `Вы уверены, что хотите НАВСЕГДА удалить рекламацию "${complaint.title}"? Это действие нельзя отменить.`,
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
			const { type, complaint } = confirmAction;

			await retryOperation(
				async () => {
					if (type === 'delete') {
						await deleteComplaint(complaint.id);
						removeComplaintFromList(complaint.id);
						addSuccessToast(`Рекламация успешно удалена.`);
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

	// Save new complaint
	async function handleSaveNewComplaint(complaintData) {
		isActionLoading = true;

		try {
			await retryOperation(
				async () => {
					const newComplaint = await createComplaint(complaintData);
					localComplaints = [newComplaint, ...localComplaints];
					addSuccessToast('Рекламация успешно создана.');
				},
				2,
				1000
			);
		} catch (error) {
			console.error('Complaint creation failed after retries:', error);
		} finally {
			isActionLoading = false;
			showAddModal = false;
		}
	}

	// Cancel add complaint
	function handleCancelAddComplaint() {
		showAddModal = false;
		isActionLoading = false;
	}

	// Save complaint changes
	async function handleSaveComplaint(updatedComplaintData) {
		isActionLoading = true;

		try {
			await retryOperation(
				async () => {
					const updatedComplaint = await updateComplaint(updatedComplaintData);
					updateComplaintInList(updatedComplaint);
					addSuccessToast('Рекламация успешно обновлена.');
				},
				2,
				1000
			);
		} catch (error) {
			console.error('Complaint update failed after retries:', error);
		} finally {
			isActionLoading = false;
			showEditModal = false;
			editingComplaint = null;
		}
	}

	// Cancel edit complaint
	function handleCancelEditComplaint() {
		showEditModal = false;
		editingComplaint = null;
		isActionLoading = false;
	}

	// Cancel view complaint
	function handleCancelViewComplaint() {
		showViewModal = false;
		viewingComplaint = null;
	}

	// Remove complaint from local state after deletion
	function removeComplaintFromList(complaintId) {
		localComplaints = localComplaints.filter(
			(complaint) => complaint && complaint.id !== complaintId
		);
		updateCounter++;
	}

	// Update complaint in local state after editing
	function updateComplaintInList(updatedComplaint) {
		localComplaints = localComplaints.map((complaint) =>
			complaint && complaint.id === updatedComplaint.id ? updatedComplaint : complaint
		);
		updateCounter++;
	}

	// Refresh data from server
	async function refreshData(isInitialLoad = false) {
		isRefreshing = true;
		if (isInitialLoad) {
			isInitialLoading = true;
		}
		try {
			const complaints = await refreshComplaints();
			localComplaints = complaints;
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
			if (isInitialLoad) {
				isInitialLoading = false;
			}
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

	// Load data on mount if not already loaded
	onMount(() => {
		if (localComplaints.length === 0) {
			refreshData(true);
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
			fallbackTitle="Complaints Page Error"
			fallbackMessage="An error occurred while loading the complaints page."
			showDetails={true}
		>
			<!-- Client-side loaded data -->
			{#if isRefreshing && localComplaints.length === 0}
				<!-- Loading state: Show skeleton -->
				<TableSkeleton columns={9} />
			{:else}
				<!-- Success state: Show data -->
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
												class="text-3xl font-semibold text-gray-900 dark:text-white"
											>
												Рекламации
											</h1>
										</div>
									</div>
									<div class="flex items-center space-x-3">
										<!-- Add Button -->
										<button
											type="button"
											onclick={handleAddComplaint}
											disabled={isActionLoading}
											class="inline-flex items-center rounded-md bg-cyan-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-cyan-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
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
											Добавить рекламацию
										</button>

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
											aria-label="Complaint search"
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
												id="complaint-search"
												type="text"
												bind:value={searchTerm}
												oninput={() => handleSearch(searchTerm)}
												placeholder="Поиск по названию, описанию, контракту..."
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
										{#if filteredComplaints.length === 0}
											Рекламации не найдены по запросу "{searchTerm}"
										{:else}
											Найдено {filteredComplaints.length} рекламаци{filteredComplaints.length === 1
												? 'я'
												: filteredComplaints.length < 5
													? 'и'
													: 'й'} по запросу "{searchTerm}"
										{/if}
									</div>
								{/if}

								<!-- Complaints Table -->
								<div class="mt-8">
									<ComplaintsTable
										complaints={paginatedComplaints}
										isLoading={isActionLoading}
										onEditComplaint={handleEditComplaint}
										onDeleteComplaint={handleDeleteComplaint}
										onViewComplaint={handleViewComplaint}
										{updateCounter}
										{searchTerm}
										hasSearched={searchTerm.trim().length > 0}
									/>
								</div>

								<!-- Pagination -->
								<Pagination
									bind:currentPage
									totalItems={filteredComplaints.length}
									{itemsPerPage}
									filteredFrom={searchTerm.trim() ? localComplaints.length : null}
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

<!-- Complaint Add Modal -->
<ComplaintAddModal
	isOpen={showAddModal}
	onSave={handleSaveNewComplaint}
	onCancel={handleCancelAddComplaint}
	isLoading={isActionLoading}
	contracts={localContracts}
	orders={localOrders}
/>

<!-- Complaint Edit Modal -->
{#if editingComplaint}
	<ComplaintEditModal
		isOpen={showEditModal}
		complaint={editingComplaint}
		onSave={handleSaveComplaint}
		onCancel={handleCancelEditComplaint}
		isLoading={isActionLoading}
		contracts={localContracts}
		orders={localOrders}
	/>
{/if}

<!-- Complaint View Modal -->
{#if viewingComplaint}
	<ComplaintViewModal
		isOpen={showViewModal}
		complaint={viewingComplaint}
		onClose={handleCancelViewComplaint}
	/>
{/if}
