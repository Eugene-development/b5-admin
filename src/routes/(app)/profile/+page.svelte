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
		isEmailVerified
	} from '$lib/state/auth.svelte.js';
	import { addSuccessToast, addErrorToast } from '$lib/utils/toastStore.js';
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte';

	// Component state
	let showSuccessMessage = $state(false);
	let successMessage = $state('');
	let showCopyMessage = $state(false);
	let copyMessage = $state('');
	let isLoading = $state(false);

	// Get user data for display
	function getUserDisplayData() {
		return getCurrentUserData();
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

	// Copy secret key to clipboard
	async function copyKey() {
		const user = getUserDisplayData();
		if (!user?.key) {
			showCopyMessage = true;
			copyMessage = 'Ошибка: секретный ключ не найден';
			setTimeout(() => {
				showCopyMessage = false;
			}, 3000);
			return;
		}

		try {
			// Check if clipboard API is available
			if (!navigator.clipboard) {
				throw new Error('Clipboard API not supported');
			}

			await navigator.clipboard.writeText(user.key);
			showCopyMessage = true;
			copyMessage = 'Ключ скопирован в буфер обмена!';
			setTimeout(() => {
				showCopyMessage = false;
			}, 3000);
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
					showCopyMessage = true;
					copyMessage = 'Ключ скопирован в буфер обмена!';
				} else {
					throw new Error('Legacy copy method failed');
				}
			} catch (fallbackError) {
				console.error('Fallback copy method also failed:', fallbackError);
				showCopyMessage = true;
				copyMessage = 'Ошибка копирования ключа';
			}

			setTimeout(() => {
				showCopyMessage = false;
			}, 3000);
		}
	}

	// Handle logout
	async function handleLogout() {
		isLoading = true;
		try {
			const success = await logout();
			if (success) {
				addSuccessToast('Вы успешно вышли из системы');
				goto('/');
			} else {
				addErrorToast('Произошла ошибка при выходе из системы');
			}
		} catch (error) {
			console.error('Logout error:', error);
			addErrorToast('Произошла ошибка при выходе из системы');
			goto('/'); // Force redirect even on error
		} finally {
			isLoading = false;
		}
	}

	// Initialize component
	onMount(() => {
		checkUrlParams();
	});
</script>

