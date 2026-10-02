'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Two-step confirm for destructive or high-risk actions. Accessible:
 * Escape closes, focus returns to the trigger.
 */
export function ConfirmButton({
  label,
  confirmLabel,
  description,
  danger,
  disabled,
  onConfirm,
}: {
  label: string;
  confirmLabel: string;
  description: string;
  danger?: boolean;
  disabled?: boolean;
  onConfirm: () => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) confirmRef.current?.focus();
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`btn ${danger ? 'btn-danger' : ''}`}
        disabled={disabled}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        {label}
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={confirmLabel}
          className="fixed inset-0 z-50 flex items-center justify-center
            bg-black/60 p-4"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setOpen(false);
              triggerRef.current?.focus();
            }
          }}
        >
          <div className="card w-full max-w-md space-y-4">
            <p className="text-sm text-slate-300">{description}</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
              >
                Cancel
              </button>
              <button
                ref={confirmRef}
                type="button"
                className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
                onClick={() => {
                  setOpen(false);
                  onConfirm();
                }}
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

