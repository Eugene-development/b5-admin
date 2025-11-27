<script>
	import { goto } from '$app/navigation';
	import { logout } from '$lib/state/auth.svelte.js';

	async function handleLogout() {
		await logout({ redirectTo: '/login' });
	}
</script>

<svelte:head>
	<title>ДОСТУП ЗАПРЕЩЁН</title>
	<meta name="description" content="Доступ к системе запрещён" />
</svelte:head>

<div
	class="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-950 via-black to-gray-900 p-4"
>
	<div class="animate-fade-in-up w-full max-w-4xl">
		<!-- Агрессивная карточка с предупреждением -->
		<div
			class="relative overflow-hidden rounded-3xl border-4 border-red-600 bg-black shadow-2xl shadow-red-900/50"
		>
			<!-- Анимированный фон с предупреждающими полосами -->
			<div class="absolute inset-0 opacity-10">
				<div
					class="h-full w-full bg-[repeating-linear-gradient(45deg,transparent,transparent_35px,rgba(239,68,68,0.3)_35px,rgba(239,68,68,0.3)_70px)]"
				></div>
			</div>

			<!-- Пульсирующее свечение -->
			<div
				class="absolute inset-0 animate-pulse bg-gradient-to-r from-red-600/20 via-transparent to-red-600/20"
			></div>

			<!-- Контент -->
			<div class="relative z-10 p-8 text-center md:p-16">
				<!-- Иконка предупреждения -->
				<div class="mb-8 flex justify-center">
					<div class="relative">
						<!-- Пульсирующие круги -->
						<div class="absolute inset-0 animate-ping rounded-full bg-red-600 opacity-75"></div>
						<div class="absolute inset-0 animate-pulse rounded-full bg-red-600 opacity-50"></div>

						<!-- Основная иконка -->
						<div
							class="relative flex h-32 w-32 items-center justify-center rounded-full border-4 border-red-600 bg-gradient-to-br from-red-900 to-black shadow-2xl shadow-red-600/50"
						>
							<svg
								class="h-20 w-20 text-red-500"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2.5"
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
								/>
							</svg>
						</div>
					</div>
				</div>

				<!-- Заголовок -->
				<h1 class="mb-4 text-5xl font-black tracking-wider text-red-500 uppercase md:text-7xl">
					<span class="animate-pulse">ДОСТУП</span>
					<br />
					<span class="text-white">ЗАПРЕЩЁН</span>
				</h1>

				<!-- Подзаголовок -->
				<div class="mb-8 space-y-4">
					<p class="text-xl font-bold text-red-400 md:text-2xl">⚠️ НЕСАНКЦИОНИРОВАННЫЙ ДОСТУП ⚠️</p>
					<p class="text-lg text-gray-300 md:text-xl">
						Ваш статус пользователя не имеет доступа к административной панели
					</p>
				</div>

				<!-- Информационный блок -->
				<div
					class="mx-auto mb-8 max-w-2xl rounded-2xl border-2 border-red-800 bg-red-950/50 p-6 backdrop-blur-sm"
				>
					<div class="space-y-3 text-left">
						<div class="flex items-start space-x-3">
							<svg
								class="h-6 w-6 flex-shrink-0 text-red-500"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							<p class="text-gray-300">
								<span class="font-bold text-red-400">Причина блокировки:</span> Ваш статус пользователя
								не имеет прав доступа.
							</p>
						</div>

						<div class="flex items-start space-x-3">
							<svg
								class="mt-1 h-6 w-6 flex-shrink-0 text-red-500"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
								/>
							</svg>
							<p class="text-gray-300">
								<span class="font-bold text-red-400">Действие:</span> При необходимости обратитесь к
								администратору системы.
							</p>
						</div>
					</div>
				</div>

				<!-- Кнопки действий -->
				<div
					class="flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4"
				>
					<button
						onclick={handleLogout}
						class="group relative w-full overflow-hidden rounded-xl border-2 border-red-600 bg-gradient-to-r from-red-600 to-red-700 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-red-600/50 transition-all duration-300 hover:scale-105 hover:from-red-700 hover:to-red-800 hover:shadow-xl hover:shadow-red-600/70 sm:w-auto"
					>
						<span class="relative z-10 flex items-center justify-center space-x-2">
							<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
								/>
							</svg>
							<span>ВЫЙТИ ИЗ СИСТЕМЫ</span>
						</span>
						<div
							class="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full"
						></div>
					</button>

					<a
						href="mailto:support@b5.ru"
						class="group relative w-full overflow-hidden rounded-xl border-2 border-gray-600 bg-gradient-to-r from-gray-800 to-gray-900 px-8 py-4 text-lg font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:border-gray-500 hover:from-gray-700 hover:to-gray-800 hover:shadow-xl sm:w-auto"
					>
						<span class="relative z-10 flex items-center justify-center space-x-2">
							<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
								/>
							</svg>
							<span>СВЯЗАТЬСЯ С ПОДДЕРЖКОЙ</span>
						</span>
						<div
							class="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 group-hover:translate-x-full"
						></div>
					</a>
				</div>

				<!-- Дополнительная информация -->
				<div class="mt-12 border-t border-red-900 pt-6">
					<p class="text-sm text-gray-500">
						Код ошибки: <span class="font-mono text-red-500">ACCESS_DENIED_403</span>
					</p>
					<p class="mt-2 text-xs text-gray-600">
						Если вы считаете, что это ошибка, пожалуйста, свяжитесь с администратором системы
					</p>
				</div>
			</div>
		</div>

		<!-- Декоративные элементы -->
		<div
			class="absolute top-1/4 left-1/4 -z-10 h-96 w-96 animate-pulse rounded-full bg-red-600/10 blur-3xl"
		></div>
		<div
			class="absolute right-1/4 bottom-1/4 -z-10 h-96 w-96 animate-pulse rounded-full bg-red-800/10 blur-3xl"
			style="animation-delay: 1s;"
		></div>
	</div>
</div>

<style>
	@keyframes fade-in-up {
		from {
			opacity: 0;
			transform: translateY(30px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-fade-in-up {
		animation: fade-in-up 0.6s ease-out;
	}
</style>
