<script>
	import ProtectedRoute from '$lib/components/common/ProtectedRoute.svelte';
</script>

<ProtectedRoute>
	{#snippet children()}
		<div class="min-h-screen bg-gray-50 dark:bg-gray-950">
			<div class="px-4 py-7 sm:px-6 lg:px-7">
				<div class="mx-auto max-w-7xl">
					<main id="main-content" aria-labelledby="page-title">
						<!-- Header -->
						<div class="mb-8">
							<h1
								id="page-title"
								class="text-4xl font-semibold text-gray-900 dark:text-white"
							>
								Выплаты
							</h1>
							<p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
								Управление выплатами и финансовыми операциями
							</p>
						</div>

						<!-- Separator -->
						<div class="my-4 border-t border-gray-200 dark:border-gray-700"></div>

						<!-- Placeholder Content -->
						<div class="flex min-h-[400px] items-center justify-center">
							<div class="text-center">
								<svg
									class="mx-auto h-24 w-24 text-gray-400 dark:text-gray-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="1.5"
										d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								<h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">
									Раздел в разработке
								</h3>
								<p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
									Функционал выплат скоро будет доступен
								</p>
							</div>
						</div>
					</main>
				</div>
			</div>
		</div>
	{/snippet}
</ProtectedRoute>
