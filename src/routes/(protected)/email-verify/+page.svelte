<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { 
		authState, 
		isAuthenticated, 
		resendEmailVerificationNotification, 
		verifyEmailAddress,
		clearError 
	} from '$lib/state/auth.svelte.js';
	import { addSuccessToast, addErrorToast } from '$lib/utils/toastStore.js';
	import LoadingOverlay from '$lib/components/LoadingOverlay.svelte';

	/**
	 * Email Verification Page
	 * 
	 * Handles email verification for B5-Admin users.
	 * Supports both verification link processing and manual resend functionality.
	 * Redirects unauthenticated users to login page.
	 */

	// Component state
	let verificationStatus = 'pending'; // 'pending', 'verifying', 'success', 'error'
	let resendCooldown = 0;
	let resendTimer = null;

	// Reactive state
	$: user = authState.user;
	$: loading = authState.emailVerificationLoading;
	$: error = authState.emailVerificationError;

	/**
	 * Initialize component and handle verification
	 */
	onMount(async () => {
		// Clear any previous errors
		clearError();

		// Check if user is authenticated
		if (!isAuthenticated()) {
			// Redirect to login with return URL
			const returnUrl = encodeURIComponent($page.url.pathname + $page.url.search);
			goto(`/login?redirectTo=${returnUrl}`);
			return;
		}

		// Check if email is already verified
		if (user?.email_verified) {
			verificationStatus = 'success';
			addSuccessToast('Ваш email уже подтвержден');
			// Redirect to dashboard after a short delay
			setTimeout(() => {
				goto('/dashboard');
			}, 2000);
			return;
		}

		// Check if this is a verification link (has id, hash, signature parameters)
		const urlParams = $page.url.searchParams;
		const id = urlParams.get('id');
		const hash = urlParams.get('hash');
		const signature = urlParams.get('signature');

		if (id && hash && signature) {
			// This is a verification link, process it
			await handleVerificationLink(id, hash, signature);
		} else {
			// This is a manual visit to the verification page
			verificationStatus = 'pending';
		}
	});

	/**
	 * Handle verification link processing
	 */
	async function handleVerificationLink(id, hash, signature) {
		verificationStatus = 'verifying';

		try {
			const success = await verifyEmailAddress(id, hash, signature);

			if (success) {
				verificationStatus = 'success';
				addSuccessToast('Email успешно подтвержден!');
				
				// Redirect to dashboard after success
				setTimeout(() => {
					goto('/dashboard');
				}, 2000);
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
		resendCooldown = 60; // 60 seconds cooldown
		
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
	<title>Подтверждение Email - B5 Admin</title>
	<meta name="description" content="Подтверждение email адреса для доступа к административной панели B5" />
</svelte:head>

<!-- Loading overlay -->
<LoadingOverlay 
	show={loading && verificationStatus === 'verifying'} 
	message="Подтверждение email адреса..." 
/>

<div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
	<div class="sm:mx-auto sm:w-full sm:max-w-md">
		<!-- Logo -->
		<div class="flex justify-center">
			<div class="flex items-center space-x-2">
				<div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
					<span class="text-white font-bold text-sm">B5</span>
				</div>
				<span class="text-xl font-semibold text-gray-900">Admin</span>
			</div>
		</div>

		<!-- Title -->
		<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
			Подтверждение Email
		</h2>
		
		<!-- Subtitle based on status -->
		{#if verificationStatus === 'pending'}
			<p class="mt-2 text-center text-sm text-gray-600">
				Для завершения регистрации необходимо подтвердить ваш email адрес
			</p>
		{:else if verificationStatus === 'verifying'}
			<p class="mt-2 text-center text-sm text-gray-600">
				Обрабатываем ваш запрос на подтверждение...
			</p>
		{:else if verificationStatus === 'success'}
			<p class="mt-2 text-center text-sm text-green-600">
				Ваш email адрес успешно подтвержден!
			</p>
		{:else if verificationStatus === 'error'}
			<p class="mt-2 text-center text-sm text-red-600">
				Произошла ошибка при подтверждении email
			</p>
		{/if}
	</div>

	<div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
		<div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
			
			{#if verificationStatus === 'pending'}
				<!-- Pending verification state -->
				<div class="text-center">
					<!-- Email icon -->
					<div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
						<svg class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
						</svg>
					</div>

					<h3 class="text-lg font-medium text-gray-900 mb-2">
						Проверьте вашу почту
					</h3>
					
					<p class="text-sm text-gray-600 mb-6">
						Мы отправили письмо с подтверждением на адрес:
						<br>
						<strong class="text-gray-900">{user?.email || 'ваш email'}</strong>
					</p>

					<p class="text-xs text-gray-500 mb-6">
						Перейдите по ссылке в письме для подтверждения вашего email адреса.
						Если письмо не пришло, проверьте папку "Спам".
					</p>

					<!-- Resend button -->
					<button
						type="button"
						onclick={handleResendVerification}
						disabled={loading || resendCooldown > 0}
						class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
					>
						{#if loading}
							<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							Отправляем...
						{:else if resendCooldown > 0}
							Повторить через {resendCooldown}с
						{:else}
							Отправить письмо повторно
						{/if}
					</button>

					<!-- Back to dashboard button -->
					<button
						type="button"
						onclick={goToDashboard}
						class="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
					>
						Вернуться в панель управления
					</button>
				</div>

			{:else if verificationStatus === 'verifying'}
				<!-- Verifying state -->
				<div class="text-center">
					<div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
						<svg class="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
					</div>
					<h3 class="text-lg font-medium text-gray-900 mb-2">
						Подтверждаем ваш email...
					</h3>
					<p class="text-sm text-gray-600">
						Пожалуйста, подождите
					</p>
				</div>

			{:else if verificationStatus === 'success'}
				<!-- Success state -->
				<div class="text-center">
					<div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
						<svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
					</div>
					<h3 class="text-lg font-medium text-gray-900 mb-2">
						Email подтвержден!
					</h3>
					<p class="text-sm text-gray-600 mb-6">
						Ваш email адрес успешно подтвержден. Теперь у вас есть полный доступ к административной панели.
					</p>
					<button
						type="button"
						onclick={goToDashboard}
						class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
					>
						Перейти в панель управления
					</button>
				</div>

			{:else if verificationStatus === 'error'}
				<!-- Error state -->
				<div class="text-center">
					<div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
						<svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</div>
					<h3 class="text-lg font-medium text-gray-900 mb-2">
						Ошибка подтверждения
					</h3>
					<p class="text-sm text-gray-600 mb-6">
						{error || 'Не удалось подтвердить ваш email адрес. Возможно, ссылка устарела или недействительна.'}
					</p>
					
					<!-- Action buttons -->
					<div class="space-y-3">
						<button
							type="button"
							onclick={handleResendVerification}
							disabled={loading || resendCooldown > 0}
							class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{#if loading}
								<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								Отправляем...
							{:else if resendCooldown > 0}
								Повторить через {resendCooldown}с
							{:else}
								Отправить новое письмо
							{/if}
						</button>
						
						<button
							type="button"
							onclick={goToLogin}
							class="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
						>
							Вернуться к входу
						</button>
					</div>
				</div>
			{/if}

		</div>

		<!-- Additional help text -->
		<div class="mt-6 text-center">
			<p class="text-xs text-gray-500">
				Если у вас возникли проблемы с подтверждением email, 
				<a href="mailto:support@bonus5.ru" class="text-blue-600 hover:text-blue-500">
					свяжитесь с поддержкой
				</a>
			</p>
		</div>
	</div>
</div>