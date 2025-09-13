<!--
  Error Display Component
  Provides consistent error message display across the application
  Requirements: 6.1, 6.2, 6.3, 6.4
-->
<script>
	import {
		createDisplayMessages,
		hasErrors,
		getFirstErrorMessage
	} from '$lib/utils/errorHandler.svelte.js';

	/**
	 * @type {Object} errors - Errors object with field-specific messages
	 */
	export let errors = {};

	/**
	 * @type {string} field - Specific field to display errors for (optional)
	 */
	export let field = null;

	/**
	 * @type {boolean} showFirst - Show only the first error message
	 */
	export let showFirst = false;

	/**
	 * @type {string} className - Additional CSS classes
	 */
	export let className = '';

	/**
	 * @type {string} separator - Separator for multiple error messages
	 */
	export let separator = ' ';

	// Reactive computed values
	$: displayMessages = createDisplayMessages(errors, separator);
	$: hasAnyErrors = hasErrors(errors);
	$: firstError = showFirst ? getFirstErrorMessage(errors) : null;

	// Get errors for specific field or all errors
	$: fieldErrors = field ? errors[field] || [] : errors;
	$: fieldDisplayMessage = field ? displayMessages[field] : null;
</script>

{#if hasAnyErrors}
	<div class="error-display {className}" role="alert" aria-live="polite">
		{#if showFirst && firstError}
			<!-- Show only the first error message -->
			<div class="error-message error-message--general">
				{firstError}
			</div>
		{:else if field && fieldDisplayMessage}
			<!-- Show errors for specific field -->
			<div class="error-message error-message--field">
				{fieldDisplayMessage}
			</div>
		{:else if field && Array.isArray(fieldErrors) && fieldErrors.length > 0}
			<!-- Show field errors as list -->
			{#each fieldErrors as message}
				<div class="error-message error-message--field">
					{message}
				</div>
			{/each}
		{:else if !field}
			<!-- Show all errors -->
			{#each Object.entries(displayMessages) as [errorField, message]}
				<div class="error-message error-message--{errorField}">
					{#if errorField !== 'general' && errorField !== 'auth' && errorField !== 'network' && errorField !== 'server'}
						<span class="error-field">{errorField}:</span>
					{/if}
					{message}
				</div>
			{/each}
		{/if}
	</div>
{/if}

<style>
	.error-display {
		margin: 0.5rem 0;
	}

	.error-message {
		color: #dc2626;
		font-size: 0.875rem;
		line-height: 1.25rem;
		margin-bottom: 0.25rem;
		padding: 0.25rem 0;
	}

	.error-message:last-child {
		margin-bottom: 0;
	}

	.error-field {
		font-weight: 600;
		text-transform: capitalize;
		margin-right: 0.25rem;
	}

	.error-message--general,
	.error-message--auth,
	.error-message--network,
	.error-message--server {
		background-color: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 0.375rem;
		padding: 0.75rem;
		margin-bottom: 0.5rem;
	}

	.error-message--auth {
		border-color: #f87171;
		background-color: #fef2f2;
	}

	.error-message--network {
		border-color: #fb923c;
		background-color: #fff7ed;
		color: #c2410c;
	}

	.error-message--server {
		border-color: #a78bfa;
		background-color: #f5f3ff;
		color: #7c3aed;
	}

	.error-message--field {
		display: block;
	}

	/* Responsive adjustments */
	@media (max-width: 640px) {
		.error-message {
			font-size: 0.8125rem;
		}

		.error-message--general,
		.error-message--auth,
		.error-message--network,
		.error-message--server {
			padding: 0.5rem;
		}
	}
</style>
