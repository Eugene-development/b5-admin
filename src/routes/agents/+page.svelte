<script>
	let { data } = $props();
	console.log(data);
</script>

<div>
	<h1>Agents</h1>
	{#each data.agents as agent}
		<p>
			{agent.id}-{agent.city}-{agent.name}-{agent.email}-{agent.created_at}-{agent.email_verified_at}
		</p>
	{/each}
</div>
