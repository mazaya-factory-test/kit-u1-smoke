// kit:layout-a11y@0.1.0 harvested from mazaya-studios:components/FormField.tsx, AV-Events:components/ui/field.tsx (id wiring extracted so it can be tested)

export type FieldIds = {
  readonly hintId: string | undefined;
  readonly errorId: string | undefined;
  /** Space-separated ids that exist in the DOM, or undefined when there are none. */
  readonly describedBy: string | undefined;
};

/** aria-describedby must only list ids that are rendered, so build it from what is present. */
export function fieldIds(id: string, parts: { hint?: string; error?: string }): FieldIds {
  const hintId = parts.hint ? `${id}-hint` : undefined;
  const errorId = parts.error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return { hintId, errorId, describedBy };
}
