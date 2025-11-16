<script>
	/**
	 * Reusable Pagination Component
	 * Based on b5-agent implementation with customizable items per page
	 */

	let {
		currentPage = $bindable(1),
		totalItems = 0,
		itemsPerPage = 8,
		onPageChange = () => {},
		filteredFrom = null
	} = $props();

	// Calculate total pages
	let totalPages = $derived(Math.ceil(totalItems / itemsPerPage));

	// Calculate displayed items range
	let startItem = $derived((currentPage - 1) * itemsPerPage + 1);
	let endItem = $derived(Math.min(currentPage * itemsPerPage, totalItems));

	// Navigation functions
	function goToPage(page) {
		if (page >= 1 && page <= totalPages) {
			currentPage = page;
			onPageChange(page);
		}
	}

	function nextPage() {
		if (currentPage < totalPages) {
			goToPage(currentPage + 1);
		}
	}

	function prevPage() {
		if (currentPage > 1) {
			goToPage(currentPage - 1);
		}
	}
</script>

{#if totalItems > 0}
	<div class="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
		<!-- Results Summary -->
		<div class="text-sm text-gray-700 dark:text-gray-300">
			Показано {startItem}–{endItem} из {totalItems}
			{#if filteredFrom && filteredFrom > totalItems}
				(отфильтровано из {filteredFrom})
			{/if}
		</div>

		<!-- Pagination Buttons -->
		{#if totalPages > 1}
			<div class="flex items-center gap-2">
				<!-- Previous Button -->
				<button
					onclick={prevPage}
					disabled={currentPage === 1}
					class="rounded border border-gray-300 bg-white px-2 py-1 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
					aria-label="Предыдущая страница"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 19l-7-7 7-7"
						/>
					</svg>
				</button>

				<!-- Page Numbers -->
				<div class="flex items-center gap-1">
					{#each Array(totalPages) as _, i}
						{@const pageNum = i + 1}
						{#if pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)}
							<button
								onclick={() => goToPage(pageNum)}
								class="min-w-[32px] rounded border px-2 py-1 text-sm font-medium transition-colors {currentPage ===
								pageNum
									? 'border-gray-400 bg-gray-200 text-gray-900 dark:border-gray-500 dark:bg-gray-700 dark:text-white'
									: 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'}"
								aria-label="Страница {pageNum}"
								aria-current={currentPage === pageNum ? 'page' : undefined}
							>
								{pageNum}
							</button>
						{:else if pageNum === currentPage - 2 || pageNum === currentPage + 2}
							<span class="px-2 text-gray-400">...</span>
						{/if}
					{/each}
				</div>

				<!-- Next Button -->
				<button
					onclick={nextPage}
					disabled={currentPage === totalPages}
					class="rounded border border-gray-300 bg-white px-2 py-1 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
					aria-label="Следующая страница"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 5l7 7-7 7"
						/>
					</svg>
				</button>
			</div>
		{/if}
	</div>
{/if}
