// kit:layout-a11y@0.1.0 harvested from mazaya-studios:components/MobileNav.tsx (open/close logic extracted so it can be tested)

export type MobileNavState = {
  readonly open: boolean;
  /** True only when the panel closed because of Escape: focus goes back to the toggle button. */
  readonly returnFocus: boolean;
};

export type MobileNavAction =
  | { readonly type: "toggle" }
  | { readonly type: "escape" }
  | { readonly type: "route-change" };

export const initialMobileNavState: MobileNavState = { open: false, returnFocus: false };

export function mobileNavReducer(state: MobileNavState, action: MobileNavAction): MobileNavState {
  switch (action.type) {
    case "toggle":
      return { open: !state.open, returnFocus: false };
    case "escape":
      return state.open ? { open: false, returnFocus: true } : state;
    case "route-change":
      return state.open ? { open: false, returnFocus: false } : state;
  }
}
