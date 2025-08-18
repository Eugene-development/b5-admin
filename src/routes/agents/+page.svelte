<script>
	import { AgentsTable, SearchBar } from '$lib';
	
	let { data } = $props();
	
	// Search state management
	let searchTerm = $state("");
	
	// Computed filteredAgents reactive statement
	let filteredAgents = $derived.by(() => {
		if (!searchTerm.trim()) {
			return data?.agents || [];
		}
		
		const term = searchTerm.toLowerCase().trim();
		return (data?.agents || []).filter(agent => {
			const name = (agent.name || '').toLowerCase();
			const email = (agent.email || '').toLowerCase();
			const city = (agent.city || '').toLowerCase();
			
			return name.includes(term) || 
				   email.includes(term) || 
				   city.includes(term);
		});
	});
	
	// Search handler function
	function handleSearch(term) {
		searchTerm = term;
	}
	
	// Placeholder functions for future implementation
	function handleBanAgent(agent) {
		console.log('Ban agent:', agent);
		// TODO: Implement ban functionality
	}
	
	function handleDeleteAgent(agent) {
		console.log('Delete agent:', agent);
		// TODO: Implement delete functionality
	}
</script>

<div class="space-y-6 bg-gray-900">
	<div class="sm:flex sm:items-center">
		<div class="sm:flex-auto">
			<h1 class="text-base font-semibold text-gray-900 dark:text-white">Agents</h1>
			<p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
				List of all registered agents in the system.
			</p>
		</div>
	</div>

	<!-- Search Bar -->
	<div class="max-w-md">
		<SearchBar 
			placeholder="Search agents by name, email, or city..."
			onSearch={handleSearch}
			value={searchTerm}
		/>
	</div>

	<!-- Results summary -->
	{#if searchTerm.trim()}
		<div class="text-sm text-gray-600 dark:text-gray-400">
			{#if filteredAgents.length === 0}
				<p>No agents found matching "{searchTerm}". Try adjusting your search terms.</p>
			{:else if filteredAgents.length === 1}
				<p>Found 1 agent matching "{searchTerm}"</p>
			{:else}
				<p>Found {filteredAgents.length} agents matching "{searchTerm}"</p>
			{/if}
		</div>
	{/if}

	<AgentsTable 
		agents={filteredAgents} 
		onBanAgent={handleBanAgent}
		onDeleteAgent={handleDeleteAgent}
	/>
</div>
