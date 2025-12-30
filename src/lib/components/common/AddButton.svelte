<script>
	/**
	 * Reusable Add Button Component
	 * Used across multiple pages for creating new entities
	 */

	let { onclick = () => {}, disabled = false, isLoading = false, ariaLabel = 'Добавить' } = $props();
</script>

<button
	type="button"
	{onclick}
	{disabled}
	aria-label={ariaLabel}
	class="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-700 to-blue-800 p-2.5 text-white shadow-lg shadow-blue-600/30 transition-all duration-200 hover:from-blue-800 hover:to-blue-900 hover:shadow-xl hover:shadow-blue-600/40 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-lg dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800"
>
	{#if isLoading}
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
				d="M12 4v16m8-8H4"
			/>
		</svg>
	{/if}
</button>
