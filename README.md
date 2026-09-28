# Calculator Frontend

The **visual frontend** of the client-server calculator system: responsible for user interface, keypad interactions, expression input, result and history rendering, and deletion requests.

## Project Overview

- Web application implementation.
- Takes user expressions via the interface and **only transmits expression strings to the backend**.
- **Performs no local calculation of final results**; displayed results originate strictly from backend JSON responses.
- Queries and modifies calculation history strictly through backend APIs.

## Tech Stack

| Component | Choice |
|-----------|--------|
| Markup | HTML5 |
| Styles | CSS3 |
| Scripts | Vanilla JavaScript (ES2020+) |
| Communication | Fetch API + JSON |

Requires no build steps; runs directly as static assets.

## Environment

- Modern web browser (Chrome / Edge / Firefox / Safari).
- A running backend service (see `24125474_calculator_backend`).

## Installation

No npm dependencies required. Use the `src/` directory directly.

To launch a local static server:

```powershell
python -m http.server 5500 --directory src
```

Or open `src/index.html` directly in a browser (with backend running and CORS allowed).

## Usage

1. Start the backend first (see `24125474_calculator_backend/README.md`).
2. Open `src/index.html` or access the static server URL.
3. Click buttons or use keyboard to enter expressions, then press `=` / `Enter` to calculate via backend.

## Configuration

The backend address is resolved in `src/js/app.js` in this order:

1. `window.CALCULATOR_API_BASE` set in `src/index.html` (recommended for deployments).
2. The host serving the page, port `8000` (local servers and LAN access).
3. `http://127.0.0.1:8000` for pages opened directly from the file system (`file://`).

For public deployments, set the real backend origin in `src/index.html`, otherwise visitors' browsers will try to reach the backend on **their own machine**:

```html
<script>window.CALCULATOR_API_BASE = "https://your-backend-url.com";</script>
<script src="js/app.js"></script>
```

A reverse-proxy path such as `/backend` is also accepted.

## Behavior Notes

- `±` toggles the sign of the current operand (wraps trailing numbers with `(-n)` or removes the negative sign).
- `%` divides the current number by 100.
- Expression length is capped at 256 characters (matching backend limits).
- When a button has focus, `Enter` activates that button (e.g. Delete) instead of triggering a calculation.
- Backend errors (invalid expression, division by zero, server errors) are displayed in the error message container.

## Client-Server Connection

```text
Browser Page  --HTTP/JSON-->  Backend /api/*  -->  SQLite
```

| Interaction | Request | Frontend Behavior |
|-------------|---------|-------------------|
| Calculate | `POST /api/calculate` | Sends expression, renders result or error message, and refreshes history |
| Load History | `GET /api/history` | Fetches calculation records and renders expression, result, and timestamp |
| Delete Item | `DELETE /api/history/{id}` | Deletes single record by ID and refreshes list |
| Clear History | `DELETE /api/history` | Clears all records and refreshes list |

## Project Structure

```text
24125474_calculator_frontend/
├── src/
│   ├── index.html      # Calculator markup + deployment API configuration
│   ├── css/
│   │   └── style.css   # Stylesheet
│   └── js/
│       └── app.js      # Interactions and API requests (no local evaluation)
├── codestyle.md
└── README.md
```

## Features

- Basic arithmetic, parentheses, decimals, unary negation (`±`), percentage (`%`).
- Displays `×` and `÷` in UI while transmitting `*` and `/` to backend.
- Scientific-notation results (for example `1e-7`) can be used directly in the next calculation.
- Keyboard support: `0-9`, `+ - * /`, `( ) .`, `Enter`/`=`, `Backspace`, `Esc`.
- Backend errors (invalid expression, division by zero, `422`, `500`) displayed in the message container.
- History list supports single deletion and full clearing backed by SQLite.

## Code Style

See [codestyle.md](./codestyle.md) (based on Google JavaScript Style Guide).
