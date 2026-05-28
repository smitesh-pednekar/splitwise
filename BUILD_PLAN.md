# BUILD_PLAN.md — Splitwise Clone
> Derived exclusively from `AI_CONTEXT.md`. Do not start implementation until this plan is approved.

---

## Overview

| Day | Focus | Deliverable |
|---|---|---|
| Day 1 | Backend foundation — models, auth, groups, expenses | Working Django API with auth + all endpoints |
| Day 2 | Frontend foundation — routing, auth, groups, expenses | Full CRUD UI wired to real API |
| Day 3 | Balances, settlements, polish, deploy | Complete app live on Vercel + Render |

---

## Day 1 — Backend

**Goal:** A fully working REST API that passes manual Postman tests for every endpoint.

### 1.1 Project Setup (30 min)
- [ ] Create Django project: `django-admin startproject splitwise`
- [ ] Create apps: `python manage.py startapp users`, `groups`, `expenses`, `settlements`
- [ ] Install dependencies:
  ```
  django
  djangorestframework
  mongoengine
  pymongo[srv]
  pyjwt
  bcrypt
  django-cors-headers
  gunicorn
  python-dotenv
  ```
- [ ] Configure `settings.py`:
  - Remove default DB config, add MongoEngine `connect()` call
  - Add `corsheaders` to INSTALLED_APPS and MIDDLEWARE
  - Load env vars from `.env` file

### 1.2 MongoEngine Models (45 min)
- [ ] `apps/users/models.py` — User document (name, email, password, created_at)
- [ ] `apps/groups/models.py` — Group document (name, admin, members[], created_at)
- [ ] `apps/expenses/models.py` — Expense document (all fields per AI_CONTEXT Section 10)
- [ ] `apps/settlements/models.py` — Settlement document (all fields per AI_CONTEXT Section 10)

### 1.3 JWT Utility (30 min)
- [ ] `utils/jwt_utils.py`:
  - `generate_token(user_id)` — encodes `{ user_id, exp }` with PyJWT
  - `decode_token(token)` — decodes and validates, raises on expiry
- [ ] DRF `authentication.py` — custom `JWTAuthentication` class that reads `Authorization: Bearer` header, decodes token, returns user

### 1.4 Auth Endpoints (45 min)
- [ ] `POST /api/v1/auth/register/` — hash password with bcrypt, create User, return token + user
- [ ] `POST /api/v1/auth/login/` — verify email + password, return token + user
- [ ] `GET /api/v1/auth/me/` — protected, return current user
- [ ] `GET /api/v1/users/search/?email=` — protected, return user by email (for adding to group)
- [ ] Wire urls into `splitwise/urls.py`

### 1.5 Groups Endpoints (60 min)
- [ ] `GET /api/v1/groups/` — return all groups where current user is a member
- [ ] `POST /api/v1/groups/` — create group, set admin = current user, members = [current user]
- [ ] `GET /api/v1/groups/:id/` — return group + populated member list
- [ ] `DELETE /api/v1/groups/:id/` — admin only; delete group + all its expenses + settlements
- [ ] `POST /api/v1/groups/:id/members/` — find user by email, add to members[]
- [ ] `DELETE /api/v1/groups/:id/members/:userId/` — admin removes any member, or user removes self (leave)

### 1.6 Expenses Endpoints (45 min)
- [ ] `GET /api/v1/groups/:id/expenses/` — list all expenses for group, sorted by date desc
- [ ] `POST /api/v1/groups/:id/expenses/` — create expense; set `participants` = current group members at time of creation
- [ ] `PUT /api/v1/groups/:id/expenses/:expId/` — edit (creator or admin only)
- [ ] `DELETE /api/v1/groups/:id/expenses/:expId/` — delete (creator or admin only)

### 1.7 Balance Calculator + Unit Tests (60 min)
- [ ] `utils/balance_calculator.py` — pure function:
  - Input: list of Expense objects + list of Settlement objects
  - Output: list of `{ from_user_id, to_user_id, amount }` dicts
  - Handles partial settlements, overpayments (direction flip), zero balances filtered out
- [ ] `tests/test_balance_calculator.py` — 7 test cases (per AI_CONTEXT Section 17)
- [ ] Run tests: `python manage.py test tests`

### 1.8 Balance + Settlement Endpoints (45 min)
- [ ] `GET /api/v1/groups/:id/balances/` — call `balance_calculator`, return enriched response with user names
- [ ] `GET /api/v1/dashboard/balances/` — iterate all user's groups, compute per-group net, sum overall
- [ ] `GET /api/v1/groups/:id/settlements/` — list settlements for group
- [ ] `POST /api/v1/groups/:id/settlements/` — create settlement record

