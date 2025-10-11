<script>
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte';
	import { getNavigationVisibility } from '$lib/utils/domainAccess.svelte.js';

	// Get navigation visibility reactively
	const navigationVisibility = $derived(getNavigationVisibility());
</script>

<ProtectedRoute>
	{#snippet children()}
		<div class="space-y-2">
			<div>
				<h1 class="text-2xl font-bold text-gray-900 dark:text-white">Дашборд</h1>
				<!-- <p class="mt-4 text-gray-600 dark:text-gray-400">
					Добро пожаловать в административную систему BonClick.
				</p> -->
			</div>

			<!-- Quick Navigation Cards -->
			<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{#if navigationVisibility.showAgents}
					<a
						href="/agents"
						class="group relative rounded-lg border border-gray-300 bg-white p-6 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:border-gray-400 hover:shadow-md dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500"
					>
						<div>
							<span
								class="inline-flex rounded-lg bg-indigo-50 p-3 text-indigo-700 ring-4 ring-white dark:bg-indigo-900/20 dark:text-indigo-400"
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
						</div>
						<div class="mt-8">
							<h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
								<span class="absolute inset-0" aria-hidden="true"></span>
								Агенты
							</h3>
							<p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
								Управление агентами системы
							</p>
						</div>
					</a>
				{/if}

				{#if navigationVisibility.showCurators}
					<a
						href="/curators"
						class="group relative rounded-lg border border-gray-300 bg-white p-6 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:border-gray-400 hover:shadow-md dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500"
					>
						<div>
							<span
								class="inline-flex rounded-lg bg-cyan-50 p-3 text-cyan-700 ring-4 ring-white dark:bg-cyan-900/20 dark:text-cyan-400"
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
						</div>
						<div class="mt-8">
							<h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
								<span class="absolute inset-0" aria-hidden="true"></span>
								Кураторы
							</h3>
							<p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Управление кураторами</p>
						</div>
					</a>
				{/if}

				{#if navigationVisibility.showSuppliers}
					<a
						href="/suppliers"
						class="group relative rounded-lg border border-gray-300 bg-white p-6 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:border-gray-400 hover:shadow-md dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500"
					>
						<div>
							<span
								class="inline-flex rounded-lg bg-green-50 p-3 text-green-700 ring-4 ring-white dark:bg-green-900/20 dark:text-green-400"
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
						</div>
						<div class="mt-8">
							<h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
								<span class="absolute inset-0" aria-hidden="true"></span>
								Поставщики
							</h3>
							<p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Управление поставщиками</p>
						</div>
					</a>
				{/if}

				{#if navigationVisibility.showContractors}
					<a
						href="/contractors"
						class="group relative rounded-lg border border-gray-300 bg-white p-6 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:border-gray-400 hover:shadow-md dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500"
					>
						<div>
							<span
								class="inline-flex rounded-lg bg-blue-50 p-3 text-blue-700 ring-4 ring-white dark:bg-blue-900/20 dark:text-blue-400"
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
						</div>
						<div class="mt-8">
							<h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
								<span class="absolute inset-0" aria-hidden="true"></span>
								Подрядчики
							</h3>
							<p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Управление подрядчиками</p>
						</div>
					</a>
				{/if}

				{#if navigationVisibility.showDelivery}
					<a
						href="/delivery"
						class="group relative rounded-lg border border-gray-300 bg-white p-6 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:border-gray-400 hover:shadow-md dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500"
					>
						<div>
							<span
								class="inline-flex rounded-lg bg-orange-50 p-3 text-orange-700 ring-4 ring-white dark:bg-orange-900/20 dark:text-orange-400"
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
						</div>
						<div class="mt-8">
							<h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
								<span class="absolute inset-0" aria-hidden="true"></span>
								Службы доставки
							</h3>
							<p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
								Управление службами доставки
							</p>
						</div>
					</a>
				{/if}

				{#if navigationVisibility.showServices}
					<a
						href="/services"
						class="group relative rounded-lg border border-gray-300 bg-white p-6 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:border-gray-400 hover:shadow-md dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500"
					>
						<div>
							<span
								class="inline-flex rounded-lg bg-teal-50 p-3 text-teal-700 ring-4 ring-white dark:bg-teal-900/20 dark:text-teal-400"
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
						</div>
						<div class="mt-8">
							<h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
								<span class="absolute inset-0" aria-hidden="true"></span>
								Сервис
							</h3>
							<p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Управление сервисом</p>
						</div>
					</a>
				{/if}

				{#if navigationVisibility.showActions}
					<a
						href="/actions"
						class="group relative rounded-lg border border-gray-300 bg-white p-6 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:border-gray-400 hover:shadow-md dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500"
					>
						<div>
							<span
								class="inline-flex rounded-lg bg-red-50 p-3 text-red-700 ring-4 ring-white dark:bg-red-900/20 dark:text-red-400"
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
						</div>
						<div class="mt-8">
							<h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
								<span class="absolute inset-0" aria-hidden="true"></span>
								Акции
							</h3>
							<p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Управление акциями</p>
						</div>
					</a>
				{/if}

				{#if navigationVisibility.showTz}
					<a
						href="/tz"
						class="group relative rounded-lg border border-gray-300 bg-white p-6 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:border-gray-400 hover:shadow-md dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500"
					>
						<div>
							<span
								class="inline-flex rounded-lg bg-yellow-50 p-3 text-yellow-700 ring-4 ring-white dark:bg-yellow-900/20 dark:text-yellow-400"
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
						</div>
						<div class="mt-8">
							<h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
								<span class="absolute inset-0" aria-hidden="true"></span>
								Техзадания
							</h3>
							<p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
								Управление техническими заданиями
							</p>
						</div>
					</a>
				{/if}

				{#if navigationVisibility.showOrder}
					<a
						href="/order"
						class="group relative rounded-lg border border-gray-300 bg-white p-6 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:border-gray-400 hover:shadow-md dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500"
					>
						<div>
							<span
								class="inline-flex rounded-lg bg-lime-50 p-3 text-lime-700 ring-4 ring-white dark:bg-lime-900/20 dark:text-lime-400"
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
						</div>
						<div class="mt-8">
							<h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
								<span class="absolute inset-0" aria-hidden="true"></span>
								Заказы
							</h3>
							<p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
								Работа с заказами для поставщиков техники и фурнитуры
							</p>
						</div>
					</a>
				{/if}

				{#if navigationVisibility.showProjects}
					<a
						href="/projects"
						class="group relative rounded-lg border border-gray-300 bg-white p-6 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:border-gray-400 hover:shadow-md dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500"
					>
						<div>
							<span
								class="inline-flex rounded-lg bg-purple-50 p-3 text-purple-700 ring-4 ring-white dark:bg-purple-900/20 dark:text-purple-400"
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
						</div>
						<div class="mt-8">
							<h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
								<span class="absolute inset-0" aria-hidden="true"></span>
								Проекты
							</h3>
							<p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Управление проектами</p>
						</div>
					</a>
				{/if}

				{#if navigationVisibility.showClients}
					<a
						href="/clients"
						class="group relative rounded-lg border border-gray-300 bg-white p-6 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:border-gray-400 hover:shadow-md dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500"
					>
						<div>
							<span
								class="inline-flex rounded-lg bg-pink-50 p-3 text-pink-700 ring-4 ring-white dark:bg-pink-900/20 dark:text-pink-400"
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
						</div>
						<div class="mt-8">
							<h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
								<span class="absolute inset-0" aria-hidden="true"></span>
								Клиенты
							</h3>
							<p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Управление клиентами</p>
						</div>
					</a>
				{/if}
			</div>
		</div>
	{/snippet}
</ProtectedRoute>
