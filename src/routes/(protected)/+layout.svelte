<script>
	import '../../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import {
		visibleMobileMenu,
		closeMobileMenu,
		openMobileMenu
	} from '$lib/state/visibleMobileMenu.svelte';
	import {
		authState,
		logout,
		isAuthenticated,
		getCurrentUserData
	} from '$lib/state/auth.svelte.js';
	import { shouldShowNavItem, getNavigationVisibility } from '$lib/utils/domainAccess.svelte.js';
	import { addSuccessToast, addErrorToast, toasts } from '$lib/utils/toastStore.js';
	import { ToastContainer } from '$lib';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let { children } = $props();

	// Get navigation visibility reactively
	const navigationVisibility = $derived(getNavigationVisibility());

	// Function to check if a route is active
	function isActiveRoute(route) {
		return $page.url.pathname === route;
	}

	// Function to get CSS classes for navigation items
	function getNavClasses(route) {
		const baseClasses =
			'group flex gap-x-3 rounded-lg px-3 py-2.5 text-base/6 font-semibold w-full text-left';
		const activeClasses = 'bg-gray-50 text-indigo-600 dark:bg-white/5 dark:text-white';
		const inactiveClasses =
			'text-gray-900 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white';

		return `${baseClasses} ${isActiveRoute(route) ? activeClasses : inactiveClasses}`;
	}

	// Function to get icon classes for navigation items
	function getIconClasses(route) {
		const baseClasses = 'size-6 shrink-0';
		const activeClasses = 'text-indigo-600 dark:text-white';
		const inactiveClasses = 'text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-white';

		return `${baseClasses} ${isActiveRoute(route) ? activeClasses : inactiveClasses}`;
	}

	// Function to get CSS classes for navigation items with span icons (analytics section)
	function getNavClassesWithSpan(route) {
		const baseClasses =
			'group flex gap-x-3 rounded-lg px-3 py-2.5 text-sm/6 font-semibold w-full text-left';
		const activeClasses = 'bg-gray-50 text-indigo-600 dark:bg-white/5 dark:text-white';
		const inactiveClasses =
			'text-gray-900 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white';

		return `${baseClasses} ${isActiveRoute(route) ? activeClasses : inactiveClasses}`;
	}

	// Function to get span icon classes for analytics navigation items
	function getSpanIconClasses(route) {
		const baseClasses =
			'flex size-6 shrink-0 items-center justify-center rounded-lg border text-[0.625rem] font-medium';
		const activeClasses =
			'border-indigo-600 bg-indigo-600 text-white dark:border-white dark:bg-white dark:text-black';
		const inactiveClasses =
			'border-gray-200 bg-white text-gray-400 group-hover:border-indigo-600 group-hover:text-indigo-600 dark:border-white/10 dark:bg-white/5 dark:group-hover:border-white/20 dark:group-hover:text-white';

		return `${baseClasses} ${isActiveRoute(route) ? activeClasses : inactiveClasses}`;
	}

	// Authentication is initialized globally in root layout
	// No need to initialize here

	// Handle backdrop click to close menu
	function handleBackdropClick(event) {
		if (event.target === event.currentTarget) {
			closeMobileMenu();
		}
	}

	// Handle backdrop keydown to close menu
	function handleBackdropKeydown(event) {
		if (event.key === 'Escape') {
			closeMobileMenu();
		}
	}

	// Handle menu content click to prevent closing
	function handleMenuClick(event) {
		event.stopPropagation();
	}

	// Handle logout with confirmation
	async function handleLogout() {
		if (confirm('Вы уверены, что хотите выйти из системы?')) {
			try {
				const success = await logout();
				if (success) {
					addSuccessToast('Вы успешно вышли из системы');
					goto('/login');
				} else {
					addErrorToast('Произошла ошибка при выходе из системы');
				}
			} catch (error) {
				console.error('Logout error:', error);
				addErrorToast('Произошла ошибка при выходе из системы');
			}
		}
	}

	// Handle navigation for mobile menu
	function handleMobileNavigation(path) {
		closeMobileMenu();
		goto(path);
	}

	// Get user display name
	function getUserDisplayName() {
		const user = getCurrentUserData();
		return user?.name || 'Пользователь';
	}

	// Get user avatar (placeholder for now)
	function getUserAvatar() {
		// For now, return a placeholder avatar
		// In the future, this could be user.avatar_url or similar
		return 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80';
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<!-- Include this script tag or install `@tailwindplus/elements` via npm: -->
<!-- <script src="https://cdn.jsdelivr.net/npm/@tailwindplus/elements@1" type="module"></script> -->
<!--
  This example requires updating your template:

  ```
  <html class="h-full bg-white dark:bg-gray-950">
  <body class="h-full">
  ```
-->

{#if visibleMobileMenu.value}
	<!-- Mobile menu, show/hide based on menu open state. -->
	<div class="lg:hidden" role="dialog" aria-modal="true">
		<!-- Background backdrop, show/hide based on slide-over state. -->
		<div
			class="fixed inset-0 z-50 bg-gray-950/80"
			onclick={handleBackdropClick}
			onkeydown={handleBackdropKeydown}
			tabindex="0"
			role="button"
			aria-label="Close mobile menu"
		></div>
		<div
			class="fixed inset-y-0 left-0 z-50 w-full max-w-xs bg-white px-6 py-4 dark:bg-gray-950"
			onclick={handleMenuClick}
			onkeydown={handleBackdropKeydown}
			role="dialog"
			aria-label="Mobile navigation menu"
			tabindex="0"
		>
			<div class="flex items-center justify-between">
				<!-- <div class="flex h-16 shrink-0 items-center">
					<img
						src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
						alt="Your Company"
						class="h-8 w-auto dark:hidden"
					/>
					<img
						src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500"
						alt="Your Company"
						class="not-dark:hidden h-8 w-auto"
					/>
				</div> -->
				<button
					onclick={closeMobileMenu}
					type="button"
					class="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-white"
				>
					<span class="sr-only">Close sidebar</span>
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
						data-slot="icon"
						aria-hidden="true"
						class="size-6"
					>
						<path d="M6 18 18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</button>
			</div>

			<!-- Navigation content -->
			<nav
				class="mt-8 flex max-h-[calc(100vh-8rem)] flex-1 flex-col overflow-y-auto overflow-x-hidden"
			>
				<ul role="list" class="flex flex-1 flex-col gap-y-5">
					<li>
						<ul role="list" class="space-y-1">
							<li>
								<!-- Current: "bg-gray-50 dark:bg-white/5 text-indigo-600 dark:text-white", Default: "text-gray-900 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5" -->
								<button
									type="button"
									class={getNavClasses('/dashboard')}
									onclick={() => handleMobileNavigation('/dashboard')}
								>
									Дашборд
								</button>
							</li>
						</ul>
					</li>
					{#if navigationVisibility.showClients || navigationVisibility.showAgents || navigationVisibility.showCurators}
						<li>
							<div class="text-xs/6 font-semibold text-gray-400">Менеджмент</div>
							<ul role="list" class="-mx-2 mt-2 space-y-1">
								{#if navigationVisibility.showClients}
									<li>
										<!-- Current: "bg-gray-50 dark:bg-white/5 text-indigo-600 dark:text-white", Default: "text-gray-900 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5" -->
										<button
											type="button"
											class={getNavClassesWithSpan('/clients')}
											onclick={() => handleMobileNavigation('/clients')}
										>
											<span class={getSpanIconClasses('/clients')}>К</span>
											<span class="truncate">Клиенты</span>
										</button>
									</li>
								{/if}
								{#if navigationVisibility.showAgents}
									<li>
										<button
											type="button"
											class={getNavClassesWithSpan('/agents')}
											onclick={() => handleMobileNavigation('/agents')}
										>
											<span class={getSpanIconClasses('/agents')}>А</span>
											<span class="truncate">Агенты</span>
										</button>
									</li>
								{/if}
								{#if navigationVisibility.showCurators}
									<li>
										<button
											type="button"
											class={getNavClassesWithSpan('/curators')}
											onclick={() => handleMobileNavigation('/curators')}
										>
											<span class={getSpanIconClasses('/curators')}>Кр</span>
											<span class="truncate">Кураторы</span>
										</button>
									</li>
								{/if}
							</ul>
						</li>
					{/if}
					{#if navigationVisibility.showContractors || navigationVisibility.showSuppliers || navigationVisibility.showDelivery || navigationVisibility.showServices}
						<li>
							<div class="text-xs/6 font-semibold text-gray-400">Контрагенты</div>
							<ul role="list" class="-mx-2 mt-2 space-y-1">
								{#if navigationVisibility.showContractors}
									<li>
										<button
											type="button"
											class={getNavClassesWithSpan('/contractors')}
											onclick={() => handleMobileNavigation('/contractors')}
										>
											<span class={getSpanIconClasses('/contractors')}>П</span>
											<span class="truncate">Подрядчики</span>
										</button>
									</li>
								{/if}
								{#if navigationVisibility.showSuppliers}
									<li>
										<button
											type="button"
											class={getNavClassesWithSpan('/suppliers')}
											onclick={() => handleMobileNavigation('/suppliers')}
										>
											<span class={getSpanIconClasses('/suppliers')}>Пс</span>
											<span class="truncate">Поставщики</span>
										</button>
									</li>
								{/if}
								{#if navigationVisibility.showDelivery}
									<li>
										<button
											type="button"
											class={getNavClassesWithSpan('/delivery')}
											onclick={() => handleMobileNavigation('/delivery')}
										>
											<span class={getSpanIconClasses('/delivery')}>Д</span>
											<span class="truncate">Доставка</span>
										</button>
									</li>
								{/if}
								{#if navigationVisibility.showServices}
									<li>
										<button
											type="button"
											class={getNavClassesWithSpan('/services')}
											onclick={() => handleMobileNavigation('/services')}
										>
											<span class={getSpanIconClasses('/services')}>С</span>
											<span class="truncate">Сервис</span>
										</button>
									</li>
								{/if}
							</ul>
						</li>
					{/if}
					{#if navigationVisibility.showTz || navigationVisibility.showBz || navigationVisibility.showOrder || navigationVisibility.showProjects}
						<li>
							<div class="text-xs/6 font-semibold text-gray-400">Бизнес-процессы</div>
							<ul role="list" class="-mx-2 mt-2 space-y-1">
								{#if navigationVisibility.showTz}
									<li>
										<button
											type="button"
											class={getNavClassesWithSpan('/tz')}
											onclick={() => handleMobileNavigation('/tz')}
										>
											<span class={getSpanIconClasses('/tz')}>ТЗ</span>
											<span class="truncate">Техзадания</span>
										</button>
									</li>
								{/if}
								{#if navigationVisibility.showOrder}
									<li>
										<button
											type="button"
											class={getNavClassesWithSpan('/order')}
											onclick={() => handleMobileNavigation('/order')}
										>
											<span class={getSpanIconClasses('/order')}>З</span>
											<span class="truncate">Заказы</span>
										</button>
									</li>
								{/if}
								{#if navigationVisibility.showProjects}
									<li>
										<button
											type="button"
											class={getNavClassesWithSpan('/projects')}
											onclick={() => handleMobileNavigation('/projects')}
										>
											<span class={getSpanIconClasses('/projects')}>П</span>
											<span class="truncate">Проекты</span>
										</button>
									</li>
								{/if}
							</ul>
						</li>
					{/if}
					{#if navigationVisibility.showActions || navigationVisibility.showDocumentation}
						<li>
							<div class="text-xs/6 font-semibold text-gray-400">Информация</div>
							<ul role="list" class="-mx-2 mt-2 space-y-1">
								{#if navigationVisibility.showActions}
									<li>
										<button
											type="button"
											class={getNavClassesWithSpan('/actions')}
											onclick={() => handleMobileNavigation('/actions')}
										>
											<span class={getSpanIconClasses('/actions')}>Ак</span>
											<span class="truncate">Акции</span>
										</button>
									</li>
								{/if}
								{#if navigationVisibility.showDocumentation}
									<li>
										<button
											type="button"
											class={getNavClassesWithSpan('/documentation')}
											onclick={() => handleMobileNavigation('/documentation')}
										>
											<span class={getSpanIconClasses('/documentation')}>Док</span>
											<span class="truncate">Документация</span>
										</button>
									</li>
								{/if}
							</ul>
						</li>
					{/if}
					<li class="mt-auto">
						{#if isAuthenticated()}
							<!-- User info section for mobile -->
							<div class="border-t border-gray-200 pt-4 dark:border-white/10">
								<!-- Profile and logout buttons -->
								<div class="mt-2 space-y-1">
									<button
										type="button"
										class="group flex w-full gap-x-3 rounded-lg px-3 py-2.5 text-left text-sm/6 font-semibold text-gray-900 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
										onclick={() => handleMobileNavigation('/profile')}
									>
										<svg
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="1.5"
											data-slot="icon"
											aria-hidden="true"
											class="size-6 shrink-0 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-white"
										>
											<path
												d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
												stroke-linecap="round"
												stroke-linejoin="round"
											/>
										</svg>
										Профиль
									</button>

									<button
										type="button"
										class="group flex w-full gap-x-3 rounded-lg px-3 py-2.5 text-left text-sm/6 font-semibold text-gray-900 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
										onclick={() => handleMobileNavigation('/settings')}
									>
										<svg
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="1.5"
											data-slot="icon"
											aria-hidden="true"
											class="size-6 shrink-0 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-white"
										>
											<path
												d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
												stroke-linecap="round"
												stroke-linejoin="round"
											/>
											<path
												d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
												stroke-linecap="round"
												stroke-linejoin="round"
											/>
										</svg>
										Настройки
									</button>

									<button
										onclick={handleLogout}
										class="group flex w-full cursor-pointer gap-x-3 rounded-lg px-3 py-2.5 text-sm/6 font-semibold text-gray-900 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
									>
										<svg
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="1.5"
											data-slot="icon"
											aria-hidden="true"
											class="size-6 shrink-0 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-white"
										>
											<path
												d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
												stroke-linecap="round"
												stroke-linejoin="round"
											/>
										</svg>
										Выйти
									</button>
								</div>
							</div>
						{:else}
							<!-- Login button for unauthenticated users -->
							<div class="border-t border-gray-200 pt-4 dark:border-white/10">
								<button
									type="button"
									class="group flex w-full gap-x-3 rounded-lg bg-indigo-600 px-3 py-2.5 text-left text-sm/6 font-semibold text-white hover:bg-indigo-500"
									onclick={() => handleMobileNavigation('/login')}
								>
									<svg
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="1.5"
										data-slot="icon"
										aria-hidden="true"
										class="size-6 shrink-0 text-white"
									>
										<path
											d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
									</svg>
									Войти
								</button>
							</div>
						{/if}
					</li>
				</ul>
			</nav>
		</div>
	</div>
{/if}

<!-- Static sidebar for desktop -->
<div class="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col dark:bg-gray-950">
	<!-- Sidebar component, swap this element with another sidebar if you like -->
	<div
		class="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4 dark:border-white/10 dark:bg-gray-950"
	>
		<!-- <div class="flex h-20 shrink-0 items-center">
			<img
				src="https://storage.yandexcloud.net/bonus/logo/logoBC.png"
				alt="Your Company"
				class="h-12 w-auto"
			/>
		</div> -->
		<nav
			class="mt-4 flex max-h-[calc(100vh-4rem)] flex-1 flex-col overflow-y-auto overflow-x-hidden"
		>
			<ul role="list" class="flex flex-1 flex-col gap-y-3">
				<li>
					<ul role="list" class="space-y-1">
						<li>
							<!-- Current: "bg-gray-50 dark:bg-white/5 text-indigo-600 dark:text-white", Default: "text-gray-900 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5" -->
							<a href="/dashboard" class={getNavClasses('/dashboard')}> Дашборд </a>
						</li>
					</ul>
				</li>
				{#if navigationVisibility.showClients || navigationVisibility.showAgents || navigationVisibility.showCurators}
					<li>
						<div class="text-xs/6 font-semibold text-gray-400">Менеджмент</div>
						<ul role="list" class="mt-2 space-y-1">
							{#if navigationVisibility.showClients}
								<li>
									<!-- Current: "bg-gray-50 dark:bg-white/5 text-indigo-600 dark:text-white", Default: "text-gray-900 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5" -->
									<a href="/clients" class={getNavClassesWithSpan('/clients')}>
										<span class={getSpanIconClasses('/clients')}>К</span>
										<span class="truncate">Клиенты</span>
									</a>
								</li>
							{/if}
							{#if navigationVisibility.showAgents}
								<li>
									<a href="/agents" class={getNavClassesWithSpan('/agents')}>
										<span class={getSpanIconClasses('/agents')}>А</span>
										<span class="truncate">Агенты</span>
									</a>
								</li>
							{/if}
							{#if navigationVisibility.showCurators}
								<li>
									<a href="/curators" class={getNavClassesWithSpan('/curators')}>
										<span class={getSpanIconClasses('/curators')}>Кр</span>
										<span class="truncate">Кураторы</span>
									</a>
								</li>
							{/if}
						</ul>
					</li>
				{/if}
				{#if navigationVisibility.showContractors || navigationVisibility.showSuppliers || navigationVisibility.showDelivery || navigationVisibility.showServices}
					<li>
						<div class="text-xs/6 font-semibold text-gray-400">Контрагенты</div>
						<ul role="list" class="mt-2 space-y-1">
							{#if navigationVisibility.showContractors}
								<li>
									<a href="/contractors" class={getNavClassesWithSpan('/contractors')}>
										<span class={getSpanIconClasses('/contractors')}>П</span>
										<span class="truncate">Подрядчики</span>
									</a>
								</li>
							{/if}
							{#if navigationVisibility.showSuppliers}
								<li>
									<a href="/suppliers" class={getNavClassesWithSpan('/suppliers')}>
										<span class={getSpanIconClasses('/suppliers')}>Пс</span>
										<span class="truncate">Поставщики</span>
									</a>
								</li>
							{/if}
							{#if navigationVisibility.showDelivery}
								<li>
									<a href="/delivery" class={getNavClassesWithSpan('/delivery')}>
										<span class={getSpanIconClasses('/delivery')}>Д</span>
										<span class="truncate">Доставка</span>
									</a>
								</li>
							{/if}
							{#if navigationVisibility.showServices}
								<li>
									<a href="/services" class={getNavClassesWithSpan('/services')}>
										<span class={getSpanIconClasses('/services')}>С</span>
										<span class="truncate">Сервис</span>
									</a>
								</li>
							{/if}
						</ul>
					</li>
				{/if}
				{#if navigationVisibility.showTz || navigationVisibility.showBz || navigationVisibility.showOrder || navigationVisibility.showProjects}
					<li>
						<div class="text-xs/6 font-semibold text-gray-400">Бизнес-процессы</div>
						<ul role="list" class="mt-2 space-y-1">
							{#if navigationVisibility.showTz}
								<li>
									<a href="/tz" class={getNavClassesWithSpan('/tz')}>
										<span class={getSpanIconClasses('/tz')}>ТЗ</span>
										<span class="truncate">Техзадания</span>
									</a>
								</li>
							{/if}
							{#if navigationVisibility.showOrder}
								<li>
									<a href="/order" class={getNavClassesWithSpan('/order')}>
										<span class={getSpanIconClasses('/order')}>З</span>
										<span class="truncate">Заказы</span>
									</a>
								</li>
							{/if}
							{#if navigationVisibility.showProjects}
								<li>
									<a href="/projects" class={getNavClassesWithSpan('/projects')}>
										<span class={getSpanIconClasses('/projects')}>П</span>
										<span class="truncate">Проекты</span>
									</a>
								</li>
							{/if}
						</ul>
					</li>
				{/if}
				{#if navigationVisibility.showActions || navigationVisibility.showDocumentation}
					<li>
						<div class="text-xs/6 font-semibold text-gray-400">Информация</div>
						<ul role="list" class="mt-2 space-y-1">
							{#if navigationVisibility.showActions}
								<li>
									<a href="/actions" class={getNavClassesWithSpan('/actions')}>
										<span class={getSpanIconClasses('/actions')}>Ак</span>
										<span class="truncate">Акции</span>
									</a>
								</li>
							{/if}
							{#if navigationVisibility.showDocumentation}
								<li>
									<a href="/documentation" class={getNavClassesWithSpan('/documentation')}>
										<span class={getSpanIconClasses('/documentation')}>Док</span>
										<span class="truncate">Документация</span>
									</a>
								</li>
							{/if}
						</ul>
					</li>
				{/if}
				<li class="mt-auto">
					{#if isAuthenticated()}
						<!-- User info section for desktop -->
						<div class="border-t border-gray-200 pt-4 dark:border-white/10">
							<!-- Profile and logout buttons -->
							<div class="mt-2 space-y-1">
								<a
									href="/profile"
									class="group flex gap-x-3 rounded-lg px-3 py-2.5 text-sm/6 font-semibold text-gray-900 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
								>
									<svg
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="1.5"
										data-slot="icon"
										aria-hidden="true"
										class="size-6 shrink-0 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-white"
									>
										<path
											d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
									</svg>
									Профиль
								</a>

								<a
									href="/settings"
									class="group flex gap-x-3 rounded-lg px-3 py-2.5 text-sm/6 font-semibold text-gray-900 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
								>
									<svg
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="1.5"
										data-slot="icon"
										aria-hidden="true"
										class="size-6 shrink-0 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-white"
									>
										<path
											d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
										<path
											d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
									</svg>
									Настройки
								</a>

								<button
									onclick={handleLogout}
									class="group flex w-full gap-x-3 rounded-lg px-3 py-2.5 text-sm/6 font-semibold text-gray-900 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
								>
									<svg
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="1.5"
										data-slot="icon"
										aria-hidden="true"
										class="size-6 shrink-0 cursor-pointer text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-white"
									>
										<path
											d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
									</svg>
									Выйти
								</button>
							</div>
						</div>
					{:else}
						<!-- Login button for unauthenticated users -->
						<div class="border-t border-gray-200 pt-4 dark:border-white/10">
							<a
								href="/login"
								class="group flex gap-x-3 rounded-lg bg-indigo-600 px-3 py-2.5 text-sm/6 font-semibold text-white hover:bg-indigo-500"
							>
								<svg
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.5"
									data-slot="icon"
									aria-hidden="true"
									class="size-6 shrink-0 text-white"
								>
									<path
										d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
								Войти
							</a>
						</div>
					{/if}
				</li>
			</ul>
		</nav>
	</div>
</div>

<div class="h-screen bg-gray-950 lg:pl-72">
	<div class="sticky top-0 z-20 lg:mx-auto lg:max-w-full">
		<div
			class="shadow-xs flex h-16 items-center gap-x-4 border-b border-gray-200 bg-white px-4 sm:gap-x-6 sm:px-6 lg:px-0 lg:shadow-none dark:border-white/10 dark:bg-gray-950 dark:shadow-none"
		>
			<button
				type="button"
				onclick={openMobileMenu}
				class="-m-2.5 p-2.5 text-gray-900 hover:text-gray-900 lg:hidden dark:text-gray-400 dark:hover:text-white"
			>
				<span class="sr-only">Open sidebar</span>
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
					data-slot="icon"
					aria-hidden="true"
					class="size-6"
				>
					<path
						d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</button>

			<!-- Separator -->
			<div aria-hidden="true" class="h-6 w-px bg-gray-200 lg:hidden dark:bg-gray-950"></div>

			<div class="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
				<form action="#" method="GET" class="grid flex-1 grid-cols-1 pl-8">
					<input
						name="search"
						placeholder="Поиск"
						aria-label="Search"
						class="col-start-1 row-start-1 block size-full border-none bg-white pl-8 text-base text-gray-900 outline-none placeholder:text-gray-400 focus:border-none focus:outline-none focus:ring-0 focus:ring-offset-0 sm:text-sm/6 dark:bg-gray-950 dark:text-white dark:placeholder:text-gray-500"
						style="outline: none !important; box-shadow: none !important;"
					/>
					<svg
						viewBox="0 0 20 20"
						fill="currentColor"
						data-slot="icon"
						aria-hidden="true"
						class="pointer-events-none col-start-1 row-start-1 size-5 self-center text-gray-400"
					>
						<path
							d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
							clip-rule="evenodd"
							fill-rule="evenodd"
						/>
					</svg>
				</form>
				<div class="flex items-center gap-x-4 lg:gap-x-6">
					<button
						type="button"
						class="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500 dark:hover:text-white"
					>
						<span class="sr-only">View notifications</span>
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							data-slot="icon"
							aria-hidden="true"
							class="size-6"
						>
							<path
								d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</button>

					<div
						aria-hidden="true"
						class="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200 dark:lg:bg-white/10"
					></div>

					{#if isAuthenticated()}
						<el-dropdown class="relative">
							<button class="relative flex items-center">
								<span class="absolute -inset-1.5"></span>
								<span class="sr-only">Open user menu</span>
								<!-- <img
									src={getUserAvatar()}
									alt="User avatar"
									class="size-8 rounded-full bg-gray-50 outline -outline-offset-1 outline-black/5 dark:bg-gray-800 dark:outline-white/10"
								/> -->
								<span class="hidden lg:flex lg:items-center">
									<span
										aria-hidden="true"
										class="ml-4 text-sm/6 font-semibold text-gray-900 dark:text-white"
										>Вы вошли под аккаунтом: {getUserDisplayName()}</span
									>
									<svg
										viewBox="0 0 20 20"
										fill="currentColor"
										data-slot="icon"
										aria-hidden="true"
										class="ml-2 size-5 text-gray-400"
									>
										<path
											d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
											clip-rule="evenodd"
											fill-rule="evenodd"
										/>
									</svg>
								</span>
							</button>
							<el-menu
								anchor="bottom end"
								popover="true"
								class="transition-discrete data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in w-32 origin-top-right rounded-md bg-white py-2 shadow-lg outline-1 outline-gray-900/5 transition [--anchor-gap:--spacing(2.5)] dark:bg-gray-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10"
							>
								<a
									href="/profile"
									class="focus:outline-hidden block px-3 py-1 text-sm/6 text-gray-900 focus:bg-gray-50 dark:text-white dark:focus:bg-gray-950"
									>Ваш профиль</a
								>
								<button
									onclick={handleLogout}
									class="focus:outline-hidden block w-full px-3 py-1 text-left text-sm/6 text-gray-900 focus:bg-gray-50 dark:text-white dark:focus:bg-gray-950"
									>Выйти</button
								>
							</el-menu>
						</el-dropdown>
					{:else}
						<!-- Show login button for unauthenticated users -->
						<div class="flex items-center gap-x-2">
							<a
								href="/login"
								class="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
							>
								Войти
							</a>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<main class="bg-gray-950 py-4">
		<div class="px-4 sm:px-6 lg:px-8">
			{@render children?.()}
		</div>
	</main>
</div>

<!-- Toast notifications container at the top level -->
<ToastContainer toasts={$toasts} position="top-center" />
