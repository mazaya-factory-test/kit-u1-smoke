import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FormField } from "./FormField";
import { FormStatus } from "./FormStatus";
import { fieldIds } from "./field-ids";

const describedBy = (html: string) => /aria-describedby="([^"]*)"/.exec(html)?.[1];

describe("fieldIds", () => {
  it("lists only ids that exist", () => {
    expect(fieldIds("n", {})).toEqual({ hintId: undefined, errorId: undefined, describedBy: undefined });
    expect(fieldIds("n", { hint: "h" }).describedBy).toBe("n-hint");
    expect(fieldIds("n", { error: "e" }).describedBy).toBe("n-error");
    expect(fieldIds("n", { hint: "h", error: "e" }).describedBy).toBe("n-hint n-error");
  });
});

describe("FormField", () => {
  it("has no aria-describedby and no aria-invalid when clean", () => {
    const html = renderToStaticMarkup(<FormField id="email" name="email" label="Email" />);
    expect(html).not.toContain("aria-describedby");
    expect(html).not.toContain("aria-invalid");
    expect(html).toContain('for="email"');
  });

  it("wires hint and error ids, and sets aria-invalid, only when present", () => {
    const hintOnly = renderToStaticMarkup(<FormField id="e" name="e" label="E" hint="We never share it" />);
    expect(describedBy(hintOnly)).toBe("e-hint");
    expect(hintOnly).toContain('id="e-hint"');
    expect(hintOnly).not.toContain("aria-invalid");

    const both = renderToStaticMarkup(<FormField id="e" name="e" label="E" hint="h" error="Required" />);
    expect(describedBy(both)).toBe("e-hint e-error");
    expect(both).toContain('id="e-error"');
    expect(both).toContain('role="alert"');
    expect(both).toContain('aria-invalid="true"');
  });

  it("works controlled and uncontrolled", () => {
    const controlled = renderToStaticMarkup(<FormField id="a" name="a" label="A" value="x" onChange={() => {}} />);
    expect(controlled).toContain('value="x"');
    const uncontrolled = renderToStaticMarkup(<FormField id="a" name="a" label="A" />);
    expect(uncontrolled).not.toContain("value=");
    const select = renderToStaticMarkup(
      <FormField id="s" name="s" label="S" type="select" error="Pick one">
        <option value="">Choose</option>
      </FormField>,
    );
    expect(select).toContain("<select");
    expect(select).toContain('aria-invalid="true"');
  });
});

describe("FormStatus", () => {
  it("is a focusable polite live region", () => {
    const html = renderToStaticMarkup(<FormStatus state="failed" message="Could not send" />);
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('tabindex="-1"');
    expect(html).toContain("Could not send");
    expect(html).toContain('data-state="failed"');
  });
});
