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
		onAcceptProject,
		updateCounter = 0,
		searchTerm = '',
		hasSearched = false,
		currentUserId = null
	} = $props();

	let acceptingProjectId = $state(null);

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

	// Get status display text
	function getStatusDisplay(status) {
		if (!status || !status.value) return 'Не указан';
		return status.value;
	}

	// Truncate text to specified length
	function truncateText(text, maxLength = 35) {
		if (!text) return ' - ';
		if (text.length <= maxLength) return text;
		return text.substring(0, maxLength) + '...';
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

	// Check if project has been accepted by any user
	function isProjectAccepted(project) {
		return project.users && project.users.length > 0;
	}

	// Get the user who accepted the project (for display)
	function getAcceptedByUser(project) {
		if (!project.users || project.users.length === 0) return null;
		return project.users[0]; // Return first user who accepted
	}

	// Check if project can be accepted (only new projects can be accepted)
	function canAcceptProject(project) {
		// Show accept button only if:
		// 1. Project is not accepted yet
		// 2. Project status is "Новый проект" (slug: 'new-project')
		return !isProjectAccepted(project) && project.status && project.status.slug === 'new-project';
	}

	// Handle accept project
	async function handleAcceptProject(projectId, event) {
		// Prevent event bubbling to avoid triggering other buttons
		if (event) {
			event.stopPropagation();
			event.preventDefault();
		}

		if (acceptingProjectId) return; // Prevent multiple simultaneous requests

		if (!currentUserId) {
			console.error('No current user ID available');
			return;
		}

		try {
			acceptingProjectId = projectId;

			// Call parent callback which handles the actual API call
			if (onAcceptProject) {
				await onAcceptProject(projectId);
			}
		} catch (error) {
			console.error('Failed to accept project:', error);
		} finally {
			acceptingProjectId = null;
		}
	}
</script>

<!-- Live region for screen reader announcements -->
<div id="{tableId}-announcements" class="sr-only" aria-live="polite" aria-atomic="true">
	<!-- Dynamic table update announcements -->
</div>

<!-- Desktop Table View (hidden on mobile) -->
<div class="ring-opacity-5 hidden overflow-hidden shadow ring-1 ring-black md:block md:rounded-lg">
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
					class="px-6 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
					aria-sort="none"
				>
					№
				</th>
				<th
					id="col-name"
					scope="col"
					role="columnheader"
					class="px-6 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
					aria-sort="none"
				>
					Проект
				</th>
				<th
					id="col-region"
					scope="col"
					role="columnheader"
					class="px-6 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
					aria-sort="none"
				>
					Адрес объекта
				</th>
				<th
					id="col-contract"
					scope="col"
					role="columnheader"
					class="hidden px-6 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase lg:table-cell dark:text-gray-400"
					aria-sort="none"
				>
					Номер
				</th>

				<th
					id="col-status"
					scope="col"
					role="columnheader"
					class="px-6 py-3 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
					aria-sort="none"
				>
					Статус
				</th>
				<th
					id="col-accept"
					scope="col"
					role="columnheader"
					class="px-6 py-3 text-center text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
					aria-sort="none"
				>
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
							class="px-6 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400"
							role="cell"
							headers="col-number"
						>
							{index + 1}
						</td>
						<td
							class="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900 dark:text-white"
							role="cell"
							headers="col-name"
						>
							{project.value || ' - '}
						</td>
						<td
							class="px-6 py-4 text-sm whitespace-nowrap text-gray-900 dark:text-white"
							role="cell"
							headers="col-region"
							title={project.region || ''}
						>
							{truncateText(project.region)}
						</td>
						<td
							class="hidden px-6 py-4 text-sm whitespace-nowrap text-gray-900 lg:table-cell dark:text-white"
							role="cell"
							headers="col-contract"
						>
							{project.contract_name || ' - '}
						</td>
						<td
							class="px-6 py-4 text-sm whitespace-nowrap text-gray-900 dark:text-white"
							role="cell"
							headers="col-status"
						>
							<StatusBadge status={project.status} />
						</td>

						<td class="px-6 py-4 text-center whitespace-nowrap" role="cell" headers="col-accept">
							<!-- TODO: Temporarily disabled - will be fixed later -->
							<!-- {#if canAcceptProject(project)}
								<button
									type="button"
									onclick={(event) => handleAcceptProject(project.id, event)}
									disabled={acceptingProjectId === project.id}
									class="inline-flex items-center rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
									aria-label="Принять проект {project.value}"
								>
									{#if acceptingProjectId === project.id}
										<svg
											class="-ml-1 mr-2 h-4 w-4 animate-spin text-white"
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
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
											class="-ml-1 mr-2 h-4 w-4 text-white"
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											stroke-width="2"
										>
											<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"
											></path>
										</svg>
									{/if}
									Принять
								</button>
							{/if} -->
						</td>

						<td
							class="relative py-4 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-6"
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
	{#if projects.length === 0}
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
							<p
								class="truncate text-sm text-gray-500 dark:text-gray-400"
								title={project.region || ''}
							>
								{truncateText(project.region)}
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
								class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
							>
								Номер
							</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">
								{project.contract_name || ' - '}
							</dd>
						</div>
						<div>
							<dt
								class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
							>
								Статус
							</dt>
							<dd class="mt-1">
								<StatusBadge status={project.status} />
							</dd>
						</div>
					</dl>

					<!-- Action Buttons -->
					<div
						class="flex items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-600"
					>
						<!-- TODO: Temporarily disabled - will be fixed later -->
						<!-- {#if canAcceptProject(project)}
							<button
								type="button"
								onclick={(event) => handleAcceptProject(project.id, event)}
								disabled={acceptingProjectId === project.id}
								class="inline-flex items-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
								aria-label="Принять проект {project.value}"
							>
								{#if acceptingProjectId === project.id}
									<svg
										class="-ml-1 mr-2 h-4 w-4 animate-spin text-white"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
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
										class="-ml-1 mr-2 h-4 w-4 text-white"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										stroke-width="2"
									>
										<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
									</svg>
								{/if}
								Принять
							</button>
						{/if} -->
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
			<div class="ring-opacity-5 overflow-hidden rounded-lg shadow ring-1 ring-black">
				<table class="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
					<thead class="bg-gray-50 dark:bg-gray-800">
						<tr>
							<th
								scope="col"
								class="px-4 py-3 text-left text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
							>
								№
							</th>
							<th
								scope="col"
								class="px-4 py-3 text-left text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
							>
								Название
							</th>
							<th
								scope="col"
								class="px-4 py-3 text-left text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
							>
								Адрес объекта
							</th>

							<th scope="col" class="relative px-4 py-3 whitespace-nowrap">
								<span class="sr-only">Действия</span>
							</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-950">
						{#if isLoading}
							<tr>
								<td colspan="4" class="px-4 py-4 text-center">
									<div class="flex justify-center">
										<div
											class="h-6 w-6 animate-spin rounded-full border-b-2 border-indigo-600"
										></div>
									</div>
								</td>
							</tr>
						{:else if projects.length === 0}
							<tr>
								<td colspan="4" class="px-4 py-4">
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
									<td class="px-4 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
										{index + 1}
									</td>
									<td
										class="px-4 py-4 text-sm font-medium whitespace-nowrap text-gray-900 dark:text-white"
									>
										{project.value || ' - '}
									</td>
									<td
										class="px-4 py-4 text-sm whitespace-nowrap text-gray-900 dark:text-white"
										title={project.region || ''}
									>
										{truncateText(project.region)}
									</td>

									<td
										class="relative py-4 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap"
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
