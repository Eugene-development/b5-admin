<script>
	import CompanyTable from '$lib/components/CompanyTable.svelte';
	import {
		SearchBar,
		ConfirmationModal,
		ErrorBoundary,
		LoadingSpinner,
		EmptyState,
		CompanyViewModal
	} from '$lib';
	import {
		toasts,
		addSuccessToast,
		addErrorToast,
		handleApiError,
		retryOperation,
		clearAllToasts
	} from '$lib/utils/toastStore.js';
	import { onMount } from 'svelte';
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte';

	let { data } = $props();

	// Search state management
	let searchTerm = $state('');

	// Action state management
	let isActionLoading = $state(false);
	let showConfirmModal = $state(false);
	let confirmAction = $state(null);

	// View modal state
	let showViewModal = $state(false);
	let selectedCompany = $state(null);

	// Error boundary state
	let hasError = $state(false);
	let errorBoundaryError = $state(null);

	// Loading state for data refresh
	let isRefreshing = $state(false);

	// Local contractors state for updates
	let localContractors = $state([
		...(data?.contractors || []).map((contractor) => ({
			...contractor,
			status: contractor.status?.toLowerCase() || 'active'
		}))
	]);

	// Force update counter for reactivity
	let updateCounter = $state(0);

	// Check for server-side load errors
	let loadError = $state(data?.error || null);

	// Computed filteredContractors reactive statement
	let filteredContractors = $derived.by(() => {
		if (!searchTerm.trim()) {
			return localContractors;
		}

		const term = searchTerm.toLowerCase().trim();
		return localContractors.filter((contractor) => {
			const name = (contractor.name || '').toLowerCase();
			const legalName = (contractor.legal_name || '').toLowerCase();
			const email = (contractor.email || '').toLowerCase();
			const inn = (contractor.inn || '').toLowerCase();
			const region = (contractor.region || '').toLowerCase();
			const contactPerson = (contractor.contact_person || '').toLowerCase();

			return (
				name.includes(term) ||
				legalName.includes(term) ||
				email.includes(term) ||
				inn.includes(term) ||
				region.includes(term) ||
				contactPerson.includes(term)
			);
		});
	});

	// Search handler function
	function handleSearch(term) {
		searchTerm = term;
	}

	// Ban contractor handler with confirmation
	function handleBanContractor(contractor) {
		const isBanned = contractor.status === 'banned';
		confirmAction = {
			type: isBanned ? 'unban' : 'ban',
			company: contractor,
			title: isBanned ? 'Разбанить подрядчика' : 'Забанить подрядчика',
			message: isBanned
				? `Вы уверены, что хотите разбанить подрядчика "${contractor.name || contractor.email}"? Подрядчик снова сможет получить доступ к системе.`
				: `Вы уверены, что хотите забанить подрядчика "${contractor.name || contractor.email}"? Подрядчик потеряет доступ к системе.`,
			confirmText: isBanned ? 'Разбанить' : 'Забанить',
			isDestructive: !isBanned
		};
		showConfirmModal = true;
		clearAllToasts();
	}

	// Delete contractor handler with confirmation
	function handleDeleteContractor(contractor) {
		confirmAction = {
			type: 'delete',
			company: contractor,
			title: 'Удалить подрядчика',
			message: `Вы уверены, что хотите НАВСЕГДА удалить подрядчика "${contractor.name || contractor.email}"? Это действие нельзя отменить. Все данные подрядчика будут потеряны.`,
			confirmText: 'Удалить навсегда',
			isDestructive: true
		};
		showConfirmModal = true;
		clearAllToasts();
	}

	// View contractor handler
	function handleViewContractor(contractor) {
		selectedCompany = contractor;
		showViewModal = true;
	}

	// Close view modal
	function closeViewModal() {
		showViewModal = false;
		selectedCompany = null;
	}

	// Execute confirmed action with retry mechanism
	async function confirmActionHandler() {
		if (!confirmAction) return;

		isActionLoading = true;

		try {
			const { type, company } = confirmAction;

			// Use retry mechanism for critical operations
			await retryOperation(
				async () => {
					if (type === 'ban') {
						// В реальном приложении здесь будет API запрос
						updateContractorStatus(company.id, 'banned');
						addSuccessToast(`Подрядчик "${company.name || company.email}" успешно забанен.`);
					} else if (type === 'unban') {
						// В реальном приложении здесь будет API запрос
						updateContractorStatus(company.id, 'active');
						addSuccessToast(`Подрядчик "${company.name || company.email}" успешно разбанен.`);
					} else if (type === 'delete') {
						// В реальном приложении здесь будет API запрос
						removeContractorFromList(company.id);
						addSuccessToast(`Подрядчик "${company.name || company.email}" успешно удален.`);
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

	// Update contractor status in local state
	function updateContractorStatus(contractorId, newStatus) {
		localContractors = localContractors.map((contractor) =>
			contractor.id === contractorId ? { ...contractor, status: newStatus } : contractor
		);
		updateCounter++;
	}

	// Remove contractor from local state after deletion
	function removeContractorFromList(contractorId) {
		localContractors = localContractors.filter((contractor) => contractor.id !== contractorId);
	}

	// Refresh data from server
	async function refreshData(isInitialLoad = false) {
		isRefreshing = true;
		try {
			// В реальном приложении здесь будет API запрос
			// const contractors = await refreshContractors();
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

	// Handle initial load error
	onMount(() => {
		if (loadError) {
			addErrorToast(loadError.message, { duration: 0 });
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
			fallbackTitle="Contractors Page Error"
			fallbackMessage="An error occurred while loading the contractors page."
			showDetails={true}
		>
			<div class="space-y-6 bg-gray-900">
				<main id="main-content" aria-labelledby="page-title">
					<div
						class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0"
					>
						<div class="flex-auto">
							<h1
								id="page-title"
								class="text-lg font-semibold text-gray-900 sm:text-base dark:text-white"
							>
								Подрядчики
							</h1>
						</div>
						<div class="flex items-center space-x-3">
							<button
								type="button"
								onclick={refreshData}
								disabled={isRefreshing}
								class="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-700"
								aria-label="Refresh contractors data from server"
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
							<button
								type="button"
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
								Добавить
							</button>
						</div>
					</div>

					<!-- Search Bar -->
					<div class="w-full sm:max-w-md" role="search" aria-label="Contractor search">
						<SearchBar placeholder="Поиск подрядчиков" onSearch={handleSearch} value={searchTerm} />
					</div>

					<!-- Results summary -->
					{#if searchTerm.trim()}
						<div
							class="py-2 text-sm text-gray-600 dark:text-gray-400"
							role="status"
							aria-live="polite"
							aria-atomic="true"
						>
							{#if filteredContractors.length === 0}
								<p>Подрядчики не найдены</p>
							{:else}
								<p>
									Найдено {filteredContractors.length} подрядчик{filteredContractors.length === 1
										? ''
										: filteredContractors.length < 5
											? 'а'
											: 'ов'} по запросу "{searchTerm}"
								</p>
							{/if}
						</div>
					{/if}

					<CompanyTable
						companies={filteredContractors}
						isLoading={isActionLoading}
						onBanCompany={handleBanContractor}
						onDeleteCompany={handleDeleteContractor}
						onViewCompany={handleViewContractor}
						{updateCounter}
						{searchTerm}
						hasSearched={searchTerm.trim().length > 0}
					/>
				</main>
			</div>
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

<!-- Company View Modal -->
<CompanyViewModal isOpen={showViewModal} company={selectedCompany} onClose={closeViewModal} />
