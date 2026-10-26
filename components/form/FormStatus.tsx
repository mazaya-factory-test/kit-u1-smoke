// kit:layout-a11y@0.1.0 harvested from mazaya-studios:components/FormStatus.tsx
import { forwardRef } from "react";
import styles from "./form.module.css";

export type FormState = "idle" | "submitting" | "sent" | "failed";

/**
 * A focusable, polite live region for submission status. Keep it mounted so screen readers
 * announce changes to `message`; focus it via the ref after a failed submit.
 */
export const FormStatus = forwardRef<HTMLParagraphElement, { state: FormState; message: string }>(
  function FormStatus({ state, message }, ref) {
    return (
      <p
        ref={ref}
        tabIndex={-1}
        aria-live="polite"
        data-state={state}
        className={`${styles.status} ${state === "failed" ? styles.failed : ""}`}
      >
        {message}
      </p>
    );
  },
);
