<!--
  Layout for protected routes
  This layout wraps all routes that require authentication
-->
<script>
	let { children } = $props();
</script>

{@render children?.()}