### 1.9 Day 1 Verification (15 min)
- [ ] Test all endpoints in Postman or curl
- [ ] Confirm balance logic correct with a 3-person test scenario
- [ ] `python manage.py test` — all unit tests green

**Day 1 Done When:** All API endpoints return correct data. Balance tests pass.

---

## Day 2 — Frontend

**Goal:** A complete, navigable React app wired to the real API. All CRUD flows functional.

### 2.1 Project Setup (20 min)
- [ ] `npm create vite@latest splitwise-frontend -- --template react`
- [ ] Install dependencies:
  ```
  tailwindcss @tailwindcss/vite
  shadcn/ui (init)
  axios
  react-router-dom
  sonner
  lucide-react
  ```
- [ ] Configure Tailwind — extend theme with green accent `#00C48C`
- [ ] Add Google Font (Inter) in `index.html`
- [ ] Create `src/services/api.js` — Axios instance with `VITE_API_BASE_URL` base, auto-attaches `Bearer` token from localStorage

### 2.2 Auth Context + Pages (45 min)
- [ ] `AuthContext.jsx` — `{ user, token, login(), logout(), isAuthenticated }`
- [ ] `LoginPage.jsx` — email + password form, inline validation, toast on error, redirect to dashboard on success
- [ ] `RegisterPage.jsx` — name + email + password, same pattern
- [ ] Protected route wrapper — redirects to `/login` if no token
- [ ] Wire routes in `App.jsx` with React Router v6

### 2.3 Layout Components (45 min)
- [ ] `Sidebar.jsx` — logo, "Dashboard" link, group list (fetched), user avatar, logout
- [ ] `BottomNav.jsx` — mobile only, Dashboard | Groups | Add icons
- [ ] `PageWrapper.jsx` — renders Sidebar (≥md) + BottomNav (< md) + children
- [ ] `EmptyState.jsx` — accepts `icon`, `title`, `description`, `ctaLabel`, `onCta` props
- [ ] `LoadingSkeleton.jsx` — accepts `count` prop, renders N skeleton rows

### 2.4 Dashboard Page (30 min)
- [ ] `DashboardPage.jsx`:
  - Overall balance banner: "You are owed $X" / "You owe $X" / "All settled up"
  - Per-group balance cards (group name + net amount)
  - "Create New Group" button
  - Empty state if no groups

### 2.5 Create Group Page (30 min)
- [ ] `CreateGroupPage.jsx` + `CreateGroupForm.jsx`:
  - Group name input
  - Add member by email: search input → API call → show found user → "Add" button → chip list
  - Submit → POST `/api/v1/groups/` → redirect to new group detail
  - Toast on error (user not found, already in group)

### 2.6 Group Detail Page (60 min)
- [ ] `GroupDetailPage.jsx`:
  - Header: group name + member avatars/chips (show "[Left]" for removed members)
  - Tabs (shadcn/ui Tabs): **Expenses** | **Balances**
  - Admin controls: "Delete Group" button, member remove (×) icons

- [ ] **Expenses Tab** (`ExpenseList.jsx` + `ExpenseItem.jsx`):
  - List expenses sorted by date, most recent first
  - Each item: description, amount, "paid by [name]", category badge, date
  - Edit (pencil) + Delete (trash) icons for creator/admin
  - "Add Expense" button → navigate to `/groups/:id/expenses/new`
  - Empty state if no expenses

- [ ] **Balances Tab** (`BalancePanel.jsx`):
  - Pairwise balance rows: "[Name] owes [Name] $X"
  - "Settle Up" button → navigate to `/groups/:id/settle`
  - Empty state: "All settled up! 🎉"

### 2.7 Add Expense Page (30 min)
- [ ] `AddExpensePage.jsx` + `AddExpenseForm.jsx`:
  - Description input
  - Amount input (number, 2 decimal)
  - Payer dropdown (group members)
  - Category select (Food / Travel / Rent / Utilities / Others)
  - Date picker (default today)
  - Submit → POST `/api/v1/groups/:id/expenses/` → redirect back to group detail
  - Toast on success/error

### 2.8 Settle Up Page (30 min)
- [ ] `SettleUpPage.jsx` + `SettleUpForm.jsx`:
  - Payer dropdown (group members)
  - Payee dropdown (group members, exclude payer)
  - Amount input
  - Date picker (default today)
  - Submit → POST `/api/v1/groups/:id/settlements/` → redirect to group detail (Balances tab)
  - Toast on success

### 2.9 Day 2 Verification (20 min)
- [ ] Full manual walkthrough of 5-minute evaluator flow
- [ ] Confirm mobile layout at 375px viewport
- [ ] Check all toast notifications fire correctly
- [ ] Confirm protected routes redirect correctly

**Day 2 Done When:** Full evaluator flow works end-to-end against real API.

---

