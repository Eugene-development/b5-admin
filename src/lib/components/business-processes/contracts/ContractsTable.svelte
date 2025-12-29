<script>
	import ContractActionButtons from './ContractActionButtons.svelte';
	import PartnerPaymentStatusBadge from './PartnerPaymentStatusBadge.svelte';
	import ContractStatusBadge from './ContractStatusBadge.svelte';
	import EmptyState from '$lib/components/common/EmptyState.svelte';
	import DateBadge from '$lib/components/common/DateBadge.svelte';
	import { ActionButton, MobileActionButton } from '$lib';

	let {
		contracts = [],
		isLoading = false,
		onEditContract,
		onDeleteContract,
		onViewContract,
		onPartnerPaymentStatusChange = null,
		onContractStatusChange = null,
		partnerPaymentStatuses = [],
		contractStatuses = [],
		updateCounter = 0,
		searchTerm = '',
		hasSearched = false
	} = $props();

	// Sorting state
	let sortColumn = $state(null);
	let sortDirection = $state('asc'); // 'asc' or 'desc'

	// Handle column sort
	function handleSort(column) {
		if (sortColumn === column) {
			// Toggle direction if same column
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			// New column, default to ascending
			sortColumn = column;
			sortDirection = 'asc';
		}
	}

	// Get sorted contracts
	let sortedContracts = $derived.by(() => {
		if (!sortColumn) return contracts;

		const sorted = [...contracts].sort((a, b) => {
			let aVal, bVal;

			if (sortColumn === 'status') {
				aVal = a.status?.value || '';
				bVal = b.status?.value || '';
			} else if (sortColumn === 'company') {
				aVal = a.company?.name || '';
				bVal = b.company?.name || '';
			} else {
				return 0;
			}

			// String comparison
			const comparison = aVal.localeCompare(bVal, 'ru');
			return sortDirection === 'asc' ? comparison : -comparison;
		});

		return sorted;
	});



	// Format percentage
	function formatPercentage(value) {
		if (value === null || value === undefined) return '—';
		return `${parseFloat(value).toFixed(2)}%`;
	}

	// Format currency
	function formatCurrency(amount) {
		if (amount === null || amount === undefined) return '—';
		return new Intl.NumberFormat('ru-RU', {
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	// Generate unique table ID for accessibility
	const tableId = `contracts-table-${Math.random().toString(36).substr(2, 9)}`;
	const tableCaptionId = `${tableId}-caption`;
	const tableDescriptionId = `${tableId}-description`;

	// Announce table updates to screen readers
	function announceTableUpdate() {
		const message =
			contracts.length === 0
				? hasSearched
					? `Договора не найдены по запросу "${searchTerm}"`
					: 'Нет доступных договоров'
				: `${contracts.length} контракт${contracts.length === 1 ? '' : contracts.length < 5 ? 'а' : 'ов'} ${hasSearched ? `найдено по запросу "${searchTerm}"` : 'отображено'}`;

		const announcement = document.getElementById(`${tableId}-announcements`);
		if (announcement) {
			announcement.textContent = message;
			setTimeout(() => {
				announcement.textContent = '';
			}, 1000);
		}
	}

	// Announce updates when contracts change
	$effect(() => {
		if (contracts) {
			setTimeout(announceTableUpdate, 100);
		}
	});
</script>

<!-- Live region for screen reader announcements -->
<div id="{tableId}-announcements" class="sr-only" aria-live="polite" aria-atomic="true"></div>

<!-- Desktop Table View -->
<div
	class="ring-opacity-5 hidden w-full overflow-x-auto shadow ring-1 ring-black md:block md:rounded-lg"
>
	<table
		id={tableId}
		class="min-w-full divide-y divide-gray-300 dark:divide-gray-700"
		aria-labelledby={tableCaptionId}
		aria-describedby={tableDescriptionId}
	>
		<caption id={tableCaptionId} class="sr-only">
			Таблица управления контрактами с {contracts.length} контракт{contracts.length === 1
				? 'ом'
				: 'ами'}
			{hasSearched ? ` по поиску "${searchTerm}"` : ''}
		</caption>
		<thead class="bg-gray-100 dark:bg-gray-900">
			<tr>
				<th
					scope="col"
					class="px-6 py-4 text-left text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
				>
					№
				</th>
				<th
					scope="col"
					class="px-6 py-4 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
				>
					Договор
				</th>
				<th
					scope="col"
					class="px-6 py-4 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
				>
					Проект
				</th>
				<th
					scope="col"
					class="px-6 py-4 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
					onclick={() => handleSort('company')}
					role="button"
					tabindex="0"
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							handleSort('company');
						}
					}}
				>
					Фабрика
					{#if sortColumn === 'company'}
						<span class="ml-1">
							{sortDirection === 'asc' ? '↑' : '↓'}
						</span>
					{/if}
				</th>
				<th
					scope="col"
					class="px-6 py-4 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
				>
					Дата
				</th>
				<th
					scope="col"
					class="px-6 py-4 text-right text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
				>
					Сумма
				</th>
				<th
					scope="col"
					class="px-6 py-4 text-center text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
					style="min-width: 180px; width: 180px;"
					onclick={() => handleSort('status')}
					role="button"
					tabindex="0"
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							handleSort('status');
						}
					}}
				>
					Статус
					{#if sortColumn === 'status'}
						<span class="ml-1">
							{sortDirection === 'asc' ? '↑' : '↓'}
						</span>
					{/if}
				</th>
				<th
					scope="col"
					class="px-6 py-4 text-right text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
				>
					<span class="sr-only">Действия</span>
				</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-950">
			{#if contracts.length === 0}
				<tr>
					<td colspan="8" class="px-3 py-12 text-center">
						<EmptyState
							title={hasSearched ? 'Договора не найдены' : 'Нет договоров'}
							description={hasSearched
								? `По запросу "${searchTerm}" договора не найдены. Попробуйте изменить критерии поиска.`
								: 'Начните с добавления первого договора.'}
						/>
					</td>
				</tr>
			{:else}
				{#each sortedContracts as contract, index (contract?.id || index + '-' + updateCounter)}
					<tr
						class="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
						onclick={() => onViewContract(contract)}
						role="button"
						tabindex="0"
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								onViewContract(contract);
							}
						}}
					>
						<td class="px-6 py-5 text-sm whitespace-nowrap text-gray-900 dark:text-gray-100">
							{index + 1}
						</td>
						<td class="px-6 py-5 text-sm text-gray-900 dark:text-gray-100">
							{contract.contract_number || '—'}
						</td>
						<td class="px-6 py-5 text-sm">
							<div class="font-medium text-gray-900 dark:text-gray-100">
								{contract.project?.value || 'Не указан'}
							</div>
						</td>
						<td class="px-6 py-5 text-sm">
							<div class="font-medium text-gray-900 dark:text-gray-100">
								{contract.company?.name || 'Не указана'}
							</div>
						</td>
						<td class="px-6 py-5 text-sm whitespace-nowrap">
							<DateBadge date={contract.contract_date} />
						</td>
						<td class="px-6 py-5 text-right text-sm font-semibold whitespace-nowrap text-violet-600 dark:text-violet-400">
							{formatCurrency(contract.contract_amount)}
						</td>
						<td class="px-6 py-5 text-center text-sm whitespace-nowrap">
							<ContractStatusBadge
								{contract}
								{contractStatuses}
								onStatusChange={(result) => onContractStatusChange && onContractStatusChange(contract.id, result)}
							/>
						</td>
						<td class="px-6 py-5 text-right text-sm whitespace-nowrap">
							<div class="flex items-center justify-end gap-2">
								<ActionButton
									variant="view"
									onclick={() => onViewContract(contract)}
									ariaLabel="Просмотреть договор"
									title="Просмотреть"
								/>
								<ActionButton
									variant="edit"
									onclick={() => onEditContract(contract)}
									ariaLabel="Редактировать договор"
									title="Редактировать"
								/>
								<ActionButton
									variant="delete"
									onclick={() => onDeleteContract(contract)}
									disabled={isLoading}
									isLoading={isLoading}
									ariaLabel="Удалить договор"
									title="Удалить"
								/>
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
	{#if contracts.length === 0}
		<div class="px-3 py-6">
			<EmptyState
				title={hasSearched ? 'Договора не найдены' : 'Нет договоров'}
				description={hasSearched
					? `По запросу "${searchTerm}" договора не найдены. Попробуйте изменить критерии поиска.`
					: 'Начните с добавления первого договора.'}
			/>
		</div>
	{:else}
		<div class="space-y-4" role="list" aria-label="Список контрактов">
			{#each contracts as contract, index (contract?.id || index + '-' + updateCounter)}
				<div
					class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
					role="listitem"
				>
					<!-- Contract Header -->
					<div class="mb-3 flex items-start justify-between">
						<div class="min-w-0 flex-1">
							<h3 class="text-sm font-medium break-words text-gray-900 dark:text-white">
								{contract.contract_number || 'Без номера'}
							</h3>
							<p class="text-sm break-words text-gray-500 dark:text-gray-400">
								{contract.company?.name || 'Компания не указана'}
							</p>
						</div>
						<div class="ml-3 flex-shrink-0">
							<span
								class="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200"
							>
								№ {index + 1}
							</span>
						</div>
					</div>

					<!-- Contract Details Grid -->
					<dl class="mb-4 grid grid-cols-2 gap-3">
						<div>
							<dt
								class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
							>
								Проект
							</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">
								{contract.project?.value || 'Не указан'}
							</dd>
						</div>
						<div>
							<dt
								class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
							>
								Дата
							</dt>
							<dd class="mt-1 text-sm">
								<DateBadge date={contract.contract_date} />
							</dd>
						</div>
						<div>
							<dt
								class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
							>
								Статус
							</dt>
							<dd class="mt-1 text-sm">
								<ContractStatusBadge
									{contract}
									{contractStatuses}
									onStatusChange={(result) => onContractStatusChange && onContractStatusChange(contract.id, result)}
								/>
							</dd>
						</div>
						<div>
							<dt
								class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
							>
								Сумма
							</dt>
							<dd class="mt-1 text-base font-semibold text-violet-600 dark:text-violet-400">
								{formatCurrency(contract.contract_amount)}
							</dd>
						</div>
						{#if contract.project?.region}
							<div class="col-span-2">
								<dt
									class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
								>
									Регион
								</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-white">
									{contract.project.region}
								</dd>
							</div>
						{/if}
						{#if contract.company?.inn}
							<div class="col-span-2">
								<dt
									class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
								>
									ИНН
								</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-white">
									{contract.company.inn}
								</dd>
							</div>
						{/if}
					</dl>

					<!-- Actions -->
					<div
						class="flex items-center justify-end space-x-2 border-t border-gray-200 pt-3 dark:border-gray-600"
					>
						<MobileActionButton
							variant="view"
							onclick={() => onViewContract(contract)}
							ariaLabel="Просмотреть контракт"
							title="Просмотреть"
						/>
						<MobileActionButton
							variant="edit"
							onclick={() => onEditContract(contract)}
							ariaLabel="Редактировать контракт"
							title="Редактировать"
						/>
						<MobileActionButton
							variant="delete"
							onclick={() => onDeleteContract(contract)}
							disabled={isLoading}
							isLoading={isLoading}
							ariaLabel="Удалить контракт"
							title="Удалить"
						/>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
