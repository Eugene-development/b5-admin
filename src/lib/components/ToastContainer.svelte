<script>
	import Toast from './Toast.svelte';

	/**
	 * ToastContainer Component
	 *
	 * A container component for managing multiple toast notifications.
	 * Handles positioning, stacking, and lifecycle management of toasts.
	 *
	 * @param {Array} toasts - Array of toast objects
	 * @param {string} [position='top-right'] - Position: 'top-right', 'top-left', 'bottom-right', 'bottom-left', 'top-center', 'bottom-center'
	 * @param {number} [maxToasts=5] - Maximum number of toasts to display
	 * @param {string} [class=''] - Additional CSS classes
	 */
	let {
		toasts = [],
		position = 'top-right',
		maxToasts = 5,
		class: additionalClasses = ''
	} = $props();

	// Position configurations
	const positionClasses = {
		'top-right': 'fixed top-4 right-4 z-50',
		'top-left': 'fixed top-4 left-4 z-50',
		'bottom-right': 'fixed bottom-4 right-4 z-50',
		'bottom-left': 'fixed bottom-4 left-4 z-50',
		'top-center': 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50',
		'bottom-center': 'fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50'
	};

	// Limit the number of visible toasts
	let visibleToasts = $derived(toasts.slice(0, maxToasts));

	// Handle toast dismissal
	function handleToastDismiss(toastId) {
		// Find the toast and call its onDismiss callback if it exists
		const toast = toasts.find((t) => t.id === toastId);
		if (toast && toast.onDismiss) {
			toast.onDismiss();
		}
	}
</script>

{#if visibleToasts.length > 0}
	<div class="{positionClasses[position]} {additionalClasses}">
		<div class="flex w-96 max-w-md flex-col space-y-2">
			{#each visibleToasts as toast (toast.id)}
				<div class="transform transition-all duration-300 ease-in-out">
					<Toast
						type={toast.type}
						message={toast.message}
						isVisible={toast.isVisible !== false}
						duration={toast.duration}
						dismissible={toast.dismissible}
						onDismiss={() => handleToastDismiss(toast.id)}
						class={toast.class || ''}
					/>
				</div>
			{/each}
		</div>
	</div>
{/if}
