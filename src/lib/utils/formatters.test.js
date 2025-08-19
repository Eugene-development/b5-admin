import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	formatCurrency,
	formatAgentRate,
	formatDate,
	isOverdue,
	truncateText,
	isTruncated,
	getOverdueDateClasses,
	formatAgentDisplay
} from './formatters.js';

describe('formatCurrency', () => {
	it('should format valid numbers correctly', () => {
		expect(formatCurrency(1500000)).toBe('1 500 000 ₽');
		expect(formatCurrency(0)).toBe('0 ₽');
		expect(formatCurrency(1234.56)).toBe('1 235 ₽');
	});

	it('should handle string numbers', () => {
		expect(formatCurrency('1500000')).toBe('1 500 000 ₽');
		expect(formatCurrency('0')).toBe('0 ₽');
	});

	it('should handle null/undefined/empty values', () => {
		expect(formatCurrency(null)).toBe('Не указано');
		expect(formatCurrency(undefined)).toBe('Не указано');
		expect(formatCurrency('')).toBe('Не указано');
	});

	it('should handle invalid values', () => {
		expect(formatCurrency('invalid')).toBe('Не указано');
		expect(formatCurrency(NaN)).toBe('Не указано');
	});

	it('should support different currencies', () => {
		expect(formatCurrency(1000, 'USD')).toBe('1 000 $');
	});
});

describe('formatAgentRate', () => {
	it('should format percentage rates', () => {
		expect(formatAgentRate(15, 'percentage')).toBe('15%');
		expect(formatAgentRate(0, 'percentage')).toBe('0%');
		expect(formatAgentRate(100, 'percentage')).toBe('100%');
	});

	it('should format fixed rates as currency', () => {
		expect(formatAgentRate(50000, 'fixed')).toBe('50 000 ₽');
		expect(formatAgentRate(0, 'fixed')).toBe('0 ₽');
	});

	it('should default to percentage', () => {
		expect(formatAgentRate(15)).toBe('15%');
	});

	it('should handle null/undefined/empty values', () => {
		expect(formatAgentRate(null)).toBe('Не указано');
		expect(formatAgentRate(undefined)).toBe('Не указано');
		expect(formatAgentRate('')).toBe('Не указано');
	});

	it('should handle string numbers', () => {
		expect(formatAgentRate('15', 'percentage')).toBe('15%');
		expect(formatAgentRate('50000', 'fixed')).toBe('50 000 ₽');
	});
});

describe('formatDate', () => {
	it('should format valid dates correctly', () => {
		expect(formatDate('2025-01-15')).toBe('15.01.2025');
		expect(formatDate('2025-12-31')).toBe('31.12.2025');
		expect(formatDate(new Date('2025-06-15'))).toBe('15.06.2025');
	});

	it('should handle null/undefined/empty values', () => {
		expect(formatDate(null)).toBe('Не указано');
		expect(formatDate(undefined)).toBe('Не указано');
		expect(formatDate('')).toBe('Не указано');
	});

	it('should handle invalid dates', () => {
		expect(formatDate('invalid-date')).toBe('Не указано');
		expect(formatDate('2025-13-45')).toBe('Не указано');
	});
});

describe('isOverdue', () => {
	beforeEach(() => {
		// Mock current date to 2025-01-20
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2025-01-20'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('should return true for past dates', () => {
		expect(isOverdue('2025-01-19')).toBe(true);
		expect(isOverdue('2024-12-31')).toBe(true);
		expect(isOverdue(new Date('2025-01-15'))).toBe(true);
	});

	it('should return false for future dates', () => {
		expect(isOverdue('2025-01-21')).toBe(false);
		expect(isOverdue('2025-02-01')).toBe(false);
		expect(isOverdue(new Date('2025-01-25'))).toBe(false);
	});

	it('should return false for today', () => {
		expect(isOverdue('2025-01-20')).toBe(false);
	});

	it('should handle null/undefined/empty values', () => {
		expect(isOverdue(null)).toBe(false);
		expect(isOverdue(undefined)).toBe(false);
		expect(isOverdue('')).toBe(false);
	});

	it('should handle invalid dates', () => {
		expect(isOverdue('invalid-date')).toBe(false);
	});
});

