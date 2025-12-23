<script>
	/**
	 * DateIndicator component
	 * Displays a colored rectangle (sky if date exists, gray if not)
	 * Shows the date in a tooltip on hover
	 */
	
	let { date = null } = $props();

	/**
	 * Format date helper function
	 * @param {string} dateString - ISO date string
	 * @returns {string} Formatted date string
	 */
	function formatDate(dateString) {
		if (!dateString) return 'Дата не указана';
		const formatted = new Date(dateString).toLocaleDateString('ru-RU', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
		return formatted.replace(/\.\s(\d{4})\sг\./, ' $1').replace(/\.\s(\d{4})/, ' $1');
	}

	const hasDate = $derived(!!date);
</script>

<div class="group relative inline-flex items-center justify-center">
	<span
		class="inline-block h-4 w-8 rounded {hasDate ? 'bg-sky-400 dark:bg-sky-500' : 'bg-gray-300 dark:bg-gray-600'}"
		role="img"
		aria-label={hasDate ? `Дата: ${formatDate(date)}` : 'Дата не указана'}
	></span>
	
	<!-- Tooltip -->
	<div
		class="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 transform opacity-0 transition-opacity duration-200 group-hover:opacity-100"
	>
		<div class="whitespace-nowrap rounded-md bg-gray-900 px-3 py-1.5 text-xs text-white shadow-lg dark:bg-gray-700">
			{formatDate(date)}
		</div>
		<!-- Arrow -->
		<div class="absolute left-1/2 top-full -translate-x-1/2 transform">
			<div class="border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
		</div>
	</div>
</div>
