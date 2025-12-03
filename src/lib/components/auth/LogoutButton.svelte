<script>
	import { logout, authState } from '$lib/auth/auth.svelte.js';
	import { goto } from '$app/navigation';

	// Props
	let {
		showConfirmation = false,
		redirectTo = '/login',
		variant = 'button', // 'button' | 'link'
		size = 'medium', // 'small' | 'medium' | 'large'
		className = ''
	} = $props();

	// Component state
	let showConfirmDialog = $state(false);

	/**
	 * Handle logout action
	 * Requirements: 3.1, 3.2, 3.3
	 */
	async function handleLogout() {
		try {
			// Pass redirectTo option to logout function to handle redirect internally
			await logout({ redirectTo });
		} catch (error) {
			// Error handling is done in the auth module
			console.error('Logout failed:', error);

			// If logout completely fails, still try to redirect manually
			goto(redirectTo);
		}
	}

	/**
	 * Handle logout button click
	 * Shows confirmation dialog if enabled, otherwise logs out directly
	 */
	function handleClick() {
		if (showConfirmation) {
			showConfirmDialog = true;
		} else {
			handleLogout();
		}
	}

	/**
	 * Handle confirmation dialog actions
	 */
	function confirmLogout() {
		showConfirmDialog = false;
		handleLogout();
	}

	function cancelLogout() {
		showConfirmDialog = false;
	}

	/**
	 * Handle keyboard events for confirmation dialog
	 */
	function handleDialogKeydown(event) {
		if (event.key === 'Escape') {
			cancelLogout();
		}
	}

	/**
	 * Handle overlay click - only close if clicking on overlay, not content
	 */
	function handleOverlayClick(event) {
		if (event.target === event.currentTarget) {
			cancelLogout();
		}
	}
</script>

<!-- Only show logout button if user is authenticated -->
{#if authState.isAuthenticated}
	{#if variant === 'link'}
		<button
			type="button"
			onclick={handleClick}
			disabled={authState.isLoading}
			class="logout-link {size} {className}"
			aria-label="Sign out of your account"
		>
			{#if authState.isLoading}
				<span class="loading-spinner" aria-hidden="true"></span>
				Signing out...
			{:else}
				Sign Out
			{/if}
		</button>
	{:else}
		<button
			type="button"
			onclick={handleClick}
			disabled={authState.isLoading}
			class="logout-button {size} {className}"
			aria-label="Sign out of your account"
		>
			{#if authState.isLoading}
				<span class="loading-spinner" aria-hidden="true"></span>
				Signing out...
			{:else}
				Sign Out
			{/if}
		</button>
	{/if}

	<!-- Confirmation Dialog -->
	{#if showConfirmDialog}
		<div
			class="dialog-overlay"
			onclick={handleOverlayClick}
			onkeydown={handleDialogKeydown}
			role="dialog"
			aria-modal="true"
			aria-labelledby="logout-dialog-title"
			tabindex="-1"
		>
			<div class="dialog-content" role="document">
				<h3 id="logout-dialog-title">Confirm Sign Out</h3>
				<p>Are you sure you want to sign out of your account?</p>

				<div class="dialog-actions">
					<button type="button" onclick={cancelLogout} class="dialog-button secondary">
						Cancel
					</button>
					<button type="button" onclick={confirmLogout} class="dialog-button primary">
						Sign Out
					</button>
				</div>
			</div>
		</div>
	{/if}
{/if}

<style>
	/* Button Styles */
	.logout-button {
		background-color: #dc3545;
		color: white;
		border: none;
		border-radius: 4px;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s ease;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		text-decoration: none;
	}

	.logout-button:hover:not(:disabled) {
		background-color: #c82333;
	}

	.logout-button:disabled {
		background-color: #6c757d;
		cursor: not-allowed;
		opacity: 0.6;
	}

	/* Link Styles */
	.logout-link {
		background: none;
		color: #dc3545;
		border: none;
		cursor: pointer;
		text-decoration: underline;
		font-weight: 500;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0;
	}

	.logout-link:hover:not(:disabled) {
		color: #c82333;
	}

	.logout-link:disabled {
		color: #6c757d;
		cursor: not-allowed;
		opacity: 0.6;
	}

	/* Size Variants */
	.small {
		padding: 0.375rem 0.75rem;
		font-size: 0.875rem;
	}

	.medium {
		padding: 0.5rem 1rem;
		font-size: 1rem;
	}

	.large {
		padding: 0.75rem 1.5rem;
		font-size: 1.125rem;
	}

	.logout-link.small,
	.logout-link.medium,
	.logout-link.large {
		padding: 0;
	}

	/* Loading Spinner */
	.loading-spinner {
		width: 16px;
		height: 16px;
		border: 2px solid transparent;
		border-top: 2px solid currentColor;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Dialog Styles */
	.dialog-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.dialog-content {
		background: white;
		border-radius: 8px;
		padding: 1.5rem;
		max-width: 400px;
		width: 100%;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
	}

	.dialog-content h3 {
		margin: 0 0 1rem 0;
		color: #333;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.dialog-content p {
		margin: 0 0 1.5rem 0;
		color: #666;
		line-height: 1.5;
	}

	.dialog-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
	}

	.dialog-button {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 4px;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s ease;
		min-width: 80px;
	}

	.dialog-button.secondary {
		background-color: #6c757d;
		color: white;
	}

	.dialog-button.secondary:hover {
		background-color: #5a6268;
	}

	.dialog-button.primary {
		background-color: #dc3545;
		color: white;
	}

	.dialog-button.primary:hover {
		background-color: #c82333;
	}

	/* Responsive Design */
	@media (max-width: 480px) {
		.dialog-content {
			margin: 1rem;
			padding: 1rem;
		}

		.dialog-actions {
			flex-direction: column-reverse;
		}

		.dialog-button {
			width: 100%;
		}
	}

	/* Focus Styles */
	.logout-button:focus,
	.logout-link:focus,
	.dialog-button:focus {
		outline: 2px solid #007bff;
		outline-offset: 2px;
	}

	/* High Contrast Mode Support */
	@media (prefers-contrast: high) {
		.logout-button {
			border: 2px solid currentColor;
		}

		.logout-link {
			text-decoration: underline;
		}
	}

	/* Reduced Motion Support */
	@media (prefers-reduced-motion: reduce) {
		.loading-spinner {
			animation: none;
		}

		.logout-button,
		.logout-link,
		.dialog-button {
			transition: none;
		}
	}
</style>
