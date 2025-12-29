<script>
	/**
	 * ActionButton Component
	 * 
	 * Universal action button with icon and hover effects
	 * 
	 * @param {string} variant - Button style: 'view', 'edit', 'delete', 'upload', 'download', 'approve', 'reject', 'custom'
	 * @param {Function} onclick - Click handler
	 * @param {boolean} disabled - Disabled state
	 * @param {string} ariaLabel - Accessibility label
	 * @param {string} title - Tooltip text
	 * @param {boolean} isLoading - Loading state
	 * @param {string} customColor - Custom color for 'custom' variant (e.g., 'violet', 'emerald')
	 */
	let {
		variant = 'view',
		onclick,
		disabled = false,
		ariaLabel = '',
		title = '',
		isLoading = false,
		customColor = 'gray'
	} = $props();

	const variants = {
		view: {
			color: 'gray',
			icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
		},
		edit: {
			color: 'blue',
			icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
		},
		delete: {
			color: 'red',
			icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
		},
		upload: {
			color: 'violet',
			icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12'
		},
		download: {
			color: 'emerald',
			icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 13l3 3m0 0l3-3m-3 3V4'
		},
		approve: {
			color: 'green',
			icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
		},
		reject: {
			color: 'orange',
			icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
		},
		custom: {
			color: customColor,
			icon: 'M12 4v16m8-8H4'
		}
	};

	let config = $derived(variants[variant] || variants.custom);
	let color = $derived(config.color);
</script>

<button
	type="button"
	{onclick}
	{disabled}
	aria-label={ariaLabel}
	{title}
	class="group relative inline-flex items-center justify-center rounded-lg p-2 text-{color}-500 transition-all duration-200 hover:bg-{color}-50 hover:text-{color}-700 focus:outline-none focus:ring-2 focus:ring-{color}-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 dark:text-{color}-400 dark:hover:bg-{color}-900/30 dark:hover:text-{color}-300"
>
	{#if isLoading}
		<svg class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
			<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
			<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
		</svg>
	{:else}
		<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={config.icon} />
		</svg>
	{/if}
</button>
