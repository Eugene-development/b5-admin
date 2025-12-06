<script>
	import TzTable from '$lib/components/business-processes/tz/TzTable.svelte';
	import TzViewModal from '$lib/components/business-processes/tz/TzViewModal.svelte';
	import TzCreateModal from '$lib/components/business-processes/tz/TzCreateModal.svelte';
	import TzEditModal from '$lib/components/business-processes/tz/TzEditModal.svelte';
	import ConfirmationModal from '$lib/components/common/ConfirmationModal.svelte';
	import FileUploadModal from '$lib/components/modals/FileUploadModal.svelte';
	import TableSkeleton from '$lib/components/common/TableSkeleton.svelte';
	import Pagination from '$lib/components/common/Pagination.svelte';
	import { ErrorBoundary, RefreshButton, AddButton } from '$lib';
	import TablePageLayout from '$lib/components/common/TablePageLayout.svelte';
	import {
		toasts,
		addSuccessToast,
		addErrorToast,
		addInfoToast,
		handleApiError,
		clearAllToasts,
		retryOperation
	} from '$lib/utils/toastStore.js';
	import { onMount } from 'svelte';
	import ProtectedRoute from '$lib/components/common/ProtectedRoute.svelte';
	import { invalidateAll, goto } from '$app/navigation';
	import {
		refreshTechnicalSpecifications,
		deleteTechnicalSpecification,
		createTechnicalSpecification,
		updateTechnicalSpecification,
		uploadSketchFile,
		uploadOfferFile,
		uploadTzFile,
		deleteTzFile
	} from '$lib/api/technicalSpecifications.js';
	import { getProjects } from '$lib/api/projects.js';

	/** @type {import('./$types').PageData} */
	let { data } = $props();

	// State
	let tzList = $state([]);
	let isLoading = $state(false);
	let isRefreshing = $state(false);
	let searchTerm = $state('');
	let hasSearched = $state(false);
	let updateCounter = $state(0);

	// Pagination state
	let currentPage = $state(1);
	const itemsPerPage = 10;

	// Modal state
	let isViewModalOpen = $state(false);
	let selectedTz = $state(null);
	let isCreateModalOpen = $state(false);
	let isEditModalOpen = $state(false);
	let editingTz = $state(null);
	let showConfirmModal = $state(false);
	let confirmAction = $state(null);
	let isUploadModalOpen = $state(false);
	let uploadType = $state(null); // 'sketch' or 'cp'
	let uploadingTz = $state(null);

	// Projects for dropdown
	let projects = $state([]);

	// Error boundary state
	let hasError = $state(false);
	let errorBoundaryError = $state(null);

	function handleViewTz(tz) {
		selectedTz = tz;
		isViewModalOpen = true;
	}

	function handleEditTz(tz) {
		editingTz = tz;
		isEditModalOpen = true;
		clearAllToasts();
	}

	function handleDeleteTz(tz) {
		confirmAction = {
			type: 'delete',
			tz: tz,
			title: 'Удалить техзадание',
			message: `Вы уверены, что хотите НАВСЕГДА удалить техзадание #${tz.id}? Это действие нельзя отменить. Все данные техзадания будут потеряны.`,
			confirmText: 'Удалить навсегда',
			isDestructive: true
		};
		showConfirmModal = true;
		clearAllToasts();
	}

	// Execute confirmed action
	async function confirmActionHandler() {
		if (!confirmAction) return;

		isLoading = true;

		try {
			const { type, tz } = confirmAction;

			await retryOperation(
				async () => {
					if (type === 'delete') {
						await deleteTechnicalSpecification(tz.id);
						// Remove from local list
						tzList = tzList.filter((t) => t.id !== tz.id);
						addSuccessToast(`Техзадание #${tz.id} успешно удалено`);
						updateCounter++;
					}
				},
				2,
				1000
			);
		} catch (error) {
			console.error('Action failed after retries:', error);
		} finally {
			isLoading = false;
			showConfirmModal = false;
			confirmAction = null;
		}
	}

	// Cancel action
	function cancelAction() {
		showConfirmModal = false;
		confirmAction = null;
		isLoading = false;
	}

	function closeViewModal() {
		isViewModalOpen = false;
		selectedTz = null;
	}

	// Computed filtered TZ list
	let filteredTzList = $derived.by(() => {
		if (!searchTerm.trim()) {
			return tzList;
		}

		const term = searchTerm.toLowerCase().trim();
		return tzList.filter((tz) => {
			const projectValue = (tz.project?.value || '').toLowerCase();
			const id = tz.id.toString();
			return projectValue.includes(term) || id.includes(term);
		});
	});

	// Get paginated TZ list
	let paginatedTzList = $derived.by(() => {
		const startIndex = (currentPage - 1) * itemsPerPage;
		const endIndex = startIndex + itemsPerPage;
		return filteredTzList.slice(startIndex, endIndex);
	});

	function handleSearch() {
		hasSearched = searchTerm.trim().length > 0;
		currentPage = 1;
	}

	// Reset to first page when filters change
	$effect(() => {
		searchTerm;
		currentPage = 1;
	});

	// Load TZ data
	async function loadServices(isInitialLoad = false) {
		isRefreshing = true;
		try {
			const refreshedData = await refreshTechnicalSpecifications();
			tzList = refreshedData || [];
			if (!isInitialLoad) {
				addSuccessToast('Данные успешно обновлены');
			}
			updateCounter++;
		} catch (error) {
			handleApiError(error, 'Не удалось обновить данные');
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
		await loadServices();
	}

	// Open create modal
	function handleOpenCreateModal() {
		isCreateModalOpen = true;
		clearAllToasts();
	}

	// Close create modal
	function handleCloseCreateModal() {
		isCreateModalOpen = false;
	}

	// Handle create TZ
	async function handleCreateTz(tzData) {
		isLoading = true;
		try {
			await retryOperation(
				async () => {
					const newTz = await createTechnicalSpecification(tzData);
					// Add to local list
					tzList = [newTz, ...tzList];
					addSuccessToast('Техзадание успешно создано');
					updateCounter++;
					isCreateModalOpen = false;
				},
				2,
				1000
			);
		} catch (error) {
			console.error('Create TZ failed:', error);
			handleApiError(error, 'Не удалось создать техзадание');
		} finally {
			isLoading = false;
		}
	}

	// Close edit modal
	function handleCloseEditModal() {
		isEditModalOpen = false;
		editingTz = null;
	}

	// Handle update TZ
	async function handleUpdateTz(tzData) {
		isLoading = true;
		try {
			await retryOperation(
				async () => {
					const updatedTz = await updateTechnicalSpecification(tzData);
					// Update in local list
					tzList = tzList.map((t) => (t.id === updatedTz.id ? updatedTz : t));
					addSuccessToast('Техзадание успешно обновлено');
					updateCounter++;
					isEditModalOpen = false;
					editingTz = null;
				},
				2,
				1000
			);
		} catch (error) {
			console.error('Update TZ failed:', error);
			handleApiError(error, 'Не удалось обновить техзадание');
		} finally {
			isLoading = false;
		}
	}

	// Load projects for dropdown
	async function loadProjects() {
		try {
			projects = await getProjects();
		} catch (error) {
			console.error('Failed to load projects:', error);
			handleApiError(error, 'Не удалось загрузить список проектов');
		}
	}

	// Handle upload sketch
	function handleUploadSketch(tz) {
		uploadingTz = tz;
		uploadType = 'sketch';
		isUploadModalOpen = true;
		clearAllToasts();
	}

	// Handle upload CP
	function handleUploadCP(tz) {
		uploadingTz = tz;
		uploadType = 'cp';
		isUploadModalOpen = true;
		clearAllToasts();
	}

	// Handle file upload
	async function handleFileUpload(file) {
		if (!uploadingTz || !uploadType) return;

		isLoading = true;
		try {
			await retryOperation(
				async () => {
					const tzId = uploadingTz.id;
					const fileType = uploadType === 'sketch' ? 'SKETCH' : 'COMMERCIAL_OFFER';
					
					await uploadTzFile(tzId, fileType, file);
					
					if (uploadType === 'sketch') {
						addSuccessToast('Эскиз успешно загружен');
					} else {
						addSuccessToast('КП успешно загружено');
					}

					// Reload data to get updated files
					await loadServices();
					isUploadModalOpen = false;
					uploadingTz = null;
					uploadType = null;
				},
				2,
				1000
			);
		} catch (error) {
			console.error('File upload failed:', error);
			handleApiError(error, 'Не удалось загрузить файл');
		} finally {
			isLoading = false;
		}
	}

	// Close upload modal
	function handleCloseUploadModal() {
		isUploadModalOpen = false;
		uploadingTz = null;
		uploadType = null;
	}

	// Handle retry on error
	function handleRetry() {
		goto(window.location.pathname, { invalidateAll: true });
	}

	// Load projects on mount
	onMount(() => {
		loadProjects();

		// Load data if we have empty initial data (server-side data loading was disabled)
		if (tzList.length === 0) {
			loadServices(true);
		}
	});
</script>

<svelte:head>
	<title>Техзадания - B5 Admin</title>
	<meta name="description" content="Управление техническими заданиями" />
</svelte:head>

<ProtectedRoute>
	{#snippet children()}
		<ErrorBoundary
			{hasError}
			error={errorBoundaryError}
			onError={handleErrorBoundaryError}
			onRetry={retryFromErrorBoundary}
			fallbackTitle="TZ Page Error"
			fallbackMessage="An error occurred while loading the TZ page."
			showDetails={true}
		>
			{#await data.tzData}
				<!-- Loading state: Show skeleton -->
				<TableSkeleton columns={6} />
			{:then tzData}
				<!-- Success state: Show data -->
				{#if tzData.error}
					<!-- Error state -->
					<div class="space-y-6">
						<div class="border-b border-gray-200 pb-5 dark:border-gray-700">
							<h1
								class="text-2xl leading-7 font-bold text-gray-900 sm:truncate sm:text-3xl dark:text-white"
							>
								Техзадания
							</h1>
						</div>
						<div class="rounded-lg border border-red-500/30 bg-red-500/20 p-8 text-center">
							<h3 class="mb-4 text-xl font-semibold text-red-900 dark:text-white">
								Ошибка загрузки техзаданий
							</h3>
							<p class="mb-4 text-red-700 dark:text-red-300">{tzData.error}</p>
							{#if tzData.canRetry}
								<button
									onclick={handleRetry}
									class="rounded-lg bg-red-600 px-6 py-2 font-semibold text-white hover:bg-red-700"
								>
									Попробовать снова
								</button>
							{/if}
						</div>
					</div>
				{:else}
					<!-- Initialize local tzList from loaded data -->
					{#if !tzList.length && tzData.tzList.length}
						{((tzList = tzData.tzList), '')}
					{/if}

					<!-- Show skeleton during initial data refresh when no data is available -->
					{#if isRefreshing && tzList.length === 0}
						<TableSkeleton columns={6} />
					{:else}
						<TablePageLayout title="Техзадания">
							{#snippet headerActions()}
								<!-- Create TZ Button -->
								<AddButton onclick={handleOpenCreateModal} disabled={isLoading} />

								<!-- Refresh Button -->
								<RefreshButton {isRefreshing} onclick={loadServices} />
							{/snippet}

							{#snippet filters()}
								<div class="flex flex-1 items-center space-x-4">
									<!-- Search Input -->
									<div class="relative max-w-md flex-1">
										<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
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
											id="tz-search"
											type="text"
											bind:value={searchTerm}
											oninput={handleSearch}
											class="block w-full rounded-md border-0 py-1.5 pr-3 pl-10 text-gray-900 ring-1 ring-gray-300 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-600 focus:ring-inset sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-white dark:ring-gray-600 dark:placeholder:text-gray-500"
											placeholder="Поиск по таблице..."
										/>
									</div>
								</div>
							{/snippet}

							{#snippet resultsInfo()}
								{#if searchTerm.trim()}
									<div class="mt-4 text-sm text-gray-600 dark:text-gray-400">
										{#if filteredTzList.length === 0}
											Техзадания не найдены по запросу "{searchTerm}"
										{:else}
											Найдено {filteredTzList.length} техзадани{filteredTzList.length === 1
												? 'е'
												: filteredTzList.length < 5
													? 'я'
													: 'й'} по запросу "{searchTerm}"
										{/if}
									</div>
								{/if}
							{/snippet}

							<TzTable
								tzList={paginatedTzList}
								{isLoading}
								{searchTerm}
								{hasSearched}
								{updateCounter}
								onViewTz={handleViewTz}
								onEditTz={handleEditTz}
								onDeleteTz={handleDeleteTz}
								onUploadSketch={handleUploadSketch}
								onUploadCP={handleUploadCP}
							/>

							<Pagination
								bind:currentPage
								totalItems={filteredTzList.length}
								{itemsPerPage}
								filteredFrom={searchTerm.trim() ? tzList.length : null}
							/>
						</TablePageLayout>
					{/if}
				{/if}
			{:catch error}
				<!-- Critical error state -->
				<div class="space-y-6">
					<div class="border-b border-gray-200 pb-5 dark:border-gray-700">
						<h1
							class="text-2xl leading-7 font-bold text-gray-900 sm:truncate sm:text-3xl dark:text-white"
						>
							Техзадания
						</h1>
					</div>
					<div class="rounded-lg border border-red-500/30 bg-red-500/20 p-8 text-center">
						<h3 class="mb-4 text-xl font-semibold text-red-900 dark:text-white">
							Критическая ошибка
						</h3>
						<p class="text-red-700 dark:text-red-300">
							Не удалось загрузить техзадания. Попробуйте обновить страницу.
						</p>
					</div>
				</div>
			{/await}
		</ErrorBoundary>
	{/snippet}
</ProtectedRoute>

<!-- View Modal -->
<TzViewModal isOpen={isViewModalOpen} tz={selectedTz} onClose={closeViewModal} />

<!-- Create Modal -->
<TzCreateModal
	isOpen={isCreateModalOpen}
	{projects}
	onSave={handleCreateTz}
	onCancel={handleCloseCreateModal}
	{isLoading}
/>

<!-- Edit Modal -->
<TzEditModal
	isOpen={isEditModalOpen}
	tz={editingTz}
	{projects}
	onSave={handleUpdateTz}
	onCancel={handleCloseEditModal}
	{isLoading}
/>

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
		{isLoading}
	/>
{/if}

<!-- File Upload Modal -->
<FileUploadModal
	isOpen={isUploadModalOpen}
	title={uploadType === 'sketch' ? 'Загрузить эскиз' : 'Загрузить КП'}
	onUpload={handleFileUpload}
	onCancel={handleCloseUploadModal}
	{isLoading}
/>
