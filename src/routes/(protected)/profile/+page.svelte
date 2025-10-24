<!--
  User Profile Page for B5-Admin
  
  Displays user profile information with protected route access.
  Requires authentication and email verification.
-->

<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import {
		authState,
		logout,
		getCurrentUserData,
		isAuthenticated,
		isEmailVerified,
		isLoading,
		checkAuth
	} from '$lib/state/auth.svelte.js';
	import { getUserData } from '$lib/api/config.js';
	import { addSuccessToast, addErrorToast } from '$lib/utils/toastStore.js';
	import { formatPhone } from '$lib/utils/formatters.js';
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import ConfirmationModal from '$lib/components/ConfirmationModal.svelte';

	// Component state
	let showSuccessMessage = $state(false);
	let successMessage = $state('');

	let isLogoutLoading = $state(false);
	let isCheckingAuth = $state(false);
	let isRedirecting = $state(false);
	let redirectMessage = $state('');
	let authError = $state(null);
	let isCopyingKey = $state(false);
	let showLogoutModal = $state(false);

	// Get user data for display with localStorage fallback
	function getUserDisplayData() {
		// First try to get from auth state
		const user = getCurrentUserData();
		if (user) {
			return user;
		}

		// If auth state not ready, fallback to localStorage
		if (!authState.initialized) {
			const storedUser = getUserData();
			if (storedUser) {
				console.log('profile - Using stored user data as fallback:', storedUser);
				return storedUser;
			}
		}

		return null;
	}

	// Check URL parameters for notifications
	function checkUrlParams() {
		const urlParams = new URLSearchParams($page.url.search);
		const message = urlParams.get('message');

		if (message === 'email_verified') {
			showSuccessMessage = true;
			successMessage =
				'Email успешно подтвержден! Теперь вы можете пользоваться всеми функциями сервиса.';
			setTimeout(() => {
				showSuccessMessage = false;
				clearUrlParams();
			}, 5000);
		} else if (message === 'email_already_verified') {
			showSuccessMessage = true;
			successMessage = 'Email уже был подтвержден ранее.';
			setTimeout(() => {
				showSuccessMessage = false;
				clearUrlParams();
			}, 3000);
		}
	}

	// Clear URL parameters without page reload
	function clearUrlParams() {
		const url = new URL(window.location);
		url.searchParams.delete('message');
		window.history.replaceState({}, '', url);
	}

	// Mask secret key showing only last 4 characters
	function maskSecretKey(key) {
		if (!key || key.length <= 4) {
			return key || 'Не указано';
		}
		const visiblePart = key.slice(-4);
		const maskedPart = '*'.repeat(key.length - 4);
		return maskedPart + visiblePart;
	}

	// Copy secret key to clipboard with enhanced error handling
	async function copyKey() {
		const user = getUserDisplayData();
		if (!user?.key) {
			addErrorToast('Секретный ключ не найден');
			return;
		}

		isCopyingKey = true;

		try {
			// Check if clipboard API is available
			if (!navigator.clipboard) {
				throw new Error('Clipboard API not supported');
			}

			await navigator.clipboard.writeText(user.key);
			addSuccessToast('Секретный ключ скопирован');
		} catch (error) {
			console.error('Failed to copy key:', error);

			// Fallback: try to use legacy method
			try {
				const textArea = document.createElement('textarea');
				textArea.value = user.key;
				textArea.style.position = 'fixed';
				textArea.style.left = '-999999px';
				textArea.style.top = '-999999px';
				document.body.appendChild(textArea);
				textArea.focus();
				textArea.select();
				const successful = document.execCommand('copy');
				document.body.removeChild(textArea);

				if (successful) {
					addSuccessToast('Секретный ключ скопирован в буфер обмена (резервный метод)');
				} else {
					throw new Error('Legacy copy method failed');
				}
			} catch (fallbackError) {
				console.error('Fallback copy method also failed:', fallbackError);
				addErrorToast('Не удалось скопировать ключ в буфер обмена');
			}
		} finally {
			isCopyingKey = false;
		}
	}

	// Handle logout button click - show modal
	function handleLogoutClick() {
		showLogoutModal = true;
	}

	// Handle logout confirmation with enhanced loading states
	async function handleLogoutConfirm() {
		isLogoutLoading = true;
		authError = null;
		showLogoutModal = false;

		try {
			const success = await logout();
			if (success) {
				addSuccessToast('Вы успешно вышли из системы');
				isRedirecting = true;
				redirectMessage = 'Перенаправление на главную страницу...';

				// Use window.location to force full page reload and clear cookies
				setTimeout(() => {
					window.location.href = '/';
				}, 1000);
			} else {
				authError = 'Произошла ошибка при выходе из системы';
				addErrorToast(authError);
			}
		} catch (error) {
			console.error('Logout error:', error);
			authError = 'Произошла ошибка при выходе из системы';
			addErrorToast(authError);

			// Force redirect even on error after showing message
			isRedirecting = true;
			redirectMessage = 'Перенаправление на главную страницу...';
			setTimeout(() => {
				window.location.href = '/';
			}, 2000);
		} finally {
			isLogoutLoading = false;
		}
	}

	// Handle logout cancellation
	function handleLogoutCancel() {
		showLogoutModal = false;
	}

	// Check authentication status with loading indicator
	async function checkAuthenticationStatus() {
		isCheckingAuth = true;
		authError = null;

		try {
			const isAuth = await checkAuth();
			if (!isAuth) {
				isRedirecting = true;
				redirectMessage = 'Перенаправление на страницу входа...';

				setTimeout(() => {
					const currentUrl = $page.url.pathname + $page.url.search;
					goto(`/login?redirectTo=${encodeURIComponent(currentUrl)}`);
				}, 1500);
			}
		} catch (error) {
			console.error('Auth check error:', error);
			authError = 'Ошибка проверки авторизации';
			addErrorToast(authError);
		} finally {
			isCheckingAuth = false;
		}
	}

	// Initialize component
	onMount(() => {
		checkUrlParams();

		// Check authentication status on mount if needed
		if (!authState.initialized) {
			checkAuthenticationStatus();
		}
	});
