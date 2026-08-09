import { useEffect } from "react";

export default function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(onClose, 2000);
    return () => window.clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div
      className={`toast-message is-visible ${
        type === "error" ? "is-error" : ""
      }`}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
}
