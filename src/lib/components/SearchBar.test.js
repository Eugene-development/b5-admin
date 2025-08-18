import { render, screen } from '@testing-library/svelte';
import { vi } from 'vitest';
import SearchBar from './SearchBar.svelte';

describe('SearchBar Component', () => {
	let mockOnSearch;

	beforeEach(() => {
		mockOnSearch = vi.fn();
		vi.clearAllMocks();
	});

	test('renders component without errors', () => {
		expect(() => {
			render(SearchBar, { props: { onSearch: mockOnSearch } });
		}).not.toThrow();
	});

	test('renders with default placeholder', () => {
		const { container } = render(SearchBar, { props: { onSearch: mockOnSearch } });

		const input = container.querySelector('input[type="text"]');
		expect(input).toBeTruthy();
		expect(input.placeholder).toBe('Search agents...');
	});

	test('renders with custom placeholder', () => {
		const customPlaceholder = 'Custom search placeholder';
		const { container } = render(SearchBar, {
			props: {
				onSearch: mockOnSearch,
				placeholder: customPlaceholder
			}
		});

		const input = container.querySelector('input[type="text"]');
		expect(input.placeholder).toBe(customPlaceholder);
	});

	test('displays initial value', () => {
		const initialValue = 'test search';
		const { container } = render(SearchBar, {
			props: {
				onSearch: mockOnSearch,
				value: initialValue
			}
		});

		const input = container.querySelector('input[type="text"]');
		expect(input.value).toBe(initialValue);
	});

	test('has proper accessibility attributes', () => {
		const { container } = render(SearchBar, { props: { onSearch: mockOnSearch } });

		const input = container.querySelector('input[type="text"]');
		expect(input.getAttribute('aria-label')).toBe('Search agents by name, email, or city');
		expect(input.getAttribute('aria-describedby')).toBeTruthy();
		expect(input.getAttribute('autocomplete')).toBe('off');
		expect(input.getAttribute('autocorrect')).toBe('off');
		expect(input.getAttribute('autocapitalize')).toBe('off');
		expect(input.getAttribute('spellcheck')).toBe('false');
		expect(input.getAttribute('role')).toBe('searchbox');
	});

	test('shows clear button when value exists', () => {
		const { container } = render(SearchBar, {
			props: {
				onSearch: mockOnSearch,
				value: 'test value'
			}
		});

		const clearButton = container.querySelector('button[aria-label="Clear search"]');
		expect(clearButton).toBeTruthy();
	});

	test('does not show clear button when value is empty', () => {
		const { container } = render(SearchBar, {
			props: {
				onSearch: mockOnSearch,
				value: ''
			}
		});

		const clearButton = container.querySelector('button[aria-label="Clear search"]');
		expect(clearButton).toBeFalsy();
	});

	test('has screen reader descriptions', () => {
		const { container } = render(SearchBar, { props: { onSearch: mockOnSearch } });

		// Check for screen reader description
		const description = container.querySelector('.sr-only');
		expect(description).toBeTruthy();
		expect(description.textContent).toContain(
			'Search for agents by their name, email address, or city'
		);
	});

	test('has live region for announcements', () => {
		const { container } = render(SearchBar, { props: { onSearch: mockOnSearch } });

		const liveRegion = container.querySelector('[aria-live="polite"]');
		expect(liveRegion).toBeTruthy();
		expect(liveRegion.getAttribute('aria-atomic')).toBe('true');
	});

	test('component structure is correct', () => {
		const { container } = render(SearchBar, { props: { onSearch: mockOnSearch } });

		// Check for main container
		const mainDiv = container.querySelector('div.relative');
		expect(mainDiv).toBeTruthy();

		// Check for search icon
		const searchIcon = container.querySelector('svg');
		expect(searchIcon).toBeTruthy();

		// Check for input
		const input = container.querySelector('input[type="text"]');
		expect(input).toBeTruthy();
	});
});
