<script>
	import {
		ProjectsTable,
		ProjectEditModal,
		ProjectViewModal,
		SearchBar,
		ConfirmationModal,
		ErrorBoundary,
		TableSkeleton,
		RefreshButton
	} from '$lib';
	import Pagination from '$lib/components/common/Pagination.svelte';
	import {
		toasts,
		addSuccessToast,
		addErrorToast,
		addInfoToast,
		handleApiError,
		retryOperation,
		clearAllToasts
	} from '$lib/utils/toastStore.js';
	import { onMount } from 'svelte';
	import {
		updateProject,
		deleteProject,
		refreshProjects,
		acceptProject
	} from '$lib/api/projects.js';
	import { getProjectStatuses } from '$lib/api/projectStatuses.js';
	import ProtectedRoute from '$lib/components/common/ProtectedRoute.svelte';
	import { authState } from '$lib/state/auth.svelte.js';
	import { newProjectsState } from '$lib/state/newProjectsCount.svelte.js';

	let { data } = $props();

	// Search state management
	let searchTerm = $state('');

	// Pagination state
	let currentPage = $state(1);
	const itemsPerPage = 10;

	// Action state management
	let isActionLoading = $state(false);
	let showConfirmModal = $state(false);
	let confirmAction = $state(null);

	// Edit modal state management
	let showEditModal = $state(false);
	let editingProject = $state(null);

	// View modal state management
	let showViewModal = $state(false);
	let viewingProject = $state(null);

	// Error boundary state
	let hasError = $state(false);
	let errorBoundaryError = $state(null);

	// Loading state for data refresh
	let isRefreshing = $state(false);

	// Local projects state for updates (will be initialized from streamed data)
	let localProjects = $state([]);

	// Local state for accepted projects (to show immediately in modal)
	let acceptedProjects = $state(new Map()); // Map<projectId, {user, acceptedAt}>

	// Project statuses state
	let projectStatuses = $state([]);
	let curatorAcceptedStatusId = $state(null);
	let isLoadingStatuses = $state(false);

	// Force update counter for reactivity
	let updateCounter = $state(0);

	// Check for server-side load errors (will be set from streamed data)
	let loadError = $state(null);

	// Sort state management
	let sortColumn = $state(null);
	let sortDirection = $state('asc'); // 'asc' or 'desc'

	// Computed filteredProjects reactive statement
	let filteredProjects = $derived.by(() => {
		let filtered = localProjects;

		// Apply search filter
		if (searchTerm.trim()) {
			const term = searchTerm.toLowerCase().trim();
			filtered = filtered.filter((project) => {
				const name = (project.value || '').toLowerCase();
				const region = (project.region || '').toLowerCase();
				const contractNumber = (project.contract_number || '').toLowerCase();
				const agentName = (project.agent?.name || '').toLowerCase();
				const agentEmail = (project.agent?.email || '').toLowerCase();

				return (
					name.includes(term) ||
					region.includes(term) ||
					contractNumber.includes(term) ||
					agentName.includes(term) ||
					agentEmail.includes(term)
				);
			});
		}

		// Apply sorting
		if (sortColumn) {
			filtered = [...filtered].sort((a, b) => {
				let compareResult = 0;

				if (sortColumn === 'status') {
					// Sort by status sort_order if available, otherwise by status value
					const aOrder = a.status?.sort_order ?? 999;
					const bOrder = b.status?.sort_order ?? 999;
					const aValue = a.status?.value ?? '';
					const bValue = b.status?.value ?? '';

					if (aOrder !== bOrder) {
						compareResult = aOrder - bOrder;
					} else {
						compareResult = aValue.localeCompare(bValue, 'ru');
					}
				}

				return sortDirection === 'asc' ? compareResult : -compareResult;
			});
		}

		return filtered;
	});

	// Get paginated projects
	let paginatedProjects = $derived.by(() => {
		const startIndex = (currentPage - 1) * itemsPerPage;
		const endIndex = startIndex + itemsPerPage;
		return filteredProjects.slice(startIndex, endIndex);
	});

	// Reset to first page when filters change
	$effect(() => {
		searchTerm;
		sortColumn;
		sortDirection;
		currentPage = 1;
	});

	// Handle sort
	function handleSort(column) {
		if (sortColumn === column) {
			// Toggle direction if same column
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			// Set new column with ascending direction
			sortColumn = column;
			sortDirection = 'asc';
		}
	}

	// Search handler function
	function handleSearch(term) {
		searchTerm = term;
	}

	// Edit project handler
	function handleEditProject(project) {
		editingProject = project;
		showEditModal = true;
		clearAllToasts();
	}

	// View project handler
	function handleViewProject(project) {
		viewingProject = project;
		showViewModal = true;
		clearAllToasts();
	}

	// Delete project handler with confirmation
	function handleDeleteProject(project) {
		confirmAction = {
			type: 'delete',
			project: project,
			title: 'Удалить проект',
			message: `Вы уверены, что хотите НАВСЕГДА удалить проект "${project.value}"? Это действие нельзя отменить. Все данные проекта будут потеряны.`,
			confirmText: 'Удалить навсегда',
			isDestructive: true
		};
		showConfirmModal = true;
		clearAllToasts();
	}

	// Execute confirmed action with retry mechanism
	async function confirmActionHandler() {
		if (!confirmAction) return;

		isActionLoading = true;

		try {
			const { type, project } = confirmAction;

			// Use retry mechanism for critical operations
			await retryOperation(
				async () => {
					if (type === 'delete') {
						await deleteProject(project.id);
						removeProjectFromList(project.id);
						addSuccessToast(`Проект "${project.value}" успешно удален.`);
						// Refresh new projects count in sidebar (in case deleted project was new)
						await newProjectsState.refresh();
					}
				},
				2,
				1000
			); // 2 retries with 1 second delay
		} catch (error) {
			// Error is already handled by handleApiError in retryOperation
			console.error('Action failed after retries:', error);
		} finally {
			isActionLoading = false;
			showConfirmModal = false;
			confirmAction = null;
		}
	}

	// Cancel action
	function cancelAction() {
		showConfirmModal = false;
		confirmAction = null;
		isActionLoading = false;
	}

	// Save project changes
	async function handleSaveProject(updatedProjectData) {
		isActionLoading = true;

		try {
			// Use retry mechanism for critical operations
			await retryOperation(
				async () => {
					const updatedProject = await updateProject(updatedProjectData);
					updateProjectInList(updatedProject);
					addSuccessToast(`Проект "${updatedProject.value}" успешно обновлен.`);
					// Refresh new projects count in sidebar (in case status changed)
					await newProjectsState.refresh();
				},
				2,
				1000
			); // 2 retries with 1 second delay
		} catch (error) {
			// Error is already handled by handleApiError in retryOperation
			console.error('Project update failed after retries:', error);
		} finally {
			isActionLoading = false;
			showEditModal = false;
			editingProject = null;
		}
	}

	// Cancel edit project
	function handleCancelEditProject() {
		showEditModal = false;
		editingProject = null;
		isActionLoading = false;
	}

	// Cancel view project
	function handleCancelViewProject() {
		showViewModal = false;
		viewingProject = null;
	}

	// Accept project handler
	async function handleAcceptProject(projectId) {
		if (!authState.user?.id) {
			addErrorToast('Ошибка: пользователь не аутентифицирован');
			return;
		}

		// Hardcoded status ID for "Принят куратором"
		const CURATOR_ACCEPTED_STATUS_ID = '01K7HRKV20QE6K37YY18D206NQ';

		try {
			await retryOperation(
				async () => {
					console.log(
						'🔥 Calling acceptProject with hardcoded statusId:',
						CURATOR_ACCEPTED_STATUS_ID
					);
					await acceptProject(projectId, authState.user.id, CURATOR_ACCEPTED_STATUS_ID);

					// Immediately add to local accepted projects state
					acceptedProjects.set(projectId, {
						user: {
							id: authState.user.id,
							name: authState.user.name,
							email: authState.user.email
						},
						acceptedAt: new Date().toISOString()
					});

					addSuccessToast('Вы успешно приняли проект');
					// Silently refresh data in background without showing loading state
					await silentRefreshData();
					// Refresh new projects count in sidebar
					await newProjectsState.refresh();
				},
				2,
				1000
			);
		} catch (error) {
			console.error('Accept project failed after retries:', error);
			addErrorToast('Не удалось принять проект');
		}
	}

	// Remove project from local state after deletion
	function removeProjectFromList(projectId) {
		localProjects = localProjects.filter((project) => project.id !== projectId);
		updateCounter++;
	}

	// Update project in local state after editing
	function updateProjectInList(updatedProject) {
		localProjects = localProjects.map((project) =>
			project.id === updatedProject.id
				? { ...updatedProject, sequentialNumber: project.sequentialNumber } // Preserve sequentialNumber
				: project
		);
		updateCounter++;
	}

	// Handle inline status change from table
	async function handleStatusChange(updatedProject) {
		try {
			// Update local state immediately
			updateProjectInList(updatedProject);
			// Refresh new projects count in sidebar (in case status changed)
			await newProjectsState.refresh();
		} catch (error) {
			console.error('Failed to handle status change:', error);
		}
	}

	// Refresh data from server
	async function refreshData(isInitialLoad = false) {
		isRefreshing = true;
		try {
			const rawProjects = await refreshProjects();

			// Sort projects by created_at in descending order (newest first)
			const sortedProjects = [...rawProjects].sort((a, b) => {
				const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
				const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
				return dateB - dateA;
			});

			// Add sequential numbers to projects (1, 2, 3, ...)
			const projects = sortedProjects.map((project, index) => ({
				...project,
				sequentialNumber: index + 1
			}));

			// Debug: log first 3 projects from refresh
			console.log(
				'Refreshed projects (first 3):',
				projects.slice(0, 3).map((p) => ({
					id: p.id,
					value: p.value,
					sequentialNumber: p.sequentialNumber,
					created_at: p.created_at
				}))
			);
			localProjects = projects;
			loadError = null;

			// Clear local accepted projects state when data is refreshed from server
			// as the server data now contains the actual accepted users
			acceptedProjects.clear();

			// Only show success message for manual refresh, not initial load
			if (!isInitialLoad) {
				addSuccessToast('Данные успешно обновлены');
			}
		} catch (error) {
			handleApiError(
				error,
				isInitialLoad ? 'Не удалось загрузить данные' : 'Не удалось обновить данные'
			);
		} finally {
			isRefreshing = false;
		}
	}

	// Silent refresh without showing loading state (for background updates after actions)
	async function silentRefreshData() {
		try {
			const rawProjects = await refreshProjects();

			// Sort projects by created_at in descending order (newest first)
			const sortedProjects = [...rawProjects].sort((a, b) => {
				const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
				const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
				return dateB - dateA;
			});

			// Add sequential numbers to projects (1, 2, 3, ...)
			const projects = sortedProjects.map((project, index) => ({
				...project,
				sequentialNumber: index + 1
			}));

			localProjects = projects;
			loadError = null;

			// Clear local accepted projects state when data is refreshed from server
			// as the server data now contains the actual accepted users
			acceptedProjects.clear();
		} catch (error) {
			// Silent refresh - don't show error messages, just log
			console.error('Silent refresh failed:', error);
		}
	}

	// Handle error boundary errors
	function handleErrorBoundaryError(error) {
		hasError = true;
		errorBoundaryError = error;
		handleApiError(error, 'Критическая ошибка');
	}

	// Retry from error boundary
	async function retryFromErrorBoundary() {
		hasError = false;
		errorBoundaryError = null;
		await refreshData();
	}

	// Derived state that transforms streamed data without mutation
	function getProcessedProjects(projectsData) {
		if (!projectsData || !projectsData.projects) {
			return [];
		}

		const projects = [...projectsData.projects];
		// Debug: log first 3 projects to verify sequentialNumber
		console.log(
			'Processed projects (first 3):',
			projects.slice(0, 3).map((p) => ({
				id: p.id,
				value: p.value,
				sequentialNumber: p.sequentialNumber,
				created_at: p.created_at
			}))
		);
		return projects;
	}

	// Load project statuses immediately
	async function loadProjectStatuses() {
		isLoadingStatuses = true;
		try {
			projectStatuses = await getProjectStatuses();
			// Find "Принят куратором" status
			const curatorStatus = projectStatuses.find((s) => s.slug === 'curator-processing');
			if (curatorStatus) {
				curatorAcceptedStatusId = curatorStatus.id;
				console.log('✅ Found curator-processing status:', curatorStatus);
			} else {
				console.warn('⚠️ curator-processing status not found in statuses');
			}
		} catch (error) {
			console.error('Failed to load project statuses:', error);
			addErrorToast('Не удалось загрузить статусы проектов');
		} finally {
			isLoadingStatuses = false;
		}
	}

	// Handle initial load
	onMount(async () => {
		// Load project statuses immediately on page load
		await loadProjectStatuses();

		// Load data if we have empty initial data (server-side data loading was disabled)
		if (!localProjects.length && !loadError) {
			await refreshData(true);
		}
	});
