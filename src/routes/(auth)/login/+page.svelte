<script>
	import LoginForm from '$lib/components/LoginForm.svelte';
	import { page } from '$app/stores';

	// Get return URL from query parameters for redirect after login
	$: returnUrl = $page.url.searchParams.get('returnUrl') || '/';
</script>

<svelte:head>
	<title>Sign In - B5 Agent</title>
</svelte:head>

<div class="login-page">
	<div class="container">
		<LoginForm redirectTo={returnUrl} />
	</div>
</div>

<style>
	.login-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #f8f9fa;
		padding: 1rem;
	}

	.container {
		width: 100%;
		max-width: 500px;
	}
</style>
