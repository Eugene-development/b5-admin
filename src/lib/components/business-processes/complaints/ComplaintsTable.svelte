<script>
	let {
		complaints = [],
		isLoading = false,
		onEditComplaint = () => {},
		onDeleteComplaint = () => {},
		onViewComplaint = () => {},
		updateCounter = 0,
		searchTerm = '',
		hasSearched = false
	} = $props();

	// Get priority badge classes
	function getPriorityBadgeClasses(priority) {
		const baseClasses =
			'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset';

		switch (priority) {
			case 'low':
				return `${baseClasses} bg-gray-50 text-gray-600 ring-gray-500/10 dark:bg-gray-400/10 dark:text-gray-400 dark:ring-gray-400/20`;
			case 'medium':
				return `${baseClasses} bg-blue-50 text-blue-700 ring-blue-700/10 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/30`;
			case 'high':
				return `${baseClasses} bg-yellow-50 text-yellow-800 ring-yellow-600/20 dark:bg-yellow-400/10 dark:text-yellow-500 dark:ring-yellow-400/20`;
			case 'critical':
				return `${baseClasses} bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-400/10 dark:text-red-400 dark:ring-red-400/20`;
			default:
				return `${baseClasses} bg-gray-50 text-gray-600 ring-gray-500/10 dark:bg-gray-400/10 dark:text-gray-400 dark:ring-gray-400/20`;
		}
	}

	// Get priority label
	function getPriorityLabel(priority) {
		switch (priority) {
			case 'low':
				return 'Низкий';
			case 'medium':
				return 'Средний';
			case 'high':
				return 'Высокий';
			case 'critical':
				return 'Критический';
			default:
				return priority;
		}
	}

	// Get status badge classes
	function getStatusBadgeClasses(status) {
		const baseClasses =
			'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset';

		switch (status) {
			case 'open':
				return `${baseClasses} bg-blue-50 text-blue-700 ring-blue-700/10 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/30`;
			case 'in_progress':
				return `${baseClasses} bg-yellow-50 text-yellow-800 ring-yellow-600/20 dark:bg-yellow-400/10 dark:text-yellow-500 dark:ring-yellow-400/20`;
			case 'resolved':
				return `${baseClasses} bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/20`;
			case 'closed':
				return `${baseClasses} bg-gray-50 text-gray-600 ring-gray-500/10 dark:bg-gray-400/10 dark:text-gray-400 dark:ring-gray-400/20`;
			default:
				return `${baseClasses} bg-gray-50 text-gray-600 ring-gray-500/10 dark:bg-gray-400/10 dark:text-gray-400 dark:ring-gray-400/20`;
		}
	}

	// Get status label
	function getStatusLabel(status) {
		switch (status) {
			case 'open':
				return 'Открыта';
			case 'in_progress':
				return 'В работе';
			case 'resolved':
				return 'Решена';
			case 'closed':
				return 'Закрыта';
			default:
				return status;
		}
	}

	// Format date
	function formatDate(dateString) {
		if (!dateString) return '—';
		const date = new Date(dateString);
		return date.toLocaleDateString('ru-RU', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		});
	}

	// Truncate text
	function truncateText(text, maxLength = 50) {
		if (!text) return '—';
		if (text.length <= maxLength) return text;
		return text.substring(0, maxLength) + '...';
	}
</script>

