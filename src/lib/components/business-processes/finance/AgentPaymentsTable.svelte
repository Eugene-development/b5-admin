<script>
	import EmptyState from '$lib/components/common/EmptyState.svelte';
	import DateBadge from '$lib/components/common/DateBadge.svelte';
	import { ActionButton, MobileActionButton } from '$lib';

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
		<thead class="bg-gray-100 dark:bg-gray-900">
			<tr>
				<th scope="col" class="px-6 py-4 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
					Дата
				</th>
				<th scope="col" class="px-6 py-4 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
					Агент
				</th>
				<th scope="col" class="px-6 py-4 text-right text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
					Сумма
				</th>
				<th scope="col" class="px-6 py-4 text-center text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
					Статус
				</th>
				<th scope="col" class="px-6 py-4 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
					Способ
				</th>
				<th scope="col" class="px-6 py-4 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
					Номер документа
				</th>
				<th scope="col" class="px-6 py-4 text-right text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
					<span class="sr-only">Действия</span>
				</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-950">
			{#if payments.length === 0}
				<tr>
					<td colspan="7" class="px-3 py-12 text-center">
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
						<td class="px-6 py-3 text-sm whitespace-nowrap">
							<DateBadge date={payment.payment_date} fallback="—" />
						</td>
						<td class="px-6 py-3 text-sm text-gray-900 dark:text-gray-100">
							<div class="font-medium">{payment.agent?.name || '—'}</div>
							<div class="text-xs text-gray-500 dark:text-gray-400">{payment.agent?.email || ''}</div>
						</td>
						<td class="px-6 py-3 text-right text-sm font-semibold whitespace-nowrap text-gray-900 dark:text-gray-100">
							{formatCurrency(payment.total_amount)}
						</td>
						<td class="px-6 py-3 text-center text-sm whitespace-nowrap">
							<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {getStatusColor(payment.status?.code)}">
								{payment.status?.name || '—'}
							</span>
						</td>
						<td class="px-6 py-3 text-sm whitespace-nowrap text-gray-900 dark:text-gray-100">
							{getMethodName(payment.method)}
						</td>
						<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-900 dark:text-gray-100">
							{payment.reference_number || '—'}
						</td>
						<td class="px-6 py-4 text-right text-sm whitespace-nowrap">
							<div class="flex items-center justify-end space-x-2">
								<ActionButton
									variant="view"
									onclick={() => onViewPayment && onViewPayment(payment)}
									ariaLabel="Просмотреть выплату"
									title="Просмотреть"
								/>
								{#if payment.status?.code === 'pending'}
									<ActionButton
										variant="approve"
										onclick={() => onUpdateStatus && onUpdateStatus(payment, 'completed')}
										disabled={isLoading}
										ariaLabel="Завершить выплату"
										title="Завершить выплату"
									/>
									<ActionButton
										variant="reject"
										onclick={() => onUpdateStatus && onUpdateStatus(payment, 'failed')}
										disabled={isLoading}
										ariaLabel="Отметить как ошибку"
										title="Отметить как ошибку"
									/>
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
		<div class="px-3 py-6">
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
							<div class="text-sm"><DateBadge date={payment.payment_date} fallback="—" /></div>
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
						<MobileActionButton
							variant="view"
							onclick={() => onViewPayment && onViewPayment(payment)}
							ariaLabel="Просмотреть выплату"
							title="Просмотреть"
						/>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
