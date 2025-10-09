<script>
	import StatusBadge from './StatusBadge.svelte';
	import ActionButtons from './ActionButtons.svelte';
	import EmptyState from './EmptyState.svelte';

	let {
		projects = [],
		isLoading = false,
		onEditProject,
		onDeleteProject,
		onViewProject,
		updateCounter = 0,
		searchTerm = '',
		hasSearched = false
	} = $props();

	// Format date helper function
	function formatDate(dateString) {
		if (!dateString) return ' - ';
		return new Date(dateString).toLocaleDateString('ru-RU', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	}

	// Format currency helper function
	function formatCurrency(amount, currency = 'RUB') {
		if (!amount && amount !== 0) return ' - ';
		return new Intl.NumberFormat('ru-RU', {
			style: 'currency',
			currency: currency,
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount);
	}

	// Format agent rate helper function
	function formatAgentRate(rate, type) {
		if (!rate && rate !== 0) return ' - ';
		if (type === 'percentage') {
			return `${rate}%`;
		}
		return formatCurrency(rate);
	}

	// Check if date is overdue
	function isOverdue(dateString) {
		if (!dateString) return false;
		return new Date(dateString) < new Date();
	}

	// Get project status for StatusBadge
	function getProjectStatus(project) {
		if (!project.status) return 'active';
		return project.status;
	}

	// Get agent display text
	function getAgentDisplay(agent) {
		if (!agent) return 'Не назначен';
		return `${agent.email} (ID: ${agent.id})`;
	}

	// Generate unique table ID for accessibility
	const tableId = `projects-table-${Math.random().toString(36).substr(2, 9)}`;
	const tableCaptionId = `${tableId}-caption`;
	const tableDescriptionId = `${tableId}-description`;

	// Log projects data when it changes
	$effect(() => {
		console.log(
			'ProjectsTable received projects:',
			projects.map((p) => ({ id: p.id, value: p.value, status: p.status }))
		);
	});

	// Announce table updates to screen readers
	function announceTableUpdate() {
		const message =
			projects.length === 0
				? hasSearched
					? `Проекты не найдены по запросу "${searchTerm}"`
					: 'Проекты отсутствуют'
				: `${projects.length} проект${projects.length === 1 ? '' : projects.length < 5 ? 'а' : 'ов'} ${hasSearched ? `найдено по запросу "${searchTerm}"` : 'отображено'}`;

		// Use a live region to announce changes
		const announcement = document.getElementById(`${tableId}-announcements`);
		if (announcement) {
			announcement.textContent = message;
			setTimeout(() => {
				announcement.textContent = '';
			}, 1000);
		}
	}

	// Announce updates when projects change
	$effect(() => {
		if (projects) {
			setTimeout(announceTableUpdate, 100); // Small delay to ensure DOM is updated
		}
	});
</script>

<!-- Live region for screen reader announcements -->
<div id="{tableId}-announcements" class="sr-only" aria-live="polite" aria-atomic="true">
	<!-- Dynamic table update announcements -->
</div>

<!-- Desktop Table View (hidden on mobile) -->
<div class="hidden overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:block md:rounded-lg">
	<table
		id={tableId}
		class="min-w-full divide-y divide-gray-300 dark:divide-gray-700"
		aria-labelledby={tableCaptionId}
		aria-describedby={tableDescriptionId}
	>
		<caption id={tableCaptionId} class="sr-only">
			Таблица управления проектами с {projects.length} проект{projects.length === 1
				? 'ом'
				: projects.length < 5
					? 'ами'
					: 'ами'}
			{hasSearched ? ` по запросу "${searchTerm}"` : ''}
		</caption>
		<thead class="bg-gray-50 dark:bg-gray-800">
			<tr>
				<th
					id="col-number"
					scope="col"
					role="columnheader"
					class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
					aria-sort="none"
				>
					№
				</th>
				<th
					id="col-name"
					scope="col"
					role="columnheader"
					class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
					aria-sort="none"
				>
					Имя клиента
				</th>
				<th
					id="col-region"
					scope="col"
					role="columnheader"
					class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
					aria-sort="none"
				>
					Регион
				</th>
				<th
					id="col-contract"
					scope="col"
					role="columnheader"
					class="hidden px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 lg:table-cell dark:text-gray-400"
					aria-sort="none"
				>
					Номер договора
				</th>
				<th
					id="col-agent"
					scope="col"
					role="columnheader"
					class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
					aria-sort="none"
				>
					Агент
				</th>

				<th
					id="col-rate"
					scope="col"
					role="columnheader"
					class="hidden px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 xl:table-cell dark:text-gray-400"
					aria-sort="none"
				>
					Ставка агенту
				</th>

				<th id="col-actions" scope="col" role="columnheader" class="relative px-6 py-3">
					<span class="sr-only">Действия</span>
				</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
			{#if isLoading}
				<tr>
					<td colspan="7" class="px-6 py-4 text-center" role="cell">
						<div class="flex justify-center" aria-label="Загрузка данных проектов">
							<div
								class="h-6 w-6 animate-spin rounded-full border-b-2 border-indigo-600"
								aria-hidden="true"
							></div>
						</div>
						<span class="sr-only">Загрузка данных проектов, пожалуйста подождите...</span>
					</td>
				</tr>
			{:else if projects.length === 0}
				<tr>
					<td colspan="7" class="px-6 py-4" role="cell">
						<EmptyState
							type={hasSearched ? 'no-results' : 'no-data'}
							title={hasSearched ? 'Проекты не найдены' : 'Проекты отсутствуют'}
							message={hasSearched
								? 'Не найдено проектов, соответствующих критериям поиска.'
								: 'В системе пока нет зарегистрированных проектов.'}
							searchTerm={hasSearched ? searchTerm : ''}
							iconType={hasSearched ? 'search' : 'users'}
						/>
					</td>
				</tr>
			{:else}
				{#each projects as project, index (project.id + '-' + project.status + '-' + updateCounter)}
					<tr
						class="transition-colors duration-150 ease-in-out hover:bg-gray-50 dark:hover:bg-gray-800"
						aria-rowindex={index + 2}
					>
						<td
							class="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400"
							role="cell"
							headers="col-number"
						>
							{index + 1}
						</td>
						<td
							class="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white"
							role="cell"
							headers="col-name"
						>
							{project.value || ' - '}
						</td>
						<td
							class="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white"
							role="cell"
							headers="col-region"
						>
							{project.region || ' - '}
						</td>
						<td
							class="hidden whitespace-nowrap px-6 py-4 text-sm text-gray-900 lg:table-cell dark:text-white"
							role="cell"
							headers="col-contract"
						>
							{project.contract_name || ' - '}
						</td>
						<td
							class="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white"
							role="cell"
							headers="col-agent"
						>
							{getAgentDisplay(project.agent)}
						</td>

						<td
							class="hidden whitespace-nowrap px-6 py-4 text-sm text-gray-900 xl:table-cell dark:text-white"
							role="cell"
							headers="col-rate"
						>
							{formatAgentRate(project.agent_percentage, 'percentage')}
						</td>

						<td
							class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6"
							role="cell"
							headers="col-actions"
						>
							<ActionButtons
								agent={project}
								onBan={onEditProject}
								onDelete={onDeleteProject}
								onView={onViewProject}
								{isLoading}
								projectMode={true}
							/>
						</td>
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>

	<!-- Table description for screen readers -->
	<div id={tableDescriptionId} class="sr-only"></div>
</div>

<!-- Mobile Card View (visible on mobile only) -->
<div class="md:hidden">
	{#if isLoading}
		<div class="flex justify-center py-8">
			<div class="h-6 w-6 animate-spin rounded-full border-b-2 border-indigo-600"></div>
		</div>
	{:else if projects.length === 0}
		<div class="px-4 py-6">
			<EmptyState
				type={hasSearched ? 'no-results' : 'no-data'}
				title={hasSearched ? 'Проекты не найдены' : 'Проекты отсутствуют'}
				message={hasSearched
					? 'Не найдено проектов, соответствующих критериям поиска.'
					: 'В системе пока нет зарегистрированных проектов.'}
				searchTerm={hasSearched ? searchTerm : ''}
				iconType={hasSearched ? 'search' : 'users'}
			/>
		</div>
	{:else}
		<div class="space-y-4" role="list" aria-label="Список проектов">
			{#each projects as project, index (project.id + '-' + project.status + '-' + updateCounter)}
				<div
					class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
					role="listitem"
					aria-labelledby="project-{project.id}-name"
					aria-describedby="project-{project.id}-details"
				>
					<!-- Project Header -->
					<div class="mb-3 flex items-start justify-between">
						<div class="min-w-0 flex-1">
							<div class="mb-1 flex items-center gap-2">
								<span
									class="inline-flex items-center rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400"
									aria-label="Номер по порядку {index + 1}"
								>
									№ {index + 1}
								</span>
							</div>
							<h3
								id="project-{project.id}-name"
								class="truncate text-sm font-medium text-gray-900 dark:text-white"
							>
								{project.value || ' - '}
							</h3>
							<p class="truncate text-sm text-gray-500 dark:text-gray-400">
								{project.region || ' - '}
							</p>
						</div>
						<div class="ml-3 flex-shrink-0">
							<span
								class="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200"
								aria-label="ID проекта {project.id}"
							>
								ID: {project.id}
							</span>
						</div>
					</div>

					<!-- Project Details Grid -->
					<dl id="project-{project.id}-details" class="mb-4 grid grid-cols-1 gap-3">
						<div>
							<dt
								class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
							>
								Номер договора
							</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">
								{project.contract_name || ' - '}
							</dd>
						</div>
						<div>
							<dt
								class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
							>
								Агент
							</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">
								{getAgentDisplay(project.agent)}
							</dd>
						</div>
						<div>
							<dt
								class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
							>
								Ставка агенту
							</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">
								{formatAgentRate(project.agent_percentage, 'percentage')}
							</dd>
						</div>
					</dl>

					<!-- Action Buttons -->
					<div class="flex justify-end border-t border-gray-200 pt-3 dark:border-gray-600">
						<ActionButtons
							agent={project}
							onBan={onEditProject}
							onDelete={onDeleteProject}
							onView={onViewProject}
							{isLoading}
							mobile={true}
							projectMode={true}
						/>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Tablet Horizontal Scroll View (visible on small tablets) -->
<div class="hidden sm:block md:hidden">
	<div class="overflow-x-auto">
		<div class="inline-block min-w-full align-middle">
			<div class="overflow-hidden rounded-lg shadow ring-1 ring-black ring-opacity-5">
				<table class="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
					<thead class="bg-gray-50 dark:bg-gray-800">
						<tr>
							<th
								scope="col"
								class="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
							>
								№
							</th>
							<th
								scope="col"
								class="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
							>
								Название
							</th>
							<th
								scope="col"
								class="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
							>
								Регион
							</th>
							<th
								scope="col"
								class="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
							>
								Агент
							</th>
							<th scope="col" class="relative whitespace-nowrap px-4 py-3">
								<span class="sr-only">Действия</span>
							</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
						{#if isLoading}
							<tr>
								<td colspan="5" class="px-4 py-4 text-center">
									<div class="flex justify-center">
										<div
											class="h-6 w-6 animate-spin rounded-full border-b-2 border-indigo-600"
										></div>
									</div>
								</td>
							</tr>
						{:else if projects.length === 0}
							<tr>
								<td colspan="5" class="px-4 py-4">
									<EmptyState
										type={hasSearched ? 'no-results' : 'no-data'}
										title={hasSearched ? 'Проекты не найдены' : 'Проекты отсутствуют'}
										message={hasSearched
											? 'Не найдено проектов, соответствующих критериям поиска.'
											: 'В системе пока нет зарегистрированных проектов.'}
										searchTerm={hasSearched ? searchTerm : ''}
										iconType={hasSearched ? 'search' : 'users'}
									/>
								</td>
							</tr>
						{:else}
							{#each projects as project, index (project.id + '-' + project.status + '-' + updateCounter)}
								<tr class="hover:bg-gray-50 dark:hover:bg-gray-800">
									<td class="whitespace-nowrap px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
										{index + 1}
									</td>
									<td
										class="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900 dark:text-white"
									>
										{project.value || ' - '}
									</td>
									<td class="whitespace-nowrap px-4 py-4 text-sm text-gray-900 dark:text-white">
										{project.region || ' - '}
									</td>
									<td class="whitespace-nowrap px-4 py-4 text-sm text-gray-900 dark:text-white">
										{getAgentDisplay(project.agent)}
									</td>
									<td
										class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium"
									>
										<ActionButtons
											agent={project}
											onBan={onEditProject}
											onDelete={onDeleteProject}
											onView={onViewProject}
											{isLoading}
											compact={true}
											projectMode={true}
										/>
									</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>
		</div>
	</div>
</div>
