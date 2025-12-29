<script>
	import StatusBadge from '$lib/components/common/StatusBadge.svelte';
	import EmptyState from '$lib/components/common/EmptyState.svelte';
	import ActionButton from '$lib/components/common/ActionButton.svelte';
	import MobileActionButton from '$lib/components/common/MobileActionButton.svelte';
	import { formatPhone } from '$lib/utils/formatters.js';

	let {
		tzList = [],
		isLoading = false,
		onViewTz,
		onEditTz,
		onDeleteTz,
		onUploadSketch,
		onUploadCP,
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

	// Get curator name from project
	function getCuratorName(tz) {
		return tz.project?.agent?.name || 'Не указан';
	}

	// Get curator phone from project
	function getCuratorPhone(tz) {
		const phones = tz.project?.agent?.phones;
		if (!phones || phones.length === 0) return null;

		// Find primary phone or return first phone
		const primaryPhone = phones.find((p) => p.is_primary);
		return primaryPhone?.value || phones[0]?.value || null;
	}

	// Get approval status display
	function getApprovalStatus(tz) {
		if (tz.is_approved) {
			return { text: 'Согласовано', color: 'green' };
		}
		if (tz.requires_approval) {
			return { text: 'Требуется', color: 'yellow' };
		}
		return { text: 'Не требуется', color: 'gray' };
	}

	// Generate unique table ID for accessibility
	const tableId = `tz-table-${Math.random().toString(36).substr(2, 9)}`;
	const tableCaptionId = `${tableId}-caption`;
	const tableDescriptionId = `${tableId}-description`;

	// Announce table updates to screen readers
	function announceTableUpdate() {
		const message =
			tzList.length === 0
				? hasSearched
					? `Техзадания не найдены по запросу "${searchTerm}"`
					: 'Нет доступных техзаданий'
				: `${tzList.length} техзадани${tzList.length === 1 ? 'е' : tzList.length < 5 ? 'я' : 'й'} ${hasSearched ? `найдено по запросу "${searchTerm}"` : 'отображено'}`;

		// Use a live region to announce changes
		const announcement = document.getElementById(`${tableId}-announcements`);
		if (announcement) {
			announcement.textContent = message;
			setTimeout(() => {
				announcement.textContent = '';
			}, 1000);
		}
	}

	// Announce updates when tzList changes
	$effect(() => {
		if (tzList) {
			setTimeout(announceTableUpdate, 100);
		}
	});

	// Handle file download
	function handleFileDownload(fileUrl, fileName) {
		if (!fileUrl) return;

		const link = document.createElement('a');
		link.href = fileUrl;
		link.download = fileName || 'file';
		link.target = '_blank';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
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
		style="min-width: 950px;"
	>
		<caption id={tableCaptionId} class="sr-only">
			Таблица управления техзаданиями с {tzList.length} техзадани{tzList.length === 1
				? 'ем'
				: 'ями'}
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
					class="px-3 py-4 text-left text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
					style="min-width: 150px;"
				>
					НОМЕР
				</th>
				<th
					scope="col"
					class="px-3 py-4 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
					style="min-width: 150px;"
				>
					ПРОЕКТ
				</th>
				<th
					scope="col"
					class="px-3 py-4 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
					style="min-width: 200px;"
				>
					Комментарий
				</th>
				<th
					scope="col"
					class="px-3 py-4 text-left text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
					style="min-width: 150px;"
				>
					Согласование
				</th>
				<th
					scope="col"
					class="px-3 py-4 text-center text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
					style="min-width: 100px; width: 100px;"
				>
					ТЗ
				</th>
				<th
					scope="col"
					class="px-3 py-4 text-center text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
					style="min-width: 100px; width: 100px;"
				>
					КП
				</th>
				<th
					scope="col"
					class="px-3 py-4 text-center text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
					style="min-width: 250px; width: 250px;"
				>
					<span class="sr-only">Действия</span>
				</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-950">
			{#if tzList.length === 0}
				<tr>
					<td colspan="8" class="px-3 py-8" role="cell">
						<EmptyState
							type={hasSearched ? 'no-results' : 'no-data'}
							searchTerm={hasSearched ? searchTerm : ''}
						/>
					</td>
				</tr>
			{:else}
				{#each tzList as tz, index (tz.id + '-' + updateCounter)}
					<tr
						class="transition-colors duration-150 ease-in-out hover:bg-gray-50 dark:hover:bg-gray-800"
						aria-rowindex={index + 2}
					>
						<td
							class="px-3 py-3 align-middle text-sm font-medium whitespace-nowrap text-gray-900 dark:text-white"
							role="cell"
						>
							{tz.sequentialNumber || index + 1}
						</td>
						<td class="px-3 py-3 align-middle text-sm text-gray-900 dark:text-white" role="cell">
							<div class="pr-3 leading-relaxed whitespace-nowrap">
								{tz.value || '—'}
							</div>
						</td>
						<td class="px-3 py-3 align-middle text-sm text-gray-900 dark:text-white" role="cell">
							<div class="pr-3 leading-relaxed break-words">
								{tz.project?.value || tz.project?.contract_number || 'Не указан'}
							</div>
						</td>
						<td class="px-3 py-3 align-middle text-sm text-gray-900 dark:text-white" role="cell">
							<div class="max-w-xs pr-4 leading-relaxed break-words">
								{tz.comment || 'Нет комментария'}
							</div>
						</td>
						<td class="px-3 py-3 align-middle text-sm text-gray-900 dark:text-white" role="cell">
							<div class="pr-3">
								{#if getApprovalStatus(tz).color === 'green'}
									<span
										class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200"
									>
										{getApprovalStatus(tz).text}
									</span>
								{:else if getApprovalStatus(tz).color === 'yellow'}
									<span
										class="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
									>
										{getApprovalStatus(tz).text}
									</span>
								{:else}
									<span
										class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200"
									>
										{getApprovalStatus(tz).text}
									</span>
								{/if}
							</div>
						</td>
						<td class="px-3 py-3 text-center align-middle text-sm text-gray-900 dark:text-white" role="cell">
							<div class="flex items-center justify-center">
								{#if tz.sketches && tz.sketches.length > 0}
									<span
										class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200"
									>
										{tz.sketches.length}
									</span>
								{:else}
									<span class="text-gray-400 dark:text-gray-500">—</span>
								{/if}
							</div>
						</td>
						<td class="px-3 py-3 text-center align-middle text-sm text-gray-900 dark:text-white" role="cell">
							<div class="flex items-center justify-center">
								{#if tz.commercialOffers && tz.commercialOffers.length > 0}
									<span
										class="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200"
									>
										{tz.commercialOffers.length}
									</span>
								{:else}
									<span class="text-gray-400 dark:text-gray-500">—</span>
								{/if}
							</div>
						</td>
						<td class="relative px-4 py-3 text-center align-middle whitespace-nowrap" role="cell">
							<div class="flex items-center justify-center gap-1.5">
								<ActionButton
									variant="view"
									onclick={() => onViewTz && onViewTz(tz)}
									ariaLabel="Просмотреть техзадание {tz.id}"
									title="Просмотреть"
								/>
								<ActionButton
									variant="edit"
									onclick={() => onEditTz && onEditTz(tz)}
									ariaLabel="Редактировать техзадание {tz.id}"
									title="Редактировать"
								/>
								<ActionButton
									variant="upload"
									onclick={() => onUploadSketch && onUploadSketch(tz)}
									ariaLabel="Загрузить ТЗ"
									title="Загрузить ТЗ"
								/>
								<ActionButton
									variant="download"
									onclick={() => onUploadCP && onUploadCP(tz)}
									ariaLabel="Загрузить КП"
									title="Загрузить КП"
								/>
								<ActionButton
									variant="delete"
									onclick={() => onDeleteTz && onDeleteTz(tz)}
									disabled={isLoading}
									{isLoading}
									ariaLabel="Удалить техзадание {tz.id}"
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
	{#if tzList.length === 0}
		<div class="px-3 py-6">
			<EmptyState
				type={hasSearched ? 'no-results' : 'no-data'}
				searchTerm={hasSearched ? searchTerm : ''}
			/>
		</div>
	{:else}
		<div class="space-y-4" role="list" aria-label="Список техзаданий">
			{#each tzList as tz, index (tz.id + '-' + updateCounter)}
				<div
					class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
					role="listitem"
				>
					<!-- TZ Header -->
					<div class="mb-3 flex items-start justify-between">
						<div class="min-w-0 flex-1">
							<h3 class="text-sm font-medium break-words text-gray-900 dark:text-white">
								{tz.value || 'Без номера'}
							</h3>
							<p class="text-sm break-words text-gray-500 dark:text-gray-400">
								Куратор: {getCuratorName(tz)}
							</p>
						</div>
						<div class="ml-3 flex-shrink-0">
							<span
								class="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200"
							>
								№ {tz.sequentialNumber || index + 1}
							</span>
						</div>
					</div>

					<!-- TZ Details -->
					<dl class="mb-4 grid grid-cols-1 gap-3">
						<div>
							<dt
								class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
							>
								Проект
							</dt>
							<dd class="mt-1 text-sm break-words text-gray-900 dark:text-white">
								{tz.project?.value || tz.project?.contract_number || 'Не указан'}
							</dd>
						</div>
						<div>
							<dt
								class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
							>
								Комментарий
							</dt>
							<dd class="mt-1 text-sm break-words text-gray-900 dark:text-white">
								{tz.comment || 'Нет комментария'}
							</dd>
						</div>
						<div>
							<dt
								class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
							>
								Согласование
							</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">
								{#if getApprovalStatus(tz).color === 'green'}
									<span
										class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200"
									>
										{getApprovalStatus(tz).text}
									</span>
								{:else if getApprovalStatus(tz).color === 'yellow'}
									<span
										class="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
									>
										{getApprovalStatus(tz).text}
									</span>
								{:else}
									<span
										class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200"
									>
										{getApprovalStatus(tz).text}
									</span>
								{/if}
							</dd>
						</div>
						<div>
							<dt
								class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
							>
								Файлы
							</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">
								{#if tz.project?.sketches && tz.project.sketches.length > 0}
									<span class="text-blue-600 dark:text-blue-400"
										>{tz.project.sketches.length} эскиз(ов)</span
									>
								{:else}
									<span class="text-gray-500">Нет эскизов</span>
								{/if}
								{' • '}
								{#if tz.project?.offers && tz.project.offers.length > 0}
									<span class="text-green-600 dark:text-green-400"
										>{tz.project.offers.length} КП</span
									>
								{:else}
									<span class="text-gray-500">Нет КП</span>
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
							onclick={() => onViewTz && onViewTz(tz)}
							ariaLabel="Просмотреть"
							title="Просмотреть"
						/>
						<MobileActionButton
							variant="edit"
							onclick={() => onEditTz && onEditTz(tz)}
							ariaLabel="Редактировать"
							title="Редактировать"
						/>
						<MobileActionButton
							variant="upload"
							onclick={() => onUploadSketch && onUploadSketch(tz)}
							ariaLabel="Загрузить ТЗ"
							title="Загрузить ТЗ"
						/>
						<MobileActionButton
							variant="download"
							onclick={() => onUploadCP && onUploadCP(tz)}
							ariaLabel="Загрузить КП"
							title="Загрузить КП"
						/>
						<MobileActionButton
							variant="delete"
							onclick={() => onDeleteTz && onDeleteTz(tz)}
							disabled={isLoading}
							ariaLabel="Удалить"
							title="Удалить"
						/>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
