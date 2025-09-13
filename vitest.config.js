import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		environment: 'jsdom',
		setupFiles: ['./src/test-setup.js'],
		globals: true
	},
	resolve: {
		alias: {
			'$app/navigation': './src/test-mocks/app/navigation.js',
			'$app/environment': './src/test-mocks/app/environment.js',
			'$app/stores': './src/test-mocks/app/stores.js',
			'$lib': './src/lib'
		}
	}
});