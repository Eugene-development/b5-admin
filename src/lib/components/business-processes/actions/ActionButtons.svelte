<script>
	/**
	 * ActionButtons Component
	 *
	 * A reusable component for agent/project management actions (Ban/Unban and Delete or Edit and Delete).
	 * Provides proper styling, loading states, and accessibility features.
	 * Uses Svelte 5 runes for reactive state management.
	 */
	import { ActionButton, MobileActionButton } from '$lib';
	
	let {
		agent,
		user,
		onBan,
		onDelete,
		onView,
		isLoading = false,
		mobile = false,
		compact = false,
		projectMode = false
	} = $props();

	// Use user if provided, otherwise fall back to agent for backward compatibility
	const entity = user || agent;

	// Determine if entity is currently banned - using correct Svelte 5 syntax
	const isBanned = $derived(
		!projectMode &&
			(entity.status === 'banned' || entity.status === 'inactive' || entity.status === 'suspended')
	);

	// Debug effect to log the current state
	$effect(() => {
		if (projectMode) {
			console.log(`🎯 ActionButtons Project ${entity.id}: name="${entity.name}"`);
		} else {
			console.log(
				`🎯 ActionButtons User ${entity.id}: status="${entity.status}", isBanned=${isBanned}, buttonText="${isBanned ? 'Разбанить' : 'Забанить'}"`
			);
		}
	});

	// Generate unique IDs for accessibility
	const banButtonId = `ban-button-${entity.id}`;
	const deleteButtonId = `delete-button-${entity.id}`;
	const viewButtonId = `view-button-${entity.id}`;

	// Handle ban/unban or edit action
	function handleBanAction() {
		if (onBan && !isLoading) {
			onBan(entity);
		}
	}

	// Handle delete action
	function handleDeleteAction() {
		if (onDelete && !isLoading) {
			onDelete(entity);
		}
	}

	// Handle view action
	function handleViewAction() {
		if (onView && !isLoading) {
			onView(entity);
		}
	}

	// Handle keyboard navigation
	function handleKeydown(event, action) {
		// Allow Enter and Space to trigger actions
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			if (action === 'ban') {
				handleBanAction();
			} else if (action === 'delete') {
				handleDeleteAction();
			} else if (action === 'view') {
				handleViewAction();
			}
		}
	}

	// Get accessible button text
	function getAccessibleBanText(isBanned, entityName) {
		if (projectMode) {
			const projectIdentifier = entityName || `проект ${entity.id}`;
			return `Редактировать ${projectIdentifier}`;
		}
		const action = isBanned ? 'Unban' : 'Ban';
		const entityIdentifier = entityName || entity.email || `user ${entity.id}`;
		return `${action} ${entityIdentifier}`;
	}

	function getAccessibleDeleteText(entityName) {
		if (projectMode) {
			const projectIdentifier = entityName || `проект ${entity.id}`;
			return `Удалить ${projectIdentifier} навсегда`;
		}
		const entityIdentifier = entityName || entity.email || `user ${entity.id}`;
		return `Delete ${entityIdentifier} permanently`;
	}

	function getAccessibleViewText(entityName) {
		if (projectMode) {
			const projectIdentifier = entityName || `проект ${entity.id}`;
			return `Просмотреть детали ${projectIdentifier}`;
		}
		const entityIdentifier = entityName || entity.email || `user ${entity.id}`;
		return `View details for ${entityIdentifier}`;
	}
</script>

{#if mobile}
	<!-- Mobile Layout - Larger touch targets, actions in one row -->
	<div class="flex w-full flex-wrap justify-end gap-2">
		{#if onView}
			<MobileActionButton
				variant="view"
				onclick={handleViewAction}
				disabled={isLoading}
				ariaLabel={getAccessibleViewText(entity.name)}
				title="Просмотреть"
			/>
		{/if}

		{#if projectMode}
			<MobileActionButton
				variant="edit"
				onclick={handleBanAction}
				disabled={isLoading}
				ariaLabel={getAccessibleBanText(isBanned, entity.name)}
				title="Редактировать"
			/>
		{/if}

		<MobileActionButton
			variant="delete"
			onclick={handleDeleteAction}
			disabled={isLoading}
			{isLoading}
			ariaLabel={getAccessibleDeleteText(entity.name)}
			title="Удалить"
		/>
	</div>
{:else if compact}
	<!-- Compact Layout - Smaller buttons for tablet view -->
	<div class="flex justify-end gap-1.5">
		{#if onView}
			<ActionButton
				variant="view"
				onclick={handleViewAction}
				disabled={isLoading}
				ariaLabel={getAccessibleViewText(entity.name)}
				title="Просмотреть"
			/>
		{/if}

		{#if projectMode}
			<ActionButton
				variant="edit"
				onclick={handleBanAction}
				disabled={isLoading}
				ariaLabel={getAccessibleBanText(isBanned, entity.name)}
				title="Редактировать"
			/>
		{/if}

		<ActionButton
			variant="delete"
			onclick={handleDeleteAction}
			disabled={isLoading}
			{isLoading}
			ariaLabel={getAccessibleDeleteText(entity.name)}
			title="Удалить"
		/>
	</div>
{:else}
	<!-- Desktop Layout - Modern design -->
	<div class="flex justify-end gap-1.5">
		{#if onView}
			<ActionButton
				variant="view"
				onclick={handleViewAction}
				disabled={isLoading}
				ariaLabel={getAccessibleViewText(entity.name)}
				title="Просмотреть"
			/>
		{/if}

		{#if projectMode}
			<ActionButton
				variant="edit"
				onclick={handleBanAction}
				disabled={isLoading}
				ariaLabel={getAccessibleBanText(isBanned, entity.name)}
				title="Редактировать"
			/>
		{/if}

		<ActionButton
			variant="delete"
			onclick={handleDeleteAction}
			disabled={isLoading}
			{isLoading}
			ariaLabel={getAccessibleDeleteText(entity.name)}
			title="Удалить"
		/>
	</div>

	<!-- Hidden descriptions for screen readers (shared across all layouts) -->
	<div id="{banButtonId}-description" class="sr-only">
		{projectMode
			? 'Откроет форму редактирования проекта'
			: isBanned
				? 'This will restore access for the agent'
				: 'This will prevent the agent from accessing the system'}
	</div>
	<div id="{deleteButtonId}-description" class="sr-only">
		{projectMode
			? 'Это действие нельзя отменить, проект будет удален навсегда'
			: 'This action cannot be undone and will permanently remove all agent data'}
	</div>
	{#if onView}
		<div id="{viewButtonId}-description" class="sr-only">
			{projectMode
				? 'Откроет окно с детальной информацией о проекте'
				: 'Откроет окно с детальной информацией о пользователе'}
		</div>
	{/if}
{/if}
