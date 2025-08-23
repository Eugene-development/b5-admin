<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { login, authState, clearError } from '$lib/state/auth.svelte.js';
	import { LoadingOverlay, ToastContainer } from '$lib';
	import { 
		toasts, 
		addSuccessToast, 
		addErrorToast, 
		clearAllToasts 
	} from '$lib/utils/toastStore.js';

	// Get data from load function
	let { data } = $props();

	// Form state
	let formData = $state({
		email: '',
		password: '',
		remember: false
	});

	// Form validation state
	let formErrors = $state({
		email: '',
		password: ''
	});

	// Form submission state
	let isSubmitting = $state(false);

	// Get redirectTo from page data
	let redirectTo = data.redirectTo;

	onMount(() => {
		// Clear any existing errors when component mounts
		clearError();
		clearAllToasts();

		// If user is already authenticated, redirect to dashboard or redirectTo
		if (authState.isAuthenticated) {
			goto(redirectTo);
		}
	});

	// Client-side form validation
	function validateForm() {
		let isValid = true;
		
		// Reset errors
		formErrors.email = '';
		formErrors.password = '';

		// Email validation
		if (!formData.email.trim()) {
			formErrors.email = 'Email обязателен для заполнения';
			isValid = false;
		} else if (!isValidEmail(formData.email)) {
			formErrors.email = 'Введите корректный email адрес';
			isValid = false;
		}

		// Password validation
		if (!formData.password.trim()) {
			formErrors.password = 'Пароль обязателен для заполнения';
			isValid = false;
		} else if (formData.password.length < 8) {
			formErrors.password = 'Пароль должен содержать минимум 8 символов';
			isValid = false;
		}

		return isValid;
	}

	// Email validation helper
	function isValidEmail(email) {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}

	// Handle form submission
	async function handleSubmit(event) {
		event.preventDefault();
		
		// Clear previous errors
		clearError();
		clearAllToasts();

		// Validate form
		if (!validateForm()) {
			return;
		}

		isSubmitting = true;

		try {
			const success = await login(formData.email, formData.password, formData.remember);

			if (success) {
				// Show success message
				addSuccessToast('Вход выполнен успешно!');
				
				// Redirect to intended page or dashboard
				setTimeout(() => {
					goto(redirectTo);
				}, 500);
			} else {
				// Login failed - error is already set in auth state
				if (authState.loginError) {
					addErrorToast(authState.loginError);
				} else {
					addErrorToast('Неверный email или пароль');
				}
			}
		} catch (error) {
			console.error('Login error:', error);
			addErrorToast('Произошла ошибка при подключении к серверу');
		} finally {
			isSubmitting = false;
		}
	}

	// Handle input changes to clear field errors
	function handleInputChange(field) {
		if (formErrors[field]) {
			formErrors[field] = '';
		}
	}
</script>

<svelte:head>
	<title>Вход в систему - B5 Admin</title>
	<meta name="description" content="Войдите в административную панель B5" />
</svelte:head>

<!-- Loading overlay -->
<LoadingOverlay 
	show={isSubmitting} 
	message="Выполняется вход в систему..." 
/>

<div class="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
	<div class="sm:mx-auto sm:w-full sm:max-w-sm">
		<!-- Logo -->
		<div class="flex justify-center">
			<img
				src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
				alt="B5 Admin"
				class="h-12 w-auto"
			/>
		</div>
		
		<!-- Title -->
		<h2 class="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900 dark:text-white">
			Вход в административную панель
		</h2>
	</div>

	<div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
		<!-- Login Form -->
		<form class="space-y-6" onsubmit={handleSubmit}>
			<!-- Email Field -->
			<div>
				<label for="email" class="block text-sm font-medium leading-6 text-gray-900 dark:text-white">
					Email адрес
				</label>
				<div class="mt-2">
					<input
						id="email"
						name="email"
						type="email"
						autocomplete="email"
						required
						bind:value={formData.email}
						oninput={() => handleInputChange('email')}
						class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-white dark:ring-gray-600 dark:placeholder:text-gray-500 dark:focus:ring-indigo-500"
						class:ring-red-500={formErrors.email}
						class:focus:ring-red-500={formErrors.email}
						placeholder="Введите ваш email"
					/>
					{#if formErrors.email}
						<p class="mt-2 text-sm text-red-600 dark:text-red-400" id="email-error">
							{formErrors.email}
						</p>
					{/if}
				</div>
			</div>

			<!-- Password Field -->
			<div>
				<div class="flex items-center justify-between">
					<label for="password" class="block text-sm font-medium leading-6 text-gray-900 dark:text-white">
						Пароль
					</label>
					<!-- Future: Add forgot password link -->
					<!-- <div class="text-sm">
						<a href="/forgot-password" class="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
							Забыли пароль?
						</a>
					</div> -->
				</div>
				<div class="mt-2">
					<input
						id="password"
						name="password"
						type="password"
						autocomplete="current-password"
						required
						bind:value={formData.password}
						oninput={() => handleInputChange('password')}
						class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-white dark:ring-gray-600 dark:placeholder:text-gray-500 dark:focus:ring-indigo-500"
						class:ring-red-500={formErrors.password}
						class:focus:ring-red-500={formErrors.password}
						placeholder="Введите ваш пароль"
					/>
					{#if formErrors.password}
						<p class="mt-2 text-sm text-red-600 dark:text-red-400" id="password-error">
							{formErrors.password}
						</p>
					{/if}
				</div>
			</div>

			<!-- Remember Me Checkbox -->
			<div class="flex items-center">
				<input
					id="remember"
					name="remember"
					type="checkbox"
					bind:checked={formData.remember}
					class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:focus:ring-indigo-500"
				/>
				<label for="remember" class="ml-3 block text-sm leading-6 text-gray-900 dark:text-white">
					Запомнить меня
				</label>
			</div>

			<!-- Submit Button -->
			<div>
				<button
					type="submit"
					disabled={isSubmitting}
					class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-indigo-500 dark:hover:bg-indigo-400"
				>
					{#if isSubmitting}
						<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						Выполняется вход...
					{:else}
						Войти
					{/if}
				</button>
			</div>
		</form>

		<!-- Registration Link -->
		<p class="mt-10 text-center text-sm text-gray-500 dark:text-gray-400">
			Нет аккаунта?
			<a href="/register" class="font-semibold leading-6 text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
				Зарегистрироваться
			</a>
		</p>
	</div>
</div>

<!-- Toast Notifications -->
<ToastContainer toasts={$toasts} position="top-center" />