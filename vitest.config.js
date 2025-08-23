import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		environment: 'happy-dom',
		setupFiles: ['./src/test-setup.js'],
		globals: true,
		alias: {
			$lib: new URL('./src/lib', import.meta.url).pathname,
			'$app/navigation': new URL('./src/test-mocks/app-navigation.js', import.meta.url).pathname,
			'$app/stores': new URL('./src/test-mocks/app-stores.js', import.meta.url).pathname
		}
	}
});
