/**
 * Client-side load function for agents page
 * Data will be loaded in the component using onMount()
 * This file indicates that the page should use client-side rendering
 */

// Set CSR to true and SSR to false for client-side only rendering
export const ssr = false;
export const csr = true;

// Empty load function - actual data loading happens in the component
export function load() {
	return {};
}
