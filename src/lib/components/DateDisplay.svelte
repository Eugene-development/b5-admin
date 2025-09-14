<script>
	import { formatDate } from '../utils/formatters.js';
	import { getDateUrgencyClasses, getRelativeTime } from '../utils/dateUtils.js';

	export let date = null;
	export let showRelative = false;
	export let className = '';

	$: formattedDate = formatDate(date);
	$: urgencyClasses = getDateUrgencyClasses(date);
	$: relativeTime = showRelative ? getRelativeTime(date) : '';
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