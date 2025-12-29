<script>
	import StatusBadge from '$lib/components/common/StatusBadge.svelte';
	import EmptyState from '$lib/components/common/EmptyState.svelte';
	import { ActionButton, MobileActionButton } from '$lib';

	let {
		actions = [],
		isLoading = false,
		onViewAction,
		onEditAction,
		onDeleteAction,
		updateCounter = 0,
		searchTerm = '',
		hasSearched = false
	} = $props();

	// Generate unique table ID for accessibility
	const tableId = `actions-table-${Math.random().toString(36).substr(2, 9)}`;
	const tableCaptionId = `${tableId}-caption`;
	const tableDescriptionId = `${tableId}-description`;

	// Announce table updates to screen readers
	function announceTableUpdate() {
		const message =
			actions.length === 0
				? hasSearched
					? `Акции не найдены по запросу "${searchTerm}"`
					: 'Нет доступных акций'
				: `${actions.length} акци${actions.length === 1 ? 'я' : actions.length < 5 ? 'и' : 'й'} ${hasSearched ? `найдено по запросу "${searchTerm}"` : 'отображено'}`;

		// Use a live region to announce changes
		const announcement = document.getElementById(`${tableId}-announcements`);
		if (announcement) {
			announcement.textContent = message;
			setTimeout(() => {
				announcement.textContent = '';
			}, 1000);
		}
	}

	// Announce updates when actions change
	$effect(() => {
		if (actions) {
			setTimeout(announceTableUpdate, 100);
		}
	});

	// Format date helper function
	function formatDate(dateString) {
		if (!dateString) return 'Не указан';
		return new Date(dateString).toLocaleDateString('ru-RU', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<!-- Live region for screen reader announcements -->
<div id="{tableId}-announcements" class="sr-only" aria-live="polite" aria-atomic="true">
	<!-- Dynamic table update announcements -->
</div>

<!-- Desktop Table View with horizontal scroll -->
<div class="ring-opacity-5 hidden w-full overflow-x-auto shadow ring-1 ring-black md:block md:rounded-lg">
	<table
		id={tableId}
		class="w-full table-auto divide-y divide-gray-300 dark:divide-gray-700"
		aria-labelledby={tableCaptionId}
		aria-describedby={tableDescriptionId}
		style="min-width: 800px;"
	>
		<caption id={tableCaptionId} class="sr-only">
			Таблица управления акциями с {actions.length} акци{actions.length === 1 ? 'ей' : 'ями'}
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
					style="min-width: 200px;"
				>
					Компания
				</th>
				<th
					scope="col"
					class="px-3 py-4 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
					style="min-width: 250px;"
				>
					Акция
				</th>
				<th
					scope="col"
					class="px-3 py-4 text-left text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
					style="min-width: 180px; width: 180px;"
				>
					Период
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
					<td colspan="5" class="px-3 py-8 text-center" role="cell">
						<div class="flex justify-center" aria-label="Загрузка данных акций">
							<div
								class="h-6 w-6 animate-spin rounded-full border-b-2 border-indigo-600"
								aria-hidden="true"
							></div>
						</div>
						<span class="sr-only">Загрузка данных акций, пожалуйста подождите...</span>
					</td>
				</tr>
			{:else if actions.length === 0}
				<tr>
					<td colspan="5" class="px-3 py-8" role="cell">
						<EmptyState
							type={hasSearched ? 'no-results' : 'no-data'}
							searchTerm={hasSearched ? searchTerm : ''}
						/>
					</td>
				</tr>
			{:else}
				{#each actions as action, index (action.id + '-' + updateCounter)}
					<tr
						class="transition-colors duration-150 ease-in-out hover:bg-gray-50 dark:hover:bg-gray-800"
						aria-rowindex={index + 2}
					>
						<td
							class="px-3 py-5 align-middle text-sm font-medium whitespace-nowrap text-gray-900 dark:text-white"
							role="cell"
						>
							{action.sequentialNumber || index + 1}
						</td>
						<td class="px-3 py-5 align-middle text-sm text-gray-900 dark:text-white" role="cell">
							<div class="pr-3 leading-relaxed break-words">
								{action.company_name || 'Не указано'}
							</div>
						</td>
						<td class="px-3 py-5 align-middle text-sm text-gray-900 dark:text-white" role="cell">
							<div class="pr-3 leading-relaxed break-words">
								{action.action_name || 'Не указано'}
							</div>
						</td>
						<td
							class="px-3 py-5 align-middle text-sm whitespace-nowrap text-gray-900 dark:text-white"
							role="cell"
						>
							<div class="pr-3">
								{#if action.start_date && action.end_date}
									{formatDate(action.start_date)} - {formatDate(action.end_date)}
								{:else if action.start_date}
									с {formatDate(action.start_date)}
								{:else if action.end_date}
									до {formatDate(action.end_date)}
								{:else}
									Не указан
								{/if}
							</div>
						</td>
						<td class="relative px-4 py-5 text-center align-middle whitespace-nowrap" role="cell">
							<div class="flex items-center justify-center gap-1.5">
								<ActionButton
									variant="view"
									onclick={() => onViewAction && onViewAction(action)}
									ariaLabel="Просмотреть акцию {action.action_name || action.id}"
									title="Просмотреть"
								/>
								<ActionButton
									variant="edit"
									onclick={() => onEditAction && onEditAction(action)}
									ariaLabel="Редактировать акцию {action.action_name || action.id}"
									title="Редактировать"
								/>
								<ActionButton
									variant="delete"
									onclick={() => onDeleteAction && onDeleteAction(action)}
									disabled={isLoading}
									{isLoading}
									ariaLabel="Удалить акцию {action.action_name || action.id}"
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
	{#if actions.length === 0}
		<div class="px-3 py-6">
			<EmptyState
				type={hasSearched ? 'no-results' : 'no-data'}
				searchTerm={hasSearched ? searchTerm : ''}
			/>
		</div>
	{:else}
		<div class="space-y-4" role="list" aria-label="Список акций">
			{#each actions as action, index (action.id + '-' + updateCounter)}
				<div
					class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
					role="listitem"
				>
					<!-- Action Header -->
					<div class="mb-3 flex items-start justify-between">
						<div class="min-w-0 flex-1">
							<h3 class="text-sm font-medium break-words text-gray-900 dark:text-white">
								{action.action_name || 'Не указано'}
							</h3>
							<p class="text-sm break-words text-gray-500 dark:text-gray-400">
								{action.company_name || 'Компания не указана'}
							</p>
						</div>
						<div class="ml-3 flex-shrink-0">
							<span
								class="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200"
							>
								№ {action.sequentialNumber || index + 1}
							</span>
						</div>
					</div>

					<!-- Action Details Grid -->
					<dl class="mb-4 grid grid-cols-1 gap-3">
						<div>
							<dt
								class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
							>
								Период
							</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">
								{#if action.start_date && action.end_date}
									{formatDate(action.start_date)} - {formatDate(action.end_date)}
								{:else if action.start_date}
									с {formatDate(action.start_date)}
								{:else if action.end_date}
									до {formatDate(action.end_date)}
								{:else}
									Не указан
								{/if}
							</dd>
						</div>
					</dl>

					<!-- Actions -->
					<div
						class="flex flex-wrap items-center justify-end gap-2 border-t border-gray-200 pt-3 dark:border-gray-600"
					>
						<MobileActionButton
							variant="view"
							onclick={() => onViewAction && onViewAction(action)}
							ariaLabel="Просмотреть акцию {action.action_name || action.id}"
							title="Просмотреть"
						/>
						<MobileActionButton
							variant="edit"
							onclick={() => onEditAction && onEditAction(action)}
							ariaLabel="Редактировать акцию {action.action_name || action.id}"
							title="Редактировать"
						/>
						<MobileActionButton
							variant="delete"
							onclick={() => onDeleteAction && onDeleteAction(action)}
							disabled={isLoading}
							{isLoading}
							ariaLabel="Удалить акцию {action.action_name || action.id}"
							title="Удалить"
						/>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
