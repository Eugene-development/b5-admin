<script>
	let { isScrolled = $bindable(false) } = $props();

	// Отслеживание скролла для изменения стиля хэдера
	if (typeof window !== 'undefined') {
		$effect(() => {
			const handleScroll = () => {
				isScrolled = window.scrollY > 50;
			};
			window.addEventListener('scroll', handleScroll);
			return () => window.removeEventListener('scroll', handleScroll);
		});
	}
</script>

<header
	class="fixed left-0 right-0 top-0 z-50 transition-all duration-300 {isScrolled
		? 'bg-white/95 shadow-lg backdrop-blur-md dark:bg-gray-900/95'
		: 'bg-transparent'}"
>
	<nav class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="flex h-16 items-center justify-between">
			<!-- Логотип/название -->
			<div class="flex-shrink-0">
				<a
					href="/"
					class="bg-gradient-to-r from-blue-600 via-cyan-600 to-sky-600 bg-clip-text text-2xl font-bold text-transparent transition-all hover:from-blue-700 hover:via-cyan-700 hover:to-sky-700"
				>
					RUBONUS<span class="text-base">.pro</span>
				</a>
			</div>

			<!-- Меню навигации -->
			<div class="hidden md:block">
				<div class="flex items-center space-x-6">
					<a
						href="/login"
						class="font-light text-gray-700 transition-colors hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
					>
						Войти
					</a>
					<a
						href="/register"
						class="rounded-lg bg-gradient-to-r from-blue-600 via-cyan-600 to-sky-600 px-4 py-1.5 font-medium text-white transition-all hover:scale-105 hover:shadow-lg"
					>
						Регистрация
					</a>
				</div>
			</div>

			<!-- Мобильное меню (бургер) -->
			<div class="md:hidden">
				<button
					onclick={() => {
						const menu = document.getElementById('mobile-menu');
						if (menu) {
							menu.classList.toggle('hidden');
						}
					}}
					aria-label="Открыть меню"
					class="text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
				>
					<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 6h16M4 12h16M4 18h16"
						/>
					</svg>
				</button>
			</div>
		</div>

		<!-- Мобильное меню -->
		<div
			id="mobile-menu"
			class="hidden bg-white/95 pb-4 backdrop-blur-md md:hidden dark:bg-gray-900/95"
		>
			<div class="flex flex-col space-y-2">
				<a
					href="/login"
					class="rounded px-3 py-2 text-left font-light text-gray-700 hover:bg-indigo-50 dark:text-gray-300 dark:hover:bg-gray-800"
				>
					Войти
				</a>
				<a
					href="/register"
					class="rounded bg-gradient-to-r from-blue-600 via-cyan-600 to-sky-600 px-3 py-2 text-left font-medium text-white hover:from-blue-700 hover:via-cyan-700 hover:to-sky-700"
				>
					Регистрация
				</a>
			</div>
		</div>
	</nav>
</header>
