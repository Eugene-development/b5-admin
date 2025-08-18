<script>
	/**
	 * LoadingSpinner Component
	 *
	 * A reusable loading spinner component with Tailwind animations.
	 * Provides different sizes and color variants with proper accessibility.
	 *
	 * @param {string} [size='md'] - Size variant: 'sm', 'md', 'lg', 'xl'
	 * @param {string} [color='primary'] - Color variant: 'primary', 'white', 'gray', 'red', 'yellow', 'green'
	 * @param {string} [label='Loading...'] - Accessible label for screen readers
	 * @param {boolean} [inline=false] - Whether to display inline or as block element
	 * @param {string} [class=''] - Additional CSS classes
	 */
	let {
		size = 'md',
		color = 'primary',
		label = 'Loading...',
		inline = false,
		class: additionalClasses = ''
	} = $props();

	// Size configurations
	const sizeClasses = {
		sm: 'h-4 w-4',
		md: 'h-6 w-6',
		lg: 'h-8 w-8',
		xl: 'h-12 w-12'
	};

	// Color configurations
	const colorClasses = {
		primary: 'text-indigo-600 dark:text-indigo-400',
		white: 'text-white',
		gray: 'text-gray-600 dark:text-gray-400',
		red: 'text-red-600 dark:text-red-400',
		yellow: 'text-yellow-600 dark:text-yellow-400',
		green: 'text-green-600 dark:text-green-400'
	};

	// Container classes
	const containerClasses = inline ? 'inline-flex' : 'flex justify-center';

	// Combine all classes
	const spinnerClasses = `${sizeClasses[size]} ${colorClasses[color]} animate-spin ${additionalClasses}`;
</script>

<div class="{containerClasses} items-center" role="status" aria-label={label}>
	<svg
		class={spinnerClasses}
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 24 24"
		aria-hidden="true"
	>
		<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
		></circle>
		<path
			class="opacity-75"
			fill="currentColor"
			d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
		></path>
	</svg>
	<span class="sr-only">{label}</span>
</div>