## Day 3 — Polish + Deployment

**Goal:** App is live, polished, and documented.

### 3.1 UI Polish (60 min)
- [ ] Review all pages on mobile — fix any layout issues
- [ ] Consistent spacing, font sizes, color usage
- [ ] Loading skeletons on: group list (sidebar), expense list, balance panel, dashboard
- [ ] Confirm all empty states are friendly and include a CTA
- [ ] Ensure group member "[Left]" display name works correctly
- [ ] Final color/spacing pass on all forms

### 3.2 Error Handling Hardening (30 min)
- [ ] Axios response interceptor — catch 401 (token expired) → auto-logout + redirect to `/login`
- [ ] All API error messages surfaced as toasts (not silent failures)
- [ ] Confirm form inline validation messages appear before submission

### 3.3 Backend Deployment — Render (45 min)
- [ ] Push backend to GitHub repo
- [ ] Create `render.yaml` or configure Render dashboard:
  - Build command: `pip install -r requirements.txt`
  - Start command: `gunicorn splitwise.wsgi:application --bind 0.0.0.0:$PORT`
- [ ] Set all environment variables in Render dashboard (see AI_CONTEXT Section 16)
- [ ] MongoDB Atlas: create cluster, create DB user, whitelist `0.0.0.0/0`
- [ ] Test deployed API with Postman — confirm auth + group + expense endpoints work

### 3.4 Frontend Deployment — Vercel (30 min)
- [ ] Push frontend to GitHub repo
- [ ] Import project in Vercel dashboard
- [ ] Set `VITE_API_BASE_URL` = Render backend URL
- [ ] Confirm build succeeds
- [ ] Test production app: full 5-minute evaluator flow on deployed URL

### 3.5 README.md (30 min)
Write a `README.md` that includes:
- [ ] Project description + screenshot
- [ ] Live demo URL (Vercel)
- [ ] Tech stack table
- [ ] Local development setup:
  - Backend: `pip install -r requirements.txt`, copy `.env`, `python manage.py runserver`
  - Frontend: `npm install`, copy `.env`, `npm run dev`
- [ ] Running tests: `python manage.py test tests`
- [ ] Note on Render cold starts (free tier may take ~30s on first load)
- [ ] Architecture overview (link to AI_CONTEXT.md)

### 3.6 Final Verification (30 min)
- [ ] Complete evaluator flow on **production** URL (not localhost)
- [ ] Test with 2 separate browser sessions (2 different users)
- [ ] Verify balances are correct after expenses + settlements
- [ ] All unit tests pass: `python manage.py test tests`
- [ ] No console errors in browser dev tools

**Day 3 Done When:** App is live, evaluator flow works on production URL, README is complete, unit tests pass.

---

## File Checklist

### Backend
```
splitwise_backend/
  manage.py
  requirements.txt
  .env.example
  render.yaml
  splitwise/
    settings.py
    urls.py
    wsgi.py
  apps/
    users/     models.py  serializers.py  views.py  urls.py
    groups/    models.py  serializers.py  views.py  urls.py
    expenses/  models.py  serializers.py  views.py  urls.py
    settlements/ models.py serializers.py views.py  urls.py
  utils/
    jwt_utils.py
    balance_calculator.py
  tests/
    test_balance_calculator.py
```

### Frontend
```
splitwise-frontend/
  package.json
  vite.config.js
  tailwind.config.js
  .env.example
  index.html
  src/
    main.jsx
    App.jsx
    context/AuthContext.jsx
    services/  api.js  authService.js  groupService.js  expenseService.js  settlementService.js  balanceService.js
    hooks/     useAuth.js  useGroups.js
    pages/     LoginPage  RegisterPage  DashboardPage  GroupDetailPage  AddExpensePage  SettleUpPage  CreateGroupPage
    components/
      ui/           (shadcn primitives)
      layout/       Sidebar  BottomNav  PageWrapper
      groups/       GroupCard  CreateGroupForm  MemberList
      expenses/     ExpenseList  ExpenseItem  AddExpenseForm
      settlements/  SettleUpForm
      balances/     BalancePanel  DashboardSummary
      common/       EmptyState  LoadingSkeleton  Avatar
```

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| MongoEngine + DRF ObjectId serialization bugs | High | Medium | Always `str(obj.id)`, test early |
| JWT manual implementation errors | Medium | High | Write + test jwt_utils.py on Day 1 before anything else |
| Balance calc off-by-one / float errors | Medium | High | Unit tests first, use `round(..., 2)` everywhere |
| Render cold starts breaking demo | High | Low | Note in README; pre-warm before demo |
| CORS blocking frontend | Medium | High | Test cross-origin request on Day 3 step 3.3 immediately |

---

> **Next Step:** Approve this plan → begin Day 1 backend implementation.
