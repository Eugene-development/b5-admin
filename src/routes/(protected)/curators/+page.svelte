<script>
	import {
		UsersTable,
		SearchBar,
		ConfirmationModal,
		ErrorBoundary,
		LoadingSpinner,
		EmptyState,
		UserViewModal,
		UserEditModal
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
	import { banUser, unbanUser, deleteUser, refreshUsers, updateUser } from '$lib/api/agents.js';
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte';

	let { data } = $props();

	// Search state management
	let searchTerm = $state('');

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

	// Error boundary state
	let hasError = $state(false);
	let errorBoundaryError = $state(null);

	// Loading state for data refresh
	let isRefreshing = $state(false);

	// Local users state for updates - normalize status and sort by created_at descending
	// Filter only curators (users with status slug 'curators')
	let localUsers = $state([
		...(data?.agents || [])
			.filter((user) => user.userStatus?.slug === 'curators')
			.map((user) => ({
				...user,
				// Keep old status field for backward compatibility (derived from ban field)
				status: user.ban ? 'banned' : 'active',
				// Add new status fields
				status_id: user.status_id,
				userStatus: user.userStatus
			}))
			.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
	]);

	// Force update counter for reactivity
	let updateCounter = $state(0);

	// Check for server-side load errors
	let loadError = $state(data?.error || null);

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

	// Search handler function
	function handleSearch(term) {
		searchTerm = term;
	}

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
		console.log('Debug: Manually setting user status:', { userId, status });
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
			fallbackTitle="Agents Page Error"
			fallbackMessage="An error occurred while loading the agents page. This might be due to a network issue or server problem."
			showDetails={true}
		>
			<!-- Skip link for keyboard navigation -->
			<a
				href="#main-content"
				class="sr-only z-50 rounded-md bg-indigo-600 px-4 py-2 text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
			>
				Перейти к основному контенту
			</a>

			<div class="space-y-6 bg-gray-950">
				<!-- Page landmark -->
				<main id="main-content" aria-labelledby="page-title">
					<div
						class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0"
					>
						<div class="flex-auto">
							<h1
								id="page-title"
								class="text-lg font-semibold text-gray-900 sm:text-base dark:text-white"
							>
								Кураторы
							</h1>
						</div>
						<div class="flex-none">
							<button
								type="button"
								onclick={refreshData}
								disabled={isRefreshing}
								class="inline-flex min-h-[44px] w-full items-center justify-center rounded-md bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-150 ease-in-out hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
								aria-label="Refresh curators data from server"
								aria-describedby="refresh-button-description"
							>
								{#if isRefreshing}
									<LoadingSpinner size="sm" color="white" inline={true} class="mr-2" />
								{/if}
								{isRefreshing ? 'Обновляю...' : 'Обновить данные'}
							</button>
							<div id="refresh-button-description" class="sr-only">
								Обновить данные кураторов с сервера
							</div>
						</div>
					</div>

					<!-- Load Error Banner -->
					{#if loadError && loadError.canRetry}
						<div class="rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/20">
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

					<!-- Search Bar -->
					<div class="w-full sm:max-w-md" role="search" aria-label="Curator search">
						<SearchBar placeholder="Локальный поиск" onSearch={handleSearch} value={searchTerm} />
					</div>

					<!-- Results summary -->
					{#if searchTerm.trim()}
						<div
							class="py-2 text-sm text-gray-600 dark:text-gray-400"
							role="status"
							aria-live="polite"
							aria-atomic="true"
						>
							{#if filteredUsers.length === 0}
								<p>Кураторы не найдены</p>
								<!-- {:else if filteredUsers.length === 1}
							<p>Найдена 1 запись по запросу "{searchTerm}"</p> -->
							{:else}
								<p>Найдено {filteredUsers.length} поз. по запросу "{searchTerm}"</p>
							{/if}
						</div>
					{/if}

					<UsersTable
						users={filteredUsers}
						isLoading={isActionLoading}
						onBanUser={handleBanUser}
						onDeleteUser={handleDeleteUser}
						onViewUser={handleViewUser}
						onEditUser={handleEditUser}
						{updateCounter}
						{searchTerm}
						hasSearched={searchTerm.trim().length > 0}
					/>
				</main>
			</div>
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
