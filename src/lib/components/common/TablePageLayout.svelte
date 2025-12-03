<script>
	/**
	 * @typedef {Object} Props
	 * @property {string} title - Page title
	 * @property {import('svelte').Snippet} [headerActions] - Snippet for header action buttons (refresh, add, etc.)
	 * @property {import('svelte').Snippet} [filters] - Snippet for search and filter components
	 * @property {import('svelte').Snippet} [resultsInfo] - Snippet for results summary/info
	 * @property {import('svelte').Snippet} children - Snippet for main content (table, pagination, etc.)
	 */

	/** @type {Props} */
	let { title, headerActions, filters, resultsInfo, children } = $props();
</script>

<div class="min-h-screen bg-gray-50 dark:bg-gray-950">
	<div class="px-4 py-8 sm:px-6 lg:px-8">
		<div class="mx-auto max-w-7xl">
			<main id="main-content" aria-labelledby="page-title">
				<!-- Page Header -->
				<div class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between">
					<div class="flex items-center justify-between">
						<div>
							<h1 id="page-title" class="text-3xl font-semibold text-gray-900 dark:text-white">
								{title}
							</h1>
						</div>
					</div>
					{#if headerActions}
						<div class="flex items-center space-x-3">
							{@render headerActions()}
						</div>
					{/if}
				</div>

				<!-- Separator -->
				<div class="my-4 border-t border-gray-200 dark:border-gray-700"></div>

				<!-- Filters Section -->
				{#if filters}
					<div
						class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0"
					>
						{@render filters()}
					</div>
				{/if}

				<!-- Results Info Section -->
				{#if resultsInfo}
					{@render resultsInfo()}
				{/if}

				<!-- Main Content (Table and Pagination) -->
				<div class="mt-8">
					{@render children()}
				</div>
			</main>
		</div>
	</div>
</div>
