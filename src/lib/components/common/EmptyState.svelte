<script>
	/**
	 * EmptyState component for displaying empty states with appropriate messaging
	 * @param {string} type - Type of empty state: 'no-data' | 'no-results'
	 * @param {string} title - Main title text
	 * @param {string} message - Descriptive message
	 * @param {string} searchTerm - Search term for no-results state (optional)
	 * @param {boolean} showIcon - Whether to show the icon (default: true)
	 * @param {string} iconType - Type of icon: 'users' | 'search' (default: 'users')
	 */
	let {
		type = 'no-data',
		title = '',
		message = '',
		searchTerm = '',
		showIcon = true,
		iconType = 'users'
	} = $props();

	// Default titles and messages based on type
	const defaults = {
		'no-data': {
			title: 'Нет данных',
			message: 'Нет данных в системе.',
			iconType: 'users'
		},
		'no-results': {
			title: 'Нет совпадающих результатов',
			message: 'Нет результатов, соответствующих вашему текущему критерию поиска.',
			iconType: 'search'
		}
	};

	// Use provided values or defaults
	const finalTitle = title || defaults[type]?.title || 'Нет данных';
	const finalMessage = message || defaults[type]?.message || 'Нет данных';
	const finalIconType = iconType || defaults[type]?.iconType || 'users';

	// Format search term message for no-results state
	const searchMessage = searchTerm
		? `Попробуйте изменить поисковую фразу "${searchTerm}" или очистить поиск, чтобы увидеть все результаты.`
		: finalMessage;
</script>

<div class="py-12 text-center" role="region" aria-label="Empty state">
	{#if showIcon}
		<div class="mx-auto flex h-12 w-12 animate-pulse items-center justify-center">
			{#if finalIconType === 'search'}
				<!-- Search icon for no-results state -->
				<svg
					class="h-12 w-12 text-gray-400 dark:text-gray-500"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="1.5"
						d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 0z"
					/>
				</svg>
			{:else}
				<!-- Users icon for no-data state -->
				<svg
					class="h-12 w-12 text-gray-400 dark:text-gray-500"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="1.5"
						d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
					/>
				</svg>
			{/if}
		</div>
	{/if}

	<div class="mt-4">
		<h3 class="text-sm font-medium text-gray-900 dark:text-white">
			{finalTitle}
		</h3>
		<p class="mx-auto mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
			{type === 'no-results' ? searchMessage : finalMessage}
		</p>
	</div>

	{#if type === 'no-results' && searchTerm}
		<div class="mt-4">
			<p class="text-xs text-gray-400 dark:text-gray-500">
				Поиск: <span class="font-medium text-gray-600 dark:text-gray-300">"{searchTerm}"</span>
			</p>
		</div>
	{/if}
</div>
