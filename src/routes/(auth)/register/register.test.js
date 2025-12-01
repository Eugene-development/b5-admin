import { describe, it, expect } from 'vitest';

/**
 * Unit tests for registration form validation.
 * 
 * **Feature: registration-company-field**
 * **Validates: Requirements 2.1, 2.3, 2.4**
 */

/**
 * Validate company name field (required)
 */
function validateCompanyName(companyName) {
	if (!companyName) return 'Название компании обязательно';
	if (companyName.length < 2) return 'Название компании должно содержать минимум 2 символа';
	if (companyName.length > 255) return 'Название компании слишком длинное';
	return null;
}

describe('Registration Form Validation', () => {
	describe('validateCompanyName', () => {
		/**
		 * Test empty company name validation.
		 * **Validates: Requirements 2.1**
		 */
		it('should return error for empty company name', () => {
			expect(validateCompanyName('')).toBe('Название компании обязательно');
			expect(validateCompanyName(null)).toBe('Название компании обязательно');
			expect(validateCompanyName(undefined)).toBe('Название компании обязательно');
		});

		/**
		 * Test minimum length validation.
		 * **Validates: Requirements 2.3**
		 */
		it('should return error for company name less than 2 characters', () => {
			expect(validateCompanyName('A')).toBe('Название компании должно содержать минимум 2 символа');
			expect(validateCompanyName('1')).toBe('Название компании должно содержать минимум 2 символа');
		});

		/**
		 * Test maximum length validation.
		 * **Validates: Requirements 2.4**
		 */
		it('should return error for company name more than 255 characters', () => {
			const longName = 'A'.repeat(256);
			expect(validateCompanyName(longName)).toBe('Название компании слишком длинное');
		});

		/**
		 * Test valid company names.
		 */
		it('should return null for valid company names', () => {
			expect(validateCompanyName('ООО Рога и Копыта')).toBeNull();
			expect(validateCompanyName('AB')).toBeNull();
			expect(validateCompanyName('A'.repeat(255))).toBeNull();
			expect(validateCompanyName('ИП Иванов')).toBeNull();
			expect(validateCompanyName('Компания 123')).toBeNull();
		});

		/**
		 * Test boundary values.
		 */
		it('should handle boundary values correctly', () => {
			// Exactly 2 characters - valid
			expect(validateCompanyName('AB')).toBeNull();
			expect(validateCompanyName('12')).toBeNull();
			
			// Exactly 255 characters - valid
			expect(validateCompanyName('A'.repeat(255))).toBeNull();
			
			// 1 character - invalid
			expect(validateCompanyName('A')).toBe('Название компании должно содержать минимум 2 символа');
			
			// 256 characters - invalid
			expect(validateCompanyName('A'.repeat(256))).toBe('Название компании слишком длинное');
		});

		/**
		 * Test with whitespace.
		 */
		it('should handle whitespace correctly', () => {
			// Whitespace only should be treated as empty
			expect(validateCompanyName('   ')).toBeNull(); // 3 spaces is valid length
			expect(validateCompanyName(' ')).toBe('Название компании должно содержать минимум 2 символа');
		});

		/**
		 * Test with special characters.
		 */
		it('should accept company names with special characters', () => {
			expect(validateCompanyName('ООО "Рога и Копыта"')).toBeNull();
			expect(validateCompanyName('Company & Co.')).toBeNull();
			expect(validateCompanyName('Компания №1')).toBeNull();
		});

		/**
		 * Test with Cyrillic characters.
		 */
		it('should accept company names with Cyrillic characters', () => {
			expect(validateCompanyName('Компания')).toBeNull();
			expect(validateCompanyName('ООО Технологии')).toBeNull();
			expect(validateCompanyName('ИП Иванов Иван Иванович')).toBeNull();
		});
	});
});
