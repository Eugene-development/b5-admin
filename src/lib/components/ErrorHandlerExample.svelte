<!--
  Example component demonstrating error handler usage
  This shows how to integrate the centralized error handling utilities
  Requirements: 6.1, 6.2, 6.3, 6.4
-->
<script>
	import {
		handleApiError,
		ERROR_TYPES,
		HTTP_STATUS,
		createDisplayMessages,
		getFirstErrorMessage,
		hasErrors,
		clearErrorFields,
		mergeErrors
	} from '../utils/errorHandler.svelte.js';
	import ErrorDisplay from './ErrorDisplay.svelte';

	// Example error states
	let currentErrors = $state({});
	let errorType = $state('');
	let errorMessage = $state('');

	/**
	 * Simulate different types of API errors for demonstration
	 */
	function simulateError(type) {
		let mockError;

		switch (type) {
			case 'validation':
				mockError = {
					status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
					data: {
						errors: {
							email: ['Email is required', 'Email must be valid'],
							password: ['Password must be at least 8 characters'],
							name: ['Name is required']
						}
					}
				};
				break;

			case 'authentication':
				mockError = {
					status: HTTP_STATUS.UNAUTHORIZED,
					message: 'Invalid credentials provided'
				};
				break;

			case 'authorization':
				mockError = {
					status: HTTP_STATUS.FORBIDDEN,
					message: 'You do not have permission to access this resource'
				};
				break;

			case 'network':
				mockError = new Error('Network request failed');
				break;

			case 'server':
				mockError = {
					status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
					message: 'Internal server error occurred'
				};
				break;

			default:
				mockError = {
					status: 418,
					message: 'I am a teapot'
				};
		}

		// Handle the error using centralized handler
		const handledErrors = handleApiError(mockError, { redirectOnAuth: false });
		currentErrors = handledErrors;
		errorType = type;
		errorMessage = getFirstErrorMessage(handledErrors) || 'No error message';
	}

	/**
	 * Clear all errors
	 */
	function clearAllErrors() {
		currentErrors = {};
		errorType = '';
		errorMessage = '';
	}

	/**
	 * Clear specific error field
	 */
	function clearSpecificField(field) {
		currentErrors = clearErrorFields(currentErrors, field);
	}

	/**
	 * Merge additional errors
	 */
	function addMoreErrors() {
		const additionalErrors = {
			phone: ['Phone number is invalid'],
			address: ['Address is required']
		};
		currentErrors = mergeErrors(currentErrors, additionalErrors);
	}

	// Reactive computed values using Svelte 5 runes
	const displayMessages = $derived(createDisplayMessages(currentErrors));
	const hasAnyErrors = $derived(hasErrors(currentErrors));
	const firstError = $derived(getFirstErrorMessage(currentErrors));
</script>

