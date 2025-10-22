<script>
	import TzTable from '$lib/components/TzTable.svelte';
	import TzViewModal from '$lib/components/TzViewModal.svelte';
	import TzCreateModal from '$lib/components/TzCreateModal.svelte';
	import { ErrorBoundary } from '$lib';
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
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte';
	import { invalidateAll } from '$app/navigation';
	import {
		refreshTechnicalSpecifications,
		deleteTechnicalSpecification,
		createTechnicalSpecification
	} from '$lib/api/technicalSpecifications.js';
	import { getProjects } from '$lib/api/projects.js';

	/** @type {import('./$types').PageData} */
	let { data } = $props();

	// State
	let tzList = $state(data.tzList);
	let isLoading = $state(false);
	let searchTerm = $state('');
	let hasSearched = $state(false);
	let updateCounter = $state(0);

	// Modal state
	let isViewModalOpen = $state(false);
	let selectedTz = $state(null);
	let isCreateModalOpen = $state(false);

	// Projects for dropdown
	let projects = $state([]);

	// Error boundary state
	let hasError = $state(false);
	let errorBoundaryError = $state(null);

	// Check for server-side load errors
	let loadError = $state(data?.error || null);

	// Update tzList when data changes
	$effect(() => {
		tzList = data.tzList;
	});

	function handleViewTz(tz) {
		console.log('Opening modal for TZ:', tz);
		selectedTz = tz;
		isViewModalOpen = true;
		console.log('Modal state:', { isViewModalOpen, selectedTz });
	}

	function handleEditTz(tz) {
		// TODO: Implement edit functionality
		console.log('Edit TZ:', tz);
		addInfoToast('Редактирование техзаданий будет реализовано позже');
	}

	async function handleDeleteTz(tz) {
		if (!confirm(`Вы уверены, что хотите удалить техзадание #${tz.id}?`)) {
			return;
		}

		isLoading = true;
		try {
			await retryOperation(
				async () => {
					await deleteTechnicalSpecification(tz.id);
					// Remove from local list
					tzList = tzList.filter((t) => t.id !== tz.id);
					addSuccessToast('Техзадание успешно удалено');
					updateCounter++;
				},
				2,
				1000
			);
		} catch (error) {
			console.error('Delete TZ failed:', error);
			handleApiError(error, 'Не удалось удалить техзадание');
		} finally {
			isLoading = false;
		}
	}

	function closeViewModal() {
		console.log('Closing modal');
		isViewModalOpen = false;
		selectedTz = null;
	}

	function handleSearch() {
		hasSearched = true;
		// TODO: Implement search functionality
		console.log('Search term:', searchTerm);
	}

	// Load TZ data
	async function loadServices() {
		isLoading = true;
		try {
			const refreshedData = await refreshTechnicalSpecifications();
			tzList = refreshedData || [];
			addSuccessToast('Данные успешно обновлены');
			updateCounter++;
		} catch (error) {
			handleApiError(error, 'Не удалось обновить данные');
		} finally {
			isLoading = false;
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

	// Load projects for dropdown
	async function loadProjects() {
		try {
			projects = await getProjects();
		} catch (error) {
			console.error('Failed to load projects:', error);
			handleApiError(error, 'Не удалось загрузить список проектов');
		}
	}

	// Handle initial load error and load projects
	onMount(() => {
		if (loadError) {
			addErrorToast(loadError.message, { duration: 0 });
		}
		loadProjects();
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
			<div class="space-y-6">
	<!-- Page Header -->
	<div class="border-b border-gray-200 pb-5 dark:border-gray-700">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl">
					Техзадания
				</h1>
				<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
					Управление техническими заданиями и спецификациями
				</p>
			</div>
			<div class="flex items-center space-x-3">
				<!-- Refresh Button -->
				<button
					type="button"
					onclick={loadServices}
					disabled={isLoading}
					class="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-700"
				>
					{#if isLoading}
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
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
							/>
						</svg>
					{/if}
					Обновить
				</button>
				<!-- Create TZ Button -->
				<button
					type="button"
					onclick={handleOpenCreateModal}
					disabled={isLoading}
					class="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
				>
					<svg
						class="-ml-0.5 mr-1.5 h-5 w-5"
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
					Создать ТЗ
				</button>
			</div>
		</div>
	</div>

	<!-- Search and Filters -->
	<div class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
		<div class="flex flex-1 items-center space-x-4">
			<!-- Search Input -->
			<div class="relative flex-1 max-w-md">
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
					class="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:bg-gray-800 dark:text-white dark:ring-gray-600 dark:placeholder:text-gray-500 sm:text-sm sm:leading-6"
					placeholder="Поиск техзаданий..."
				/>
			</div>
		</div>
		
		<!-- Total TZ count -->
		<div class="text-sm text-gray-700 dark:text-gray-300">
			<span>Всего элементов: <strong>{tzList.length}</strong></span>
		</div>
	</div>

	<!-- Separator -->

	<!-- Table -->
	<div class="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl dark:bg-gray-800">
		<TzTable
			{tzList}
			{isLoading}
			{searchTerm}
			{hasSearched}
			{updateCounter}
			onViewTz={handleViewTz}
			onEditTz={handleEditTz}
			onDeleteTz={handleDeleteTz}
		/>
	</div>
				</div>
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


