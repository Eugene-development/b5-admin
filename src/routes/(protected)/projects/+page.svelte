<script>
	import {
		ProjectsTable,
		ProjectEditModal,
		ProjectViewModal,
		SearchBar,
		ConfirmationModal,
		ToastContainer,
		ErrorBoundary,
		LoadingSpinner,
		EmptyState
	} from '$lib';
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
	import { updateProject, deleteProject, refreshProjects } from '$lib/api/projects.js';
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte';

	let { data } = $props();

	// Search state management
	let searchTerm = $state('');

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

	// Local projects state for updates
	let localProjects = $state([...(data?.projects || [])]);

	// Force update counter for reactivity
	let updateCounter = $state(0);

	// Check for server-side load errors
	let loadError = $state(data?.error || null);

	// Computed filteredProjects reactive statement
	let filteredProjects = $derived.by(() => {
		if (!searchTerm.trim()) {
			return localProjects;
		}

		const term = searchTerm.toLowerCase().trim();
		return localProjects.filter((project) => {
			const name = (project.name || '').toLowerCase();
			const city = (project.city || '').toLowerCase();
			const contractNumber = (project.contract_number || '').toLowerCase();
			const agentName = (project.agent?.name || '').toLowerCase();
			const agentEmail = (project.agent?.email || '').toLowerCase();

			return (
				name.includes(term) ||
				city.includes(term) ||
				contractNumber.includes(term) ||
				agentName.includes(term) ||
				agentEmail.includes(term)
			);
		});
	});

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
			message: `Вы уверены, что хотите НАВСЕГДА удалить проект "${project.name}"? Это действие нельзя отменить. Все данные проекта будут потеряны.`,
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
						addSuccessToast(`Проект "${project.name}" успешно удален.`);
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

	// Remove project from local state after deletion
	function removeProjectFromList(projectId) {
		localProjects = localProjects.filter((project) => project.id !== projectId);
		updateCounter++;
	}

	// Update project in local state after editing
	function updateProjectInList(updatedProject) {
		localProjects = localProjects.map((project) =>
			project.id === updatedProject.id ? updatedProject : project
		);
		updateCounter++;
	}

	// Refresh data from server
	async function refreshData(isInitialLoad = false) {
		isRefreshing = true;
		try {
			const projects = await refreshProjects();
			localProjects = projects;
			loadError = null;
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

	// Handle initial load error and load data if empty
	onMount(() => {
		if (loadError) {
			addErrorToast(loadError.message, { duration: 0 });
		}

		// Load data if we have empty initial data (server-side data loading was disabled)
		if (!localProjects.length && !loadError) {
			refreshData(true); // Pass true to indicate initial load
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
			<!-- Skip link for keyboard navigation -->
			<a
				href="#main-content"
				class="sr-only z-50 rounded-md bg-indigo-600 px-4 py-2 text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
			>
				Перейти к основному контенту
			</a>

			<div class="space-y-6 bg-gray-900">
				<!-- Page landmark -->
				<main id="main-content" aria-labelledby="page-title">
					<div
						class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0"
					>
						<div class="flex-auto">
							<h1
								id="page-title"
								class="text-lg font-semibold text-gray-900 sm:text-base dark:text-white"
							>
								Проекты
							</h1>
						</div>
						<div class="flex-none">
							<button
								type="button"
								onclick={refreshData}
								disabled={isRefreshing}
								class="inline-flex min-h-[44px] w-full items-center justify-center rounded-md bg-cyan-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-150 ease-in-out hover:bg-cyan-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
								aria-label="Refresh projects data from server"
								aria-describedby="refresh-button-description"
							>
								{#if isRefreshing}
									<LoadingSpinner size="sm" color="white" inline={true} class="mr-2" />
								{/if}
								{isRefreshing ? 'Обновляю...' : 'Обновить данные'}
							</button>
							<div id="refresh-button-description" class="sr-only">
								Обновить данные проектов с сервера
							</div>
						</div>
					</div>

					<!-- Load Error Banner -->
					{#if loadError && loadError.canRetry}
						<div class="rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/20">
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
												class="rounded-md bg-yellow-50 px-2 py-1.5 text-sm font-medium text-yellow-800 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2 focus:ring-offset-yellow-50 disabled:opacity-50 dark:bg-yellow-900/20 dark:text-yellow-200 dark:hover:bg-yellow-900/40"
											>
												{isRefreshing ? 'Retrying...' : 'Retry'}
											</button>
										</div>
									</div>
								</div>
							</div>
						</div>
					{/if}

					<!-- Search Bar -->
					<div class="w-full sm:max-w-md" role="search" aria-label="Project search">
						<SearchBar placeholder="Локальный поиск" onSearch={handleSearch} value={searchTerm} />
					</div>

					<!-- Results summary -->
					{#if searchTerm.trim()}
						<div
							class="py-2 text-sm text-gray-600 dark:text-gray-400"
							role="status"
							aria-live="polite"
							aria-atomic="true"
						>
							{#if filteredProjects.length === 0}
								<p>Проекты не найдены</p>
							{:else}
								<p>Найдено {filteredProjects.length} проектов по запросу "{searchTerm}"</p>
							{/if}
						</div>
					{/if}

					<ProjectsTable
						projects={filteredProjects}
						isLoading={isActionLoading}
						onEditProject={handleEditProject}
						onDeleteProject={handleDeleteProject}
						onViewProject={handleViewProject}
						{updateCounter}
						{searchTerm}
						hasSearched={searchTerm.trim().length > 0}
					/>
				</main>
			</div>
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
		onClose={handleCancelViewProject}
	/>
{/if}

<!-- Toast Notifications -->
<ToastContainer toasts={$toasts} position="top-center" />
