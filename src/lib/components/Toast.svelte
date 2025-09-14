<script>
	import { onMount } from 'svelte';

	/**
	 * Toast Component
	 *
	 * A reusable toast notification component for displaying temporary messages.
	 * Supports different types, auto-dismiss, and proper accessibility.
	 *
	 * @param {string} type - Toast type: 'success', 'error', 'warning', 'info'
	 * @param {string} message - The message to display
	 * @param {boolean} [isVisible=true] - Controls toast visibility
	 * @param {number} [duration=5000] - Auto-dismiss duration in milliseconds (0 = no auto-dismiss)
	 * @param {Function} [onDismiss] - Callback function when toast is dismissed
	 * @param {boolean} [dismissible=true] - Whether the toast can be manually dismissed
	 * @param {string} [class=''] - Additional CSS classes
	 */
	let {
		type = 'info',
		message,
		isVisible = true,
		duration = 5000,
		onDismiss,
		dismissible = true,
		class: additionalClasses = ''
	} = $props();

	let toastElement = $state();
	let timeoutId;

	// Type configurations
	const typeConfig = {
		success: {
			bgClass: 'bg-green-50 dark:bg-green-900/20',
			iconClass: 'text-green-400',
			textClass: 'text-green-800 dark:text-green-200',
			buttonClass:
				'bg-green-50 text-green-500 hover:bg-green-100 focus:ring-green-600 focus:ring-offset-green-50 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40',
			icon: `<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.236 4.53L7.53 10.23a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />`
		},
		error: {
			bgClass: 'bg-red-50 dark:bg-red-900/20',
			iconClass: 'text-red-400',
			textClass: 'text-red-800 dark:text-red-200',
			buttonClass:
				'bg-red-50 text-red-500 hover:bg-red-100 focus:ring-red-600 focus:ring-offset-red-50 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40',
			icon: `<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />`
		},
		warning: {
			bgClass: 'bg-yellow-50 dark:bg-yellow-900/20',
			iconClass: 'text-yellow-400',
			textClass: 'text-yellow-800 dark:text-yellow-200',
			buttonClass:
				'bg-yellow-50 text-yellow-500 hover:bg-yellow-100 focus:ring-yellow-600 focus:ring-offset-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-900/40',
			icon: `<path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />`
		},
		info: {
			bgClass: 'bg-blue-50 dark:bg-blue-900/20',
			iconClass: 'text-blue-400',
			textClass: 'text-blue-800 dark:text-blue-200',
			buttonClass:
				'bg-blue-50 text-blue-500 hover:bg-blue-100 focus:ring-blue-600 focus:ring-offset-blue-50 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40',
			icon: `<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />`
		}
	};

	const config = typeConfig[type] || typeConfig.info;

	// Handle dismiss
	function handleDismiss() {
		if (dismissible && onDismiss) {
			onDismiss();
		}
	}

	// Auto-dismiss functionality
	$effect(() => {
		if (isVisible && duration > 0) {
			timeoutId = setTimeout(() => {
				handleDismiss();
			}, duration);
		}

		return () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		};
	});

	// Announce to screen readers
	$effect(() => {
		if (isVisible && toastElement) {
			// Announce the message to screen readers
			const announcement = document.createElement('div');
			announcement.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
			announcement.setAttribute('aria-atomic', 'true');
			announcement.className = 'sr-only';
			announcement.textContent = `${type}: ${message}`;
			document.body.appendChild(announcement);

			// Clean up after announcement
			setTimeout(() => {
				if (document.body.contains(announcement)) {
					document.body.removeChild(announcement);
				}
			}, 1000);
		}
	});
</script>

{#if isVisible}
	<div
		bind:this={toastElement}
		class="rounded-md p-4 {config.bgClass} {additionalClasses}"
		role="alert"
		aria-live={type === 'error' ? 'assertive' : 'polite'}
		aria-atomic="true"
	>
		<div class="flex">
			<div class="flex-shrink-0">
				<svg
					class="h-5 w-5 {config.iconClass}"
					viewBox="0 0 20 20"
					fill="currentColor"
					aria-hidden="true"
				>
					{@html config.icon}
				</svg>
			</div>
			<div class="ml-3">
				<p class="text-sm font-medium {config.textClass}">
					{message}
				</p>
			</div>
			{#if dismissible}
				<div class="ml-auto pl-3">
					<div class="-mx-1.5 -my-1.5">
						<button
							type="button"
							onclick={handleDismiss}
							class="inline-flex rounded-md p-1.5 focus:ring-2 focus:ring-offset-2 focus:outline-none {config.buttonClass}"
							aria-label="Dismiss notification"
						>
							<span class="sr-only">Dismiss</span>
							<svg class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
								<path
									d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
								/>
							</svg>
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}
