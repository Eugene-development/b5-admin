<script>
	import OrderTable from '$lib/components/OrderTable.svelte';
	import OrderAddModal from '$lib/components/OrderAddModal.svelte';
	import OrderEditModal from '$lib/components/OrderEditModal.svelte';
	import TableSkeleton from '$lib/components/TableSkeleton.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import { page } from '$app/stores';
	import { hasOrderAccess, initializeDomainDetection } from '$lib/utils/domainAccess.svelte.js';
	import { onMount } from 'svelte';
	import { ErrorBoundary, ConfirmationModal } from '$lib';
	import {
		toasts,
		addSuccessToast,
		addErrorToast,
		handleApiError,
		clearAllToasts,
		retryOperation
	} from '$lib/utils/toastStore.js';
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte';
	import { invalidateAll, goto } from '$app/navigation';
	import { createOrder, deleteOrder, refreshOrders, updateOrder } from '$lib/api/orders.js';

	let { data } = $props();
	let hasAccess = $state(false);
	let orders = $state([]);
	let isLoading = $state(false);
	let isRefreshing = $state(false);
	let searchTerm = $state('');
	let hasSearched = $state(false);
	let updateCounter = $state(0);

	// Pagination state
	let currentPage = $state(1);
	const itemsPerPage = 10;

	// Add modal state
	let showAddModal = $state(false);
	let isActionLoading = $state(false);

	// Edit modal state
	let showEditModal = $state(false);
	let editingOrder = $state(null);

	// Confirmation modal state
	let showConfirmModal = $state(false);
	let confirmAction = $state(null);

	// Data for companies and projects
	let companies = $state([]);
	let projects = $state([]);

	// Error boundary state
	let hasError = $state(false);
	let errorBoundaryError = $state(null);

	// Initialize domain detection and check access
	onMount(() => {
		initializeDomainDetection();
		hasAccess = hasOrderAccess();

		// Load data if we have empty initial data
		if (orders.length === 0) {
			refreshData(true); // Pass true to indicate initial load
		}
	});

	// Filtered orders based on search term - automatically reactive
	let filteredOrders = $derived.by(() => {
		if (!searchTerm.trim()) {
			return orders;
		}

		const term = searchTerm.toLowerCase().trim();
		return orders.filter((order) => {
			return (
				order.id.toString().includes(term) ||
				(order.order_number && order.order_number.toLowerCase().includes(term)) ||
				(order.value && order.value.toLowerCase().includes(term)) ||
				(order.company?.name && order.company.name.toLowerCase().includes(term)) ||
				(order.project?.value && order.project.value.toLowerCase().includes(term)) ||
				// Поддержка старых полей для обратной совместимости
				(order.supplier && order.supplier.toLowerCase().includes(term)) ||
				(order.deal && order.deal.toLowerCase().includes(term)) ||
				(order.comment && order.comment.toLowerCase().includes(term))
			);
		});
	});

	// Get paginated orders
	let paginatedOrders = $derived.by(() => {
		const startIndex = (currentPage - 1) * itemsPerPage;
		const endIndex = startIndex + itemsPerPage;
		return filteredOrders.slice(startIndex, endIndex);
	});

	// Search functionality
	function handleSearch() {
		hasSearched = searchTerm.trim().length > 0;
		currentPage = 1;
	}

	// Clear search
	function clearSearch() {
		searchTerm = '';
		hasSearched = false;
		currentPage = 1;
	}

	// Reset to first page when filters change
	$effect(() => {
		searchTerm;
		currentPage = 1;
	});

	// Handle delete order with confirmation
	function handleDeleteOrder(order) {
		confirmAction = {
			type: 'delete',
			order: order,
			title: 'Удалить заказ',
			message: `Вы уверены, что хотите НАВСЕГДА удалить заказ "${order.order_number}"? Это действие нельзя отменить. Все данные заказа и его позиции будут потеряны.`,
			confirmText: 'Удалить навсегда',
			isDestructive: true
		};
		showConfirmModal = true;
		clearAllToasts();
	}

	// Execute confirmed action with retry mechanism
	async function confirmActionHandler() {
		if (!confirmAction) return;

		isActionLoading = true;

		try {
			const { type, order } = confirmAction;

			// Use retry mechanism for critical operations
			await retryOperation(
				async () => {
					if (type === 'delete') {
						await deleteOrder(order.id);
						// Remove order and recalculate sequential numbers
						const remainingOrders = orders.filter((o) => o.id !== order.id);
						orders = remainingOrders.map((o, index) => ({
							...o,
							sequentialNumber: index + 1
						}));
						// filteredOrders automatically updates via $derived
						updateCounter++;
						addSuccessToast(`Заказ "${order.order_number}" успешно удален.`);
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

	// Handle edit order
	function handleEditOrder(order) {
		editingOrder = order;
		showEditModal = true;
		clearAllToasts();
	}

	// Handle keyboard shortcuts
	function handleKeydown(event) {
		// Ctrl/Cmd + K to focus search
		if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
			event.preventDefault();
			document.getElementById('order-search')?.focus();
		}
		// Escape to clear search
		if (event.key === 'Escape' && searchTerm) {
			clearSearch();
		}
	}

	// Load orders
	async function refreshData(isInitialLoad = false) {
		isRefreshing = true;
		try {
			const rawOrders = await refreshOrders();

			// Sort orders by created_at in descending order (newest first)
			const sortedOrders = [...rawOrders].sort((a, b) => {
				const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
				const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
				return dateB - dateA;
			});

			// Add sequential numbers to orders (1, 2, 3, ...)
			const refreshedOrders = sortedOrders.map((order, index) => ({
				...order,
				sequentialNumber: index + 1
			}));

			orders = refreshedOrders;
			// filteredOrders automatically updates via $derived
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
		// Reinitialize access check
		initializeDomainDetection();
		hasAccess = hasOrderAccess();
	}

	// Handle retry for load errors
	async function handleRetry() {
		// Reload the page data
		await invalidateAll();
	}

	// Open add modal
	function handleAddOrder() {
		showAddModal = true;
		clearAllToasts();
	}

	// Save new order
	async function handleSaveNewOrder(orderData) {
		isActionLoading = true;

		try {
			await retryOperation(
				async () => {
					const newOrder = await createOrder(orderData);

					// Добавляем информацию о компании и проекте для отображения
					const company = companies.find((c) => c.id === newOrder.company_id);
					const project = projects.find((p) => p.id === newOrder.project_id);

					const enrichedOrder = {
						...newOrder,
						company,
						project,
						sequentialNumber: 1 // New order gets #1
					};

					// Add new order at the beginning and recalculate sequential numbers
					const allOrders = [enrichedOrder, ...orders];
					orders = allOrders.map((order, index) => ({
						...order,
						sequentialNumber: index + 1
					}));
					// filteredOrders automatically updates via $derived
					updateCounter++;

					addSuccessToast(`Заказ #${newOrder.order_number} успешно добавлен`);
				},
				2,
				1000
			);
		} catch (error) {
			console.error('Failed to create order:', error);
		} finally {
			isActionLoading = false;
			showAddModal = false;
		}
	}

	// Cancel add order
	function handleCancelAddOrder() {
		showAddModal = false;
		isActionLoading = false;
	}

	// Save edited order
	async function handleSaveEditedOrder(orderData) {
		isActionLoading = true;

		try {
			await retryOperation(
				async () => {
					// Import position API functions
					const { updateOrderPosition, deleteOrderPosition, createOrderPosition } = await import(
						'$lib/api/orders.js'
					);

					// Update order basic info
					const updatedOrder = await updateOrder({
						id: orderData.id,
						value: orderData.value,
						company_id: orderData.company_id,
						project_id: orderData.project_id,
						order_number: orderData.order_number,
						delivery_date: orderData.delivery_date,
						actual_delivery_date: orderData.actual_delivery_date,
						is_active: orderData.is_active,
						is_urgent: orderData.is_urgent
					});

					// Delete removed positions
					if (orderData.deletedPositionIds && orderData.deletedPositionIds.length > 0) {
						await Promise.all(orderData.deletedPositionIds.map((id) => deleteOrderPosition(id)));
					}

					// Process positions
					for (const position of orderData.positions) {
						if (position.isExisting) {
							// Update existing position
							await updateOrderPosition({
								id: position.id,
								value: position.value,
								article: position.article,
								price: position.price,
								count: position.count,
								is_active: position.is_active,
								is_urgent: position.is_urgent
							});
						} else {
							// Create new position
							await createOrderPosition({
								order_id: orderData.id,
								value: position.value,
								article: position.article,
								price: position.price,
								count: position.count,
								is_active: position.is_active,
								is_urgent: position.is_urgent
							});
						}
					}

					// Refresh the full order to get all positions
					const refreshedOrders = await refreshOrders();
					const fullOrder = refreshedOrders.find((o) => o.id === orderData.id);

					if (fullOrder) {
						// Preserve sequentialNumber when updating order
						const currentOrder = orders.find((o) => o.id === fullOrder.id);
						const enrichedOrder = {
							...fullOrder,
							sequentialNumber: currentOrder?.sequentialNumber
						};
						orders = orders.map((o) => (o.id === enrichedOrder.id ? enrichedOrder : o));
						// filteredOrders automatically updates via $derived
					}

					updateCounter++;
					addSuccessToast(`Заказ #${updatedOrder.order_number} успешно обновлен`);
				},
				2,
				1000
			);
		} catch (error) {
			console.error('Failed to update order:', error);
		} finally {
			isActionLoading = false;
			showEditModal = false;
			editingOrder = null;
		}
	}

	// Cancel edit order
	function handleCancelEditOrder() {
		showEditModal = false;
		editingOrder = null;
		isActionLoading = false;
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<ProtectedRoute>
	{#snippet children()}
		<ErrorBoundary
			{hasError}
			error={errorBoundaryError}
			onError={handleErrorBoundaryError}
			onRetry={retryFromErrorBoundary}
			fallbackTitle="Order Page Error"
			fallbackMessage="An error occurred while loading the order page."
			showDetails={true}
		>
			{#if !hasAccess}
				<div class="flex min-h-[400px] items-center justify-center">
					<div class="text-center">
						<div class="mx-auto h-12 w-12 text-gray-400">
							<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z"
								/>
							</svg>
						</div>
						<h3 class="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
							Доступ запрещен
						</h3>
						<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
							Страница закупок доступна только с доменов admin.bonus.band и bonus.band
						</p>
					</div>
				</div>
			{:else}
				{#await data.ordersData}
					<!-- Loading state: Show skeleton -->
					<TableSkeleton columns={6} />
				{:then ordersData}
					<!-- Success state: Show data or error -->
					{#if ordersData.error}
						<!-- Error state from API -->
						<div class="flex min-h-[400px] items-center justify-center">
							<div class="mx-auto max-w-md text-center">
								<div
									class="rounded-lg border border-red-500/30 bg-red-500/10 p-8 dark:bg-red-500/20"
								>
									<svg
										class="mx-auto h-12 w-12 text-red-600 dark:text-red-400"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										aria-hidden="true"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z"
										/>
									</svg>
									<h3 class="mt-4 mb-4 text-xl font-semibold text-gray-900 dark:text-white">
										Ошибка загрузки закупок
									</h3>
									<p class="mb-6 text-sm text-red-600 dark:text-red-300">
										{ordersData.error}
									</p>
									{#if ordersData.canRetry}
										<button
											onclick={handleRetry}
											class="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
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
													d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
												/>
											</svg>
											Попробовать снова
										</button>
									{/if}
								</div>
							</div>
						</div>
					{:else}
						<!-- Initialize local state from loaded data -->
						{#if orders.length === 0 && ordersData.orders.length > 0}
							{((orders = ordersData.orders), '')}
						{/if}
						{#if companies.length === 0 && ordersData.companies.length > 0}
							{((companies = ordersData.companies), '')}
						{/if}
						{#if projects.length === 0 && ordersData.projects.length > 0}
							{((projects = ordersData.projects), '')}
						{/if}

						<!-- Show skeleton during initial data refresh when no data is available -->
						{#if isRefreshing && orders.length === 0}
							<TableSkeleton columns={6} />
						{:else}
							<div class="space-y-6">
								<!-- Page Header -->
								<div class="border-b border-gray-200 pb-5 dark:border-gray-700">
									<div class="flex items-center justify-between">
										<div>
											<h1
												class="text-2xl leading-7 font-bold text-gray-900 sm:truncate sm:text-3xl dark:text-white"
											>
												Закупка
											</h1>
											<p class="mt-1 hidden text-sm text-gray-500 sm:block dark:text-gray-400">
												Управление закупками и их статусами
											</p>
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
											<!-- Add Order Button -->
											<button
												type="button"
												onclick={handleAddOrder}
												disabled={isActionLoading}
												class="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
											>
												<svg
													class="mr-1.5 -ml-0.5 h-5 w-5"
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
												Добавить
											</button>
										</div>
									</div>
								</div>

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
												id="order-search"
												type="text"
												bind:value={searchTerm}
												oninput={handleSearch}
												class="block w-full rounded-md border-0 py-1.5 pr-3 pl-10 text-gray-900 ring-1 ring-gray-300 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-600 focus:ring-inset sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-white dark:ring-gray-600 dark:placeholder:text-gray-500"
												placeholder="Поиск закупок... (Ctrl+K)"
												aria-label="Поиск закупок"
											/>
											{#if searchTerm}
												<button
													type="button"
													onclick={clearSearch}
													class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
													aria-label="Очистить поиск"
												>
													<svg
														class="h-5 w-5"
														xmlns="http://www.w3.org/2000/svg"
														fill="none"
														viewBox="0 0 24 24"
														stroke="currentColor"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M6 18L18 6M6 6l12 12"
														/>
													</svg>
												</button>
											{/if}
										</div>
									</div>
								</div>

								<!-- Results summary -->
								{#if searchTerm.trim()}
									<div class="text-sm text-gray-600 dark:text-gray-400">
										{#if filteredOrders.length === 0}
											Закупки не найдены по запросу "{searchTerm}"
										{:else}
											Найдено {filteredOrders.length} закуп{filteredOrders.length === 1
												? 'ка'
												: filteredOrders.length < 5
													? 'ки'
													: 'ок'} по запросу "{searchTerm}"
										{/if}
									</div>
								{/if}

								<!-- Orders Table -->
								<div class="rounded-lg bg-white shadow dark:bg-gray-800">
									<OrderTable
										orders={paginatedOrders}
										{isLoading}
										{searchTerm}
										{hasSearched}
										{updateCounter}
										onDeleteOrder={handleDeleteOrder}
										onEditOrder={handleEditOrder}
									/>
								</div>

								<!-- Pagination -->
								<Pagination
									bind:currentPage
									totalItems={filteredOrders.length}
									{itemsPerPage}
									filteredFrom={searchTerm.trim() ? orders.length : null}
								/>
							</div>
						{/if}
					{/if}
				{:catch error}
					<!-- Critical error state -->
					<div class="flex min-h-[400px] items-center justify-center">
						<div class="mx-auto max-w-md text-center">
							<div class="rounded-lg border border-red-500/30 bg-red-500/10 p-8 dark:bg-red-500/20">
								<svg
									class="mx-auto h-12 w-12 text-red-600 dark:text-red-400"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-hidden="true"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z"
									/>
								</svg>
								<h3 class="mt-4 mb-4 text-xl font-semibold text-gray-900 dark:text-white">
									Критическая ошибка
								</h3>
								<p class="mb-6 text-sm text-red-600 dark:text-red-300">
									Не удалось загрузить данные закупок. Попробуйте обновить страницу.
								</p>
								<button
									onclick={handleRetry}
									class="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
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
											d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
										/>
									</svg>
									Обновить страницу
								</button>
							</div>
						</div>
					</div>
				{/await}
			{/if}
		</ErrorBoundary>
	{/snippet}
</ProtectedRoute>

<!-- Order Add Modal -->
<OrderAddModal
	isOpen={showAddModal}
	onSave={handleSaveNewOrder}
	onCancel={handleCancelAddOrder}
	isLoading={isActionLoading}
	{companies}
	{projects}
/>

<!-- Order Edit Modal -->
<OrderEditModal
	isOpen={showEditModal}
	order={editingOrder}
	onSave={handleSaveEditedOrder}
	onCancel={handleCancelEditOrder}
	isLoading={isActionLoading}
	{companies}
	{projects}
/>

<!-- Confirmation Modal -->
<ConfirmationModal
	isOpen={showConfirmModal}
	title={confirmAction?.title || ''}
	message={confirmAction?.message || ''}
	confirmText={confirmAction?.confirmText || 'Подтвердить'}
	cancelText="Отмена"
	isDestructive={confirmAction?.isDestructive || false}
	isLoading={isActionLoading}
	onConfirm={confirmActionHandler}
	onCancel={cancelAction}
/>
