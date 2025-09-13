/**
 * Error handling utility functions tests
 * Tests core error handling logic without external dependencies
 */

import { describe, it, expect } from 'vitest';

// Error types enumeration
const ERROR_TYPES = {
	VALIDATION: 'validation',
	AUTHENTICATION: 'authentication', 
	AUTHORIZATION: 'authorization',
	NETWORK: 'network',
	SERVER: 'server',
	UNKNOWN: 'unknown'
};

// HTTP status codes
const HTTP_STATUS = {
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	UNPROCESSABLE_ENTITY: 422,
	INTERNAL_SERVER_ERROR: 500,
	BAD_GATEWAY: 502,
	SERVICE_UNAVAILABLE: 503
};

// Core error handling functions (simplified versions)
function getErrorType(error) {
	if (!error) return ERROR_TYPES.UNKNOWN;
	if (!error.status) return ERROR_TYPES.NETWORK;

	switch (error.status) {
		case HTTP_STATUS.UNAUTHORIZED:
			return ERROR_TYPES.AUTHENTICATION;
		case HTTP_STATUS.FORBIDDEN:
			return ERROR_TYPES.AUTHORIZATION;
		case HTTP_STATUS.UNPROCESSABLE_ENTITY:
			return ERROR_TYPES.VALIDATION;
		case HTTP_STATUS.INTERNAL_SERVER_ERROR:
		case HTTP_STATUS.BAD_GATEWAY:
		case HTTP_STATUS.SERVICE_UNAVAILABLE:
			return ERROR_TYPES.SERVER;
		default:
			return ERROR_TYPES.UNKNOWN;
	}
}

function formatValidationErrors(validationErrors) {
	if (!validationErrors || typeof validationErrors !== 'object') {
		return {};
	}

	const formattedErrors = {};
	
	for (const [field, messages] of Object.entries(validationErrors)) {
		if (Array.isArray(messages) && messages.length > 0) {
			formattedErrors[field] = messages;
		}
	}

	return formattedErrors;
}

function getFirstErrorMessage(errors) {
	if (!errors || typeof errors !== 'object') {
		return null;
	}

	for (const messages of Object.values(errors)) {
		if (Array.isArray(messages) && messages.length > 0) {
			return messages[0];
		} else if (typeof messages === 'string') {
			return messages;
		}
	}

	return null;
}

function hasErrors(errors) {
	if (!errors || typeof errors !== 'object') {
		return false;
	}
	return Object.keys(errors).length > 0;
}

function clearErrorFields(errors, fields) {
	if (!errors || typeof errors !== 'object') {
		return {};
	}

	const fieldsArray = Array.isArray(fields) ? fields : [fields];
	const newErrors = { ...errors };

	fieldsArray.forEach(field => {
		delete newErrors[field];
	});

	return newErrors;
}

function mergeErrors(...errorObjects) {
	const mergedErrors = {};

	errorObjects.forEach(errors => {
		if (errors && typeof errors === 'object') {
			Object.assign(mergedErrors, errors);
		}
	});

	return mergedErrors;
}

describe('Error Type Detection', () => {
	it('should detect validation errors (422)', () => {
		const error = { status: HTTP_STATUS.UNPROCESSABLE_ENTITY };
		expect(getErrorType(error)).toBe(ERROR_TYPES.VALIDATION);
	});

	it('should detect authentication errors (401)', () => {
		const error = { status: HTTP_STATUS.UNAUTHORIZED };
		expect(getErrorType(error)).toBe(ERROR_TYPES.AUTHENTICATION);
	});

	it('should detect authorization errors (403)', () => {
		const error = { status: HTTP_STATUS.FORBIDDEN };
		expect(getErrorType(error)).toBe(ERROR_TYPES.AUTHORIZATION);
	});

	it('should detect server errors (5xx)', () => {
		const error500 = { status: HTTP_STATUS.INTERNAL_SERVER_ERROR };
		const error502 = { status: HTTP_STATUS.BAD_GATEWAY };
		const error503 = { status: HTTP_STATUS.SERVICE_UNAVAILABLE };
		
		expect(getErrorType(error500)).toBe(ERROR_TYPES.SERVER);
		expect(getErrorType(error502)).toBe(ERROR_TYPES.SERVER);
		expect(getErrorType(error503)).toBe(ERROR_TYPES.SERVER);
	});

	it('should detect network errors (no status)', () => {
		const error = new Error('Network request failed');
		expect(getErrorType(error)).toBe(ERROR_TYPES.NETWORK);
	});

	it('should default to unknown for other status codes', () => {
		const error = { status: 418 }; // I'm a teapot
		expect(getErrorType(error)).toBe(ERROR_TYPES.UNKNOWN);
	});

	it('should handle null/undefined errors', () => {
		expect(getErrorType(null)).toBe(ERROR_TYPES.UNKNOWN);
		expect(getErrorType(undefined)).toBe(ERROR_TYPES.UNKNOWN);
	});
});

