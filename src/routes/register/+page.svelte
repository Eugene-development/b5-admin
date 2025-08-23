<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { register, authState, clearError } from '$lib/state/auth.svelte.js';
	import { LoadingOverlay, ToastContainer } from '$lib';
	import { 
		toasts, 
		addSuccessToast, 
		addErrorToast, 
		clearAllToasts 
	} from '$lib/utils/toastStore.js';

	// Form state
	let formData = $state({
		name: '',
		city: '',
		email: '',
		password: '',
		password_confirmation: '',
		terms_accepted: false
	});

	// Form validation state
	let formErrors = $state({
		name: '',
		city: '',
		email: '',
		password: '',
		password_confirmation: '',
		terms_accepted: ''
	});

	// Form submission state
	let isSubmitting = $state(false);

	onMount(() => {
		// Clear any existing errors when component mounts
		clearError();
		clearAllToasts();

		// If user is already authenticated, redirect to dashboard
		if (authState.isAuthenticated) {
			goto('/dashboard');
		}
	});

	// Client-side form validation
	function validateForm() {
		let isValid = true;
		
		// Reset errors
		formErrors.name = '';
		formErrors.city = '';
		formErrors.email = '';
		formErrors.password = '';
		formErrors.password_confirmation = '';
		formErrors.terms_accepted = '';

		// Name validation
		if (!formData.name.trim()) {
			formErrors.name = 'Имя обязательно для заполнения';
			isValid = false;
		} else if (formData.name.trim().length < 2) {
			formErrors.name = 'Имя должно содержать минимум 2 символа';
			isValid = false;
		}

		// City validation
		if (!formData.city.trim()) {
			formErrors.city = 'Город обязателен для заполнения';
			isValid = false;
		} else if (formData.city.trim().length < 2) {
			formErrors.city = 'Название города должно содержать минимум 2 символа';
			isValid = false;
		}

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

		// Password confirmation validation
		if (!formData.password_confirmation.trim()) {
			formErrors.password_confirmation = 'Подтверждение пароля обязательно';
			isValid = false;
		} else if (formData.password !== formData.password_confirmation) {
			formErrors.password_confirmation = 'Пароли не совпадают';
			isValid = false;
		}

		// Terms acceptance validation
		if (!formData.terms_accepted) {
			formErrors.terms_accepted = 'Необходимо принять условия';
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
			const success = await register(formData);

			if (success) {
				// Show success message
				addSuccessToast('Регистрация выполнена успешно! Проверьте email для подтверждения.');
				
				// Redirect to email verification page
				setTimeout(() => {
					goto('/email-verify');
				}, 1000);
			} else {
				// Registration failed - check for specific errors
				if (authState.registerError) {
					// Check if it's a validation error about existing email
					if (authState.registerError.includes('email') || authState.registerError.includes('существует')) {
						addErrorToast('Пользователь с таким email уже существует');
					} else {
						addErrorToast(authState.registerError);
					}
				} else {
					addErrorToast('Произошла ошибка при регистрации');
				}
			}
		} catch (error) {
			console.error('Registration error:', error);
			
			// Handle specific API errors
			if (error.status === 422 && error.data && error.data.errors) {
				// Handle validation errors from server
				const serverErrors = error.data.errors;
				
				if (serverErrors.email) {
					formErrors.email = serverErrors.email[0];
				}
				if (serverErrors.password) {
					formErrors.password = serverErrors.password[0];
				}
				if (serverErrors.name) {
					formErrors.name = serverErrors.name[0];
				}
				if (serverErrors.city) {
					formErrors.city = serverErrors.city[0];
				}
				
				addErrorToast('Пожалуйста, исправьте ошибки в форме');
			} else {
				addErrorToast('Произошла ошибка при подключении к серверу');
			}
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
	<title>Регистрация - B5 Admin</title>
	<meta name="description" content="Зарегистрируйтесь в административной панели B5" />
</svelte:head>

<!-- Loading overlay -->
<LoadingOverlay 
	show={isSubmitting} 
	message="Выполняется регистрация..." 
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
			Регистрация в административной панели
		</h2>
	</div>

	<div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
		<!-- Registration Form -->
		<form class="space-y-6" onsubmit={handleSubmit}>
			<!-- Name Field -->
			<div>
				<label for="name" class="block text-sm font-medium leading-6 text-gray-900 dark:text-white">
					Имя <span class="text-red-500">*</span>
				</label>
				<div class="mt-2">
					<input
						id="name"
						name="name"
						type="text"
						autocomplete="given-name"
						required
						bind:value={formData.name}
						oninput={() => handleInputChange('name')}
						class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-white dark:ring-gray-600 dark:placeholder:text-gray-500 dark:focus:ring-indigo-500"
						class:ring-red-500={formErrors.name}
						class:focus:ring-red-500={formErrors.name}
						placeholder="Введите ваше имя"
					/>
					{#if formErrors.name}
						<p class="mt-2 text-sm text-red-600 dark:text-red-400" id="name-error">
							{formErrors.name}
						</p>
					{/if}
				</div>
			</div>

			<!-- City Field -->
			<div>
				<label for="city" class="block text-sm font-medium leading-6 text-gray-900 dark:text-white">
					Город <span class="text-red-500">*</span>
				</label>
				<div class="mt-2">
					<input
						id="city"
						name="city"
						type="text"
						autocomplete="address-level2"
						required
						bind:value={formData.city}
						oninput={() => handleInputChange('city')}
						class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-white dark:ring-gray-600 dark:placeholder:text-gray-500 dark:focus:ring-indigo-500"
						class:ring-red-500={formErrors.city}
						class:focus:ring-red-500={formErrors.city}
						placeholder="Введите ваш город"
					/>
					{#if formErrors.city}
						<p class="mt-2 text-sm text-red-600 dark:text-red-400" id="city-error">
							{formErrors.city}
						</p>
					{/if}
				</div>
			</div>

			<!-- Email Field -->
			<div>
				<label for="email" class="block text-sm font-medium leading-6 text-gray-900 dark:text-white">
					Email адрес <span class="text-red-500">*</span>
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
				<label for="password" class="block text-sm font-medium leading-6 text-gray-900 dark:text-white">
					Пароль <span class="text-red-500">*</span>
				</label>
				<div class="mt-2">
					<input
						id="password"
						name="password"
						type="password"
						autocomplete="new-password"
						required
						bind:value={formData.password}
						oninput={() => handleInputChange('password')}
						class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-white dark:ring-gray-600 dark:placeholder:text-gray-500 dark:focus:ring-indigo-500"
						class:ring-red-500={formErrors.password}
						class:focus:ring-red-500={formErrors.password}
						placeholder="Введите пароль (минимум 8 символов)"
					/>
					{#if formErrors.password}
						<p class="mt-2 text-sm text-red-600 dark:text-red-400" id="password-error">
							{formErrors.password}
						</p>
					{/if}
				</div>
			</div>

			<!-- Password Confirmation Field -->
			<div>
				<label for="password_confirmation" class="block text-sm font-medium leading-6 text-gray-900 dark:text-white">
					Подтверждение пароля <span class="text-red-500">*</span>
				</label>
				<div class="mt-2">
					<input
						id="password_confirmation"
						name="password_confirmation"
						type="password"
						autocomplete="new-password"
						required
						bind:value={formData.password_confirmation}
						oninput={() => handleInputChange('password_confirmation')}
						class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-white dark:ring-gray-600 dark:placeholder:text-gray-500 dark:focus:ring-indigo-500"
						class:ring-red-500={formErrors.password_confirmation}
						class:focus:ring-red-500={formErrors.password_confirmation}
						placeholder="Повторите пароль"
					/>
					{#if formErrors.password_confirmation}
						<p class="mt-2 text-sm text-red-600 dark:text-red-400" id="password-confirmation-error">
							{formErrors.password_confirmation}
						</p>
					{/if}
				</div>
			</div>

			<!-- Terms Acceptance Checkbox -->
			<div class="flex items-start">
				<div class="flex items-center h-5">
					<input
						id="terms_accepted"
						name="terms_accepted"
						type="checkbox"
						bind:checked={formData.terms_accepted}
						onchange={() => handleInputChange('terms_accepted')}
						class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:focus:ring-indigo-500"
						class:border-red-500={formErrors.terms_accepted}
					/>
				</div>
				<div class="ml-3 text-sm">
					<label for="terms_accepted" class="text-gray-900 dark:text-white">
						Я принимаю <a href="/terms" class="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300" target="_blank">условия использования</a> и <a href="/privacy" class="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300" target="_blank">политику конфиденциальности</a> <span class="text-red-500">*</span>
					</label>
					{#if formErrors.terms_accepted}
						<p class="mt-1 text-sm text-red-600 dark:text-red-400" id="terms-error">
							{formErrors.terms_accepted}
						</p>
					{/if}
				</div>
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
						Выполняется регистрация...
					{:else}
						Зарегистрироваться
					{/if}
				</button>
			</div>
		</form>

		<!-- Login Link -->
		<p class="mt-10 text-center text-sm text-gray-500 dark:text-gray-400">
			Уже есть аккаунт?
			<a href="/login" class="font-semibold leading-6 text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
				Войти в систему
			</a>
		</p>
	</div>
</div>

<!-- Toast Notifications -->
<ToastContainer toasts={$toasts} position="top-center" />