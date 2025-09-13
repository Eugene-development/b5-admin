<script>
	import {
		login,
		authState,
		clearErrors,
		setErrors,
		clearErrorFields
	} from '$lib/auth/auth.svelte.js';
	import { goto } from '$app/navigation';
	import ErrorDisplay from './ErrorDisplay.svelte';

	// Form state
	let email = $state('');
	let password = $state('');
	let clientErrors = $state({});

	// Props
	let { redirectTo = '/' } = $props();

	/**
	 * Validate email format
	 * @param {string} email - Email to validate
	 * @returns {string|null} Error message or null if valid
	 */
	function validateEmail(email) {
		if (!email) {
			return 'Email is required';
		}
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return 'Please enter a valid email address';
		}
		return null;
	}

	/**
	 * Validate password
	 * @param {string} password - Password to validate
	 * @returns {string|null} Error message or null if valid
	 */
	function validatePassword(password) {
		if (!password) {
			return 'Password is required';
		}
		if (password.length < 6) {
			return 'Password must be at least 6 characters long';
		}
		return null;
	}

	/**
	 * Validate form fields
	 * @returns {boolean} True if form is valid, false otherwise
	 */
	function validateForm() {
		const errors = {};

		const emailError = validateEmail(email);
		if (emailError) {
			errors.email = [emailError];
		}

		const passwordError = validatePassword(password);
		if (passwordError) {
			errors.password = [passwordError];
		}

		clientErrors = errors;
		return Object.keys(errors).length === 0;
	}

	/**
	 * Handle form submission
	 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
	 */
	async function handleSubmit(event) {
		event.preventDefault();
		// Clear previous errors
		clearErrors();
		clientErrors = {};

		// Validate form
		if (!validateForm()) {
			return;
		}

		try {
			await login(email, password);

			// Redirect on successful login (Requirement 2.5)
			goto(redirectTo);
		} catch (error) {
			// Error handling is done in the auth module
			console.error('Login failed:', error);
		}
	}

	/**
	 * Handle input changes to clear field-specific errors
	 * @param {string} field - Field name that changed
	 */
	function handleInputChange(field) {
		// Clear client-side error for this field
		if (clientErrors[field]) {
			const newErrors = { ...clientErrors };
			delete newErrors[field];
			clientErrors = newErrors;
		}

		// Clear server-side error for this field using centralized error handler
		clearErrorFields(field);
	}

	/**
	 * Get error message for a field (client or server)
	 * @param {string} field - Field name
	 * @returns {string|null} Error message or null if no error
	 */
	function getFieldError(field) {
		// Prioritize client-side errors
		if (clientErrors[field] && clientErrors[field].length > 0) {
			return clientErrors[field][0];
		}

		// Then server-side errors
		if (authState.errors[field] && authState.errors[field].length > 0) {
			return authState.errors[field][0];
		}

		return null;
	}

	/**
	 * Get general error messages (auth or general errors)
	 * @returns {string|null} General error message or null
	 */
	function getGeneralError() {
		if (authState.errors.auth && authState.errors.auth.length > 0) {
			return authState.errors.auth[0];
		}
		if (authState.errors.general && authState.errors.general.length > 0) {
			return authState.errors.general[0];
		}
		return null;
	}
</script>

<form onsubmit={handleSubmit} class="login-form">
	<h2>Sign In</h2>

	<!-- General error messages using ErrorDisplay component -->
	<ErrorDisplay errors={authState.errors} showFirst={true} className="general-error-display" />

	<!-- Email field -->
	<div class="form-group">
		<label for="email">Email</label>
		<input
			id="email"
			type="email"
			bind:value={email}
			oninput={() => handleInputChange('email')}
			class="form-input"
			class:error={getFieldError('email')}
			placeholder="Enter your email"
			disabled={authState.isLoading}
			required
		/>
		<!-- Field-specific errors using ErrorDisplay component -->
		<ErrorDisplay
			errors={{ ...clientErrors, ...authState.errors }}
			field="email"
			className="field-error"
		/>
	</div>

	<!-- Password field -->
	<div class="form-group">
		<label for="password">Password</label>
		<input
			id="password"
			type="password"
			bind:value={password}
			oninput={() => handleInputChange('password')}
			class="form-input"
			class:error={getFieldError('password')}
			placeholder="Enter your password"
			disabled={authState.isLoading}
			required
		/>
		<!-- Field-specific errors using ErrorDisplay component -->
		<ErrorDisplay
			errors={{ ...clientErrors, ...authState.errors }}
			field="password"
			className="field-error"
		/>
	</div>

	<!-- Submit button with loading indicator -->
	<button type="submit" class="submit-button" disabled={authState.isLoading}>
		{#if authState.isLoading}
			<span class="loading-spinner" aria-hidden="true"></span>
			Signing in...
		{:else}
			Sign In
		{/if}
	</button>

	<!-- Link to registration -->
	<div class="form-footer">
		<p>Don't have an account? <a href="/register">Sign up</a></p>
	</div>
</form>

<style>
	.login-form {
		max-width: 400px;
		margin: 0 auto;
		padding: 2rem;
		background: white;
		border-radius: 8px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
	}

	h2 {
		text-align: center;
		margin-bottom: 1.5rem;
		color: #333;
		font-size: 1.5rem;
		font-weight: 600;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		color: #555;
	}

	.form-input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
		transition: border-color 0.2s ease;
		box-sizing: border-box;
	}

	.form-input:focus {
		outline: none;
		border-color: #007bff;
		box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
	}

	.form-input.error {
		border-color: #dc3545;
	}

	.form-input.error:focus {
		border-color: #dc3545;
		box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.25);
	}

	.form-input:disabled {
		background-color: #f8f9fa;
		cursor: not-allowed;
		opacity: 0.6;
	}

	.submit-button {
		width: 100%;
		padding: 0.75rem;
		background-color: #007bff;
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.submit-button:hover:not(:disabled) {
		background-color: #0056b3;
	}

	.submit-button:disabled {
		background-color: #6c757d;
		cursor: not-allowed;
	}

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

	/* Error display styling */
	:global(.general-error-display) {
		margin-bottom: 1rem;
	}

	:global(.field-error) {
		margin-top: 0.25rem;
	}

	:global(.field-error .error-message) {
		font-size: 0.875rem;
		padding: 0;
		margin: 0;
		background: none;
		border: none;
	}

	.form-footer {
		text-align: center;
		margin-top: 1.5rem;
		padding-top: 1rem;
		border-top: 1px solid #eee;
	}

	.form-footer p {
		margin: 0;
		color: #666;
	}

	.form-footer a {
		color: #007bff;
		text-decoration: none;
	}

	.form-footer a:hover {
		text-decoration: underline;
	}

	/* Responsive design */
	@media (max-width: 480px) {
		.login-form {
			margin: 1rem;
			padding: 1.5rem;
		}
	}
</style>
