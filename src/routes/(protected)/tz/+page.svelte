<script>
	import TzTable from '$lib/components/TzTable.svelte';
	import TzViewModal from '$lib/components/TzViewModal.svelte';
	import { ToastContainer, ErrorBoundary } from '$lib';
	import {
		toasts,
		addSuccessToast,
		addErrorToast,
		handleApiError,
		clearAllToasts
	} from '$lib/utils/toastStore.js';
	import { onMount } from 'svelte';
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte';

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
		alert(`Редактирование техзадания #${tz.id} будет реализовано позже`);
	}

	function handleDeleteTz(tz) {
		if (confirm(`Вы уверены, что хотите удалить техзадание #${tz.id}?`)) {
			// TODO: Implement delete functionality
			console.log('Delete TZ:', tz);
			alert(`Удаление техзадания #${tz.id} будет реализовано позже`);
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
		// TODO: Add refresh functionality
	}

	// Handle initial load error
	onMount(() => {
		if (loadError) {
			addErrorToast(loadError.message, { duration: 0 });
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
			<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
				<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
					<!-- Header -->
					<div class="mb-8">
						<div class="md:flex md:items-center md:justify-between">
							<div class="min-w-0 flex-1">
								<h1
									class="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl dark:text-white"
								>
									Техзадания
								</h1>
								<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
									Управление техническими заданиями и спецификациями
								</p>
							</div>
							<div class="mt-4 flex md:ml-4 md:mt-0">
								<button
									type="button"
									class="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
								>
									<svg class="-ml-0.5 mr-1.5 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
										<path
											d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"
										/>
									</svg>
									Создать ТЗ
								</button>
							</div>
						</div>
					</div>

					<!-- Search -->
					<div class="mb-6">
						<div class="flex flex-1 justify-center lg:ml-6 lg:justify-end">
							<div class="w-full max-w-lg lg:max-w-xs">
								<label for="search" class="sr-only">Поиск техзаданий</label>
								<div class="relative">
									<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
										<svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
											<path
												fill-rule="evenodd"
												d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
												clip-rule="evenodd"
											/>
										</svg>
									</div>
									<input
										id="search"
										name="search"
										class="block w-full rounded-md border-0 bg-white py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-white dark:ring-gray-600 dark:placeholder:text-gray-500"
										placeholder="Поиск техзаданий..."
										type="search"
										bind:value={searchTerm}
										oninput={handleSearch}
									/>
								</div>
							</div>
						</div>
					</div>

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
			</div>
		</ErrorBoundary>
	{/snippet}
</ProtectedRoute>

<!-- View Modal -->
<TzViewModal isOpen={isViewModalOpen} tz={selectedTz} onClose={closeViewModal} />

<!-- Toast Notifications -->
<ToastContainer toasts={$toasts} position="top-center" />
