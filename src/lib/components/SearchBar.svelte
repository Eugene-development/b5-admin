<script>
	let { 
		placeholder = "Search agents...", 
		onSearch,
		value = ""
	} = $props();

	let searchInput;
	let debounceTimer;

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
		}, 300);
	}

	// Clear search function
	function clearSearch() {
		value = "";
		onSearch?.("");
		searchInput?.focus();
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

<div class="relative">
	<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
		<!-- Search icon -->
		<svg 
			class="h-5 w-5 text-gray-400" 
			viewBox="0 0 20 20" 
			fill="currentColor" 
			aria-hidden="true"
		>
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
		{placeholder}
		{value}
		oninput={handleInput}
		class="block w-full rounded-md border-0 bg-white py-1.5 pl-10 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:bg-gray-800 dark:text-white dark:ring-gray-600 dark:placeholder:text-gray-500 dark:focus:ring-indigo-500 sm:text-sm sm:leading-6"
		aria-label="Search agents by name, email, or city"
		aria-describedby="search-description"
	/>
	{#if value}
		<div class="absolute inset-y-0 right-0 flex items-center pr-3">
			<button
				type="button"
				onclick={clearSearch}
				class="rounded-full p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:hover:text-gray-300 dark:focus:ring-offset-gray-800"
				aria-label="Clear search"
			>
				<!-- Clear/X icon -->
				<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
					<path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
				</svg>
			</button>
		</div>
	{/if}
</div>

<!-- Screen reader description -->
<div id="search-description" class="sr-only">
	Search for agents by their name, email address, or city
</div>