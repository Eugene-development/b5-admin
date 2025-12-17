<script>
	/**
	 * DateBadge component for consistent date display across tables
	 * Displays date with gray background and formatted text
	 */
	
	let { date = null, fallback = 'Не указана' } = $props();

	/**
	 * Format date helper function
	 * @param {string} dateString - ISO date string
	 * @returns {string} Formatted date string
	 */
	function formatDate(dateString) {
		if (!dateString) return fallback;
		const formatted = new Date(dateString).toLocaleDateString('ru-RU', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
		// Remove dot after month abbreviation and "г." before year
		return formatted.replace(/\.\s(\d{4})\sг\./, ' $1').replace(/\.\s(\d{4})/, ' $1');
	}
</script>

<span
	class="inline-block rounded-md bg-gray-200 px-2.5 py-1 text-sm text-gray-900 dark:bg-gray-900 dark:text-gray-100"
>
	{formatDate(date)}
</span>
