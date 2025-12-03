<script>
	import { register, authState, clearErrors, setErrors } from '$lib/auth/auth.svelte.js';
	import { goto } from '$app/navigation';

	// Form state
	let name = $state('');
	let email = $state('');
	let password = $state('');
	let passwordConfirmation = $state('');
	let clientErrors = $state({});

	// Props
	let { redirectTo = '/' } = $props();

	/**
	 * Validate name field
	 * @param {string} name - Name to validate
	 * @returns {string|null} Error message or null if valid
	 */
	function validateName(name) {
		if (!name) {
			return 'Name is required';
		}
		if (name.length < 2) {
			return 'Name must be at least 2 characters long';
		}
		return null;
	}

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
		if (password.length < 8) {
			return 'Password must be at least 8 characters long';
		}
		return null;
	}

	/**
	 * Validate password confirmation
	 * Requirements: 1.5 - Password confirmation validation
	 * @param {string} password - Original password
	 * @param {string} passwordConfirmation - Password confirmation
	 * @returns {string|null} Error message or null if valid
	 */
	function validatePasswordConfirmation(password, passwordConfirmation) {
		if (!passwordConfirmation) {
			return 'Password confirmation is required';
		}
		if (password !== passwordConfirmation) {
			return 'Passwords do not match';
		}
		return null;
	}

	/**
	 * Validate form fields
	 * Requirements: 1.4, 1.5, 1.6 - Client-side validation
	 * @returns {boolean} True if form is valid, false otherwise
	 */
	function validateForm() {
		const errors = {};

		const nameError = validateName(name);
		if (nameError) {
			errors.name = [nameError];
		}

		const emailError = validateEmail(email);
		if (emailError) {
			errors.email = [emailError];
		}

		const passwordError = validatePassword(password);
		if (passwordError) {
			errors.password = [passwordError];
		}

		const passwordConfirmationError = validatePasswordConfirmation(password, passwordConfirmation);
		if (passwordConfirmationError) {
			errors.password_confirmation = [passwordConfirmationError];
		}

		clientErrors = errors;
		return Object.keys(errors).length === 0;
	}

	/**
	 * Handle form submission
	 * Requirements: 1.1, 1.2, 1.3, 1.6 - Registration with automatic login
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
			// Register user (automatically logs in on success - Requirement 1.3)
			await register(name, email, password, passwordConfirmation);

			// Redirect on successful registration (Requirement 1.6)
			goto(redirectTo);
		} catch (error) {
			// Error handling is done in the auth module
			console.error('Registration failed:', error);
		}
	}

	/**
	 * Handle input changes to clear field-specific errors
	 * @param {string} field - Field name that changed
	 */
	async function handleInputChange(field) {
		// Clear client-side error for this field
		if (clientErrors[field]) {
			const newErrors = { ...clientErrors };
			delete newErrors[field];
			clientErrors = newErrors;
		}

		// Clear server-side error for this field
		if (authState.errors[field]) {
			const newErrors = { ...authState.errors };
			delete newErrors[field];
			clearErrors();
			// Set remaining errors back
			if (Object.keys(newErrors).length > 0) {
				setErrors(newErrors);
			}
		}

		// Re-validate password confirmation when password changes
		if (field === 'password' && passwordConfirmation) {
			const confirmationError = validatePasswordConfirmation(password, passwordConfirmation);
			if (confirmationError) {
				clientErrors = { ...clientErrors, password_confirmation: [confirmationError] };
			} else {
				const newErrors = { ...clientErrors };
				delete newErrors.password_confirmation;
				clientErrors = newErrors;
			}
		}
	}

	/**
	 * Get error message for a field (client or server)
	 * Requirements: 6.1 - Display validation errors for each field
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
	 * Requirements: 6.2 - Display general error messages
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

<form onsubmit={handleSubmit} class="register-form">
	<h2>Create Account</h2>

	<!-- General error message -->
	{#if getGeneralError()}
		<div class="error-message general-error" role="alert">
			{getGeneralError()}
		</div>
	{/if}

	<!-- Name field -->
	<div class="form-group">
		<label for="name">Full Name</label>
		<input
			id="name"
			type="text"
			bind:value={name}
			oninput={() => handleInputChange('name')}
			class="form-input"
			class:error={getFieldError('name')}
			placeholder="Enter your full name"
			disabled={authState.isLoading}
			required
		/>
		{#if getFieldError('name')}
			<div class="error-message" role="alert">
				{getFieldError('name')}
			</div>
		{/if}
	</div>

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
		{#if getFieldError('email')}
			<div class="error-message" role="alert">
				{getFieldError('email')}
			</div>
		{/if}
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
			placeholder="Enter your password (min. 8 characters)"
			disabled={authState.isLoading}
			required
		/>
		{#if getFieldError('password')}
			<div class="error-message" role="alert">
				{getFieldError('password')}
			</div>
		{/if}
	</div>

	<!-- Password Confirmation field -->
	<div class="form-group">
		<label for="password_confirmation">Confirm Password</label>
		<input
			id="password_confirmation"
			type="password"
			bind:value={passwordConfirmation}
			oninput={() => handleInputChange('password_confirmation')}
			class="form-input"
			class:error={getFieldError('password_confirmation')}
			placeholder="Confirm your password"
			disabled={authState.isLoading}
			required
		/>
		{#if getFieldError('password_confirmation')}
			<div class="error-message" role="alert">
				{getFieldError('password_confirmation')}
			</div>
		{/if}
	</div>

	<!-- Submit button with loading indicator -->
	<button type="submit" class="submit-button" disabled={authState.isLoading}>
		{#if authState.isLoading}
			<span class="loading-spinner" aria-hidden="true"></span>
			Creating account...
		{:else}
			Create Account
		{/if}
	</button>

	<!-- Link to login -->
	<div class="form-footer">
		<p>Already have an account? <a href="/login">Sign in</a></p>
	</div>
</form>

<style>
	.register-form {
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
		background-color: #28a745;
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
		margin-top: 0.5rem;
	}

	.submit-button:hover:not(:disabled) {
		background-color: #218838;
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

	.error-message {
		color: #dc3545;
		font-size: 0.875rem;
		margin-top: 0.25rem;
	}

	.general-error {
		background-color: #f8d7da;
		border: 1px solid #f5c6cb;
		border-radius: 4px;
		padding: 0.75rem;
		margin-bottom: 1rem;
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
		.register-form {
			margin: 1rem;
			padding: 1.5rem;
		}
	}
</style>
