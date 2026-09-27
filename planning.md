# Yo Wallet — Planning

## 0. Project Snapshot

**Stack:** Create React App (react-scripts 5.0.1), React 18, plain JavaScript, Ant Design v5, react-toastify, react-router-dom v6, Firebase (Auth + Firestore + Storage), **dayjs** (migrated from moment).

**Entry / Routing:** `src/index.js` → `src/App.js`:
- `/` → `pages/Signup.js`
- `/dashboard` → `pages/Dashboard.js`
- `/groups` → `pages/Groups.js`
- `/groups/:groupId` → `pages/GroupDetail.js`
- `/budgets` → `pages/Budgets.js`

**Convention:** Components live in PascalCase folders under `src/Components/` exporting `index.js`.

**Data model (Firestore):**
- `users/{uid}` — created on first login via `createDoc`
- `users/{uid}/transactions` — `{ type: "income" | "expense", date: "YYYY-MM-DD", amount: number, tag, name, receiptURL? }`
- `users/{uid}/budgets` — budget docs `{ category, limit, month: "YYYY-MM" }`
- `groups/{groupId}` — `{ name, memberEmails: [email, ...], createdBy: email, createdAt }`
- `groups/{groupId}/expenses` — `{ description, amount, paidBy: email, splitBetween: [email,...], date }`
- `groups/{groupId}/settlements` — `{ from: email, to: email, amount, date }`
- `users/{uid}/receipts/{transactionId}.jpg` — Firebase Storage receipt images

**State of the repo (after Phase 1 + 2 + 3):**
- Firebase config via `REACT_APP_FIREBASE_*` env vars with hard-coded fallback to live project `pocketguard-2024`; `.env.example` tracked, real `.env` / `.env.local` gitignored
- `firestore.rules` (users, budgets, receipts, groups) and `storage.rules` tracked — **not yet deployed**
- antd v5 modals use `open` (not `visible`)
- `GoogleAuthProvider` imported from non-standard `firebase/auth/web-extension` path — keep working
- **UI redesign "The Till & The Thread"** shipped (tokens, fonts, till hero, SMS-thread table, themed antd)
- **dayjs migration complete** (`src/utils/dayjs.js` wrapper + `customParseFormat`); `moment` removed
- `.env.local` sets `GENERATE_SOURCEMAP=false` + `DISABLE_ESLINT_PLUGIN=true` for faster dev compiles
- **54 tests passing (9 suites)**; production build previously passed — re-check after migration
- No lint/typecheck script (ESLint runs implicitly in `start`/`build`; disabled in dev via `.env.local`)

---

## 1. Phase 1 — Stabilize ✅ COMPLETE

| # | Fix | Status |
|---|-----|--------|
| 1 | Immutable `setTransactions(prev => [...prev, transaction])` | Done — `pages/Dashboard.js` |
| 2 | Remove duplicate toasts | Done — `pages/Dashboard.js` |
| 3 | Implement `reset()` | Done (Modal.confirm → delete all + clear offline queue) |
| 4 | Implement CSV export/import | Done — `TransactionsTable/index.js` |
| 5 | `visible` → `open` | Done — both `addExpense.js` / `addIncome.js` |
| 6 | Guard filter against missing fields | Done — `(item.name || '')`, `(item.type || '')` |
| 7 | Await `createDoc`; centralize `setLoading(false)` | Done — `SignUp&SignIn/index.js` |
| 8 | Re-check "not income = expense" | Left as documented behavior (only `"income"`/`"expense"` types exist) |
| 9 | Friendly Firebase error messages | Done — `utils/firebaseErrors.js` |
| 10 | Firebase config to `.env` | Done — `src/firebase.js`, `.env.example` |
| 11 | Firestore rules in repo | Done — `firestore.rules` (groups + budgets added in Phase 2) |
| 12 | Strip `console.log`s | Done |
| 13 | First unit tests | Done — `calculateBalance.test.js`, `TransactionsTable/index.test.js` |

---

