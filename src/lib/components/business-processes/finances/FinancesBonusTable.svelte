<script>
	import BonusPaymentStatusIndicator from './BonusPaymentStatusIndicator.svelte';
	import PartnerPaymentStatusIndicator from './PartnerPaymentStatusIndicator.svelte';
	import EmptyState from '$lib/components/common/EmptyState.svelte';
	import DateIndicator from '$lib/components/common/DateIndicator.svelte';

	let {
		bonuses = [],
		bonusStatuses = [],
		partnerPaymentStatuses = [],
		isLoading = false,
		onStatusChange = null,
		onPartnerPaymentStatusChange = null,
		sourceType = 'all',
		searchTerm = '',
		sortField = 'accrued_at',
		sortDirection = 'desc'
	} = $props();

	// Get source entity (contract or order) for partner payment status
	function getSourceEntity(bonus) {
		if (bonus.source_type === 'contract') {
			return bonus.contract;
		}
		return bonus.order;
	}

	// Check if project is incognito
	function isProjectIncognito(bonus) {
		const sourceEntity = getSourceEntity(bonus);
		return sourceEntity?.project?.is_incognito === true;
	}

	// Проверяет, нужно ли показывать дату начисления для договора
	function shouldShowAccruedDate(bonus) {
		// Для заказов всегда показываем дату
		if (bonus.source_type === 'order') {
			return true;
		}

		// Для договоров показываем только если договор активен И статус: Заключён, Выполнен, Рекламация
		if (bonus.source_type === 'contract') {
			const contract = bonus.contract;
			const isActive = contract?.is_active === true;
			const contractStatus = contract?.status?.slug;
			const allowedStatuses = ['signed', 'completed', 'claim'];

			return isActive && allowedStatuses.includes(contractStatus);
		}

		return true;
	}

	// Проверяет, нужно ли показывать размер бонуса
	function shouldShowBonusAmount(bonus) {
		// Для заказов - показываем всегда
		if (bonus.source_type === 'order') {
			return true;
		}

		// Для договоров - показываем при статусах "signed" (Заключён) или "completed" (Выполнен)
		if (bonus.source_type === 'contract') {
			const contractStatus = bonus.contract?.status?.slug;
			return contractStatus === 'signed' || contractStatus === 'completed';
		}

		return false;
	}

	function formatCurrency(amount) {
		if (amount === null || amount === undefined) return '—';
		return new Intl.NumberFormat('ru-RU', {
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	function getSourceNumber(bonus) {
		if (bonus.source_type === 'contract') {
			return bonus.contract?.contract_number || bonus.contract_number || '—';
		}
		return bonus.order?.order_number || bonus.order_number || '—';
	}

	function getSourceAmount(bonus) {
		if (bonus.source_type === 'contract') {
			return bonus.contract?.contract_amount;
		}
		return bonus.order?.order_amount;
	}

	// Get recipient type badge color
	function getRecipientTypeBadgeClass(recipientType) {
		switch (recipientType) {
			case 'agent':
				return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
			case 'curator':
				return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
			case 'referrer':
				return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
			default:
				return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
		}
	}

	const tableId = `finances-table-${Math.random().toString(36).substr(2, 9)}`;
</script>

<div
	class="hidden w-full overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:block md:rounded-lg"
>
	<table id={tableId} class="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
		<thead class="bg-gray-100 dark:bg-gray-900">
			<tr>
				<th
					scope="col"
					class="whitespace-nowrap px-3 py-4 text-left text-sm font-medium tracking-wide text-gray-500 dark:text-gray-400"
				>
					№
				</th>
				<th
					scope="col"
					class="px-3 py-4 text-left text-sm font-medium tracking-wide text-gray-500 dark:text-gray-400"
				>
					{sourceType === 'contract' ? 'Договор' : sourceType === 'order' ? 'Заказ' : 'Источник'}
				</th>
				<th
					scope="col"
					class="px-3 py-4 text-left text-sm font-medium tracking-wide text-gray-500 dark:text-gray-400"
				>
					Проект
				</th>
				<th
					scope="col"
					class="px-3 py-4 text-left text-sm font-medium tracking-wide text-gray-500 dark:text-gray-400"
				>
					Получатель
				</th>
				<th
					scope="col"
					class="whitespace-nowrap px-3 py-4 text-center text-sm font-medium tracking-wide text-gray-500 dark:text-gray-400"
				>
					Тип
				</th>
				<th
					scope="col"
					class="whitespace-nowrap px-3 py-4 text-center text-sm font-medium tracking-wide text-gray-500 dark:text-gray-400"
				>
					Бонус
				</th>
				<th
					scope="col"
					class="whitespace-nowrap px-1 py-4 text-center text-sm font-medium tracking-wide text-gray-500 dark:text-gray-400"
				>
					Начислено
				</th>
				<th
					scope="col"
					class="whitespace-nowrap px-1 py-4 text-center text-sm font-medium tracking-wide text-gray-500 dark:text-gray-400"
				>
					Оплачено
				</th>
				<th
					scope="col"
					class="whitespace-nowrap px-1 py-4 text-center text-sm font-medium tracking-wide text-gray-500 dark:text-gray-400"
				>
					Погашено
				</th>
				<th
					scope="col"
					class="whitespace-nowrap px-3 py-4 text-center text-sm font-medium tracking-wide text-gray-500 dark:text-gray-400"
				>
					Инкогнито
				</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-950">
			{#if bonuses.length === 0}
				<tr>
					<td colspan="10" class="px-3 py-12 text-center">
						<EmptyState
							title={searchTerm ? 'Записи не найдены' : 'Нет данных'}
							description={searchTerm
								? `По запросу "${searchTerm}" записи не найдены.`
								: 'Данные о бонусах отсутствуют.'}
						/>
					</td>
				</tr>
			{:else}
				{#each bonuses as bonus, index (bonus.id)}
					{@const sourceEntity = getSourceEntity(bonus)}
					{@const recipient = bonus.user || bonus.agent}
					<tr>
						<td class="whitespace-nowrap px-3 py-3 text-sm text-gray-900 dark:text-gray-100">
							{index + 1}
						</td>
						<td class="px-3 py-3 text-sm text-gray-900 dark:text-gray-100">
							<div class="font-medium">{getSourceNumber(bonus)}</div>
						</td>
						<td class="px-3 py-3 text-sm text-gray-900 dark:text-gray-100">
							{bonus.project_name || '—'}
						</td>
						<td class="px-3 py-3 text-sm text-gray-900 dark:text-gray-100">
							<div
								title={recipient?.phones && recipient.phones.length > 0
									? `Телефон: ${recipient.phones[0].value}`
									: ''}
							>
								<div class="font-medium">{recipient?.name || '—'}</div>
								<div class="text-xs text-gray-500 dark:text-gray-400">
									{recipient?.email || ''}
								</div>
							</div>
						</td>
						<td class="whitespace-nowrap px-3 py-3 text-center text-sm">
							<span
								class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium {getRecipientTypeBadgeClass(bonus.recipient_type)}"
							>
								{bonus.recipient_type_label || bonus.recipient_type || '—'}
							</span>
							{#if bonus.recipient_type === 'referrer' && bonus.referralUser}
								<div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
									от {bonus.referralUser.name || 'N/A'}
								</div>
							{/if}
						</td>
						<td
							class="whitespace-nowrap px-3 py-3 text-center text-sm font-semibold text-gray-900 dark:text-gray-100"
						>
							{#if shouldShowBonusAmount(bonus)}
								{formatCurrency(bonus.commission_amount)}
								{#if bonus.percentage}
									<div class="text-xs font-normal text-gray-500 dark:text-gray-400">
										{bonus.percentage}%
									</div>
								{/if}
							{:else}
								—
							{/if}
						</td>
						<td class="whitespace-nowrap px-1 py-3 text-center text-sm">
							{#if shouldShowAccruedDate(bonus)}
								<DateIndicator date={bonus.accrued_at} />
							{:else}
								<DateIndicator date={null} />
							{/if}
						</td>
						<td class="whitespace-nowrap px-1 py-3 text-center text-sm">
							<PartnerPaymentStatusIndicator
								{sourceEntity}
								sourceType={bonus.source_type}
								{partnerPaymentStatuses}
								onStatusChange={(result) =>
									onPartnerPaymentStatusChange && onPartnerPaymentStatusChange(bonus, result)}
							/>
						</td>
						<td class="whitespace-nowrap px-1 py-3 text-center text-sm">
							<BonusPaymentStatusIndicator
								{bonus}
								{bonusStatuses}
								onStatusChange={(result) => onStatusChange && onStatusChange(bonus.id, result)}
							/>
						</td>
						<td class="whitespace-nowrap px-3 py-3 text-center text-sm">
							{#if isProjectIncognito(bonus)}
								<span
									class="inline-flex items-center rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900 dark:text-purple-300"
								>
									Да
								</span>
							{:else}
								<span class="text-gray-400">—</span>
							{/if}
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
		<div class="px-3 py-6">
			<EmptyState
				title={searchTerm ? 'Записи не найдены' : 'Нет данных'}
				description={searchTerm
					? `По запросу "${searchTerm}" записи не найдены.`
					: 'Данные о бонусах отсутствуют.'}
			/>
		</div>
	{:else}
		<div class="space-y-4" role="list">
			{#each bonuses as bonus, index (bonus.id)}
				{@const recipient = bonus.user || bonus.agent}
				<div
					class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
				>
					<div class="mb-3 flex items-start justify-between">
						<div class="min-w-0 flex-1">
							<h3 class="text-sm font-medium text-gray-900 dark:text-white">
								{getSourceNumber(bonus)}
							</h3>
							<p class="text-xs text-gray-500 dark:text-gray-400">
								{bonus.source_type === 'contract' ? 'Договор' : 'Заказ'} • {bonus.project_name ||
									'Без проекта'}
							</p>
						</div>
						<span
							class="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200"
						>
							№ {index + 1}
						</span>
					</div>

					<dl class="mb-3 grid grid-cols-2 gap-2 text-sm">
						<div>
							<dt class="text-xs text-gray-500 dark:text-gray-400">Получатель</dt>
							<dd class="font-medium text-gray-900 dark:text-white">{recipient?.name || '—'}</dd>
						</div>
						<div>
							<dt class="text-xs text-gray-500 dark:text-gray-400">Тип</dt>
							<dd>
								<span
									class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium {getRecipientTypeBadgeClass(bonus.recipient_type)}"
								>
									{bonus.recipient_type_label || bonus.recipient_type || '—'}
								</span>
							</dd>
						</div>
						<div>
							<dt class="text-xs text-gray-500 dark:text-gray-400">Бонус</dt>
							<dd class="font-semibold text-gray-900 dark:text-white">
								{#if shouldShowBonusAmount(bonus)}
									{formatCurrency(bonus.commission_amount)}
									{#if bonus.percentage}
										<span class="text-xs font-normal text-gray-500">({bonus.percentage}%)</span>
									{/if}
								{:else}
									—
								{/if}
							</dd>
						</div>
						<div>
							<dt class="text-xs text-gray-500 dark:text-gray-400">Начислено</dt>
							<dd>
								{#if shouldShowAccruedDate(bonus)}
									<DateIndicator date={bonus.accrued_at} />
								{:else}
									<DateIndicator date={null} />
								{/if}
							</dd>
						</div>
						<div>
							<dt class="text-xs text-gray-500 dark:text-gray-400">Инкогнито</dt>
							<dd class="font-medium text-gray-900 dark:text-white">
								{#if isProjectIncognito(bonus)}
									<span
										class="inline-flex items-center rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900 dark:text-purple-300"
									>
										Да
									</span>
								{:else}
									—
								{/if}
							</dd>
						</div>
						<div>
							<dt class="text-xs text-gray-500 dark:text-gray-400">Статус выплаты</dt>
							<dd>
								<BonusPaymentStatusIndicator
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
