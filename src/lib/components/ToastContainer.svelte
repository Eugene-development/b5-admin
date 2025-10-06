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
		'top-right': 'fixed top-4 right-4',
		'top-left': 'fixed top-4 left-4',
		'bottom-right': 'fixed bottom-4 right-4',
		'bottom-left': 'fixed bottom-4 left-4',
		'top-center': 'fixed top-20 left-1/2 lg:left-[calc(50vw+9rem)] -translate-x-1/2',
		'bottom-center': 'fixed bottom-4 left-1/2 lg:left-[calc(50vw+9rem)] -translate-x-1/2'
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
	<div class="z-[9999] {positionClasses[position]} {additionalClasses}" style="z-index: 9999;">
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
