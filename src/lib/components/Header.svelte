<script>
	let { isScrolled = $bindable(false) } = $props();

	function scrollToSection(sectionId) {
		const element = document.getElementById(sectionId);
		if (element) {
			element.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}

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
				<button
					onclick={() => scrollToSection('home')}
					class="text-xl font-bold text-indigo-600 transition-colors hover:text-purple-600 dark:text-indigo-400 dark:hover:text-purple-400"
				>
					RUBONUS
				</button>
			</div>

			<!-- Меню навигации -->
			<div class="hidden md:block">
				<div class="flex items-center space-x-6">
					<button
						onclick={() => scrollToSection('home')}
						class="text-gray-700 transition-colors hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
					>
						Главная
					</button>
					<button
						onclick={() => scrollToSection('about')}
						class="text-gray-700 transition-colors hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
					>
						О проекте
					</button>
					<button
						onclick={() => scrollToSection('stats')}
						class="text-gray-700 transition-colors hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
					>
						Цифры
					</button>
					<button
						onclick={() => scrollToSection('benefits')}
						class="text-gray-700 transition-colors hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
					>
						Выгода
					</button>
					<button
						onclick={() => scrollToSection('register')}
						class="rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 font-semibold text-white transition-all hover:scale-105 hover:shadow-lg"
					>
						Регистрация
					</button>
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
		<div id="mobile-menu" class="hidden pb-4 md:hidden">
			<div class="flex flex-col space-y-2">
				<button
					onclick={() => {
						scrollToSection('home');
						document.getElementById('mobile-menu')?.classList.add('hidden');
					}}
					class="rounded px-3 py-2 text-left text-gray-700 hover:bg-indigo-50 dark:text-gray-300 dark:hover:bg-gray-800"
				>
					Главная
				</button>
				<button
					onclick={() => {
						scrollToSection('about');
						document.getElementById('mobile-menu')?.classList.add('hidden');
					}}
					class="rounded px-3 py-2 text-left text-gray-700 hover:bg-indigo-50 dark:text-gray-300 dark:hover:bg-gray-800"
				>
					О проекте
				</button>
				<button
					onclick={() => {
						scrollToSection('stats');
						document.getElementById('mobile-menu')?.classList.add('hidden');
					}}
					class="rounded px-3 py-2 text-left text-gray-700 hover:bg-indigo-50 dark:text-gray-300 dark:hover:bg-gray-800"
				>
					Цифры
				</button>
				<button
					onclick={() => {
						scrollToSection('benefits');
						document.getElementById('mobile-menu')?.classList.add('hidden');
					}}
					class="rounded px-3 py-2 text-left text-gray-700 hover:bg-indigo-50 dark:text-gray-300 dark:hover:bg-gray-800"
				>
					Выгода
				</button>
				<button
					onclick={() => {
						scrollToSection('register');
						document.getElementById('mobile-menu')?.classList.add('hidden');
					}}
					class="rounded bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-2 text-left font-semibold text-white hover:from-indigo-700 hover:to-purple-700"
				>
					Регистрация
				</button>
			</div>
		</div>
	</nav>
</header>
