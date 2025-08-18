<script>
	/**
	 * ActionButtons Component
	 *
	 * A reusable component for agent management actions (Ban/Unban and Delete).
	 * Provides proper styling, loading states, and accessibility features.
	 * Uses Svelte 5 runes for reactive state management.
	 *
	 * @param {Object} agent - The agent object containing id, name, status, etc.
	 * @param {Function} onBan - Callback function for ban action
	 * @param {Function} onDelete - Callback function for delete action
	 * @param {boolean} [isLoading=false] - Loading state for disabling buttons
	 * @param {boolean} [mobile=false] - Mobile mode with larger touch targets
	 * @param {boolean} [compact=false] - Compact mode for tablet view
	 */
	let { agent, onBan, onDelete, isLoading = false, mobile = false, compact = false } = $props();

	// Determine if agent is currently banned - using correct Svelte 5 syntax
	const isBanned = $derived(
		agent.status === 'banned' || agent.status === 'inactive' || agent.status === 'suspended'
	);

	// Debug effect to log the current state
	$effect(() => {
		console.log(
			`🎯 ActionButtons Agent ${agent.id}: status="${agent.status}", isBanned=${isBanned}, buttonText="${isBanned ? 'Разбанить' : 'Забанить'}"`
		);
	});

	// Generate unique IDs for accessibility
	const banButtonId = `ban-button-${agent.id}`;
	const deleteButtonId = `delete-button-${agent.id}`;

	// Handle ban/unban action
	function handleBanAction() {
		if (onBan && !isLoading) {
			onBan(agent);
		}
	}

	// Handle delete action
	function handleDeleteAction() {
		if (onDelete && !isLoading) {
			onDelete(agent);
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
			}
		}
	}

	// Get accessible button text
	function getAccessibleBanText(isBanned, agentName) {
		const action = isBanned ? 'Unban' : 'Ban';
		const agentIdentifier = agentName || agent.email || `agent ${agent.id}`;
		return `${action} ${agentIdentifier}`;
	}

	function getAccessibleDeleteText(agentName) {
		const agentIdentifier = agentName || agent.email || `agent ${agent.id}`;
		return `Delete ${agentIdentifier} permanently`;
	}
</script>

{#if mobile}
	<!-- Mobile Layout - Larger touch targets, full width buttons -->
	<div class="flex w-full flex-col space-y-2">
		<!-- Ban/Unban Button -->
		<button
			type="button"
			id={banButtonId}
			onclick={handleBanAction}
			onkeydown={(e) => handleKeydown(e, 'ban')}
			class="inline-flex min-h-[44px] items-center justify-center rounded-md px-4 py-3 text-sm font-semibold shadow-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 {isBanned
				? 'bg-green-600 text-white hover:bg-green-500 focus-visible:outline-green-600 active:bg-green-700'
				: 'bg-yellow-600 text-white hover:bg-yellow-500 focus-visible:outline-yellow-600 active:bg-yellow-700'}"
			disabled={isLoading}
			aria-label={getAccessibleBanText(isBanned, agent.name)}
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
			{/if}
			{isBanned ? 'Разбанить' : 'Забанить'}
		</button>

		<!-- Delete Button -->
		<button
			type="button"
			id={deleteButtonId}
			onclick={handleDeleteAction}
			onkeydown={(e) => handleKeydown(e, 'delete')}
			class="inline-flex min-h-[44px] items-center justify-center rounded-md bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 active:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
			disabled={isLoading}
			aria-label={getAccessibleDeleteText(agent.name)}
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
		<!-- Ban/Unban Button -->
		<button
			type="button"
			id={banButtonId}
			onclick={handleBanAction}
			onkeydown={(e) => handleKeydown(e, 'ban')}
			class="inline-flex min-h-[36px] items-center rounded-md px-2 py-1.5 text-xs font-semibold shadow-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 {isBanned
				? 'bg-green-600 text-white hover:bg-green-500 focus-visible:outline-green-600'
				: 'bg-yellow-600 text-white hover:bg-yellow-500 focus-visible:outline-yellow-600'}"
			disabled={isLoading}
			aria-label={getAccessibleBanText(isBanned, agent.name)}
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
			{/if}
			{isBanned ? 'Разбан' : 'Бан'}
		</button>

		<!-- Delete Button -->
		<button
			type="button"
			id={deleteButtonId}
			onclick={handleDeleteAction}
			onkeydown={(e) => handleKeydown(e, 'delete')}
			class="inline-flex min-h-[36px] items-center rounded-md bg-red-600 px-2 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50"
			disabled={isLoading}
			aria-label={getAccessibleDeleteText(agent.name)}
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
		<!-- Ban/Unban Button -->
		<button
			type="button"
			id={banButtonId}
			onclick={handleBanAction}
			onkeydown={(e) => handleKeydown(e, 'ban')}
			class="inline-flex items-center rounded-md px-2.5 py-1.5 text-xs font-semibold shadow-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 {isBanned
				? 'bg-green-600 text-white hover:bg-green-500 focus-visible:outline-green-600'
				: 'bg-yellow-600 text-white hover:bg-yellow-500 focus-visible:outline-yellow-600'}"
			disabled={isLoading}
			aria-label={getAccessibleBanText(isBanned, agent.name)}
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
			{/if}
			{isBanned ? 'Разбанить' : 'Бан'}
		</button>

		<!-- Delete Button -->
		<button
			type="button"
			id={deleteButtonId}
			onclick={handleDeleteAction}
			onkeydown={(e) => handleKeydown(e, 'delete')}
			class="inline-flex items-center rounded-md bg-red-800 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50"
			disabled={isLoading}
			aria-label={getAccessibleDeleteText(agent.name)}
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
		{isBanned
			? 'This will restore access for the agent'
			: 'This will prevent the agent from accessing the system'}
	</div>
	<div id="{deleteButtonId}-description" class="sr-only">
		This action cannot be undone and will permanently remove all agent data
	</div>
{/if}
