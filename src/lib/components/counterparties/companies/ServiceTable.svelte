<script>
	import StatusBadge from '$lib/components/common/StatusBadge.svelte';
	import EmptyState from '$lib/components/common/EmptyState.svelte';
	import { ActionButton, MobileActionButton } from '$lib';
	import { formatPhone } from '$lib/utils/formatters.js';

	let {
		services = [],
		isLoading = false,
		onBanService,
		onDeleteService,
		onViewService,
		onEditService,
		updateCounter = 0,
		searchTerm = '',
		hasSearched = false
	} = $props();

	// Get service status for StatusBadge
	function getServiceStatus(service) {
		return service.status === 'banned' ||
			service.status === 'inactive' ||
			service.status === 'suspended'
			? 'banned'
			: 'active';
	}

	// Generate unique table ID for accessibility
	const tableId = `services-table-${Math.random().toString(36).substr(2, 9)}`;
	const tableCaptionId = `${tableId}-caption`;
	const tableDescriptionId = `${tableId}-description`;

	// Announce table updates to screen readers
	function announceTableUpdate() {
		const message =
			services.length === 0
				? hasSearched
					? `Сервисы не найдены по запросу "${searchTerm}"`
					: 'Нет доступных сервисов'
				: `${services.length} сервис${services.length === 1 ? '' : services.length < 5 ? 'а' : 'ов'} ${hasSearched ? `найдено по запросу "${searchTerm}"` : 'отображено'}`;

		// Use a live region to announce changes
		const announcement = document.getElementById(`${tableId}-announcements`);
		if (announcement) {
			announcement.textContent = message;
			setTimeout(() => {
				announcement.textContent = '';
			}, 1000);
		}
	}

	// Announce updates when services change
	$effect(() => {
		if (services) {
			setTimeout(announceTableUpdate, 100);
		}
	});
</script>

<!-- Live region for screen reader announcements -->
<div id="{tableId}-announcements" class="sr-only" aria-live="polite" aria-atomic="true">
	<!-- Dynamic table update announcements -->
</div>

