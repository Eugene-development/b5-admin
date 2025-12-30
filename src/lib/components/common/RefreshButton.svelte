<script>
	/**
	 * Reusable Refresh Button Component
	 * Used across multiple pages for data refresh functionality
	 */

	let { isRefreshing = false, onclick = () => {}, disabled = false, ariaLabel = 'Обновить данные' } = $props();
</script>

<button
	type="button"
	{onclick}
	disabled={isRefreshing || disabled}
	aria-label={ariaLabel}
	class="inline-flex items-center justify-center rounded-lg bg-white p-2.5 text-gray-700 shadow-md ring-1 ring-gray-200 ring-inset transition-all duration-200 hover:bg-gray-100 hover:text-gray-900 hover:shadow-lg hover:-translate-y-0.5 hover:ring-gray-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-md dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-700 dark:hover:bg-gray-700 dark:hover:text-white dark:hover:ring-gray-600"
>
	{#if isRefreshing}
		<svg
			class="h-5 w-5 animate-spin"
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			aria-hidden="true"
		>
			<circle
				class="opacity-25"
				cx="12"
				cy="12"
				r="10"
				stroke="currentColor"
				stroke-width="4"
			></circle>
			<path
				class="opacity-75"
				fill="currentColor"
				d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
			></path>
		</svg>
	{:else}
		<svg
			class="h-5 w-5"
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			stroke-width="2.5"
			aria-hidden="true"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
			></path>
		</svg>
	{/if}
</button>
