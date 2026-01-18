<script>
	import { resetPassword } from '$lib/api/auth.js';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	// Get token and email from URL parameters
	let token = $derived($page.url.searchParams.get('token') || '');
	let emailFromUrl = $derived($page.url.searchParams.get('email') || '');

	// Form state
	let formData = $state({
		email: '',
		password: '',
		password_confirmation: ''
	});

	// Update email when URL changes
	$effect(() => {
		formData.email = emailFromUrl;
	});

	// Form errors state
	let errors = $state({});
	let generalError = $state('');

	// Loading and success states
	let isLoading = $state(false);
	let isSuccess = $state(false);

	/**
	 * Handle form submission
	 */
	async function handleSubmit(event) {
		event.preventDefault();

		// Reset errors
		errors = {};
		generalError = '';

		// Basic validation
		if (!formData.email) {
			errors.email = 'Email обязателен';
			return;
		}

		if (!formData.password) {
			errors.password = 'Пароль обязателен';
			return;
		}

		if (formData.password.length < 8) {
			errors.password = 'Пароль должен содержать минимум 8 символов';
			return;
		}

		if (!formData.password_confirmation) {
			errors.password_confirmation = 'Подтверждение пароля обязательно';
			return;
		}

		if (formData.password !== formData.password_confirmation) {
			errors.password_confirmation = 'Пароли не совпадают';
			return;
		}

		if (!token) {
			generalError = 'Недействительная ссылка для сброса пароля';
			return;
		}

		isLoading = true;

		try {
			const result = await resetPassword(
				token,
				formData.email,
				formData.password,
				formData.password_confirmation
			);

			if (result.success) {
				isSuccess = true;
				// Redirect to login after 2 seconds
				setTimeout(() => {
					goto('/login');
				}, 2000);
			} else {
				generalError = result.message || 'Произошла ошибка при сбросе пароля';
				if (result.errors) {
					if (result.errors.email) {
						errors.email = Array.isArray(result.errors.email)
							? result.errors.email[0]
							: result.errors.email;
					}
					if (result.errors.password) {
						errors.password = Array.isArray(result.errors.password)
							? result.errors.password[0]
							: result.errors.password;
					}
					if (result.errors.token) {
						generalError = Array.isArray(result.errors.token)
							? result.errors.token[0]
							: result.errors.token;
					}
				}
			}
		} catch (error) {
			console.error('Reset password error:', error);
			generalError = 'Произошла ошибка при отправке запроса';
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Сброс пароля - B5 Admin</title>
</svelte:head>

<div class="relative isolate min-h-screen bg-gray-950 py-8 sm:py-20">
	<!-- Animated gradient background -->
	<div class="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
		<div
			class="absolute left-1/2 top-0 -translate-x-1/2 blur-3xl"
			style="width: 90rem; height: 50rem;"
		>
			<div
				class="aspect-[1155/678] w-full bg-gradient-to-tr from-indigo-500/30 via-purple-500/20 to-pink-500/30 opacity-30"
				style="clip-path: polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)"
			></div>
		</div>
	</div>

	<div class="mx-auto max-w-7xl px-6 lg:px-8">
		<!-- Header -->
		<div class="mx-auto max-w-2xl text-center">
			<div class="mb-8 hidden items-center justify-center sm:inline-flex">
				<div
					class="rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 p-3 ring-1 ring-white/10 backdrop-blur-sm"
				>
					<svg
						class="h-12 w-12 text-indigo-400"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
						/>
					</svg>
				</div>
			</div>
			<h1
				class="bg-gradient-to-r from-white via-white to-gray-300 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-5xl"
			>
				Сброс пароля
			</h1>
			<p class="mt-4 text-gray-400 sm:mt-6">Введите новый пароль для вашей учетной записи</p>
		</div>

		<!-- Form Card -->
		<div class="mx-auto mt-6 max-w-md sm:mt-12">
			{#if isSuccess}
				<div class="rounded-xl border border-green-500/20 bg-green-500/10 p-6 backdrop-blur-sm">
					<div class="flex items-start gap-3">
						<svg
							class="h-6 w-6 flex-shrink-0 text-green-400"
							fill="currentColor"
							viewBox="0 0 20 20"
						>
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
								clip-rule="evenodd"
							/>
						</svg>
						<div>
							<h3 class="font-semibold text-green-300">Пароль изменен!</h3>
							<p class="mt-2 text-sm text-green-300">
								Ваш пароль был изменен. Сейчас вы будете перенаправлены на страницу входа.
							</p>
						</div>
					</div>
				</div>
			{:else}
				{#if generalError}
					<div
						class="animate-shake mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 backdrop-blur-sm"
					>
						<div class="flex items-start gap-3">
							<svg
								class="h-5 w-5 flex-shrink-0 text-red-400"
								fill="currentColor"
								viewBox="0 0 20 20"
							>
								<path
									fill-rule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
									clip-rule="evenodd"
								/>
							</svg>
							<p class="text-sm text-red-300">{generalError}</p>
						</div>
					</div>
				{/if}

				<div
					class="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/50 backdrop-blur-xl"
				>
					<form onsubmit={handleSubmit} class="space-y-4 sm:space-y-6">
						<!-- Email Field (readonly) -->
						<div>
							<label for="email" class="block text-sm font-medium text-gray-200">Email</label>
							<div class="relative mt-2">
								<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
									<svg
										class="h-5 w-5 text-gray-500"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
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
									type="email"
									name="email"
									id="email"
									bind:value={formData.email}
									readonly
									class="block w-full rounded-lg border-0 bg-white/5 py-2.5 pl-10 pr-4 text-white shadow-sm ring-1 ring-inset ring-white/10 placeholder:text-gray-500 sm:py-3 {errors.email
										? 'ring-red-500/50'
										: ''}"
								/>
							</div>
							{#if errors.email}
								<p class="mt-2 text-sm text-red-400">{errors.email}</p>
							{/if}
						</div>

						<!-- Password Field -->
						<div>
							<label for="password" class="block text-sm font-medium text-gray-200"
								>Новый пароль</label
							>
							<div class="relative mt-2">
								<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
									<svg
										class="h-5 w-5 text-gray-500"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
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
									type="password"
									name="password"
									id="password"
									autocomplete="new-password"
									bind:value={formData.password}
									disabled={isLoading}
									placeholder="Минимум 8 символов"
									class="block w-full rounded-lg border-0 bg-white/5 py-2.5 pl-10 pr-4 text-white shadow-sm ring-1 ring-inset ring-white/10 transition-all placeholder:text-gray-500 hover:bg-white/10 focus:bg-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 sm:py-3 {errors.password
										? 'ring-red-500/50 focus:ring-red-500'
										: ''}"
								/>
							</div>
							{#if errors.password}
								<p class="mt-2 text-sm text-red-400">{errors.password}</p>
							{/if}
						</div>

						<!-- Password Confirmation Field -->
						<div>
							<label for="password_confirmation" class="block text-sm font-medium text-gray-200"
								>Подтвердите пароль</label
							>
							<div class="relative mt-2">
								<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
									<svg
										class="h-5 w-5 text-gray-500"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
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
									type="password"
									name="password_confirmation"
									id="password_confirmation"
									autocomplete="new-password"
									bind:value={formData.password_confirmation}
									disabled={isLoading}
									placeholder="Повторите пароль"
									class="block w-full rounded-lg border-0 bg-white/5 py-2.5 pl-10 pr-4 text-white shadow-sm ring-1 ring-inset ring-white/10 transition-all placeholder:text-gray-500 hover:bg-white/10 focus:bg-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 sm:py-3 {errors.password_confirmation
										? 'ring-red-500/50 focus:ring-red-500'
										: ''}"
								/>
							</div>
							{#if errors.password_confirmation}
								<p class="mt-2 text-sm text-red-400">{errors.password_confirmation}</p>
							{/if}
						</div>

						<!-- Submit Button -->
						<button
							type="submit"
							disabled={isLoading}
							class="group relative w-full overflow-hidden rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-4 py-3 font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-indigo-500/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-950 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
						>
							<span class="relative z-10 flex items-center justify-center gap-2">
								{#if isLoading}
									<svg class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
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
									Сохраняем...
								{:else}
									Сбросить пароль
									<svg
										class="h-5 w-5 transition-transform group-hover:translate-x-1"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M13 7l5 5m0 0l-5 5m5-5H6"
										/>
									</svg>
								{/if}
							</span>
							<div
								class="absolute inset-0 -z-10 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 opacity-0 transition-opacity group-hover:opacity-100"
							></div>
						</button>
					</form>
				</div>

				<!-- Back to Login Link -->
				<div class="mt-8 text-center">
					<a
						href="/login"
						class="inline-flex items-center gap-2 text-sm font-medium text-indigo-400 transition-colors hover:text-indigo-300"
					>
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M10 19l-7-7m0 0l7-7m-7 7h18"
							/>
						</svg>
						Вернуться к входу
					</a>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	@keyframes shake {
		0%,
		100% {
			transform: translateX(0);
		}
		10%,
		30%,
		50%,
		70%,
		90% {
			transform: translateX(-4px);
		}
		20%,
		40%,
		60%,
		80% {
			transform: translateX(4px);
		}
	}

	.animate-shake {
		animation: shake 0.5s ease-in-out;
	}
</style>
