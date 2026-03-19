type FieldProps = {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  textarea?: boolean;
  placeholder?: string;
  error?: string;
  description?: string;
};

export function Field({ label, name, value, onChange, textarea = false, placeholder, error, description }: FieldProps) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {description ? <span className="field-description">{description}</span> : null}
      {textarea ? (
        <textarea
          className={`field-textarea${error ? " field-invalid" : ""}`}
          name={name}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          className={`field-input${error ? " field-invalid" : ""}`}
          name={name}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  );
}
