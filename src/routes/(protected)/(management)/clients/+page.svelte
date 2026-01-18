<script>
	import ClientsTable from '$lib/components/management/clients/ClientsTable.svelte';
	import {
		ErrorBoundary,
		TableSkeleton,
		UserViewModal,
		RefreshButton,
		SearchBar,
		PageTitle
	} from '$lib';
	import EditClientModal from '$lib/components/management/clients/EditClientModal.svelte';
	import Pagination from '$lib/components/common/Pagination.svelte';
	import {
		toasts,
		addSuccessToast,
		addErrorToast,
		handleApiError,
		retryOperation,
		clearAllToasts
	} from '$lib/utils/toastStore.js';
	import { refreshClients, updateClient } from '$lib/api/clients.js';
	import ProtectedRoute from '$lib/components/common/ProtectedRoute.svelte';

	let { data } = $props();

	// Initialize local state from server data (SSR)
	let localUsers = $state(data.clientsData?.clients || []);
	let loadError = $state(data.clientsData?.error || null);

	let searchTerm = $state('');

	// Pagination state
	let currentPage = $state(1);
	const itemsPerPage = 10;

	let showViewModal = $state(false);
	let showEditModal = $state(false);
	let selectedUser = $state(null);
	let hasError = $state(false);
	let errorBoundaryError = $state(null);
	let isRefreshing = $state(false);

	let updateCounter = $state(0);

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
			localUsers = localUsers.map((c) =>
				c.id === updatedClient.id
					? {
							...updatedClient,
							status: updatedClient.ban ? 'banned' : 'active',
							agent: updatedClient.projects?.[0]?.agent || null
						}
					: c
			);

			updateCounter++;
			addSuccessToast('Клиент обновлен');
		} catch (error) {
			console.error('Error updating client:', error);
			throw error;
		}
	}

	async function refreshData() {
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
						agent: agent
							? {
									id: agent.id,
									name: agent.name,
									email: agent.email
								}
							: null
					};
				})
				.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
			loadError = null;
			addSuccessToast('Данные обновлены');
		} catch (error) {
			handleApiError(error, 'Не удалось обновить данные');
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

	// Note: Initial data is now loaded server-side via +page.server.js
	// No need for onMount data loading - data is available immediately from server
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
			<!-- Server-side rendered data - no loading state needed -->

			<a
				href="#main-content"
				class="sr-only z-50 rounded-md bg-indigo-600 px-4 py-2 text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
			>
				Перейти к основному контенту
			</a>

			<div class="min-h-screen bg-gray-50 dark:bg-gray-950">
				<div class="px-4 py-7 sm:px-6 lg:px-7">
					<div class="mx-auto">
						<main id="main-content" aria-labelledby="page-title">
							<!-- Header with H1, Search and Refresh Button -->
							<div
								class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0"
							>
								<PageTitle title="Клиенты" />
								<div class="flex items-center space-x-3">
									<div class="w-80">
										<SearchBar
											bind:value={searchTerm}
											onSearch={handleSearch}
											placeholder="Поиск по таблице Клиенты..."
										/>
									</div>
									<!-- Refresh Button -->
									<RefreshButton {isRefreshing} onclick={refreshData} />
								</div>
							</div>

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
														class="rounded-md bg-yellow-50 px-2 py-1.5 text-sm font-medium text-yellow-800 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2 focus:ring-offset-yellow-50 disabled:opacity-50 dark:bg-yellow-900/20 dark:text-yellow-200 dark:hover:bg-yellow-900/40"
													>
														{isRefreshing ? 'Retrying...' : 'Retry'}
													</button>
												</div>
											</div>
										</div>
									</div>
								</div>
							{/if}

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
							<div class="mt-4">
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
		</ErrorBoundary>
	{/snippet}
</ProtectedRoute>

<UserViewModal isOpen={showViewModal} user={selectedUser} onClose={closeViewModal} />
<EditClientModal
	isOpen={showEditModal}
	client={selectedUser}
	onClose={closeEditModal}
	onSave={handleSaveClient}
/>
