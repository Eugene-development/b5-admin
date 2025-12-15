<script>
	import EmptyState from '$lib/components/common/EmptyState.svelte';

	let {
		payments = [],
		isLoading = false,
		onViewPayment = null,
		onUpdateStatus = null,
		paymentStatuses = [],
		searchTerm = '',
		hasSearched = false
	} = $props();

	// Format currency
	function formatCurrency(amount) {
		if (amount === null || amount === undefined) return '—';
		return new Intl.NumberFormat('ru-RU', {
			style: 'currency',
			currency: 'RUB',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	// Format date
	function formatDate(dateString) {
		if (!dateString) return '—';
		return new Date(dateString).toLocaleDateString('ru-RU', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	// Get status color
	function getStatusColor(code) {
		switch (code) {
			case 'completed':
				return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
			case 'failed':
				return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
			case 'pending':
			default:
				return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
		}
	}

	// Get method name
	function getMethodName(method) {
		if (!method) return '—';
		return method.name || method.code || '—';
	}
</script>

<!-- Desktop Table View -->
<div class="ring-opacity-5 hidden w-full overflow-x-auto shadow ring-1 ring-black md:block md:rounded-lg">
	<table class="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
		<thead class="bg-gray-50 dark:bg-gray-800">
			<tr>
				<th scope="col" class="px-6 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
					Дата
				</th>
				<th scope="col" class="px-6 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
					Агент
				</th>
				<th scope="col" class="px-6 py-3 text-right text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
					Сумма
				</th>
				<th scope="col" class="px-6 py-3 text-center text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
					Статус
				</th>
				<th scope="col" class="px-6 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
					Способ
				</th>
				<th scope="col" class="px-6 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
					Номер документа
				</th>
				<th scope="col" class="px-6 py-3 text-right text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
					<span class="sr-only">Действия</span>
				</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-950">
			{#if payments.length === 0}
				<tr>
					<td colspan="7" class="px-4 py-12 text-center">
						<EmptyState
							title={hasSearched ? 'Выплаты не найдены' : 'Нет выплат'}
							description={hasSearched
								? `По запросу "${searchTerm}" выплаты не найдены.`
								: 'Выплаты ещё не создавались.'}
						/>
					</td>
				</tr>
			{:else}
				{#each payments as payment (payment.id)}
					<tr class="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
						<td class="px-6 py-5 text-sm whitespace-nowrap text-gray-900 dark:text-gray-100">
							{formatDate(payment.payment_date)}
						</td>
						<td class="px-6 py-5 text-sm text-gray-900 dark:text-gray-100">
							<div class="font-medium">{payment.agent?.name || '—'}</div>
							<div class="text-xs text-gray-500 dark:text-gray-400">{payment.agent?.email || ''}</div>
						</td>
						<td class="px-6 py-5 text-right text-sm font-semibold whitespace-nowrap text-gray-900 dark:text-gray-100">
							{formatCurrency(payment.total_amount)}
						</td>
						<td class="px-6 py-5 text-center text-sm whitespace-nowrap">
							<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {getStatusColor(payment.status?.code)}">
								{payment.status?.name || '—'}
							</span>
						</td>
						<td class="px-6 py-5 text-sm whitespace-nowrap text-gray-900 dark:text-gray-100">
							{getMethodName(payment.method)}
						</td>
						<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-900 dark:text-gray-100">
							{payment.reference_number || '—'}
						</td>
						<td class="px-6 py-4 text-right text-sm whitespace-nowrap">
							<div class="flex items-center justify-end space-x-2">
								<button
									type="button"
									onclick={() => onViewPayment && onViewPayment(payment)}
									class="inline-flex items-center rounded-md bg-gray-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-gray-500"
								>
									<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
									</svg>
								</button>
								{#if payment.status?.code === 'pending'}
									<button
										type="button"
										onclick={() => onUpdateStatus && onUpdateStatus(payment, 'completed')}
										disabled={isLoading}
										class="inline-flex items-center rounded-md bg-green-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-50"
										title="Завершить выплату"
									>
										<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
										</svg>
									</button>
									<button
										type="button"
										onclick={() => onUpdateStatus && onUpdateStatus(payment, 'failed')}
										disabled={isLoading}
										class="inline-flex items-center rounded-md bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50"
										title="Отметить как ошибку"
									>
										<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
										</svg>
									</button>
								{/if}
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
	{#if payments.length === 0}
		<div class="px-4 py-6">
			<EmptyState
				title={hasSearched ? 'Выплаты не найдены' : 'Нет выплат'}
				description={hasSearched
					? `По запросу "${searchTerm}" выплаты не найдены.`
					: 'Выплаты ещё не создавались.'}
			/>
		</div>
	{:else}
		<div class="space-y-4">
			{#each payments as payment (payment.id)}
				<div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
					<div class="mb-3 flex items-start justify-between">
						<div>
							<div class="font-medium text-gray-900 dark:text-white">{payment.agent?.name || '—'}</div>
							<div class="text-sm text-gray-500 dark:text-gray-400">{formatDate(payment.payment_date)}</div>
						</div>
						<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {getStatusColor(payment.status?.code)}">
							{payment.status?.name || '—'}
						</span>
					</div>
					<dl class="grid grid-cols-2 gap-3 mb-4">
						<div>
							<dt class="text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Сумма</dt>
							<dd class="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{formatCurrency(payment.total_amount)}</dd>
						</div>
						<div>
							<dt class="text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Способ</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">{getMethodName(payment.method)}</dd>
						</div>
					</dl>
					<div class="flex items-center justify-end space-x-2 border-t border-gray-200 pt-3 dark:border-gray-600">
						<button
							type="button"
							onclick={() => onViewPayment && onViewPayment(payment)}
							class="inline-flex items-center rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500"
						>
							Подробнее
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
