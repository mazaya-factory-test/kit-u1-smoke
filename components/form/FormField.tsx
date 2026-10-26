"use client";
// kit:layout-a11y@0.1.0 harvested from mazaya-studios:components/FormField.tsx, AV-Events:components/ui/field.tsx
import type { ChangeEvent, ReactNode } from "react";
import { fieldIds } from "./field-ids";
import styles from "./form.module.css";

type FieldChangeEvent = ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;

/**
 * Label, optional hint, control and optional error, wired by id.
 * Uncontrolled by default (read values with FormData). Pass `value` + `onChange` to control it.
 * With no `value`, no value attribute is emitted at all.
 */
export function FormField({
  id,
  name,
  label,
  hint,
  error,
  required = false,
  type = "text",
  autoComplete,
  placeholder,
  minLength,
  maxLength,
  value,
  defaultValue,
  onChange,
  children,
}: {
  id: string;
  name: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  type?: "text" | "email" | "tel" | "url" | "textarea" | "select";
  autoComplete?: string;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  /** Present means controlled. */
  value?: string;
  defaultValue?: string;
  onChange?: (event: FieldChangeEvent) => void;
  /** The <option> elements when type is "select". */
  children?: ReactNode;
}) {
  const { hintId, errorId, describedBy } = fieldIds(id, { hint, error });
  const controlled = value !== undefined;
  const common = {
    id,
    name,
    required,
    "aria-invalid": error ? (true as const) : undefined,
    "aria-describedby": describedBy,
    className: styles.control,
  };

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      {hint ? (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      ) : null}
      {type === "textarea" ? (
        <textarea
          {...common}
          rows={6}
          placeholder={placeholder}
          minLength={minLength}
          maxLength={maxLength}
          value={value}
          defaultValue={controlled ? undefined : defaultValue}
          onChange={onChange}
        />
      ) : type === "select" ? (
        <select
          {...common}
          {...(controlled ? { value, onChange } : { defaultValue: defaultValue ?? "" })}
        >
          {children}
        </select>
      ) : (
        <input
          {...common}
          type={type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          minLength={minLength}
          maxLength={maxLength}
          value={value}
          defaultValue={controlled ? undefined : defaultValue}
          onChange={onChange}
        />
      )}
      {error ? (
        <p id={errorId} role="alert" className={styles.error}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
