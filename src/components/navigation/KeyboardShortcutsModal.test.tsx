import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';

describe('KeyboardShortcutsModal', () => {
  it('does not render content when closed', () => {
    render(<KeyboardShortcutsModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();
  });

  it('renders the modal with title when open', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    expect(
      screen.getByText('Use these shortcuts to navigate faster.'),
    ).toBeInTheDocument();
  });

  it('renders all shortcut groups', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Global')).toBeInTheDocument();
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('General')).toBeInTheDocument();
  });

  it('renders global shortcuts', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Open Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Open Help')).toBeInTheDocument();
    expect(screen.getByText('Close any open menu or modal')).toBeInTheDocument();
  });

  it('renders phase navigation shortcuts', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Jump to Setup phase')).toBeInTheDocument();
    expect(screen.getByText('Jump to Discovery phase')).toBeInTheDocument();
    expect(screen.getByText('Jump to Settlement phase')).toBeInTheDocument();
    expect(screen.getByText('Jump to Close phase')).toBeInTheDocument();
  });

  it('renders general shortcuts', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Navigate through items')).toBeInTheDocument();
    expect(screen.getByText('Activate item')).toBeInTheDocument();
    expect(screen.getByText('Navigate within section')).toBeInTheDocument();
  });

  it('renders keyboard key badges', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={vi.fn()} />);
    // Check that key badges are rendered (e.g. "K", "Esc", "1")
    expect(screen.getByText('K')).toBeInTheDocument();
    expect(screen.getByText('Esc')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Tab')).toBeInTheDocument();
  });

  it('calls onClose when dialog is dismissed', () => {
    const onClose = vi.fn();
    render(<KeyboardShortcutsModal isOpen={true} onClose={onClose} />);

    // The Radix Dialog close button (X) should be present
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalled();
  });
});
