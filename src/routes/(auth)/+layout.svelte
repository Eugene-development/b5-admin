<!--
  Layout for authentication routes (login, register)
  This layout wraps routes that should only be accessible to guests
-->
<script>
	let { children } = $props();
</script>

{@render children?.()}
