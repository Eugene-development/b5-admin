<script>
	import CompanyTable from '$lib/components/counterparties/companies/CompanyTable.svelte';
	import CompanyAddModal from '$lib/components/counterparties/companies/CompanyAddModal.svelte';
	import Pagination from '$lib/components/common/Pagination.svelte';
	import {
		SearchBar,
		ConfirmationModal,
		ErrorBoundary,
		TableSkeleton,
		CompanyViewModal,
		CompanyEditModal,
		RefreshButton,
		AddButton
	} from '$lib';
	import {
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

	let searchTerm = $state('');

	// Pagination state
	let currentPage = $state(1);
	const itemsPerPage = 10;

	let isActionLoading = $state(false);
	let showConfirmModal = $state(false);
	let confirmAction = $state(null);
	let showViewModal = $state(false);
	let selectedCompany = $state(null);
	let showAddModal = $state(false);
	let showEditModal = $state(false);
	let editingCompany = $state(null);
	let hasError = $state(false);
	let errorBoundaryError = $state(null);
	let isRefreshing = $state(false);

	let localContractors = $state([]);
	let updateCounter = $state(0);
	let loadError = $state(null);

	// Derived state that transforms streamed data without mutation
	function getProcessedCompanies(data) {
		if (!data || !data.contractors) {
			return [];
		}

		return data.contractors.map((contractor) => ({
			...contractor,
			operationalStatus: contractor.status?.toLowerCase() || 'active'
		}));
	}

	let filteredContractors = $derived.by(() => {
		if (!searchTerm.trim()) return localContractors;
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

	// Get paginated contractors
	let paginatedContractors = $derived.by(() => {
		const startIndex = (currentPage - 1) * itemsPerPage;
		const endIndex = startIndex + itemsPerPage;
		return filteredContractors.slice(startIndex, endIndex);
	});

	function handleSearch(term) {
		searchTerm = term;
		currentPage = 1;
	}

	// Reset to first page when filters change
	$effect(() => {
		searchTerm;
		currentPage = 1;
	});

	function handleBanContractor(contractor) {
		const isBanned = contractor.operationalStatus === 'banned';
		confirmAction = {
			type: isBanned ? 'unban' : 'ban',
			company: contractor,
			title: isBanned ? 'Разбанить подрядчика' : 'Забанить подрядчика',
			message: isBanned
				? `Вы уверены, что хотите разбанить подрядчика "${contractor.name}"?`
				: `Вы уверены, что хотите забанить подрядчика "${contractor.name}"?`,
			confirmText: isBanned ? 'Разбанить' : 'Забанить',
			isDestructive: !isBanned
		};
		showConfirmModal = true;
		clearAllToasts();
	}

	function handleDeleteContractor(contractor) {
		confirmAction = {
			type: 'delete',
			company: contractor,
			title: 'Удалить подрядчика',
			message: `Вы уверены, что хотите НАВСЕГДА удалить подрядчика "${contractor.name}"?`,
			confirmText: 'Удалить навсегда',
			isDestructive: true
		};
		showConfirmModal = true;
		clearAllToasts();
	}

	function handleViewContractor(contractor) {
		selectedCompany = contractor;
		showViewModal = true;
	}

	function closeViewModal() {
		showViewModal = false;
		selectedCompany = null;
	}

	function handleAddCompany() {
		showAddModal = true;
		clearAllToasts();
	}

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
			localContractors = [
				...localContractors,
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
			addSuccessToast(`Подрядчик "${newCompany.name}" успешно добавлен.`);
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

	function handleCancelAddCompany() {
		showAddModal = false;
		isActionLoading = false;
	}

	function handleEditCompany(company) {
		editingCompany = company;
		showEditModal = true;
		clearAllToasts();
	}

	async function handleUpdateCompany(updatedCompanyData) {
		isActionLoading = true;
		try {
			await retryOperation(
				async () => {
					const updatedCompany = await updateCompany(updatedCompanyData);
					localContractors = localContractors.map((contractor) =>
						contractor.id === updatedCompany.id
							? {
									...updatedCompany,
									operationalStatus: updatedCompany.ban
										? 'banned'
										: updatedCompany.is_active
											? 'active'
											: 'inactive',
									phone: contractor.phone,
									email: contractor.email,
									contact_person: contractor.contact_person,
									phones: contractor.phones,
									emails: contractor.emails
								}
							: contractor
					);
					addSuccessToast(`Подрядчик "${updatedCompany.name}" успешно обновлен.`);
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

	function handleCancelEditCompany() {
		showEditModal = false;
		editingCompany = null;
		isActionLoading = false;
	}

	async function confirmActionHandler() {
		if (!confirmAction) return;
		isActionLoading = true;
		try {
			const { type, company } = confirmAction;
			await retryOperation(
				async () => {
					if (type === 'ban') {
						await toggleCompanyBan(company.id, true);
						updateContractorStatus(company.id, 'banned');
						addSuccessToast(`Подрядчик "${company.name}" успешно забанен.`);
					} else if (type === 'unban') {
						await toggleCompanyBan(company.id, false);
						updateContractorStatus(company.id, 'active');
						addSuccessToast(`Подрядчик "${company.name}" успешно разбанен.`);
					} else if (type === 'delete') {
						await deleteCompany(company.id);
						removeContractorFromList(company.id);
						addSuccessToast(`Подрядчик "${company.name}" успешно удален.`);
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

	function updateContractorStatus(contractorId, newStatus) {
		localContractors = localContractors.map((contractor) =>
			contractor.id === contractorId ? { ...contractor, operationalStatus: newStatus } : contractor
		);
		updateCounter++;
	}

	function removeContractorFromList(contractorId) {
		localContractors = localContractors.filter((contractor) => contractor.id !== contractorId);
	}

	async function refreshData(isInitialLoad = false) {
		isRefreshing = true;
		try {
			const companies = await refreshCompanies();
			// Filter companies by status slug 'contractors'
			const contractorsData = companies.filter((company) => company.status?.slug === 'contractors');
			localContractors = contractorsData.map((company) => ({
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

	function handleErrorBoundaryError(error) {
		hasError = true;
		errorBoundaryError = error;
		handleApiError(error, 'Критическая ошибка');
	}

	async function retryFromErrorBoundary() {
		hasError = false;
		errorBoundaryError = null;
		await refreshData();
	}

	onMount(() => {
		if (loadError) {
			addErrorToast(loadError.message, { duration: 0 });
		}

		// Load data if we have empty initial data (server-side data loading was disabled)
		if (!localContractors.length && !loadError) {
			refreshData(true); // Pass true to indicate initial load
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
			{#await data.contractorsData}
				<TableSkeleton columns={7} />
			{:then contractorsData}
				{@const processedCompanies = getProcessedCompanies(contractorsData)}

				<!-- Update local state only once when data arrives -->
				{#if localContractors.length === 0 && processedCompanies.length > 0}
					{((localContractors = processedCompanies), '')}
				{/if}

				<!-- Set load error if present -->
				{#if contractorsData.error && !loadError}
					{((loadError = contractorsData.error), '')}
				{/if}

				<!-- Show skeleton during initial data refresh when no data is available -->
				{#if isRefreshing && localContractors.length === 0}
					<TableSkeleton columns={7} />
				{:else}
					<div class="min-h-screen bg-gray-50 dark:bg-gray-950">
						<div class="px-4 py-8 sm:px-6 lg:px-8">
							<div class="mx-auto max-w-7xl">
								<main id="main-content" aria-labelledby="page-title">
									<!-- Header with Refresh and Add Buttons -->
									<div
										class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between"
									>
										<div class="flex items-center justify-between">
											<div>
												<h1
													id="page-title"
													class="text-3xl font-semibold text-gray-900 dark:text-white"
												>
													Подрядчики
												</h1>
											</div>
										</div>
										<div class="flex items-center space-x-3">
											<!-- Add Button -->
											<AddButton onclick={handleAddCompany} disabled={isActionLoading} />

											<!-- Refresh Button -->
											<RefreshButton {isRefreshing} onclick={refreshData} />
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
													id="contractor-search"
													type="text"
													bind:value={searchTerm}
													oninput={() => handleSearch(searchTerm)}
													placeholder="Поиск по таблице..."
													class="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-white dark:ring-gray-600 dark:placeholder:text-gray-500"
												/>
											</div>
										</div>
									</div>

									<!-- Results summary -->
									{#if searchTerm.trim()}
										<div class="mt-4 text-sm text-gray-600 dark:text-gray-400">
											{#if filteredContractors.length === 0}
												Подрядчики не найдены по запросу "{searchTerm}"
											{:else}
												Найдено {filteredContractors.length} подрядчик{filteredContractors.length ===
												1
													? ''
													: filteredContractors.length < 5
														? 'а'
														: 'ов'} по запросу "{searchTerm}"
											{/if}
										</div>
									{/if}

									<!-- Company Table -->
									<div class="mt-8">
										<CompanyTable
											companies={paginatedContractors}
											isLoading={isActionLoading}
											onBanCompany={handleBanContractor}
											onDeleteCompany={handleDeleteContractor}
											onViewCompany={handleViewContractor}
											onEditCompany={handleEditCompany}
											{updateCounter}
											{searchTerm}
											hasSearched={searchTerm.trim().length > 0}
										/>
									</div>

									<!-- Pagination -->
									<Pagination
										bind:currentPage
										totalItems={filteredContractors.length}
										{itemsPerPage}
										filteredFrom={searchTerm.trim() ? localContractors.length : null}
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

<CompanyViewModal isOpen={showViewModal} company={selectedCompany} onClose={closeViewModal} />

<CompanyAddModal
	isOpen={showAddModal}
	onSave={handleSaveNewCompany}
	onCancel={handleCancelAddCompany}
	isLoading={isActionLoading}
	slug="contractors"
/>

{#if editingCompany}
	<CompanyEditModal
		isOpen={showEditModal}
		company={editingCompany}
		onSave={handleUpdateCompany}
		onCancel={handleCancelEditCompany}
		isLoading={isActionLoading}
	/>
{/if}
