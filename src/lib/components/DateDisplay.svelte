<script>
	import { formatDate } from '../utils/formatters.js';
	import { getDateUrgencyClasses, getRelativeTime } from '../utils/dateUtils.js';

	let { 
		date = null,
		showRelative = false,
		className = ''
	} = $props();

	let formattedDate = $derived(formatDate(date));
	let urgencyClasses = $derived(getDateUrgencyClasses(date));
	let relativeTime = $derived(showRelative ? getRelativeTime(date) : '');
</script>

<div class="inline-flex flex-col {className}">
	<span class={urgencyClasses}>
		{formattedDate}
	</span>
	{#if showRelative && relativeTime}
		<span class="text-xs text-gray-500 mt-1">
			{relativeTime}
		</span>
	{/if}
</div>