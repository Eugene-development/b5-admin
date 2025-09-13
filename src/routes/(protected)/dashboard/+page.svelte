<script>
	import { authState } from '$lib/auth/auth.svelte.js';
	import { LogoutButton } from '$lib';
</script>

<svelte:head>
	<title>Dashboard - B5 Agent</title>
</svelte:head>

<div class="dashboard">
	<header class="dashboard-header">
		<h1>Dashboard</h1>
		<div class="user-actions">
			<span class="welcome-text">Welcome, {authState.user?.name || authState.user?.email}!</span>
			<LogoutButton variant="link" />
		</div>
	</header>

	<main class="dashboard-content">
		<div class="card">
			<h2>Protected Content</h2>
			<p>This page is only accessible to authenticated users.</p>
			<p>Your user ID: {authState.user?.id}</p>
			<p>Your email: {authState.user?.email}</p>
		</div>

		<div class="card">
			<h2>Navigation</h2>
			<nav>
				<a href="/">Home</a>
				<a href="/dashboard/profile">Profile</a>
				<a href="/dashboard/settings">Settings</a>
			</nav>
		</div>
	</main>
</div>

<style>
	.dashboard {
		min-height: 100vh;
		background-color: #f8f9fa;
	}

	.dashboard-header {
		background: white;
		padding: 1rem 2rem;
		border-bottom: 1px solid #dee2e6;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.dashboard-header h1 {
		margin: 0;
		color: #333;
	}

	.user-actions {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.welcome-text {
		color: #666;
		font-size: 0.9rem;
	}

	.dashboard-content {
		padding: 2rem;
		max-width: 1200px;
		margin: 0 auto;
		display: grid;
		gap: 2rem;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	}

	.card {
		background: white;
		padding: 2rem;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.card h2 {
		margin: 0 0 1rem 0;
		color: #333;
	}

	.card p {
		margin: 0.5rem 0;
		color: #666;
	}

	nav {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	nav a {
		color: #007bff;
		text-decoration: none;
		padding: 0.5rem;
		border-radius: 4px;
		transition: background-color 0.2s;
	}

	nav a:hover {
		background-color: #f8f9fa;
		text-decoration: underline;
	}
</style>
