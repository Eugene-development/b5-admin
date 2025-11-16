<script>
	import StatusBadge from './StatusBadge.svelte';
	import EmptyState from './EmptyState.svelte';
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
<div class="ring-opacity-5 w-full overflow-x-auto shadow ring-1 ring-black md:rounded-lg">
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
		<thead class="bg-gray-50 dark:bg-gray-800">
			<tr>
				<th
					scope="col"
					class="px-4 py-3 text-left text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
					style="min-width: 80px; width: 80px;"
				>
					№
				</th>
				<th
					scope="col"
					class="px-4 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
					style="min-width: 200px;"
				>
					Куратор
				</th>

				<th
					scope="col"
					class="px-4 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
					style="min-width: 200px;"
				>
					Комментарий
				</th>
				<th
					scope="col"
					class="px-4 py-3 text-center text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
					style="min-width: 250px; width: 250px;"
				>
					Действия
				</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-950">
			{#if tzList.length === 0}
				<tr>
					<td colspan="4" class="px-4 py-8" role="cell">
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
							class="px-4 py-5 align-top text-sm font-medium whitespace-nowrap text-gray-900 dark:text-white"
							role="cell"
						>
							{tz.sequentialNumber || index + 1}
						</td>
						<td class="px-4 py-5 align-top text-sm text-gray-900 dark:text-white" role="cell">
							<div class="pr-4 leading-relaxed break-words">
								{getCuratorName(tz)}
							</div>
						</td>

						<td class="px-4 py-5 align-top text-sm text-gray-900 dark:text-white" role="cell">
							<div class="max-w-xs pr-4 leading-relaxed break-words">
								{tz.comment || 'Нет комментария'}
							</div>
						</td>
						<td class="relative px-4 py-5 text-center align-top whitespace-nowrap" role="cell">
							<div class="flex items-center justify-center space-x-1">
								<!-- View Button -->
								<button
									type="button"
									onclick={() => onViewTz && onViewTz(tz)}
									class="inline-flex items-center rounded-md bg-gray-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-gray-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
									aria-label="Просмотреть техзадание {tz.id}"
									title="Просмотреть"
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
									onclick={() => onEditTz && onEditTz(tz)}
									class="inline-flex items-center rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
									aria-label="Редактировать техзадание {tz.id}"
									title="Редактировать"
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
								<!-- Upload Sketch Button -->
								<button
									type="button"
									onclick={() => onUploadSketch && onUploadSketch(tz)}
									class="inline-flex items-center rounded-md bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
									aria-label="Загрузить эскиз"
									title="Загрузить эскиз"
								>
									<svg
										class="h-4 w-4"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
										/>
									</svg>
								</button>
								<!-- Upload Offer Button -->
								<button
									type="button"
									onclick={() => onUploadCP && onUploadCP(tz)}
									class="inline-flex items-center rounded-md bg-green-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-green-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
									aria-label="Загрузить КП"
									title="Загрузить КП"
								>
									<svg
										class="h-4 w-4"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
										/>
									</svg>
								</button>
								<!-- Delete Button -->
								<button
									type="button"
									onclick={() => onDeleteTz && onDeleteTz(tz)}
									disabled={isLoading}
									class="inline-flex items-center rounded-md bg-red-800 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50"
									aria-label="Удалить техзадание {tz.id}"
									title="Удалить"
								>
									{#if isLoading}
										<svg
											class="h-3 w-3 animate-spin"
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
	{#if tzList.length === 0}
		<div class="px-4 py-6">
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
								Куратор: {getCuratorName(tz)}
							</h3>
							<p class="text-sm break-words text-gray-500 dark:text-gray-400">
								{formatPhone(getCuratorPhone(tz)) || 'Телефон не указан'}
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
					<dl class="mb-4 space-y-3">
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
						<!-- View Button -->
						<button
							type="button"
							onclick={() => onViewTz && onViewTz(tz)}
							class="inline-flex min-h-[44px] items-center justify-center rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-gray-500"
							aria-label="Просмотреть"
							title="Просмотреть"
						>
							<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
							onclick={() => onEditTz && onEditTz(tz)}
							class="inline-flex min-h-[44px] items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-blue-500"
							aria-label="Редактировать"
							title="Редактировать"
						>
							<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
								/>
							</svg>
						</button>
						<!-- Upload Sketch Button -->
						<button
							type="button"
							onclick={() => onUploadSketch && onUploadSketch(tz)}
							class="inline-flex min-h-[44px] items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-indigo-500"
							aria-label="Загрузить эскиз"
							title="Загрузить эскиз"
						>
							<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
								/>
							</svg>
						</button>
						<!-- Upload Offer Button -->
						<button
							type="button"
							onclick={() => onUploadCP && onUploadCP(tz)}
							class="inline-flex min-h-[44px] items-center justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-green-500"
							aria-label="Загрузить КП"
							title="Загрузить КП"
						>
							<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
								/>
							</svg>
						</button>
						<!-- Delete Button -->
						<button
							type="button"
							onclick={() => onDeleteTz && onDeleteTz(tz)}
							disabled={isLoading}
							class="inline-flex min-h-[44px] items-center justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
							aria-label="Удалить"
							title="Удалить"
						>
							<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
								/>
							</svg>
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
