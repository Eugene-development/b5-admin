<script>
	import LoadingSpinner from './LoadingSpinner.svelte';

	/**
	 * LoadingOverlay Component
	 *
	 * A full-screen overlay component for displaying loading states during authentication processes.
	 * Provides a backdrop with a centered loading spinner and customizable message.
	 * Designed to match B5-Admin design system with Tailwind CSS integration.
	 *
	 * @param {boolean} show - Controls overlay visibility
	 * @param {string} [message='Loading...'] - Custom loading message to display
	 * @param {string} [spinnerSize='lg'] - Size of the loading spinner: 'sm', 'md', 'lg', 'xl'
	 * @param {string} [spinnerColor='primary'] - Color of the loading spinner
	 * @param {boolean} [preventBodyScroll=true] - Whether to prevent body scrolling when overlay is shown
	 * @param {string} [class=''] - Additional CSS classes
	 */
	let {
		show = false,
		message = 'Loading...',
		spinnerSize = 'lg',
		spinnerColor = 'primary',
		preventBodyScroll = true,
		class: additionalClasses = ''
	} = $props();

	// Handle body scroll prevention
	$effect(() => {
		if (show && preventBodyScroll) {
			// Prevent body scroll when overlay is shown
			document.body.style.overflow = 'hidden';
		} else {
			// Restore body scroll when overlay is hidden
			document.body.style.overflow = '';
		}

		// Cleanup function to restore scroll on component unmount
		return () => {
			document.body.style.overflow = '';
		};
	});
</script>

<!-- Loading overlay -->
{#if show}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center {additionalClasses}"
		role="status"
		aria-live="polite"
		aria-label={message}
	>
		<!-- Backdrop -->
		<div
			class="absolute inset-0 bg-gray-950/50 backdrop-blur-sm transition-opacity dark:bg-gray-950/60"
			aria-hidden="true"
		></div>

		<!-- Content container -->
		<div
			class="relative z-10 flex flex-col items-center justify-center space-y-4 rounded-lg bg-white/95 px-8 py-6 shadow-xl backdrop-blur-sm dark:bg-gray-800/95"
		>
			<!-- Loading spinner -->
			<LoadingSpinner size={spinnerSize} color={spinnerColor} label={message} />

			<!-- Loading message -->
			<div class="text-center">
				<p class="text-sm font-medium text-gray-900 dark:text-white">
					{message}
				</p>
			</div>
		</div>
	</div>
{/if}