export default function FormField({
  label,
  htmlFor,
  error,
  children,
  className = "form-field",
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {error !== undefined && (
        <p className="helper-text" aria-live="polite">
          {error || "* helper text"}
        </p>
      )}
    </div>
  );
}
