<script>
	import { truncateText, isTruncated } from '../utils/formatters.js';

	export let text = '';
	export let maxLength = 100;
	export let className = '';
	export let tooltipClassName = 'bg-gray-900 text-white text-sm rounded px-2 py-1 shadow-lg';

	$: displayText = truncateText(text, maxLength);
	$: showTooltip = isTruncated(text, maxLength);

	let showTooltipState = false;
	let tooltipElement;
</script>

<div class="relative inline-block {className}">
	<span
		class="cursor-default"
		class:cursor-help={showTooltip}
		on:mouseenter={() => showTooltip && (showTooltipState = true)}
		on:mouseleave={() => (showTooltipState = false)}
		on:focus={() => showTooltip && (showTooltipState = true)}
		on:blur={() => (showTooltipState = false)}
		tabindex={showTooltip ? 0 : -1}
		role={showTooltip ? 'button' : 'text'}
		aria-label={showTooltip ? `Полный текст: ${text}` : undefined}
	>
		{displayText}
	</span>

	{#if showTooltip && showTooltipState}
		<div
			bind:this={tooltipElement}
			class="absolute z-50 max-w-xs break-words {tooltipClassName}"
			style="bottom: 100%; left: 50%; transform: translateX(-50%); margin-bottom: 4px;"
			role="tooltip"
		>
			{text}
			<div
				class="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"
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