<div class="error-example">
	<h2>Error Handler Example</h2>

	<div class="controls">
		<h3>Simulate Different Error Types:</h3>
		<div class="button-group">
			<button onclick={() => simulateError('validation')}> Validation Error (422) </button>
			<button onclick={() => simulateError('authentication')}> Authentication Error (401) </button>
			<button onclick={() => simulateError('authorization')}> Authorization Error (403) </button>
			<button onclick={() => simulateError('network')}> Network Error </button>
			<button onclick={() => simulateError('server')}> Server Error (500) </button>
			<button onclick={() => simulateError('unknown')}> Unknown Error </button>
		</div>

		<div class="button-group">
			<button onclick={clearAllErrors} class="clear-button"> Clear All Errors </button>
			<button onclick={addMoreErrors} class="add-button"> Add More Errors </button>
		</div>
	</div>

	<div class="error-display-section">
		<h3>Current Error State:</h3>

		{#if hasAnyErrors}
			<div class="error-info">
				<p><strong>Error Type:</strong> {errorType}</p>
				<p><strong>First Error:</strong> {firstError}</p>
				<p><strong>Has Errors:</strong> {hasAnyErrors}</p>
			</div>

			<!-- Using ErrorDisplay component -->
			<div class="error-display-demo">
				<h4>All Errors (using ErrorDisplay):</h4>
				<ErrorDisplay errors={currentErrors} />
			</div>

			<!-- Show first error only -->
			<div class="error-display-demo">
				<h4>First Error Only:</h4>
				<ErrorDisplay errors={currentErrors} showFirst={true} />
			</div>

			<!-- Show specific field errors -->
			{#if currentErrors.email}
				<div class="error-display-demo">
					<h4>Email Field Errors:</h4>
					<ErrorDisplay errors={currentErrors} field="email" />
					<button onclick={() => clearSpecificField('email')} class="clear-field-button">
						Clear Email Errors
					</button>
				</div>
			{/if}

			<!-- Raw error object display -->
			<div class="raw-errors">
				<h4>Raw Error Object:</h4>
				<pre>{JSON.stringify(currentErrors, null, 2)}</pre>
			</div>

			<!-- Display messages -->
			<div class="display-messages">
				<h4>Display Messages:</h4>
				<pre>{JSON.stringify(displayMessages, null, 2)}</pre>
			</div>
		{:else}
			<p class="no-errors">No errors to display</p>
		{/if}
	</div>
</div>

<style>
	.error-example {
		max-width: 800px;
		margin: 2rem auto;
		padding: 2rem;
		font-family: system-ui, sans-serif;
	}

	h2 {
		color: #333;
		border-bottom: 2px solid #007bff;
		padding-bottom: 0.5rem;
	}

	h3 {
		color: #555;
		margin-top: 2rem;
		margin-bottom: 1rem;
	}

	h4 {
		color: #666;
		margin-top: 1.5rem;
		margin-bottom: 0.5rem;
	}

	.controls {
		background: #f8f9fa;
		padding: 1.5rem;
		border-radius: 8px;
		margin-bottom: 2rem;
	}

	.button-group {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	button {
		padding: 0.5rem 1rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		background: white;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	button:hover {
		background: #e9ecef;
		border-color: #adb5bd;
	}

	.clear-button {
		background: #dc3545;
		color: white;
		border-color: #dc3545;
	}

	.clear-button:hover {
		background: #c82333;
		border-color: #bd2130;
	}

	.add-button {
		background: #28a745;
		color: white;
		border-color: #28a745;
	}

	.add-button:hover {
		background: #218838;
		border-color: #1e7e34;
	}

	.clear-field-button {
		background: #ffc107;
		color: #212529;
		border-color: #ffc107;
		font-size: 0.875rem;
		padding: 0.25rem 0.5rem;
		margin-top: 0.5rem;
	}

	.clear-field-button:hover {
		background: #e0a800;
		border-color: #d39e00;
	}

	.error-display-section {
		background: white;
		border: 1px solid #dee2e6;
		border-radius: 8px;
		padding: 1.5rem;
	}

	.error-info {
		background: #e7f3ff;
		border: 1px solid #b3d9ff;
		border-radius: 4px;
		padding: 1rem;
		margin-bottom: 1rem;
	}

	.error-info p {
		margin: 0.25rem 0;
	}

	.error-display-demo {
		background: #f8f9fa;
		border: 1px solid #e9ecef;
		border-radius: 4px;
		padding: 1rem;
		margin: 1rem 0;
	}

	.raw-errors,
	.display-messages {
		background: #f8f9fa;
		border: 1px solid #e9ecef;
		border-radius: 4px;
		padding: 1rem;
		margin: 1rem 0;
	}

	pre {
		background: #2d3748;
		color: #e2e8f0;
		padding: 1rem;
		border-radius: 4px;
		overflow-x: auto;
		font-size: 0.875rem;
		margin: 0.5rem 0 0 0;
	}

	.no-errors {
		color: #28a745;
		font-weight: 500;
		text-align: center;
		padding: 2rem;
		background: #d4edda;
		border: 1px solid #c3e6cb;
		border-radius: 4px;
	}

	/* Responsive design */
	@media (max-width: 768px) {
		.error-example {
			margin: 1rem;
			padding: 1rem;
		}

		.button-group {
			flex-direction: column;
		}

		button {
			width: 100%;
		}
	}
</style>