</script>

<ProtectedRoute requireEmailVerification={false}>
	<div class="min-h-screen bg-gray-950 px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
		<div class="mx-auto max-w-4xl">
			<!-- Loading States -->
			{#if isCheckingAuth}
				<div class="flex min-h-[50vh] items-center justify-center">
					<div class="text-center">
						<LoadingSpinner size="lg" color="white" />
						<p class="mt-4 text-lg text-gray-300">Проверка авторизации...</p>
					</div>
				</div>
			{:else if isRedirecting}
				<div class="flex min-h-[50vh] items-center justify-center">
					<div class="text-center">
						<LoadingSpinner size="lg" color="white" />
						<p class="mt-4 text-lg text-gray-300">{redirectMessage}</p>
					</div>
				</div>
			{:else if isLoading() && !getUserDisplayData()}
				<div class="flex min-h-[50vh] items-center justify-center">
					<div class="text-center">
						<LoadingSpinner size="lg" color="white" />
						<p class="mt-4 text-lg text-gray-300">Загрузка данных пользователя...</p>
					</div>
				</div>
			{:else}
				<!-- Error Messages -->
				{#if authError}
					<div
						class="mb-8 rounded-xl border border-red-500/30 bg-red-500/20 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-red-500/40 hover:bg-red-500/25"
					>
						<div class="flex items-start gap-4">
							<div class="flex-shrink-0">
								<svg class="h-6 w-6 text-red-400" viewBox="0 0 20 20" fill="currentColor">
									<path
										fill-rule="evenodd"
										d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
										clip-rule="evenodd"
									/>
								</svg>
							</div>
							<div class="flex-1">
								<h3 class="mb-1 text-sm font-semibold text-red-400">Ошибка</h3>
								<p class="text-sm leading-relaxed text-red-300">{authError}</p>
							</div>
						</div>
					</div>
				{/if}
				<!-- Page Title -->
				<!-- <div class="mx-auto mb-16 text-center">
					<h1 class="mb-2 text-4xl font-light tracking-[0.2em] text-white sm:text-6xl lg:text-7xl">
						Профиль куратора
					</h1>
				</div> -->

				<!-- Success Notifications -->
				{#if showSuccessMessage}
					<div
						class="animate-in fade-in slide-in-from-top-4 fixed left-1/2 top-6 z-50 -translate-x-1/2 transform duration-300"
					>
						<div
							class="rounded-xl border border-green-500/30 bg-green-500/20 p-4 shadow-2xl shadow-green-500/10 backdrop-blur-md"
						>
							<div class="flex items-center gap-3">
								<div class="flex-shrink-0">
									<svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
										<path
											fill-rule="evenodd"
											d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
											clip-rule="evenodd"
										/>
									</svg>
								</div>
								<p class="text-sm font-medium leading-relaxed text-green-300">{successMessage}</p>
							</div>
						</div>
					</div>
				{/if}

				<h2 class="mb-6 text-2xl font-semibold tracking-wide text-white">Ваш профиль</h2>

				{#if isLoading() && !getUserDisplayData()}
					<div class="flex items-center justify-center py-12">
						<div class="text-center">
							<LoadingSpinner size="lg" color="white" />
							<p class="mt-4 text-gray-400">Загрузка информации о пользователе...</p>
						</div>
					</div>
				{:else if getUserDisplayData()}
					{@const user = getUserDisplayData()}
					<div class="grid gap-6 sm:grid-cols-2 lg:gap-8">
						<!-- Name -->
						<div class="group">
							<div class="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-300">
								Имя
							</div>
							<div
								class="rounded-lg border border-gray-700/50 bg-gray-800/50 px-4 py-3 transition-all duration-200 group-hover:border-gray-600/50 group-hover:bg-gray-800/70"
							>
								<p class="text-lg font-medium text-white">{user.name || 'Не указано'}</p>
							</div>
						</div>

						<!-- Email -->
						<div class="group">
							<div class="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-300">
								Email
							</div>
							<div
								class="rounded-lg border border-gray-700/50 bg-gray-800/50 px-4 py-3 transition-all duration-200 group-hover:border-gray-600/50 group-hover:bg-gray-800/70"
							>
								<div class="flex items-center gap-3">
									<p class="flex-1 text-lg font-medium text-white">
										{user.email || 'Не указано'}
									</p>
									{#if user.email_verified}
										<span
											class="inline-flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/20 px-3 py-1 text-xs font-semibold text-green-400 transition-all duration-200 hover:bg-green-500/30"
										>
											<svg class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
												<path
													fill-rule="evenodd"
													d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
													clip-rule="evenodd"
												/>
											</svg>
											Подтвержден
										</span>
									{:else}
										<span
											class="inline-flex items-center gap-1 rounded-full border border-yellow-500/30 bg-yellow-500/20 px-3 py-1 text-xs font-semibold text-yellow-400 transition-all duration-200 hover:bg-yellow-500/30"
										>
											<svg class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
												<path
													fill-rule="evenodd"
													d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
													clip-rule="evenodd"
												/>
											</svg>
											Не подтвержден
										</span>
									{/if}
								</div>
							</div>
						</div>

						<!-- Region -->
						<div class="group">
							<div class="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-300">
								Регион
							</div>
							<div
								class="rounded-lg border border-gray-700/50 bg-gray-800/50 px-4 py-3 transition-all duration-200 group-hover:border-gray-600/50 group-hover:bg-gray-800/70"
							>
								<p class="text-lg font-medium text-white">{user.region || 'Не указано'}</p>
							</div>
						</div>

						<!-- Phone -->
						<div class="group">
							<div class="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-300">
								Телефон
							</div>
							<div
								class="rounded-lg border border-gray-700/50 bg-gray-800/50 px-4 py-3 transition-all duration-200 group-hover:border-gray-600/50 group-hover:bg-gray-800/70"
							>
								<p class="text-lg font-medium text-white">{formatPhone(user.phone)}</p>
							</div>
						</div>

						<!-- User Status -->
						<div class="group">
							<div class="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-300">
								Статус пользователя
							</div>
							<div
								class="rounded-lg border border-gray-700/50 bg-gray-800/50 px-4 py-3 transition-all duration-200 group-hover:border-gray-600/50 group-hover:bg-gray-800/70"
							>
								{#if user.userStatus}
									<span
										class="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium"
										style="background-color: {user.userStatus.color}20; color: {user.userStatus
											.color}"
									>
										{#if user.userStatus.icon}
											<span class="mr-1.5">{user.userStatus.icon}</span>
										{/if}
										{user.userStatus.value}
									</span>
								{:else}
									<p class="text-lg font-medium text-gray-400">Не указан</p>
								{/if}
							</div>
						</div>

						<!-- Registration Date -->
						<div class="group">
							<div class="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-300">
								Дата регистрации
							</div>
							<div
								class="rounded-lg border border-gray-700/50 bg-gray-800/50 px-4 py-3 transition-all duration-200 group-hover:border-gray-600/50 group-hover:bg-gray-800/70"
							>
								<p class="text-lg font-medium text-white">
									{#if user.created_at}
										{new Date(user.created_at).toLocaleDateString('ru-RU', {
											year: 'numeric',
											month: 'long',
											day: 'numeric',
											hour: '2-digit',
											minute: '2-digit'
										})}
									{:else}
										Не указана
									{/if}
								</p>
							</div>
						</div>

						<!-- Secret Key -->
						<div class="group">
							<div class="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-300">
								Секретный ключ
							</div>
							<button
								onclick={copyKey}
								disabled={isCopyingKey}
								class="group/key w-full rounded-lg border border-gray-700/50 bg-gray-800/50 px-4 py-3 transition-all duration-200 hover:border-indigo-500/50 hover:bg-gray-800/70 hover:shadow-lg hover:shadow-indigo-500/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 focus:ring-offset-gray-900 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
								title="Нажмите для копирования в буфер обмена"
							>
								<div class="flex items-center justify-between">
									<span
										class="truncate pr-2 font-mono text-lg font-medium tracking-widest text-white"
										>{maskSecretKey(user.key)}</span
									>
									{#if isCopyingKey}
										<LoadingSpinner size="sm" color="white" inline={true} />
									{:else}
										<svg
											class="h-5 w-5 text-gray-400 transition-all duration-200 group-hover/key:scale-110 group-hover/key:text-indigo-400"
											viewBox="0 0 20 20"
											fill="currentColor"
										>
											<path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
											<path
												d="M3 5a2 2 0 012-2 3 3 0 003 3h6a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2V5h-2v6z"
											/>
										</svg>
									{/if}
								</div>
							</button>
							<p
								class="mt-2 text-xs text-gray-500 transition-colors duration-200 group-hover:text-gray-400"
							>
								{isCopyingKey ? 'Копирование...' : 'Кликните для копирования ключа'}
							</p>
						</div>

						<!-- Logout Button -->
						<div class="group">
							<div class="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-300">
								Действия
							</div>
							<button
								onclick={handleLogoutClick}
								disabled={isLogoutLoading || isRedirecting}
								class="group/logout flex h-[52px] w-full items-center justify-center gap-3 rounded-lg border border-red-500 bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:border-red-400 hover:bg-red-500 hover:shadow-xl hover:shadow-red-500/20 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 focus:ring-offset-gray-900 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
							>
								{#if isLogoutLoading}
									<LoadingSpinner size="sm" color="white" inline={true} />
									<span>Выход...</span>
								{:else if isRedirecting}
									<LoadingSpinner size="sm" color="white" inline={true} />
									<span>Перенаправление...</span>
								{:else}
									<svg
										class="h-5 w-5 transition-transform duration-200 group-hover/logout:scale-110"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											fill-rule="evenodd"
											d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z"
											clip-rule="evenodd"
										/>
										<path
											fill-rule="evenodd"
											d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-.943a.75.75 0 10-1.004-1.114l-2.5 2.25a.75.75 0 000 1.114l2.5 2.25a.75.75 0 101.004-1.114L8.704 10.75H18.25A.75.75 0 0019 10z"
											clip-rule="evenodd"
										/>
									</svg>
									<span>Выйти из аккаунта</span>
								{/if}
							</button>
							<p class="mt-2 text-xs text-gray-500 transition-colors duration-200 group-hover:text-gray-400">
								Завершение текущей сессии
							</p>
						</div>

						<!-- User ID -->
						<!-- <div class="group">
								<div class="mb-2 block text-sm font-medium uppercase tracking-wide text-gray-300">
									ID пользователя
								</div>
								<div
									class="rounded-lg border border-gray-700/50 bg-gray-800/50 px-4 py-3 transition-all duration-200 group-hover:border-gray-600/50 group-hover:bg-gray-800/70"
								>
									<p class="text-lg font-medium text-white">{user.id || 'Не указано'}</p>
								</div>
							</div> -->

						<!-- Ban Status -->
						{#if user.is_banned}
							<div class="sm:col-span-2">
								<div
									class="rounded-lg border border-red-500/30 bg-red-500/20 p-6 backdrop-blur-sm transition-all duration-200 hover:border-red-500/40 hover:bg-red-500/25"
								>
									<div class="flex items-center">
										<div class="flex-shrink-0">
											<svg class="h-6 w-6 text-red-400" viewBox="0 0 20 20" fill="currentColor">
												<path
													fill-rule="evenodd"
													d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
													clip-rule="evenodd"
												/>
											</svg>
										</div>
										<div class="ml-4">
											<h3 class="mb-1 text-sm font-semibold text-red-400">Аккаунт заблокирован</h3>
											{#if user.ban_reason}
												<p class="text-sm text-red-300">Причина: {user.ban_reason}</p>
											{/if}
										</div>
									</div>
								</div>
							</div>
						{/if}
					</div>
				{:else}
					<div class="flex items-center justify-center py-12">
						<div class="text-center">
							<svg class="mx-auto h-12 w-12 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
								<path
									fill-rule="evenodd"
									d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
									clip-rule="evenodd"
								/>
							</svg>
							<p class="mt-4 text-gray-400">Не удалось загрузить информацию о пользователе</p>
							<button
								onclick={checkAuthenticationStatus}
								disabled={isCheckingAuth}
								class="mt-4 flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
							>
								{#if isCheckingAuth}
									<LoadingSpinner size="sm" color="white" inline={true} />
									<span>Проверка...</span>
								{:else}
									<span>Повторить попытку</span>
								{/if}
							</button>
						</div>
					</div>
				{/if}

				<!-- Email Verification Warning -->
				{#if isAuthenticated() && !isEmailVerified()}
					<div
						class="mb-8 rounded-xl border border-yellow-500/30 bg-yellow-500/20 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-yellow-500/40 hover:bg-yellow-500/25 hover:shadow-xl"
					>
						<div class="flex items-start">
							<div class="flex-shrink-0">
								<svg class="h-6 w-6 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
									<path
										fill-rule="evenodd"
										d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
										clip-rule="evenodd"
									/>
								</svg>
							</div>
							<div class="ml-4 flex-1">
								<h3 class="mb-2 text-sm font-semibold text-yellow-400">
									Требуется подтверждение email
								</h3>
								<p class="mb-4 text-sm leading-relaxed text-yellow-300">
									Для получения полного доступа к функциям системы необходимо подтвердить ваш email
									адрес.
								</p>
								<button
									onclick={() => goto('/email-verify')}
									class="inline-flex items-center gap-2 rounded-lg bg-yellow-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-yellow-500 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:ring-offset-2 focus:ring-offset-gray-900 active:scale-[0.98]"
								>
									<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
										<path
											d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z"
										/>
										<path
											d="m19 8.839-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z"
										/>
									</svg>
									Подтвердить email
								</button>
							</div>
						</div>
					</div>
				{/if}

				<!-- Project Statistics Card -->
				<!-- <div
					class="my-8 rounded-xl border border-white/10 bg-white/5 p-8 shadow-xl backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/10 hover:shadow-2xl"
				>
					<div class="mb-6 flex items-center gap-3">
						<svg class="h-6 w-6 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
							<path
								fill-rule="evenodd"
								d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z"
								clip-rule="evenodd"
							/>
						</svg>
						<h2 class="text-2xl font-semibold tracking-wide text-white">Статистика проектов</h2>
					</div>
					<div class="rounded-lg border border-gray-700/50 bg-gray-800/30 p-6 text-center">
						<div class="flex flex-col items-center gap-4">
							<svg class="h-12 w-12 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
								<path
									fill-rule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
									clip-rule="evenodd"
								/>
							</svg>
							<div>
								<p class="mb-1 text-lg font-medium text-gray-400">
									Статистика будет доступна позже
								</p>
								<p class="text-sm text-gray-500">
									Здесь будет отображаться информация о ваших проектах
								</p>
							</div>
						</div>
					</div>
				</div> -->

				<!-- Security Notice -->
				<div class="mt-12">
					<div
						class="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-700/50 bg-gray-800/30 px-6 py-4 backdrop-blur-sm"
					>
						<svg class="h-5 w-5 flex-shrink-0 text-green-400" viewBox="0 0 20 20" fill="currentColor">
							<path
								fill-rule="evenodd"
								d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
								clip-rule="evenodd"
							/>
						</svg>
						<div class="text-center sm:text-left">
							<p class="text-sm font-medium text-gray-300">Защищенный проект</p>
							<p class="text-xs text-gray-500">
								Все сессии защищены API токенами • Данные передаются по HTTPS
							</p>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
</ProtectedRoute>

<!-- Logout confirmation modal -->
<ConfirmationModal
	isOpen={showLogoutModal}
	title="Подтверждение выхода"
	message="Вы уверены, что хотите выйти из системы?"
	confirmText="Выйти"
	cancelText="Отмена"
	onConfirm={handleLogoutConfirm}
	onCancel={handleLogoutCancel}
	isDestructive={true}
/>
