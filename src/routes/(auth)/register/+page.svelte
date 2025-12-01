<script>
	import { register, authState, clearError, isLoading } from '$lib/state/auth.svelte.js';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import ErrorDisplay from '$lib/components/ErrorDisplay.svelte';

	// Form state
	let name = $state('');
	let email = $state('');
	let companyName = $state('');
	let phone = $state('');
	let password = $state('');
	let passwordConfirmation = $state('');
	let remember = $state(false);
	let clientErrors = $state({});
	let showPassword = $state(false);
	let showPasswordConfirmation = $state(false);

	// Get return URL from query parameters for redirect after registration
	// Default to email-verify page to require email verification
	let returnUrl = $derived($page.url.searchParams.get('returnUrl') || '/email-verify');

	/**
	 * Validate name field
	 */
	function validateName(name) {
		if (!name) return 'Name is required';
		if (name.length < 2) return 'Name must be at least 2 characters long';
		return null;
	}

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
		if (password.length < 8) return 'Password must be at least 8 characters long';
		return null;
	}

	/**
	 * Validate password confirmation
	 */
	function validatePasswordConfirmation(password, passwordConfirmation) {
		if (!passwordConfirmation) return 'Password confirmation is required';
		if (password !== passwordConfirmation) return 'Passwords do not match';
		return null;
	}

	/**
	 * Validate company name field (required)
	 */
	function validateCompanyName(companyName) {
		if (!companyName) return 'Название компании обязательно';
		if (companyName.length < 2) return 'Название компании должно содержать минимум 2 символа';
		if (companyName.length > 255) return 'Название компании слишком длинное';
		return null;
	}

	/**
	 * Validate phone field (optional)
	 */
	function validatePhone(phone) {
		if (!phone) return null; // Phone is optional
		const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,20}$/;
		if (!phoneRegex.test(phone)) return 'Please enter a valid phone number';
		return null;
	}

	/**
	 * Validate form fields
	 */
	function validateForm() {
		const errors = {};
		const nameError = validateName(name);
		if (nameError) errors.name = [nameError];
		const emailError = validateEmail(email);
		if (emailError) errors.email = [emailError];
		const companyNameError = validateCompanyName(companyName);
		if (companyNameError) errors.company_name = [companyNameError];
		const phoneError = validatePhone(phone);
		if (phoneError) errors.phone = [phoneError];
		const passwordError = validatePassword(password);
		if (passwordError) errors.password = [passwordError];
		const passwordConfirmationError = validatePasswordConfirmation(password, passwordConfirmation);
		if (passwordConfirmationError) errors.password_confirmation = [passwordConfirmationError];
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
		try {
			// Подготавливаем данные формы
			const formData = {
				name,
				email,
				company_name: companyName,
				password,
				password_confirmation: passwordConfirmation
			};

			// Добавляем необязательные поля только если они заполнены
			if (phone && phone.trim() !== '') {
				formData.phone = phone.trim();
			}

			const success = await register(formData);
			if (success) {
				goto(returnUrl);
			}
		} catch (error) {
			console.error('Registration failed:', error);
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

		// Check for server errors from auth state
		if (authState.errors && authState.errors[field] && authState.errors[field].length > 0) {
			return authState.errors[field][0];
		}

		// Legacy server error handling
		if (
			(field === 'name' ||
				field === 'email' ||
				field === 'company_name' ||
				field === 'phone' ||
				field === 'password' ||
				field === 'password_confirmation') &&
			authState.registerError
		) {
			return authState.registerError;
		}

		return null;
	}

	// Toggle password visibility
	function togglePasswordVisibility() {
		showPassword = !showPassword;
	}

	// Toggle password confirmation visibility
	function togglePasswordConfirmationVisibility() {
		showPasswordConfirmation = !showPasswordConfirmation;
	}
</script>

<svelte:head>
	<title>Регистрация в системе</title>
	<meta name="description" content="Создайте новый аккаунт в административной панели" />
</svelte:head>

<!-- Header with Logo -->
<div
	class="fixed top-0 right-0 left-0 z-50 border-b border-gray-200 bg-gray-50/80 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/80"
>
	<div class="mx-auto max-w-7xl px-6 lg:px-8">
		<div class="flex h-16 items-center justify-start">
			<a
				href="/"
				class="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-2xl font-bold text-transparent transition-all hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700"
			>
				RUBONUS<span class="text-base">.pro</span>
			</a>
		</div>
	</div>
</div>

<!-- Современная карточка регистрации -->
<div class="flex h-screen items-center justify-center bg-gray-50 p-4 pt-20 dark:bg-gray-950">
	<div class="animate-fade-in-up relative w-full max-w-4xl">
		<!-- Стеклянная морфизм карточка -->
		<div
			class="overflow-hidden rounded-3xl border border-white/20 bg-white/80 shadow-2xl backdrop-blur-xl dark:border-gray-700/20 dark:bg-gray-950/80"
		>
			<!-- Заголовок с градиентом -->
			<div
				class="animate-fade-in-down relative bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 text-center md:p-7 lg:p-8"
			>
				<!-- Декоративные элементы -->
				<div
					class="absolute inset-0 bg-gradient-to-r from-emerald-600/90 via-teal-600/90 to-cyan-600/90"
				></div>
				<div class="absolute top-0 left-0 h-full w-full opacity-10">
					<div
						class="h-full w-full bg-white/5 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"
					></div>
				</div>

				<div class="relative z-10">
					<!-- Логотип -->
					<div class="mb-4 hidden sm:block md:mb-5 lg:mb-6">
						<div
							class="inline-flex h-11 w-13 items-center justify-center rounded-full border border-white/30 bg-white/20 backdrop-blur-sm md:h-11.5 md:w-13.5 lg:h-16 lg:w-18"
						>
							<svg
								class="h-4 w-4 text-white md:h-5 md:w-5 lg:h-8 lg:w-8"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
								/>
							</svg>
						</div>
					</div>

					<h1 class="md:text-3.5xl mb-1 text-3xl font-bold text-white lg:mb-2 lg:text-4xl">
						Регистрация
					</h1>
					<!-- <p class="text-lg text-white/90">Создание нового аккаунта</p> -->
				</div>
			</div>

			<!-- Форма регистрации -->
			<div class="animate-fade-in-up space-y-6 p-6 md:p-10 lg:p-12" style="animation-delay: 0.2s;">
				<!-- General error messages -->
				{#if authState.error || authState.registerError}
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
									{authState.error || authState.registerError}
								</p>
							</div>
						</div>
					</div>
				{/if}

				<form class="space-y-6" onsubmit={handleSubmit}>
					<!-- Двухколоночная сетка для полей формы -->
					<div class="grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-2 lg:gap-6">
						<!-- Левый столбец -->
						<div class="space-y-4 md:space-y-5 lg:space-y-6">
							<!-- Name поле -->
							<div class="space-y-1.5">
								<label
									for="name"
									class="block text-sm font-semibold text-gray-700 dark:text-gray-300"
								>
									Полное имя
								</label>
								<div class="group relative">
									<div
										class="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-4"
									>
										<svg
											class="h-5 w-5 text-gray-400 transition-colors group-focus-within:text-emerald-500"
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
										autocomplete="name"
										required
										bind:value={name}
										oninput={() => handleInputChange('name')}
										disabled={isLoading()}
										class="w-full rounded-2xl border-2 border-gray-200/50 bg-gray-50/50 py-2.5 pr-4 pl-12 text-gray-900 placeholder-gray-500 backdrop-blur-sm transition-all duration-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 focus:outline-none md:py-2.75 lg:py-3 dark:border-gray-700/50 dark:bg-gray-800/50 dark:text-white dark:placeholder-gray-400"
										class:border-red-300={getFieldError('name')}
										class:focus:ring-red-500={getFieldError('name')}
										class:focus:border-red-500={getFieldError('name')}
										placeholder="Ваше имя"
									/>
								</div>
								<!-- Field-specific errors -->
								{#if getFieldError('name')}
									<p class="mt-1 text-sm text-red-600 dark:text-red-400">
										{getFieldError('name')}
									</p>
								{/if}
							</div>

							<!-- Phone поле -->
							<div class="space-y-1">
								<label
									for="phone"
									class="block text-sm font-semibold text-gray-700 dark:text-gray-300"
								>
									Телефон (необязательно)
								</label>
								<div class="group relative">
									<div
										class="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-4"
									>
										<svg
											class="h-5 w-5 text-gray-400 transition-colors group-focus-within:text-emerald-500"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
											/>
										</svg>
									</div>
									<input
										id="phone"
										name="phone"
										type="tel"
										autocomplete="tel"
										bind:value={phone}
										oninput={() => handleInputChange('phone')}
										disabled={isLoading()}
										class="w-full rounded-2xl border-2 border-gray-200/50 bg-gray-50/50 py-2.5 pr-4 pl-12 text-gray-900 placeholder-gray-500 backdrop-blur-sm transition-all duration-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 focus:outline-none md:py-2.75 lg:py-3 dark:border-gray-700/50 dark:bg-gray-800/50 dark:text-white dark:placeholder-gray-400"
										class:border-red-300={getFieldError('phone')}
										class:focus:ring-red-500={getFieldError('phone')}
										class:focus:border-red-500={getFieldError('phone')}
										placeholder="+7 (900) 123-45-67"
									/>
								</div>
								<!-- Field-specific errors -->
								{#if getFieldError('phone')}
									<p class="mt-1 text-sm text-red-600 dark:text-red-400">
										{getFieldError('phone')}
									</p>
								{/if}
							</div>
						</div>

						<!-- Правый столбец -->
						<div class="space-y-4 md:space-y-5 lg:space-y-6">
							<!-- Company поле -->
							<div class="space-y-1">
								<label
									for="company_name"
									class="block text-sm font-semibold text-gray-700 dark:text-gray-300"
								>
									Компания
								</label>
								<div class="group relative">
									<div
										class="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-4"
									>
										<svg
											class="h-5 w-5 text-gray-400 transition-colors group-focus-within:text-emerald-500"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
											/>
										</svg>
									</div>
									<input
										id="company_name"
										name="company_name"
										type="text"
										autocomplete="organization"
										required
										bind:value={companyName}
										oninput={() => handleInputChange('company_name')}
										disabled={isLoading()}
										class="w-full rounded-2xl border-2 border-gray-200/50 bg-gray-50/50 py-2.5 pr-4 pl-12 text-gray-900 placeholder-gray-500 backdrop-blur-sm transition-all duration-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 focus:outline-none md:py-2.75 lg:py-3 dark:border-gray-700/50 dark:bg-gray-800/50 dark:text-white dark:placeholder-gray-400"
										class:border-red-300={getFieldError('company_name')}
										class:focus:ring-red-500={getFieldError('company_name')}
										class:focus:border-red-500={getFieldError('company_name')}
										placeholder="Ваша компания"
									/>
								</div>
								<!-- Field-specific errors -->
								{#if getFieldError('company_name')}
									<p class="mt-1 text-sm text-red-600 dark:text-red-400">
										{getFieldError('company_name')}
									</p>
								{/if}
							</div>

							<!-- Email поле -->
							<div class="space-y-1">
								<label
									for="email"
									class="block text-sm font-semibold text-gray-700 dark:text-gray-300"
								>
									Email адрес
								</label>
								<div class="group relative">
									<div
										class="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-4"
									>
										<svg
											class="h-5 w-5 text-gray-400 transition-colors group-focus-within:text-emerald-500"
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
										class="w-full rounded-2xl border-2 border-gray-200/50 bg-gray-50/50 py-2.5 pr-4 pl-12 text-gray-900 placeholder-gray-500 backdrop-blur-sm transition-all duration-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 focus:outline-none md:py-2.75 lg:py-3 dark:border-gray-700/50 dark:bg-gray-800/50 dark:text-white dark:placeholder-gray-400"
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
						</div>
					</div>

					<!-- Поля паролей - всегда внизу -->
					<div class="grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-2 lg:gap-6">
						<!-- Password поле -->
						<div class="space-y-1">
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
										class="h-5 w-5 text-gray-400 transition-colors group-focus-within:text-emerald-500"
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
									bind:value={password}
									oninput={() => handleInputChange('password')}
									disabled={isLoading()}
									class="w-full rounded-2xl border-2 border-gray-200/50 bg-gray-50/50 py-2.5 pr-16 pl-12 text-gray-900 placeholder-gray-500 backdrop-blur-sm transition-all duration-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 focus:outline-none md:py-2.75 lg:py-3 dark:border-gray-700/50 dark:bg-gray-800/50 dark:text-white dark:placeholder-gray-400"
									class:border-red-300={getFieldError('password')}
									class:focus:ring-red-500={getFieldError('password')}
									class:focus:border-red-500={getFieldError('password')}
									placeholder="Минимум 8 символов"
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

						<!-- Password Confirmation поле -->
						<div class="space-y-1">
							<label
								for="password_confirmation"
								class="block text-sm font-semibold text-gray-700 dark:text-gray-300"
							>
								Подтверждение пароля
							</label>
							<div class="group relative">
								<div
									class="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-4"
								>
									<svg
										class="h-5 w-5 text-gray-400 transition-colors group-focus-within:text-emerald-500"
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
									bind:value={passwordConfirmation}
									oninput={() => handleInputChange('password_confirmation')}
									disabled={isLoading()}
									class="w-full rounded-2xl border-2 border-gray-200/50 bg-gray-50/50 py-2.5 pr-16 pl-12 text-gray-900 placeholder-gray-500 backdrop-blur-sm transition-all duration-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 focus:outline-none md:py-2.75 lg:py-3 dark:border-gray-700/50 dark:bg-gray-800/50 dark:text-white dark:placeholder-gray-400"
									class:border-red-300={getFieldError('password_confirmation')}
									class:focus:ring-red-500={getFieldError('password_confirmation')}
									class:focus:border-red-500={getFieldError('password_confirmation')}
									placeholder="Повторите пароль"
								/>
								<button
									type="button"
									onclick={togglePasswordConfirmationVisibility}
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
							<!-- Field-specific errors -->
							{#if getFieldError('password_confirmation')}
								<p class="mt-1 text-sm text-red-600 dark:text-red-400">
									{getFieldError('password_confirmation')}
								</p>
							{/if}
						</div>
					</div>

					<!-- Кнопка регистрации -->
					<button
						type="submit"
						disabled={isLoading()}
						class="relative w-full transform overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-6 py-3 text-lg font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 focus:ring-4 focus:ring-emerald-500/20 focus:outline-none active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
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

				<!-- Ссылка на вход -->
				<div class="border-t border-gray-200/50 pt-4 text-center dark:border-gray-700/50">
					<p class="text-gray-600 dark:text-gray-400">
						Уже есть аккаунт?
						<a
							href="/login"
							class="ml-1 font-semibold text-emerald-600 transition-colors hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300"
						>
							Войти в систему
						</a>
					</p>
				</div>
			</div>
		</div>
	</div>
</div>
