# Accessibility testing

HireGeneral's public Playwright suite enforces a launch accessibility baseline
across the home, jobs, salary guide, employer, sign-in, and sign-up pages.

The checks cover:

- one primary `main` landmark and one page `h1`
- document language
- keyboard-accessible skip navigation
- accessible names for links and buttons
- labels for form controls
- alternative text attributes for images
- horizontal overflow at a 390-pixel viewport

These checks complement ESLint and manual WCAG 2.2 review; they do not replace
screen-reader, keyboard-only, zoom, reduced-motion, or color-contrast testing.
New critical public routes should be added to `e2e/accessibility.spec.ts`.