## 2. Phase 2 — Differentiating Features ✅ COMPLETE (54/54 tests)

| Feature | Files | Status |
|---------|-------|--------|
| 2.1 SMS Quick-Add (bKash/Nagad/Rocket) | `utils/parseSms.js`, `Components/SmsParser/index.js` | Done — provider inferred from TrxID/Ref prefix; 9 format tests |
| 2.2 Natural-Language Quick Add | `utils/parseNaturalLanguage.js`, `Components/QuickAddBar/index.js` | Done — amount/type/tag/date/name; expanded in Phase 3 (see below) |
| 2.3 Receipt OCR | `utils/receiptExtractor.js`, `Components/ReceiptScanner/index.js`, `tesseract.js` | Done — OCR → prefill; image uploaded to Storage after `addDoc`, `receiptURL` saved; 6 tests |
| 2.4 Budget Goals + Burn-Down | `utils/budgetUtils.js`, `Components/BudgetCard/index.js`, `pages/Budgets.js`, 80% toast | Done — projection via injectable `now`; 5 tests |
| 2.5 Split Expenses / Groups | `utils/groupsUtils.js` (`netBalances`/`minTransfers`/`buildBalancesOverview`/`computeBalances`), `pages/Groups.js`, `pages/GroupDetail.js` | Done — group expenses, balances, settle-up (writes settlements); 4 tests |
| 2.6 "Ask Your Money" Chat Assistant | `utils/queryParser.js`, `Components/MoneyAssistant/index.js`, `recharts` | Done — intents: spending (pie), compare (bars), biggest, average; 2 tests |
| 2.7 Offline-First PWA | `offlineQueue.js` (`idb`), `service-worker.js`, `serviceWorkerRegistration.js`, `public/manifest.json`, `storage.rules` | Done — prod-only SW registration, optimistic rows tagged `pending sync`, online/offline listeners + queue flush |

**New deps:** `recharts@3.10.1`, `tesseract.js@7.0.0`, `idb@8.0.3`, `dayjs@^1.11.13`.

**Gotchas discovered during build:**
- CRA uses `workbox-webpack-plugin.InjectManifest` with `swSrc = src/service-worker.js` — the SW only compiles in production builds; registering in dev would 404.
- `indexedDB` is absent in jsdom — `offlineQueue` degrades to "nothing pending" so tests don't crash.
- Two test files were self-inconsistent and were corrected to match math (groups net balances sum ≠ 0) and fixed-date budget projections (`budgetProjection` now takes optional `now`).
- Bundle grew to **~630 kB gzipped** prod (tesseract.js + recharts + antd).

---

## 3. Phase 3 — Redesign, Migration & Performance ✅ COMPLETE

### 3.0 UI Redesign — "The Till & The Thread"
- [x] Token system in `src/index.css` (ink/paper/magenta/teal/line/muted) + fonts Bricolage Grotesque + Manrope.
- [x] antd theme via `ConfigProvider` in `src/App.js` (primary magenta, success teal).
- [x] `Header` ink band + taka logo; `Cards` till hero; `TransactionsTable` SMS-thread with running-balance "Till" column; `SignUp&SignIn` + modals + `MoneyAssistant`/`BudgetCard` restyled to tokens.
- [x] `public/index.html`: async fonts, `theme-color`, description, blank-page "how to run" guard.
- [x] Verified via Playwright computed-style audit (fonts load, tokens applied, no horizontal scroll).

### 3.1 moment → dayjs migration
- [x] `src/utils/dayjs.js` wrapper with `customParseFormat`.
- [x] Migrated pages (`Dashboard`, `Budgets`, `GroupDetail`), modals (`addExpense`, `addIncome`), utils (`budgetUtils`, `queryParser`, `parseSms`, `parseNaturalLanguage`) + tests.
- [x] `moment` removed from `package.json` and `node_modules`.

