<script>
	import '../../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<!-- Simple layout for authentication pages without navigation -->
<div class="min-h-screen bg-white dark:bg-gray-900">
	{@render children()}
</div>