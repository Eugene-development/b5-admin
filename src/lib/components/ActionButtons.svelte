<script>
	/**
	 * ActionButtons Component
	 *
	 * A reusable component for agent/project management actions (Ban/Unban and Delete or Edit and Delete).
	 * Provides proper styling, loading states, and accessibility features.
	 * Uses Svelte 5 runes for reactive state management.
	 *
	 * @param {Object} agent - The agent/project object containing id, name, status, etc.
	 * @param {Function} onBan - Callback function for ban/edit action
	 * @param {Function} onDelete - Callback function for delete action
	 * @param {Function} [onView] - Callback function for view action (projects only)
	 * @param {boolean} [isLoading=false] - Loading state for disabling buttons
	 * @param {boolean} [mobile=false] - Mobile mode with larger touch targets
	 * @param {boolean} [compact=false] - Compact mode for tablet view
	 * @param {boolean} [projectMode=false] - Project mode changes ban/unban to edit
	 */
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
	<div class="flex w-full flex-row justify-end space-x-2">
		{#if onView}
			<!-- View Button -->
			<button
				type="button"
				id={viewButtonId}
				onclick={handleViewAction}
				onkeydown={(e) => handleKeydown(e, 'view')}
				class="inline-flex min-h-[44px] items-center justify-center rounded-md bg-gray-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-gray-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 active:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
				disabled={isLoading}
				aria-label={getAccessibleViewText(entity.name)}
				aria-describedby="{viewButtonId}-description"
			>
				{#if isLoading}
					<svg
						class="h-4 w-4 animate-spin"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
				{:else}
					<svg
						class="h-5 w-5"
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
				{/if}
			</button>
		{/if}

		<!-- Ban/Unban or Edit Button -->
		<button
			type="button"
			id={banButtonId}
			onclick={handleBanAction}
			onkeydown={(e) => handleKeydown(e, 'ban')}
			class="inline-flex min-h-[44px] items-center justify-center rounded-md px-4 py-3 text-sm font-semibold shadow-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 {projectMode
				? 'bg-blue-600 text-white hover:bg-blue-500 focus-visible:outline-blue-600 active:bg-blue-700'
				: isBanned
					? 'bg-green-600 text-white hover:bg-green-500 focus-visible:outline-green-600 active:bg-green-700'
					: 'bg-yellow-600 text-white hover:bg-yellow-500 focus-visible:outline-yellow-600 active:bg-yellow-700'}"
			disabled={isLoading}
			aria-label={getAccessibleBanText(isBanned, entity.name)}
			aria-describedby={`${banButtonId}-description`}
		>
			{#if isLoading}
				<svg
					class="mr-2 h-4 w-4 animate-spin"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
					></circle>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
			{:else if projectMode}
				<svg
					class="h-5 w-5"
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
			{:else}
				<!-- Ban (minus icon) / Unban (plus icon) -->
				{#if isBanned}
					<!-- Plus icon for unban -->
					<svg
						class="h-5 w-5"
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
							d="M12 4v16m8-8H4"
						/>
					</svg>
				{:else}
					<!-- Minus icon for ban -->
					<svg
						class="h-5 w-5"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						aria-hidden="true"
					>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
					</svg>
				{/if}
			{/if}
		</button>

		<!-- Delete Button -->
		<button
			type="button"
			id={deleteButtonId}
			onclick={handleDeleteAction}
			onkeydown={(e) => handleKeydown(e, 'delete')}
			class="inline-flex min-h-[44px] items-center justify-center rounded-md bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 active:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
			disabled={isLoading}
			aria-label={getAccessibleDeleteText(entity.name)}
			aria-describedby={`${deleteButtonId}-description`}
		>
			{#if isLoading}
				<svg
					class="mr-2 h-4 w-4 animate-spin"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
					></circle>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
			{:else}
				<svg
					class="h-5 w-5"
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
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			{/if}
		</button>
	</div>
{:else if compact}
	<!-- Compact Layout - Smaller buttons for tablet view -->
	<div class="flex justify-end space-x-1">
		{#if onView}
			<!-- View Button -->
			<button
				type="button"
				id={viewButtonId}
				onclick={handleViewAction}
				onkeydown={(e) => handleKeydown(e, 'view')}
				class="inline-flex min-h-[36px] items-center rounded-md bg-gray-600 px-2 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-gray-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
				disabled={isLoading}
				aria-label={getAccessibleViewText(entity.name)}
				aria-describedby="{viewButtonId}-description"
			>
				{#if isLoading}
					<svg
						class="mr-1 h-3 w-3 animate-spin"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
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
							d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
						/>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
						/>
					</svg>
				{/if}
			</button>
		{/if}

		<!-- Ban/Unban or Edit Button -->
		<button
			type="button"
			id={banButtonId}
			onclick={handleBanAction}
			onkeydown={(e) => handleKeydown(e, 'ban')}
			class="inline-flex min-h-[36px] items-center rounded-md px-2 py-1.5 text-xs font-semibold shadow-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 {projectMode
				? 'bg-blue-600 text-white hover:bg-blue-500 focus-visible:outline-blue-600'
				: isBanned
					? 'bg-green-600 text-white hover:bg-green-500 focus-visible:outline-green-600'
					: 'bg-yellow-600 text-white hover:bg-yellow-500 focus-visible:outline-yellow-600'}"
			disabled={isLoading}
			aria-label={getAccessibleBanText(isBanned, entity.name)}
			aria-describedby={`${banButtonId}-description`}
		>
			{#if isLoading}
				<svg
					class="mr-1 h-3 w-3 animate-spin"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
					></circle>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
			{:else if projectMode}
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
			{:else}
				<!-- Ban (minus icon) / Unban (plus icon) -->
				{#if isBanned}
					<!-- Plus icon for unban -->
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
							d="M12 4v16m8-8H4"
						/>
					</svg>
				{:else}
					<!-- Minus icon for ban -->
					<svg
						class="h-4 w-4"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						aria-hidden="true"
					>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
					</svg>
				{/if}
			{/if}
		</button>

		<!-- Delete Button -->
		<button
			type="button"
			id={deleteButtonId}
			onclick={handleDeleteAction}
			onkeydown={(e) => handleKeydown(e, 'delete')}
			class="inline-flex min-h-[36px] items-center rounded-md bg-red-600 px-2 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50"
			disabled={isLoading}
			aria-label={getAccessibleDeleteText(entity.name)}
			aria-describedby={`${deleteButtonId}-description`}
		>
			{#if isLoading}
				<svg
					class="mr-1 h-3 w-3 animate-spin"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
					></circle>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
			{:else}
				<svg
					class="h-5 w-5"
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
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			{/if}
		</button>
	</div>
{:else}
	<!-- Desktop Layout - Original design -->
	<div class="flex justify-end space-x-2">
		{#if onView}
			<!-- View Button -->
			<button
				type="button"
				id={viewButtonId}
				onclick={handleViewAction}
				onkeydown={(e) => handleKeydown(e, 'view')}
				class="inline-flex items-center rounded-md bg-gray-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-gray-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
				disabled={isLoading}
				aria-label={getAccessibleViewText(entity.name)}
				aria-describedby="{viewButtonId}-description"
			>
				{#if isLoading}
					<svg
						class="mr-1 h-3 w-3 animate-spin"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
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
							d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
						/>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
						/>
					</svg>
				{/if}
			</button>
		{/if}

		<!-- Ban/Unban or Edit Button -->
		<button
			type="button"
			id={banButtonId}
			onclick={handleBanAction}
			onkeydown={(e) => handleKeydown(e, 'ban')}
			class="inline-flex items-center rounded-md px-2.5 py-1.5 text-xs font-semibold shadow-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 {projectMode
				? 'bg-blue-600 text-white hover:bg-blue-500 focus-visible:outline-blue-600'
				: isBanned
					? 'bg-green-600 text-white hover:bg-green-500 focus-visible:outline-green-600'
					: 'bg-yellow-600 text-white hover:bg-yellow-500 focus-visible:outline-yellow-600'}"
			disabled={isLoading}
			aria-label={getAccessibleBanText(isBanned, entity.name)}
			aria-describedby={`${banButtonId}-description`}
		>
			{#if isLoading}
				<svg
					class="mr-1 h-3 w-3 animate-spin"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
					></circle>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
			{:else if projectMode}
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
			{:else}
				<!-- Ban (minus icon) / Unban (plus icon) -->
				{#if isBanned}
					<!-- Plus icon for unban -->
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
							d="M12 4v16m8-8H4"
						/>
					</svg>
				{:else}
					<!-- Minus icon for ban -->
					<svg
						class="h-4 w-4"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						aria-hidden="true"
					>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
					</svg>
				{/if}
			{/if}
		</button>

		<!-- Delete Button -->
		<button
			type="button"
			id={deleteButtonId}
			onclick={handleDeleteAction}
			onkeydown={(e) => handleKeydown(e, 'delete')}
			class="inline-flex items-center rounded-md bg-red-800 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50"
			disabled={isLoading}
			aria-label={getAccessibleDeleteText(entity.name)}
			aria-describedby={`${deleteButtonId}-description`}
		>
			{#if isLoading}
				<svg
					class="mr-1 h-3 w-3 animate-spin"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
					></circle>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
			{:else}
				<svg
					class="h-5 w-5"
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
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			{/if}
		</button>
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