<ProtectedRoute requireEmailVerification={false}>
	<div class="min-h-screen bg-gray-900 px-6 py-12 sm:py-12 lg:px-8">
		<div class="mx-auto max-w-2xl">
			<!-- Page Title -->
			<div class="mx-auto mb-16 text-center">
				<h1 class="text-4xl font-normal tracking-widest text-white sm:text-6xl">Профиль</h1>
			</div>

			<!-- Success Notifications -->
			{#if showSuccessMessage}
				<div class="fixed left-1/2 top-4 z-50 -translate-x-1/2 transform">
					<div class="rounded-lg bg-green-500/10 p-4 backdrop-blur-sm">
						<div class="flex items-center">
							<svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
								<path
									fill-rule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
									clip-rule="evenodd"
								/>
							</svg>
							<p class="ml-3 text-sm font-medium text-green-400">{successMessage}</p>
						</div>
					</div>
				</div>
			{/if}

			<!-- Copy Notifications -->
			{#if showCopyMessage}
				<div
					class="animate-in fade-in slide-in-from-top-2 fixed left-1/2 top-4 z-50 -translate-x-1/2 transform duration-300"
				>
					<div
						class="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4 shadow-lg backdrop-blur-sm"
					>
						<div class="flex items-center">
							{#if copyMessage.includes('Ошибка')}
								<svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
									<path
										fill-rule="evenodd"
										d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
										clip-rule="evenodd"
									/>
								</svg>
								<p class="ml-3 text-sm font-medium text-red-400">{copyMessage}</p>
							{:else}
								<svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
									<path
										fill-rule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
										clip-rule="evenodd"
									/>
								</svg>
								<p class="ml-3 text-sm font-medium text-green-400">{copyMessage}</p>
							{/if}
						</div>
					</div>
				</div>
			{/if}

			<!-- User Information Card -->
			<div class="mb-8 rounded-lg bg-white/5 p-8 backdrop-blur-sm">
				<h2 class="mb-6 text-2xl font-semibold tracking-wide text-white">
					Информация о пользователе
				</h2>

				{#if getUserDisplayData()}
					{@const user = getUserDisplayData()}
					<div class="grid gap-6 sm:grid-cols-2">
						<!-- Name -->
						<div>
							<label class="block text-sm font-medium text-gray-300">Имя</label>
							<p class="mt-1 text-lg text-white">{user.name || 'Не указано'}</p>
						</div>

						<!-- Email -->
						<div>
							<label class="block text-sm font-medium text-gray-300">Email</label>
							<div class="mt-1 flex items-center gap-2">
								<p class="text-lg text-white">{user.email || 'Не указано'}</p>
								{#if user.email_verified}
									<span
										class="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-400"
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
										class="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2 py-1 text-xs font-medium text-yellow-400"
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

						<!-- City -->
						<div>
							<label class="block text-sm font-medium text-gray-300">Город</label>
							<p class="mt-1 text-lg text-white">{user.city || 'Не указано'}</p>
						</div>

						<!-- Secret Key -->
						<div>
							<label class="block text-sm font-medium text-gray-300">Секретный ключ</label>
							<button
								onclick={copyKey}
								class="group mt-1 flex w-full cursor-pointer items-center justify-between rounded bg-gray-800 px-3 py-2 text-lg text-white transition-all duration-200 hover:bg-gray-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900"
								title="Нажмите для копирования в буфер обмена"
							>
								<span class="font-mono">{user.key || 'Не указано'}</span>
								<svg
									class="h-5 w-5 text-gray-400 transition-colors group-hover:text-white"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
									<path
										d="M3 5a2 2 0 012-2 3 3 0 003 3h6a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2V5h-2v6z"
									/>
								</svg>
							</button>
							<p class="mt-1 text-xs text-gray-500">Кликните для копирования ключа</p>
						</div>

						<!-- User ID -->
						<div>
							<label class="block text-sm font-medium text-gray-300">ID пользователя</label>
							<p class="mt-1 text-lg text-white">{user.id || 'Не указано'}</p>
						</div>

						<!-- Ban Status -->
						{#if user.is_banned}
							<div class="sm:col-span-2">
								<div class="rounded-lg bg-red-500/10 p-4">
									<div class="flex items-center">
										<svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
											<path
												fill-rule="evenodd"
												d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
												clip-rule="evenodd"
											/>
										</svg>
										<p class="ml-3 text-sm font-medium text-red-400">
											Аккаунт заблокирован
											{#if user.ban_reason}
												: {user.ban_reason}
											{/if}
										</p>
									</div>
								</div>
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Email Verification Warning -->
			{#if isAuthenticated() && !isEmailVerified()}
				<div class="mb-8 rounded-lg bg-yellow-500/10 p-6 backdrop-blur-sm">
					<div class="flex items-start">
						<svg class="h-6 w-6 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
							<path
								fill-rule="evenodd"
								d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
								clip-rule="evenodd"
							/>
						</svg>
						<div class="ml-3">
							<h3 class="text-sm font-medium text-yellow-400">Требуется подтверждение email</h3>
							<p class="mt-1 text-sm text-yellow-300">
								Для получения полного доступа к функциям системы необходимо подтвердить ваш email
								адрес.
							</p>
							<div class="mt-4">
								<button
									onclick={() => goto('/email-verify')}
									class="rounded-md bg-yellow-600 px-3 py-2 text-sm font-semibold text-white hover:bg-yellow-500"
								>
									Подтвердить email
								</button>
							</div>
						</div>
					</div>
				</div>
			{/if}

			<!-- Project Statistics Card -->
			<div class="mb-8 rounded-lg bg-white/5 p-8 backdrop-blur-sm">
				<h2 class="mb-6 text-2xl font-semibold tracking-wide text-white">Статистика проектов</h2>
				<p class="text-gray-400">Статистика будет доступна позже</p>
			</div>

			<!-- Action Buttons -->
			<div class="flex flex-col justify-center gap-4 sm:flex-row">
				<button
					onclick={handleLogout}
					disabled={isLoading}
					class="rounded-md bg-red-600 px-6 py-3 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
				>
					{isLoading ? 'Выход...' : 'Выйти из аккаунта'}
				</button>
			</div>

			<!-- Security Notice -->
			<div class="mt-8 text-center">
				<p class="text-sm text-gray-400">
					Эта страница доступна только авторизованным пользователям.
					<br />
					Ваша сессия защищена API токенами и данные передаются по защищенному соединению.
				</p>
			</div>
		</div>
	</div>
</ProtectedRoute>
