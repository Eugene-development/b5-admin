<script>
	import { cn } from '$lib/utils/cn.js';
	import { onMount } from 'svelte';

	export let minSize = 0.6;
	export let maxSize = 1.5;
	export let speed = 3;
	export let particleColor = '#ffffff';
	export let particleDensity = 200;
	export let className = undefined;

	let particles = [];

	function getRandomValue() {
		return minSize + Math.random() * (maxSize - minSize);
	}

	function createParticle() {
		const moveX = (Math.random() * 4 - 2) * 10;
		const moveY = (Math.random() * 4 - 2) * 10;
		return {
			id: Math.random().toString(36).substr(2, 9),
			size: getRandomValue(),
			top: Math.random() * 100,
			left: Math.random() * 100,
			duration: Math.random() * 10 + speed,
			delay: Math.random() * 5,
			opacity: Math.random() * 0.5 + 0.5,
			moveX,
			moveY
		};
	}

	onMount(() => {
		particles = Array.from({ length: particleDensity }, () => createParticle());
	});
</script>

<style>
	@keyframes sparkle {
		0% {
			opacity: 0;
			transform: scale(0) translate(0, 0);
		}
		20% {
			opacity: var(--opacity);
			transform: scale(1) translate(calc(var(--moveX) * 0.2), calc(var(--moveY) * 0.2));
		}
		50% {
			opacity: var(--opacity);
			transform: scale(1.2) translate(calc(var(--moveX) * 0.5), calc(var(--moveY) * 0.5));
		}
		80% {
			opacity: var(--opacity);
			transform: scale(1) translate(calc(var(--moveX) * 0.8), calc(var(--moveY) * 0.8));
		}
		100% {
			opacity: 0;
			transform: scale(0) translate(var(--moveX), var(--moveY));
		}
	}

	.particle {
		position: absolute;
		border-radius: 50%;
		background-color: var(--particle-color);
		animation: sparkle linear infinite;
		will-change: transform, opacity;
	}
</style>

<div class={cn('relative h-48', className)} style="--particle-color: {particleColor};">
	<div class="absolute inset-0">
		{#each particles as particle (particle.id)}
			<span
				class="particle"
				style="
					width: {particle.size}px;
					height: {particle.size}px;
					top: {particle.top}%;
					left: {particle.left}%;
					--moveX: {particle.moveX}px;
					--moveY: {particle.moveY}px;
					--opacity: {particle.opacity};
					animation-duration: {particle.duration}s;
					animation-delay: {particle.delay}s;
				"
			></span>
		{/each}
	</div>
</div>