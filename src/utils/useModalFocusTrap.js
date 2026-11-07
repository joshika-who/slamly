import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]:not([disabled])',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"]):not([disabled])',
].join(', ');

/**
 * Accessible modal focus management hook:
 * - Saves the previously focused element (`document.activeElement`) when the modal opens.
 * - Moves focus to the first interactive element inside the modal.
 * - Traps `Tab` and `Shift+Tab` inside the modal container.
 * - Calls `onClose` when the user presses `Escape`.
 * - Restores focus to the original trigger element when the modal closes.
 */
export function useModalFocusTrap(isOpen, onClose) {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') {
      return undefined;
    }

    previousFocusRef.current = document.activeElement;

    const modalEl = modalRef.current;
    if (modalEl) {
      const focusable = modalEl.querySelectorAll(FOCUSABLE_SELECTOR);
      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        modalEl.focus();
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (typeof onCloseRef.current === 'function') {
          event.preventDefault();
          onCloseRef.current();
        }
        return;
      }

      if (event.key !== 'Tab') return;

      const currentModal = modalRef.current;
      if (!currentModal) return;

      const focusableNodes = Array.from(
        currentModal.querySelectorAll(FOCUSABLE_SELECTOR)
      );

      if (focusableNodes.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableNodes[0];
      const lastElement = focusableNodes[focusableNodes.length - 1];

      if (event.shiftKey) {
        if (
          document.activeElement === firstElement ||
          !currentModal.contains(document.activeElement)
        ) {
          event.preventDefault();
          lastElement.focus();
        }
      } else if (
        document.activeElement === lastElement ||
        !currentModal.contains(document.activeElement)
      ) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      const prev = previousFocusRef.current;
      if (prev && typeof prev.focus === 'function' && document.contains(prev)) {
        prev.focus();
      }
    };
  }, [isOpen]);

  return modalRef;
}

