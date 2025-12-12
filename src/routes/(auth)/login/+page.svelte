<script>
	import { login, authState, clearError, isLoading } from '$lib/state/auth.svelte.js';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import ErrorDisplay from '$lib/components/common/ErrorDisplay.svelte';

	// Form state
	let email = $state('');
	let password = $state('');
	let remember = $state(false);
	let clientErrors = $state({});
	let showPassword = $state(false);

	// Get return URL from query parameters for redirect after login
	let returnUrl = $derived($page.url.searchParams.get('returnUrl') || '/dashboard');

	// Restore "Remember Me" preference from localStorage
	// Временно отключено: чекбокс "Запомнить меня" скрыт
	// $effect(() => {
	// 	if (browser) {
	// 		const savedRememberMe = localStorage.getItem('rememberMe');
	// 		if (savedRememberMe === 'true') {
	// 			remember = true;
	// 		}
	// 	}
	// });

	/**
	 * Validate email format
	 */
	function validateEmail(email) {
		if (!email) return 'Email is required';
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) return 'Please enter a valid email address';
		return null;
	}

	/**
	 * Validate password
	 */
	function validatePassword(password) {
		if (!password) return 'Password is required';
		if (password.length < 6) return 'Password must be at least 6 characters long';
		return null;
	}

	/**
	 * Validate form fields
	 */
	function validateForm() {
		const errors = {};
		const emailError = validateEmail(email);
		if (emailError) errors.email = [emailError];
		const passwordError = validatePassword(password);
		if (passwordError) errors.password = [passwordError];
		clientErrors = errors;
		return Object.keys(errors).length === 0;
	}

	/**
	 * Handle form submission
	 */
	async function handleSubmit(event) {
		event.preventDefault();
		clearError();
		clientErrors = {};
		if (!validateForm()) return;

		// Save "Remember Me" preference to localStorage
		// Временно отключено: чекбокс "Запомнить меня" скрыт
		// if (browser) {
		// 	localStorage.setItem('rememberMe', remember.toString());
		// }

		try {
			// Pass remember parameter to login function
			const success = await login(email, password, remember);
			if (success) {
				// Check user type/status
				const userType = authState.user?.type;

				// Allow access ONLY for Админ, Куратор, Менеджер
				const allowedTypes = ['Админ', 'Куратор', 'Менеджер'];

				if (!userType || !allowedTypes.includes(userType)) {
					goto('/access-denied');
					return;
				}

				// Check if email is verified
				if (authState.user && !authState.user.email_verified) {
					// Email not verified - redirect to email verification page
					goto('/email-verify');
				} else {
					// Email verified - proceed to intended destination
					goto(returnUrl);
				}
			}
		} catch (error) {
			console.error('Login failed:', error);
		}
	}

	/**
	 * Handle input changes to clear field-specific errors
	 */
	function handleInputChange(field) {
		if (clientErrors[field]) {
			const newErrors = { ...clientErrors };
			delete newErrors[field];
			clientErrors = newErrors;
		}
		clearError();
	}

	/**
	 * Get error message for a field (client or server)
	 */
	function getFieldError(field) {
		if (clientErrors[field] && clientErrors[field].length > 0) {
			return clientErrors[field][0];
		}
		// Check for server errors - new auth system stores errors differently
		if (field === 'email' && authState.loginError) {
			return authState.loginError;
		}
		if (field === 'password' && authState.loginError) {
			return authState.loginError;
		}
		return null;
	}

	// Toggle password visibility
	function togglePasswordVisibility() {
		showPassword = !showPassword;
	}
</script>

<svelte:head>
	<title>Вход в систему</title>
	<meta name="description" content="Войдите в административную панель" />
</svelte:head>

<!-- Header with Logo -->
<div
	class="fixed top-0 right-0 left-0 z-50 border-b border-gray-200 bg-gray-50/80 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/80"
>
	<div class="mx-auto max-w-7xl px-6 lg:px-8">
		<div class="flex h-16 items-center justify-start">
			<a
				href="/"
				class="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-2xl font-bold text-transparent transition-all hover:from-indigo-700 hover:via-purple-700 hover:to-blue-700"
			>
				RUBONUS<span class="text-base">.pro</span>
			</a>
		</div>
	</div>
</div>