<!-- Desktop Table View with horizontal scroll -->
<div class="ring-opacity-5 w-full overflow-x-auto shadow ring-1 ring-black md:rounded-lg">
	<table
		id={tableId}
		class="w-full table-auto divide-y divide-gray-300 dark:divide-gray-700"
		aria-labelledby={tableCaptionId}
		aria-describedby={tableDescriptionId}
		style="min-width: 1000px;"
	>
		<caption id={tableCaptionId} class="sr-only">
			Таблица управления сервисами с {services.length} сервис{services.length === 1 ? 'ом' : 'ами'}
			{hasSearched ? ` по поиску "${searchTerm}"` : ''}
		</caption>
		<thead class="bg-gray-100 dark:bg-gray-900">
			<tr>
				<th
					scope="col"
					class="px-3 py-4 text-left text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
					style="min-width: 80px; width: 80px;"
				>
					№
				</th>
				<th
					scope="col"
					class="px-3 py-4 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
					style="min-width: 250px;"
				>
					Услуга
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
					Регион
				</th>
				<th
					scope="col"
					class="px-3 py-4 text-center text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
					style="min-width: 80px; width: 80px;"
				>
					Бан
				</th>
				<th
					scope="col"
					class="px-3 py-4 text-center text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
					style="min-width: 200px; width: 200px;"
				>
					<span class="sr-only">Действия</span>
				</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-950">
			{#if isLoading}
				<tr>
					<td colspan="8" class="px-3 py-8 text-center" role="cell">
						<div class="flex justify-center" aria-label="Загрузка данных сервисов">
							<div
								class="h-6 w-6 animate-spin rounded-full border-b-2 border-indigo-600"
								aria-hidden="true"
							></div>
						</div>
						<span class="sr-only">Загрузка данных сервисов, пожалуйста подождите...</span>
					</td>
				</tr>
			{:else if services.length === 0}
				<tr>
					<td colspan="8" class="px-3 py-8" role="cell">
						<EmptyState
							type={hasSearched ? 'no-results' : 'no-data'}
							searchTerm={hasSearched ? searchTerm : ''}
						/>
					</td>
				</tr>
			{:else}
				{#each services as service, index (service.id + '-' + service.status + '-' + updateCounter)}
					<tr
						class="transition-colors duration-150 ease-in-out hover:bg-gray-50 dark:hover:bg-gray-800"
						aria-rowindex={index + 2}
					>
						<td
							class="px-3 py-5 align-middle text-sm font-medium whitespace-nowrap text-gray-900 dark:text-white"
							role="cell"
						>
							{service.sequentialNumber || index + 1}
						</td>
						<td class="px-3 py-5 align-middle text-sm text-gray-900 dark:text-white" role="cell">
							<div class="pr-3 leading-relaxed break-words">
								{service.service_name || 'Не указано'}
							</div>
						</td>
						<td
							class="px-3 py-5 align-middle text-sm whitespace-nowrap text-gray-900 dark:text-white"
							role="cell"
						>
							<div class="pr-3" title={formatPhone(service.phone)}>
								{formatPhone(service.phone)}
							</div>
						</td>
						<td
							class="px-3 py-5 align-middle text-sm whitespace-nowrap text-gray-900 dark:text-white"
							role="cell"
						>
							<div class="pr-3" title={service.email || 'Не указана'}>
								{service.email || 'Не указана'}
							</div>
						</td>
						<td
							class="px-3 py-5 align-middle text-sm whitespace-nowrap text-gray-900 dark:text-white"
							role="cell"
						>
							<div class="pr-3" title={service.contact_person || 'Не указано'}>
								{service.contact_person || 'Не указано'}
							</div>
						</td>
						<td
							class="px-3 py-5 align-middle text-sm whitespace-nowrap text-gray-900 dark:text-white"
							role="cell"
						>
							<div class="pr-3" title={service.region || 'Не указан'}>
								{service.region || 'Не указан'}
							</div>
						</td>
						<td class="px-3 py-5 text-center align-middle whitespace-nowrap" role="cell">
							<button
								type="button"
								onclick={() => onBanService(service)}
								disabled={isLoading}
								class="inline-flex items-center rounded-md px-2.5 py-1.5 text-xs font-semibold shadow-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50
									{getServiceStatus(service) === 'banned'
									? 'bg-green-600 text-white hover:bg-green-500 focus-visible:outline-green-600'
									: 'bg-yellow-600 text-white hover:bg-yellow-500 focus-visible:outline-yellow-600'}"
								aria-label={getServiceStatus(service) === 'banned'
									? 'Разбанить сервис'
									: 'Забанить сервис'}
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
								{:else if getServiceStatus(service) === 'banned'}
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
											d="M12 4v16m8-8H4"
										/>
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
											d="M20 12H4"
										/>
									</svg>
								{/if}
							</button>
						</td>
						<td class="relative px-4 py-5 text-center align-middle whitespace-nowrap" role="cell">
							<div class="flex items-center justify-center space-x-2">
								<ActionButton
									variant="view"
									onclick={() => onViewService && onViewService(service)}
									ariaLabel="Просмотреть сервис {service.service_name || service.id}"
									title="Просмотреть"
								/>
								<ActionButton
									variant="edit"
									onclick={() => onEditService && onEditService(service)}
									ariaLabel="Редактировать сервис {service.service_name || service.id}"
									title="Редактировать"
								/>
								<ActionButton
									variant="delete"
									onclick={() => onDeleteService(service)}
									disabled={isLoading}
									isLoading={isLoading}
									ariaLabel="Удалить сервис {service.service_name || service.id}"
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
<!-- Mo
bile Card View -->
<div class="md:hidden">
	{#if services.length === 0}
		<div class="px-3 py-6">
			<EmptyState
				type={hasSearched ? 'no-results' : 'no-data'}
				searchTerm={hasSearched ? searchTerm : ''}
			/>
		</div>
	{:else}
		<div class="space-y-4" role="list" aria-label="Список сервисов">
			{#each services as service, index (service.id + '-' + service.status + '-' + updateCounter)}
				<div
					class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
					role="listitem"
				>
					<!-- Service Header -->
					<div class="mb-3 flex items-start justify-between">
						<div class="min-w-0 flex-1">
							<h3 class="text-sm font-medium break-words text-gray-900 dark:text-white">
								{service.service_name || 'Не указано'}
							</h3>
						</div>
						<div class="ml-3 flex-shrink-0 flex items-center gap-2">
							<StatusBadge status={getServiceStatus(service)} />
							<span
								class="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200"
							>
								№ {service.sequentialNumber || index + 1}
							</span>
						</div>
					</div>

					<!-- Service Details Grid -->
					<dl class="mb-4 grid grid-cols-2 gap-3">
						<div class="col-span-2">
							<dt
								class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
							>
								Телефон
							</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">
								{formatPhone(service.phone)}
							</dd>
						</div>
						<div class="col-span-2">
							<dt
								class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
							>
								Почта
							</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">
								{service.email || 'Не указана'}
							</dd>
						</div>
						<div>
							<dt
								class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
							>
								Регион
							</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">
								{service.region || 'Не указан'}
							</dd>
						</div>
						<div>
							<dt
								class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
							>
								Контактное лицо
							</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">
								{service.contact_person || 'Не указано'}
							</dd>
						</div>
					</dl>

					<!-- Actions -->
					<div
						class="flex items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-600"
					>
						<div class="flex items-center space-x-2">
							<button
								type="button"
								onclick={() => onBanService(service)}
								disabled={isLoading}
								class="inline-flex min-h-[44px] items-center justify-center rounded-md px-4 py-3 text-sm font-semibold shadow-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50
									{getServiceStatus(service) === 'banned'
									? 'bg-green-600 text-white hover:bg-green-500 focus-visible:outline-green-600 active:bg-green-700'
									: 'bg-yellow-600 text-white hover:bg-yellow-500 focus-visible:outline-yellow-600 active:bg-yellow-700'}"
								aria-label={getServiceStatus(service) === 'banned'
									? 'Разбанить сервис'
									: 'Забанить сервис'}
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
								{:else if getServiceStatus(service) === 'banned'}
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
											d="M12 4v16m8-8H4"
										/>
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
											d="M20 12H4"
										/>
									</svg>
								{/if}
							</button>
						</div>
						<div class="flex space-x-2">
							<MobileActionButton
								variant="view"
								onclick={() => onViewService && onViewService(service)}
								ariaLabel="Просмотреть сервис {service.service_name || service.id}"
								title="Просмотреть"
							/>
							<MobileActionButton
								variant="edit"
								onclick={() => onEditService && onEditService(service)}
								ariaLabel="Редактировать сервис {service.service_name || service.id}"
								title="Редактировать"
							/>
							<MobileActionButton
								variant="delete"
								onclick={() => onDeleteService(service)}
								disabled={isLoading}
								isLoading={isLoading}
								ariaLabel="Удалить сервис {service.service_name || service.id}"
								title="Удалить"
							/>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
