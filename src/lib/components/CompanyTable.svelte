<script>
	import StatusBadge from './StatusBadge.svelte';
	import ActionButtons from './ActionButtons.svelte';
	import EmptyState from './EmptyState.svelte';
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
		<thead class="bg-gray-50 dark:bg-gray-800">
			<tr>
				<th
					scope="col"
					class="px-4 py-3 text-left text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
					style="min-width: 60px; width: 60px;"
				>
					№
				</th>
				<th
					scope="col"
					class="px-4 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
					style="min-width: 250px;"
				>
					Компания
				</th>
				<th
					scope="col"
					class="px-4 py-3 text-left text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
					style="min-width: 200px; width: 200px;"
				>
					Почта
				</th>
				<th
					scope="col"
					class="px-4 py-3 text-left text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
					style="min-width: 150px; width: 150px;"
				>
					Телефон
				</th>
				<th
					scope="col"
					class="px-4 py-3 text-left text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
					style="min-width: 180px; width: 180px;"
				>
					Контактное лицо
				</th>
				<th
					scope="col"
					class="px-4 py-3 text-left text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
					style="min-width: 120px; width: 120px;"
				>
					СОСТОЯНИЕ
				</th>
				<th
					scope="col"
					class="px-4 py-3 text-center text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
					style="min-width: 160px; width: 160px;"
				>
					Действия
				</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-950">
			{#if isLoading}
				<tr>
					<td colspan="7" class="px-4 py-8 text-center" role="cell">
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
					<td colspan="7" class="px-4 py-8" role="cell">
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
							class="px-4 py-5 align-top text-sm font-medium whitespace-nowrap text-gray-900 dark:text-white"
							role="cell"
						>
							{company.sequentialNumber || index + 1}
						</td>
						<td class="px-4 py-5 align-top text-sm text-gray-900 dark:text-white" role="cell">
							<div class="pr-4 leading-relaxed break-words">
								{company.name || 'Не указано'}
							</div>
						</td>
						<td
							class="px-4 py-5 align-top text-sm whitespace-nowrap text-gray-900 dark:text-white"
							role="cell"
						>
							<div class="pr-4" title={company.email || 'Не указана'}>
								{company.email || 'Не указана'}
							</div>
						</td>
						<td
							class="px-4 py-5 align-top text-sm whitespace-nowrap text-gray-900 dark:text-white"
							role="cell"
						>
							<div class="pr-4" title={formatPhone(company.phone)}>
								{formatPhone(company.phone)}
							</div>
						</td>
						<td
							class="px-4 py-5 align-top text-sm whitespace-nowrap text-gray-900 dark:text-white"
							role="cell"
						>
							<div class="pr-4" title={company.contact_person || 'Не указано'}>
								{company.contact_person || 'Не указано'}
							</div>
						</td>
						<td class="px-4 py-5 align-top text-sm whitespace-nowrap" role="cell">
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
						<td class="relative px-4 py-5 text-center align-top whitespace-nowrap" role="cell">
							<div class="flex items-center justify-center space-x-2">
								<!-- View Button -->
								<button
									type="button"
									onclick={() => onViewCompany && onViewCompany(company)}
									class="inline-flex items-center rounded-md bg-gray-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-gray-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
									aria-label="Просмотреть компанию {company.name || company.id}"
								>
									<svg
										class="h-4 w-4"
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
								<!-- Edit Button -->
								<button
									type="button"
									onclick={() => onEditCompany && onEditCompany(company)}
									class="inline-flex items-center rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
									aria-label="Редактировать компанию {company.name || company.id}"
								>
									<svg
										class="h-4 w-4"
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
								<!-- Delete Button -->
								<button
									type="button"
									onclick={() => onDeleteCompany(company)}
									disabled={isLoading}
									class="inline-flex items-center rounded-md bg-red-800 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50"
									aria-label="Удалить компанию {company.name || company.id}"
								>
									{#if isLoading}
										<svg
											class="mr-1 h-3 w-3 animate-spin"
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
											class="h-4 w-4"
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
						<div>
							<dt
								class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
							>
								Почта
							</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">
								{company.email || 'Не указана'}
							</dd>
						</div>
						<div>
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
							<!-- View Button -->
							<button
								type="button"
								aria-label="Просмотреть компанию {company.name || company.id}"
								onclick={() => onViewCompany && onViewCompany(company)}
								class="inline-flex min-h-[44px] items-center justify-center rounded-md bg-gray-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-gray-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
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
							<!-- Edit Button -->
							<button
								type="button"
								onclick={() => onEditCompany && onEditCompany(company)}
								aria-label="Редактировать компанию {company.name || company.id}"
								class="inline-flex min-h-[44px] items-center justify-center rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
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
							<!-- Delete Button -->
							<button
								type="button"
								onclick={() => onDeleteCompany(company)}
								disabled={isLoading}
								class="inline-flex min-h-[44px] items-center justify-center rounded-md bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50"
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
				</div>
			{/each}
		</div>
	{/if}
</div>
