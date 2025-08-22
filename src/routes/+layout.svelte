<script>
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import {
		visibleMobileMenu,
		closeMobileMenu,
		openMobileMenu
	} from '$lib/state/visibleMobileMenu.svelte';

	let { children } = $props();

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
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<!-- Include this script tag or install `@tailwindplus/elements` via npm: -->
<!-- <script src="https://cdn.jsdelivr.net/npm/@tailwindplus/elements@1" type="module"></script> -->
<!--
  This example requires updating your template:

  ```
  <html class="h-full bg-white dark:bg-gray-900">
  <body class="h-full">
  ```
-->

{#if visibleMobileMenu.value}
	<!-- Mobile menu, show/hide based on menu open state. -->
	<div class="lg:hidden" role="dialog" aria-modal="true">
		<!-- Background backdrop, show/hide based on slide-over state. -->
		<div
			class="fixed inset-0 z-50 bg-gray-900/80"
			onclick={handleBackdropClick}
			onkeydown={handleBackdropKeydown}
			tabindex="0"
			role="button"
			aria-label="Close mobile menu"
		></div>
		<div
			class="fixed inset-y-0 left-0 z-50 w-full max-w-xs bg-white px-6 py-4 dark:bg-gray-900"
			onclick={handleMenuClick}
			onkeydown={handleBackdropKeydown}
			role="dialog"
			aria-label="Mobile navigation menu"
			tabindex="0"
		>
			<div class="flex items-center justify-between">
				<div class="flex h-16 shrink-0 items-center">
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
				</div>
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
			<nav class="mt-8 flex flex-1 flex-col overflow-y-auto">
				<ul role="list" class="flex flex-1 flex-col gap-y-7">
					<li>
						<ul role="list" class="-mx-2 space-y-1">
							<li>
								<!-- Current: "bg-gray-50 dark:bg-white/5 text-indigo-600 dark:text-white", Default: "text-gray-900 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5" -->
								<a
									href="/dashboard"
									class="group flex gap-x-3 rounded-md bg-gray-50 p-2 text-sm/6 font-semibold text-indigo-600 dark:bg-white/5 dark:text-white"
									onclick={closeMobileMenu}
								>
									<svg
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="1.5"
										data-slot="icon"
										aria-hidden="true"
										class="size-6 shrink-0 text-indigo-600 dark:text-white"
									>
										<path
											d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
									</svg>
									Дашборд
								</a>
							</li>
							<li>
								<a
									href="/agents"
									class="group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold text-gray-900 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
									onclick={closeMobileMenu}
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
											d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
									</svg>
									Агенты
								</a>
							</li>
							<li>
								<a
									href="/curators"
									class="group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold text-gray-900 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
									onclick={closeMobileMenu}
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
											d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
									</svg>
									Кураторы
								</a>
							</li>
							<li>
								<a
									href="/contractors"
									class="group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold text-gray-900 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
									onclick={closeMobileMenu}
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
											d="M2.25 21h19.5m-18-18v18m2.25-18v18m13.5-18v18M6.75 7.5h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H12m-1.5 3H12m-1.5 3H12m3-6h1.5m-1.5 3h1.5m-1.5 3h1.5M3.75 7.5v.75c0 .414.336.75.75.75h.75V7.5h-.75a.75.75 0 0 0-.75.75ZM3.75 12v.75c0 .414.336.75.75.75h.75V12h-.75a.75.75 0 0 0-.75.75Zm0 4.5v.75c0 .414.336.75.75.75h.75v-1.5h-.75a.75.75 0 0 0-.75.75Z"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
									</svg>
									Контрагенты
								</a>
							</li>
							<li>
								<a
									href="/suppliers"
									class="group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold text-gray-900 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
									onclick={closeMobileMenu}
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
											d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m4.5 4.5V16.5a1.5 1.5 0 0 1 3-1.5m3 3.75h1.5a1.5 1.5 0 0 0 1.5-1.5V16.5a1.5 1.5 0 0 1 3-1.5m-6 3V16.5a1.5 1.5 0 0 1 1.5-1.5h1.5a1.5 1.5 0 0 1 1.5 1.5v1.5m0 0V18a2.25 2.25 0 0 0 4.5 0V16.5h-4.5Z"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
									</svg>
									Поставщики
								</a>
							</li>
							<li>
								<a
									href="/services"
									class="group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold text-gray-900 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
									onclick={closeMobileMenu}
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
											d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655-4.653c-.143-.467-.384-.89-.766-1.207m13.5-9.228-4.39 5.584m0 0c.9-.556 2.427-.465 3.494.315a3.8 3.8 0 0 1 .315 3.494M8.5 6.5a5 5 0 1 1-7.071 7.071"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
									</svg>
									Сервис
								</a>
							</li>
						</ul>
					</li>
					<li>
						<div class="text-xs/6 font-semibold text-gray-400">Аналитика</div>
						<ul role="list" class="-mx-2 mt-2 space-y-1">
							<li>
								<!-- Current: "bg-gray-50 dark:bg-white/5 text-indigo-600 dark:text-white", Default: "text-gray-900 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5" -->
								<a
									href="/clients"
									class="group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold text-gray-900 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
									onclick={closeMobileMenu}
								>
									<span
										class="flex size-6 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-[0.625rem] font-medium text-gray-400 group-hover:border-indigo-600 group-hover:text-indigo-600 dark:border-white/10 dark:bg-white/5 dark:group-hover:border-white/20 dark:group-hover:text-white"
										>К</span
									>
									<span class="truncate">Клиенты</span>
								</a>
							</li>
							<li>
								<a
									href="/projects"
									class="group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold text-gray-900 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
									onclick={closeMobileMenu}
								>
									<span
										class="flex size-6 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-[0.625rem] font-medium text-gray-400 group-hover:border-indigo-600 group-hover:text-indigo-600 dark:border-white/10 dark:bg-white/5 dark:group-hover:border-white/20 dark:group-hover:text-white"
										>П</span
									>
									<span class="truncate">Проекты</span>
								</a>
							</li>
							<li>
								<a
									href="/finance"
									class="group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold text-gray-900 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
									onclick={closeMobileMenu}
								>
									<span
										class="flex size-6 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-[0.625rem] font-medium text-gray-400 group-hover:border-indigo-600 group-hover:text-indigo-600 dark:border-white/10 dark:bg-white/5 dark:group-hover:border-white/20 dark:group-hover:text-white"
										>Ф</span
									>
									<span class="truncate">Финансы</span>
								</a>
							</li>
						</ul>
					</li>
					<li class="mt-auto">
						<a
							href="/settings"
							class="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold text-gray-900 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
							command="close"
							commandfor="sidebar"
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
					</li>
				</ul>
			</nav>
		</div>
	</div>
{/if}

<!-- Static sidebar for desktop -->
<div class="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col dark:bg-gray-900">
	<!-- Sidebar component, swap this element with another sidebar if you like -->
	<div
		class="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4 dark:border-white/10 dark:bg-gray-900"
	>
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
		<nav class="mt-20 flex flex-1 flex-col">
			<ul role="list" class="flex flex-1 flex-col gap-y-7">
				<li>
					<ul role="list" class="-mx-2 space-y-1">
						<li>
							<!-- Current: "bg-gray-50 dark:bg-white/5 text-indigo-600 dark:text-white", Default: "text-gray-900 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5" -->
							<a
								href="/dashboard"
								class="group flex gap-x-3 rounded-md bg-gray-50 p-2 text-sm/6 font-semibold text-indigo-600 dark:bg-white/5 dark:text-white"
							>
								<svg
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.5"
									data-slot="icon"
									aria-hidden="true"
									class="size-6 shrink-0 text-indigo-600 dark:text-white"
								>
									<path
										d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
								Дашборд
							</a>
						</li>
						<li>
							<a
								href="/agents"
								class="group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold text-gray-900 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
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
										d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
								Агенты
							</a>
						</li>
						<li>
							<a
								href="/curators"
								class="group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold text-gray-900 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
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
										d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
								Кураторы
							</a>
						</li>
						<li>
							<a
								href="/contractors"
								class="group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold text-gray-900 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
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
										d="M2.25 21h19.5m-18-18v18m2.25-18v18m13.5-18v18M6.75 7.5h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H12m-1.5 3H12m-1.5 3H12m3-6h1.5m-1.5 3h1.5m-1.5 3h1.5M3.75 7.5v.75c0 .414.336.75.75.75h.75V7.5h-.75a.75.75 0 0 0-.75.75ZM3.75 12v.75c0 .414.336.75.75.75h.75V12h-.75a.75.75 0 0 0-.75.75Zm0 4.5v.75c0 .414.336.75.75.75h.75v-1.5h-.75a.75.75 0 0 0-.75.75Z"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
								Контрагенты
							</a>
						</li>
						<li>
							<a
								href="/suppliers"
								class="group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold text-gray-900 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
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
										d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m4.5 4.5V16.5a1.5 1.5 0 0 1 3-1.5m3 3.75h1.5a1.5 1.5 0 0 0 1.5-1.5V16.5a1.5 1.5 0 0 1 3-1.5m-6 3V16.5a1.5 1.5 0 0 1 1.5-1.5h1.5a1.5 1.5 0 0 1 1.5 1.5v1.5m0 0V18a2.25 2.25 0 0 0 4.5 0V16.5h-4.5Z"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
								Поставщики
							</a>
						</li>
						<li>
							<a
								href="/services"
								class="group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold text-gray-900 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
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
										d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655-4.653c-.143-.467-.384-.89-.766-1.207m13.5-9.228-4.39 5.584m0 0c.9-.556 2.427-.465 3.494.315a3.8 3.8 0 0 1 .315 3.494M8.5 6.5a5 5 0 1 1-7.071 7.071"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
								Сервис
							</a>
						</li>
					</ul>
				</li>
				<li>
					<div class="text-xs/6 font-semibold text-gray-400">Аналитика</div>
					<ul role="list" class="-mx-2 mt-2 space-y-1">
						<li>
							<!-- Current: "bg-gray-50 dark:bg-white/5 text-indigo-600 dark:text-white", Default: "text-gray-900 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5" -->
							<a
								href="/clients"
								class="group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold text-gray-900 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
							>
								<span
									class="flex size-6 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-[0.625rem] font-medium text-gray-400 group-hover:border-indigo-600 group-hover:text-indigo-600 dark:border-white/10 dark:bg-white/5 dark:group-hover:border-white/20 dark:group-hover:text-white"
									>H</span
								>
								<span class="truncate">Клиенты</span>
							</a>
						</li>
						<li>
							<a
								href="/projects"
								class="group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold text-gray-900 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
							>
								<span
									class="flex size-6 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-[0.625rem] font-medium text-gray-400 group-hover:border-indigo-600 group-hover:text-indigo-600 dark:border-white/10 dark:bg-white/5 dark:group-hover:border-white/20 dark:group-hover:text-white"
									>T</span
								>
								<span class="truncate">Проекты</span>
							</a>
						</li>
						<li>
							<a
								href="/finance"
								class="group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold text-gray-900 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
							>
								<span
									class="flex size-6 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-[0.625rem] font-medium text-gray-400 group-hover:border-indigo-600 group-hover:text-indigo-600 dark:border-white/10 dark:bg-white/5 dark:group-hover:border-white/20 dark:group-hover:text-white"
									>W</span
								>
								<span class="truncate">Финансы</span>
							</a>
						</li>
					</ul>
				</li>
				<li class="mt-auto">
					<a
						href="/settings"
						class="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold text-gray-900 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white"
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
				</li>
			</ul>
		</nav>
	</div>
</div>

<div class="lg:pl-72">
	<div class="sticky top-0 z-40 lg:mx-auto lg:max-w-full">
		<div
			class="shadow-xs flex h-16 items-center gap-x-4 border-b border-gray-200 bg-white px-4 sm:gap-x-6 sm:px-6 lg:px-0 lg:shadow-none dark:border-white/10 dark:bg-gray-900 dark:shadow-none"
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
			<div aria-hidden="true" class="h-6 w-px bg-gray-200 lg:hidden dark:bg-gray-900"></div>

			<div class="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
				<form action="#" method="GET" class="grid flex-1 grid-cols-1 pl-8">
					<input
						name="search"
						placeholder="Поиск"
						aria-label="Search"
						class="col-start-1 row-start-1 block size-full border-none bg-white pl-8 text-base text-gray-900 outline-none placeholder:text-gray-400 focus:border-none focus:outline-none focus:ring-0 focus:ring-offset-0 sm:text-sm/6 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500"
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

					<!-- Separator -->
					<div
						aria-hidden="true"
						class="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200 dark:lg:bg-white/10"
					></div>

					<!-- Profile dropdown -->
					<el-dropdown class="relative">
						<button class="relative flex items-center">
							<span class="absolute -inset-1.5"></span>
							<span class="sr-only">Open user menu</span>
							<img
								src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
								alt=""
								class="size-8 rounded-full bg-gray-50 outline -outline-offset-1 outline-black/5 dark:bg-gray-800 dark:outline-white/10"
							/>
							<span class="hidden lg:flex lg:items-center">
								<span
									aria-hidden="true"
									class="ml-4 text-sm/6 font-semibold text-gray-900 dark:text-white">Tom Cook</span
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
							popover
							class="transition-discrete data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in w-32 origin-top-right rounded-md bg-white py-2 shadow-lg outline-1 outline-gray-900/5 transition [--anchor-gap:--spacing(2.5)] dark:bg-gray-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10"
						>
							<a
								href="/profile"
								class="focus:outline-hidden block px-3 py-1 text-sm/6 text-gray-900 focus:bg-gray-50 dark:text-white dark:focus:bg-gray-900"
								>Ваш профиль</a
							>
							<a
								href="/logout"
								class="focus:outline-hidden block px-3 py-1 text-sm/6 text-gray-900 focus:bg-gray-50 dark:text-white dark:focus:bg-gray-900"
								>Выйти</a
							>
						</el-menu>
					</el-dropdown>
				</div>
			</div>
		</div>
	</div>

	<main class="py-4">
		<div class="mx-auto px-4 sm:px-6 lg:px-8">
			{@render children?.()}
		</div>
	</main>
</div>
