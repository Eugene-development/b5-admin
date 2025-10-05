<script>
	import { truncateText, isTruncated } from '../utils/formatters.js';

	let {
		text = '',
		maxLength = 100,
		className = '',
		tooltipClassName = 'bg-gray-900 text-white text-sm rounded px-2 py-1 shadow-lg'
	} = $props();

	let displayText = $derived(truncateText(text, maxLength));
	let showTooltip = $derived(isTruncated(text, maxLength));

	let showTooltipState = $state(false);
	let tooltipElement = $state();
</script>

<div class="relative inline-block {className}">
	{#if showTooltip}
		<button
			type="button"
			class="font-inherit m-0 cursor-help border-none bg-transparent p-0 text-inherit"
			onmouseenter={() => (showTooltipState = true)}
			onmouseleave={() => (showTooltipState = false)}
			onfocus={() => (showTooltipState = true)}
			onblur={() => (showTooltipState = false)}
			aria-label={`Полный текст: ${text}`}
		>
			{displayText}
		</button>
	{:else}
		<span>
			{displayText}
		</span>
	{/if}

	{#if showTooltip && showTooltipState}
		<div
			bind:this={tooltipElement}
			class="absolute z-50 max-w-xs break-words {tooltipClassName}"
			style="bottom: 100%; left: 50%; transform: translateX(-50%); margin-bottom: 4px;"
			role="tooltip"
		>
			{text}
			<div
				class="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 transform border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"
			></div>
		</div>
	{/if}
</div>

<style>
	/* Ensure tooltip appears above other elements */
	:global(.tooltip-container) {
		position: relative;
		z-index: 1000;
	}
</style>
