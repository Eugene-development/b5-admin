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
				<div class="flex items-center space-x-8">
					<button
						onclick={() => scrollToSection('home')}
						class="text-gray-700 transition-colors hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
					>
						Главная
					</button>
					<button
						onclick={() => scrollToSection('test1')}
						class="text-gray-700 transition-colors hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
					>
						Тест1
					</button>
					<button
						onclick={() => scrollToSection('test2')}
						class="text-gray-700 transition-colors hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
					>
						Тест2
					</button>
					<button
						onclick={() => scrollToSection('test3')}
						class="text-gray-700 transition-colors hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
					>
						Тест3
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
						scrollToSection('test1');
						document.getElementById('mobile-menu')?.classList.add('hidden');
					}}
					class="rounded px-3 py-2 text-left text-gray-700 hover:bg-indigo-50 dark:text-gray-300 dark:hover:bg-gray-800"
				>
					Тест1
				</button>
				<button
					onclick={() => {
						scrollToSection('test2');
						document.getElementById('mobile-menu')?.classList.add('hidden');
					}}
					class="rounded px-3 py-2 text-left text-gray-700 hover:bg-indigo-50 dark:text-gray-300 dark:hover:bg-gray-800"
				>
					Тест2
				</button>
				<button
					onclick={() => {
						scrollToSection('test3');
						document.getElementById('mobile-menu')?.classList.add('hidden');
					}}
					class="rounded px-3 py-2 text-left text-gray-700 hover:bg-indigo-50 dark:text-gray-300 dark:hover:bg-gray-800"
				>
					Тест3
				</button>
			</div>
		</div>
	</nav>
</header>
