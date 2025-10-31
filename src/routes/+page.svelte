<script>
	import { domainState } from '$lib/utils/domainAccess.svelte.js';
	import { authState } from '$lib/state/auth.svelte.js';
	import { goto } from '$app/navigation';
	import Header from '$lib/components/Header.svelte';
	import Sparkles from '$lib/components/ui/Sparkles/Sparkles.svelte';
	import { onMount } from 'svelte';

	let isScrolled = $state(false);
	let mounted = $state(false);

	onMount(() => {
		mounted = true;
	});

	// Redirect authenticated users to dashboard
	// Only after component is mounted to avoid race conditions with logout
	$effect(() => {
		if (mounted && authState.initialized && authState.isAuthenticated) {
			goto('/dashboard');
		}
	});
</script>

<svelte:head>
	<title>Добро пожаловать</title>
	<meta name="description" content="Система управления проектами" />
</svelte:head>

<Header bind:isScrolled />

<div class="bg-gray-50 dark:bg-gray-950">
	<!-- Секция: Главная -->
	<section
		id="home"
		class="flex min-h-screen items-center justify-center p-4 pt-8 sm:pt-12"
		style="scroll-margin-top: 4rem;"
	>
		<div class="animate-fade-in-up w-full max-w-full text-center">
			<!-- Главная карточка -->
			<div
				class="rounded-3xl bg-white/80 p-8 shadow-2xl backdrop-blur-xl md:p-16 lg:p-20 dark:border-gray-700/20 dark:bg-gray-950/80"
			>
				<!-- Название большими буквами с градиентом -->
				<h1
					class="mb-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-5xl font-extrabold uppercase text-transparent sm:text-6xl md:text-7xl lg:text-9xl dark:from-indigo-400 dark:via-purple-400 dark:to-blue-400"
					style="filter: drop-shadow(0 0 20px rgba(99, 102, 241, 0.3)) drop-shadow(0 0 40px rgba(168, 85, 247, 0.2));"
				>
					RUBONUS
				</h1>

				<!-- Подпись -->
				<p
					class="mx-auto mb-10 max-w-2xl text-lg text-gray-600 sm:text-xl md:text-xl dark:text-gray-400"
				>
					Система управлением проектами и бонусами для повышения эффективности работы компаний
				</p>

				<!-- Sparkles Effect -->
				<div class="relative mb-12 mt-4 w-full overflow-hidden" style="height: 499px;">
					<!-- Gradients -->
					<div
						class="absolute inset-x-20 top-0 h-[2px] w-3/4 bg-gradient-to-r from-transparent via-indigo-500 to-transparent blur-sm"
					></div>
					<div
						class="absolute inset-x-20 top-0 h-px w-3/4 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
					></div>
					<div
						class="absolute inset-x-60 top-0 h-[5px] w-1/4 bg-gradient-to-r from-transparent via-sky-500 to-transparent blur-sm"
					></div>
					<div
						class="absolute inset-x-60 top-0 h-px w-1/4 bg-gradient-to-r from-transparent via-sky-500 to-transparent"
					></div>

					<!-- Core component -->
					<div class="absolute inset-0 h-full w-full">
						<Sparkles
							minSize={0.8}
							maxSize={2}
							particleDensity={300}
							className="w-full h-full"
							particleColor="#FFFFFF"
						/>
					</div>

					<!-- Radial Gradient to prevent sharp edges -->
					<div
						class="absolute inset-0 h-full w-full bg-transparent [mask-image:radial-gradient(350px_400px_at_top,transparent_20%,white)]"
					></div>

					<!-- Кнопки поверх Sparkles -->
					<div
						class="absolute inset-0 z-10 -mt-10 flex flex-col items-center justify-center gap-4 px-4 sm:flex-row sm:gap-6"
					>
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
			</div>
		</div>
	</section>

	<!-- Секция: О проекте РУБОНУС -->
	<section
		id="about"
		class="flex min-h-screen items-center justify-center p-4"
		style="scroll-margin-top: 5rem;"
	>
		<div class="w-full max-w-6xl">
			<div
				class=" bg-white/80 p-8 shadow-2xl backdrop-blur-xl md:p-16 dark:border-gray-700/20 dark:bg-gray-950/80"
			>
				<h2
					class="mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-center text-4xl font-bold text-transparent md:text-6xl dark:from-blue-400 dark:to-indigo-400"
				>
					О проекте
				</h2>

				<div class="mx-auto max-w-5xl space-y-8">
					<p class="text-center text-xl text-gray-700 md:text-2xl dark:text-gray-300">
						Мы создаём экосистему, которая объединяет бизнес
					</p>

					<div class="grid gap-6 md:grid-cols-3">
						<!-- Клиенты -->
						<div
							class="group transform rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl dark:from-blue-950/30 dark:to-indigo-950/30"
						>
							<div class="mb-4 flex justify-center">
								<div class="rounded-full bg-blue-600 p-4 dark:bg-blue-500">
									<svg
										class="h-8 w-8 text-white"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
										/>
									</svg>
								</div>
							</div>
							<h3 class="mb-2 text-center text-xl font-bold text-gray-800 dark:text-gray-200">
								Клиенты
							</h3>
							<p class="text-center text-gray-600 dark:text-gray-400">
								Гарантированно получают товары и услуги высокого качества
							</p>
						</div>

						<!-- Агенты -->
						<div
							class="group transform rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl dark:from-purple-950/30 dark:to-pink-950/30"
						>
							<div class="mb-4 flex justify-center">
								<div class="rounded-full bg-purple-600 p-4 dark:bg-purple-500">
									<svg
										class="h-8 w-8 text-white"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M13 10V3L4 14h7v7l9-11h-7z"
										/>
									</svg>
								</div>
							</div>
							<h3 class="mb-2 text-center text-xl font-bold text-gray-800 dark:text-gray-200">
								Агенты
							</h3>
							<p class="text-center text-gray-600 dark:text-gray-400">
								Связывают клиентов с партнёрами за вознаграждение
							</p>
						</div>

						<!-- Партнёры -->
						<div
							class="group transform rounded-2xl bg-gradient-to-br from-green-50 to-teal-50 p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl dark:from-green-950/30 dark:to-teal-950/30"
						>
							<div class="mb-4 flex justify-center">
								<div class="rounded-full bg-green-600 p-4 dark:bg-green-500">
									<svg
										class="h-8 w-8 text-white"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
										/>
									</svg>
								</div>
							</div>
							<h3 class="mb-2 text-center text-xl font-bold text-gray-800 dark:text-gray-200">
								Партнёры
							</h3>
							<p class="text-center text-gray-600 dark:text-gray-400">
								Подрядчики и поставщики услуг увеличивают доход
							</p>
						</div>
					</div>

					<div
						class="mt-8 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-center dark:from-indigo-700 dark:to-purple-700"
					>
						<p class="text-lg font-semibold text-white md:text-xl">
							RUBONUS - это единая сеть для эффективного взаимодействия и роста доходов вашего
							бизнеса
						</p>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Секция: Статистика -->
	<section
		id="stats"
		class="flex min-h-screen items-center justify-center p-4"
		style="scroll-margin-top: 5rem;"
	>
		<div class="w-full max-w-6xl">
			<div
				class=" bg-white/80 p-8 shadow-2xl backdrop-blur-xl md:p-16 dark:border-gray-700/20 dark:bg-gray-950/80"
			>
				<h2
					class="mb-8 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-center text-4xl font-bold text-transparent md:text-6xl dark:from-orange-400 dark:to-red-400"
				>
					Наши достижения
				</h2>

				<div class="mx-auto max-w-5xl">
					<p class="mb-12 text-center text-xl text-gray-700 dark:text-gray-300">
						Растущая сеть профессионалов и надёжных партнёров
					</p>

					<div class="grid gap-8 md:grid-cols-2">
						<!-- Агенты -->
						<div
							class="group transform rounded-3xl bg-gradient-to-br from-orange-600 to-red-600 p-8 text-center transition-all duration-300 hover:scale-105 hover:shadow-2xl dark:from-orange-700 dark:to-red-700"
						>
							<div class="mb-4 flex justify-center">
								<svg
									class="h-16 w-16 text-white"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
									/>
								</svg>
							</div>
							<div class="mb-2 text-6xl font-extrabold text-white md:text-7xl">500+</div>
							<div class="text-xl font-semibold text-white/90">Агентов в нашей сети</div>
							<p class="mt-4 text-white/80">Профессионалы, готовые помочь вашему бизнесу</p>
						</div>

						<!-- Компании -->
						<div
							class="group transform rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-500 p-8 text-center transition-all duration-300 hover:scale-105 hover:shadow-2xl dark:from-blue-600 dark:to-indigo-600"
						>
							<div class="mb-4 flex justify-center">
								<svg
									class="h-16 w-16 text-white"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
									/>
								</svg>
							</div>
							<div class="mb-2 text-6xl font-extrabold text-white md:text-7xl">100+</div>
							<div class="text-xl font-semibold text-white/90">Компаний-партнёров</div>
							<p class="mt-4 text-white/80">Надёжные подрядчики и поставщики товаров и услуг</p>
						</div>
					</div>

					<!-- Дополнительные преимущества -->
					<div class="mt-12 grid gap-4 md:grid-cols-3">
						<div
							class="rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 p-6 text-center dark:from-green-950/30 dark:to-emerald-950/30"
						>
							<div class="mb-2 text-3xl font-bold text-green-600 dark:text-green-400">24/7</div>
							<div class="text-sm font-medium text-gray-700 dark:text-gray-300">
								Работает платформа
							</div>
						</div>
						<div
							class="rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 p-6 text-center dark:from-purple-950/30 dark:to-pink-950/30"
						>
							<div class="mb-2 text-3xl font-bold text-purple-600 dark:text-purple-400">98%</div>
							<div class="text-sm font-medium text-gray-700 dark:text-gray-300">
								Удовлетворённость клиентов
							</div>
						</div>
						<div
							class="rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 p-6 text-center dark:from-blue-950/30 dark:to-cyan-950/30"
						>
							<div class="mb-2 text-3xl font-bold text-blue-600 dark:text-blue-400">25 лет</div>
							<div class="text-sm font-medium text-gray-700 dark:text-gray-300">
								На мебельном рынке
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Секция: Мотивация сотрудничества -->
	<section
		id="benefits"
		class="flex min-h-screen items-center justify-center p-4"
		style="scroll-margin-top: 5rem;"
	>
		<div class="w-full max-w-6xl">
			<div
				class=" bg-white/80 p-8 shadow-2xl backdrop-blur-xl md:p-16 dark:border-gray-700/20 dark:bg-gray-950/80"
			>
				<h2
					class="mb-8 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-center text-4xl font-bold text-transparent md:text-6xl dark:from-pink-400 dark:to-purple-400"
				>
					Почему выбирают нас
				</h2>

				<div class="mx-auto max-w-5xl">
					<p class="mb-12 text-center text-xl text-gray-700 dark:text-gray-300">
						Выгодное сотрудничество для всех участников сети
					</p>

					<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						<!-- Выгода 1 -->
						<div
							class="group transform rounded-2xl border-2 border-pink-200 bg-white p-6 transition-all duration-300 hover:scale-105 hover:border-pink-400 hover:shadow-xl dark:border-pink-900/50 dark:bg-gray-900/50 dark:hover:border-pink-600"
						>
							<div
								class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-500"
							>
								<svg
									class="h-7 w-7 text-white"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
							</div>
							<h3 class="mb-3 text-xl font-bold text-gray-800 dark:text-gray-200">
								Система бонусов
							</h3>
							<p class="text-gray-600 dark:text-gray-400">
								Честное вознаграждение за каждую сделку
							</p>
						</div>

						<!-- Выгода 2 -->
						<div
							class="group transform rounded-2xl border-2 border-blue-200 bg-white p-6 transition-all duration-300 hover:scale-105 hover:border-blue-400 hover:shadow-xl dark:border-blue-900/50 dark:bg-gray-900/50 dark:hover:border-blue-600"
						>
							<div
								class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500"
							>
								<svg
									class="h-7 w-7 text-white"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
									/>
								</svg>
							</div>
							<h3 class="mb-3 text-xl font-bold text-gray-800 dark:text-gray-200">
								Проверенные партнёры
							</h3>
							<p class="text-gray-600 dark:text-gray-400">
								Только надёжные компании с подтверждённой репутацией
							</p>
						</div>

						<!-- Выгода 3 -->
						<div
							class="group transform rounded-2xl border-2 border-green-200 bg-white p-6 transition-all duration-300 hover:scale-105 hover:border-green-400 hover:shadow-xl dark:border-green-900/50 dark:bg-gray-900/50 dark:hover:border-green-600"
						>
							<div
								class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-500"
							>
								<svg
									class="h-7 w-7 text-white"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
									/>
								</svg>
							</div>
							<h3 class="mb-3 text-xl font-bold text-gray-800 dark:text-gray-200">Рост доходов</h3>
							<p class="text-gray-600 dark:text-gray-400">
								Увеличение прибыли через расширение клиентской базы
							</p>
						</div>

						<!-- Выгода 4 -->
						<div
							class="group transform rounded-2xl border-2 border-orange-200 bg-white p-6 transition-all duration-300 hover:scale-105 hover:border-orange-400 hover:shadow-xl dark:border-orange-900/50 dark:bg-gray-900/50 dark:hover:border-orange-600"
						>
							<div
								class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-500"
							>
								<svg
									class="h-7 w-7 text-white"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
									/>
								</svg>
							</div>
							<h3 class="mb-3 text-xl font-bold text-gray-800 dark:text-gray-200">
								Гибкие условия
							</h3>
							<p class="text-gray-600 dark:text-gray-400">
								Индивидуальный подход к каждому участнику сети
							</p>
						</div>

						<!-- Выгода 5 -->
						<div
							class="group transform rounded-2xl border-2 border-indigo-200 bg-white p-6 transition-all duration-300 hover:scale-105 hover:border-indigo-400 hover:shadow-xl dark:border-indigo-900/50 dark:bg-gray-900/50 dark:hover:border-indigo-600"
						>
							<div
								class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500"
							>
								<svg
									class="h-7 w-7 text-white"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
									/>
								</svg>
							</div>
							<h3 class="mb-3 text-xl font-bold text-gray-800 dark:text-gray-200">
								Современные технологии
							</h3>
							<p class="text-gray-600 dark:text-gray-400">
								Удобная платформа для управления проектами и бонусами
							</p>
						</div>

						<!-- Выгода 6 -->
						<div
							class="group transform rounded-2xl border-2 border-teal-200 bg-white p-6 transition-all duration-300 hover:scale-105 hover:border-teal-400 hover:shadow-xl dark:border-teal-900/50 dark:bg-gray-900/50 dark:hover:border-teal-600"
						>
							<div
								class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-green-500"
							>
								<svg
									class="h-7 w-7 text-white"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
									/>
								</svg>
							</div>
							<h3 class="mb-3 text-xl font-bold text-gray-800 dark:text-gray-200">
								Сильное комьюнити
							</h3>
							<p class="text-gray-600 dark:text-gray-400">
								Обмен опытом и взаимная поддержка участников
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Секция: Регистрация -->
	<section
		id="register"
		class="flex min-h-screen items-center justify-center p-4"
		style="scroll-margin-top: 5rem;"
	>
		<div class="w-full max-w-6xl">
			<div
				class=" bg-white/80 p-8 shadow-2xl backdrop-blur-xl md:p-16 dark:border-gray-700/20 dark:bg-gray-950/80"
			>
				<div class="mx-auto max-w-4xl text-center">
					<!-- Заголовок -->
					<h2
						class="mb-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-4xl font-bold text-transparent md:text-6xl dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400"
					>
						Готовы начать?
					</h2>

					<p class="mb-8 text-xl text-gray-700 md:text-2xl dark:text-gray-300">
						Присоединяйтесь к РУБОНУС и развивайте свой бизнес вместе с нами
					</p>

					<!-- Преимущества регистрации -->
					<div class="mb-10 grid gap-4 text-left md:grid-cols-2">
						<div
							class="flex items-start space-x-3 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 p-4 dark:from-green-950/30 dark:to-emerald-950/30"
						>
							<svg
								class="mt-1 h-6 w-6 flex-shrink-0 text-green-600 dark:text-green-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M5 13l4 4L19 7"
								/>
							</svg>
							<div>
								<h4 class="font-semibold text-gray-800 dark:text-gray-200">Быстрая регистрация</h4>
								<p class="text-sm text-gray-600 dark:text-gray-400">Всего несколько минут</p>
							</div>
						</div>
						<div
							class="flex items-start space-x-3 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 p-4 dark:from-blue-950/30 dark:to-cyan-950/30"
						>
							<svg
								class="mt-1 h-6 w-6 flex-shrink-0 text-blue-600 dark:text-blue-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M5 13l4 4L19 7"
								/>
							</svg>
							<div>
								<h4 class="font-semibold text-gray-800 dark:text-gray-200">Бесплатный доступ</h4>
								<p class="text-sm text-gray-600 dark:text-gray-400">Без скрытых платежей</p>
							</div>
						</div>
						<div
							class="flex items-start space-x-3 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 p-4 dark:from-purple-950/30 dark:to-pink-950/30"
						>
							<svg
								class="mt-1 h-6 w-6 flex-shrink-0 text-purple-600 dark:text-purple-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M5 13l4 4L19 7"
								/>
							</svg>
							<div>
								<h4 class="font-semibold text-gray-800 dark:text-gray-200">Мгновенный старт</h4>
								<p class="text-sm text-gray-600 dark:text-gray-400">Начните работать сразу</p>
							</div>
						</div>
						<div
							class="flex items-start space-x-3 rounded-xl bg-gradient-to-br from-orange-50 to-red-50 p-4 dark:from-orange-950/30 dark:to-red-950/30"
						>
							<svg
								class="mt-1 h-6 w-6 flex-shrink-0 text-orange-600 dark:text-orange-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M5 13l4 4L19 7"
								/>
							</svg>
							<div>
								<h4 class="font-semibold text-gray-800 dark:text-gray-200">Полная поддержка</h4>
								<p class="text-sm text-gray-600 dark:text-gray-400">Помощь на каждом этапе</p>
							</div>
						</div>
					</div>

					<!-- CTA кнопка -->
					<div
						class="rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-1 dark:from-indigo-700 dark:via-purple-700 dark:to-pink-700"
					>
						<div class="rounded-xl bg-white p-8 dark:bg-gray-900">
							<a
								href="/register"
								class="inline-block w-full transform rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-12 py-5 text-xl font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl md:w-auto"
							>
								<div class="flex items-center justify-center space-x-3">
									<span>Зарегистрироваться сейчас</span>
									<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M13 7l5 5m0 0l-5 5m5-5H6"
										/>
									</svg>
								</div>
							</a>
							<p class="mt-4 text-sm text-gray-600 dark:text-gray-400">
								Уже есть аккаунт?
								<a
									href="/login"
									class="font-semibold text-indigo-600 hover:text-purple-600 dark:text-indigo-400 dark:hover:text-purple-400"
								>
									Войти
								</a>
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Футер -->
	<footer
		class="border-t border-gray-200 bg-white/80 py-8 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-950/80"
	>
		<div class="mx-auto max-w-6xl px-4 text-center">
			<p class="text-sm text-gray-500 dark:text-gray-600">
				&copy; {new Date().getFullYear()} Все права защищены
			</p>
		</div>
	</footer>
</div>
