<script>
	let { data } = $props();
	console.log(data);
</script>

<div>
	<h1>Projects</h1>
	{#each data.projects as project}
		<p>
			{project.id}-{project.value}-{project.description}-{project.created_at}
		</p>
	{/each}
</div>
