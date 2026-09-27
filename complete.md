# Yo Wallet — Project Status

## What Is Done

### Foundation (Phase 1)
- **Stack**: Create React App (v5 / `react-scripts 5.0.1`), React 18, plain JavaScript (no TypeScript). UI from Ant Design v5, toasts from `react-toastify`, routing via `react-router-dom` v6, Firebase (Auth + Firestore + Storage), **dayjs** (migrated from moment).
- **Firebase config**: read from `REACT_APP_FIREBASE_*` env vars with fallback defaults to the live project `pocketguard-2024`; `.env.example` committed, real `.env` / `.env.local` gitignored.
- **Security rules**: `firestore.rules` and `storage.rules` tracked in repo (users/transactions/budgets/receipts + groups with email-based membership). **Not yet deployed** to Firebase.
- **Auth** (`Components/SignUp&SignIn/index.js`): email/password + Google popup; awaits `createDoc(user)` before navigating; `setLoading(false)` centralized; raw error codes mapped to friendly messages via `utils/firebaseErrors.js`.
- **Dashboard fixes**: immutable state updates; single "Transaction Added" toast; `reset()` implemented with `Modal.confirm` (deletes all transactions + clears offline queue, undo not offered); modals use antd v5 `open` prop; filters guard missing `name`/`type`.
- **Transactions table**: working CSV export + import (validates rows, skips malformed ones), search/filter/sort, malformed-data-safe rendering.
- **Tests**: CRA Jest + Testing Library; **54 tests across 9 suites, all passing**.
- **Test infrastructure**: `src/setupTests.js` mocks `window.matchMedia` + `ResizeObserver` for jsdom/antd v5 compatibility.

### UI Redesign — "The Till & The Thread" (Phase 3)
- **Design language**: rooted in the bKash/Nagad/Rocket phone-money world. Tokens in `src/index.css`: ink `#1B1712`, paper `#F7F4EC`, surface `#FFFFFF`, magenta `#E2136E` (money-in/primary), teal `#0E6E5C` (money-out), line `#E6DFD0`, muted `#7A7262`; fonts **Bricolage Grotesque** (display) + **Manrope** (body).
- **`public/index.html`**: Google Fonts (loaded async so they never block first paint), `theme-color`, new description, plus an inline guard script that shows a "how to run" message if React never mounts (replaces the blank-page case).
- **`src/App.js`**: antd v5 `ConfigProvider` theme tokens (primary magenta, success teal, Manrope, component tokens) so antd widgets match the design.
- **`src/index.css`**: full token/global rewrite (buttons, inputs, cards, table classes) — 420 lines.
- **Components restyled**: `Header` (ink band + taka logo), `Cards` (giant till-hero with ৳ figure + IN/OUT stats), `TransactionsTable` (SMS-thread rows, signed magenta/teal amounts, running-balance "Till" column), `Modals`, `SignUp&SignIn`, `Button`/`Input` styles deduped, `MoneyAssistant` (FAB is ৳, hard-coded blue replaced with tokens), `BudgetCard`, `Groups`.
- **`public/manifest.json`**: PWA manifest — name "Yo Wallet", description mentions budgets/groups/SMS/receipt/offline, `display standalone`, `orientation portrait`. Minor: `theme_color` still references `#2970ff` (should be updated to `#E2136E`).

### Feature Phase (Phase 2)
- **SMS Quick-Add** — `utils/parseSms.js` + `Components/SmsParser`: parses bKash/Nagad/Rocket transaction SMS (amount, type, merchant, TrxID; provider inferred from TrxID/Ref prefix + timestamp cues), pre-fills the Add Expense/Income modal for confirmation.
- **Natural-Language Quick Add (expanded)** — `utils/parseNaturalLanguage.js` + `Components/QuickAddBar`: amount/type/tag/date/name extraction. Dates: today / yesterday / last night / **the day before yesterday** / N days-weeks-months ago / `YYYY-MM-DD` / **month-name dates** ("Jan 5", "5th January 2026"). Type verbs expanded (received, earned, credited, deposited, refund, cashback, prize, won, allowance, stipend, bonus, profit…). Tags map only to existing tags via a **type-valid tag guard** (`EXPENSE_TAGS`/`INCOME_TAGS`), so an income-only tag can never leak into an expense prefill.
- **Receipt OCR** — `utils/receiptExtractor.js` + `Components/ReceiptScanner` (tesseract.js, camera/file input): extracts total + merchant, pre-fills the expense modal; on save the photo is uploaded to Storage `users/{uid}/receipts/{transactionId}.jpg` and `receiptURL` written to the transaction.
- **Budget Goals + Predictive Burn-Down** — `utils/budgetUtils.js` (spent/limit/percent, projected month-end, overspend flag; injectable `now` for deterministic tests), `Components/BudgetCard` progress bars + "on track to overspend" tag, 80%-used toast (once per session), `pages/Budgets`.
- **Groups / Split Expenses** — `utils/groupsUtils.js` (net balances, greedy minimal transfers, overview, settlements-aware balances), `pages/Groups`, `pages/GroupDetail` (add group expense, per-member owes/is-owed, simplified settlement plan, **Settle Up**). Routes `/groups`, `/groups/:groupId`.
- **"Ask Your Money" Chat Assistant** — `utils/queryParser.js` (spending / compare / biggest / average over today…this month) + `Components/MoneyAssistant` floating chat widget with inline recharts (pie for categories, bars for compare), templated answers, no external LLM.
- **Offline-First PWA** — `offlineQueue.js` (idb `yo-wallet/pending`), CRA `InjectManifest` service worker (`src/service-worker.js`), `serviceWorkerRegistration.js` (prod-only), real `public/manifest.json`; offline adds are queued + shown with a `pending sync` Tag, flushed to Firestore on `online`, offline banner on Dashboard.

