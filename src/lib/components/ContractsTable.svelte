<script>
	import ContractActionButtons from './ContractActionButtons.svelte';
	import EmptyState from './EmptyState.svelte';

	let {
		contracts = [],
		isLoading = false,
		onEditContract,
		onDeleteContract,
		onViewContract,
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

	// Generate unique table ID for accessibility
	const tableId = `contracts-table-${Math.random().toString(36).substr(2, 9)}`;
	const tableCaptionId = `${tableId}-caption`;
	const tableDescriptionId = `${tableId}-description`;

	// Announce table updates to screen readers
	function announceTableUpdate() {
		const message =
			contracts.length === 0
				? hasSearched
					? `Контракты не найдены по запросу "${searchTerm}"`
					: 'Нет доступных контрактов'
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
					Контракт
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
					class="px-6 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
				>
					Дата
				</th>
				<th
					scope="col"
					class="px-6 py-3 text-right text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
				>
					Действия
				</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
			{#if contracts.length === 0}
				<tr>
					<td colspan="6" class="px-4 py-12 text-center">
						<EmptyState
							title={hasSearched ? 'Контракты не найдены' : 'Нет контрактов'}
							description={hasSearched
								? `По запросу "${searchTerm}" контракты не найдены. Попробуйте изменить критерии поиска.`
								: 'Начните с добавления первого контракта.'}
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
						<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-900 dark:text-gray-100">
							{index + 1}
						</td>
						<td class="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
							{contract.contract_number || '—'}
						</td>
						<td class="px-6 py-4 text-sm">
							<div class="font-medium text-gray-900 dark:text-gray-100">
								{contract.project?.value || 'Не указан'}
							</div>
							{#if contract.project?.region}
								<div class="text-xs text-gray-500 dark:text-gray-400">
									{contract.project.region}
								</div>
							{/if}
						</td>
						<td class="px-6 py-4 text-sm">
							<div class="font-medium text-gray-900 dark:text-gray-100">
								{contract.company?.name || 'Не указана'}
							</div>
							{#if contract.company?.inn}
								<div class="text-xs text-gray-500 dark:text-gray-400">
									ИНН: {contract.company.inn}
								</div>
							{/if}
						</td>
						<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-900 dark:text-gray-100">
							{formatDate(contract.contract_date)}
						</td>
						<td class="px-6 py-4 text-right text-sm whitespace-nowrap">
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
<div class="block space-y-4 md:hidden">
	{#if contracts.length === 0}
		<EmptyState
			title={hasSearched ? 'Контракты не найдены' : 'Нет контрактов'}
			description={hasSearched
				? `По запросу "${searchTerm}" контракты не найдены. Попробуйте изменить критерии поиска.`
				: 'Начните с добавления первого контракта.'}
		/>
	{:else}
		{#each contracts as contract, index (contract?.id || index + '-' + updateCounter)}
			<div
				class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900"
				role="article"
				aria-label="Контракт {contract.contract_number || index + 1}"
			>
				<!-- Header -->
				<div class="mb-3">
					<div class="text-sm font-medium text-gray-500 dark:text-gray-400">
						Контракт #{index + 1}
					</div>
					<div class="mt-1 text-base font-semibold text-gray-900 dark:text-gray-100">
						{contract.contract_number || 'Без номера'}
					</div>
				</div>

				<!-- Details -->
				<div class="space-y-2 text-sm">
					<div>
						<span class="font-medium text-gray-500 dark:text-gray-400">Проект:</span>
						<span class="ml-2 text-gray-900 dark:text-gray-100">
							{contract.project?.value || 'Не указан'}
						</span>
					</div>
					<div>
						<span class="font-medium text-gray-500 dark:text-gray-400">Компания:</span>
						<span class="ml-2 text-gray-900 dark:text-gray-100">
							{contract.company?.name || 'Не указана'}
						</span>
					</div>
					<div>
						<span class="font-medium text-gray-500 dark:text-gray-400">Дата:</span>
						<span class="ml-2 text-gray-900 dark:text-gray-100">
							{formatDate(contract.contract_date)}
						</span>
					</div>
				</div>

				<!-- Actions -->
				<div class="mt-4 flex justify-end">
					<ContractActionButtons
						onView={() => onViewContract(contract)}
						onEdit={() => onEditContract(contract)}
						onDelete={() => onDeleteContract(contract)}
						{isLoading}
					/>
				</div>
			</div>
		{/each}
	{/if}
</div>
