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
	<title>RUBONUS - Современная платформа для управления проектами и бонусами</title>
	<meta name="description" content="Экосистема для эффективного взаимодействия бизнеса" />
</svelte:head>

<Header bind:isScrolled />

<div class="relative overflow-hidden bg-gradient-to-b from-gray-900 via-gray-950 to-black">
	<!-- Hero Section -->
	<section class="relative min-h-screen">
		<!-- Background Effects -->
		<div class="absolute inset-0 overflow-hidden">
			<!-- Gradient Orbs -->
			<div
				class="absolute -left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-indigo-600/20 blur-[120px]"
			></div>
			<div
				class="absolute -right-1/4 top-1/4 h-[600px] w-[600px] rounded-full bg-purple-600/20 blur-[120px]"
			></div>
			<div
				class="absolute bottom-0 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-blue-600/20 blur-[120px]"
			></div>

			<!-- Grid Pattern -->
			<div
				class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]"
			></div>
		</div>

		<!-- Content -->
		<div class="relative mx-auto max-w-7xl px-4 pb-32 pt-32 sm:px-6 lg:px-8">
			<!-- Main Title -->
			<div class="text-center">
				<div
					class="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-2 backdrop-blur-sm"
				>
					<span class="relative flex h-2 w-2">
						<span
							class="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"
						></span>
						<span class="relative inline-flex h-2 w-2 rounded-full bg-indigo-500"></span>
					</span>
					<span class="text-sm font-medium text-indigo-300">Версия 2.0 доступна</span>
				</div>

				<h1
					class="tracking-expand mb-6 bg-gradient-to-b from-white via-white to-gray-400 bg-clip-text text-6xl font-bold text-transparent sm:text-7xl md:text-8xl lg:text-9xl"
				>
					RUBONUS
				</h1>

				<p class="mx-auto mb-12 max-w-3xl text-xl leading-relaxed text-gray-400 sm:text-2xl">
					Экосистема для эффективного взаимодействия бизнеса. <br />
					<span class="text-white">Управляйте проектами</span> и
					<span class="text-white">повышайте ваши доходы</span> с помощью современных технологий.
				</p>

				<!-- Decorative SVG Network -->
				<div class="mx-auto max-w-2xl">
					<svg viewBox="0 0 600 300" class="w-full" xmlns="http://www.w3.org/2000/svg">
						<!-- Connections -->
						<g stroke="url(#gradient1)" stroke-width="2" fill="none" opacity="0.4">
							<line x1="100" y1="150" x2="300" y2="80" class="animate-pulse" />
							<line x1="100" y1="150" x2="300" y2="220" class="animate-pulse" />
							<line x1="300" y1="80" x2="500" y2="150" class="animate-pulse" />
							<line x1="300" y1="220" x2="500" y2="150" class="animate-pulse" />
							<line x1="300" y1="80" x2="300" y2="220" class="animate-pulse" />
						</g>

						<!-- Nodes -->
						<g>
							<!-- Left Node - Agents -->
							<circle cx="100" cy="150" r="40" fill="url(#gradient4)" opacity="0.2" />
							<circle cx="100" cy="150" r="30" fill="url(#gradient4)" opacity="0.4" />
							<circle cx="100" cy="150" r="20" fill="url(#gradient4)" />
							<text
								x="100"
								y="215"
								text-anchor="middle"
								fill="url(#gradient4)"
								font-size="14"
								font-weight="500"
							>
								Агенты
							</text>

							<!-- Top Center Node - Platform -->
							<circle cx="300" cy="80" r="40" fill="url(#gradient3)" opacity="0.2" />
							<circle cx="300" cy="80" r="30" fill="url(#gradient3)" opacity="0.4" />
							<circle cx="300" cy="80" r="20" fill="url(#gradient3)" />
							<text
								x="300"
								y="25"
								text-anchor="middle"
								fill="url(#gradient3)"
								font-size="14"
								font-weight="500"
							>
								Платформа
							</text>

							<!-- Bottom Center Node - Clients -->
							<circle cx="300" cy="220" r="40" fill="url(#gradient2)" opacity="0.2" />
							<circle cx="300" cy="220" r="30" fill="url(#gradient2)" opacity="0.4" />
							<circle cx="300" cy="220" r="20" fill="url(#gradient2)" />
							<text
								x="300"
								y="290"
								text-anchor="middle"
								fill="url(#gradient2)"
								font-size="14"
								font-weight="500"
							>
								Клиенты
							</text>

							<!-- Right Node - Partners -->
							<circle cx="500" cy="150" r="40" fill="url(#gradient5)" opacity="0.2" />
							<circle cx="500" cy="150" r="30" fill="url(#gradient5)" opacity="0.4" />
							<circle cx="500" cy="150" r="20" fill="url(#gradient5)" />
							<text
								x="500"
								y="215"
								text-anchor="middle"
								fill="url(#gradient5)"
								font-size="14"
								font-weight="500"
							>
								Партнёры
							</text>
						</g>

						<!-- Gradients -->
						<defs>
							<linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
								<stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
								<stop offset="50%" style="stop-color:#06B6D4;stop-opacity:1" />
								<stop offset="100%" style="stop-color:#0EA5E9;stop-opacity:1" />
							</linearGradient>
							<linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
								<stop offset="0%" style="stop-color:#6366F1;stop-opacity:1" />
								<stop offset="100%" style="stop-color:#A855F7;stop-opacity:1" />
							</linearGradient>
							<linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
								<stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
								<stop offset="100%" style="stop-color:#06B6D4;stop-opacity:1" />
							</linearGradient>
							<linearGradient id="gradient4" x1="0%" y1="0%" x2="100%" y2="100%">
								<stop offset="0%" style="stop-color:#A855F7;stop-opacity:1" />
								<stop offset="100%" style="stop-color:#EC4899;stop-opacity:1" />
							</linearGradient>
							<linearGradient id="gradient5" x1="0%" y1="0%" x2="100%" y2="100%">
								<stop offset="0%" style="stop-color:#10B981;stop-opacity:1" />
								<stop offset="100%" style="stop-color:#14B8A6;stop-opacity:1" />
							</linearGradient>
						</defs>
					</svg>
				</div>
			</div>
		</div>

		<!-- Scroll Indicator -->
		<div class="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
			<svg class="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M19 14l-7 7m0 0l-7-7m7 7V3"
				/>
			</svg>
		</div>
	</section>

	<!-- Features Section -->
	<section class="relative py-32">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="mb-20 text-center">
				<h2
					class="mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl md:text-6xl"
				>
					Для кого мы создаём решения
				</h2>
				<p class="mx-auto max-w-2xl text-xl text-gray-400">
					Объединяем участников рынка в единую экосистему
				</p>
			</div>

			<div class="grid gap-8 md:grid-cols-3">
				<!-- Card 1 -->
				<div
					class="group relative overflow-hidden rounded-3xl border border-gray-800 bg-gradient-to-b from-gray-900/50 to-gray-950/50 p-8 backdrop-blur-sm transition-all duration-300 hover:border-indigo-500/50"
				>
					<div
						class="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-600/10 blur-3xl transition-all duration-300 group-hover:bg-indigo-600/20"
					></div>

					<div
						class="relative mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600"
					>
						<svg class="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
							/>
						</svg>
					</div>

					<h3 class="mb-3 text-2xl font-bold text-white">Клиенты</h3>
					<p class="text-gray-400">
						Получают товары и услуги высокого качества от проверенных партнёров с гарантией
						результата
					</p>
				</div>

				<!-- Card 2 -->
				<div
					class="group relative overflow-hidden rounded-3xl border border-gray-800 bg-gradient-to-b from-gray-900/50 to-gray-950/50 p-8 backdrop-blur-sm transition-all duration-300 hover:border-purple-500/50"
				>
					<div
						class="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-purple-600/10 blur-3xl transition-all duration-300 group-hover:bg-purple-600/20"
					></div>

					<div
						class="relative mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600"
					>
						<svg class="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13 10V3L4 14h7v7l9-11h-7z"
							/>
						</svg>
					</div>

					<h3 class="mb-3 text-2xl font-bold text-white">Агенты</h3>
					<p class="text-gray-400">
						Зарабатывают комиссию, связывая клиентов с надёжными партнёрами нашей сети
					</p>
				</div>

				<!-- Card 3 -->
				<div
					class="group relative overflow-hidden rounded-3xl border border-gray-800 bg-gradient-to-b from-gray-900/50 to-gray-950/50 p-8 backdrop-blur-sm transition-all duration-300 hover:border-green-500/50"
				>
					<div
						class="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-green-600/10 blur-3xl transition-all duration-300 group-hover:bg-green-600/20"
					></div>

					<div
						class="relative mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-teal-600"
					>
						<svg class="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
							/>
						</svg>
					</div>

					<h3 class="mb-3 text-2xl font-bold text-white">Партнёры</h3>
					<p class="text-gray-400">
						Расширяют клиентскую базу и стабильно увеличивают доход бизнеса через нашу сеть агентов
					</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Benefits Section -->
	<section class="relative py-32">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="mb-20 text-center">
				<h2
					class="mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl md:text-6xl"
				>
					Преимущества платформы
				</h2>
			</div>

			<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				<!-- Benefit 1 -->
				<div
					class="group rounded-2xl border border-gray-800 bg-gray-900/30 p-6 backdrop-blur-sm transition-all duration-300 hover:border-indigo-500/50 hover:bg-gray-900/50"
				>
					<div
						class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 transition-all duration-300 group-hover:bg-indigo-500/20"
					>
						<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					</div>
					<h3 class="mb-2 text-lg font-semibold text-white">Прозрачная система бонусов</h3>
					<p class="text-sm text-gray-400">
						Получайте честное и справедливое вознаграждение за каждую успешную сделку. Все расчёты
						прозрачны и доступны в личном кабинете в режиме реального времени.
					</p>
				</div>

				<!-- Benefit 2 -->
				<div
					class="group rounded-2xl border border-gray-800 bg-gray-900/30 p-6 backdrop-blur-sm transition-all duration-300 hover:border-blue-500/50 hover:bg-gray-900/50"
				>
					<div
						class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 transition-all duration-300 group-hover:bg-blue-500/20"
					>
						<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
							/>
						</svg>
					</div>
					<h3 class="mb-2 text-lg font-semibold text-white">Проверенные партнёры</h3>
					<p class="text-sm text-gray-400">
						Работаем только с надёжными и проверенными компаниями, которые прошли строгий отбор.
						Гарантируем качество услуг и выполнение обязательств перед всеми участниками.
					</p>
				</div>

				<!-- Benefit 3 -->
				<div
					class="group rounded-2xl border border-gray-800 bg-gray-900/30 p-6 backdrop-blur-sm transition-all duration-300 hover:border-green-500/50 hover:bg-gray-900/50"
				>
					<div
						class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10 text-green-400 transition-all duration-300 group-hover:bg-green-500/20"
					>
						<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
							/>
						</svg>
					</div>
					<h3 class="mb-2 text-lg font-semibold text-white">Рост доходов</h3>
					<p class="text-sm text-gray-400">
						Стабильное увеличение прибыли для всех участников экосистемы. Наша модель позволяет
						масштабировать бизнес и получать пассивный доход от партнёрской сети.
					</p>
				</div>

				<!-- Benefit 4 -->
				<div
					class="group rounded-2xl border border-gray-800 bg-gray-900/30 p-6 backdrop-blur-sm transition-all duration-300 hover:border-purple-500/50 hover:bg-gray-900/50"
				>
					<div
						class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 transition-all duration-300 group-hover:bg-purple-500/20"
					>
						<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
							/>
						</svg>
					</div>
					<h3 class="mb-2 text-lg font-semibold text-white">Современные технологии</h3>
					<p class="text-sm text-gray-400">
						Интуитивная и удобная платформа для эффективного управления бизнесом. Автоматизация
						процессов, аналитика и отчётность в одном месте.
					</p>
				</div>

				<!-- Benefit 5 -->
				<div
					class="group rounded-2xl border border-gray-800 bg-gray-900/30 p-6 backdrop-blur-sm transition-all duration-300 hover:border-orange-500/50 hover:bg-gray-900/50"
				>
					<div
						class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 transition-all duration-300 group-hover:bg-orange-500/20"
					>
						<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
							/>
						</svg>
					</div>
					<h3 class="mb-2 text-lg font-semibold text-white">Гибкие условия</h3>
					<p class="text-sm text-gray-400">
						Индивидуальный подход к каждому участнику с учётом специфики его бизнеса. Мы постоянно
						настраиваем нашу платформу под ваши потребности и цели.
					</p>
				</div>

				<!-- Benefit 6 -->
				<div
					class="group rounded-2xl border border-gray-800 bg-gray-900/30 p-6 backdrop-blur-sm transition-all duration-300 hover:border-teal-500/50 hover:bg-gray-900/50"
				>
					<div
						class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 transition-all duration-300 group-hover:bg-teal-500/20"
					>
						<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
							/>
						</svg>
					</div>
					<h3 class="mb-2 text-lg font-semibold text-white">Активное комьюнити</h3>
					<p class="text-sm text-gray-400">
						Сообщество профессионалов для обмена опытом, идеями и взаимной поддержки. Организуем
						тренинги и вебинары для достижения лучших результатов.
					</p>
				</div>
			</div>
		</div>
	</section>

	<!-- CTA Section -->
	<section class="relative py-32">
		<div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
			<div
				class="relative overflow-hidden rounded-3xl border border-gray-800 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 p-12 backdrop-blur-sm"
			>
				<div
					class="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-600/20 blur-3xl"
				></div>
				<div
					class="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-purple-600/20 blur-3xl"
				></div>

				<div class="relative text-center">
					<h2 class="mb-4 text-4xl font-bold text-white sm:text-5xl">Готовы начать?</h2>
					<p class="mb-8 text-xl text-gray-300">
						Присоединяйтесь к RUBONUS и начните зарабатывать уже сегодня
					</p>

					<div class="mb-8 grid gap-4 sm:grid-cols-3">
						<div class="flex items-center gap-3 rounded-xl bg-gray-900/50 p-4">
							<div class="flex-shrink-0">
								<svg
									class="h-6 w-6 text-green-400"
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
							</div>
							<span class="text-sm text-gray-300">Простая регистрация</span>
						</div>

						<div class="flex items-center gap-3 rounded-xl bg-gray-900/50 p-4">
							<div class="flex-shrink-0">
								<svg
									class="h-6 w-6 text-green-400"
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
							</div>
							<span class="text-sm text-gray-300">Полностью бесплатно</span>
						</div>

						<div class="flex items-center gap-3 rounded-xl bg-gray-900/50 p-4">
							<div class="flex-shrink-0">
								<svg
									class="h-6 w-6 text-green-400"
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
							</div>
							<span class="text-sm text-gray-300">Мгновенный доступ</span>
						</div>

						<div class="flex items-center gap-3 rounded-xl bg-gray-900/50 p-4">
							<div class="flex-shrink-0">
								<svg
									class="h-6 w-6 text-green-400"
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
							</div>
							<span class="text-sm text-gray-300">Поддержка 24/7</span>
						</div>

						<div class="flex items-center gap-3 rounded-xl bg-gray-900/50 p-4">
							<div class="flex-shrink-0">
								<svg
									class="h-6 w-6 text-green-400"
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
							</div>
							<span class="text-sm text-gray-300">Прозрачные условия</span>
						</div>

						<div class="flex items-center gap-3 rounded-xl bg-gray-900/50 p-4">
							<div class="flex-shrink-0">
								<svg
									class="h-6 w-6 text-green-400"
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
							</div>
							<span class="text-sm text-gray-300">Обучение персонала</span>
						</div>
					</div>

					<a
						href="/register"
						class="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-10 py-4 text-lg font-semibold text-white shadow-2xl shadow-indigo-500/50 transition-all duration-300 hover:scale-105 hover:shadow-indigo-500/70"
					>
						<span>Зарегистрировать компанию</span>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13 7l5 5m0 0l-5 5m5-5H6"
							/>
						</svg>
					</a>

					<p class="mt-4 text-sm text-gray-400">
						Уже есть аккаунт?
						<a href="/login" class="font-semibold text-indigo-400 hover:text-indigo-300"> Войти </a>
					</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Footer -->
	<footer class="relative border-t border-gray-800 py-12">
		<div class="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
			<p class="text-sm text-gray-500">
				&copy; {new Date().getFullYear()} RUBONUS. Все права защищены.
			</p>
		</div>
	</footer>
</div>
