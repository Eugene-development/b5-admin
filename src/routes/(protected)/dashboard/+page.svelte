<script>
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte';
	import { getNavigationVisibility } from '$lib/utils/domainAccess.svelte.js';

	// Get navigation visibility reactively
	const navigationVisibility = $derived(getNavigationVisibility());
</script>

<ProtectedRoute>
	{#snippet children()}
		<div class="space-y-8">
			<div>
				<h1 class="text-2xl font-bold text-gray-900 dark:text-white">
					Доступные вашему аккаунту модуля
				</h1>
				<!-- <p class="my-4 text-gray-600 dark:text-gray-400">
					Ниже представлены доступные вашему аккаунту модуля системы.
				</p> -->
			</div>

			<!-- Менеджмент -->
			{#if navigationVisibility.showClients || navigationVisibility.showAgents || navigationVisibility.showCurators || navigationVisibility.showManagers || navigationVisibility.showDesigners}
				<div>
					<h2 class="mb-4 text-lg font-semibold text-gray-400">Менеджмент</h2>
					<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
						{#if navigationVisibility.showClients}
							<a
								href="/clients"
								class="group relative flex min-h-[100px] items-center gap-4 overflow-hidden rounded-xl border border-pink-200/50 bg-gradient-to-br from-pink-50 via-white to-rose-50 p-6 shadow-lg transition-all duration-300 focus-within:ring-2 focus-within:ring-pink-500 focus-within:ring-offset-2 hover:scale-[1.02] hover:border-pink-300 hover:shadow-xl dark:border-pink-900/30 dark:from-pink-950/20 dark:via-gray-800 dark:to-rose-950/20 dark:hover:border-pink-700"
							>
								<div
									class="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-pink-400/10 to-rose-400/10 blur-2xl transition-all duration-300 group-hover:scale-150"
								></div>
								<span
									class="relative inline-flex flex-shrink-0 rounded-xl bg-gradient-to-br from-pink-400 to-rose-400 p-3 text-white shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-pink-400/50"
								>
									<svg
										class="h-6 w-6"
										fill="none"
										viewBox="0 0 24 24"
										stroke-width="1.5"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
										/>
									</svg>
								</span>
								<div class="relative">
									<h3
										class="text-base font-semibold leading-6 text-gray-900 transition-colors group-hover:text-pink-600 dark:text-white dark:group-hover:text-pink-400"
									>
										<span class="absolute inset-0" aria-hidden="true"></span>
										Клиенты
									</h3>
									<p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Управление клиентами</p>
								</div>
							</a>
						{/if}

						{#if navigationVisibility.showAgents}
							<a
								href="/agents"
								class="group relative flex min-h-[100px] items-center gap-4 overflow-hidden rounded-xl border border-indigo-200/50 bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-6 shadow-lg transition-all duration-300 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:scale-[1.02] hover:border-indigo-300 hover:shadow-xl dark:border-indigo-900/30 dark:from-indigo-950/20 dark:via-gray-800 dark:to-blue-950/20 dark:hover:border-indigo-700"
							>
								<div
									class="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-indigo-400/10 to-blue-400/10 blur-2xl transition-all duration-300 group-hover:scale-150"
								></div>
								<span
									class="relative inline-flex flex-shrink-0 rounded-xl bg-gradient-to-br from-indigo-400 to-blue-400 p-3 text-white shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-indigo-400/50"
								>
									<svg
										class="h-6 w-6"
										fill="none"
										viewBox="0 0 24 24"
										stroke-width="1.5"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
										/>
									</svg>
								</span>
								<div class="relative">
									<h3
										class="text-base font-semibold leading-6 text-gray-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400"
									>
										<span class="absolute inset-0" aria-hidden="true"></span>
										Агенты
									</h3>
									<p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
										Управление агентами системы
									</p>
								</div>
							</a>
						{/if}

						{#if navigationVisibility.showCurators}
							<a
								href="/curators"
								class="group relative flex min-h-[100px] items-center gap-4 overflow-hidden rounded-xl border border-cyan-200/50 bg-gradient-to-br from-cyan-50 via-white to-sky-50 p-6 shadow-lg transition-all duration-300 focus-within:ring-2 focus-within:ring-cyan-500 focus-within:ring-offset-2 hover:scale-[1.02] hover:border-cyan-300 hover:shadow-xl dark:border-cyan-900/30 dark:from-cyan-950/20 dark:via-gray-800 dark:to-sky-950/20 dark:hover:border-cyan-700"
							>
								<div
									class="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-cyan-400/10 to-sky-400/10 blur-2xl transition-all duration-300 group-hover:scale-150"
								></div>
								<span
									class="relative inline-flex flex-shrink-0 rounded-xl bg-gradient-to-br from-cyan-400 to-sky-400 p-3 text-white shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-cyan-400/50"
								>
									<svg
										class="h-6 w-6"
										fill="none"
										viewBox="0 0 24 24"
										stroke-width="1.5"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"
										/>
									</svg>
								</span>
								<div class="relative">
									<h3
										class="text-base font-semibold leading-6 text-gray-900 transition-colors group-hover:text-cyan-600 dark:text-white dark:group-hover:text-cyan-400"
									>
										<span class="absolute inset-0" aria-hidden="true"></span>
										Кураторы
									</h3>
									<p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Управление кураторами</p>
								</div>
							</a>
						{/if}

						{#if navigationVisibility.showManagers}
							<a
								href="/managers"
								class="group relative flex min-h-[100px] items-center gap-4 overflow-hidden rounded-xl border border-violet-200/50 bg-gradient-to-br from-violet-50 via-white to-purple-50 p-6 shadow-lg transition-all duration-300 focus-within:ring-2 focus-within:ring-violet-500 focus-within:ring-offset-2 hover:scale-[1.02] hover:border-violet-300 hover:shadow-xl dark:border-violet-900/30 dark:from-violet-950/20 dark:via-gray-800 dark:to-purple-950/20 dark:hover:border-violet-700"
							>
								<div
									class="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-violet-400/10 to-purple-400/10 blur-2xl transition-all duration-300 group-hover:scale-150"
								></div>
								<span
									class="relative inline-flex flex-shrink-0 rounded-xl bg-gradient-to-br from-violet-400 to-purple-400 p-3 text-white shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-violet-400/50"
								>
									<svg
										class="h-6 w-6"
										fill="none"
										viewBox="0 0 24 24"
										stroke-width="1.5"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z"
										/>
									</svg>
								</span>
								<div class="relative">
									<h3
										class="text-base font-semibold leading-6 text-gray-900 transition-colors group-hover:text-violet-600 dark:text-white dark:group-hover:text-violet-400"
									>
										<span class="absolute inset-0" aria-hidden="true"></span>
										Менеджеры
									</h3>
									<p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
										Управление менеджерами
									</p>
								</div>
							</a>
						{/if}

						{#if navigationVisibility.showDesigners}
							<a
								href="/designers"
								class="group relative flex min-h-[100px] items-center gap-4 overflow-hidden rounded-xl border border-fuchsia-200/50 bg-gradient-to-br from-fuchsia-50 via-white to-pink-50 p-6 shadow-lg transition-all duration-300 focus-within:ring-2 focus-within:ring-fuchsia-500 focus-within:ring-offset-2 hover:scale-[1.02] hover:border-fuchsia-300 hover:shadow-xl dark:border-fuchsia-900/30 dark:from-fuchsia-950/20 dark:via-gray-800 dark:to-pink-950/20 dark:hover:border-fuchsia-700"
							>
								<div
									class="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-fuchsia-400/10 to-pink-400/10 blur-2xl transition-all duration-300 group-hover:scale-150"
								></div>
								<span
									class="relative inline-flex flex-shrink-0 rounded-xl bg-gradient-to-br from-fuchsia-400 to-pink-400 p-3 text-white shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-fuchsia-400/50"
								>
									<svg
										class="h-6 w-6"
										fill="none"
										viewBox="0 0 24 24"
										stroke-width="1.5"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42"
										/>
									</svg>
								</span>
								<div class="relative">
									<h3
										class="text-base font-semibold leading-6 text-gray-900 transition-colors group-hover:text-fuchsia-600 dark:text-white dark:group-hover:text-fuchsia-400"
									>
										<span class="absolute inset-0" aria-hidden="true"></span>
										Дизайнеры
									</h3>
									<p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
										Управление дизайнерами
									</p>
								</div>
							</a>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Контрагенты -->
			{#if navigationVisibility.showContractors || navigationVisibility.showSuppliers || navigationVisibility.showDelivery || navigationVisibility.showServices}
				<div>
					<h2 class="mb-4 text-lg font-semibold text-gray-400">Контрагенты</h2>
					<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
						{#if navigationVisibility.showContractors}
							<a
								href="/contractors"
								class="group relative flex min-h-[100px] items-center gap-4 overflow-hidden rounded-xl border border-blue-200/50 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6 shadow-lg transition-all duration-300 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 hover:scale-[1.02] hover:border-blue-300 hover:shadow-xl dark:border-blue-900/30 dark:from-blue-950/20 dark:via-gray-800 dark:to-indigo-950/20 dark:hover:border-blue-700"
							>
								<div
									class="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-blue-400/10 to-indigo-400/10 blur-2xl transition-all duration-300 group-hover:scale-150"
								></div>
								<span
									class="relative inline-flex flex-shrink-0 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-400 p-3 text-white shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-blue-400/50"
								>
									<svg
										class="h-6 w-6"
										fill="none"
										viewBox="0 0 24 24"
										stroke-width="1.5"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"
										/>
									</svg>
								</span>
								<div class="relative">
									<h3
										class="text-base font-semibold leading-6 text-gray-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400"
									>
										<span class="absolute inset-0" aria-hidden="true"></span>
										Подрядчики
									</h3>
									<p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
										Управление подрядчиками
									</p>
								</div>
							</a>
						{/if}

						{#if navigationVisibility.showSuppliers}
							<a
								href="/suppliers"
								class="group relative flex min-h-[100px] items-center gap-4 overflow-hidden rounded-xl border border-green-200/50 bg-gradient-to-br from-green-50 via-white to-emerald-50 p-6 shadow-lg transition-all duration-300 focus-within:ring-2 focus-within:ring-green-500 focus-within:ring-offset-2 hover:scale-[1.02] hover:border-green-300 hover:shadow-xl dark:border-green-900/30 dark:from-green-950/20 dark:via-gray-800 dark:to-emerald-950/20 dark:hover:border-green-700"
							>
								<div
									class="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-green-400/10 to-emerald-400/10 blur-2xl transition-all duration-300 group-hover:scale-150"
								></div>
								<span
									class="relative inline-flex flex-shrink-0 rounded-xl bg-gradient-to-br from-green-400 to-emerald-400 p-3 text-white shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-green-400/50"
								>
									<svg
										class="h-6 w-6"
										fill="none"
										viewBox="0 0 24 24"
										stroke-width="1.5"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z"
										/>
									</svg>
								</span>
								<div class="relative">
									<h3
										class="text-base font-semibold leading-6 text-gray-900 transition-colors group-hover:text-green-600 dark:text-white dark:group-hover:text-green-400"
									>
										<span class="absolute inset-0" aria-hidden="true"></span>
										Поставщики
									</h3>
									<p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
										Управление поставщиками
									</p>
								</div>
							</a>
						{/if}

						{#if navigationVisibility.showDelivery}
							<a
								href="/delivery"
								class="group relative flex min-h-[100px] items-center gap-4 overflow-hidden rounded-xl border border-orange-200/50 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-6 shadow-lg transition-all duration-300 focus-within:ring-2 focus-within:ring-orange-500 focus-within:ring-offset-2 hover:scale-[1.02] hover:border-orange-300 hover:shadow-xl dark:border-orange-900/30 dark:from-orange-950/20 dark:via-gray-800 dark:to-amber-950/20 dark:hover:border-orange-700"
							>
								<div
									class="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-orange-400/10 to-amber-400/10 blur-2xl transition-all duration-300 group-hover:scale-150"
								></div>
								<span
									class="relative inline-flex flex-shrink-0 rounded-xl bg-gradient-to-br from-orange-400 to-amber-400 p-3 text-white shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-orange-400/50"
								>
									<svg
										class="h-6 w-6"
										fill="none"
										viewBox="0 0 24 24"
										stroke-width="1.5"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M8.25 18.75a1.5 1.5 0 01-3 0 1.5 1.5 0 013 0zM19.5 18.75a1.5 1.5 0 01-3 0 1.5 1.5 0 013 0zM3 7.5h2.25L8.5 15h8.25l2.25-7.5H21M6 3h15l-1 5.25"
										/>
									</svg>
								</span>
								<div class="relative">
									<h3
										class="text-base font-semibold leading-6 text-gray-900 transition-colors group-hover:text-orange-600 dark:text-white dark:group-hover:text-orange-400"
									>
										<span class="absolute inset-0" aria-hidden="true"></span>
										Службы доставки
									</h3>
									<p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Управление доставкой</p>
								</div>
							</a>
						{/if}

						{#if navigationVisibility.showServices}
							<a
								href="/services"
								class="group relative flex min-h-[100px] items-center gap-4 overflow-hidden rounded-xl border border-teal-200/50 bg-gradient-to-br from-teal-50 via-white to-cyan-50 p-6 shadow-lg transition-all duration-300 focus-within:ring-2 focus-within:ring-teal-500 focus-within:ring-offset-2 hover:scale-[1.02] hover:border-teal-300 hover:shadow-xl dark:border-teal-900/30 dark:from-teal-950/20 dark:via-gray-800 dark:to-cyan-950/20 dark:hover:border-teal-700"
							>
								<div
									class="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-teal-400/10 to-cyan-400/10 blur-2xl transition-all duration-300 group-hover:scale-150"
								></div>
								<span
									class="relative inline-flex flex-shrink-0 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-400 p-3 text-white shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-teal-400/50"
								>
									<svg
										class="h-6 w-6"
										fill="none"
										viewBox="0 0 24 24"
										stroke-width="1.5"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"
										/>
									</svg>
								</span>
								<div class="relative">
									<h3
										class="text-base font-semibold leading-6 text-gray-900 transition-colors group-hover:text-teal-600 dark:text-white dark:group-hover:text-teal-400"
									>
										<span class="absolute inset-0" aria-hidden="true"></span>
										Сервис
									</h3>
									<p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Управление сервисом</p>
								</div>
							</a>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Бизнес-процессы -->
			{#if navigationVisibility.showProjects || navigationVisibility.showTz || navigationVisibility.showOrder}
				<div>
					<h2 class="mb-4 text-lg font-semibold text-gray-400">Бизнес-процессы</h2>
					<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
						{#if navigationVisibility.showProjects}
							<a
								href="/projects"
								class="group relative flex min-h-[100px] items-center gap-4 overflow-hidden rounded-xl border border-purple-200/50 bg-gradient-to-br from-purple-50 via-white to-fuchsia-50 p-6 shadow-lg transition-all duration-300 focus-within:ring-2 focus-within:ring-purple-500 focus-within:ring-offset-2 hover:scale-[1.02] hover:border-purple-300 hover:shadow-xl dark:border-purple-900/30 dark:from-purple-950/20 dark:via-gray-800 dark:to-fuchsia-950/20 dark:hover:border-purple-700"
							>
								<div
									class="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-purple-400/10 to-fuchsia-400/10 blur-2xl transition-all duration-300 group-hover:scale-150"
								></div>
								<span
									class="relative inline-flex flex-shrink-0 rounded-xl bg-gradient-to-br from-purple-400 to-fuchsia-400 p-3 text-white shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-purple-400/50"
								>
									<svg
										class="h-6 w-6"
										fill="none"
										viewBox="0 0 24 24"
										stroke-width="1.5"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
										/>
									</svg>
								</span>
								<div class="relative">
									<h3
										class="text-base font-semibold leading-6 text-gray-900 transition-colors group-hover:text-purple-600 dark:text-white dark:group-hover:text-purple-400"
									>
										<span class="absolute inset-0" aria-hidden="true"></span>
										Проекты
									</h3>
									<p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Управление проектами</p>
								</div>
							</a>
						{/if}

						{#if navigationVisibility.showTz}
							<a
								href="/tz"
								class="group relative flex min-h-[100px] items-center gap-4 overflow-hidden rounded-xl border border-yellow-200/50 bg-gradient-to-br from-yellow-50 via-white to-amber-50 p-6 shadow-lg transition-all duration-300 focus-within:ring-2 focus-within:ring-yellow-500 focus-within:ring-offset-2 hover:scale-[1.02] hover:border-yellow-300 hover:shadow-xl dark:border-yellow-900/30 dark:from-yellow-950/20 dark:via-gray-800 dark:to-amber-950/20 dark:hover:border-yellow-700"
							>
								<div
									class="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-yellow-400/10 to-amber-400/10 blur-2xl transition-all duration-300 group-hover:scale-150"
								></div>
								<span
									class="relative inline-flex flex-shrink-0 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-400 p-3 text-white shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-yellow-400/50"
								>
									<svg
										class="h-6 w-6"
										fill="none"
										viewBox="0 0 24 24"
										stroke-width="1.5"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
										/>
									</svg>
								</span>
								<div class="relative">
									<h3
										class="text-base font-semibold leading-6 text-gray-900 transition-colors group-hover:text-yellow-600 dark:text-white dark:group-hover:text-yellow-400"
									>
										<span class="absolute inset-0" aria-hidden="true"></span>
										Техзадания
									</h3>
									<p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
										Управление техзаданиями
									</p>
								</div>
							</a>
						{/if}

						<!-- Contracts Card -->
						<a
							href="/contracts"
							class="group relative flex min-h-[100px] items-center gap-4 overflow-hidden rounded-xl border border-emerald-200/50 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6 shadow-lg transition-all duration-300 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-2 hover:scale-[1.02] hover:border-emerald-300 hover:shadow-xl dark:border-emerald-900/30 dark:from-emerald-950/20 dark:via-gray-800 dark:to-teal-950/20 dark:hover:border-emerald-700"
						>
							<div
								class="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-emerald-400/10 to-teal-400/10 blur-2xl transition-all duration-300 group-hover:scale-150"
							></div>
							<span
								class="relative inline-flex flex-shrink-0 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-400 p-3 text-white shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-emerald-400/50"
							>
								<svg
									class="h-6 w-6"
									fill="none"
									viewBox="0 0 24 24"
									stroke-width="1.5"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
									/>
								</svg>
							</span>
							<div class="relative">
								<h3
									class="text-base font-semibold leading-6 text-gray-900 transition-colors group-hover:text-emerald-600 dark:text-white dark:group-hover:text-emerald-400"
								>
									<span class="absolute inset-0" aria-hidden="true"></span>
									Контракты
								</h3>
								<p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Управление контрактами</p>
							</div>
						</a>

						{#if navigationVisibility.showOrder}
							<a
								href="/order"
								class="group relative flex min-h-[100px] items-center gap-4 overflow-hidden rounded-xl border border-lime-200/50 bg-gradient-to-br from-lime-50 via-white to-green-50 p-6 shadow-lg transition-all duration-300 focus-within:ring-2 focus-within:ring-lime-500 focus-within:ring-offset-2 hover:scale-[1.02] hover:border-lime-300 hover:shadow-xl dark:border-lime-900/30 dark:from-lime-950/20 dark:via-gray-800 dark:to-green-950/20 dark:hover:border-lime-700"
							>
								<div
									class="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-lime-400/10 to-green-400/10 blur-2xl transition-all duration-300 group-hover:scale-150"
								></div>
								<span
									class="relative inline-flex flex-shrink-0 rounded-xl bg-gradient-to-br from-lime-400 to-green-400 p-3 text-white shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-lime-400/50"
								>
									<svg
										class="h-6 w-6"
										fill="none"
										viewBox="0 0 24 24"
										stroke-width="1.5"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
										/>
									</svg>
								</span>
								<div class="relative">
									<h3
										class="text-base font-semibold leading-6 text-gray-900 transition-colors group-hover:text-lime-600 dark:text-white dark:group-hover:text-lime-400"
									>
										<span class="absolute inset-0" aria-hidden="true"></span>
										Закупка
									</h3>
									<p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Работа с закупками</p>
								</div>
							</a>
						{/if}

						<!-- Complaints Card -->
						<a
							href="/complaints"
							class="group relative flex min-h-[100px] items-center gap-4 overflow-hidden rounded-xl border border-orange-200/50 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-6 shadow-lg transition-all duration-300 focus-within:ring-2 focus-within:ring-orange-500 focus-within:ring-offset-2 hover:scale-[1.02] hover:border-orange-300 hover:shadow-xl dark:border-orange-900/30 dark:from-orange-950/20 dark:via-gray-800 dark:to-amber-950/20 dark:hover:border-orange-700"
						>
							<div
								class="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-orange-400/10 to-amber-400/10 blur-2xl transition-all duration-300 group-hover:scale-150"
							></div>
							<span
								class="relative inline-flex flex-shrink-0 rounded-xl bg-gradient-to-br from-orange-400 to-amber-400 p-3 text-white shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-orange-400/50"
							>
								<svg
									class="h-6 w-6"
									fill="none"
									viewBox="0 0 24 24"
									stroke-width="1.5"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
									/>
								</svg>
							</span>
							<div class="relative">
								<h3
									class="text-base font-semibold leading-6 text-gray-900 transition-colors group-hover:text-orange-600 dark:text-white dark:group-hover:text-orange-400"
								>
									<span class="absolute inset-0" aria-hidden="true"></span>
									Рекламации
								</h3>
								<p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Управление рекламациями</p>
							</div>
						</a>
					</div>
				</div>
			{/if}

			<!-- Информация -->
			{#if navigationVisibility.showActions || navigationVisibility.showDocumentation}
				<div>
					<h2 class="mb-4 text-lg font-semibold text-gray-400">Информация</h2>
					<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
						{#if navigationVisibility.showActions}
							<a
								href="/actions"
								class="group relative flex min-h-[100px] items-center gap-4 overflow-hidden rounded-xl border border-red-200/50 bg-gradient-to-br from-red-50 via-white to-rose-50 p-6 shadow-lg transition-all duration-300 focus-within:ring-2 focus-within:ring-red-500 focus-within:ring-offset-2 hover:scale-[1.02] hover:border-red-300 hover:shadow-xl dark:border-red-900/30 dark:from-red-950/20 dark:via-gray-800 dark:to-rose-950/20 dark:hover:border-red-700"
							>
								<div
									class="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-red-400/10 to-rose-400/10 blur-2xl transition-all duration-300 group-hover:scale-150"
								></div>
								<span
									class="relative inline-flex flex-shrink-0 rounded-xl bg-gradient-to-br from-red-400 to-rose-400 p-3 text-white shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-red-400/50"
								>
									<svg
										class="h-6 w-6"
										fill="none"
										viewBox="0 0 24 24"
										stroke-width="1.5"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"
										/>
										<path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6z" />
									</svg>
								</span>
								<div class="relative">
									<h3
										class="text-base font-semibold leading-6 text-gray-900 transition-colors group-hover:text-red-600 dark:text-white dark:group-hover:text-red-400"
									>
										<span class="absolute inset-0" aria-hidden="true"></span>
										Акции
									</h3>
									<p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Управление акциями</p>
								</div>
							</a>
						{/if}

						{#if navigationVisibility.showDocumentation}
							<a
								href="/documentation"
								class="group relative flex min-h-[100px] items-center gap-4 overflow-hidden rounded-xl border border-slate-200/50 bg-gradient-to-br from-slate-50 via-white to-gray-50 p-6 shadow-lg transition-all duration-300 focus-within:ring-2 focus-within:ring-slate-500 focus-within:ring-offset-2 hover:scale-[1.02] hover:border-slate-300 hover:shadow-xl dark:border-slate-900/30 dark:from-slate-950/20 dark:via-gray-800 dark:to-gray-950/20 dark:hover:border-slate-700"
							>
								<div
									class="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-slate-400/10 to-gray-400/10 blur-2xl transition-all duration-300 group-hover:scale-150"
								></div>
								<span
									class="relative inline-flex flex-shrink-0 rounded-xl bg-gradient-to-br from-slate-400 to-gray-400 p-3 text-white shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-slate-400/50"
								>
									<svg
										class="h-6 w-6"
										fill="none"
										viewBox="0 0 24 24"
										stroke-width="1.5"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
										/>
									</svg>
								</span>
								<div class="relative">
									<h3
										class="text-base font-semibold leading-6 text-gray-900 transition-colors group-hover:text-slate-600 dark:text-white dark:group-hover:text-slate-400"
									>
										<span class="absolute inset-0" aria-hidden="true"></span>
										Документация
									</h3>
									<p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
										База знаний и документы
									</p>
								</div>
							</a>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	{/snippet}
</ProtectedRoute>