<!-- Современная карточка авторизации -->
<div class="flex h-screen items-center justify-center bg-gray-50 p-4 pt-20 dark:bg-gray-950">
	<div class="animate-fade-in-up relative w-full max-w-2xl">
		<!-- Стеклянная морфизм карточка -->
		<div
			class="overflow-hidden rounded-3xl border border-white/20 bg-white/80 shadow-2xl backdrop-blur-xl dark:border-gray-700/20 dark:bg-gray-950/80"
		>
			<!-- Заголовок с градиентом -->
			<div
				class="animate-fade-in-down relative bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 p-6 text-center lg:p-8"
			>
				<!-- Декоративные элементы -->
				<div
					class="absolute inset-0 bg-gradient-to-r from-indigo-600/90 via-purple-600/90 to-blue-600/90"
				></div>
				<div class="absolute top-0 left-0 h-full w-full opacity-10">
					<div
						class="h-full w-full bg-white/5 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"
					></div>
				</div>

				<div class="relative z-10">
					<!-- Логотип -->
					<div class="mb-4 hidden sm:block lg:mb-6">
						<div
							class="inline-flex h-11 w-13 items-center justify-center rounded-full border border-white/30 bg-white/20 backdrop-blur-sm lg:h-16 lg:w-18"
						>
							<svg
								class="h-4 w-4 text-white lg:h-8 lg:w-8"
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
					</div>

					<h1 class="mb-1 text-4xl font-bold text-white lg:mb-2 lg:text-3xl">Вход в систему</h1>
					<!-- <p class="text-lg text-white/90">Вход в систему управления</p> -->
				</div>
			</div>

			<!-- Форма -->
			<div class="animate-fade-in-up space-y-6 p-8 md:p-12" style="animation-delay: 0.2s;">
				<!-- General error messages using ErrorDisplay component -->
				{#if authState.error || authState.loginError}
					<div class="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
						<div class="flex">
							<div class="flex-shrink-0">
								<svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
									<path
										fill-rule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
										clip-rule="evenodd"
									/>
								</svg>
							</div>
							<div class="ml-3">
								<p class="text-sm text-red-800 dark:text-red-200">
									{authState.error || authState.loginError}
								</p>
							</div>
						</div>
					</div>
				{/if}

				<form class="space-y-6" onsubmit={handleSubmit}>
					<!-- Email поле -->
					<div class="space-y-1.5">
						<label for="email" class="block text-sm font-semibold text-gray-700 dark:text-gray-300">
							Email адрес
						</label>
						<div class="group relative">
							<div
								class="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-4"
							>
								<svg
									class="h-5 w-5 text-gray-400 transition-colors group-focus-within:text-indigo-500"
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
								bind:value={email}
								oninput={() => handleInputChange('email')}
								disabled={isLoading()}
								class="w-full rounded-2xl border-2 border-gray-200/50 bg-gray-50/50 py-4 pr-4 pl-12 text-gray-900 placeholder-gray-500 backdrop-blur-sm transition-all duration-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 focus:outline-none dark:border-gray-700/50 dark:bg-gray-800/50 dark:text-white dark:placeholder-gray-400"
								class:border-red-300={getFieldError('email')}
								class:focus:ring-red-500={getFieldError('email')}
								class:focus:border-red-500={getFieldError('email')}
								placeholder="example@mail.ru"
							/>
						</div>
						<!-- Field-specific errors -->
						{#if getFieldError('email')}
							<p class="mt-1 text-sm text-red-600 dark:text-red-400">
								{getFieldError('email')}
							</p>
						{/if}
					</div>

					<!-- Password поле -->
					<div class="space-y-1.5">
						<label
							for="password"
							class="block text-sm font-semibold text-gray-700 dark:text-gray-300"
						>
							Пароль
						</label>
						<div class="group relative">
							<div
								class="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-4"
							>
								<svg
									class="h-5 w-5 text-gray-400 transition-colors group-focus-within:text-indigo-500"
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
								autocomplete="current-password"
								required
								bind:value={password}
								oninput={() => handleInputChange('password')}
								disabled={isLoading()}
								class="w-full rounded-2xl border-2 border-gray-200/50 bg-gray-50/50 py-4 pr-16 pl-12 text-gray-900 placeholder-gray-500 backdrop-blur-sm transition-all duration-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 focus:outline-none dark:border-gray-700/50 dark:bg-gray-800/50 dark:text-white dark:placeholder-gray-400"
								class:border-red-300={getFieldError('password')}
								class:focus:ring-red-500={getFieldError('password')}
								class:focus:border-red-500={getFieldError('password')}
								placeholder="Введите пароль"
							/>
							<button
								type="button"
								onclick={togglePasswordVisibility}
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
						<!-- Field-specific errors -->
						{#if getFieldError('password')}
							<p class="mt-1 text-sm text-red-600 dark:text-red-400">
								{getFieldError('password')}
							</p>
						{/if}
					</div>

					<!-- Дополнительные опции -->
					<div class="flex items-center justify-between">
						<!-- Временно скрыто: чекбокс "Запомнить меня" -->
						<!--
						<label class="flex cursor-pointer items-center space-x-2">
							<input
								type="checkbox"
								bind:checked={remember}
								class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
							/>
							<span class="text-sm text-gray-700 dark:text-gray-300">Запомнить меня</span>
						</label>
						-->
						<a
							href="/forgot-password"
							class="text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
						>
							Забыли пароль?
						</a>
					</div>

					<!-- Кнопка входа -->
					<button
						type="submit"
						disabled={isLoading()}
						class="relative w-full transform overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 px-6 py-4 text-lg font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:from-indigo-700 hover:via-purple-700 hover:to-blue-700 focus:ring-4 focus:ring-indigo-500/20 focus:outline-none active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
					>
						<div class="flex items-center justify-center space-x-2">
							{#if isLoading()}
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
								<span>Вход...</span>
							{:else}
								<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
									/>
								</svg>
								<span>Войти в систему</span>
							{/if}
						</div>
					</button>
				</form>

				<!-- Ссылка на регистрацию -->
				<div class="border-t border-gray-200/50 pt-4 text-center dark:border-gray-700/50">
					<p class="text-gray-600 dark:text-gray-400">
						Нет аккаунта?
						<a
							href="/register"
							class="ml-1 font-semibold text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
						>
							Зарегистрироваться
						</a>
					</p>
				</div>
			</div>
		</div>
	</div>
</div>
