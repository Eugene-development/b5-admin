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

	// Local suppliers state for updates
	let localSuppliers = $state([
		...(data?.suppliers || []).map((supplier) => ({
			...supplier,
			status: supplier.status?.toLowerCase() || 'active'
		}))
	]);

	// Force update counter for reactivity
	let updateCounter = $state(0);

	// Check for server-side load errors
	let loadError = $state(data?.error || null);

	// Computed filteredSuppliers reactive statement
	let filteredSuppliers = $derived.by(() => {
		if (!searchTerm.trim()) {
			return localSuppliers;
		}

		const term = searchTerm.toLowerCase().trim();
		return localSuppliers.filter((supplier) => {
			const name = (supplier.name || '').toLowerCase();
			const legalName = (supplier.legal_name || '').toLowerCase();
			const email = (supplier.email || '').toLowerCase();
			const inn = (supplier.inn || '').toLowerCase();
			const region = (supplier.region || '').toLowerCase();
			const contactPerson = (supplier.contact_person || '').toLowerCase();

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

	// Ban supplier handler with confirmation
	function handleBanSupplier(supplier) {
		const isBanned = supplier.status === 'banned';
		confirmAction = {
			type: isBanned ? 'unban' : 'ban',
			company: supplier,
			title: isBanned ? 'Разбанить поставщика' : 'Забанить поставщика',
			message: isBanned
				? `Вы уверены, что хотите разбанить поставщика "${supplier.name || supplier.email}"? Поставщик снова сможет получить доступ к системе.`
				: `Вы уверены, что хотите забанить поставщика "${supplier.name || supplier.email}"? Поставщик потеряет доступ к системе.`,
			confirmText: isBanned ? 'Разбанить' : 'Забанить',
			isDestructive: !isBanned
		};
		showConfirmModal = true;
		clearAllToasts();
	}

	// Delete supplier handler with confirmation
	function handleDeleteSupplier(supplier) {
		confirmAction = {
			type: 'delete',
			company: supplier,
			title: 'Удалить поставщика',
			message: `Вы уверены, что хотите НАВСЕГДА удалить поставщика "${supplier.name || supplier.email}"? Это действие нельзя отменить. Все данные поставщика будут потеряны.`,
			confirmText: 'Удалить навсегда',
			isDestructive: true
		};
		showConfirmModal = true;
		clearAllToasts();
	}

	// View supplier handler
	function handleViewSupplier(supplier) {
		selectedCompany = supplier;
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
						updateSupplierStatus(company.id, 'banned');
						addSuccessToast(`Поставщик "${company.name || company.email}" успешно забанен.`);
					} else if (type === 'unban') {
						// В реальном приложении здесь будет API запрос
						updateSupplierStatus(company.id, 'active');
						addSuccessToast(`Поставщик "${company.name || company.email}" успешно разбанен.`);
					} else if (type === 'delete') {
						// В реальном приложении здесь будет API запрос
						removeSupplierFromList(company.id);
						addSuccessToast(`Поставщик "${company.name || company.email}" успешно удален.`);
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

	// Update supplier status in local state
	function updateSupplierStatus(supplierId, newStatus) {
		localSuppliers = localSuppliers.map((supplier) =>
			supplier.id === supplierId ? { ...supplier, status: newStatus } : supplier
		);
		updateCounter++;
	}

	// Remove supplier from local state after deletion
	function removeSupplierFromList(supplierId) {
		localSuppliers = localSuppliers.filter((supplier) => supplier.id !== supplierId);
	}

	// Refresh data from server
	async function refreshData(isInitialLoad = false) {
		isRefreshing = true;
		try {
			// В реальном приложении здесь будет API запрос
			// const suppliers = await refreshSuppliers();
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
			fallbackTitle="Suppliers Page Error"
			fallbackMessage="An error occurred while loading the suppliers page."
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
								Поставщики
							</h1>
						</div>
						<div class="flex items-center space-x-3">
							<button
								type="button"
								onclick={refreshData}
								disabled={isRefreshing}
								class="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-700"
								aria-label="Refresh suppliers data from server"
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
					<div class="w-full sm:max-w-md" role="search" aria-label="Supplier search">
						<SearchBar placeholder="Поиск поставщиков" onSearch={handleSearch} value={searchTerm} />
					</div>

					<!-- Results summary -->
					{#if searchTerm.trim()}
						<div
							class="py-2 text-sm text-gray-600 dark:text-gray-400"
							role="status"
							aria-live="polite"
							aria-atomic="true"
						>
							{#if filteredSuppliers.length === 0}
								<p>Поставщики не найдены</p>
							{:else}
								<p>
									Найдено {filteredSuppliers.length} поставщик{filteredSuppliers.length === 1
										? ''
										: filteredSuppliers.length < 5
											? 'а'
											: 'ов'} по запросу "{searchTerm}"
								</p>
							{/if}
						</div>
					{/if}

					<CompanyTable
						companies={filteredSuppliers}
						isLoading={isActionLoading}
						onBanCompany={handleBanSupplier}
						onDeleteCompany={handleDeleteSupplier}
						onViewCompany={handleViewSupplier}
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
