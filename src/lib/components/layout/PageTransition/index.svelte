<script>
	/**
	 * PageTransition component for smooth page transitions
	 * Uses tailwindcss-animated for CSS-based animations
	 *
	 * @prop {string} type - Animation type: 'fade', 'slide-up', 'slide-down', 'slide-left', 'slide-right', 'zoom'
	 * @prop {number} duration - Animation duration in milliseconds (default: 300)
	 * @prop {any} children - Svelte 5 snippet for children content
	 */

	let { type = 'fade', duration = 300, children } = $props();

	// Map animation types to tailwindcss-animated classes
	const animationClasses = {
		fade: 'animate-fade',
		'slide-up': 'animate-fade-up',
		'slide-down': 'animate-fade-down',
		'slide-left': 'animate-fade-left',
		'slide-right': 'animate-fade-right',
		zoom: 'animate-zoom-in'
	};

	// Get animation class based on type
	const animationClass = animationClasses[type] || animationClasses['fade'];
</script>

<div class="{animationClass} animate-ease-in-out" style="animation-duration: {duration}ms;">
	{@render children?.()}
</div>
