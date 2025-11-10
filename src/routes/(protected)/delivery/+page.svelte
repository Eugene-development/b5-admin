<script>
	import CompanyTable from '$lib/components/CompanyTable.svelte';
	import CompanyAddModal from '$lib/components/CompanyAddModal.svelte';
	import {
		SearchBar,
		ConfirmationModal,
		ErrorBoundary,
		TableSkeleton,
		CompanyViewModal,
		CompanyEditModal
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
	import {
		createCompany,
		createCompanyPhone,
		createCompanyEmail,
		updateCompany,
		toggleCompanyBan,
		deleteCompany,
		refreshCompanies,
		DuplicateInnError
	} from '$lib/api/companies.js';

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

	// Add modal state
	let showAddModal = $state(false);

	// Edit modal state
	let showEditModal = $state(false);
	let editingCompany = $state(null);

	// Error boundary state
	let hasError = $state(false);
	let errorBoundaryError = $state(null);

	// Loading state for data refresh
	let isRefreshing = $state(false);

	// Local delivery companies state for updates
	let localDeliveryCompanies = $state([]);

	// Force update counter for reactivity
	let updateCounter = $state(0);

	// Check for server-side load errors
	let loadError = $state(null);

	// Derived state that transforms streamed data without mutation
	function getProcessedCompanies(data) {
		if (!data || !data.deliveryCompanies) {
			return [];
		}

		return data.deliveryCompanies.map((company) => ({
			...company,
			status: company.status?.toLowerCase() || 'active'
		}));
	}

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

	// View delivery company handler
	function handleViewDeliveryCompany(company) {
		selectedCompany = company;
		showViewModal = true;
	}

	// Close view modal
	function closeViewModal() {
		showViewModal = false;
		selectedCompany = null;
	}

	// Open add modal
	function handleAddCompany() {
		showAddModal = true;
		clearAllToasts();
	}

	// Save new company
	async function handleSaveNewCompany(data) {
		isActionLoading = true;
		try {
			const newCompany = await createCompany(data.company);
			const phones = [];
			const emails = [];
			if (data.phone) {
				const createdPhone = await createCompanyPhone(newCompany.id, data.phone);
				phones.push(createdPhone);
			}
			if (data.email) {
				const createdEmail = await createCompanyEmail(newCompany.id, data.email);
				emails.push(createdEmail);
			}
			localDeliveryCompanies = [
				...localDeliveryCompanies,
				{
					...newCompany,
					status: 'active',
					phones,
					emails,
					phone: phones[0]?.value || null,
					email: emails[0]?.value || null,
					contact_person: phones[0]?.contact_person || emails[0]?.contact_person || null
				}
			];
			addSuccessToast(`Служба доставки "${newCompany.name}" успешно добавлена.`);
			showAddModal = false;
		} catch (error) {
			if (error instanceof DuplicateInnError) {
				// Don't close modal for duplicate INN - let user correct it
				isActionLoading = false;
				return;
			}
			console.error('Failed to create company:', error);
			showAddModal = false;
		} finally {
			isActionLoading = false;
		}
	}

	// Cancel add company
	function handleCancelAddCompany() {
		showAddModal = false;
		isActionLoading = false;
	}

	// Open edit modal
	function handleEditCompany(company) {
		editingCompany = company;
		showEditModal = true;
		clearAllToasts();
	}

	// Save company changes (edit)
	async function handleUpdateCompany(updatedCompanyData) {
		isActionLoading = true;
		try {
			await retryOperation(
				async () => {
					const updatedCompany = await updateCompany(updatedCompanyData);
					localDeliveryCompanies = localDeliveryCompanies.map((company) =>
						company.id === updatedCompany.id
							? {
									...updatedCompany,
									status: updatedCompany.ban
										? 'banned'
										: updatedCompany.is_active
											? 'active'
											: 'inactive',
									phone: company.phone,
									email: company.email,
									contact_person: company.contact_person,
									phones: company.phones,
									emails: company.emails
								}
							: company
					);
					addSuccessToast(`Служба доставки "${updatedCompany.name}" успешно обновлена.`);
				},
				2,
				1000
			);
		} catch (error) {
			console.error('Failed to update company:', error);
		} finally {
			isActionLoading = false;
			showEditModal = false;
			editingCompany = null;
		}
	}

	// Cancel edit company
	function handleCancelEditCompany() {
		showEditModal = false;
		editingCompany = null;
		isActionLoading = false;
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
						await toggleCompanyBan(company.id, true);
						updateDeliveryCompanyStatus(company.id, 'banned');
						addSuccessToast(`Служба доставки "${company.name}" успешно забанена.`);
					} else if (type === 'unban') {
						await toggleCompanyBan(company.id, false);
						updateDeliveryCompanyStatus(company.id, 'active');
						addSuccessToast(`Служба доставки "${company.name}" успешно разбанена.`);
					} else if (type === 'delete') {
						await deleteCompany(company.id);
						removeDeliveryCompanyFromList(company.id);
						addSuccessToast(`Служба доставки "${company.name}" успешно удалена.`);
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
			const companies = await refreshCompanies();
			// Filter companies by status slug 'delivery'
			const deliveryData = companies.filter((company) => company.status?.slug === 'delivery');
			localDeliveryCompanies = deliveryData.map((company) => ({
				...company,
				status: company.ban ? 'banned' : company.is_active ? 'active' : 'inactive',
				phone: company.phones?.find((p) => p.is_primary)?.value || company.phones?.[0]?.value,
				email: company.emails?.find((e) => e.is_primary)?.value || company.emails?.[0]?.value,
				contact_person:
					company.phones?.find((p) => p.is_primary)?.contact_person ||
					company.emails?.find((e) => e.is_primary)?.contact_person ||
					company.phones?.[0]?.contact_person ||
					company.emails?.[0]?.contact_person
			}));
			loadError = null;
			updateCounter++;
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
			{#await data.deliveryData}
				<TableSkeleton columns={7} />
			{:then deliveryData}
				{@const processedCompanies = getProcessedCompanies(deliveryData)}

				<!-- Update local state only once when data arrives -->
				{#if localDeliveryCompanies.length === 0 && processedCompanies.length > 0}
					{(localDeliveryCompanies = processedCompanies, '')}
				{/if}

				<!-- Set load error if present -->
				{#if deliveryData.error && !loadError}
					{(loadError = deliveryData.error, '')}
				{/if}

				<div class="space-y-6 bg-gray-950">
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
							<div class="flex items-center space-x-3">
								<button
									type="button"
									onclick={refreshData}
									disabled={isRefreshing}
									class="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus-visible:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-700"
									aria-label="Refresh delivery companies data from server"
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
									onclick={handleAddCompany}
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
									Добавить
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
							onViewCompany={handleViewDeliveryCompany}
							onEditCompany={handleEditCompany}
							{updateCounter}
							{searchTerm}
							hasSearched={searchTerm.trim().length > 0}
						/>
					</main>
				</div>
			{:catch error}
				<div class="flex min-h-screen items-center justify-center bg-gray-950">
					<div class="text-center">
						<p class="text-lg text-red-500">Ошибка загрузки данных</p>
						<p class="mt-2 text-sm text-gray-400">{error.message}</p>
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

<!-- Company View Modal -->
<CompanyViewModal isOpen={showViewModal} company={selectedCompany} onClose={closeViewModal} />

<!-- Company Add Modal -->
<CompanyAddModal
	isOpen={showAddModal}
	onSave={handleSaveNewCompany}
	onCancel={handleCancelAddCompany}
	isLoading={isActionLoading}
	slug="delivery"
/>

<!-- Company Edit Modal -->
{#if editingCompany}
	<CompanyEditModal
		isOpen={showEditModal}
		company={editingCompany}
		onSave={handleUpdateCompany}
		onCancel={handleCancelEditCompany}
		isLoading={isActionLoading}
	/>
{/if}
