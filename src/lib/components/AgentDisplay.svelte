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
			<div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
				<span class="text-sm font-medium text-blue-600">
					{agent.name ? agent.name.charAt(0).toUpperCase() : agent.email.charAt(0).toUpperCase()}
				</span>
			</div>
			<div class="flex flex-col">
				{#if clickable}
					<button
						type="button"
						class="m-0 cursor-pointer border-none bg-transparent p-0 text-left text-sm font-medium text-gray-900 hover:text-blue-600"
						on:click={handleAgentClick}
					>
						{agent.name || agent.email}
					</button>
				{:else}
					<span class="text-sm font-medium text-gray-900">
						{agent.name || agent.email}
					</span>
				{/if}
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
			<div class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
				<span class="text-sm text-gray-400">?</span>
			</div>
			<span class="text-sm text-gray-500">
				{displayText}
			</span>
		</div>
	{/if}
</div>
