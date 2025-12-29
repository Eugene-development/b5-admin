<script>
	import StatusBadge from '$lib/components/common/StatusBadge.svelte';
	import EmptyState from '$lib/components/common/EmptyState.svelte';
	import { ActionButton, MobileActionButton } from '$lib';
	import { formatPhone } from '$lib/utils/formatters.js';

	let {
		companies = [],
		isLoading = false,
		onBanCompany,
		onDeleteCompany,
		onViewCompany,
		onEditCompany,
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

	// Get company status for StatusBadge
	function getCompanyStatus(company) {
		return company.operationalStatus === 'banned' ||
			company.operationalStatus === 'inactive' ||
			company.operationalStatus === 'suspended'
			? 'banned'
			: 'active';
	}

	// Generate unique table ID for accessibility
	const tableId = `companies-table-${Math.random().toString(36).substr(2, 9)}`;
	const tableCaptionId = `${tableId}-caption`;
	const tableDescriptionId = `${tableId}-description`;

	// Announce table updates to screen readers
	function announceTableUpdate() {
		const message =
			companies.length === 0
				? hasSearched
					? `Компании не найдены по запросу "${searchTerm}"`
					: 'Нет доступных компаний'
				: `${companies.length} компани${companies.length === 1 ? 'я' : companies.length < 5 ? 'и' : 'й'} ${hasSearched ? `найдено по запросу "${searchTerm}"` : 'отображено'}`;

		// Use a live region to announce changes
		const announcement = document.getElementById(`${tableId}-announcements`);
		if (announcement) {
			announcement.textContent = message;
			setTimeout(() => {
				announcement.textContent = '';
			}, 1000);
		}
	}

	// Announce updates when companies change
	$effect(() => {
		if (companies) {
			setTimeout(announceTableUpdate, 100);
		}
	});
</script>

<!-- Live region for screen reader announcements -->
<div id="{tableId}-announcements" class="sr-only" aria-live="polite" aria-atomic="true">
	<!-- Dynamic table update announcements -->
</div>

<!-- Desktop Table View with horizontal scroll -->
<div
	class="ring-opacity-5 hidden w-full overflow-x-auto shadow ring-1 ring-black md:block md:rounded-lg"
>
	<table
		id={tableId}
		class="w-full table-auto divide-y divide-gray-300 dark:divide-gray-700"
		aria-labelledby={tableCaptionId}
		aria-describedby={tableDescriptionId}
		style="min-width: 1200px;"
	>
		<caption id={tableCaptionId} class="sr-only">
			Таблица управления компаниями с {companies.length} компани{companies.length === 1
				? 'ей'
				: 'ями'}
			{hasSearched ? ` по поиску "${searchTerm}"` : ''}
		</caption>
		<thead class="bg-gray-100 dark:bg-gray-900">
			<tr>
				<th
					scope="col"
					class="px-3 py-4 text-left text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
					style="min-width: 60px; width: 60px;"
				>
					№
				</th>
				<th
					scope="col"
					class="px-3 py-4 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
					style="min-width: 250px;"
				>
					Компания
				</th>
				<th
					scope="col"
					class="px-3 py-4 text-left text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
					style="min-width: 150px; width: 150px;"
				>
					Телефон
				</th>
				<th
					scope="col"
					class="px-3 py-4 text-left text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
					style="min-width: 200px; width: 200px;"
				>
					Почта
				</th>
				<th
					scope="col"
					class="px-3 py-4 text-left text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
					style="min-width: 180px; width: 180px;"
				>
					Контактное лицо
				</th>
				<th
					scope="col"
					class="px-3 py-4 text-left text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
					style="min-width: 120px; width: 120px;"
				>
					СОСТОЯНИЕ
				</th>
				<th
					scope="col"
					class="px-3 py-4 text-center text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
					style="min-width: 160px; width: 160px;"
				>
					<span class="sr-only">Действия</span>
				</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-950">
			{#if isLoading}
				<tr>
					<td colspan="7" class="px-3 py-8 text-center" role="cell">
						<div class="flex justify-center" aria-label="Загрузка данных компаний">
							<div
								class="h-6 w-6 animate-spin rounded-full border-b-2 border-indigo-600"
								aria-hidden="true"
							></div>
						</div>
						<span class="sr-only">Загрузка данных компаний, пожалуйста подождите...</span>
					</td>
				</tr>
			{:else if companies.length === 0}
				<tr>
					<td colspan="7" class="px-3 py-8" role="cell">
						<EmptyState
							type={hasSearched ? 'no-results' : 'no-data'}
							searchTerm={hasSearched ? searchTerm : ''}
						/>
					</td>
				</tr>
			{:else}
				{#each companies as company, index (company.id + '-' + company.status + '-' + updateCounter)}
					<tr
						class="transition-colors duration-150 ease-in-out hover:bg-gray-50 dark:hover:bg-gray-800"
						aria-rowindex={index + 2}
					>
						<td
							class="px-3 py-3 align-middle text-sm font-medium whitespace-nowrap text-gray-900 dark:text-white"
							role="cell"
						>
							{company.sequentialNumber || index + 1}
						</td>
						<td class="px-3 py-3 align-middle text-sm text-gray-900 dark:text-white" role="cell">
							<div class="pr-3 leading-relaxed break-words">
								{company.name || 'Не указано'}
							</div>
						</td>
						<td
							class="px-3 py-3 align-middle text-sm whitespace-nowrap text-gray-900 dark:text-white"
							role="cell"
						>
							<div class="pr-3" title={formatPhone(company.phone)}>
								{formatPhone(company.phone)}
							</div>
						</td>
						<td
							class="px-3 py-3 align-middle text-sm whitespace-nowrap text-gray-900 dark:text-white"
							role="cell"
						>
							<div class="pr-3" title={company.email || 'Не указана'}>
								{company.email || 'Не указана'}
							</div>
						</td>
						<td
							class="px-3 py-3 align-middle text-sm whitespace-nowrap text-gray-900 dark:text-white"
							role="cell"
						>
							<div class="pr-3" title={company.contact_person || 'Не указано'}>
								{company.contact_person || 'Не указано'}
							</div>
						</td>
						<td class="px-3 py-3 align-middle text-sm whitespace-nowrap" role="cell">
							<button
								type="button"
								onclick={() => onBanCompany(company)}
								disabled={isLoading}
								class="inline-flex items-center rounded-md px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50
									{getCompanyStatus(company) === 'banned'
									? 'bg-red-100 text-red-800 hover:bg-red-200 focus-visible:outline-red-600 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30'
									: 'bg-green-100 text-green-800 hover:bg-green-200 focus-visible:outline-green-600 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30'}"
								aria-label={getCompanyStatus(company) === 'banned'
									? 'Разбанить компанию'
									: 'Забанить компанию'}
							>
								{#if getCompanyStatus(company) === 'banned'}
									Бан
								{:else}
									Активен
								{/if}
							</button>
						</td>
						<td class="relative px-3 py-3 text-center align-middle whitespace-nowrap" role="cell">
							<div class="flex items-center justify-center space-x-2">
								<ActionButton
									variant="view"
									onclick={() => onViewCompany && onViewCompany(company)}
									ariaLabel="Просмотреть компанию {company.name || company.id}"
									title="Просмотреть"
								/>
								<ActionButton
									variant="edit"
									onclick={() => onEditCompany && onEditCompany(company)}
									ariaLabel="Редактировать компанию {company.name || company.id}"
									title="Редактировать"
								/>
								<ActionButton
									variant="delete"
									onclick={() => onDeleteCompany(company)}
									disabled={isLoading}
									isLoading={isLoading}
									ariaLabel="Удалить компанию {company.name || company.id}"
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
	{#if companies.length === 0}
		<div class="px-4 py-6">
			<EmptyState
				type={hasSearched ? 'no-results' : 'no-data'}
				searchTerm={hasSearched ? searchTerm : ''}
			/>
		</div>
	{:else}
		<div class="space-y-4" role="list" aria-label="Список компаний">
			{#each companies as company, index (company.id + '-' + company.status + '-' + updateCounter)}
				<div
					class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
					role="listitem"
				>
					<!-- Company Header -->
					<div class="mb-3 flex items-start justify-between">
						<div class="min-w-0 flex-1">
							<h3 class="text-sm font-medium break-words text-gray-900 dark:text-white">
								{company.name || 'Не указано'}
							</h3>
							<p class="text-sm break-words text-gray-500 dark:text-gray-400">
								{company.legal_name || 'Юр. название не указано'}
							</p>
						</div>
						<div class="ml-3 flex-shrink-0">
							<span
								class="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200"
							>
								№ {company.sequentialNumber || index + 1}
							</span>
						</div>
					</div>

					<!-- Company Details Grid -->
					<dl class="mb-4 grid grid-cols-2 gap-3">
						<div class="col-span-2">
							<dt
								class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
							>
								Телефон
							</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">
								{formatPhone(company.phone)}
							</dd>
						</div>
						<div class="col-span-2">
							<dt
								class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
							>
								Почта
							</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">
								{company.email || 'Не указана'}
							</dd>
						</div>
						<div class="col-span-2">
							<dt
								class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
							>
								Контактное лицо
							</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">
								{company.contact_person || 'Не указано'}
							</dd>
						</div>
					</dl>

					<!-- Status and Actions -->
					<div
						class="flex items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-600"
					>
						<div class="flex items-center space-x-2">
							<button
								type="button"
								onclick={() => onBanCompany(company)}
								disabled={isLoading}
								class="inline-flex min-h-[44px] items-center justify-center rounded-md px-4 py-3 text-sm font-semibold shadow-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50
									{getCompanyStatus(company) === 'banned'
									? 'bg-red-100 text-red-800 hover:bg-red-200 focus-visible:outline-red-600 active:bg-red-300 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30'
									: 'bg-green-100 text-green-800 hover:bg-green-200 focus-visible:outline-green-600 active:bg-green-300 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30'}"
							>
								{#if getCompanyStatus(company) === 'banned'}
									Бан
								{:else}
									Активен
								{/if}
							</button>
						</div>
						<div class="flex space-x-2">
							<MobileActionButton
								variant="view"
								onclick={() => onViewCompany && onViewCompany(company)}
								ariaLabel="Просмотреть компанию {company.name || company.id}"
								title="Просмотреть"
							/>
							<MobileActionButton
								variant="edit"
								onclick={() => onEditCompany && onEditCompany(company)}
								ariaLabel="Редактировать компанию {company.name || company.id}"
								title="Редактировать"
							/>
							<MobileActionButton
								variant="delete"
								onclick={() => onDeleteCompany(company)}
								disabled={isLoading}
								isLoading={isLoading}
								ariaLabel="Удалить компанию {company.name || company.id}"
								title="Удалить"
							/>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