</script>

<ProtectedRoute>
	{#snippet children()}
		<ErrorBoundary
			{hasError}
			error={errorBoundaryError}
			onError={handleErrorBoundaryError}
			onRetry={retryFromErrorBoundary}
			fallbackTitle="Projects Page Error"
			fallbackMessage="An error occurred while loading the projects page. This might be due to a network issue or server problem."
			showDetails={true}
		>
			<!-- Streamed Projects Data with SSR -->
			{#await data.projectsData}
				<!-- Loading state: Show skeleton -->
				<TableSkeleton columns={8} />
			{:then projectsData}
				<!-- Success state: Show data -->
				{@const processedProjects = getProcessedProjects(projectsData)}

				<!-- Show skeleton during initial data refresh when no data is available -->
				{#if isRefreshing && localProjects.length === 0}
					<TableSkeleton columns={8} />
				{:else}

				<!-- Update local state only once when data arrives -->
				{#if localProjects.length === 0 && processedProjects.length > 0}
					{((localProjects = processedProjects), '')}
				{/if}

				<!-- Set load error if present -->
				{#if projectsData.error && !loadError}
					{((loadError = projectsData), '')}
				{/if}

				<!-- Skip link for keyboard navigation -->
				<a
					href="#main-content"
					class="sr-only z-50 rounded-md bg-indigo-600 px-4 py-2 text-white focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
				>
					Перейти к основному контенту
				</a>

				<div class="min-h-screen bg-gray-50 dark:bg-gray-950">
					<div class="px-4 py-7 sm:px-6 lg:px-7">
						<div class="mx-auto ">
							<!-- Page landmark -->
							<main id="main-content" aria-labelledby="page-title">
								<!-- Header with Search and Refresh Button -->
								<div class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
									<div class="flex flex-1 items-center justify-start">
										<div class="w-full max-w-md">
											<SearchBar bind:value={searchTerm} onSearch={handleSearch} />
										</div>
									</div>
									<div class="flex items-center justify-end space-x-3">
										<!-- Refresh Button -->
										<RefreshButton
											{isRefreshing}
											onclick={(event) => {
												event.stopPropagation();
												refreshData();
											}}
										/>
									</div>
								</div>
								
								<!-- Hidden H1 for accessibility -->
								<h1 id="page-title" class="sr-only">
									Проекты
								</h1>

								<!-- Separator -->
								<div class="my-4 border-t border-gray-200 dark:border-gray-700"></div>

								<!-- Load Error Banner -->
								{#if loadError && loadError.canRetry}
									<div class="mb-4 rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/20">
										<div class="flex">
											<div class="flex-shrink-0">
												<svg
													class="h-5 w-5 text-yellow-400"
													viewBox="0 0 20 20"
													fill="currentColor"
													aria-hidden="true"
												>
													<path
														fill-rule="evenodd"
														d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
														clip-rule="evenodd"
													/>
												</svg>
											</div>
											<div class="ml-3">
												<h3 class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
													Ошибка загрузки данных
												</h3>
												<div class="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
													<p>{loadError.message}</p>
												</div>
												<div class="mt-4">
													<div class="-mx-2 -my-1.5 flex">
														<button
															type="button"
															onclick={refreshData}
															disabled={isRefreshing}
															class="rounded-md bg-yellow-50 px-2 py-1.5 text-sm font-medium text-yellow-800 hover:bg-yellow-100 focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:outline-none disabled:opacity-50 dark:bg-yellow-900/20 dark:text-yellow-200 dark:hover:bg-yellow-900/40"
														>
															{isRefreshing ? 'Retrying...' : 'Retry'}
														</button>
													</div>
												</div>
											</div>
										</div>
									</div>
								{/if}

								<!-- Results summary -->
								{#if searchTerm.trim()}
									<div
										class="mt-4 text-sm text-gray-600 dark:text-gray-400"
										role="status"
										aria-live="polite"
										aria-atomic="true"
									>
										{#if filteredProjects.length === 0}
											Проекты не найдены по запросу "{searchTerm}"
										{:else}
											Найдено {filteredProjects.length} проект{filteredProjects.length === 1
												? ''
												: filteredProjects.length < 5
													? 'а'
													: 'ов'} по запросу "{searchTerm}"
										{/if}
									</div>
								{/if}

								<!-- Projects Table -->
								<div class="mt-8">
									<ProjectsTable
										projects={paginatedProjects}
										{projectStatuses}
										isLoading={isActionLoading}
										onEditProject={handleEditProject}
										onDeleteProject={handleDeleteProject}
										onViewProject={handleViewProject}
										onAcceptProject={handleAcceptProject}
										onStatusChange={handleStatusChange}
										{updateCounter}
										{searchTerm}
										hasSearched={searchTerm.trim().length > 0}
										currentUserId={authState.user?.id}
										{sortColumn}
										{sortDirection}
										onSort={handleSort}
									/>
								</div>

								<!-- Pagination -->
								<Pagination
									bind:currentPage
									totalItems={filteredProjects.length}
									{itemsPerPage}
									filteredFrom={searchTerm.trim() ? localProjects.length : null}
								/>
							</main>
						</div>
					</div>
				</div>
				{/if}
			{:catch error}
				<!-- Critical error state -->
				<div class="flex min-h-screen items-center justify-center">
					<div class="rounded-lg border border-red-500/30 bg-red-500/20 p-8 text-center">
						<h3 class="mb-4 text-xl font-semibold text-white">Ошибка загрузки проектов</h3>
						<p class="text-red-300">Не удалось загрузить проекты. Попробуйте обновить страницу.</p>
					</div>
				</div>
			{/await}
		</ErrorBoundary>
	{/snippet}
</ProtectedRoute>

<!-- Confirmation Modal -->
{#if confirmAction}
	<ConfirmationModal
		isOpen={showConfirmModal}
		title={confirmAction.title}
		message={confirmAction.message}
		confirmText={confirmAction.confirmText}
		cancelText="Отмена"
		onConfirm={confirmActionHandler}
		onCancel={cancelAction}
		isDestructive={confirmAction.isDestructive}
		isLoading={isActionLoading}
	/>
{/if}

<!-- Project Edit Modal -->
{#if editingProject}
	<ProjectEditModal
		isOpen={showEditModal}
		project={editingProject}
		{projectStatuses}
		{isLoadingStatuses}
		onSave={handleSaveProject}
		onCancel={handleCancelEditProject}
		isLoading={isActionLoading}
	/>
{/if}

<!-- Project View Modal -->
{#if viewingProject}
	<ProjectViewModal
		isOpen={showViewModal}
		project={viewingProject}
		acceptedByCurrentUser={acceptedProjects.get(viewingProject.id)}
		onClose={handleCancelViewProject}
	/>
{/if}
