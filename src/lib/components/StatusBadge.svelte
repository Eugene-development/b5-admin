<script>
	/**
	 * StatusBadge Component
	 *
	 * A reusable badge component for displaying status indicators with proper
	 * color coding and accessibility features.
	 *
	 * @param {string} status - The status to display ('verified', 'unverified', 'banned')
	 * @param {string} [text] - Optional custom text to display (defaults to status)
	 * @param {string} [size='sm'] - Size variant ('xs', 'sm', 'md')
	 */
	let { status, text = null, size = 'sm' } = $props();

	// Get the display text for the badge
	function getDisplayText(status, customText) {
		if (customText) return customText;

		switch (status) {
			case 'verified':
				return '+';
			case 'unverified':
				return '-';
			case 'banned':
				return 'Блок';
			default:
				return status;
		}
	}

	// Get accessible description for screen readers
	function getAccessibleDescription(status, customText) {
		if (customText) return customText;

		switch (status) {
			case 'verified':
				return 'Email verified';
			case 'unverified':
				return 'Email not verified';
			case 'banned':
				return 'Account banned';
			default:
				return status;
		}
	}

	// Get the appropriate CSS classes based on status and size
	function getBadgeClasses(status, size) {
		// Base classes for all badges
		const baseClasses =
			'inline-flex items-center rounded-md font-medium ring-1 ring-inset transition-all duration-200 ease-in-out';

		// Size-specific classes
		const sizeClasses = {
			xs: 'px-1.5 py-0.5 text-xs',
			sm: 'px-2 py-1 text-xs',
			md: 'px-2.5 py-1.5 text-sm'
		};

		// Status-specific color classes
		const statusClasses = {
			verified:
				'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-400/10 dark:text-green-400 dark:ring-green-400/20',
			unverified:
				'bg-gray-50 text-gray-600 ring-gray-500/10 dark:bg-gray-400/10 dark:text-gray-400 dark:ring-gray-400/20',
			banned:
				'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-400/10 dark:text-red-400 dark:ring-red-400/20'
		};

		return `${baseClasses} ${sizeClasses[size] || sizeClasses.sm} ${statusClasses[status] || statusClasses.unverified}`;
	}

	// Computed values using Svelte 5 runes
	const displayText = $derived(getDisplayText(status, text));
	const badgeClasses = $derived(getBadgeClasses(status, size));
	const accessibleDescription = $derived(getAccessibleDescription(status, text));
</script>

<span
	class={badgeClasses}
	role="status"
	aria-label={accessibleDescription}
	title={accessibleDescription}
>
	{displayText}
</span>
