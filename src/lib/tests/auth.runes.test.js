/**
 * Tests specifically for Svelte 5 runes behavior in authentication state
 * Requirements: Testing rune state during various operations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as auth from '../auth/auth.svelte.js';

describe('Authentication Runes State Behavior', () => {
	beforeEach(() => {
		// Reset state before each test
		auth.clearAuthState();
	});

	afterEach(() => {
		// Clean up after each test
		auth.clearAuthState();
	});

	describe('Reactive State Updates', () => {
		it('should update user state reactively', () => {
			// Initial state
			expect(auth.authState.user).toBeNull();
			expect(auth.authState.isAuthenticated).toBe(false);

			// Set user
			const testUser = { id: 1, email: 'test@example.com', name: 'Test User' };
			auth.setUser(testUser);

			// State should update immediately
			expect(auth.authState.user).toEqual(testUser);
			expect(auth.authState.isAuthenticated).toBe(true);

			// Clear user
			auth.setUser(null);

			// State should update immediately
			expect(auth.authState.user).toBeNull();
			expect(auth.authState.isAuthenticated).toBe(false);
		});

		it('should update loading state reactively', () => {
			// Initial state
			expect(auth.authState.isLoading).toBe(false);

			// Set loading
			auth.setLoading(true);
			expect(auth.authState.isLoading).toBe(true);

			// Clear loading
			auth.setLoading(false);
			expect(auth.authState.isLoading).toBe(false);
		});

		it('should update errors state reactively', () => {
			// Initial state
			expect(auth.authState.errors).toEqual({});

			// Set errors
			const testErrors = { email: ['Required'], password: ['Too short'] };
			auth.setErrors(testErrors);
			expect(auth.authState.errors).toEqual(testErrors);

			// Clear errors
			auth.clearErrors();
			expect(auth.authState.errors).toEqual({});
		});

		it('should handle multiple rapid state changes', () => {
			// Rapid user changes
			const user1 = { id: 1, email: 'user1@example.com' };
			const user2 = { id: 2, email: 'user2@example.com' };

			auth.setUser(user1);
			expect(auth.authState.user).toEqual(user1);

			auth.setUser(user2);
			expect(auth.authState.user).toEqual(user2);

			auth.setUser(null);
			expect(auth.authState.user).toBeNull();

			// Rapid loading changes
			auth.setLoading(true);
			expect(auth.authState.isLoading).toBe(true);

			auth.setLoading(false);
			expect(auth.authState.isLoading).toBe(false);

			auth.setLoading(true);
			expect(auth.authState.isLoading).toBe(true);
		});
	});

	describe('State Consistency', () => {
		it('should maintain consistent state during complex operations', () => {
			// Simulate a complex authentication flow
			const testUser = { id: 1, email: 'test@example.com' };
			const testErrors = { email: ['Invalid'] };

			// Start with loading
			auth.setLoading(true);
			expect(auth.authState.isLoading).toBe(true);
			expect(auth.authState.user).toBeNull();
			expect(auth.authState.isAuthenticated).toBe(false);

			// Set errors during loading
			auth.setErrors(testErrors);
			expect(auth.authState.isLoading).toBe(true);
			expect(auth.authState.errors).toEqual(testErrors);
			expect(auth.authState.user).toBeNull();

			// Clear errors and set user
			auth.clearErrors();
			auth.setUser(testUser);
			expect(auth.authState.errors).toEqual({});
			expect(auth.authState.user).toEqual(testUser);
			expect(auth.authState.isAuthenticated).toBe(true);
			expect(auth.authState.isLoading).toBe(true); // Still loading

			// Finish loading
			auth.setLoading(false);
			expect(auth.authState.isLoading).toBe(false);
			expect(auth.authState.user).toEqual(testUser);
			expect(auth.authState.isAuthenticated).toBe(true);
			expect(auth.authState.errors).toEqual({});
		});

		it('should handle clearAuthState correctly', () => {
			// Set up complex state
			const testUser = { id: 1, email: 'test@example.com' };
			const testErrors = { email: ['Error'], password: ['Error'] };

			auth.setUser(testUser);
			auth.setErrors(testErrors);
			auth.setLoading(true);

			// Verify state is set
			expect(auth.authState.user).toEqual(testUser);
			expect(auth.authState.errors).toEqual(testErrors);
			expect(auth.authState.isLoading).toBe(true);
			expect(auth.authState.isAuthenticated).toBe(true);

			// Clear all state
			auth.clearAuthState();

			// Verify everything is cleared
			expect(auth.authState.user).toBeNull();
			expect(auth.authState.errors).toEqual({});
			expect(auth.authState.isLoading).toBe(false);
			expect(auth.authState.isAuthenticated).toBe(false);
		});
	});

	describe('State Getter Behavior', () => {
		it('should compute isAuthenticated correctly for different user values', () => {
			// Null user
			auth.setUser(null);
			expect(auth.authState.isAuthenticated).toBe(false);

			// Undefined user
			auth.setUser(undefined);
			expect(auth.authState.isAuthenticated).toBe(false);

			// Empty object user
			auth.setUser({});
			expect(auth.authState.isAuthenticated).toBe(true); // Empty object is truthy

			// User with id
			auth.setUser({ id: 1 });
			expect(auth.authState.isAuthenticated).toBe(true);

			// User with email
			auth.setUser({ email: 'test@example.com' });
			expect(auth.authState.isAuthenticated).toBe(true);

			// Full user object
			auth.setUser({ id: 1, email: 'test@example.com', name: 'Test' });
			expect(auth.authState.isAuthenticated).toBe(true);
		});

		it('should handle loading state with different truthy/falsy values', () => {
			// Falsy values
			auth.setLoading(false);
			expect(auth.authState.isLoading).toBe(false);

			auth.setLoading(0);
			expect(auth.authState.isLoading).toBe(false);

			auth.setLoading('');
			expect(auth.authState.isLoading).toBe(false);

			auth.setLoading(null);
			expect(auth.authState.isLoading).toBe(false);

			auth.setLoading(undefined);
			expect(auth.authState.isLoading).toBe(false);

			// Truthy values
			auth.setLoading(true);
			expect(auth.authState.isLoading).toBe(true);

			auth.setLoading(1);
			expect(auth.authState.isLoading).toBe(true);

			auth.setLoading('loading');
			expect(auth.authState.isLoading).toBe(true);

			auth.setLoading({});
			expect(auth.authState.isLoading).toBe(true);

			auth.setLoading([]);
			expect(auth.authState.isLoading).toBe(true);
		});
	});

	describe('Error State Management', () => {
		it('should handle different error object structures', () => {
			// Empty errors
			auth.setErrors({});
			expect(auth.authState.errors).toEqual({});

			// Single field error
			auth.setErrors({ email: ['Required'] });
			expect(auth.authState.errors).toEqual({ email: ['Required'] });

			// Multiple field errors
			const multiErrors = {
				email: ['Required', 'Invalid format'],
				password: ['Too short', 'Must contain numbers'],
				name: ['Required']
			};
			auth.setErrors(multiErrors);
			expect(auth.authState.errors).toEqual(multiErrors);

			// Null errors (should convert to empty object)
			auth.setErrors(null);
			expect(auth.authState.errors).toEqual({});

			// Undefined errors (should convert to empty object)
			auth.setErrors(undefined);
			expect(auth.authState.errors).toEqual({});
		});

		it('should handle error field clearing', () => {
			// Set up initial errors
			const initialErrors = {
				email: ['Required'],
				password: ['Too short'],
				name: ['Required']
			};
			auth.setErrors(initialErrors);

			// Clear specific field
			auth.clearErrorFields('email');
			expect(auth.authState.errors).toEqual({
				password: ['Too short'],
				name: ['Required']
			});

			// Clear multiple fields
			auth.clearErrorFields(['password', 'name']);
			expect(auth.authState.errors).toEqual({});
		});

		it('should handle error utility functions', () => {
			// Test hasAuthErrors
			auth.setErrors({});
			expect(auth.hasAuthErrors()).toBe(false);

			auth.setErrors({ email: ['Error'] });
			expect(auth.hasAuthErrors()).toBe(true);

			// Test getFirstAuthError
			auth.setErrors({
				email: ['First error', 'Second error'],
				password: ['Password error']
			});
			expect(auth.getFirstAuthError()).toBe('First error');

			auth.clearErrors();
			expect(auth.getFirstAuthError()).toBeNull();
		});
	});

	describe('State Immutability', () => {
		it('should not allow direct mutation of state objects', () => {
			// Set initial state
			const testUser = { id: 1, email: 'test@example.com' };
			const testErrors = { email: ['Error'] };

			auth.setUser(testUser);
			auth.setErrors(testErrors);

			// Get references to state
			const userRef = auth.authState.user;
			const errorsRef = auth.authState.errors;

			// Attempt to mutate (should not affect internal state)
			if (userRef) {
				userRef.email = 'modified@example.com';
			}
			errorsRef.password = ['New error'];

			// Internal state should remain unchanged
			expect(auth.authState.user.email).toBe('test@example.com');
			expect(auth.authState.errors.password).toBeUndefined();
		});

		it('should create new state objects on updates', () => {
			// Set initial state
			const testUser1 = { id: 1, email: 'test1@example.com' };
			auth.setUser(testUser1);
			const userRef1 = auth.authState.user;

			// Update state
			const testUser2 = { id: 2, email: 'test2@example.com' };
			auth.setUser(testUser2);
			const userRef2 = auth.authState.user;

			// References should be different
			expect(userRef1).not.toBe(userRef2);
			expect(userRef2).toEqual(testUser2);
		});
	});
});