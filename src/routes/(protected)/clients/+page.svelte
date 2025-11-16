<script>
	import ClientsTable from '$lib/components/ClientsTable.svelte';
	import {
		ErrorBoundary,
		TableSkeleton,
		UserViewModal
	} from '$lib';
	import EditClientModal from '$lib/components/EditClientModal.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import {
		toasts,
		addSuccessToast,
		addErrorToast,
		handleApiError,
		retryOperation,
		clearAllToasts
	} from '$lib/utils/toastStore.js';
	import { onMount } from 'svelte';
	import { refreshClients, updateClient } from '$lib/api/clients.js';
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte';

	let { data } = $props();

	let searchTerm = $state('');
	
	// Pagination state
	let currentPage = $state(1);
	const itemsPerPage = 8;
	
	let showViewModal = $state(false);
	let showEditModal = $state(false);
	let selectedUser = $state(null);
	let hasError = $state(false);
	let errorBoundaryError = $state(null);
	let isRefreshing = $state(false);

	// Local users state for updates (will be initialized from streamed data)
	let localUsers = $state([]);

	let updateCounter = $state(0);

	// Check for server-side load errors (will be set from streamed data)
	let loadError = $state(null);

	// Derived state that transforms streamed data without mutation
	function getProcessedClients(clientsData) {
		if (!clientsData || !clientsData.clients) {
			return [];
		}

		// Normalize clients data and extract agent info from first project
		return clientsData.clients
			.map((client) => {
				// Get agent from first project (if exists)
				const firstProject = client.projects?.[0];
				const agent = firstProject?.agent;

				return {
					...client,
					status: client.ban ? 'banned' : 'active',
					agent: agent ? {
						id: agent.id,
						name: agent.name,
						email: agent.email
					} : null
				};
			})
			.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
	}

	let filteredClients = $derived.by(() => {
		if (!searchTerm.trim()) {
			return localUsers;
		}

		const term = searchTerm.toLowerCase().trim();
		return localUsers.filter((client) => {
			const name = (client.name || '').toLowerCase();
			const phone = client.phones?.[0]?.value || '';

			return name.includes(term) || phone.includes(term);
		});
	});

	// Get paginated clients
	let paginatedClients = $derived.by(() => {
		const startIndex = (currentPage - 1) * itemsPerPage;
		const endIndex = startIndex + itemsPerPage;
		return filteredClients.slice(startIndex, endIndex);
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

	function handleViewClient(client) {
		selectedUser = client;
		showViewModal = true;
	}

	function closeViewModal() {
		showViewModal = false;
		selectedUser = null;
	}

	function handleEditClient(client) {
		selectedUser = client;
		showEditModal = true;
	}

	function closeEditModal() {
		showEditModal = false;
		selectedUser = null;
	}

	async function handleSaveClient(input) {
		try {
			const updatedClient = await updateClient(input);

			// Update local state
			localUsers = localUsers.map(c =>
				c.id === updatedClient.id ? {
					...updatedClient,
					status: updatedClient.ban ? 'banned' : 'active',
					agent: updatedClient.projects?.[0]?.agent || null
				} : c
			);

			updateCounter++;
			addSuccessToast('Клиент успешно обновлен');
		} catch (error) {
			console.error('Error updating client:', error);
			throw error;
		}
	}

	async function refreshData(isInitialLoad = false) {
		isRefreshing = true;
		try {
			const clients = await refreshClients();
			// Normalize clients data and extract agent info
			localUsers = clients
				.map((client) => {
					// Get agent from first project (if exists)
					const firstProject = client.projects?.[0];
					const agent = firstProject?.agent;

					return {
						...client,
						status: client.ban ? 'banned' : 'active',
						agent: agent ? {
							id: agent.id,
							name: agent.name,
							email: agent.email
						} : null
					};
				})
				.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
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

		if (!localUsers.length && !loadError) {
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
			fallbackTitle="Clients Page Error"
			fallbackMessage="An error occurred while loading the clients page. This might be due to a network issue or server problem."
			showDetails={true}
		>
			<!-- Streamed Clients Data with SSR -->
			{#await data.clientsData}
				<!-- Loading state: Show skeleton -->
				<TableSkeleton columns={6} />
			{:then clientsData}
				<!-- Success state: Show data -->
				{@const processedClients = getProcessedClients(clientsData)}

				<!-- Update local state only once when data arrives -->
				{#if localUsers.length === 0 && processedClients.length > 0}
					{(localUsers = processedClients, '')}
				{/if}

				<!-- Set load error if present -->
				{#if clientsData.error && !loadError}
					{(loadError = clientsData, '')}
				{/if}

				<a
					href="#main-content"
					class="sr-only z-50 rounded-md bg-indigo-600 px-4 py-2 text-white focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
				>
					Перейти к основному контенту
				</a>

				<div class="min-h-screen bg-gray-50 dark:bg-gray-950">
					<div class="px-4 py-8 sm:px-6 lg:px-8">
						<div class="mx-auto max-w-7xl">
							<main id="main-content" aria-labelledby="page-title">
								<!-- Header with Refresh Button -->
								<div class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between">
									<div class="flex items-center justify-between">
										<div>
											<h1
												id="page-title"
												class="text-2xl font-semibold text-gray-900 dark:text-white"
											>
												Клиенты
											</h1>
											<p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
												Управление клиентами системы
											</p>
										</div>
									</div>
									<div class="flex items-center space-x-3">
										<!-- Refresh Button -->
										<button
											type="button"
											onclick={refreshData}
											disabled={isRefreshing}
											class="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus-visible:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-700"
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
									</div>
								</div>

								<!-- Separator -->
								<div class="my-4 border-t border-gray-200 dark:border-gray-700"></div>

								<!-- Load Error Banner -->
								{#if loadError && loadError.canRetry}
									<div class="mb-4 rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/20">
										<div class="flex">
											<div class="flex-shrink-0">
												<svg
													class="h-5 w-5 text-yellow-400"
													viewBox="0 0 20 20"
													fill="currentColor"
													aria-hidden="true"
												>
													<path
														fill-rule="evenodd"
														d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
														clip-rule="evenodd"
													/>
												</svg>
											</div>
											<div class="ml-3">
												<h3 class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
													Ошибка загрузки данных
												</h3>
												<div class="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
													<p>{loadError.message}</p>
												</div>
												<div class="mt-4">
													<div class="-mx-2 -my-1.5 flex">
														<button
															type="button"
															onclick={refreshData}
															disabled={isRefreshing}
															class="rounded-md bg-yellow-50 px-2 py-1.5 text-sm font-medium text-yellow-800 hover:bg-yellow-100 focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:outline-none disabled:opacity-50 dark:bg-yellow-900/20 dark:text-yellow-200 dark:hover:bg-yellow-900/40"
														>
															{isRefreshing ? 'Retrying...' : 'Retry'}
														</button>
													</div>
												</div>
											</div>
										</div>
									</div>
								{/if}

								<!-- Search and Filters -->
								<div
									class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0"
								>
									<div class="flex flex-1 items-center space-x-4">
										<!-- Search Input -->
										<div class="relative max-w-md flex-1" role="search" aria-label="Client search">
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
												id="client-search"
												type="text"
												bind:value={searchTerm}
												oninput={() => handleSearch(searchTerm)}
												placeholder="Поиск по имени или телефону..."
												class="block w-full rounded-md border-0 py-1.5 pr-3 pl-10 text-gray-900 ring-1 ring-gray-300 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-600 focus:ring-inset sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-white dark:ring-gray-600 dark:placeholder:text-gray-500"
											/>
										</div>
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
										{#if filteredClients.length === 0}
											Клиенты не найдены по запросу "{searchTerm}"
										{:else}
											Найдено {filteredClients.length} клиент{filteredClients.length === 1
												? ''
												: filteredClients.length < 5
													? 'а'
													: 'ов'} по запросу "{searchTerm}"
										{/if}
									</div>
								{/if}

								<!-- Clients Table -->
								<div class="mt-8">
									<ClientsTable
										users={paginatedClients}
										isLoading={false}
										onViewUser={handleViewClient}
										onEditUser={handleEditClient}
										{updateCounter}
										{searchTerm}
										hasSearched={searchTerm.trim().length > 0}
										showActions={true}
									/>
								</div>

								<!-- Pagination -->
								<Pagination
									bind:currentPage
									totalItems={filteredClients.length}
									{itemsPerPage}
									filteredFrom={searchTerm.trim() ? localUsers.length : null}
								/>
							</main>
						</div>
					</div>
				</div>
			{:catch error}
				<!-- Critical error state -->
				<div class="flex min-h-screen items-center justify-center">
					<div class="rounded-lg border border-red-500/30 bg-red-500/20 p-8 text-center">
						<h3 class="mb-4 text-xl font-semibold text-white">Ошибка загрузки клиентов</h3>
						<p class="text-red-300">Не удалось загрузить клиентов. Попробуйте обновить страницу.</p>
					</div>
				</div>
			{/await}
		</ErrorBoundary>
	{/snippet}
</ProtectedRoute>

<UserViewModal isOpen={showViewModal} user={selectedUser} onClose={closeViewModal} />
<EditClientModal isOpen={showEditModal} client={selectedUser} onClose={closeEditModal} onSave={handleSaveClient} />
