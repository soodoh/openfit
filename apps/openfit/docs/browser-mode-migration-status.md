# Vitest Browser Mode Migration Status

## Current State (2026-04-09)

Branch: `feat/vitest-browser-mode`

### What's Done
- All 97 test files migrated from RTL imports to vitest-browser-react
- Vitest config with unit-node + unit-browser projects
- Vitest coverage with global thresholds
- TanStack Start virtual imports patch (postinstall script)
- Old deps removed, new deps installed
- Node tests: 174/174 passing
- Browser tests: 852/989 passing (86%)

### Remaining Failures (52 files, 137 tests)

These are API mismatches between RTL and vitest-browser-react's locator API.
The locator returned by `render()` doesn't support all RTL query methods.

#### Error Categories (by frequency)

| Count | Error | Fix |
|-------|-------|-----|
| 26 | `screen.getByPlaceholderText` not a function | Use `screen.getByRole('textbox')` or `page.getByPlaceholder()` |
| 13 | `(intermediate value).locator` not a function | Wrong API — use `page.locator()` instead |
| 10 | `screen.getByDisplayValue` not a function | Use `page.locator('input[value="..."]')` |
| 10 | `screen.getAllByRole` not a function | Use `screen.getByRole(...).all()` |
| 7 | `dayjs is not a function` | ESM default import issue in browser — use `import dayjs from "dayjs"` with interop |
| 6 | `screen.getAllByText` not a function | Use `screen.getByText(...).all()` |
| 6 | `screen.queryByText/queryByRole` not a function | Use `screen.getByText()` with `.not.toBeInTheDocument()` |
| 3 | `.parentElement`/`.closest` not a function | Locators don't have DOM traversal — use `page.locator()` CSS selectors |
| 2 | Can't spy on ESM exports | Browser mode limitation — restructure test to avoid spying on module exports |
| 3 | `userEvent.pointer` not a function | Use `userEvent.click()` or `page.locator().click()` |

#### Key API Differences (vitest-browser-react vs RTL)

The render result from `vitest-browser-react` returns Playwright-style locators, NOT DOM elements:

- `screen.getByRole()` ✅ works
- `screen.getByTestId()` ✅ works
- `screen.getByText()` ✅ works
- `screen.getByLabelText()` ✅ works
- `screen.getByPlaceholderText()` ❌ — use `page.getByPlaceholder()` from `@vitest/browser/context`
- `screen.getByDisplayValue()` ❌ — use `page.locator('input[value="..."]')`
- `screen.getAllByRole()` ❌ — use `screen.getByRole().all()`
- `screen.getAllByText()` ❌ — use `screen.getByText().all()`
- `screen.queryByText()` ❌ — use `screen.getByText()` with negative assertion
- `.parentElement` ❌ — use CSS selectors via `page.locator()`
- `.closest()` ❌ — use CSS selectors via `page.locator()`
- `render()` is **async** — must use `await render()`
- `renderHook()` is **async** — must use `await renderHook()`
