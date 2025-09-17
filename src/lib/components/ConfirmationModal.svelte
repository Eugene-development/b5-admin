<script>
	import { onMount } from 'svelte';

	/**
	 * ConfirmationModal Component
	 *
	 * A reusable modal component for confirming destructive actions.
	 * Provides proper focus management, keyboard navigation, and accessibility.
	 *
	 * @param {boolean} isOpen - Controls modal visibility
	 * @param {string} title - Modal title text
	 * @param {string} message - Confirmation message text
	 * @param {string} [confirmText='Confirm'] - Text for confirm button
	 * @param {string} [cancelText='Cancel'] - Text for cancel button
	 * @param {Function} onConfirm - Callback function for confirmation
	 * @param {Function} onCancel - Callback function for cancellation
	 * @param {boolean} [isDestructive=false] - Whether this is a destructive action (affects styling)
	 * @param {boolean} [isLoading=false] - Loading state for confirm button
	 */
	let {
		isOpen = false,
		title,
		message,
		confirmText = 'Confirm',
		cancelText = 'Cancel',
		onConfirm,
		onCancel,
		isDestructive = false,
		isLoading = false
	} = $props();

	let modalElement = $state();
	let confirmButtonElement = $state();
	let cancelButtonElement = $state();
	let previousActiveElement;

	// Handle escape key press
	function handleKeydown(event) {
		if (event.key === 'Escape' && isOpen && !isLoading) {
			handleCancel();
		}
	}

	// Handle backdrop click
	function handleBackdropClick(event) {
		if (event.target === event.currentTarget && !isLoading) {
			handleCancel();
		}
	}

	// Handle confirm action
	function handleConfirm() {
		if (onConfirm && !isLoading) {
			onConfirm();
		}
	}

	// Handle cancel action
	function handleCancel() {
		if (onCancel && !isLoading) {
			onCancel();
		}
	}

	// Focus management
	$effect(() => {
		if (isOpen) {
			// Store the previously focused element
			previousActiveElement = document.activeElement;

			// Focus the confirm button when modal opens
			setTimeout(() => {
				if (confirmButtonElement) {
					confirmButtonElement.focus();
				}
			}, 100);

			// Add event listener for escape key
			document.addEventListener('keydown', handleKeydown);

			// Prevent body scroll
			document.body.style.overflow = 'hidden';
		} else {
			// Remove event listener
			document.removeEventListener('keydown', handleKeydown);

			// Restore body scroll
			document.body.style.overflow = '';

			// Restore focus to previously active element
			if (previousActiveElement) {
				previousActiveElement.focus();
			}
		}

		// Cleanup function
		return () => {
			document.removeEventListener('keydown', handleKeydown);
			document.body.style.overflow = '';
		};
	});

	// Trap focus within modal
	function handleTabKey(event) {
		if (!isOpen) return;

		const focusableElements = modalElement?.querySelectorAll(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
		);

		if (!focusableElements || focusableElements.length === 0) return;

		const firstElement = focusableElements[0];
		const lastElement = focusableElements[focusableElements.length - 1];

		if (event.key === 'Tab') {
			if (event.shiftKey) {
				// Shift + Tab
				if (document.activeElement === firstElement) {
					event.preventDefault();
					lastElement.focus();
				}
			} else {
				// Tab
				if (document.activeElement === lastElement) {
					event.preventDefault();
					firstElement.focus();
				}
			}
		}
	}
</script>

<!-- Modal backdrop and container -->
{#if isOpen}
	<div
		class="animate-fade animate-duration-100 animate-ease-linear fixed inset-0 z-50 overflow-y-auto"
	>
		<div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
			<!-- Backdrop -->
			<div
				class="fixed inset-0 bg-black/80 transition-opacity dark:bg-black/80"
				onclick={handleBackdropClick}
				aria-hidden="true"
			></div>

			<!-- Modal panel -->
			<div
				bind:this={modalElement}
				class="relative mx-4 transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:mx-0 sm:my-8 sm:w-full sm:max-w-lg sm:p-6 dark:bg-gray-800"
				onkeydown={handleTabKey}
				role="dialog"
				aria-modal="true"
				aria-labelledby="modal-title"
				tabindex="-1"
			>
				<div class="sm:flex sm:items-start">
					<!-- Icon -->
					<div
						class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10 {isDestructive
							? 'bg-red-100 dark:bg-red-900/20'
							: 'bg-yellow-100 dark:bg-yellow-900/20'}"
					>
						{#if isDestructive}
							<!-- Exclamation triangle icon for destructive actions -->
							<svg
								class="h-6 w-6 text-red-800 dark:text-red-400"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
								/>
							</svg>
						{:else}
							<!-- Question mark icon for non-destructive actions -->
							<svg
								class="h-6 w-6 text-yellow-600 dark:text-yellow-400"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
								/>
							</svg>
						{/if}
					</div>

					<!-- Content -->
					<div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
						<h3
							class="text-base font-semibold leading-6 text-gray-900 dark:text-white"
							id="modal-title"
						>
							{title}
						</h3>
						<div class="mt-2">
							<p class="text-sm text-gray-500 dark:text-gray-400">
								{message}
							</p>
						</div>
					</div>
				</div>

				<!-- Action buttons -->
				<div
					class="mt-6 flex flex-col space-y-3 sm:mt-4 sm:flex-row-reverse sm:space-x-3 sm:space-y-0 sm:space-x-reverse"
				>
					<!-- Confirm button -->
					<button
						bind:this={confirmButtonElement}
						type="button"
						onclick={handleConfirm}
						disabled={isLoading}
						class="inline-flex min-h-[44px] w-full items-center justify-center rounded-md px-4 py-3 text-sm font-semibold shadow-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:py-2 {isDestructive
							? 'bg-red-600 text-white hover:bg-red-500 focus-visible:outline-red-600 active:bg-red-700'
							: 'bg-yellow-600 text-white hover:bg-yellow-500 focus-visible:outline-yellow-600 active:bg-yellow-700'}"
					>
						{#if isLoading}
							<svg
								class="mr-2 h-4 w-4 animate-spin"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								></circle>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
						{/if}
						{confirmText}
					</button>

					<!-- Cancel button -->
					<button
						bind:this={cancelButtonElement}
						type="button"
						onclick={handleCancel}
						disabled={isLoading}
						class="inline-flex min-h-[44px] w-full items-center justify-center rounded-md bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 transition-colors duration-200 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 active:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:py-2 dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-600 dark:active:bg-gray-600"
					>
						{cancelText}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
