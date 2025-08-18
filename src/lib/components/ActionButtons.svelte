<script>
	/**
	 * ActionButtons Component
	 *
	 * A reusable component for agent management actions (Ban/Unban and Delete).
	 * Provides proper styling, loading states, and accessibility features.
	 *
	 * @param {Object} agent - The agent object containing id, name, status, etc.
	 * @param {Function} onBan - Callback function for ban action
	 * @param {Function} onDelete - Callback function for delete action
	 * @param {boolean} [isLoading=false] - Loading state for disabling buttons
	 */
	let { agent, agentStatus, onBan, onDelete, isLoading = false } = $props();

	// Determine if agent is currently banned - using correct Svelte 5 syntax
	const isBanned = $derived(() => {
		const status = agentStatus || agent.status;
		const banned = status === 'banned';
		console.log(`ActionButtons debug - Agent ${agent.id}: status="${status}" (type: ${typeof status}), isBanned=${banned}`);
		return banned;
	});

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
</script>

<div class="flex justify-end space-x-2">
	<!-- Ban/Unban Button -->
	<button
		type="button"
		onclick={handleBanAction}
		class="inline-flex items-center rounded-md px-2.5 py-1.5 text-xs font-semibold shadow-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 {isBanned
			? 'bg-orange-600 text-white hover:bg-orange-500 focus-visible:outline-orange-600'
			: 'bg-yellow-600 text-white hover:bg-yellow-500 focus-visible:outline-yellow-600'}"
		disabled={isLoading}
		aria-label={isBanned ? `Unban agent ${agent.name}` : `Ban agent ${agent.name}`}
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
		onclick={handleDeleteAction}
		class="inline-flex items-center rounded-md bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50"
		disabled={isLoading}
		aria-label={`Delete agent ${agent.name}`}
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
		Удалить
	</button>
</div>
