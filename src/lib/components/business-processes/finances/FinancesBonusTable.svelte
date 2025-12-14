<script>
	import BonusPaymentStatusBadge from './BonusPaymentStatusBadge.svelte';
	import EmptyState from '$lib/components/common/EmptyState.svelte';

	let {
		bonuses = [],
		bonusStatuses = [],
		isLoading = false,
		onStatusChange = null,
		sourceType = 'all',
		searchTerm = '',
		sortField = 'accrued_at',
		sortDirection = 'desc'
	} = $props();

	function formatDate(dateString) {
		if (!dateString) return '—';
		return new Date(dateString).toLocaleDateString('ru-RU', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function formatCurrency(amount) {
		if (amount === null || amount === undefined) return '—';
		return new Intl.NumberFormat('ru-RU', {
			style: 'currency',
			currency: 'RUB',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	function getSourceNumber(bonus) {
		if (bonus.source_type === 'contract') {
			return bonus.contract?.contract_number || '—';
		}
		return bonus.order?.order_number || '—';
	}

	function getSourceAmount(bonus) {
		if (bonus.source_type === 'contract') {
			return bonus.contract?.contract_amount;
		}
		return bonus.order?.order_amount;
	}

	const tableId = `finances-table-${Math.random().toString(36).substr(2, 9)}`;
</script>

<div class="ring-opacity-5 hidden w-full overflow-x-auto shadow ring-1 ring-black md:block md:rounded-lg">
	<table id={tableId} class="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
		<thead class="bg-gray-50 dark:bg-gray-800">
			<tr>
				<th scope="col" class="px-4 py-3 text-left text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400">
					№
				</th>
				<th scope="col" class="px-4 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
					{sourceType === 'contract' ? 'Договор' : sourceType === 'order' ? 'Заказ' : 'Источник'}
				</th>
				<th scope="col" class="px-4 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
					Проект
				</th>
				<th scope="col" class="px-4 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
					Агент
				</th>
				<th scope="col" class="px-4 py-3 text-right text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400">
					Сумма источника
				</th>
				<th scope="col" class="px-4 py-3 text-right text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400">
					Бонус
				</th>
				<th scope="col" class="px-4 py-3 text-center text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400">
					Начислено
				</th>
				<th scope="col" class="px-4 py-3 text-center text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400">
					Доступно
				</th>
				<th scope="col" class="px-4 py-3 text-center text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400">
					Выплачено
				</th>
				<th scope="col" class="px-4 py-3 text-center text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400">
					Статус
				</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-950">
			{#if bonuses.length === 0}
				<tr>
					<td colspan="10" class="px-4 py-12 text-center">
						<EmptyState
							title={searchTerm ? 'Записи не найдены' : 'Нет данных'}
							description={searchTerm ? `По запросу "${searchTerm}" записи не найдены.` : 'Данные о бонусах отсутствуют.'}
						/>
					</td>
				</tr>
			{:else}
				{#each bonuses as bonus, index (bonus.id)}
					<tr class="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
						<td class="px-4 py-4 text-sm whitespace-nowrap text-gray-900 dark:text-gray-100">
							{index + 1}
						</td>
						<td class="px-4 py-4 text-sm text-gray-900 dark:text-gray-100">
							<div class="font-medium">{getSourceNumber(bonus)}</div>
							<div class="text-xs text-gray-500 dark:text-gray-400">
								{bonus.source_type === 'contract' ? 'Договор' : 'Заказ'}
							</div>
						</td>
						<td class="px-4 py-4 text-sm text-gray-900 dark:text-gray-100">
							{bonus.project_name || '—'}
						</td>
						<td class="px-4 py-4 text-sm text-gray-900 dark:text-gray-100">
							<div class="font-medium">{bonus.agent?.name || '—'}</div>
							{#if bonus.agent?.email}
								<div class="text-xs text-gray-500 dark:text-gray-400">{bonus.agent.email}</div>
							{/if}
						</td>
						<td class="px-4 py-4 text-right text-sm whitespace-nowrap text-gray-900 dark:text-gray-100">
							{formatCurrency(getSourceAmount(bonus))}
						</td>
						<td class="px-4 py-4 text-right text-sm font-semibold whitespace-nowrap text-gray-900 dark:text-gray-100">
							{formatCurrency(bonus.commission_amount)}
						</td>
						<td class="px-4 py-4 text-center text-sm whitespace-nowrap text-gray-900 dark:text-gray-100">
							{formatDate(bonus.accrued_at)}
						</td>
						<td class="px-4 py-4 text-center text-sm whitespace-nowrap text-gray-900 dark:text-gray-100">
							{formatDate(bonus.available_at)}
						</td>
						<td class="px-4 py-4 text-center text-sm whitespace-nowrap text-gray-900 dark:text-gray-100">
							{formatDate(bonus.paid_at)}
						</td>
						<td class="px-4 py-4 text-center text-sm whitespace-nowrap">
							<BonusPaymentStatusBadge
								{bonus}
								{bonusStatuses}
								onStatusChange={(result) => onStatusChange && onStatusChange(bonus.id, result)}
							/>
						</td>
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</div>

<!-- Mobile Card View -->
<div class="md:hidden">
	{#if bonuses.length === 0}
		<div class="px-4 py-6">
			<EmptyState
				title={searchTerm ? 'Записи не найдены' : 'Нет данных'}
				description={searchTerm ? `По запросу "${searchTerm}" записи не найдены.` : 'Данные о бонусах отсутствуют.'}
			/>
		</div>
	{:else}
		<div class="space-y-4" role="list">
			{#each bonuses as bonus, index (bonus.id)}
				<div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
					<div class="mb-3 flex items-start justify-between">
						<div class="min-w-0 flex-1">
							<h3 class="text-sm font-medium text-gray-900 dark:text-white">
								{getSourceNumber(bonus)}
							</h3>
							<p class="text-xs text-gray-500 dark:text-gray-400">
								{bonus.source_type === 'contract' ? 'Договор' : 'Заказ'} • {bonus.project_name || 'Без проекта'}
							</p>
						</div>
						<span class="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200">
							№ {index + 1}
						</span>
					</div>

					<dl class="mb-3 grid grid-cols-2 gap-2 text-sm">
						<div>
							<dt class="text-xs text-gray-500 dark:text-gray-400">Агент</dt>
							<dd class="font-medium text-gray-900 dark:text-white">{bonus.agent?.name || '—'}</dd>
						</div>
						<div>
							<dt class="text-xs text-gray-500 dark:text-gray-400">Бонус</dt>
							<dd class="font-semibold text-gray-900 dark:text-white">{formatCurrency(bonus.commission_amount)}</dd>
						</div>
						<div>
							<dt class="text-xs text-gray-500 dark:text-gray-400">Начислено</dt>
							<dd class="text-gray-900 dark:text-white">{formatDate(bonus.accrued_at)}</dd>
						</div>
						<div>
							<dt class="text-xs text-gray-500 dark:text-gray-400">Доступно</dt>
							<dd class="text-gray-900 dark:text-white">{formatDate(bonus.available_at)}</dd>
						</div>
						<div>
							<dt class="text-xs text-gray-500 dark:text-gray-400">Выплачено</dt>
							<dd class="text-gray-900 dark:text-white">{formatDate(bonus.paid_at)}</dd>
						</div>
						<div>
							<dt class="text-xs text-gray-500 dark:text-gray-400">Статус</dt>
							<dd>
								<BonusPaymentStatusBadge
									{bonus}
									{bonusStatuses}
									onStatusChange={(result) => onStatusChange && onStatusChange(bonus.id, result)}
								/>
							</dd>
						</div>
					</dl>
				</div>
			{/each}
		</div>
	{/if}
</div>