### Migration & Performance (Phase 3)
- **moment → dayjs**: complete. New `src/utils/dayjs.js` wrapper configures the `customParseFormat` plugin. Migrated `Modals/addExpense.js`, `Modals/addIncome.js`, `pages/Dashboard.js`, `pages/Budgets.js`, `pages/GroupDetail.js`, `utils/budgetUtils.js`, `utils/queryParser.js`, `utils/parseSms.js`, `parseNaturalLanguage.js` (+ tests). `moment` removed from `package.json` and `node_modules`.
- **`offlineQueue.js` bug fix**: previously called `.put/.getAll/.delete/.clear` on the idb **promise** (`db.getAll is not a function` after sign-in). Every function now `await getDb()` with try/catch hardening.
- **`calculateBalance` hardened**: unknown transaction types are now **ignored with a `console.warn`** instead of being counted as expenses (test: `calculateBalance.test.js` "ignores unknown transaction types").
- **First-load speed**: Google Fonts made non-render-blocking; `.env.local` (gitignored) sets `GENERATE_SOURCEMAP=false` + `DISABLE_ESLINT_PLUGIN=true` to shorten dev compiles; deleted a bloated **1.14 GB** `node_modules/.cache` (freed ~1.1 GB on `E:`).
- **Measured** (real Chromium, localhost): React mounts in **3.5 s**, DOMContentLoaded **2.1 s**, 0 page errors, warm reload **37 ms**; cold `npm start` → ready **~37 s**.
- **Production build**: `npm run build` completed successfully — `build/` contains `main.css`, `main.js`, and `service-worker.js` (PWA service worker present).
- **New deps**: `recharts@3.10.1`, `tesseract.js@7.0.0`, `idb@8.0.3`, `dayjs@^1.11.13`, `ajv@^7.2.4` (devDep, CRA peer-dep fix).

## Remaining Work (Phase 4)

1. **Deploy security rules** — `firebase deploy --only firestore:rules,storage` for `pocketguard-2024`; requires a `firebase.json` config file (does not exist yet). Enable Storage if not already; otherwise new groups/budget/Storage writes are blocked or the DB is default-open.
2. **Sync lockfile** — run `npm install` so `package-lock.json` drops the removed `moment` (still listed at root) and adds `dayjs` to root deps; lockfile is currently out of sync with `package.json`.
3. **Non-blocking ESLint/console warnings** — unused `analytics` (Dashboard.test.js), unused `signedUpMembers` (`GroupDetail.js`), `exhaustive-deps` warnings (`Budgets.js`, `Groups.js`, `GroupDetail.js`, `Dashboard.js`). Note: `.env.local` disables the ESLint plugin in dev, so these only surface in `npm run build`.
4. **antd Table `rowKey` deprecation** — index-based fallback logs a warning; give server docs a stable key or derive from `pendingSync`.
5. **Bundle size** (~630 kB gzipped prod) — lazy-load tesseract-based `ReceiptScanner` and recharts-based `MoneyAssistant`.
6. **tesseract.js CDN dependency** — worker/language files load from CDN at runtime; consider self-hosting for true offline OCR.
7. **PWA end-to-end verification** — test installed app on HTTPS: offline add → auto-sync, receipt upload, group flows.
8. **manifest.json theme_color** — currently `#2970ff` (CRA default blue), should be updated to `#E2136E` to match the design tokens.
9. **Polish** — replace default CRA `README.md` (still boilerplate), align QuickAddBar input with antd, add member-editing UI for groups.

## Resolved (from original findings)
State-mutation bug, duplicate toasts, no-op reset, dead CSV buttons, `visible`→`open`, missing-field crash, auth race, raw error messages, no tests, no tracked rules, no `.env`, offline-queue crash, moment dependency, `calculateBalance` treating unknown types as expenses — all addressed. Default CRA `manifest.json` replaced; SW registered (prod); production build passes.

## File Inventory

| Category | Files |
|---|---|
| **Components** | `BudgetCard`, `Button`, `Cards`, `Header`, `Input`, `MoneyAssistant`, `QuickAddBar`, `ReceiptScanner`, `SmsParser`, `SignUp&SignIn`, `Modals` (addExpense, addIncome, TransactionsTable) |
| **Pages** | `Signup.js`, `Dashboard.js`, `Groups.js`, `GroupDetail.js`, `Budgets.js` |
| **Utils** | `budgetUtils.js`, `calculateBalance.js`, `dayjs.js`, `firebaseErrors.js`, `groupsUtils.js`, `parseNaturalLanguage.js`, `parseSms.js`, `queryParser.js`, `receiptExtractor.js`, `tags.js` |
| **Tests (9 suites, 54 tests)** | `budgetUtils.test.js`, `calculateBalance.test.js`, `groupsUtils.test.js`, `parseNaturalLanguage.test.js`, `parseSms.test.js`, `queryParser.test.js`, `receiptExtractor.test.js`, `Dashboard.test.js`, `TransactionsTable/index.test.js` |
| **Config/Rules** | `firestore.rules`, `storage.rules`, `.env.example`, `public/manifest.json`, `public/index.html` |
| **PWA** | `offlineQueue.js`, `service-worker.js`, `serviceWorkerRegistration.js` |