describe('truncateText', () => {
	it('should truncate long text', () => {
		const longText = 'A'.repeat(150);
		expect(truncateText(longText, 100)).toBe('A'.repeat(100) + '...');
	});

	it('should not truncate short text', () => {
		const shortText = 'Short description';
		expect(truncateText(shortText, 100)).toBe(shortText);
	});

	it('should handle exact length text', () => {
		const exactText = 'A'.repeat(100);
		expect(truncateText(exactText, 100)).toBe(exactText);
	});

	it('should handle null/undefined/empty values', () => {
		expect(truncateText(null)).toBe('Описание не указано');
		expect(truncateText(undefined)).toBe('Описание не указано');
		expect(truncateText('')).toBe('Описание не указано');
	});

	it('should handle non-string values', () => {
		expect(truncateText(123)).toBe('Описание не указано');
		expect(truncateText({})).toBe('Описание не указано');
	});

	it('should use custom max length', () => {
		const text = 'A'.repeat(50);
		expect(truncateText(text, 30)).toBe('A'.repeat(30) + '...');
	});
});d
escribe('isTruncated', () => {
	it('should return true for text longer than max length', () => {
		const longText = 'A'.repeat(150);
		expect(isTruncated(longText, 100)).toBe(true);
	});

	it('should return false for text shorter than max length', () => {
		const shortText = 'Short description';
		expect(isTruncated(shortText, 100)).toBe(false);
	});

	it('should return false for exact length text', () => {
		const exactText = 'A'.repeat(100);
		expect(isTruncated(exactText, 100)).toBe(false);
	});

	it('should handle null/undefined/empty values', () => {
		expect(isTruncated(null)).toBe(false);
		expect(isTruncated(undefined)).toBe(false);
		expect(isTruncated('')).toBe(false);
	});
});

describe('getOverdueDateClasses', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2025-01-20'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('should return red classes for overdue dates', () => {
		expect(getOverdueDateClasses('2025-01-19')).toBe('text-red-600 font-medium');
		expect(getOverdueDateClasses('2024-12-31')).toBe('text-red-600 font-medium');
	});

	it('should return normal classes for future dates', () => {
		expect(getOverdueDateClasses('2025-01-21')).toBe('text-gray-900');
		expect(getOverdueDateClasses('2025-02-01')).toBe('text-gray-900');
	});

	it('should return normal classes for today', () => {
		expect(getOverdueDateClasses('2025-01-20')).toBe('text-gray-900');
	});
});

describe('formatAgentDisplay', () => {
	it('should format agent with name and email', () => {
		const agent = { name: 'Иван Иванов', email: 'ivan@example.com', id: 1 };
		expect(formatAgentDisplay(agent)).toBe('Иван Иванов (ivan@example.com)');
	});

	it('should format agent with only email', () => {
		const agent = { email: 'ivan@example.com', id: 1 };
		expect(formatAgentDisplay(agent)).toBe('ivan@example.com');
	});

	it('should format agent with only name', () => {
		const agent = { name: 'Иван Иванов', id: 1 };
		expect(formatAgentDisplay(agent)).toBe('Иван Иванов');
	});

	it('should format agent with only id', () => {
		const agent = { id: 1 };
		expect(formatAgentDisplay(agent)).toBe('ID: 1');
	});

	it('should handle null/undefined agent', () => {
		expect(formatAgentDisplay(null)).toBe('Не назначен');
		expect(formatAgentDisplay(undefined)).toBe('Не назначен');
	});

	it('should handle empty agent object', () => {
		expect(formatAgentDisplay({})).toBe('ID: Неизвестно');
	});
});