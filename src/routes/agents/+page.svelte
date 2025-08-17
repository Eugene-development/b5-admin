<script>
	let { data } = $props();
	console.log(data);
</script>

<div>
	<h1>Agents</h1>
	{#each data.agents as agent}
		<p>{agent.id}-{agent.city}</p>
	{/each}
</div>
