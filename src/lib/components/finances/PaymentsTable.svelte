<script>
	/**
	 * Таблица заявок на выплату бонусов
	 * Feature: bonus-payments
	 * Requirements: 6.2, 6.3, 6.4, 6.9
	 */
	import EmptyState from '$lib/components/common/EmptyState.svelte';
	import PaymentStatusBadge from './PaymentStatusBadge.svelte';

	let {
		requests = [],
		isLoading = false,
		statuses = [],
		onStatusChange = null,
		updateCounter = 0,
		searchTerm = '',
		hasSearched = false
	} = $props();

	// Format currency
	function formatCurrency(amount) {
		if (amount === null || amount === undefined) return '—';
		return (
			new Intl.NumberFormat('ru-RU', {
				minimumFractionDigits: 0,
				maximumFractionDigits: 0
			}).format(amount) + ' ₽'
		);
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

	// Generate unique table ID for accessibility
	const tableId = `payments-table-${Math.random().toString(36).substr(2, 9)}`;
</script>

<!-- Desktop Table View -->
<div
	class="hidden w-full overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:block md:rounded-lg"
>
	<table
		id={tableId}
		class="w-full table-auto divide-y divide-gray-300 dark:divide-gray-700"
		style="min-width: 1200px;"
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
					АГЕНТ
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
					class="px-3 py-4 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
					style="min-width: 200px;"
				>
					КОММЕНТАРИЙ
				</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-950">
			{#if requests.length === 0}
				<tr>
					<td colspan="9" class="px-3 py-8" role="cell">
						<EmptyState
							type={hasSearched ? 'no-results' : 'no-data'}
							searchTerm={hasSearched ? searchTerm : ''}
						/>
					</td>
				</tr>
			{:else}
				{#each requests as request, index (request.id + '-' + updateCounter)}
					{@const methodInfo = getPaymentMethodInfo(request.payment_method)}
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
						<td
							class="whitespace-nowrap px-3 py-3 text-right align-middle text-sm font-semibold text-green-600 dark:text-green-400"
						>
							{formatCurrency(request.amount)}
						</td>
						<td class="whitespace-nowrap px-3 py-3 text-center align-middle text-sm">
							<span class="inline-flex items-center gap-1">
								<span>{methodInfo.icon}</span>
								<span class="text-gray-700 dark:text-gray-300">{methodInfo.name}</span>
							</span>
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
						<td class="px-3 py-3 align-middle text-sm text-gray-500 dark:text-gray-400">
							<div class="max-w-[200px] truncate" title={request.comment || ''}>
								{request.comment || '—'}
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
				<div
					class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
					role="listitem"
				>
					<!-- Header -->
					<div class="mb-3 flex items-start justify-between">
						<div class="min-w-0 flex-1">
							<h3 class="text-sm font-medium text-gray-900 dark:text-white">
								{request.agent?.name || 'Агент не указан'}
							</h3>
							{#if request.agent?.email}
								<p class="text-xs text-gray-500 dark:text-gray-400">{request.agent.email}</p>
							{/if}
						</div>
						<div class="ml-3 flex-shrink-0">
							<span
								class="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200"
							>
								№ {index + 1}
							</span>
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
								{methodInfo.icon}
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
						{#if request.comment}
							<div class="col-span-2">
								<dt
									class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
								>
									Комментарий
								</dt>
								<dd class="mt-1 text-sm text-gray-500 dark:text-gray-400">
									{request.comment}
								</dd>
							</div>
						{/if}
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
