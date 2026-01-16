<script>
	/**
	 * StatusBadge Component
	 *
	 * A reusable badge component for displaying status indicators with proper
	 * color coding and accessibility features.
	 *
	 * @param {string|object} status - The status to display (string or object with slug/value)
	 * @param {string} [text] - Optional custom text to display (defaults to status)
	 * @param {string} [size='sm'] - Size variant ('xs', 'sm', 'md')
	 */
	let { status, text = null, size = 'sm' } = $props();

	// Get status slug from status object or string
	function getStatusSlug(status) {
		if (typeof status === 'object' && status !== null) {
			return status.slug || '';
		}
		return status || '';
	}

	// Get status value from status object or string
	function getStatusValue(status) {
		if (typeof status === 'object' && status !== null) {
			return status.value || '';
		}
		return status || '';
	}

	// Get the display text for the badge
	function getDisplayText(status, customText) {
		if (customText) return customText;

		const statusSlug = getStatusSlug(status);

		// For project statuses (objects), use the value from the status object
		if (typeof status === 'object' && status !== null) {
			const statusValue = getStatusValue(status);
			if (statusValue) return statusValue;
		}

		// For legacy user statuses (strings)
		switch (statusSlug) {
			case 'verified':
				return '+';
			case 'unverified':
				return '-';
			case 'active':
				return 'Активен';
			case 'banned':
				return 'Забанен';
			default:
				return statusSlug || 'Не указан';
		}
	}

	// Get accessible description for screen readers
	function getAccessibleDescription(status, customText) {
		if (customText) return customText;

		const statusSlug = getStatusSlug(status);
		const statusValue = getStatusValue(status);

		// For legacy user statuses - check first
		switch (statusSlug) {
			case 'verified':
				return 'Почта подтверждена';
			case 'unverified':
				return 'Почта не подтверждена';
			case 'active':
				return 'Аккаунт активен';
			case 'banned':
				return 'Аккаунт забанен';
		}

		// For project statuses, use the value
		if (statusValue) return statusValue;

		// Default fallback
		return statusSlug || 'Не указан';
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

		const statusSlug = getStatusSlug(status);

		// Status-specific color classes
		const statusClasses = {
			// User statuses
			verified:
				'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-400/10 dark:text-green-400 dark:ring-green-400/20',
			unverified:
				'bg-gray-50 text-gray-600 ring-gray-500/10 dark:bg-gray-400/10 dark:text-gray-400 dark:ring-gray-400/20',
			banned:
				'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-400/10 dark:text-red-400 dark:ring-red-400/20',

			// Project statuses
			'new-project':
				'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/20',
			'curator-processing':
				'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-400/10 dark:text-emerald-400 dark:ring-emerald-400/20',
			'in-progress':
				'bg-yellow-50 text-yellow-700 ring-yellow-600/20 dark:bg-yellow-400/10 dark:text-yellow-400 dark:ring-yellow-400/20',
			completed:
				'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-400/10 dark:text-green-400 dark:ring-green-400/20',
			'bonus-paid':
				'bg-slate-50 text-slate-700 ring-slate-600/20 dark:bg-slate-400/10 dark:text-slate-400 dark:ring-slate-400/20',
			'client-refused':
				'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-400/10 dark:text-red-400 dark:ring-red-400/20',
			cancelled:
				'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-400/10 dark:text-red-400 dark:ring-red-400/20'
		};

		return `${baseClasses} ${sizeClasses[size] || sizeClasses.sm} ${statusClasses[statusSlug] || statusClasses.unverified}`;
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
