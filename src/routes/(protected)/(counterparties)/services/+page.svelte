<script>
	import CompanyTable from '$lib/components/counterparties/companies/CompanyTable.svelte';
	import CompanyAddModal from '$lib/components/counterparties/companies/CompanyAddModal.svelte';
	import Pagination from '$lib/components/common/Pagination.svelte';
	import {
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
	const itemsPerPage = 8;

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

	let localServices = $state([]);
	let updateCounter = $state(0);
	let loadError = $state(null);

	// Derived state that transforms streamed data without mutation
	function getProcessedCompanies(data) {
		if (!data || !data.services) {
			return [];
		}

		return data.services.map((service) => ({
			...service,
			status: service.status?.toLowerCase() || 'active'
		}));
	}

	let filteredServices = $derived.by(() => {
		if (!searchTerm.trim()) return localServices;
		const term = searchTerm.toLowerCase().trim();
		return localServices.filter((service) => {
			const name = (service.name || '').toLowerCase();
			const legalName = (service.legal_name || '').toLowerCase();
			const email = (service.email || '').toLowerCase();
			const inn = (service.inn || '').toLowerCase();
			const region = (service.region || '').toLowerCase();
			const contactPerson = (service.contact_person || '').toLowerCase();
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

	// Get paginated services
	let paginatedServices = $derived.by(() => {
		const startIndex = (currentPage - 1) * itemsPerPage;
		const endIndex = startIndex + itemsPerPage;
		return filteredServices.slice(startIndex, endIndex);
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

	function handleBanService(service) {
		const isBanned = service.status === 'banned';
		confirmAction = {
			type: isBanned ? 'unban' : 'ban',
			company: service,
			title: isBanned ? 'Разбанить сервис' : 'Забанить сервис',
			message: isBanned
				? `Вы уверены, что хотите разбанить сервис "${service.name}"?`
				: `Вы уверены, что хотите забанить сервис "${service.name}"?`,
			confirmText: isBanned ? 'Разбанить' : 'Забанить',
			isDestructive: !isBanned
		};
		showConfirmModal = true;
		clearAllToasts();
	}

	function handleDeleteService(service) {
		confirmAction = {
			type: 'delete',
			company: service,
			title: 'Удалить сервис',
			message: `Вы уверены, что хотите НАВСЕГДА удалить сервис "${service.name}"?`,
			confirmText: 'Удалить навсегда',
			isDestructive: true
		};
		showConfirmModal = true;
		clearAllToasts();
	}

	function handleViewService(service) {
		selectedCompany = service;
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
			localServices = [
				...localServices,
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
			addSuccessToast(`Сервис "${newCompany.name}" успешно добавлен.`);
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
					localServices = localServices.map((service) =>
						service.id === updatedCompany.id
							? {
									...updatedCompany,
									status: updatedCompany.ban
										? 'banned'
										: updatedCompany.is_active
											? 'active'
											: 'inactive',
									phone: service.phone,
									email: service.email,
									contact_person: service.contact_person,
									phones: service.phones,
									emails: service.emails
								}
							: service
					);
					addSuccessToast(`Сервис "${updatedCompany.name}" успешно обновлен.`);
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
						updateServiceStatus(company.id, 'banned');
						addSuccessToast(`Сервис "${company.name}" успешно забанен.`);
					} else if (type === 'unban') {
						await toggleCompanyBan(company.id, false);
						updateServiceStatus(company.id, 'active');
						addSuccessToast(`Сервис "${company.name}" успешно разбанен.`);
					} else if (type === 'delete') {
						await deleteCompany(company.id);
						removeServiceFromList(company.id);
						addSuccessToast(`Сервис "${company.name}" успешно удален.`);
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

	function updateServiceStatus(serviceId, newStatus) {
		localServices = localServices.map((service) =>
			service.id === serviceId ? { ...service, status: newStatus } : service
		);
		updateCounter++;
	}

	function removeServiceFromList(serviceId) {
		localServices = localServices.filter((service) => service.id !== serviceId);
	}

	async function refreshData(isInitialLoad = false) {
		isRefreshing = true;
		try {
			const companies = await refreshCompanies();
			// Filter companies by status slug 'services'
			const servicesData = companies.filter((company) => company.status?.slug === 'services');
			localServices = servicesData.map((company) => ({
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
		if (!localServices.length && !loadError) {
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
			fallbackTitle="Services Page Error"
			fallbackMessage="An error occurred while loading the services page."
			showDetails={true}
		>
			{#await data.servicesData}
				<TableSkeleton columns={7} />
			{:then servicesData}
				{@const processedCompanies = getProcessedCompanies(servicesData)}

				<!-- Update local state only once when data arrives -->
				{#if localServices.length === 0 && processedCompanies.length > 0}
					{((localServices = processedCompanies), '')}
				{/if}

				<!-- Set load error if present -->
				{#if servicesData.error && !loadError}
					{((loadError = servicesData.error), '')}
				{/if}

				<!-- Show skeleton during initial data refresh when no data is available -->
				{#if isRefreshing && localServices.length === 0}
					<TableSkeleton columns={7} />
				{:else}

				<div class="min-h-screen bg-gray-50 dark:bg-gray-950">
					<div class="px-4 py-7 sm:px-6 lg:px-7">
						<div class="mx-auto ">
							<main id="main-content" aria-labelledby="page-title">
								<!-- Header with Refresh Button -->
								<div
									class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0"
								>
									<div class="flex items-center justify-between">
										<div>
											<h1
												id="page-title"
												class="text-4xl font-semibold text-gray-900 dark:text-white"
											>
												Сервисы
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

								<div
									class="mb-6 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0"
								>
									<div class="flex flex-1 items-center space-x-4">
										<!-- Search Input -->
										<div class="relative max-w-md flex-1" role="search" aria-label="Service search">
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
												id="service-search"
												type="text"
												bind:value={searchTerm}
												oninput={() => handleSearch(searchTerm)}
												placeholder="Поиск по таблице..."
												class="block w-full rounded-md border-0 py-1.5 pr-3 pl-10 text-gray-900 ring-1 ring-gray-300 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-600 focus:ring-inset sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-white dark:ring-gray-600 dark:placeholder:text-gray-500"
											/>
										</div>
									</div>
								</div>

								{#if searchTerm.trim()}
									<div class="mb-4 text-sm text-gray-600 dark:text-gray-400">
										{#if filteredServices.length === 0}
											<p>Сервисы не найдены</p>
										{:else}
											<p>
												Найдено {filteredServices.length} сервис{filteredServices.length === 1
													? ''
													: filteredServices.length < 5
														? 'а'
														: 'ов'} по запросу "{searchTerm}"
											</p>
										{/if}
									</div>
								{/if}

								<CompanyTable
									companies={paginatedServices}
									isLoading={isActionLoading}
									onBanCompany={handleBanService}
									onDeleteCompany={handleDeleteService}
									onViewCompany={handleViewService}
									onEditCompany={handleEditCompany}
									{updateCounter}
									{searchTerm}
									hasSearched={searchTerm.trim().length > 0}
								/>

								<!-- Pagination -->
								<Pagination
									bind:currentPage
									totalItems={filteredServices.length}
									{itemsPerPage}
									filteredFrom={searchTerm.trim() ? localServices.length : null}
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
	slug="services"
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
