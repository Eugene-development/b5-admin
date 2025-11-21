<script>
	import {
		UsersTable,
		SearchBar,
		ConfirmationModal,
		ErrorBoundary,
		TableSkeleton,
		UserViewModal,
		UserEditModal,
		UserAddModal
	} from '$lib';
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
	import {
		banUser,
		unbanUser,
		deleteUser,
		refreshUsers,
		updateUser,
		createUser
	} from '$lib/api/agents.js';
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte';

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
	let selectedUser = $state(null);

	// Edit modal state
	let showEditModal = $state(false);
	let editingUser = $state(null);

	// Add modal state
	let showAddModal = $state(false);

	// Error boundary state
	let hasError = $state(false);
	let errorBoundaryError = $state(null);

	// Loading state for data refresh
	let isRefreshing = $state(false);

	// Local users state for updates (will be initialized from streamed data)
	let localUsers = $state([]);

	// Force update counter for reactivity
	let updateCounter = $state(0);

	// Check for server-side load errors (will be set from streamed data)
	let loadError = $state(null);

	// Derived state that transforms streamed data without mutation
	function getProcessedUsers(usersData) {
		if (!usersData || !usersData.agents) {
			return [];
		}

		// Filter only curators (users with status slug 'curators') and normalize
		return usersData.agents
			.filter((user) => user.userStatus?.slug === 'curators')
			.map((user) => ({
				...user,
				// Keep old status field for backward compatibility (derived from ban field)
				status: user.ban ? 'banned' : 'active',
				// Add new status fields
				status_id: user.status_id,
				userStatus: user.userStatus
			}))
			.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
	}

	// Computed filteredUsers reactive statement
	let filteredUsers = $derived.by(() => {
		if (!searchTerm.trim()) {
			return localUsers;
		}

		const term = searchTerm.toLowerCase().trim();
		return localUsers.filter((user) => {
			const name = (user.name || '').toLowerCase();
			const email = (user.email || '').toLowerCase();
			const region = (user.region || '').toLowerCase();

			return name.includes(term) || email.includes(term) || region.includes(term);
		});
	});

	// Get paginated users
	let paginatedUsers = $derived.by(() => {
		const startIndex = (currentPage - 1) * itemsPerPage;
		const endIndex = startIndex + itemsPerPage;
		return filteredUsers.slice(startIndex, endIndex);
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

	// Ban user handler with confirmation
	function handleBanUser(user) {
		const isBanned = user.status === 'banned';
		confirmAction = {
			type: isBanned ? 'unban' : 'ban',
			user: user,
			title: isBanned ? 'Разбанить куратора' : 'Забанить куратора',
			message: isBanned
				? `Вы уверены, что хотите разбанить куратора "${user.name || user.email}"? Куратор снова сможет получить доступ к системе.`
				: `Вы уверены, что хотите забанить куратора "${user.name || user.email}"? Куратор потеряет доступ к системе.`,
			confirmText: isBanned ? 'Разбанить' : 'Забанить',
			isDestructive: !isBanned
		};
		showConfirmModal = true;
		clearAllToasts();
	}

	// Delete user handler with confirmation
	function handleDeleteUser(user) {
		confirmAction = {
			type: 'delete',
			user: user,
			title: 'Удалить куратора',
			message: `Вы уверены, что хотите НАВСЕГДА удалить куратора "${user.name || user.email}"? Это действие нельзя отменить. Все данные куратора будут потеряны.`,
			confirmText: 'Удалить навсегда',
			isDestructive: true
		};
		showConfirmModal = true;
		clearAllToasts();
	}

	// View user handler
	function handleViewUser(user) {
		selectedUser = user;
		showViewModal = true;
	}

	// Close view modal
	function closeViewModal() {
		showViewModal = false;
		selectedUser = null;
	}

	// Open edit modal
	function handleEditUser(user) {
		editingUser = user;
		showEditModal = true;
		clearAllToasts();
	}

	// Save user changes (edit)
	async function handleUpdateUser(updatedUserData) {
		isActionLoading = true;

		try {
			await retryOperation(
				async () => {
					// Update user data including status_id
					const updatedUser = await updateUser(updatedUserData);

					// Update in local list
					localUsers = localUsers.map((user) =>
						user.id === updatedUser.id
							? {
									...updatedUser,
									status: updatedUser.status?.toLowerCase() || 'active',
									status_id: updatedUser.status_id,
									userStatus: updatedUser.userStatus
								}
							: user
					);

					addSuccessToast(
						`Пользователь "${updatedUser.name || updatedUser.email}" успешно обновлен.`
					);
				},
				2,
				1000
			);
		} catch (error) {
			console.error('Failed to update user:', error);
		} finally {
			isActionLoading = false;
			showEditModal = false;
			editingUser = null;
		}
	}

	// Cancel edit user
	function handleCancelEditUser() {
		showEditModal = false;
		editingUser = null;
		isActionLoading = false;
	}

	// Open add modal
	function handleAddUser() {
		showAddModal = true;
		clearAllToasts();
	}

	// Save new user (add)
	async function handleCreateUser(newUserData) {
		isActionLoading = true;

		try {
			await retryOperation(
				async () => {
					// Create new user with status_id
					const createdUser = await createUser(newUserData);

					// Add to local list
					localUsers = [
						{
							...createdUser,
							status: createdUser.ban ? 'banned' : 'active',
							status_id: createdUser.status_id,
							userStatus: createdUser.userStatus
						},
						...localUsers
					];

					addSuccessToast(`Куратор "${createdUser.name || createdUser.email}" успешно создан.`);
				},
				2,
				1000
			);
		} catch (error) {
			console.error('Failed to create user:', error);
		} finally {
			isActionLoading = false;
			showAddModal = false;
		}
	}

	// Cancel add user
	function handleCancelAddUser() {
		showAddModal = false;
		isActionLoading = false;
	}

	// Execute confirmed action with retry mechanism
	async function confirmActionHandler() {
		if (!confirmAction) return;

		isActionLoading = true;

		try {
			const { type, user } = confirmAction;

			// Use retry mechanism for critical operations
			await retryOperation(
				async () => {
					if (type === 'ban') {
						const result = await banUser(user.id);
						// Convert GraphQL enum to lowercase for consistency
						const status = result?.status?.toLowerCase() || 'banned';
						updateUserStatus(user.id, status);
						addSuccessToast(`Куратор "${user.name || user.email}" успешно забанен.`);
					} else if (type === 'unban') {
						const result = await unbanUser(user.id);
						// Convert GraphQL enum to lowercase for consistency
						const status = result?.status?.toLowerCase() || 'active';
						updateUserStatus(user.id, status);
						addSuccessToast(`Куратор "${user.name || user.email}" успешно разбанен.`);
					} else if (type === 'delete') {
						await deleteUser(user.id);
						removeUserFromList(user.id);
						addSuccessToast(`Куратор "${user.name || user.email}" успешно удален.`);
					}
				},
				2,
				1000
			); // 2 retries with 1 second delay
		} catch (error) {
			// Error is already handled by handleApiError in retryOperation
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

	// Update user status in local state
	function updateUserStatus(userId, newStatus) {
		// Create completely new array with new objects to ensure reactivity
		localUsers = localUsers.map((user) =>
			user.id === userId ? { ...user, status: newStatus } : user
		);

		// Force reactivity update
		updateCounter++;
	}

	// Remove user from local state after deletion
	function removeUserFromList(userId) {
		localUsers = localUsers.filter((user) => user.id !== userId);
	}

	// Refresh data from server
	async function refreshData(isInitialLoad = false) {
		isRefreshing = true;
		try {
			const users = await refreshUsers();
			// Filter only curators and normalize status
			localUsers = users
				.filter((user) => user.userStatus?.slug === 'curators')
				.map((user) => ({
					...user,
					// Keep old status field for backward compatibility (derived from ban field)
					status: user.ban ? 'banned' : 'active',
					// Add new status fields
					status_id: user.status_id,
					userStatus: user.userStatus
				}))
				.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
			loadError = null;
			// Only show success message for manual refresh, not initial load
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

	// Handle initial load error and load data if empty
	onMount(() => {
		if (loadError) {
			addErrorToast(loadError.message, { duration: 0 });
		}

		// Load data if we have empty initial data (server-side data loading was disabled)
		if (!localUsers.length && !loadError) {
			refreshData(true); // Pass true to indicate initial load
		}
	});

	// Debug function to manually set user status (for testing)
	function debugSetUserStatus(userId, status) {
		updateUserStatus(userId, status);
	}

	// Make debug function available globally for testing
	if (typeof window !== 'undefined') {
		window.debugSetUserStatus = debugSetUserStatus;
	}
</script>

<ProtectedRoute>
	{#snippet children()}
		<ErrorBoundary
			{hasError}
			error={errorBoundaryError}
			onError={handleErrorBoundaryError}
			onRetry={retryFromErrorBoundary}
			fallbackTitle="Curators Page Error"
			fallbackMessage="An error occurred while loading the curators page. This might be due to a network issue or server problem."
			showDetails={true}
		>
			<!-- Streamed Curators Data with SSR -->
			{#await data.usersData}
				<!-- Loading state: Show skeleton -->
				<TableSkeleton columns={6} />
			{:then usersData}
				<!-- Success state: Show data -->
				{@const processedUsers = getProcessedUsers(usersData)}

				<!-- Update local state only once when data arrives -->
				{#if localUsers.length === 0 && processedUsers.length > 0}
					{((localUsers = processedUsers), '')}
				{/if}

				<!-- Set load error if present -->
				{#if usersData.error && !loadError}
					{((loadError = usersData), '')}
				{/if}

				<!-- Skip link for keyboard navigation -->
				<a
					href="#main-content"
					class="sr-only z-50 rounded-md bg-indigo-600 px-4 py-2 text-white focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
				>
					Перейти к основному контенту
				</a>

				<div class="min-h-screen bg-gray-50 dark:bg-gray-950">
					<div class="px-4 py-8 sm:px-6 lg:px-8">
						<div class="mx-auto max-w-7xl">
							<!-- Page landmark -->
							<main id="main-content" aria-labelledby="page-title">
								<!-- Header with Refresh Button -->
								<div class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between">
									<div class="flex items-center justify-between">
										<div>
											<h1
												id="page-title"
												class="text-3xl font-semibold text-gray-900 dark:text-white"
											>
												Кураторы
											</h1>
										</div>
									</div>
									<div class="flex items-center space-x-3">
										<!-- Add Button -->
										<button
											type="button"
											onclick={handleAddUser}
											class="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
										>
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
													d="M12 4v16m8-8H4"
												/>
											</svg>
											Добавить
										</button>

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
										<div class="relative max-w-md flex-1" role="search" aria-label="Curator search">
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
												id="curator-search"
												type="text"
												bind:value={searchTerm}
												oninput={() => handleSearch(searchTerm)}
												placeholder="Поиск по имени, email или региону..."
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
										{#if filteredUsers.length === 0}
											Кураторы не найдены по запросу "{searchTerm}"
										{:else}
											Найдено {filteredUsers.length} куратор{filteredUsers.length === 1
												? ''
												: filteredUsers.length < 5
													? 'а'
													: 'ов'} по запросу "{searchTerm}"
										{/if}
									</div>
								{/if}

								<!-- Users Table -->
								<div class="mt-8">
									<UsersTable
										users={paginatedUsers}
										isLoading={isActionLoading}
										onBanUser={handleBanUser}
										onDeleteUser={handleDeleteUser}
										onViewUser={handleViewUser}
										onEditUser={handleEditUser}
										{updateCounter}
										{searchTerm}
										hasSearched={searchTerm.trim().length > 0}
									/>
								</div>

								<!-- Pagination -->
								<Pagination
									bind:currentPage
									totalItems={filteredUsers.length}
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
						<h3 class="mb-4 text-xl font-semibold text-white">Ошибка загрузки кураторов</h3>
						<p class="text-red-300">
							Не удалось загрузить кураторов. Попробуйте обновить страницу.
						</p>
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

<!-- User View Modal -->
<UserViewModal isOpen={showViewModal} user={selectedUser} onClose={closeViewModal} />

<!-- User Edit Modal -->
{#if editingUser}
	<UserEditModal
		isOpen={showEditModal}
		user={editingUser}
		onSave={handleUpdateUser}
		onCancel={handleCancelEditUser}
		isLoading={isActionLoading}
	/>
{/if}

<!-- User Add Modal -->
<UserAddModal
	isOpen={showAddModal}
	statusSlug="curators"
	onSave={handleCreateUser}
	onCancel={handleCancelAddUser}
	isLoading={isActionLoading}
/>
