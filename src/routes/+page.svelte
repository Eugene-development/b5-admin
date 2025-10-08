<script>
	import { domainState } from '$lib/utils/domainAccess.svelte.js';
	import { authState } from '$lib/state/auth.svelte.js';
	import { goto } from '$app/navigation';

	// Redirect authenticated users to dashboard
	$effect(() => {
		if (authState.isAuthenticated) {
			goto('/dashboard');
		}
	});
</script>

<svelte:head>
	<title>Добро пожаловать</title>
	<meta name="description" content="Система управления проектами" />
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
	<div class="animate-fade-in-up w-full max-w-6xl text-center">
		<!-- Главная карточка -->
		<div
			class="rounded-3xl border border-white/20 bg-white/80 p-8 shadow-2xl backdrop-blur-xl md:p-16 lg:p-20 dark:border-gray-700/20 dark:bg-gray-900/80"
		>
			<!-- Домен большими буквами с градиентом -->
			<h1
				class="mb-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-3xl font-extrabold uppercase text-transparent sm:text-5xl md:text-6xl lg:text-8xl dark:from-indigo-400 dark:via-purple-400 dark:to-blue-400"
				style="filter: drop-shadow(0 0 20px rgba(99, 102, 241, 0.3)) drop-shadow(0 0 40px rgba(168, 85, 247, 0.2));"
			>
				{domainState.hostname || 'Loading...'}
			</h1>

			<!-- Подпись -->
			<p class="mb-12 text-lg text-gray-600 sm:text-xl md:text-xl lg:mb-16 dark:text-gray-400">
				Система управлением проектами и бонусами
			</p>

			<!-- Кнопки -->
			<div class="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
				<!-- Кнопка Логин -->
				<a
					href="/login"
					class="group relative w-full transform overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl sm:w-52"
				>
					<div class="flex items-center justify-center space-x-2">
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
							/>
						</svg>
						<span>Логин</span>
					</div>
				</a>

				<!-- Кнопка Регистрация -->
				<a
					href="/register"
					class="group relative w-full transform overflow-hidden rounded-2xl border-2 border-indigo-600 bg-white px-8 py-4 text-lg font-semibold text-indigo-600 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-indigo-50 hover:shadow-xl sm:w-52 dark:border-indigo-400 dark:bg-gray-800 dark:text-indigo-400 dark:hover:bg-gray-700"
				>
					<div class="flex items-center justify-center space-x-2">
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
							/>
						</svg>
						<span>Регистрация</span>
					</div>
				</a>
			</div>
		</div>

		<!-- Дополнительная информация внизу -->
		<div class="mt-8 text-sm text-gray-500 dark:text-gray-600">
			<p>&copy; {new Date().getFullYear()} Все права защищены</p>
		</div>
	</div>
</div>
