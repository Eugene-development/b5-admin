<script>
	import { domainState, getNavigationVisibility } from '$lib/utils/domainAccess.svelte.js';

	// Props
	let { showDetails = true } = $props();

	// Get navigation visibility reactively
	const navigationVisibility = $derived(getNavigationVisibility());
</script>

{#if domainState.initialized}
	<div class="rounded-lg border border-blue-200 bg-blue-50 p-4">
		<div class="flex items-start">
			<div class="flex-shrink-0">
				<svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
					<path
						fill-rule="evenodd"
						d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
						clip-rule="evenodd"
					/>
				</svg>
			</div>
			<div class="ml-3">
				<h3 class="text-sm font-medium text-blue-800">Domain Access Information</h3>
				<div class="mt-2 text-sm text-blue-700">
					<p><strong>Current Domain:</strong> {domainState.hostname}</p>
					<p>
						<strong>Access Level:</strong>
						{#if domainState.isAdminDomain}
							<span class="font-semibold text-green-600">Admin Domain ✅</span>
						{:else if domainState.isLocalhost}
							<span class="font-semibold text-yellow-600">Development (localhost) ⚠️</span>
						{:else if domainState.isRegularDomain}
							<span class="font-semibold text-red-600">Regular Domain ❌</span>
						{:else}
							<span class="text-gray-600">Unknown Domain</span>
						{/if}
					</p>

					{#if showDetails}
						<div class="mt-3 space-y-1">
							<p>
								<strong>Admin Navigation Access:</strong>
								{navigationVisibility.hasAdminAccess ? '✅ Enabled' : '❌ Disabled'}
							</p>
							<p>
								<strong>Show /test link:</strong>
								{navigationVisibility.showTest ? '✅ Visible' : '❌ Hidden'}
							</p>
							<p>
								<strong>Show /test2 link:</strong>
								{navigationVisibility.showTest2 ? '✅ Visible' : '❌ Hidden'}
							</p>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
{:else}
	<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
		<p class="text-sm text-gray-600">Domain detection initializing...</p>
	</div>
{/if}
