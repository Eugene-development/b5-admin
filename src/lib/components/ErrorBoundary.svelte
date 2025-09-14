<script>
	import { onMount } from 'svelte';
	import LoadingSpinner from './LoadingSpinner.svelte';

	/**
	 * ErrorBoundary Component
	 *
	 * A component that catches JavaScript errors anywhere in the child component tree,
	 * logs those errors, and displays a fallback UI instead of crashing.
	 *
	 * @param {boolean} [hasError=false] - Whether an error has occurred
	 * @param {Error|null} [error=null] - The error object
	 * @param {Function} [onError] - Callback function when an error occurs
	 * @param {Function} [onRetry] - Callback function for retry action
	 * @param {string} [fallbackTitle='Something went wrong'] - Title for error fallback UI
	 * @param {string} [fallbackMessage=''] - Message for error fallback UI
	 * @param {boolean} [showRetry=true] - Whether to show retry button
	 * @param {boolean} [showDetails=false] - Whether to show error details
	 * @param {string} [class=''] - Additional CSS classes
	 */
	let {
		hasError = false,
		error = null,
		onError,
		onRetry,
		fallbackTitle = 'Something went wrong',
		fallbackMessage = 'An unexpected error occurred. Please try again or contact support if the problem persists.',
		showRetry = true,
		showDetails = false,
		class: additionalClasses = '',
		children
	} = $props();

	let isRetrying = $state(false);
	let showErrorDetails = $state(false);

	// Handle retry action
	async function handleRetry() {
		if (onRetry && !isRetrying) {
			isRetrying = true;
			try {
				await onRetry();
				// Reset error state if retry is successful
				hasError = false;
				error = null;
			} catch (retryError) {
				console.error('Retry failed:', retryError);
				// Keep error state if retry fails
				if (onError) {
					onError(retryError);
				}
			} finally {
				isRetrying = false;
			}
		}
	}

	// Toggle error details visibility
	function toggleErrorDetails() {
		showErrorDetails = !showErrorDetails;
	}

	// Format error for display
	function formatError(err) {
		if (!err) return 'Unknown error';

		let errorInfo = `Error: ${err.message || 'Unknown error'}\n`;

		if (err.stack) {
			errorInfo += `Stack: ${err.stack}\n`;
		}

		if (err.name) {
			errorInfo += `Type: ${err.name}\n`;
		}

		return errorInfo;
	}

	// Log error when it occurs
	$effect(() => {
		if (hasError && error) {
			console.error('ErrorBoundary caught an error:', error);

			// Call onError callback if provided
			if (onError) {
				onError(error);
			}
		}
	});
</script>

{#if hasError}
	<div class="flex min-h-96 items-center justify-center p-6 {additionalClasses}">
		<div class="mx-auto max-w-md text-center">
			<!-- Error Icon -->
			<div
				class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20"
			>
				<svg
					class="h-6 w-6 text-red-600 dark:text-red-400"
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
			</div>

			<!-- Error Title -->
			<h3 class="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
				{fallbackTitle}
			</h3>

			<!-- Error Message -->
			<p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
				{fallbackMessage}
			</p>

			<!-- Action Buttons -->
			<div class="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
				{#if showRetry}
					<button
						type="button"
						onclick={handleRetry}
						disabled={isRetrying}
						class="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{#if isRetrying}
							<LoadingSpinner size="sm" color="white" inline={true} class="mr-2" />
						{/if}
						{isRetrying ? 'Retrying...' : 'Try Again'}
					</button>
				{/if}

				{#if showDetails}
					<button
						type="button"
						onclick={toggleErrorDetails}
						class="inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-300 transition-colors duration-200 ring-inset hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-gray-800 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-700"
					>
						{showErrorDetails ? 'Hide Details' : 'Show Details'}
					</button>
				{/if}
			</div>

			<!-- Error Details -->
			{#if showDetails && showErrorDetails && error}
				<div class="mt-6 text-left">
					<details class="group">
						<summary
							class="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
						>
							Technical Details
						</summary>
						<div class="mt-2 rounded-md bg-gray-50 p-3 dark:bg-gray-800">
							<pre
								class="overflow-x-auto text-xs whitespace-pre-wrap text-gray-600 dark:text-gray-400">
								{formatError(error)}
							</pre>
						</div>
					</details>
				</div>
			{/if}
		</div>
	</div>
{:else}
	{@render children()}
{/if}
