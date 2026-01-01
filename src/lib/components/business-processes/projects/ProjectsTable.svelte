<script>
	import StatusBadge from '$lib/components/common/StatusBadge.svelte';
	import ProjectStatusBadge from './ProjectStatusBadge.svelte';
	import ActionButtons from '$lib/components/business-processes/actions/ActionButtons.svelte';
	import EmptyState from '$lib/components/common/EmptyState.svelte';

	let {
		projects = [],
		projectStatuses = [],
		isLoading = false,
		onEditProject,
		onDeleteProject,
		onViewProject,
		onAcceptProject,
		onStatusChange,
		updateCounter = 0,
		searchTerm = '',
		hasSearched = false,
		currentUserId = null,
		sortColumn = null,
		sortDirection = 'asc',
		onSort
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
<div class="ring-opacity-5 hidden overflow-visible shadow ring-1 ring-black md:block md:rounded-lg">
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
		<thead class="bg-gray-100 dark:bg-gray-900">
			<tr>
				<th
					id="col-number"
					scope="col"
					role="columnheader"
					class="px-6 py-4 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
					aria-sort="none"
				>
					№
				</th>
				<th
					id="col-contract"
					scope="col"
					role="columnheader"
					class="hidden px-6 py-4 text-left text-xs font-medium tracking-wide text-gray-500 uppercase lg:table-cell dark:text-gray-400"
					aria-sort="none"
				>
					Проект
				</th>
				<th
					id="col-name"
					scope="col"
					role="columnheader"
					class="px-6 py-4 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
					aria-sort="none"
				>
					Имя клиента
				</th>
				<th
					id="col-region"
					scope="col"
					role="columnheader"
					class="px-6 py-4 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
					aria-sort="none"
				>
					Адрес объекта
				</th>
				<th
					id="col-created"
					scope="col"
					role="columnheader"
					class="px-6 py-4 text-left text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
					aria-sort="none"
				>
					Дата создания
				</th>

				<th
					id="col-status"
					scope="col"
					role="columnheader"
					class="px-6 py-4 text-left text-xs font-medium tracking-wide uppercase dark:text-gray-400"
					aria-sort={sortColumn === 'status'
						? sortDirection === 'asc'
							? 'ascending'
							: 'descending'
						: 'none'}
				>
					<button
						type="button"
						onclick={() => onSort && onSort('status')}
						class="group inline-flex items-center gap-2 text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
					>
						Статус
						<span class="flex flex-col">
							{#if sortColumn === 'status'}
								{#if sortDirection === 'asc'}
									<!-- Up arrow (ascending) -->
									<svg
										class="h-3 w-3 text-gray-700 dark:text-gray-200"
										fill="currentColor"
										viewBox="0 0 20 20"
									>
										<path
											fill-rule="evenodd"
											d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
											clip-rule="evenodd"
										/>
									</svg>
								{:else}
									<!-- Down arrow (descending) -->
									<svg
										class="h-3 w-3 text-gray-700 dark:text-gray-200"
										fill="currentColor"
										viewBox="0 0 20 20"
									>
										<path
											fill-rule="evenodd"
											d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
											clip-rule="evenodd"
										/>
									</svg>
								{/if}
							{:else}
								<!-- Neutral arrows (not sorted) -->
								<svg
									class="h-3 w-3 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 dark:text-gray-500"
									fill="currentColor"
									viewBox="0 0 20 20"
								>
									<path
										d="M5 12a1 1 0 102 0V6.414l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L5 6.414V12zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z"
									/>
								</svg>
							{/if}
						</span>
					</button>
				</th>
				<th
					id="col-accept"
					scope="col"
					role="columnheader"
					class="px-6 py-4 text-center text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
					aria-sort="none"
				>
				</th>
				<th id="col-actions" scope="col" role="columnheader" class="relative px-6 py-3">
					<span class="sr-only">Действия</span>
				</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-950">
			{#if isLoading}
				<tr>
					<td colspan="8" class="px-6 py-4 text-center" role="cell">
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
					<td colspan="8" class="px-6 py-4" role="cell">
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
							class="px-6 py-5 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400"
							role="cell"
							headers="col-number"
						>
							{project.sequentialNumber || index + 1}
						</td>
						<td
							class="hidden px-6 py-5 text-sm whitespace-nowrap text-gray-900 lg:table-cell dark:text-white"
							role="cell"
							headers="col-contract"
						>
							{project.value || ' - '}
						</td>
						<td
							class="px-6 py-5 text-sm font-medium whitespace-nowrap text-gray-900 dark:text-white"
							role="cell"
							headers="col-name"
						>
							{project.client?.name || ' - '}
						</td>
						<td
							class="px-6 py-5 text-sm whitespace-nowrap text-gray-900 dark:text-white"
							role="cell"
							headers="col-region"
							title={project.region || ''}
						>
							{truncateText(project.region)}
						</td>
						<td
							class="px-6 py-5 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400"
							role="cell"
							headers="col-created"
						>
							{formatDate(project.created_at)}
						</td>
						<td
							class="px-6 py-5 text-sm whitespace-nowrap text-gray-900 dark:text-white"
							role="cell"
							headers="col-status"
						>
							<ProjectStatusBadge
								{project}
								{projectStatuses}
								onStatusChange={(updatedProject) => onStatusChange && onStatusChange(updatedProject)}
							/>
						</td>

						<td class="px-6 py-5 text-center whitespace-nowrap" role="cell" headers="col-accept">
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
							class="relative py-3 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-6"
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
		<div class="px-3 py-6">
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
						<div class="ml-3 flex flex-shrink-0 flex-col items-end gap-2">
							<span
								class="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200"
								aria-label="Номер проекта {project.sequentialNumber || index + 1}"
							>
								№ {project.sequentialNumber || index + 1}
							</span>
							<ProjectStatusBadge
								{project}
								{projectStatuses}
								onStatusChange={(updatedProject) => onStatusChange && onStatusChange(updatedProject)}
							/>
						</div>
					</div>

					<!-- Project Details Grid -->
					<dl id="project-{project.id}-details" class="mb-4 grid grid-cols-2 gap-3">
						<div class="col-span-2">
							<dt
								class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
							>
								Проект
							</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">
								{project.value || ' - '}
							</dd>
						</div>
						<div class="col-span-2">
							<dt
								class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400"
							>
								Имя клиента
							</dt>
							<dd class="mt-1 text-sm text-gray-900 dark:text-white">
								{project.client?.name || ' - '}
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
					<thead class="bg-gray-100 dark:bg-gray-900">
						<tr>
							<th
								scope="col"
								class="px-3 py-4 text-left text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
							>
								№
							</th>
							<th
								scope="col"
								class="px-3 py-3 text-left text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
							>
								Имя клиента
							</th>
							<th
								scope="col"
								class="px-3 py-3 text-left text-xs font-medium tracking-wide whitespace-nowrap text-gray-500 uppercase dark:text-gray-400"
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
								<td colspan="4" class="px-3 py-3 text-center">
									<div class="flex justify-center">
										<div
											class="h-6 w-6 animate-spin rounded-full border-b-2 border-indigo-600"
										></div>
									</div>
								</td>
							</tr>
						{:else if projects.length === 0}
							<tr>
								<td colspan="4" class="px-3 py-3">
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
									<td class="px-3 py-5 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
										{project.sequentialNumber || index + 1}
									</td>
									<td
										class="px-3 py-5 text-sm font-medium whitespace-nowrap text-gray-900 dark:text-white"
									>
										{project.client?.name || ' - '}
									</td>
									<td
										class="px-3 py-5 text-sm whitespace-nowrap text-gray-900 dark:text-white"
										title={project.region || ''}
									>
										{truncateText(project.region)}
									</td>

									<td
										class="relative py-3 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap"
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
