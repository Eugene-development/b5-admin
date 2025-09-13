<script>
	import RegisterForm from '$lib/components/RegisterForm.svelte';
</script>

<svelte:head>
	<title>Register - B5 Agent</title>
	<meta name="description" content="Create a new account for B5 Agent" />
</svelte:head>

<main class="register-page">
	<div class="container">
		<RegisterForm />
	</div>
</main>

<style>
	.register-page {
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

	/* Responsive adjustments */
	@media (max-width: 768px) {
		.register-page {
			padding: 0.5rem;
		}
	}
</style>