describe('Validation Error Formatting', () => {
	it('should format validation errors correctly', () => {
		const validationErrors = {
			email: ['Email is required', 'Email must be valid'],
			password: ['Password is too short'],
			name: ['Name is required']
		};

		const formatted = formatValidationErrors(validationErrors);

		expect(formatted).toEqual({
			email: ['Email is required', 'Email must be valid'],
			password: ['Password is too short'],
			name: ['Name is required']
		});
	});

	it('should handle empty validation errors', () => {
		expect(formatValidationErrors({})).toEqual({});
		expect(formatValidationErrors(null)).toEqual({});
		expect(formatValidationErrors(undefined)).toEqual({});
	});

	it('should handle validation errors with empty arrays', () => {
		const validationErrors = {
			email: [],
			password: ['Password required']
		};

		const formatted = formatValidationErrors(validationErrors);

		expect(formatted).toEqual({
			password: ['Password required']
		});
	});
});

describe('Error Utility Functions', () => {
	it('should get first error message', () => {
		const errors = {
			email: ['First error', 'Second error'],
			password: ['Password error']
		};

		const result = getFirstErrorMessage(errors);

		expect(result).toBe('First error');
	});

	it('should handle string error messages', () => {
		const errors = {
			email: 'String error'
		};

		const result = getFirstErrorMessage(errors);

		expect(result).toBe('String error');
	});

	it('should return null for empty errors', () => {
		expect(getFirstErrorMessage({})).toBeNull();
		expect(getFirstErrorMessage(null)).toBeNull();
	});

	it('should check if errors exist', () => {
		expect(hasErrors({})).toBe(false);
		expect(hasErrors(null)).toBe(false);
		expect(hasErrors({ email: ['Error'] })).toBe(true);
	});

	it('should clear specific error fields', () => {
		const errors = {
			email: ['Error'],
			password: ['Error'],
			name: ['Error']
		};

		const result = clearErrorFields(errors, 'email');

		expect(result).toEqual({
			password: ['Error'],
			name: ['Error']
		});
	});

	it('should clear multiple error fields', () => {
		const errors = {
			email: ['Error'],
			password: ['Error'],
			name: ['Error']
		};

		const result = clearErrorFields(errors, ['email', 'password']);

		expect(result).toEqual({
			name: ['Error']
		});
	});

	it('should handle clearing from empty errors', () => {
		const result = clearErrorFields({}, 'email');
		expect(result).toEqual({});
	});

	it('should merge multiple error objects', () => {
		const errors1 = { email: ['Email error'] };
		const errors2 = { password: ['Password error'] };
		const errors3 = { name: ['Name error'] };

		const result = mergeErrors(errors1, errors2, errors3);

		expect(result).toEqual({
			email: ['Email error'],
			password: ['Password error'],
			name: ['Name error']
		});
	});

	it('should handle merging with null/undefined', () => {
		const errors1 = { email: ['Error'] };

		const result = mergeErrors(errors1, null, undefined);

		expect(result).toEqual({
			email: ['Error']
		});
	});

	it('should overwrite duplicate keys in merge', () => {
		const errors1 = { email: ['First error'] };
		const errors2 = { email: ['Second error'] };

		const result = mergeErrors(errors1, errors2);

		expect(result).toEqual({
			email: ['Second error']
		});
	});
});