### 3.2 Parser expansion
- [x] Date phrases: "the day before yesterday", month-name dates ("Jan 5", "5th January 2026") via dayjs.
- [x] Income verbs: received/earned/credited/deposited/refund/cashback/prize/won/allowance/stipend/bonus/profit.
- [x] Type-valid tag guard against `EXPENSE_TAGS`/`INCOME_TAGS`; expanded keyword map + stop-word list for clean names.

### 3.3 Bug fix
- [x] `offlineQueue.js` — all functions now `await getDb()` (was calling IndexedDB methods on a promise → `db.getAll is not a function`).

### 3.4 First-load performance
- [x] Async Google Fonts (no render-blocking CDN).
- [x] `.env.local`: `GENERATE_SOURCEMAP=false`, `DISABLE_ESLINT_PLUGIN=true`.
- [x] Deleted bloated 1.14 GB `node_modules/.cache` (freed ~1.1 GB on `E:`).
- [x] Measured: React mounts 3.5 s, warm reload 37 ms, 0 page errors, cold start ~37 s.

**Gotchas discovered:**
- dayjs `customParseFormat` month names are **case-sensitive** — `dayjs("jan 5 2026", "MMM D YYYY")` is invalid; must pass `Jan`.
- CRA dev server returns 404 for client routes unless the request sends `Accept: text/html` (browsers do; plain `curl`/`Invoke-WebRequest` don't) — not a routing bug.
- `node_modules/.cache` (babel + eslint) can grow past 1 GB and fill the disk; it is regenerable and safe to delete when space is tight.
- A full disk surface as `ENOSPC` on `npm run build`/`npm install` and as `FileSystem.writeFile` failures.

---

## 4. Phase 4 — What Still Needs Doing

Before this, deploy the rules (below) or the new collections/groups/Storage writes will be rejected.

### 4.1 Deploy / ops (do first)
- [ ] Run `firebase deploy --only firestore:rules,storage` (project `pocketguard-2024`) to make `firestore.rules` + `storage.rules` live.
- [ ] Verify Storage bucket is enabled in Firebase console (receipt uploads).
- [ ] `npm install` to sync `package-lock.json` (drop removed `moment`; dayjs already present).
- [ ] Smoke-test on HTTPS + installed PWA: SW registration, offline add → online auto-sync, receipt upload, group create/expense/settle.

### 4.2 Cleanup / hardening
- [ ] Resolve the non-blocking ESLint warnings: unused `analytics` (Dashboard.test.js), unused `signedUpMembers` (GroupDetail.js), `exhaustive-deps` warnings in `Budgets.js`, `Groups.js`, `GroupDetail.js`, `Dashboard.js`. (Only visible in `npm run build` now that dev ESLint is disabled.)
- [ ] antd `Table` `rowKey` function uses the deprecated `index` fallback param (console warning in test) — give server docs a stable key (e.g. store doc id) or use `record.pendingSync ? record.id : undefined`.
- [ ] GroupDetail: seeded `Select initialValue={members}` — confirm resize/edge cases; consider editing member lists (no UI yet).
- [ ] QuickAddBar uses a plain `<input>` styled as `.btn` — align with antd `<Input>` for consistency/a11y.

### 4.3 Performance / bundle
- [ ] Re-run `npm run build` after the dayjs migration (disk now freed) and re-measure.
- [ ] Code-split the heavy features: lazy-load `ReceiptScanner` (tesseract.js) and `MoneyAssistant` (recharts) so /dashboard initial JS shrinks from ~630 kB gzipped.
- [ ] `tesseract.js` loads worker + language models from CDN at runtime (default) — requires network; evaluate self-hosting `workerPath`/`langPath`/`cachePath` for true offline OCR.

### 4.4 Nice-to-have (open decisions, deferred)
- [ ] Check types beyond `income`/`expense`: `calculateBalance` treats anything non-`income` as expense — revisit when/if `transfer`/`settlement` types appear in user transactions.
- [ ] MoneyAssistant could answer "date X vs Y", month-over-month, or budget-aware questions next.
- [ ] Replace default CRA `README.md` with real project docs.

---

*Next step: deploy the security rules and sync the lockfile (4.1), then work the cleanup list (4.2).*
