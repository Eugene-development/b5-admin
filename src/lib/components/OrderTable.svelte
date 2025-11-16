<script>
	import EmptyState from './EmptyState.svelte';
	import OrderViewModal from './OrderViewModal.svelte';

	let {
		orders = [],
		isLoading = false,
		onDeleteOrder,
		onEditOrder,
		updateCounter = 0,
		searchTerm = '',
		hasSearched = false
	} = $props();

	let showViewModal = $state(false);
	let selectedOrder = $state(null);

	// Sorting state
	let sortColumn = $state(null); // 'supplier', 'urgency', 'status', null
	let sortDirection = $state('asc'); // 'asc' or 'desc'

	// Sorted orders derived from orders and sort state
	let sortedOrders = $derived.by(() => {
		if (!sortColumn || orders.length === 0) {
			return orders;
		}

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
				case 'urgency': {
					const aUrgent = a.is_urgent || a.urgency === 'high' ? 1 : 0;
					const bUrgent = b.is_urgent || b.urgency === 'high' ? 1 : 0;
					compareResult = bUrgent - aUrgent; // Срочные сначала при asc
					break;
				}
				case 'status': {
					const aActive = a.is_active ? 1 : 0;
					const bActive = b.is_active ? 1 : 0;
					compareResult = bActive - aActive; // Активные сначала при asc
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
<div class="ring-opacity-5 w-full overflow-x-auto shadow ring-1 ring-black md:rounded-lg">
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
					class="px-4 py-3 text-left text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
					style="min-width: 60px; width: 60px;"
				>
					№
				</th>
				<th
					scope="col"
					class="px-4 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
					style="min-width: 150px;"
				>
					Закупка
				</th>
				<th
					scope="col"
					class="px-4 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
					style="min-width: 200px;"
				>
					<button
						type="button"
						onclick={() => handleSort('supplier')}
						class="inline-flex items-center space-x-1 transition-colors hover:text-gray-700 dark:hover:text-gray-200"
					>
						<span>Поставщик</span>
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
					class="px-4 py-3 text-left text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
					style="min-width: 120px; width: 120px;"
				>
					<button
						type="button"
						onclick={() => handleSort('urgency')}
						class="inline-flex items-center space-x-1 transition-colors hover:text-gray-700 dark:hover:text-gray-200"
					>
						<span>Срочность</span>
						{#if sortColumn === 'urgency'}
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
					class="px-4 py-3 text-left text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
					style="min-width: 100px; width: 100px;"
				>
					<button
						type="button"
						onclick={() => handleSort('status')}
						class="inline-flex items-center space-x-1 transition-colors hover:text-gray-700 dark:hover:text-gray-200"
					>
						<span>Статус</span>
						{#if sortColumn === 'status'}
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
					class="px-4 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
					style="min-width: 150px;"
				>
					Проект
				</th>
				<th
					scope="col"
					class="px-4 py-3 text-center text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
					style="min-width: 200px; width: 200px;"
				>
					Действия
				</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-950">
			{#if sortedOrders.length === 0}
				<tr>
					<td colspan="7" class="px-4 py-8" role="cell">
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
							class="px-4 py-5 align-top text-sm font-medium whitespace-nowrap text-gray-500 dark:text-gray-400"
							role="cell"
						>
							{order.sequentialNumber || index + 1}
						</td>
						<td class="px-4 py-5 align-top text-sm text-gray-900 dark:text-white" role="cell">
							<div class="pr-4 leading-relaxed break-words">
								{order.order_number || order.deal || 'Не указан'}
							</div>
						</td>
						<td class="px-4 py-5 align-top text-sm text-gray-900 dark:text-white" role="cell">
							<div class="pr-4 leading-relaxed break-words">
								{order.company?.name || order.supplier || 'Не указан'}
							</div>
						</td>
						<td
							class="px-4 py-5 align-top text-sm whitespace-nowrap text-gray-900 dark:text-white"
							role="cell"
						>
							<div class="pr-4">
								{#if order.is_urgent || order.urgency === 'high'}
									<span
										class="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200"
									>
										Срочный
									</span>
								{:else}
									<span
										class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200"
									>
										Обычный
									</span>
								{/if}
							</div>
						</td>
						<td
							class="px-4 py-5 align-top text-sm whitespace-nowrap text-gray-900 dark:text-white"
							role="cell"
						>
							<div class="pr-4">
								{#if order.is_active}
									<span
										class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200"
									>
										Активен
									</span>
								{:else}
									<span
										class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200"
									>
										Неактивен
									</span>
								{/if}
							</div>
						</td>
						<td class="px-4 py-5 align-top text-sm text-gray-900 dark:text-white" role="cell">
							<div class="pr-4 leading-relaxed break-words">
								{order.project?.contract_number || order.contract_number || 'Не указан'}
							</div>
						</td>
						<td class="relative px-4 py-5 text-center align-top whitespace-nowrap" role="cell">
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
					<dl class="mb-4 grid grid-cols-1 gap-3">
						<div>
							<dt
								class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
							>
								Срочность
							</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">
								{#if order.is_urgent || order.urgency === 'high'}
									<span
										class="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200"
									>
										Срочный
									</span>
								{:else}
									<span
										class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200"
									>
										Обычный
									</span>
								{/if}
							</dd>
						</div>
						<div>
							<dt
								class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
							>
								Статус
							</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">
								{#if order.is_active}
									<span
										class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200"
									>
										Активен
									</span>
								{:else}
									<span
										class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200"
									>
										Неактивен
									</span>
								{/if}
							</dd>
						</div>
						<div>
							<dt
								class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
							>
								Проект
							</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">
								{order.project?.contract_number || order.contract_number || 'Не указан'}
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
