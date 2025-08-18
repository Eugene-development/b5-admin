import { render, screen, fireEvent } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ConfirmationModal from './ConfirmationModal.svelte';

describe('ConfirmationModal Component', () => {
	let mockOnConfirm, mockOnCancel;

	beforeEach(() => {
		mockOnConfirm = vi.fn();
		mockOnCancel = vi.fn();
		vi.clearAllMocks();
		
		// Reset body overflow style
		document.body.style.overflow = '';
	});

	afterEach(() => {
		// Clean up any remaining event listeners
		document.removeEventListener('keydown', () => {});
		document.body.style.overflow = '';
	});

	describe('Rendering', () => {
		test('does not render when isOpen is false', () => {
			render(ConfirmationModal, {
				props: {
					isOpen: false,
					title: 'Test Title',
					message: 'Test Message',
					onConfirm: mockOnConfirm,
					onCancel: mockOnCancel
				}
			});

			expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		});

		test('renders when isOpen is true', () => {
			render(ConfirmationModal, {
				props: {
					isOpen: true,
					title: 'Test Title',
					message: 'Test Message',
					onConfirm: mockOnConfirm,
					onCancel: mockOnCancel
				}
			});

			expect(screen.getByRole('dialog')).toBeInTheDocument();
			expect(screen.getByText('Test Title')).toBeInTheDocument();
			expect(screen.getByText('Test Message')).toBeInTheDocument();
		});

		test('renders with custom button text', () => {
			render(ConfirmationModal, {
				props: {
					isOpen: true,
					title: 'Test Title',
					message: 'Test Message',
					confirmText: 'Custom Confirm',
					cancelText: 'Custom Cancel',
					onConfirm: mockOnConfirm,
					onCancel: mockOnCancel
				}
			});

			expect(screen.getByRole('button', { name: 'Custom Confirm' })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Custom Cancel' })).toBeInTheDocument();
		});

		test('renders with default button text', () => {
			render(ConfirmationModal, {
				props: {
					isOpen: true,
					title: 'Test Title',
					message: 'Test Message',
					onConfirm: mockOnConfirm,
					onCancel: mockOnCancel
				}
			});

			expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
		});
	});

	describe('Destructive Actions', () => {
		test('shows warning icon for destructive actions', () => {
			render(ConfirmationModal, {
				props: {
					isOpen: true,
					title: 'Delete Item',
					message: 'This will permanently delete the item',
					isDestructive: true,
					onConfirm: mockOnConfirm,
					onCancel: mockOnCancel
				}
			});

			// Check for red styling on confirm button (destructive)
			const confirmButton = screen.getByRole('button', { name: 'Confirm' });
			expect(confirmButton).toHaveClass('bg-red-600');
		});

		test('shows question icon for non-destructive actions', () => {
			render(ConfirmationModal, {
				props: {
					isOpen: true,
					title: 'Confirm Action',
					message: 'Are you sure?',
					isDestructive: false,
					onConfirm: mockOnConfirm,
					onCancel: mockOnCancel
				}
			});

			// Check for yellow styling on confirm button (non-destructive)
			const confirmButton = screen.getByRole('button', { name: 'Confirm' });
			expect(confirmButton).toHaveClass('bg-yellow-600');
		});
	});

	describe('User Interactions', () => {
		test('calls onConfirm when confirm button is clicked', async () => {
			const user = userEvent.setup();
			render(ConfirmationModal, {
				props: {
					isOpen: true,
					title: 'Test Title',
					message: 'Test Message',
					onConfirm: mockOnConfirm,
					onCancel: mockOnCancel
				}
			});

			const confirmButton = screen.getByRole('button', { name: 'Confirm' });
			await user.click(confirmButton);

			expect(mockOnConfirm).toHaveBeenCalledTimes(1);
		});

		test('calls onCancel when cancel button is clicked', async () => {
			const user = userEvent.setup();
			render(ConfirmationModal, {
				props: {
					isOpen: true,
					title: 'Test Title',
					message: 'Test Message',
					onConfirm: mockOnConfirm,
					onCancel: mockOnCancel
				}
			});

			const cancelButton = screen.getByRole('button', { name: 'Cancel' });
			await user.click(cancelButton);

			expect(mockOnCancel).toHaveBeenCalledTimes(1);
		});

		test('calls onCancel when backdrop is clicked', async () => {
			const user = userEvent.setup();
			render(ConfirmationModal, {
				props: {
					isOpen: true,
					title: 'Test Title',
					message: 'Test Message',
					onConfirm: mockOnConfirm,
					onCancel: mockOnCancel
				}
			});

			// Find the backdrop (the div with bg-opacity-75)
			const backdrop = screen.getByRole('dialog').parentElement.querySelector('[aria-hidden="true"]');
			await user.click(backdrop);

			expect(mockOnCancel).toHaveBeenCalledTimes(1);
		});

		test('calls onCancel when Escape key is pressed', async () => {
			const user = userEvent.setup();
			render(ConfirmationModal, {
				props: {
					isOpen: true,
					title: 'Test Title',
					message: 'Test Message',
					onConfirm: mockOnConfirm,
					onCancel: mockOnCancel
				}
			});

			await user.keyboard('{Escape}');

			expect(mockOnCancel).toHaveBeenCalledTimes(1);
		});
	});

	describe('Loading State', () => {
		test('disables buttons when loading', () => {
			render(ConfirmationModal, {
				props: {
					isOpen: true,
					title: 'Test Title',
					message: 'Test Message',
					isLoading: true,
					onConfirm: mockOnConfirm,
					onCancel: mockOnCancel
				}
			});

			const confirmButton = screen.getByRole('button', { name: 'Confirm' });
			const cancelButton = screen.getByRole('button', { name: 'Cancel' });

			expect(confirmButton).toBeDisabled();
			expect(cancelButton).toBeDisabled();
		});

		test('shows loading spinner when loading', () => {
			render(ConfirmationModal, {
				props: {
					isOpen: true,
					title: 'Test Title',
					message: 'Test Message',
					isLoading: true,
					onConfirm: mockOnConfirm,
					onCancel: mockOnCancel
				}
			});

			// Check for loading spinner (has aria-hidden="true")
			const spinner = screen.getByRole('img', { hidden: true });
			expect(spinner).toBeInTheDocument();
		});

		test('does not call handlers when loading and buttons are clicked', async () => {
			const user = userEvent.setup();
			render(ConfirmationModal, {
				props: {
					isOpen: true,
					title: 'Test Title',
					message: 'Test Message',
					isLoading: true,
					onConfirm: mockOnConfirm,
					onCancel: mockOnCancel
				}
			});

			const confirmButton = screen.getByRole('button', { name: 'Confirm' });
			const cancelButton = screen.getByRole('button', { name: 'Cancel' });

			await user.click(confirmButton);
			await user.click(cancelButton);

			expect(mockOnConfirm).not.toHaveBeenCalled();
			expect(mockOnCancel).not.toHaveBeenCalled();
		});

		test('does not close on Escape when loading', async () => {
			const user = userEvent.setup();
			render(ConfirmationModal, {
				props: {
					isOpen: true,
					title: 'Test Title',
					message: 'Test Message',
					isLoading: true,
					onConfirm: mockOnConfirm,
					onCancel: mockOnCancel
				}
			});

			await user.keyboard('{Escape}');

			expect(mockOnCancel).not.toHaveBeenCalled();
		});

		test('does not close on backdrop click when loading', async () => {
			const user = userEvent.setup();
			render(ConfirmationModal, {
				props: {
					isOpen: true,
					title: 'Test Title',
					message: 'Test Message',
					isLoading: true,
					onConfirm: mockOnConfirm,
					onCancel: mockOnCancel
				}
			});

			const backdrop = screen.getByRole('dialog').parentElement.querySelector('[aria-hidden="true"]');
			await user.click(backdrop);

			expect(mockOnCancel).not.toHaveBeenCalled();
		});
	});

	describe('Accessibility', () => {
		test('has proper ARIA attributes', () => {
			render(ConfirmationModal, {
				props: {
					isOpen: true,
					title: 'Test Title',
					message: 'Test Message',
					onConfirm: mockOnConfirm,
					onCancel: mockOnCancel
				}
			});

			const dialog = screen.getByRole('dialog');
			expect(dialog).toHaveAttribute('aria-modal', 'true');
			expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
			expect(dialog).toHaveAttribute('tabindex', '-1');
		});

		test('has proper title association', () => {
			render(ConfirmationModal, {
				props: {
					isOpen: true,
					title: 'Test Title',
					message: 'Test Message',
					onConfirm: mockOnConfirm,
					onCancel: mockOnCancel
				}
			});

			const title = screen.getByText('Test Title');
			expect(title).toHaveAttribute('id', 'modal-title');
		});

		test('traps focus within modal', async () => {
			const user = userEvent.setup();
			render(ConfirmationModal, {
				props: {
					isOpen: true,
					title: 'Test Title',
					message: 'Test Message',
					onConfirm: mockOnConfirm,
					onCancel: mockOnCancel
				}
			});

			const confirmButton = screen.getByRole('button', { name: 'Confirm' });
			const cancelButton = screen.getByRole('button', { name: 'Cancel' });

			// Focus should start on confirm button
			expect(confirmButton).toHaveFocus();

			// Tab should move to cancel button
			await user.tab();
			expect(cancelButton).toHaveFocus();

			// Tab again should wrap back to confirm button
			await user.tab();
			expect(confirmButton).toHaveFocus();

			// Shift+Tab should go back to cancel button
			await user.tab({ shift: true });
			expect(cancelButton).toHaveFocus();
		});

		test('prevents body scroll when open', () => {
			render(ConfirmationModal, {
				props: {
					isOpen: true,
					title: 'Test Title',
					message: 'Test Message',
					onConfirm: mockOnConfirm,
					onCancel: mockOnCancel
				}
			});

			expect(document.body.style.overflow).toBe('hidden');
		});

		test('restores body scroll when closed', () => {
			const { rerender } = render(ConfirmationModal, {
				props: {
					isOpen: true,
					title: 'Test Title',
					message: 'Test Message',
					onConfirm: mockOnConfirm,
					onCancel: mockOnCancel
				}
			});

			expect(document.body.style.overflow).toBe('hidden');

			rerender({
				isOpen: false,
				title: 'Test Title',
				message: 'Test Message',
				onConfirm: mockOnConfirm,
				onCancel: mockOnCancel
			});

			expect(document.body.style.overflow).toBe('');
		});
	});

	describe('Error Handling', () => {
		test('handles missing handlers gracefully', () => {
			expect(() => {
				render(ConfirmationModal, {
					props: {
						isOpen: true,
						title: 'Test Title',
						message: 'Test Message'
					}
				});
			}).not.toThrow();
		});

		test('does not call handlers when they are undefined', async () => {
			const user = userEvent.setup();
			render(ConfirmationModal, {
				props: {
					isOpen: true,
					title: 'Test Title',
					message: 'Test Message'
				}
			});

			const confirmButton = screen.getByRole('button', { name: 'Confirm' });
			const cancelButton = screen.getByRole('button', { name: 'Cancel' });

			// Should not throw errors when clicking buttons without handlers
			await user.click(confirmButton);
			await user.click(cancelButton);
			await user.keyboard('{Escape}');
		});
	});
});