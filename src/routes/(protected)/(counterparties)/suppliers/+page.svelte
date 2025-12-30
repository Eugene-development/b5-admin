<script>
	import CompanyTable from '$lib/components/counterparties/companies/CompanyTable.svelte';
	import CompanyAddModal from '$lib/components/counterparties/companies/CompanyAddModal.svelte';
	import Pagination from '$lib/components/common/Pagination.svelte';
	import {
		SearchBar,
		PageTitle,
		ConfirmationModal,
		ErrorBoundary,
		TableSkeleton,
		CompanyViewModal,
		CompanyEditModal,
		RefreshButton,
		AddButton
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
	import ProtectedRoute from '$lib/components/common/ProtectedRoute.svelte';
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

	// Pagination state
	let currentPage = $state(1);
	const itemsPerPage = 10;

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

	// Local suppliers state for updates
	let localSuppliers = $state([]);

	// Force update counter for reactivity
	let updateCounter = $state(0);

	// Check for server-side load errors
	let loadError = $state(null);

	// Derived state that transforms streamed data without mutation
	function getProcessedCompanies(data) {
		if (!data || !data.suppliers) {
			return [];
		}

		return data.suppliers.map((supplier) => ({
			...supplier,
			status: supplier.status?.toLowerCase() || 'active'
		}));
	}

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

	// Get paginated suppliers
	let paginatedSuppliers = $derived.by(() => {
		const startIndex = (currentPage - 1) * itemsPerPage;
		const endIndex = startIndex + itemsPerPage;
		return filteredSuppliers.slice(startIndex, endIndex);
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

	// Ban supplier handler with confirmation
	function handleBanSupplier(supplier) {
		const isBanned = supplier.status === 'banned';
		confirmAction = {
			type: isBanned ? 'unban' : 'ban',
			company: supplier,
			title: isBanned ? 'Разбанить компанию' : 'Забанить компанию',
			message: isBanned
				? `Вы уверены, что хотите разбанить компанию "${supplier.name}"? Компания снова сможет получить доступ к системе.`
				: `Вы уверены, что хотите забанить компанию "${supplier.name}"? Компания потеряет доступ к системе.`,
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
			title: 'Удалить компанию',
			message: `Вы уверены, что хотите НАВСЕГДА удалить компанию "${supplier.name}"? Это действие нельзя отменить. Все данные компании будут потеряны.`,
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

	// Open add modal
	function handleAddCompany() {
		showAddModal = true;
		clearAllToasts();
	}

	// Save new company
	async function handleSaveNewCompany(data) {
		isActionLoading = true;

		try {
			// Create company
			const newCompany = await createCompany(data.company);

			// Arrays to store created phones and emails
			const phones = [];
			const emails = [];

			// Create phone if provided
			if (data.phone) {
				const createdPhone = await createCompanyPhone(newCompany.id, data.phone);
				phones.push(createdPhone);
			}

			// Create email if provided
			if (data.email) {
				const createdEmail = await createCompanyEmail(newCompany.id, data.email);
				emails.push(createdEmail);
			}

			// Add to local list with phones and emails
			localSuppliers = [
				...localSuppliers,
				{
					...newCompany,
					status: 'active',
					phones: phones,
					emails: emails,
					phone: phones[0]?.value || null,
					email: emails[0]?.value || null,
					contact_person: phones[0]?.contact_person || emails[0]?.contact_person || null
				}
			];

			addSuccessToast(`Компания "${newCompany.name}" успешно добавлена.`);
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

					// Update in local list
					localSuppliers = localSuppliers.map((supplier) =>
						supplier.id === updatedCompany.id
							? {
									...updatedCompany,
									status: updatedCompany.ban
										? 'banned'
										: updatedCompany.is_active
											? 'active'
											: 'inactive',
									phone: supplier.phone,
									email: supplier.email,
									contact_person: supplier.contact_person,
									phones: supplier.phones,
									emails: supplier.emails,
									status_id: updatedCompany.status_id,
									status: updatedCompany.status
								}
							: supplier
					);

					addSuccessToast(`Компания "${updatedCompany.name}" успешно обновлена.`);
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
						const updatedCompany = await toggleCompanyBan(company.id, true);
						updateSupplierStatus(company.id, 'banned');
						addSuccessToast(`Компания "${company.name}" успешно забанена.`);
					} else if (type === 'unban') {
						const updatedCompany = await toggleCompanyBan(company.id, false);
						updateSupplierStatus(company.id, 'active');
						addSuccessToast(`Компания "${company.name}" успешно разбанена.`);
					} else if (type === 'delete') {
						await deleteCompany(company.id);
						removeSupplierFromList(company.id);
						addSuccessToast(`Компания "${company.name}" успешно удалена.`);
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
			const companies = await refreshCompanies();
			// Filter companies by status slug 'suppliers'
			const suppliersData = companies.filter((company) => company.status?.slug === 'suppliers');
			localSuppliers = suppliersData.map((company) => ({
				...company,
				status: company.ban ? 'banned' : company.is_active ? 'active' : 'inactive',
				// Get primary phone or first phone
				phone: company.phones?.find((p) => p.is_primary)?.value || company.phones?.[0]?.value,
				// Get primary email or first email
				email: company.emails?.find((e) => e.is_primary)?.value || company.emails?.[0]?.value,
				// Get contact person from primary phone or email
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

		// Load data if we have empty initial data (server-side data loading was disabled)
		if (!localSuppliers.length && !loadError) {
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
			fallbackTitle="Suppliers Page Error"
			fallbackMessage="An error occurred while loading the suppliers page."
			showDetails={true}
		>
			{#await data.suppliersData}
				<TableSkeleton columns={7} />
			{:then suppliersData}
				{@const processedCompanies = getProcessedCompanies(suppliersData)}

				<!-- Update local state only once when data arrives -->
				{#if localSuppliers.length === 0 && processedCompanies.length > 0}
					{((localSuppliers = processedCompanies), '')}
				{/if}

				<!-- Set load error if present -->
				{#if suppliersData.error && !loadError}
					{((loadError = suppliersData.error), '')}
				{/if}

				<!-- Show skeleton during initial data refresh when no data is available -->
				{#if isRefreshing && localSuppliers.length === 0}
					<TableSkeleton columns={7} />
				{:else}

				<div class="min-h-screen bg-gray-50 dark:bg-gray-950">
					<div class="px-4 py-7 sm:px-6 lg:px-7">
						<div class="mx-auto ">
							<main id="main-content" aria-labelledby="page-title">
								<!-- Header with H1, Search and Refresh Button -->
								<div class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
									<PageTitle title="Поставщики" />
									<div class="flex items-center space-x-3">
										<div class="w-80">
											<SearchBar bind:value={searchTerm} onSearch={handleSearch} placeholder="Поиск по таблице Поставщики..." />
										</div>
										<!-- Add Button -->
										<AddButton onclick={handleAddCompany} disabled={isActionLoading} />
										<!-- Refresh Button -->
										<RefreshButton {isRefreshing} onclick={refreshData} />
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
										{#if filteredSuppliers.length === 0}
											Поставщики не найдены по запросу "{searchTerm}"
										{:else}
											Найдено {filteredSuppliers.length} поставщик{filteredSuppliers.length === 1
												? ''
												: filteredSuppliers.length < 5
													? 'а'
													: 'ов'} по запросу "{searchTerm}"
										{/if}
									</div>
								{/if}

								<!-- Company Table -->
								<div class="mt-4">
									<CompanyTable
										companies={paginatedSuppliers}
										isLoading={isActionLoading}
										onBanCompany={handleBanSupplier}
										onDeleteCompany={handleDeleteSupplier}
										onViewCompany={handleViewSupplier}
										onEditCompany={handleEditCompany}
										{updateCounter}
										{searchTerm}
										hasSearched={searchTerm.trim().length > 0}
									/>
								</div>

								<!-- Pagination -->
								<Pagination
									bind:currentPage
									totalItems={filteredSuppliers.length}
									{itemsPerPage}
									filteredFrom={searchTerm.trim() ? localSuppliers.length : null}
								/>
							</main>
						</div>
					</div>
				</div>
				{/if}
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
	slug="suppliers"
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
