<script>
	import { updateProject } from '$lib/api/projects.js';
	import { addSuccessToast, addErrorToast } from '$lib/utils/toastStore.js';

	let {
		project,
		projectStatuses = [],
		onStatusChange = null,
		readonly = false
	} = $props();

	let isUpdating = $state(false);
	let showDropdown = $state(false);

	let currentStatus = $derived(
		project?.status || { slug: 'new-project', value: 'Новый проект' }
	);

	function getStatusColor(slug) {
		switch (slug) {
			case 'new-project':
				return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-400/10 dark:text-emerald-400 dark:ring-emerald-400/20';
			case 'curator-processing':
				return 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/20';
			case 'in-progress':
				return 'bg-yellow-50 text-yellow-700 ring-yellow-600/20 dark:bg-yellow-400/10 dark:text-yellow-400 dark:ring-yellow-400/20';
			case 'completed':
				return 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-400/10 dark:text-green-400 dark:ring-green-400/20';
			case 'cancelled':
				return 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-400/10 dark:text-red-400 dark:ring-red-400/20';
			default:
				return 'bg-gray-50 text-gray-600 ring-gray-500/10 dark:bg-gray-400/10 dark:text-gray-400 dark:ring-gray-400/20';
		}
	}

	function getStatusDotColor(slug) {
		switch (slug) {
			case 'new-project':
				return 'bg-emerald-500';
			case 'curator-processing':
				return 'bg-blue-500';
			case 'in-progress':
				return 'bg-yellow-500';
			case 'completed':
				return 'bg-green-500';
			case 'cancelled':
				return 'bg-red-500';
			default:
				return 'bg-gray-500';
		}
	}

	async function handleStatusChange(newStatusId) {
		if (isUpdating || newStatusId === currentStatus.id) {
			showDropdown = false;
			return;
		}

		isUpdating = true;
		try {
			// Update project with new status
			const updatedProject = await updateProject({
				id: project.id,
				status_id: newStatusId
			});

			addSuccessToast('Статус проекта обновлён');
			
			if (onStatusChange) {
				onStatusChange(updatedProject);
			}
		} catch (error) {
			console.error('Failed to update project status:', error);
			addErrorToast('Не удалось обновить статус проекта');
		} finally {
			isUpdating = false;
			showDropdown = false;
		}
	}

	function handleClickOutside(event) {
		if (showDropdown && !event.target.closest('.project-status-dropdown')) {
			showDropdown = false;
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

<div class="project-status-dropdown relative inline-block">
	{#if readonly}
		<span
			class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset {getStatusColor(currentStatus.slug)}"
		>
			{currentStatus.value}
		</span>
	{:else}
		<button
			type="button"
			onclick={(e) => {
				e.stopPropagation();
				showDropdown = !showDropdown;
			}}
			disabled={isUpdating}
			class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset transition-all {getStatusColor(currentStatus.slug)} {isUpdating ? 'opacity-50 cursor-wait' : 'cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-indigo-500'}"
		>
			{#if isUpdating}
				<svg class="mr-1 h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
				</svg>
			{/if}
			{currentStatus.value}
			<svg class="ml-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
			</svg>
		</button>

		{#if showDropdown}
			<div class="absolute left-0 z-50 mt-1 w-48 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-700">
				<div class="py-1">
					{#each projectStatuses as status}
						<button
							type="button"
							onclick={(e) => {
								e.stopPropagation();
								handleStatusChange(status.id);
							}}
							class="flex w-full items-center px-4 py-2 text-left text-sm {status.id === currentStatus.id ? 'bg-gray-100 dark:bg-gray-600' : 'hover:bg-gray-50 dark:hover:bg-gray-600'} text-gray-700 dark:text-gray-200"
						>
							<span class="mr-2 h-2 w-2 rounded-full {getStatusDotColor(status.slug)}"></span>
							{status.value}
							{#if status.id === currentStatus.id}
								<svg class="ml-auto h-4 w-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
								</svg>
							{/if}
						</button>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>
