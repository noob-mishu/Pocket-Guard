# AGENTS.md

Yo Wallet: a Create React App (v5) expense-tracker PWA, plain JavaScript (no TypeScript), React 18, Ant Design v5, react-toastify, react-router-dom v6, Firebase (Auth + Firestore). Bootstraped from CRA; the default README is uninformative.

## Commands

- `npm start` — dev server on http://localhost:3000
- `npm run build` — production build to `build/`
- `npm test` — CRA Jest runner, **interactive watch mode** by default; use `CI=true npm test` for a single non-interactive run
- No lint/typecheck script exists; ESLint runs implicitly inside `react-scripts start/build`. There are zero test files in the repo.

## Architecture

- Entry: `src/index.js` → `src/App.js`. Routes: `/` → `src/pages/Signup.js`, `/dashboard` → `src/pages/Dashboard.js`.
- Every component lives in a PascalCase folder under `src/Components/` exporting `index.js` (e.g. `Components/Header/index.js`, `Components/Cards/index.js`). New components should follow this convention, not `<Name>.jsx`.
- Shared Firebase instance is exported from `src/firebase.js` (`db`, `auth`, `provider`).

## Data model (Firestore)

- Auth users: document at `users/{uid}` (created in `Components/SignUp&SignIn/index.js` via `createDoc`).
- Transactions: subcollection `users/{uid}/transactions`. Shape: `{ type, date: "YYYY-MM-DD" string, amount: number, tag, name }`.
- `transaction.type` is only ever `"income"` or `"expense"`; `Dashboard.js` `calculateBalance` treats anything not `"income"` as an expense.
- Dates come from antd `DatePicker` (moment objects); formatted with `.format('YYYY-MM-DD')` before storing.

## Gotchas

- Firebase config is read from `REACT_APP_FIREBASE_*` env vars (`src/firebase.js`) with hard-coded fallback defaults for the live project `pocketguard-2024`; see `.env.example`. Auth, the dashboard, and any toast involving Firestore will fail without network/credentials. `firestore.rules` is tracked in the repo root.
- antd v5 deprecates `Modal`'s `visible` prop in favor of `open`; existing modals now use `open`.
- `Components/SignUp&SignIn/index.js` imports `GoogleAuthProvider` from `firebase/auth/web-extension` (non-standard path) — keep it working if touching auth.
- Do not commit `.env` files with real values; commit only `.env.example` (`.env` and `.env.local` are gitignored).