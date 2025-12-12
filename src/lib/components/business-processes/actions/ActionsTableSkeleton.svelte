<!--
  Skeleton loading component for Actions table
  Displays placeholder content while data is being fetched
-->
<div class="min-h-screen bg-gray-50 dark:bg-gray-950">
	<div class="px-4 py-7 sm:px-6 lg:px-7">
		<div class="mx-auto max-w-7xl">
			<!-- Header Skeleton -->
			<div class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between">
				<div class="flex items-center justify-between">
					<div>
						<div class="h-8 w-32 animate-pulse rounded-md bg-gray-300 dark:bg-gray-700"></div>
						<div class="mt-2 h-4 w-64 animate-pulse rounded-md bg-gray-200 dark:bg-gray-800"></div>
					</div>
				</div>
				<div class="flex items-center space-x-3">
					<div class="h-9 w-28 animate-pulse rounded-md bg-gray-300 dark:bg-gray-700"></div>
					<div class="h-9 w-36 animate-pulse rounded-md bg-gray-300 dark:bg-gray-700"></div>
				</div>
			</div>

			<!-- Separator -->
			<div class="my-4 border-t border-gray-200 dark:border-gray-700"></div>

			<!-- Search Skeleton -->
			<div
				class="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0"
			>
				<div class="flex flex-1 items-center space-x-4">
					<div class="relative max-w-md flex-1">
						<div class="h-9 w-full animate-pulse rounded-md bg-gray-200 dark:bg-gray-800"></div>
					</div>
				</div>
			</div>

			<!-- Table Skeleton -->
			<div class="mt-8">
				<div class="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
					<table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
						<thead class="bg-gray-50 dark:bg-gray-900">
							<tr>
								{#each Array(7) as _}
									<th class="px-6 py-3 text-left">
										<div class="h-4 w-20 animate-pulse rounded bg-gray-300 dark:bg-gray-700"></div>
									</th>
								{/each}
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
							{#each Array(5) as _}
								<tr>
									{#each Array(7) as _}
										<td class="px-6 py-4 whitespace-nowrap">
											<div
												class="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700"
											></div>
										</td>
									{/each}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	</div>
</div>
