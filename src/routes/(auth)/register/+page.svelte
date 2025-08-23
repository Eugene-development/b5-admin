<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { register, authState, clearError } from '$lib/state/auth.svelte.js';
	import { LoadingOverlay } from '$lib';
	import { addSuccessToast, addErrorToast, clearAllToasts } from '$lib/utils/toastStore.js';

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
	let showPassword = $state(false);
	let showPasswordConfirmation = $state(false);

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
		Object.keys(formErrors).forEach((key) => {
			formErrors[key] = '';
		});

		// Name validation
		if (!formData.name.trim()) {
			formErrors.name = 'Имя обязательно для заполнения';
			isValid = false;
		} else if (formData.name.length < 2) {
			formErrors.name = 'Имя должно содержать минимум 2 символа';
			isValid = false;
		}

		// City validation
		if (!formData.city.trim()) {
			formErrors.city = 'Город обязателен для заполнения';
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
		} else if (!isValidPassword(formData.password)) {
			formErrors.password = 'Пароль должен содержать буквы и цифры';
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
			formErrors.terms_accepted = 'Необходимо согласиться с условиями использования';
			isValid = false;
		}

		return isValid;
	}

	// Email validation helper
	function isValidEmail(email) {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}

	// Password validation helper
	function isValidPassword(password) {
		// Check if password contains at least one letter and one number
		const hasLetter = /[a-zA-Z]/.test(password);
		const hasNumber = /\d/.test(password);
		return hasLetter && hasNumber;
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
			const success = await register(
				formData.name,
				formData.city,
				formData.email,
				formData.password,
				formData.password_confirmation
			);

			if (success) {
				// Show success message
				addSuccessToast('Регистрация прошла успешно! Добро пожаловать!');

				// Redirect to dashboard
				setTimeout(() => {
					goto('/dashboard');
				}, 1000);
			} else {
				// Registration failed - error is already set in auth state
				if (authState.registerError) {
					addErrorToast(authState.registerError);
				} else {
					addErrorToast('Произошла ошибка при регистрации. Попробуйте снова.');
				}
			}
		} catch (error) {
			console.error('Registration error:', error);
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

	// Toggle password visibility
	function togglePasswordVisibility(field) {
		if (field === 'password') {
			showPassword = !showPassword;
		} else if (field === 'password_confirmation') {
			showPasswordConfirmation = !showPasswordConfirmation;
		}
	}
</script>

<svelte:head>
	<title>Регистрация - B5 Admin</title>
	<meta name="description" content="Зарегистрируйтесь в административной панели B5" />
</svelte:head>

<!-- Loading overlay -->
<LoadingOverlay show={isSubmitting} message="Создание аккаунта..." />

<!-- Современная карточка регистрации -->
<div class="relative">
	<!-- Стеклянная морфизм карточка -->
	<div
		class="overflow-hidden rounded-3xl border border-white/20 bg-white/80 shadow-2xl backdrop-blur-xl dark:border-gray-700/20 dark:bg-gray-900/80"
	>
		<!-- Заголовок с градиентом -->
		<div
			class="relative bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-8 text-center"
		>
			<!-- Декоративные элементы -->
			<div
				class="absolute inset-0 bg-gradient-to-r from-purple-600/90 via-indigo-600/90 to-blue-600/90"
			></div>
			<div class="absolute left-0 top-0 h-full w-full opacity-10">
				<div
					class="h-full w-full bg-white/5 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"
				></div>
			</div>

			<div class="relative z-10">
				<!-- Логотип -->
				<div class="mb-6">
					<div
						class="inline-flex h-20 w-20 items-center justify-center rounded-full border border-white/30 bg-white/20 backdrop-blur-sm"
					>
						<svg class="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
							/>
						</svg>
					</div>
				</div>

				<h1 class="mb-2 text-3xl font-bold text-white">Создать аккаунт</h1>
				<p class="text-lg text-white/90">Присоединяйтесь к административной панели B5</p>
			</div>
		</div>

		<!-- Форма -->
		<div class="space-y-6 p-8">
			<form class="space-y-6" onsubmit={handleSubmit}>
				<!-- Name и City в одном ряду -->
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<!-- Name поле -->
					<div class="space-y-2">
						<label for="name" class="block text-sm font-semibold text-gray-700 dark:text-gray-300">
							Полное имя <span class="text-red-500">*</span>
						</label>
						<div class="group relative">
							<div
								class="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-4"
							>
								<svg
									class="h-5 w-5 text-gray-400 transition-colors group-focus-within:text-purple-500"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
									/>
								</svg>
							</div>
							<input
								id="name"
								name="name"
								type="text"
								autocomplete="given-name"
								required
								bind:value={formData.name}
								oninput={() => handleInputChange('name')}
								class="w-full rounded-2xl border-2 border-gray-200/50 bg-gray-50/50 py-4 pl-12 pr-4 text-gray-900 placeholder-gray-500 backdrop-blur-sm transition-all duration-300 focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-500/20 dark:border-gray-700/50 dark:bg-gray-800/50 dark:text-white dark:placeholder-gray-400"
								class:border-red-300={formErrors.name}
								class:focus:ring-red-500={formErrors.name}
								class:focus:border-red-500={formErrors.name}
								placeholder="Введите ваше имя"
							/>
						</div>
						{#if formErrors.name}
							<p class="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
								<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
										clip-rule="evenodd"
									/>
								</svg>
								{formErrors.name}
							</p>
						{/if}
					</div>

					<!-- City поле -->
					<div class="space-y-2">
						<label for="city" class="block text-sm font-semibold text-gray-700 dark:text-gray-300">
							Город <span class="text-red-500">*</span>
						</label>
						<div class="group relative">
							<div
								class="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-4"
							>
								<svg
									class="h-5 w-5 text-gray-400 transition-colors group-focus-within:text-purple-500"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
									/>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
									/>
								</svg>
							</div>
							<input
								id="city"
								name="city"
								type="text"
								autocomplete="address-level2"
								required
								bind:value={formData.city}
								oninput={() => handleInputChange('city')}
								class="w-full rounded-2xl border-2 border-gray-200/50 bg-gray-50/50 py-4 pl-12 pr-4 text-gray-900 placeholder-gray-500 backdrop-blur-sm transition-all duration-300 focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-500/20 dark:border-gray-700/50 dark:bg-gray-800/50 dark:text-white dark:placeholder-gray-400"
								class:border-red-300={formErrors.city}
								class:focus:ring-red-500={formErrors.city}
								class:focus:border-red-500={formErrors.city}
								placeholder="Введите ваш город"
							/>
						</div>
						{#if formErrors.city}
							<p class="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
								<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
										clip-rule="evenodd"
									/>
								</svg>
								{formErrors.city}
							</p>
						{/if}
					</div>
				</div>

				<!-- Email поле -->
				<div class="space-y-2">
					<label for="email" class="block text-sm font-semibold text-gray-700 dark:text-gray-300">
						Email адрес <span class="text-red-500">*</span>
					</label>
					<div class="group relative">
						<div class="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-4">
							<svg
								class="h-5 w-5 text-gray-400 transition-colors group-focus-within:text-purple-500"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
								/>
							</svg>
						</div>
						<input
							id="email"
							name="email"
							type="email"
							autocomplete="email"
							required
							bind:value={formData.email}
							oninput={() => handleInputChange('email')}
							class="w-full rounded-2xl border-2 border-gray-200/50 bg-gray-50/50 py-4 pl-12 pr-4 text-gray-900 placeholder-gray-500 backdrop-blur-sm transition-all duration-300 focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-500/20 dark:border-gray-700/50 dark:bg-gray-800/50 dark:text-white dark:placeholder-gray-400"
							class:border-red-300={formErrors.email}
							class:focus:ring-red-500={formErrors.email}
							class:focus:border-red-500={formErrors.email}
							placeholder="example@company.com"
						/>
					</div>
					{#if formErrors.email}
						<p class="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
							<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
								<path
									fill-rule="evenodd"
									d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
									clip-rule="evenodd"
								/>
							</svg>
							{formErrors.email}
						</p>
					{/if}
				</div>

				<!-- Password поля в одном ряду -->
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<!-- Password поле -->
					<div class="space-y-2">
						<label
							for="password"
							class="block text-sm font-semibold text-gray-700 dark:text-gray-300"
						>
							Пароль <span class="text-red-500">*</span>
						</label>
						<div class="group relative">
							<div
								class="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-4"
							>
								<svg
									class="h-5 w-5 text-gray-400 transition-colors group-focus-within:text-purple-500"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
									/>
								</svg>
							</div>
							<input
								id="password"
								name="password"
								type={showPassword ? 'text' : 'password'}
								autocomplete="new-password"
								required
								bind:value={formData.password}
								oninput={() => handleInputChange('password')}
								class="w-full rounded-2xl border-2 border-gray-200/50 bg-gray-50/50 py-4 pl-12 pr-16 text-gray-900 placeholder-gray-500 backdrop-blur-sm transition-all duration-300 focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-500/20 dark:border-gray-700/50 dark:bg-gray-800/50 dark:text-white dark:placeholder-gray-400"
								class:border-red-300={formErrors.password}
								class:focus:ring-red-500={formErrors.password}
								class:focus:border-red-500={formErrors.password}
								placeholder="Минимум 8 символов"
							/>
							<button
								type="button"
								onclick={() => togglePasswordVisibility('password')}
								class="absolute inset-y-0 right-0 z-10 flex items-center pr-4 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
							>
								<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									{#if showPassword}
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
										/>
									{:else}
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
										/>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
										/>
									{/if}
								</svg>
							</button>
						</div>
						{#if formErrors.password}
							<p class="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
								<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
										clip-rule="evenodd"
									/>
								</svg>
								{formErrors.password}
							</p>
						{/if}
					</div>

					<!-- Password Confirmation поле -->
					<div class="space-y-2">
						<label
							for="password_confirmation"
							class="block text-sm font-semibold text-gray-700 dark:text-gray-300"
						>
							Подтверждение <span class="text-red-500">*</span>
						</label>
						<div class="group relative">
							<div
								class="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-4"
							>
								<svg
									class="h-5 w-5 text-gray-400 transition-colors group-focus-within:text-purple-500"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
							</div>
							<input
								id="password_confirmation"
								name="password_confirmation"
								type={showPasswordConfirmation ? 'text' : 'password'}
								autocomplete="new-password"
								required
								bind:value={formData.password_confirmation}
								oninput={() => handleInputChange('password_confirmation')}
								class="w-full rounded-2xl border-2 border-gray-200/50 bg-gray-50/50 py-4 pl-12 pr-16 text-gray-900 placeholder-gray-500 backdrop-blur-sm transition-all duration-300 focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-500/20 dark:border-gray-700/50 dark:bg-gray-800/50 dark:text-white dark:placeholder-gray-400"
								class:border-red-300={formErrors.password_confirmation}
								class:focus:ring-red-500={formErrors.password_confirmation}
								class:focus:border-red-500={formErrors.password_confirmation}
								placeholder="Повторите пароль"
							/>
							<button
								type="button"
								onclick={() => togglePasswordVisibility('password_confirmation')}
								class="absolute inset-y-0 right-0 z-10 flex items-center pr-4 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
							>
								<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									{#if showPasswordConfirmation}
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
										/>
									{:else}
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
										/>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
										/>
									{/if}
								</svg>
							</button>
						</div>
						{#if formErrors.password_confirmation}
							<p class="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
								<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
										clip-rule="evenodd"
									/>
								</svg>
								{formErrors.password_confirmation}
							</p>
						{/if}
					</div>
				</div>

				<!-- Terms acceptance -->
				<div
					class="flex items-start space-x-3 rounded-2xl border border-gray-200/50 bg-gray-50/50 p-4 dark:border-gray-700/50 dark:bg-gray-800/50"
				>
					<input
						id="terms"
						name="terms"
						type="checkbox"
						bind:checked={formData.terms_accepted}
						class="mt-1 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-2 focus:ring-purple-500"
					/>
					<div class="text-sm leading-relaxed">
						<label for="terms" class="cursor-pointer text-gray-700 dark:text-gray-300">
							Я соглашаюсь с
							<a
								href="/terms"
								class="font-semibold text-purple-600 underline underline-offset-2 hover:text-purple-500 dark:text-purple-400"
							>
								Условиями использования
							</a>
							и
							<a
								href="/privacy"
								class="font-semibold text-purple-600 underline underline-offset-2 hover:text-purple-500 dark:text-purple-400"
							>
								Политикой конфиденциальности
							</a>
							<span class="text-red-500">*</span>
						</label>
					</div>
				</div>
				{#if formErrors.terms_accepted}
					<p class="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
						<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
								clip-rule="evenodd"
							/>
						</svg>
						{formErrors.terms_accepted}
					</p>
				{/if}

				<!-- Кнопка регистрации -->
				<button
					type="submit"
					disabled={isSubmitting}
					class="relative w-full transform overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-6 py-4 text-lg font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-purple-500/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
				>
					<div class="flex items-center justify-center space-x-2">
						{#if isSubmitting}
							<svg
								class="h-5 w-5 animate-spin text-white"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
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
							<span>Создание аккаунта...</span>
						{:else}
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
								/>
							</svg>
							<span>Создать аккаунт</span>
						{/if}
					</div>
				</button>
			</form>

			<!-- Ссылка на логин -->
			<div class="border-t border-gray-200/50 pt-4 text-center dark:border-gray-700/50">
				<p class="text-gray-600 dark:text-gray-400">
					Уже есть аккаунт?
					<a
						href="/login"
						class="ml-1 font-semibold text-purple-600 transition-colors hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300"
					>
						Войти в систему
					</a>
				</p>
			</div>
		</div>
	</div>
</div>
