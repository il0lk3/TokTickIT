import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export interface AccessibleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  confirmVariant?: 'danger' | 'warning' | 'primary' | 'success';
  isSubmitting?: boolean;
  role?: 'dialog' | 'alertdialog';
  initialFocusSafe?: boolean;
  children?: React.ReactNode;
}

export function AccessibleDialog({
  isOpen,
  onClose,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  confirmVariant = 'primary',
  isSubmitting = false,
  role = 'dialog',
  initialFocusSafe = true,
  children,
}: AccessibleDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const safeButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const isSubmittingRef = useRef(isSubmitting);
  isSubmittingRef.current = isSubmitting;
  const initialFocusSafeRef = useRef(initialFocusSafe);
  initialFocusSafeRef.current = initialFocusSafe;

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedElement.current = document.activeElement as HTMLElement;
    document.body.classList.add('modal-open');

    // Give application root inert attribute if available
    const rootEl = document.getElementById('root');
    if (rootEl) {
      rootEl.setAttribute('inert', '');
    }

    // Set initial focus to safe button or confirm button
    const timer = setTimeout(() => {
      if (initialFocusSafeRef.current && safeButtonRef.current) {
        safeButtonRef.current.focus();
      } else if (confirmButtonRef.current) {
        confirmButtonRef.current.focus();
      } else if (dialogRef.current) {
        dialogRef.current.focus();
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!isSubmittingRef.current) {
          e.preventDefault();
          onCloseRef.current();
        }
        return;
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const focusable = Array.from(focusableElements).filter(
          (el) => !el.hasAttribute('disabled') && el.offsetParent !== null
        );

        if (focusable.length === 0) return;

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('modal-open');
      if (rootEl) {
        rootEl.removeAttribute('inert');
      }
      if (previouslyFocusedElement.current && typeof previouslyFocusedElement.current.focus === 'function') {
        previouslyFocusedElement.current.focus();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const titleId = 'accessible-dialog-title';
  const descId = 'accessible-dialog-desc';

  return createPortal(
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1055 }}
      tabIndex={-1}
      role={role}
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onClick={(e) => {
        if (!isSubmitting && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="modal-dialog modal-dialog-centered" ref={dialogRef} tabIndex={-1}>
        <div className="modal-content shadow-lg border-0 rounded-4 overflow-hidden">
          {/* Header */}
          <div className="modal-header border-0 pb-0 pt-4 px-4 d-flex align-items-center justify-content-between">
            <h5 className="modal-title fw-bold text-dark mb-0" id={titleId}>
              {title}
            </h5>
            <button
              type="button"
              className="btn-close"
              aria-label="Close dialog"
              disabled={isSubmitting}
              onClick={onClose}
            />
          </div>

          {/* Body */}
          <div className="modal-body px-4 py-3">
            {description && (
              <div id={descId} className="text-secondary mb-3">
                {description}
              </div>
            )}
            {children}
          </div>

          {/* Footer */}
          <div className="modal-footer border-0 pt-0 pb-4 px-4 d-flex gap-2 justify-content-end">
            <button
              type="button"
              ref={safeButtonRef}
              className="btn btn-outline-secondary px-3 py-2 fw-medium rounded-pill"
              disabled={isSubmitting}
              onClick={onClose}
            >
              {cancelText}
            </button>
            {onConfirm && (
              <button
                type="button"
                ref={confirmButtonRef}
                className={`btn btn-${confirmVariant} px-4 py-2 fw-bold rounded-pill d-flex align-items-center gap-2`}
                disabled={isSubmitting}
                onClick={onConfirm}
              >
                {isSubmitting && (
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                )}
                {confirmText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
