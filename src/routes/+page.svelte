<script>
	import { LogoutButton, authState } from '$lib';
</script>

<h1>Welcome to B5 Agent</h1>

{#if authState.isAuthenticated}
	<div class="user-info">
		<p>Welcome, {authState.user?.name || authState.user?.email}!</p>
		
		<div class="navigation">
			<h2>Navigation</h2>
			<a href="/dashboard" class="dashboard-link">Go to Dashboard</a>
		</div>
		
		<div class="logout-examples">
			<h2>Logout Button Examples</h2>
			
			<div class="example-group">
				<h3>Standard Button</h3>
				<LogoutButton />
			</div>
			
			<div class="example-group">
				<h3>Button with Confirmation</h3>
				<LogoutButton showConfirmation={true} />
			</div>
			
			<div class="example-group">
				<h3>Link Style</h3>
				<LogoutButton variant="link" />
			</div>
			
			<div class="example-group">
				<h3>Different Sizes</h3>
				<LogoutButton size="small" />
				<LogoutButton size="medium" />
				<LogoutButton size="large" />
			</div>
		</div>
	</div>
{:else}
	<div class="auth-links">
		<p>Please sign in to access your account.</p>
		<a href="/login">Sign In</a> | <a href="/register">Sign Up</a>
	</div>
{/if}

<style>
	.user-info {
		max-width: 600px;
		margin: 2rem auto;
		padding: 2rem;
	}

	.navigation {
		margin-top: 2rem;
	}

	.dashboard-link {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		background-color: #007bff;
		color: white;
		text-decoration: none;
		border-radius: 4px;
		transition: background-color 0.2s;
	}

	.dashboard-link:hover {
		background-color: #0056b3;
	}

	.logout-examples {
		margin-top: 2rem;
	}

	.example-group {
		margin-bottom: 2rem;
		padding: 1rem;
		border: 1px solid #eee;
		border-radius: 4px;
	}

	.example-group h3 {
		margin: 0 0 1rem 0;
		color: #333;
		font-size: 1rem;
	}

	.example-group:last-child {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.example-group:last-child > :global(button) {
		align-self: flex-start;
	}

	.auth-links {
		text-align: center;
		margin: 2rem auto;
		padding: 2rem;
	}

	.auth-links a {
		color: #007bff;
		text-decoration: none;
		margin: 0 0.5rem;
	}

	.auth-links a:hover {
		text-decoration: underline;
	}
</style>
