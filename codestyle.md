# Frontend Code Style Guide (codestyle)

## Specification Sources

The HTML / CSS / JavaScript standards for this project are based on community standards:

- **Google JavaScript Style Guide**  
  <https://google.github.io/styleguide/jsguide.html>
- Supplementary reference: **Airbnb JavaScript Style Guide**  
  <https://github.com/airbnb/javascript>
- HTML/CSS semantic and accessibility guidelines from **MDN Web Docs**

Items not explicitly enforced in upstream standards are defined by this project.

---

## 1. Naming Conventions

| Type | Style | Example |
|------|-------|---------|
| JS Variable / Function | camelCase | `expression`, `loadHistory` |
| Constant | UPPER_SNAKE_CASE | `API_BASE` |
| CSS Class | kebab-case | `history-item`, `result-view` |
| HTML id | camelCase or kebab | `historyList` / `history-list` |
| Filename | kebab / lower_case | `app.js`, `style.css` |

## 2. JavaScript

- Use `const` / `let`; `var` is prohibited.
- Statements must end with semicolons (Google Style).
- `eval`, `new Function`, and similar dynamic code execution are strictly forbidden.
- Asynchronous network requests must use `async` / `await` with `fetch`.
- Prefer `addEventListener` over inline `onclick` handlers.
- Errors must provide visible user feedback and never fail silently.

## 3. Architecture and Boundaries

Frontend **is allowed to**:

- Assemble expression strings from user interaction.
- Dispatch HTTP API requests.
- Render results, errors, and history returned by the backend.

Frontend **must not**:

- Calculate expression results locally.
- Send pre-calculated local results to the backend for storage only.
- Rely solely on LocalStorage as the primary calculation history storage.

## 4. HTML

- Use semantic tags: `header` / `main` / `section` / `footer`.
- Interactive elements must use `button` with explicit `type`.
- Specify `lang="en"`, `viewport`, and descriptive `aria-label` attributes.
- Keep CSS and scripts externally linked without large blocks of inline code.

## 5. CSS

- Use CSS variables for centralized theme colors and border radii.
- Prefer class selectors and avoid excessive nesting.
- Provide responsive single-column layouts on mobile viewports.
- Include interactive feedback states via `:hover` / `:active`.

## 6. File Organization

```text
src/
  index.html   # Markup structure
  css/style.css# Styling
  js/app.js    # Client behavior
```

- Separation of markup, presentation, and behavior.
- Consolidate backend service endpoint configuration in `API_BASE`.

## 7. Comments

- Include a file header describing module responsibility and core constraints.
- Document non-obvious design decisions rather than restating code literally.

## 8. Accessibility and Usability

- Display error messages in dedicated containers rather than relying solely on color.
- Maintain sufficiently large touch targets (≥ 40px visual height).
- Support standard keyboard shortcuts across all input workflows.

## 9. Formatting Recommendations

Optional toolchain:

```bash
npx prettier --write "src/**/*.{html,css,js}"
npx eslint src/js
```
