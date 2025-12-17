<script>
	import EmptyState from '$lib/components/common/EmptyState.svelte';
	import OrderViewModal from './OrderViewModal.svelte';
	import PartnerPaymentStatusBadge from './PartnerPaymentStatusBadge.svelte';
	import OrderStatusBadge from './OrderStatusBadge.svelte';

	let {
		orders = [],
		isLoading = false,
		onDeleteOrder,
		onEditOrder,
		onPartnerPaymentStatusChange = null,
		onOrderStatusChange = null,
		partnerPaymentStatuses = [],
		orderStatuses = [],
		updateCounter = 0,
		searchTerm = '',
		hasSearched = false
	} = $props();

	let showViewModal = $state(false);
	let selectedOrder = $state(null);

	// Sorting state
	let sortColumn = $state(null); // 'supplier', 'urgency_status', null
	let sortDirection = $state('asc'); // 'asc' or 'desc'

	// Format currency
	function formatCurrency(amount) {
		if (amount === null || amount === undefined) return '—';
		return new Intl.NumberFormat('ru-RU', {
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	// Calculate total order amount from positions
	function calculateOrderTotal(order) {
		// If order has positions, calculate from them
		if (order.positions && order.positions.length > 0) {
			return order.positions.reduce((sum, position) => {
				return sum + (position.total_price || 0);
			}, 0);
		}
		// Otherwise use order_amount field
		return order.order_amount || 0;
	}

	// Sorted orders derived from orders and sort state
	let sortedOrders = $derived.by(() => {
		// Return original array reference when no sorting is active
		// This prevents unnecessary re-renders and flickering
		if (!sortColumn) {
			return orders;
		}

		// Only create a new sorted array when sorting is explicitly requested
		const sorted = [...orders];

		sorted.sort((a, b) => {
			let compareResult = 0;

			switch (sortColumn) {
				case 'supplier': {
					const aSupplier = (a.company?.name || a.supplier || '').toLowerCase();
					const bSupplier = (b.company?.name || b.supplier || '').toLowerCase();
					compareResult = aSupplier.localeCompare(bSupplier, 'ru');
					break;
				}
				case 'urgency_status': {
					// Сортировка по срочности (приоритет 1), затем по активности (приоритет 2)
					const aUrgent = a.is_urgent || a.urgency === 'high' ? 1 : 0;
					const bUrgent = b.is_urgent || b.urgency === 'high' ? 1 : 0;
					const aActive = a.is_active ? 1 : 0;
					const bActive = b.is_active ? 1 : 0;
					
					// Сначала сравниваем по срочности
					compareResult = bUrgent - aUrgent;
					
					// Если срочность одинаковая, сравниваем по активности
					if (compareResult === 0) {
						compareResult = bActive - aActive;
					}
					break;
				}
				case 'status': {
					const aStatus = a.status?.value || '';
					const bStatus = b.status?.value || '';
					compareResult = aStatus.localeCompare(bStatus, 'ru');
					break;
				}
			}

			return sortDirection === 'asc' ? compareResult : -compareResult;
		});

		return sorted;
	});

	// Handle sorting
	function handleSort(column) {
		if (sortColumn === column) {
			// Toggle direction if same column
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			// Set new column with default ascending direction
			sortColumn = column;
			sortDirection = 'asc';
		}
	}

	// Handle view order
	function handleViewOrder(order) {
		selectedOrder = order;
		showViewModal = true;
	}

	// Handle close modal
	function handleCloseModal() {
		showViewModal = false;
		selectedOrder = null;
	}

	// Generate unique table ID for accessibility
	const tableId = `orders-table-${Math.random().toString(36).substr(2, 9)}`;
	const tableCaptionId = `${tableId}-caption`;
	const tableDescriptionId = `${tableId}-description`;

	// Announce table updates to screen readers
	function announceTableUpdate() {
		const message =
			sortedOrders.length === 0
				? hasSearched
					? `Закупки не найдены по запросу "${searchTerm}"`
					: 'Нет доступных закупок'
				: `${sortedOrders.length} закуп${sortedOrders.length === 1 ? 'ка' : sortedOrders.length < 5 ? 'ки' : 'ок'} ${hasSearched ? `найдено по запросу "${searchTerm}"` : 'отображено'}`;

		// Use a live region to announce changes
		const announcement = document.getElementById(`${tableId}-announcements`);
		if (announcement) {
			announcement.textContent = message;
			setTimeout(() => {
				announcement.textContent = '';
			}, 1000);
		}
	}

	// Announce updates when orders change
	$effect(() => {
		if (sortedOrders) {
			setTimeout(announceTableUpdate, 100);
		}
	});
</script>

<!-- Live region for screen reader announcements -->
<div id="{tableId}-announcements" class="sr-only" aria-live="polite" aria-atomic="true">
	<!-- Dynamic table update announcements -->
</div>

<!-- Desktop Table View with horizontal scroll -->
<div class="ring-opacity-5 hidden w-full overflow-x-auto shadow ring-1 ring-black md:block md:rounded-lg">
	<table
		id={tableId}
		class="w-full table-auto divide-y divide-gray-300 dark:divide-gray-700"
		aria-labelledby={tableCaptionId}
		aria-describedby={tableDescriptionId}
		style="min-width: 1200px;"
	>
		<caption id={tableCaptionId} class="sr-only">
			Таблица управления закупками с {orders.length} закуп{orders.length === 1 ? 'кой' : 'ками'}
			{hasSearched ? ` по поиску "${searchTerm}"` : ''}
		</caption>
		<thead class="bg-gray-50 dark:bg-gray-800">
			<tr>
				<th
					scope="col"
					class="px-3 py-3 text-left text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
					style="min-width: 60px; width: 60px;"
				>
					№
				</th>
				<th
					scope="col"
					class="px-3 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
					style="min-width: 150px;"
				>
					НОМЕР
				</th>
				<th
					scope="col"
					class="px-3 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
					style="min-width: 150px;"
				>
					ПРОЕКТ
				</th>
				<th
					scope="col"
					class="px-3 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
					style="min-width: 200px;"
				>
					<button
						type="button"
						onclick={() => handleSort('supplier')}
						class="inline-flex items-center space-x-1 transition-colors hover:text-gray-700 dark:hover:text-gray-200"
					>
						<span>ПОСТАВЩИК</span>
						{#if sortColumn === 'supplier'}
							<svg
								class="h-4 w-4"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								{#if sortDirection === 'asc'}
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M5 15l7-7 7 7"
									/>
								{:else}
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 9l-7 7-7-7"
									/>
								{/if}
							</svg>
						{/if}
					</button>
				</th>
				<th
					scope="col"
					class="px-3 py-3 text-right text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
					style="min-width: 120px;"
				>
					СУММА
				</th>
				<th
					scope="col"
					class="px-3 py-3 text-center text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
					style="min-width: 150px;"
				>
					<button
						type="button"
						onclick={() => handleSort('urgency_status')}
						class="inline-flex items-center space-x-1 transition-colors hover:text-gray-700 dark:hover:text-gray-200"
					>
						<span>МЕТКИ</span>
						{#if sortColumn === 'urgency_status'}
							<svg
								class="h-4 w-4"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								{#if sortDirection === 'asc'}
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M5 15l7-7 7 7"
									/>
								{:else}
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 9l-7 7-7-7"
									/>
								{/if}
							</svg>
						{/if}
					</button>
				</th>
				<th
					scope="col"
					class="px-3 py-3 text-center text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
					style="min-width: 180px; width: 180px;"
				>
					<button
						type="button"
						class="inline-flex items-center space-x-1 transition-colors"
						onclick={() => handleSort('status')}
					>
						<span>СТАТУС</span>
						{#if sortColumn === 'status'}
							<span class="text-xs">
								{sortDirection === 'asc' ? '↑' : '↓'}
							</span>
						{/if}
					</button>
				</th>
				<th
					scope="col"
					class="px-3 py-3 text-center text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
					style="min-width: 200px; width: 200px;"
				>
					<span class="sr-only">Действия</span>
				</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-950">
			{#if sortedOrders.length === 0}
				<tr>
					<td colspan="8" class="px-3 py-8" role="cell">
						<EmptyState
							type={hasSearched ? 'no-results' : 'no-data'}
							searchTerm={hasSearched ? searchTerm : ''}
						/>
					</td>
				</tr>
			{:else}
				{#each sortedOrders as order, index (order.id + '-' + updateCounter)}
					<tr
						class="transition-colors duration-150 ease-in-out hover:bg-gray-50 dark:hover:bg-gray-800"
						aria-rowindex={index + 2}
					>
						<td
							class="px-3 py-5 align-middle text-sm font-medium whitespace-nowrap text-gray-500 dark:text-gray-400"
							role="cell"
						>
							{order.sequentialNumber || index + 1}
						</td>
						<td class="px-3 py-5 align-middle text-sm text-gray-900 dark:text-white" role="cell">
							<div class="pr-3 leading-relaxed break-words">
								{order.order_number || order.deal || 'Не указан'}
							</div>
						</td>
						<td class="px-3 py-5 align-middle text-sm text-gray-900 dark:text-white" role="cell">
							<div class="pr-3 leading-relaxed break-words">
								{order.project?.value || order.project?.contract_number || 'Не указан'}
							</div>
						</td>
						<td class="px-3 py-5 align-middle text-sm text-gray-900 dark:text-white" role="cell">
							<div class="pr-3 leading-relaxed break-words">
								{order.company?.name || order.supplier || 'Не указан'}
							</div>
						</td>
						<td class="px-3 py-5 text-right align-middle text-sm font-semibold whitespace-nowrap text-violet-600 dark:text-violet-400" role="cell">
							{formatCurrency(calculateOrderTotal(order))}
						</td>
						<td
							class="px-3 py-5 align-middle text-sm whitespace-nowrap text-gray-900 dark:text-white"
							role="cell"
						>
							<div class="flex items-center justify-center gap-2 pr-3">
								{#if order.is_urgent || order.urgency === 'high'}
									<span
										class="inline-block h-6 w-6 rounded bg-red-500 cursor-help"
										title="Срочный"
										aria-label="Срочный"
									></span>
								{:else}
									<span
										class="inline-block h-6 w-6 rounded bg-blue-500 cursor-help"
										title="Обычный"
										aria-label="Обычный"
									></span>
								{/if}
								{#if order.is_active}
									<span
										class="inline-block h-6 w-6 rounded bg-green-500 cursor-help"
										title="Активен"
										aria-label="Активен"
									></span>
								{:else}
									<span
										class="inline-block h-6 w-6 rounded bg-gray-500 cursor-help"
										title="Неактивен"
										aria-label="Неактивен"
									></span>
								{/if}
							</div>
						</td>
						<td class="px-3 py-5 text-center align-middle whitespace-nowrap" role="cell">
							<OrderStatusBadge
								{order}
								{orderStatuses}
								onStatusChange={(result) => {
									if (onOrderStatusChange) {
										onOrderStatusChange(order.id, result);
									}
								}}
							/>
						</td>
						<td class="relative px-3 py-5 text-center align-middle whitespace-nowrap" role="cell">
							<div class="flex items-center justify-center space-x-2">
								<!-- View Button -->
								<button
									type="button"
									onclick={() => handleViewOrder(order)}
									class="inline-flex items-center rounded-md bg-gray-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-gray-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
									aria-label="Просмотреть закупку № {index + 1}"
								>
									<svg
										class="h-4 w-4"
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
											d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
										/>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
										/>
									</svg>
								</button>
								<!-- Edit Button -->
								<button
									type="button"
									onclick={() => onEditOrder && onEditOrder(order)}
									class="inline-flex items-center rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
									aria-label="Редактировать закупку № {index + 1}"
								>
									<svg
										class="h-4 w-4"
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
											d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
										/>
									</svg>
								</button>
								<!-- Delete Button -->
								<button
									type="button"
									onclick={() => onDeleteOrder && onDeleteOrder(order)}
									disabled={isLoading}
									class="inline-flex items-center rounded-md bg-red-800 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50"
									aria-label="Удалить закупку № {index + 1}"
								>
									{#if isLoading}
										<svg
											class="mr-1 h-3 w-3 animate-spin"
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											aria-hidden="true"
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
											class="h-4 w-4"
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
												d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
											/>
										</svg>
									{/if}
								</button>
							</div>
						</td>
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</div>

<!-- Mobile Card View -->
<div class="md:hidden">
	{#if sortedOrders.length === 0}
		<div class="px-4 py-6">
			<EmptyState
				type={hasSearched ? 'no-results' : 'no-data'}
				searchTerm={hasSearched ? searchTerm : ''}
			/>
		</div>
	{:else}
		<div class="space-y-4" role="list" aria-label="Список закупок">
			{#each sortedOrders as order, index (order.id + '-' + updateCounter)}
				<div
					class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
					role="listitem"
				>
					<!-- Order Header -->
					<div class="mb-3 flex items-start justify-between">
						<div class="min-w-0 flex-1">
							<h3 class="text-sm font-medium break-words text-gray-900 dark:text-white">
								{order.order_number || order.deal || 'Номер не указан'}
							</h3>
							<p class="text-sm break-words text-gray-500 dark:text-gray-400">
								{order.company?.name || order.supplier || 'Поставщик не указан'}
							</p>
						</div>
						<div class="ml-3 flex-shrink-0">
							<span
								class="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200"
							>
								№ {order.sequentialNumber || index + 1}
							</span>
						</div>
					</div>

					<!-- Order Details Grid -->
					<dl class="mb-4 grid grid-cols-2 gap-3">
						<div>
							<dt
								class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
							>
								Метки
							</dt>
							<dd class="mt-1 flex items-center gap-2">
								{#if order.is_urgent || order.urgency === 'high'}
									<span
										class="inline-block h-6 w-6 rounded bg-red-500 cursor-help"
										title="Срочный"
										aria-label="Срочный"
									></span>
								{:else}
									<span
										class="inline-block h-6 w-6 rounded bg-blue-500 cursor-help"
										title="Обычный"
										aria-label="Обычный"
									></span>
								{/if}
								{#if order.is_active}
									<span
										class="inline-block h-6 w-6 rounded bg-green-500 cursor-help"
										title="Активен"
										aria-label="Активен"
									></span>
								{:else}
									<span
										class="inline-block h-6 w-6 rounded bg-gray-500 cursor-help"
										title="Неактивен"
										aria-label="Неактивен"
									></span>
								{/if}
							</dd>
						</div>
						<div class="col-span-2">
							<dt
								class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
							>
								Проект
							</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">
								{order.project?.value || order.project?.contract_number || 'Не указан'}
							</dd>
						</div>
						<div>
							<dt
								class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
							>
								Сумма
							</dt>
							<dd class="mt-1 text-base font-semibold text-violet-600 dark:text-violet-400">
								{formatCurrency(calculateOrderTotal(order))}
							</dd>
						</div>
						<div class="col-span-2">
							<dt
								class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
							>
								Статус
							</dt>
							<dd class="mt-1 text-sm">
								<OrderStatusBadge
									{order}
									{orderStatuses}
									onStatusChange={(result) => {
										if (onOrderStatusChange) {
											onOrderStatusChange(order.id, result);
										}
									}}
								/>
							</dd>
						</div>
					</dl>

					<!-- Actions -->
					<div
						class="flex items-center justify-end space-x-2 border-t border-gray-200 pt-3 dark:border-gray-600"
					>
						<!-- View Button -->
						<button
							type="button"
							onclick={() => handleViewOrder(order)}
							class="inline-flex min-h-[44px] items-center justify-center rounded-md bg-gray-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-gray-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
							aria-label="Просмотреть заказ № {index + 1}"
						>
							<svg
								class="h-5 w-5"
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
									d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
								/>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
								/>
							</svg>
						</button>
						<!-- Edit Button -->
						<button
							type="button"
							onclick={() => onEditOrder && onEditOrder(order)}
							class="inline-flex min-h-[44px] items-center justify-center rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
							aria-label="Редактировать заказ № {index + 1}"
						>
							<svg
								class="h-5 w-5"
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
									d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
								/>
							</svg>
						</button>
						<!-- Delete Button -->
						<button
							type="button"
							onclick={() => onDeleteOrder && onDeleteOrder(order)}
							disabled={isLoading}
							class="inline-flex min-h-[44px] items-center justify-center rounded-md bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50"
							aria-label="Удалить заказ № {index + 1}"
						>
							{#if isLoading}
								<svg
									class="mr-2 h-4 w-4 animate-spin"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									aria-hidden="true"
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
									class="h-5 w-5"
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
										d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
									/>
								</svg>
							{/if}
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- View Modal -->
{#if showViewModal && selectedOrder}
	<OrderViewModal order={selectedOrder} onClose={handleCloseModal} />
{/if}
