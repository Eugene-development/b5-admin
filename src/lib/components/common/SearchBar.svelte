<script>
	let { placeholder = 'Поиск по таблице...', onSearch, value = '' } = $props();

	let searchInput;
	let debounceTimer;
	let searchId = `search-${Math.random().toString(36).substr(2, 9)}`;
	let descriptionId = `${searchId}-description`;
	let statusId = `${searchId}-status`;

	// Debounced search function (300ms delay)
	function handleInput(event) {
		const searchTerm = event.target.value;
		value = searchTerm;

		// Clear existing timer
		if (debounceTimer) {
			clearTimeout(debounceTimer);
		}

		// Set new timer for debounced search
		debounceTimer = setTimeout(() => {
			onSearch?.(searchTerm);
			// Announce search results to screen readers
			announceSearchResults(searchTerm);
		}, 300);
	}

	// Clear search function
	function clearSearch() {
		value = '';
		onSearch?.('');
		searchInput?.focus();
		// Announce that search was cleared
		announceToScreenReader('Поиск очищен. Показаны все записи.');
	}

	// Announce search results to screen readers
	function announceSearchResults(searchTerm) {
		if (searchTerm.trim()) {
			announceToScreenReader(`Поиск по запросу "${searchTerm}". Результаты обновляются автоматически.`);
		} else {
			announceToScreenReader('Показаны все записи.');
		}
	}

	// Utility function to announce messages to screen readers
	function announceToScreenReader(message) {
		const statusElement = document.getElementById(statusId);
		if (statusElement) {
			statusElement.textContent = message;
			// Clear the message after a short delay to allow for re-announcements
			setTimeout(() => {
				statusElement.textContent = '';
			}, 1000);
		}
	}

	// Handle keyboard navigation
	function handleKeydown(event) {
		// Allow Escape key to clear search
		if (event.key === 'Escape' && value) {
			event.preventDefault();
			clearSearch();
		}
	}

	// Cleanup timer on component destroy
	$effect(() => {
		return () => {
			if (debounceTimer) {
				clearTimeout(debounceTimer);
			}
		};
	});
</script>

<div class="relative py-4">
	<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
		<!-- Search icon -->
		<svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
			<path
				fill-rule="evenodd"
				d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
				clip-rule="evenodd"
			/>
		</svg>
	</div>
	<input
		bind:this={searchInput}
		type="text"
		id={searchId}
		{placeholder}
		{value}
		oninput={handleInput}
		onkeydown={handleKeydown}
		class="block w-full rounded-md border-0 bg-black py-2.5 pr-12 pl-10 text-base text-white shadow-sm ring-1 ring-gray-300 transition-all duration-200 ease-in-out ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-600 focus:ring-inset sm:text-sm sm:leading-6 dark:bg-black dark:text-white dark:ring-gray-600 dark:placeholder:text-gray-500 dark:focus:ring-indigo-500"
		aria-label="Поиск по таблице"
		aria-describedby="{descriptionId} {statusId}"
		role="searchbox"
		autocomplete="off"
		autocorrect="off"
		autocapitalize="off"
		spellcheck="false"
	/>
	{#if value}
		<div class="absolute inset-y-0 right-0 flex items-center pr-2">
			<button
				type="button"
				onclick={clearSearch}
				class="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full p-2 text-gray-400 transition-colors duration-150 ease-in-out hover:text-gray-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none dark:hover:text-gray-300 dark:focus:ring-offset-gray-800"
				aria-label="Clear search"
			>
				<!-- Clear/X icon -->
				<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
					<path
						d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
					/>
				</svg>
			</button>
		</div>
	{/if}
</div>

<!-- Screen reader descriptions and status -->
<div id={descriptionId} class="sr-only">
	Поиск по таблице. Используйте клавишу Escape для очистки поиска.
</div>
<div id={statusId} class="sr-only" aria-live="polite" aria-atomic="true">
	<!-- Dynamic search status announcements -->
</div>
