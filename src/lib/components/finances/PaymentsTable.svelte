<script>
	/**
	 * Таблица заявок на выплату бонусов
	 * Feature: bonus-payments
	 * Requirements: 6.2, 6.3, 6.4, 6.9
	 */
	import EmptyState from '$lib/components/common/EmptyState.svelte';
	import PaymentStatusBadge from './PaymentStatusBadge.svelte';
	import PaymentViewModal from './PaymentViewModal.svelte';
	import PaymentEditModal from './PaymentEditModal.svelte';
	import PaymentDeleteModal from './PaymentDeleteModal.svelte';

	let {
		requests = [],
		isLoading = false,
		statuses = [],
		onStatusChange = null,
		onPaymentUpdate = null,
		onPaymentDelete = null,
		updateCounter = 0,
		searchTerm = '',
		hasSearched = false
	} = $props();

	// Modal state
	let isViewModalOpen = $state(false);
	let isEditModalOpen = $state(false);
	let isDeleteModalOpen = $state(false);
	let selectedPayment = $state(null);

	// Format currency
	function formatCurrency(amount) {
		if (amount === null || amount === undefined) return '—';
		return new Intl.NumberFormat('ru-RU', {
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	// Format date
	function formatDate(dateString) {
		if (!dateString) return '—';
		const date = new Date(dateString);
		return date.toLocaleDateString('ru-RU', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	}

	// Format datetime
	function formatDateTime(dateString) {
		if (!dateString) return '—';
		const date = new Date(dateString);
		return date.toLocaleDateString('ru-RU', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	// Get payment method name and icon
	function getPaymentMethodInfo(method) {
		switch (method) {
			case 'card':
				return { name: 'Карта', icon: '💳' };
			case 'sbp':
				return { name: 'СБП', icon: '📱' };
			case 'other':
				return { name: 'Другое', icon: '📋' };
			default:
				return { name: 'Не указан', icon: '❓' };
		}
	}

	// Get payment details based on method
	function getPaymentDetails(request) {
		switch (request.payment_method) {
			case 'card':
				return request.card_number || '—';
			case 'sbp':
				return request.phone_number || '—';
			case 'other':
				return request.contact_info || '—';
			default:
				return '—';
		}
	}

	// Open view modal
	function openViewModal(request) {
		selectedPayment = request;
		isViewModalOpen = true;
	}

	// Close view modal
	function closeViewModal() {
		isViewModalOpen = false;
		selectedPayment = null;
	}

	// Open edit modal
	function openEditModal(request) {
		selectedPayment = request;
		isEditModalOpen = true;
	}

	// Close edit modal
	function closeEditModal() {
		isEditModalOpen = false;
		selectedPayment = null;
	}

	// Handle edit success
	function handleEditSuccess(updatedPayment) {
		if (onPaymentUpdate) {
			onPaymentUpdate(updatedPayment);
		}
	}

	// Open delete modal
	function openDeleteModal(request) {
		selectedPayment = request;
		isDeleteModalOpen = true;
	}

	// Close delete modal
	function closeDeleteModal() {
		isDeleteModalOpen = false;
		selectedPayment = null;
	}

	// Handle delete success
	function handleDeleteSuccess(paymentId) {
		if (onPaymentDelete) {
			onPaymentDelete(paymentId);
		}
	}

	// Get requester type label
	function getRequesterTypeLabel(type) {
		switch (type) {
			case 'agent':
				return { label: 'Агент', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' };
			case 'curator':
				return { label: 'Куратор', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' };
			default:
				return { label: 'Агент', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' };
		}
	}

	// Generate unique table ID for accessibility
	const tableId = `payments-table-${Math.random().toString(36).substr(2, 9)}`;
</script>

<!-- Modals -->
<PaymentViewModal isOpen={isViewModalOpen} payment={selectedPayment} onClose={closeViewModal} />
<PaymentEditModal isOpen={isEditModalOpen} payment={selectedPayment} onClose={closeEditModal} onSuccess={handleEditSuccess} />
<PaymentDeleteModal isOpen={isDeleteModalOpen} payment={selectedPayment} onClose={closeDeleteModal} onSuccess={handleDeleteSuccess} />

<!-- Desktop Table View -->
<div
	class="hidden w-full overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:block md:rounded-lg"
>
	<table
		id={tableId}
		class="w-full table-auto divide-y divide-gray-300 dark:divide-gray-700"
		style="min-width: 1000px;"
	>
		<thead class="bg-gray-100 dark:bg-gray-900">
			<tr>
				<th
					scope="col"
					class="whitespace-nowrap px-3 py-4 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
					style="min-width: 60px; width: 60px;"
				>
					№
				</th>
				<th
					scope="col"
					class="px-3 py-4 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
					style="min-width: 180px;"
				>
					ПОЛЬЗОВАТЕЛЬ
				</th>
				<th
					scope="col"
					class="px-3 py-4 text-center text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
					style="min-width: 100px;"
				>
					ТИП
				</th>
				<th
					scope="col"
					class="whitespace-nowrap px-3 py-4 text-right text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
					style="min-width: 120px;"
				>
					СУММА
				</th>
				<th
					scope="col"
					class="px-3 py-4 text-center text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
					style="min-width: 120px;"
				>
					СПОСОБ
				</th>
				<th
					scope="col"
					class="px-3 py-4 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
					style="min-width: 180px;"
				>
					РЕКВИЗИТЫ
				</th>
				<th
					scope="col"
					class="px-3 py-4 text-center text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
					style="min-width: 140px;"
				>
					СТАТУС
				</th>
				<th
					scope="col"
					class="whitespace-nowrap px-3 py-4 text-center text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
					style="min-width: 120px;"
				>
					ДАТА ЗАЯВКИ
				</th>
				<th
					scope="col"
					class="whitespace-nowrap px-3 py-4 text-center text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
					style="min-width: 120px;"
				>
					ДАТА ВЫПЛАТЫ
				</th>
				<th
					scope="col"
					class="px-3 py-4 text-center text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
					style="min-width: 80px; width: 80px;"
				>
					ДЕЙСТВИЯ
				</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-950">
			{#if requests.length === 0}
				<tr>
					<td colspan="10" class="px-3 py-8" role="cell">
						<EmptyState
							type={hasSearched ? 'no-results' : 'no-data'}
							searchTerm={hasSearched ? searchTerm : ''}
						/>
					</td>
				</tr>
			{:else}
				{#each requests as request, index (request.id + '-' + updateCounter)}
					{@const methodInfo = getPaymentMethodInfo(request.payment_method)}
					{@const typeInfo = getRequesterTypeLabel(request.requester_type)}
					<tr
						class="transition-colors duration-150 ease-in-out hover:bg-gray-50 dark:hover:bg-gray-800"
					>
						<td
							class="whitespace-nowrap px-3 py-3 align-middle text-sm font-medium text-gray-500 dark:text-gray-400"
						>
							{index + 1}
						</td>
						<td class="px-3 py-3 align-middle text-sm text-gray-900 dark:text-white">
							<div class="flex flex-col">
								<span class="font-medium">{request.agent?.name || 'Не указан'}</span>
								{#if request.agent?.email}
									<span class="text-xs text-gray-500 dark:text-gray-400">{request.agent.email}</span
									>
								{/if}
								{#if request.agent?.phone}
									<span class="text-xs text-gray-500 dark:text-gray-400">{request.agent.phone}</span
									>
								{/if}
							</div>
						</td>
						<td class="whitespace-nowrap px-3 py-3 text-center align-middle">
							<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {typeInfo.color}">
								{typeInfo.label}
							</span>
						</td>
						<td
							class="whitespace-nowrap px-3 py-3 text-right align-middle text-sm font-semibold text-green-600 dark:text-green-400"
						>
							{formatCurrency(request.amount)}
						</td>
						<td class="whitespace-nowrap px-3 py-3 text-center align-middle text-sm">
							<span class="text-gray-700 dark:text-gray-300">{methodInfo.name}</span>
						</td>
						<td class="px-3 py-3 align-middle text-sm text-gray-900 dark:text-white">
							<div class="max-w-[180px] truncate" title={getPaymentDetails(request)}>
								{getPaymentDetails(request)}
							</div>
						</td>
						<td class="whitespace-nowrap px-3 py-3 text-center align-middle">
							<PaymentStatusBadge
								{request}
								{statuses}
								onStatusChange={(result) => {
									if (onStatusChange) {
										onStatusChange(request.id, result);
									}
								}}
							/>
						</td>
						<td
							class="whitespace-nowrap px-3 py-3 text-center align-middle text-sm text-gray-500 dark:text-gray-400"
						>
							{formatDate(request.created_at)}
						</td>
						<td
							class="whitespace-nowrap px-3 py-3 text-center align-middle text-sm text-gray-500 dark:text-gray-400"
						>
							{formatDate(request.payment_date)}
						</td>
						<td class="whitespace-nowrap px-3 py-3 text-center align-middle">
							<div class="flex items-center justify-center gap-2">
								<button
									type="button"
									onclick={() => openViewModal(request)}
									class="inline-flex items-center rounded-md bg-indigo-50 p-2 text-indigo-600 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50"
									title="Просмотр"
									aria-label="Просмотреть заявку"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-5 w-5"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
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
								<button
									type="button"
									onclick={() => openEditModal(request)}
									class="inline-flex items-center rounded-md bg-blue-50 p-2 text-blue-600 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
									title="Редактировать"
									aria-label="Редактировать заявку"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-5 w-5"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
										/>
									</svg>
								</button>
								<button
									type="button"
									onclick={() => openDeleteModal(request)}
									class="inline-flex items-center rounded-md bg-red-50 p-2 text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
									title="Удалить"
									aria-label="Удалить заявку"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-5 w-5"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
										/>
									</svg>
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
	{#if requests.length === 0}
		<div class="px-4 py-6">
			<EmptyState
				type={hasSearched ? 'no-results' : 'no-data'}
				searchTerm={hasSearched ? searchTerm : ''}
			/>
		</div>
	{:else}
		<div class="space-y-4" role="list" aria-label="Список заявок на выплату">
			{#each requests as request, index (request.id + '-' + updateCounter)}
				{@const methodInfo = getPaymentMethodInfo(request.payment_method)}
				{@const typeInfo = getRequesterTypeLabel(request.requester_type)}
				<div
					class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
					role="listitem"
				>
					<!-- Header -->
					<div class="mb-3 flex items-start justify-between">
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-2">
								<h3 class="text-sm font-medium text-gray-900 dark:text-white">
									{request.agent?.name || 'Не указан'}
								</h3>
								<span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium {typeInfo.color}">
									{typeInfo.label}
								</span>
							</div>
							{#if request.agent?.email}
								<p class="text-xs text-gray-500 dark:text-gray-400">{request.agent.email}</p>
							{/if}
						</div>
						<div class="ml-3 flex items-center gap-1.5">
							<span
								class="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200"
							>
								№ {index + 1}
							</span>
							<button
								type="button"
								onclick={() => openViewModal(request)}
								class="inline-flex items-center rounded-md bg-indigo-50 p-1.5 text-indigo-600 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50"
								title="Просмотр"
								aria-label="Просмотреть заявку"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
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
							<button
								type="button"
								onclick={() => openEditModal(request)}
								class="inline-flex items-center rounded-md bg-blue-50 p-1.5 text-blue-600 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
								title="Редактировать"
								aria-label="Редактировать заявку"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
									/>
								</svg>
							</button>
							<button
								type="button"
								onclick={() => openDeleteModal(request)}
								class="inline-flex items-center rounded-md bg-red-50 p-1.5 text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
								title="Удалить"
								aria-label="Удалить заявку"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
									/>
								</svg>
							</button>
						</div>
					</div>

					<!-- Details Grid -->
					<dl class="mb-4 grid grid-cols-2 gap-3">
						<div>
							<dt
								class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
							>
								Сумма
							</dt>
							<dd class="mt-1 text-base font-semibold text-green-600 dark:text-green-400">
								{formatCurrency(request.amount)}
							</dd>
						</div>
						<div>
							<dt
								class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
							>
								Способ
							</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">
								{methodInfo.name}
							</dd>
						</div>
						<div class="col-span-2">
							<dt
								class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
							>
								Реквизиты
							</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">
								{getPaymentDetails(request)}
							</dd>
						</div>
						<div>
							<dt
								class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
							>
								Дата заявки
							</dt>
							<dd class="mt-1 text-sm text-gray-500 dark:text-gray-400">
								{formatDate(request.created_at)}
							</dd>
						</div>
						<div>
							<dt
								class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
							>
								Дата выплаты
							</dt>
							<dd class="mt-1 text-sm text-gray-500 dark:text-gray-400">
								{formatDate(request.payment_date)}
							</dd>
						</div>
						<div class="col-span-2">
							<dt
								class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
							>
								Статус
							</dt>
							<dd class="mt-1">
								<PaymentStatusBadge
									{request}
									{statuses}
									onStatusChange={(result) => {
										if (onStatusChange) {
											onStatusChange(request.id, result);
										}
									}}
								/>
							</dd>
						</div>
					</dl>
				</div>
			{/each}
		</div>
	{/if}
</div>
