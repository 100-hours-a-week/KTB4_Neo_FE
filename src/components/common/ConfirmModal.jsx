import { useEffect, useRef } from "react";

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onCancel,
  onConfirm,
  onDismiss = onCancel,
  isConfirming = false,
  confirmLabel = "확인",
  cancelLabel = "취소",
}) {
  const cancelRef = useRef(null);
  const onCancelRef = useRef(onCancel);
  const onDismissRef = useRef(onDismiss);
  const isConfirmingRef = useRef(isConfirming);
  onCancelRef.current = onCancel;
  onDismissRef.current = onDismiss;
  isConfirmingRef.current = isConfirming;

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousFocus = document.activeElement;
    document.body.classList.add("modal-open");
    cancelRef.current?.focus();

    const closeOnEscape = (event) => {
      if (event.key === "Escape" && !isConfirmingRef.current) {
        onDismissRef.current();
      }
    };
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.classList.remove("modal-open");
      document.removeEventListener("keydown", closeOnEscape);
      previousFocus?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-message"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !isConfirmingRef.current
        ) {
          onDismissRef.current();
        }
      }}
    >
      <div className="confirm-modal">
        <h2 id="confirm-modal-title">{title}</h2>
        <p id="confirm-modal-message">{message}</p>
        <div className="confirm-modal-actions">
          <button
            ref={cancelRef}
            className="modal-button cancel-button"
            type="button"
            disabled={isConfirming}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            className="modal-button confirm-button"
            type="button"
            disabled={isConfirming}
            onClick={onConfirm}
          >
            {isConfirming ? "처리 중..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
