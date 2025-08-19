<script>
	import { formatAgentDisplay } from '../utils/formatters.js';

	export let agent = null;
	export let showId = false;
	export let clickable = false;
	export let className = '';

	$: displayText = formatAgentDisplay(agent);
	$: isAssigned = agent && (agent.name || agent.email);

	function handleAgentClick() {
		if (clickable && agent && agent.id) {
			// Dispatch custom event for parent component to handle
			const event = new CustomEvent('agentClick', {
				detail: { agent }
			});
			document.dispatchEvent(event);
		}
	}
</script>

<div class="inline-flex items-center {className}">
	{#if isAssigned}
		<div class="flex items-center space-x-2">
			<div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
				<span class="text-blue-600 text-sm font-medium">
					{agent.name ? agent.name.charAt(0).toUpperCase() : agent.email.charAt(0).toUpperCase()}
				</span>
			</div>
			<div class="flex flex-col">
				<span 
					class="text-sm font-medium text-gray-900"
					class:cursor-pointer={clickable}
					class:hover:text-blue-600={clickable}
					on:click={handleAgentClick}
					on:keydown={(e) => e.key === 'Enter' && handleAgentClick()}
					role={clickable ? 'button' : 'text'}
					tabindex={clickable ? 0 : -1}
				>
					{agent.name || agent.email}
				</span>
				{#if agent.name && agent.email}
					<span class="text-xs text-gray-500">
						{agent.email}
					</span>
				{/if}
				{#if showId && agent.id}
					<span class="text-xs text-gray-400">
						ID: {agent.id}
					</span>
				{/if}
			</div>
		</div>
	{:else}
		<div class="flex items-center space-x-2">
			<div class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
				<span class="text-gray-400 text-sm">?</span>
			</div>
			<span class="text-sm text-gray-500">
				{displayText}
			</span>
		</div>
	{/if}
</div>