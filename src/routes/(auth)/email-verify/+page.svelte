<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import {
		authState,
		isAuthenticated,
		resendEmailVerificationNotification,
		verifyEmailAddress,
		clearError,
		logout
	} from '$lib/state/auth.svelte.js';
	import { addSuccessToast, addErrorToast } from '$lib/utils/toastStore.js';

	// Component state
	let verificationStatus = $state('pending'); // 'pending', 'verifying', 'success', 'error'
	let resendCooldown = $state(0);
	let resendTimer = $state(null);

	// Reactive state
	let user = $derived(authState.user);
	let loading = $derived(authState.emailVerificationLoading);
	let error = $derived(authState.emailVerificationError);

	/**
	 * Initialize component and handle verification
	 */
	onMount(async () => {
		clearError();

		const urlParams = $page.url.searchParams;
		const id = urlParams.get('id');
		const hash = urlParams.get('hash');

		if (id && hash) {
			await handleVerificationLink(id, hash);
		} else {
			if (!isAuthenticated()) {
				goto('/login');
				return;
			}

			if (user?.email_verified) {
				verificationStatus = 'success';
				addSuccessToast('Ваш email уже подтвержден');
				setTimeout(() => {
					goto('/dashboard');
				}, 5000);
				return;
			}

			verificationStatus = 'pending';
		}
	});

	/**
	 * Handle verification link processing
	 */
	async function handleVerificationLink(id, hash) {
		verificationStatus = 'verifying';

		try {
			const success = await verifyEmailAddress(id, hash);

			if (success) {
				verificationStatus = 'success';
				addSuccessToast('Email успешно подтвержден!');

				setTimeout(() => {
					if (isAuthenticated()) {
						goto('/dashboard');
					} else {
						goto('/login?verified=true');
					}
				}, 5000);
			} else {
				verificationStatus = 'error';
				addErrorToast(error || 'Не удалось подтвердить email');
			}
		} catch (err) {
			verificationStatus = 'error';
			addErrorToast('Произошла ошибка при подтверждении email');
		}
	}

	/**
	 * Handle resend verification email
	 */
	async function handleResendVerification() {
		if (resendCooldown > 0) return;

		try {
			const success = await resendEmailVerificationNotification();

			if (success) {
				addSuccessToast('Письмо подтверждения отправлено повторно');
				startResendCooldown();
			} else {
				addErrorToast(error || 'Не удалось отправить письмо подтверждения');
			}
		} catch (err) {
			addErrorToast('Произошла ошибка при отправке письма');
		}
	}

	/**
	 * Start cooldown timer for resend button
	 */
	function startResendCooldown() {
		resendCooldown = 60;

		resendTimer = setInterval(() => {
			resendCooldown--;
			if (resendCooldown <= 0) {
				clearInterval(resendTimer);
				resendTimer = null;
			}
		}, 1000);
	}

	/**
	 * Navigate to dashboard
	 */
	function goToDashboard() {
		goto('/dashboard');
	}

	/**
	 * Navigate to login
	 */
	function goToLogin() {
		goto('/login');
	}

	/**
	 * Handle logout
	 */
	async function handleLogout() {
		await logout({ redirectTo: '/login' });
	}

	// Cleanup timer on component destroy
	onMount(() => {
		return () => {
			if (resendTimer) {
				clearInterval(resendTimer);
			}
		};
	});
</script>

<svelte:head>
	<title>Подтверждение Email</title>
	<meta
		name="description"
		content="Подтверждение email адреса для доступа к административной панели"
	/>
</svelte:head>

