<script>
	import CompanyTable from '$lib/components/CompanyTable.svelte';
	import {
		SearchBar,
		ConfirmationModal,
		ToastContainer,
		ErrorBoundary,
		LoadingSpinner,
		EmptyState
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

	// Error boundary state
	let hasError = $state(false);
	let errorBoundaryError = $state(null);

	// Loading state for data refresh
	let isRefreshing = $state(false);

	// Local delivery companies state for updates
	let localDeliveryCompanies = $state([
		...(data?.deliveryCompanies || []).map((company) => ({
			...company,
			status: company.status?.toLowerCase() || 'active'
		}))
	]);

	// Force update counter for reactivity
	let updateCounter = $state(0);

	// Check for server-side load errors
	let loadError = $state(data?.error || null);

	// Computed filteredDeliveryCompanies reactive statement
	let filteredDeliveryCompanies = $derived.by(() => {
		if (!searchTerm.trim()) {
			return localDeliveryCompanies;
		}

		const term = searchTerm.toLowerCase().trim();
		return localDeliveryCompanies.filter((company) => {
			const name = (company.name || '').toLowerCase();
			const legalName = (company.legal_name || '').toLowerCase();
			const email = (company.email || '').toLowerCase();
			const inn = (company.inn || '').toLowerCase();
			const region = (company.region || '').toLowerCase();
			const contactPerson = (company.contact_person || '').toLowerCase();

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

	// Ban delivery company handler with confirmation
	function handleBanDeliveryCompany(company) {
		const isBanned = company.status === 'banned';
		confirmAction = {
			type: isBanned ? 'unban' : 'ban',
			company: company,
			title: isBanned ? 'Разбанить службу доставки' : 'Забанить службу доставки',
			message: isBanned
				? `Вы уверены, что хотите разбанить службу доставки "${company.name || company.email}"? Служба снова сможет получить доступ к системе.`
				: `Вы уверены, что хотите забанить службу доставки "${company.name || company.email}"? Служба потеряет доступ к системе.`,
			confirmText: isBanned ? 'Разбанить' : 'Забанить',
			isDestructive: !isBanned
		};
		showConfirmModal = true;
		clearAllToasts();
	}

	// Delete delivery company handler with confirmation
	function handleDeleteDeliveryCompany(company) {
		confirmAction = {
			type: 'delete',
			company: company,
			title: 'Удалить службу доставки',
			message: `Вы уверены, что хотите НАВСЕГДА удалить службу доставки "${company.name || company.email}"? Это действие нельзя отменить. Все данные службы будут потеряны.`,
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
			const { type, company } = confirmAction;

			// Use retry mechanism for critical operations
			await retryOperation(
				async () => {
					if (type === 'ban') {
						// В реальном приложении здесь будет API запрос
						updateDeliveryCompanyStatus(company.id, 'banned');
						addSuccessToast(`Служба доставки "${company.name || company.email}" успешно забанена.`);
					} else if (type === 'unban') {
						// В реальном приложении здесь будет API запрос
						updateDeliveryCompanyStatus(company.id, 'active');
						addSuccessToast(
							`Служба доставки "${company.name || company.email}" успешно разбанена.`
						);
					} else if (type === 'delete') {
						// В реальном приложении здесь будет API запрос
						removeDeliveryCompanyFromList(company.id);
						addSuccessToast(`Служба доставки "${company.name || company.email}" успешно удалена.`);
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

	// Update delivery company status in local state
	function updateDeliveryCompanyStatus(companyId, newStatus) {
		localDeliveryCompanies = localDeliveryCompanies.map((company) =>
			company.id === companyId ? { ...company, status: newStatus } : company
		);
		updateCounter++;
	}

	// Remove delivery company from local state after deletion
	function removeDeliveryCompanyFromList(companyId) {
		localDeliveryCompanies = localDeliveryCompanies.filter((company) => company.id !== companyId);
	}

	// Refresh data from server
	async function refreshData(isInitialLoad = false) {
		isRefreshing = true;
		try {
			// В реальном приложении здесь будет API запрос
			// const deliveryCompanies = await refreshDeliveryCompanies();
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
			fallbackTitle="Delivery Page Error"
			fallbackMessage="An error occurred while loading the delivery page."
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
								Службы доставки
							</h1>
						</div>
						<div class="flex-none">
							<button
								type="button"
								onclick={refreshData}
								disabled={isRefreshing}
								class="inline-flex min-h-[44px] w-full items-center justify-center rounded-md bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-150 ease-in-out hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
								aria-label="Refresh delivery companies data from server"
							>
								{#if isRefreshing}
									<LoadingSpinner size="sm" color="white" inline={true} class="mr-2" />
								{/if}
								{isRefreshing ? 'Обновляю...' : 'Обновить данные'}
							</button>
						</div>
					</div>

					<!-- Search Bar -->
					<div class="w-full sm:max-w-md" role="search" aria-label="Delivery company search">
						<SearchBar
							placeholder="Поиск служб доставки"
							onSearch={handleSearch}
							value={searchTerm}
						/>
					</div>

					<!-- Results summary -->
					{#if searchTerm.trim()}
						<div
							class="py-2 text-sm text-gray-600 dark:text-gray-400"
							role="status"
							aria-live="polite"
							aria-atomic="true"
						>
							{#if filteredDeliveryCompanies.length === 0}
								<p>Службы доставки не найдены</p>
							{:else}
								<p>
									Найдено {filteredDeliveryCompanies.length} служб{filteredDeliveryCompanies.length ===
									1
										? 'а'
										: filteredDeliveryCompanies.length < 5
											? 'ы'
											: ''} доставки по запросу "{searchTerm}"
								</p>
							{/if}
						</div>
					{/if}

					<CompanyTable
						companies={filteredDeliveryCompanies}
						isLoading={isActionLoading}
						onBanCompany={handleBanDeliveryCompany}
						onDeleteCompany={handleDeleteDeliveryCompany}
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

<!-- Toast Notifications -->
<ToastContainer toasts={$toasts} position="top-center" />
