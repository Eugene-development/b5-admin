<script>
	/**
	 * PageTitle - компонент заголовка страницы H1
	 * @param {string} title - текст заголовка
	 * @param {string} [id='page-title'] - id для aria-labelledby
	 */
	let { title, id = 'page-title' } = $props();
</script>

<h1 {id} class="text-4xl font-bold text-gray-900 dark:text-white">
	{title}
</h1>
