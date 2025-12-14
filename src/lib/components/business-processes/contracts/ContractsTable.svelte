<script>
	import ContractActionButtons from './ContractActionButtons.svelte';
	import PartnerPaymentStatusBadge from './PartnerPaymentStatusBadge.svelte';
	import ContractStatusBadge from './ContractStatusBadge.svelte';
	import EmptyState from '$lib/components/common/EmptyState.svelte';

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

	// Format date helper function
	function formatDate(dateString) {
		if (!dateString) return 'Не указана';
		return new Date(dateString).toLocaleDateString('ru-RU', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	// Format percentage
	function formatPercentage(value) {
		if (value === null || value === undefined) return '—';
		return `${parseFloat(value).toFixed(2)}%`;
	}

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
		<thead class="bg-gray-50 dark:bg-gray-800">
			<tr>
				<th
					scope="col"
					class="px-6 py-3 text-left text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
				>
					№
				</th>
				<th
					scope="col"
					class="px-6 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
				>
					Договор
				</th>
				<th
					scope="col"
					class="px-6 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
				>
					Проект
				</th>
				<th
					scope="col"
					class="px-6 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
				>
					Компания
				</th>
				<th
					scope="col"
					class="px-6 py-3 text-right text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
				>
					Сумма
				</th>
				<th
					scope="col"
					class="px-6 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
				>
					Дата Договора
				</th>
				<th
					scope="col"
					class="px-6 py-3 text-center text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
				>
					Статус
				</th>
				<th
					scope="col"
					class="px-6 py-3 text-right text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
				>
					Действия
				</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-950">
			{#if contracts.length === 0}
				<tr>
					<td colspan="8" class="px-4 py-12 text-center">
						<EmptyState
							title={hasSearched ? 'Договора не найдены' : 'Нет договоров'}
							description={hasSearched
								? `По запросу "${searchTerm}" договора не найдены. Попробуйте изменить критерии поиска.`
								: 'Начните с добавления первого договора.'}
						/>
					</td>
				</tr>
			{:else}
				{#each contracts as contract, index (contract?.id || index + '-' + updateCounter)}
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
							{#if contract.project?.region}
								<div class="text-xs text-gray-500 dark:text-gray-400">
									{contract.project.region}
								</div>
							{/if}
						</td>
						<td class="px-6 py-5 text-sm">
							<div class="font-medium text-gray-900 dark:text-gray-100">
								{contract.company?.name || 'Не указана'}
							</div>
						</td>
						<td class="px-6 py-5 text-right text-sm font-semibold whitespace-nowrap text-gray-900 dark:text-gray-100">
							{formatCurrency(contract.contract_amount)}
						</td>
						<td class="px-6 py-5 text-sm whitespace-nowrap text-gray-900 dark:text-gray-100">
							{formatDate(contract.contract_date)}
						</td>
						<td class="px-6 py-5 text-center text-sm whitespace-nowrap">
							<ContractStatusBadge
								{contract}
								{contractStatuses}
								onStatusChange={(result) => onContractStatusChange && onContractStatusChange(contract.id, result)}
							/>
						</td>
						<td class="px-6 py-5 text-right text-sm whitespace-nowrap">
							<ContractActionButtons
								onView={() => onViewContract(contract)}
								onEdit={() => onEditContract(contract)}
								onDelete={() => onDeleteContract(contract)}
								{isLoading}
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
	{#if contracts.length === 0}
		<div class="px-4 py-6">
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
								Дата Договора
							</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">
								{formatDate(contract.contract_date)}
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
							<dd class="mt-1 text-base font-semibold text-gray-900 dark:text-white">
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
						<button
							type="button"
							onclick={() => onViewContract(contract)}
							class="inline-flex min-h-[44px] items-center justify-center rounded-md bg-gray-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-gray-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
							aria-label="Просмотреть контракт"
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
						<button
							type="button"
							onclick={() => onEditContract(contract)}
							class="inline-flex min-h-[44px] items-center justify-center rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
							aria-label="Редактировать контракт"
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
						<button
							type="button"
							onclick={() => onDeleteContract(contract)}
							disabled={isLoading}
							class="inline-flex min-h-[44px] items-center justify-center rounded-md bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50"
							aria-label="Удалить контракт"
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