<!-- Современная карточка подтверждения email -->
<div class="flex h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-950">
	<div class="animate-fade-in-up relative w-full max-w-2xl">
		<!-- Стеклянная морфизм карточка -->
		<div
			class="overflow-hidden rounded-3xl border border-white/20 bg-white/80 shadow-2xl backdrop-blur-xl dark:border-gray-700/20 dark:bg-gray-950/80"
		>
			<!-- Заголовок с градиентом -->
			<div
				class="animate-fade-in-down relative bg-gradient-to-r from-orange-600 via-rose-600 to-pink-600 p-6 text-center lg:p-8"
			>
				<!-- Декоративные элементы -->
				<div
					class="absolute inset-0 bg-gradient-to-r from-orange-600/90 via-rose-600/90 to-pink-600/90"
				></div>
				<div class="absolute left-0 top-0 h-full w-full opacity-10">
					<div
						class="h-full w-full bg-white/5 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"
					></div>
				</div>

				<div class="relative z-10">
					<!-- Логотип -->
					<div class="mb-4 lg:mb-6">
						<div
							class="w-13 lg:w-18 inline-flex h-11 items-center justify-center rounded-full border border-white/30 bg-white/20 backdrop-blur-sm lg:h-16"
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
									d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
								/>
							</svg>
						</div>
					</div>

					<h1 class="mb-1 text-3xl font-bold text-white lg:mb-2 lg:text-3xl">
						Подтверждение Email
					</h1>
				</div>
			</div>

			<!-- Контент -->
			<div class="animate-fade-in-up space-y-6 p-8 md:p-12" style="animation-delay: 0.2s;">
				{#if verificationStatus === 'pending'}
					<!-- Pending verification state -->
					<div class="text-center">
						<!-- <h3 class="mb-3 text-2xl font-bold text-gray-900 dark:text-white">
							Требуется подтверждение email
						</h3> -->

						<p class="mb-4 text-gray-600 dark:text-gray-400">
							Для доступа к административной панели необходимо подтвердить email. Проверьте вашу
							почту:
							<strong class="text-orange-600 dark:text-orange-400"
								>{user?.email || 'ваш email'}</strong
							>
						</p>

						<div
							class="mb-6 rounded-2xl border-2 border-orange-200/50 bg-orange-50/50 p-6 text-left backdrop-blur-sm dark:border-orange-700/50 dark:bg-orange-900/20"
						>
							<h4 class="mb-3 font-semibold text-orange-900 dark:text-orange-300">
								Как подтвердить email:
							</h4>
							<ol class="space-y-2 text-sm text-orange-800 dark:text-orange-400">
								<li class="flex items-start">
									<span
										class="mr-2 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-orange-200 text-xs font-bold text-orange-900 dark:bg-orange-800 dark:text-orange-200"
										>1</span
									>
									<span>Проверьте почтовый ящик (возможно и папку "Спам")</span>
								</li>
								<li class="flex items-start">
									<span
										class="mr-2 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-orange-200 text-xs font-bold text-orange-900 dark:bg-orange-800 dark:text-orange-200"
										>2</span
									>
									<span>Найдите письмо от команды BONUS 5</span>
								</li>
								<li class="flex items-start">
									<span
										class="mr-2 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-orange-200 text-xs font-bold text-orange-900 dark:bg-orange-800 dark:text-orange-200"
										>3</span
									>
									<span class="text-sm">Нажмите на яркую кнопку "Подтвердить Email"</span>
								</li>
								<!-- <li class="flex items-start">
									<span
										class="mr-2 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-orange-200 text-xs font-bold text-orange-900 dark:bg-orange-800 dark:text-orange-200"
										>4</span
									>
									<span>Вы автоматически получите доступ к панели</span>
								</li> -->
							</ol>
						</div>

						<!-- Resend button -->
						<button
							type="button"
							onclick={handleResendVerification}
							disabled={loading || resendCooldown > 0}
							class="mb-4 w-full transform cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-r from-orange-600 via-rose-600 to-pink-600 px-6 py-4 text-lg font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:from-orange-700 hover:via-rose-700 hover:to-pink-700 focus:outline-none focus:ring-4 focus:ring-orange-500/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
						>
							<div class="flex items-center justify-center space-x-2">
								{#if loading}
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
									<span class="text-sm sm:text-base">Отправляем...</span>
								{:else if resendCooldown > 0}
									<span class="text-sm sm:text-base">Повторить через {resendCooldown}с</span>
								{:else}
									<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
										/>
									</svg>
									<span class="text-sm sm:text-base">Отправить письмо повторно</span>
								{/if}
							</div>
						</button>

						<!-- Logout/Login button -->
						{#if isAuthenticated()}
							<button
								type="button"
								onclick={handleLogout}
								class="w-full cursor-pointer rounded-2xl border-2 border-gray-200/50 bg-gray-50/50 px-6 py-4 text-sm font-semibold text-gray-700 backdrop-blur-sm transition-all duration-300 hover:border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-gray-500/20 sm:text-base dark:border-gray-700/50 dark:bg-gray-800/50 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-700/50"
							>
								Выйти из системы
							</button>
						{:else}
							<button
								type="button"
								onclick={goToLogin}
								class="w-full rounded-2xl border-2 border-gray-200/50 bg-gray-50/50 px-6 py-4 text-sm font-semibold text-gray-700 backdrop-blur-sm transition-all duration-300 hover:border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-gray-500/20 sm:text-base dark:border-gray-700/50 dark:bg-gray-800/50 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-700/50"
							>
								Вернуться ко входу
							</button>
						{/if}
					</div>
				{:else if verificationStatus === 'verifying'}
					<!-- Verifying state -->
					<div class="text-center">
						<div
							class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-pink-100 dark:from-orange-900/30 dark:to-pink-900/30"
						>
							<svg
								class="h-10 w-10 animate-spin text-orange-600 dark:text-orange-400"
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
						</div>
						<h3 class="mb-3 text-2xl font-bold text-gray-900 dark:text-white">
							Подтверждаем ваш email...
						</h3>
						<p class="text-gray-600 dark:text-gray-400">Пожалуйста, подождите</p>
					</div>
				{:else if verificationStatus === 'success'}
					<!-- Success state -->
					<div class="text-center">
						<div
							class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30"
						>
							<svg
								class="h-10 w-10 text-green-600 dark:text-green-400"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M5 13l4 4L19 7"
								/>
							</svg>
						</div>
						<h3 class="mb-3 text-2xl font-bold text-gray-900 dark:text-white">
							Email подтвержден!
						</h3>
						<p class="mb-6 text-gray-600 dark:text-gray-400">
							{#if isAuthenticated()}
								Ваш email адрес успешно подтвержден. Теперь у вас есть полный доступ к
								административной панели.
							{:else}
								Ваш email адрес успешно подтвержден. Теперь вы можете войти в систему.
							{/if}
						</p>
						<button
							type="button"
							onclick={isAuthenticated() ? goToDashboard : goToLogin}
							class="w-full transform overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 text-lg font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-4 focus:ring-green-500/20 active:scale-[0.98]"
						>
							<div class="flex items-center justify-center space-x-2">
								<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M13 7l5 5m0 0l-5 5m5-5H6"
									/>
								</svg>
								<span>
									{#if isAuthenticated()}
										Перейти в панель управления
									{:else}
										Перейти к входу
									{/if}
								</span>
							</div>
						</button>
					</div>
				{:else if verificationStatus === 'error'}
					<!-- Error state -->
					<div class="text-center">
						<div
							class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30"
						>
							<svg
								class="h-10 w-10 text-red-600 dark:text-red-400"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</div>
						<h3 class="mb-3 text-2xl font-bold text-gray-900 dark:text-white">
							Ошибка подтверждения
						</h3>
						<p class="mb-6 text-gray-600 dark:text-gray-400">
							{error ||
								'Не удалось подтвердить ваш email адрес. Возможно, ссылка устарела или недействительна.'}
						</p>

						<!-- Action buttons -->
						<div class="space-y-3">
							<button
								type="button"
								onclick={handleResendVerification}
								disabled={loading || resendCooldown > 0}
								class="w-full transform overflow-hidden rounded-2xl bg-gradient-to-r from-orange-600 via-rose-600 to-pink-600 px-6 py-4 text-lg font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:from-orange-700 hover:via-rose-700 hover:to-pink-700 focus:outline-none focus:ring-4 focus:ring-orange-500/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
							>
								<div class="flex items-center justify-center space-x-2">
									{#if loading}
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
										<span>Отправляем...</span>
									{:else if resendCooldown > 0}
										<span>Повторить через {resendCooldown}с</span>
									{:else}
										<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
											/>
										</svg>
										<span>Отправить новое письмо</span>
									{/if}
								</div>
							</button>

							<button
								type="button"
								onclick={goToLogin}
								class="w-full rounded-2xl border-2 border-gray-200/50 bg-gray-50/50 px-6 py-4 font-semibold text-gray-700 backdrop-blur-sm transition-all duration-300 hover:border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-gray-500/20 dark:border-gray-700/50 dark:bg-gray-800/50 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-700/50"
							>
								Вернуться к входу
							</button>
						</div>
					</div>
				{/if}

				<!-- Additional help text -->
				<div class="border-t border-gray-200/50 pt-6 text-center dark:border-gray-700/50">
					<p class="text-xs text-gray-500 dark:text-gray-400">
						Если у вас возникли проблемы с подтверждением email,
						<a
							href="mailto:support@bonus5.ru"
							class="font-semibold text-orange-600 transition-colors hover:text-orange-500 dark:text-orange-400 dark:hover:text-orange-300"
						>
							свяжитесь с поддержкой
						</a>
					</p>
				</div>
			</div>
		</div>
	</div>
</div>
