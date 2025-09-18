<script>
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let currentDomain = '';
	let fullUrl = '';
	let shouldBeBlocked = false;

	onMount(() => {
		currentDomain = window.location.hostname;
		fullUrl = window.location.href;

		// Check if this should have been blocked
		shouldBeBlocked = currentDomain === 'bonus.band';

		if (shouldBeBlocked) {
			console.warn('🚨 SECURITY ISSUE: bonus.band should not have access to this page!');
			console.log('Current URL:', fullUrl);
			console.log('Current hostname:', currentDomain);
		}
	});
</script>

<svelte:head>
	<title>Test Page - B5 Admin</title>
	<meta name="description" content="Test page accessible only from admin.bonus.band" />
</svelte:head>

<div class="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
	<div class="mx-auto max-w-4xl">
		<div class="rounded-lg bg-white p-8 shadow-lg">
			<div class="mb-8 text-center">
				<h1 class="mb-4 text-4xl font-bold text-gray-900">Test Page</h1>
				<p class="text-lg text-gray-600">
					This page is only accessible from admin.bonus.band domain
				</p>
				{#if shouldBeBlocked}
					<div class="mt-4 rounded-lg border border-red-400 bg-red-100 p-4">
						<p class="font-semibold text-red-800">
							🚨 SECURITY ISSUE: This page should be blocked for bonus.band!
						</p>
						<p class="mt-2 text-sm text-red-600">
							Check the server console for debug logs and verify hooks.server.js is working.
						</p>
					</div>
				{/if}
			</div>

			<div class="grid gap-6 md:grid-cols-2">
				<div class="rounded-lg bg-blue-50 p-6">
					<h2 class="mb-3 text-xl font-semibold text-blue-900">Access Information</h2>
					<div class="space-y-2 text-blue-800">
						<p><strong>Current Domain:</strong> {currentDomain}</p>
						<p><strong>Full URL:</strong> {fullUrl}</p>
						<p><strong>Allowed Domain:</strong> admin.bonus.band</p>
						<p><strong>Blocked Domain:</strong> bonus.band</p>
						{#if shouldBeBlocked}
							<p class="font-semibold text-red-600">⚠️ This access should have been blocked!</p>
						{/if}
					</div>
				</div>

				<div class="rounded-lg bg-green-50 p-6">
					<h2 class="mb-3 text-xl font-semibold text-green-900">Domain Restrictions</h2>
					<div class="space-y-2 text-green-800">
						<div class="flex items-center">
							<span class="mr-2 h-2 w-2 rounded-full bg-green-500"></span>
							<span>✅ admin.bonus.band - Access granted</span>
						</div>
						<div class="flex items-center">
							<span class="mr-2 h-2 w-2 rounded-full bg-red-500"></span>
							<span>❌ bonus.band - Access denied</span>
						</div>
					</div>
				</div>
			</div>

			<div class="mt-8 rounded-lg bg-gray-50 p-6">
				<h2 class="mb-3 text-xl font-semibold text-gray-900">Technical Details</h2>
				<div class="space-y-2 text-gray-700">
					<p>• Domain validation is implemented in hooks.server.js</p>
					<p>• Access control happens at the server level before page rendering</p>
					<p>• This ensures security even if JavaScript is disabled</p>
					<p>• Non-admin domains receive a 403 Forbidden response</p>
				</div>
			</div>

			<div class="mt-8 text-center">
				<p class="text-sm text-gray-500">
					Page accessed at: {new Date().toLocaleString()}
				</p>
			</div>
		</div>
	</div>
</div>

<style>
	:global(body) {
		font-family:
			'Inter',
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			Roboto,
			sans-serif;
	}
</style>