<!-- Desktop Table View -->
<div class="ring-opacity-5 hidden overflow-hidden shadow ring-1 ring-black md:block md:rounded-lg">
	<div class="overflow-x-auto">
		<table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
			<thead class="bg-gray-50 dark:bg-gray-900">
				<tr>
					<th
						scope="col"
						class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
					>
						№
					</th>
					<th
						scope="col"
						class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
					>
						Название
					</th>
					<th
						scope="col"
						class="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 sm:table-cell dark:text-white"
					>
						Контракт
					</th>
					<th
						scope="col"
						class="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 lg:table-cell dark:text-white"
					>
						Заказ
					</th>
					<th
						scope="col"
						class="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 md:table-cell dark:text-white"
					>
						Ответственный
					</th>
					<th
						scope="col"
						class="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 xl:table-cell dark:text-white"
					>
						Плановая дата
					</th>
					<th
						scope="col"
						class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
					>
						Приоритет
					</th>
					<th
						scope="col"
						class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
					>
						Статус
					</th>
					<th scope="col" class="relative px-3 py-3.5">
						<span class="sr-only">Действия</span>
					</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-950">
				{#if complaints.length === 0}
					<tr>
						<td colspan="9" class="px-3 py-12 text-center">
							<div class="flex flex-col items-center justify-center">
								<svg
									class="mb-4 h-12 w-12 text-gray-400"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									aria-hidden="true"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
									/>
								</svg>
								<h3 class="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
									{hasSearched ? 'Рекламации не найдены' : 'Нет рекламаций'}
								</h3>
								<p class="text-sm text-gray-500 dark:text-gray-400">
									{hasSearched
										? `По запросу "${searchTerm}" ничего не найдено`
										: 'Начните с создания первой рекламации'}
								</p>
							</div>
						</td>
					</tr>
				{:else}
					{#each complaints as complaint, index (complaint.id + updateCounter)}
						<tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
							<td class="px-3 py-4 text-sm whitespace-nowrap text-gray-900 dark:text-white">
								{index + 1}
							</td>
							<td class="px-3 py-4 text-sm text-gray-900 dark:text-white">
								<div class="font-medium" title={complaint.title}>
									{truncateText(complaint.title, 40)}
								</div>
								{#if complaint.description}
									<div class="mt-1 text-gray-500 dark:text-gray-400" title={complaint.description}>
										{truncateText(complaint.description, 50)}
									</div>
								{/if}
							</td>
							<td
								class="hidden px-3 py-4 text-sm whitespace-nowrap text-gray-500 sm:table-cell dark:text-gray-400"
							>
								{#if complaint.contract}
									<div class="font-medium text-gray-900 dark:text-white">
										{complaint.contract.contract_number || '—'}
									</div>
									{#if complaint.contract.project}
										<div class="text-gray-500 dark:text-gray-400">
											{truncateText(complaint.contract.project.value, 30)}
										</div>
									{/if}
								{:else}
									—
								{/if}
							</td>
							<td
								class="hidden px-3 py-4 text-sm whitespace-nowrap text-gray-500 lg:table-cell dark:text-gray-400"
							>
								{#if complaint.order}
									<div class="font-medium text-gray-900 dark:text-white">
										{complaint.order.order_number || '—'}
									</div>
									{#if complaint.order.value}
										<div class="text-gray-500 dark:text-gray-400">
											{truncateText(complaint.order.value, 30)}
										</div>
									{/if}
								{:else}
									—
								{/if}
							</td>
							<td
								class="hidden px-3 py-4 text-sm whitespace-nowrap text-gray-500 md:table-cell dark:text-gray-400"
							>
								{complaint.responsible_person || '—'}
							</td>
							<td
								class="hidden px-3 py-4 text-sm whitespace-nowrap text-gray-500 xl:table-cell dark:text-gray-400"
							>
								{formatDate(complaint.planned_resolution_date)}
							</td>
							<td class="px-3 py-4 text-sm whitespace-nowrap">
								<span class={getPriorityBadgeClasses(complaint.priority)}>
									{getPriorityLabel(complaint.priority)}
								</span>
							</td>
							<td class="px-3 py-4 text-sm whitespace-nowrap">
								<span class={getStatusBadgeClasses(complaint.status)}>
									{getStatusLabel(complaint.status)}
								</span>
							</td>
							<td class="px-3 py-4 text-right text-sm font-medium whitespace-nowrap">
								<div class="flex items-center justify-end gap-2">
									<button
										type="button"
										onclick={() => onViewComplaint(complaint)}
										disabled={isLoading}
										class="text-indigo-600 hover:text-indigo-900 disabled:cursor-not-allowed disabled:opacity-50 dark:text-indigo-400 dark:hover:text-indigo-300"
										aria-label="Просмотреть жалобу {complaint.subject}"
									>
										<svg
											class="h-5 w-5"
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
										onclick={() => onEditComplaint(complaint)}
										disabled={isLoading}
										class="text-indigo-600 hover:text-indigo-900 disabled:cursor-not-allowed disabled:opacity-50 dark:text-indigo-400 dark:hover:text-indigo-300"
										aria-label="Редактировать жалобу {complaint.subject}"
									>
										<svg
											class="h-5 w-5"
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
										onclick={() => onDeleteComplaint(complaint)}
										disabled={isLoading}
										class="text-red-600 hover:text-red-900 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
										aria-label="Удалить жалобу {complaint.subject}"
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
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</div>

<!-- Mobile Card View -->
<div class="md:hidden">
	{#if complaints.length === 0}
		<div class="px-4 py-6">
			<div class="flex flex-col items-center justify-center">
				<svg
					class="mb-4 h-12 w-12 text-gray-400"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
					/>
				</svg>
				<h3 class="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
					{hasSearched ? 'Рекламации не найдены' : 'Нет рекламаций'}
				</h3>
				<p class="text-sm text-gray-500 dark:text-gray-400">
					{hasSearched
						? `По запросу "${searchTerm}" ничего не найдено`
						: 'Начните с создания первой рекламации'}
				</p>
			</div>
		</div>
	{:else}
		<div class="space-y-4" role="list" aria-label="Список рекламаций">
			{#each complaints as complaint, index (complaint.id + updateCounter)}
				<div
					class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
					role="listitem"
				>
					<!-- Complaint Header -->
					<div class="mb-3 flex items-start justify-between">
						<div class="min-w-0 flex-1">
							<h3 class="text-sm font-medium break-words text-gray-900 dark:text-white">
								{truncateText(complaint.title, 40)}
							</h3>
							{#if complaint.description}
								<p class="mt-1 text-sm break-words text-gray-500 dark:text-gray-400">
									{truncateText(complaint.description, 50)}
								</p>
							{/if}
						</div>
						<div class="ml-3 flex-shrink-0">
							<span
								class="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200"
							>
								№ {index + 1}
							</span>
						</div>
					</div>

					<!-- Complaint Details Grid -->
					<dl class="mb-4 grid grid-cols-2 gap-3">
						<div>
							<dt
								class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
							>
								Приоритет
							</dt>
							<dd class="mt-1">
								<span class={getPriorityBadgeClasses(complaint.priority)}>
									{getPriorityLabel(complaint.priority)}
								</span>
							</dd>
						</div>
						<div>
							<dt
								class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
							>
								Статус
							</dt>
							<dd class="mt-1">
								<span class={getStatusBadgeClasses(complaint.status)}>
									{getStatusLabel(complaint.status)}
								</span>
							</dd>
						</div>
						{#if complaint.contract}
							<div class="col-span-2">
								<dt
									class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
								>
									Контракт
								</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-white">
									{complaint.contract.contract_number || '—'}
									{#if complaint.contract.project}
										<span class="text-gray-500 dark:text-gray-400">
											• {truncateText(complaint.contract.project.value, 30)}
										</span>
									{/if}
								</dd>
							</div>
						{/if}
						{#if complaint.order}
							<div class="col-span-2">
								<dt
									class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
								>
									Заказ
								</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-white">
									{complaint.order.order_number || '—'}
									{#if complaint.order.value}
										<span class="text-gray-500 dark:text-gray-400">
											• {truncateText(complaint.order.value, 30)}
										</span>
									{/if}
								</dd>
							</div>
						{/if}
						{#if complaint.responsible_person}
							<div class="col-span-2">
								<dt
									class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
								>
									Ответственный
								</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-white">
									{complaint.responsible_person}
								</dd>
							</div>
						{/if}
						{#if complaint.planned_resolution_date}
							<div class="col-span-2">
								<dt
									class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
								>
									Плановая дата
								</dt>
								<dd class="mt-1 text-sm text-gray-900 dark:text-white">
									{formatDate(complaint.planned_resolution_date)}
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
							onclick={() => onViewComplaint(complaint)}
							disabled={isLoading}
							class="inline-flex min-h-[44px] items-center justify-center rounded-md bg-gray-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-gray-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
							aria-label="Просмотреть рекламацию"
						>
							<svg
								class="h-5 w-5"
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
							onclick={() => onEditComplaint(complaint)}
							disabled={isLoading}
							class="inline-flex min-h-[44px] items-center justify-center rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
							aria-label="Редактировать рекламацию"
						>
							<svg
								class="h-5 w-5"
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
							onclick={() => onDeleteComplaint(complaint)}
							disabled={isLoading}
							class="inline-flex min-h-[44px] items-center justify-center rounded-md bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50"
							aria-label="Удалить рекламацию"
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
								<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
