import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import {
  useKeyboardShortcuts,
  getModifierKey,
  formatShortcut,
  type KeyboardShortcut,
} from './useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  let handler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    handler = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function makeShortcut(overrides: Partial<KeyboardShortcut> = {}): KeyboardShortcut {
    return {
      id: 'test',
      description: 'Test shortcut',
      key: 'k',
      handler,
      ...overrides,
    };
  }

  it('fires handler when matching key is pressed', () => {
    renderHook(() => useKeyboardShortcuts([makeShortcut({ key: 'a' })]));
    fireEvent.keyDown(document, { key: 'a' });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not fire handler for non-matching key', () => {
    renderHook(() => useKeyboardShortcuts([makeShortcut({ key: 'a' })]));
    fireEvent.keyDown(document, { key: 'b' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('matches Cmd/Ctrl modifier when metaKey is required', () => {
    renderHook(() =>
      useKeyboardShortcuts([makeShortcut({ key: 'k', metaKey: true })]),
    );

    // Without modifier — should not fire
    fireEvent.keyDown(document, { key: 'k' });
    expect(handler).not.toHaveBeenCalled();

    // With metaKey — should fire
    fireEvent.keyDown(document, { key: 'k', metaKey: true });
    expect(handler).toHaveBeenCalledTimes(1);

    // With ctrlKey — should also fire (cross-platform)
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('does not fire when metaKey is pressed but not required', () => {
    renderHook(() => useKeyboardShortcuts([makeShortcut({ key: '1' })]));
    fireEvent.keyDown(document, { key: '1', metaKey: true });
    expect(handler).not.toHaveBeenCalled();
  });

  it('respects shiftKey modifier', () => {
    renderHook(() =>
      useKeyboardShortcuts([makeShortcut({ key: '?', shiftKey: true })]),
    );
    fireEvent.keyDown(document, { key: '?' });
    expect(handler).not.toHaveBeenCalled();

    fireEvent.keyDown(document, { key: '?', shiftKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('prevents default browser action on match', () => {
    renderHook(() =>
      useKeyboardShortcuts([makeShortcut({ key: 'k', metaKey: true })]),
    );
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      cancelable: true,
    });
    const spy = vi.spyOn(event, 'preventDefault');
    document.dispatchEvent(event);
    expect(spy).toHaveBeenCalled();
  });

  it('skips disabled shortcuts', () => {
    renderHook(() =>
      useKeyboardShortcuts([makeShortcut({ key: 'a', enabled: false })]),
    );
    fireEvent.keyDown(document, { key: 'a' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('skips shortcut when focused in an input and ignoreInInput is true', () => {
    renderHook(() =>
      useKeyboardShortcuts([makeShortcut({ key: '1', ignoreInInput: true })]),
    );

    const input = document.createElement('input');
    input.type = 'text';
    document.body.appendChild(input);
    input.focus();

    fireEvent.keyDown(document, { key: '1' });
    expect(handler).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it('fires shortcut in input when ignoreInInput is false', () => {
    renderHook(() =>
      useKeyboardShortcuts([
        makeShortcut({ key: 'k', metaKey: true, ignoreInInput: false }),
      ]),
    );

    const input = document.createElement('input');
    input.type = 'text';
    document.body.appendChild(input);
    input.focus();

    fireEvent.keyDown(document, { key: 'k', metaKey: true });
    expect(handler).toHaveBeenCalledTimes(1);

    document.body.removeChild(input);
  });

  it('only fires the first matching shortcut when multiple match', () => {
    const handler2 = vi.fn();
    renderHook(() =>
      useKeyboardShortcuts([
        makeShortcut({ id: 'first', key: 'a', handler }),
        makeShortcut({ id: 'second', key: 'a', handler: handler2 }),
      ]),
    );
    fireEvent.keyDown(document, { key: 'a' });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler2).not.toHaveBeenCalled();
  });

  it('cleans up event listener on unmount', () => {
    const { unmount } = renderHook(() =>
      useKeyboardShortcuts([makeShortcut({ key: 'a' })]),
    );
    unmount();
    fireEvent.keyDown(document, { key: 'a' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('is case-insensitive for key matching', () => {
    renderHook(() => useKeyboardShortcuts([makeShortcut({ key: 'K' })]));
    fireEvent.keyDown(document, { key: 'k' });
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe('getModifierKey', () => {
  it('returns a string', () => {
    const result = getModifierKey();
    expect(typeof result).toBe('string');
    expect(['⌘', 'Ctrl']).toContain(result);
  });
});

describe('formatShortcut', () => {
  it('formats a simple key', () => {
    expect(formatShortcut({ key: '1' })).toBe('1');
  });

  it('formats a key with meta modifier', () => {
    const result = formatShortcut({ key: 'k', metaKey: true });
    expect(result).toMatch(/^(⌘|Ctrl)\+K$/);
  });

  it('formats a key with shift modifier', () => {
    const result = formatShortcut({ key: '?', shiftKey: true });
    expect(result).toBe('Shift+?');
  });

  it('formats a key with multiple modifiers', () => {
    const result = formatShortcut({ key: '/', metaKey: true, shiftKey: true });
    expect(result).toMatch(/^(⌘|Ctrl)\+Shift\+\/$/);
  });
});
