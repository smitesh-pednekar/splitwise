# AI_CONTEXT.md — Splitwise Clone
> **Single source of truth** for the entire project. Last updated: Day 3 COMPLETE — fully deployed.
> Another engineer should be able to paste this file into an AI tool and recreate a similar app.

---

## 1. Project Overview

| Field | Value |
|---|---|
| Purpose | Internship assignment evaluation |
| Goal | Demonstrate ability to understand a product, scope it, collaborate with AI, and deliver a functional clone |
| Timeline | 3-day focused build |
| Priority | Correctness + reproducibility first, polish second |

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) |
| UI Library | Tailwind CSS v4 + shadcn/ui + Radix UI |
| Typography | Geist font (sans) |
| Toast Notifications | Sonner (or react-hot-toast) |
| Backend | Django (Python) + Django REST Framework (DRF) |
| Database | MongoDB Atlas (free M0 cluster) |
| ODM | MongoEngine |
| Auth | JWT — single access token, 7-day expiry, stored in localStorage |
| Frontend Deploy | Vercel |
| Backend Deploy | Render (free web service) |
| CORS | django-cors-headers |

---

## 3. MVP Scope

### In Scope
- User sign up / login with email + password + name
- Create a group + add members by email (registered users only)
- Add expenses with equal splits across ALL current group members
- View balances: who owes whom — per group (tabbed view) + overall dashboard
- "Settle Up" — record a partial or full payment between two members
- Persistent sidebar (desktop) + bottom nav (mobile)
- Mobile responsive layout
- Light mode UI with green accent (`#00C48C` / `#5BC5A7`)
- Toast notifications for errors + success; inline validation for forms
- Skeleton/spinner loading states for major data fetches
- Friendly empty states with CTA on empty lists
- Unit tests for backend balance calculation logic

### Out of Scope (explicitly)
- Activity feed / history log
- Email notifications
- Receipt upload / scanning
- Recurring expenses
- Multiple currencies
- Comments on expenses
- Unequal / subset splits (all members always split equally)
- Simplified debt algorithm (debt consolidation chains)
- Social auth (Google, GitHub, etc.)
- Native mobile app
- Invite for non-registered users
- Dark mode toggle
- Expense pagination (return all — small groups assumed)
- Frontend automated tests

---

## 4. Evaluator Experience (5-Minute Flow)
1. Sign up or log in
2. Create a group and add members by email
3. Add multiple expenses to the group
4. View the Balances tab — see who owes whom
5. Record a (partial or full) settlement and confirm balances update

---

## 5. Authentication

| Decision | Value |
|---|---|
| Login identifier | Email only |
| Registration fields | `email`, `password`, `name` (display name) |
| Token type | Single JWT access token |
| Token expiry | 7 days |
| Token storage | `localStorage` (client side) |
| Token refresh | None |
| Social auth | Out of scope |

### Auth Endpoints
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/register/` | Register — returns token + user |
| POST | `/api/v1/auth/login/` | Login — returns token + user |
| GET | `/api/v1/auth/me/` | Get current user info (protected) |

**All protected routes require:** `Authorization: Bearer <token>`

---

## 6. Groups

| Decision | Value |
|---|---|
| Member discovery | By email — must be a registered user |
| Multi-group membership | Yes |
| Group admin | Group creator is the admin |
| Admin powers | Delete group, remove any member |
| Member leaving | Allowed; their past expenses + balances remain, displayed as "[Left]" |
| Group deletion | Admin only — cascades: deletes all expenses + settlements in the group |
| Non-admin members | Equal — no other roles |

---

## 7. Expenses

| Decision | Value |
|---|---|
| Payer | Any group member, selected from dropdown |
| Participants | ALL current group members (no subset selection) |
| Split type | Equal split only: `amount / N` per person |
| Fields | `description`, `amount`, `payer`, `date` (default today), `category` |
| Categories | Food, Travel, Rent, Utilities, Others |
| Edit permission | Expense creator OR group admin |
| Delete permission | Expense creator OR group admin |
| Notes field | Out of scope |

---

## 8. Balance Calculation

| Decision | Value |
|---|---|
| Storage | NOT stored — computed on the fly from expenses + settlements |
| Scope | Per-group AND overall dashboard |
| Algorithm | Raw pairwise net balances (no debt consolidation) |
| Computed by | Backend utility: `utils/balance_calculator.py` |
| API response shape | List of `{ from_user, to_user, amount }` where amount > 0 |

### Algorithm (pseudocode)
```
owed = defaultdict(lambda: defaultdict(float))  # owed[debtor][creditor]

for expense in group.expenses:
    share = expense.amount / len(expense.participants)
    for participant in expense.participants:
        if participant != expense.payer:
            owed[participant][expense.payer] += share

for settlement in group.settlements:
    owed[settlement.payer][settlement.payee] -= settlement.amount
    if owed[settlement.payer][settlement.payee] < 0:
        # overpayment: flip direction
        owed[settlement.payee][settlement.payer] += abs(owed[settlement.payer][settlement.payee])
        owed[settlement.payer][settlement.payee] = 0

result = []
for debtor in owed:
    for creditor in owed[debtor]:
        if owed[debtor][creditor] > 0.001:
            result.append({ from: debtor, to: creditor, amount: round(owed[debtor][creditor], 2) })
```

---

## 9. Settlements ("Settle Up")

| Decision | Value |
|---|---|
| Initiator | Any group member |
| Partial settlements | Allowed — any amount up to (and including) the full balance |
| Model | Separate MongoDB collection |
| Fields | `payer`, `payee`, `amount`, `date`, `group` |

---

## 10. Data Model (MongoDB Collections via MongoEngine)

### `users`
```python
class User(Document):
    name        = StringField(required=True)
    email       = EmailField(required=True, unique=True)
    password    = StringField(required=True)       # bcrypt hashed
    created_at  = DateTimeField(default=datetime.utcnow)
    is_active   = BooleanField(default=True)
```

### `groups`
```python
class Group(Document):
    name        = StringField(required=True)
    admin       = ReferenceField(User, required=True)
    members     = ListField(ReferenceField(User))  # includes admin
    created_at  = DateTimeField(default=datetime.utcnow)
```

### `expenses`
```python
class Expense(Document):
    group        = ReferenceField(Group, required=True)
    description  = StringField(required=True)
    amount       = DecimalField(required=True, precision=2)
    payer        = ReferenceField(User, required=True)
    participants = ListField(ReferenceField(User))  # snapshot of members at creation time
    category     = StringField(choices=['Food','Travel','Rent','Utilities','Others'], default='Others')
    date         = DateTimeField(required=True)
    created_by   = ReferenceField(User, required=True)
    created_at   = DateTimeField(default=datetime.utcnow)
```

### `settlements`
```python
class Settlement(Document):
    group      = ReferenceField(Group, required=True)
    payer      = ReferenceField(User, required=True)
    payee      = ReferenceField(User, required=True)
    amount     = DecimalField(required=True, precision=2)
    date       = DateTimeField(required=True)
    created_at = DateTimeField(default=datetime.utcnow)
```

---

## 11. API Design

**Base URL:** `/api/v1/`
**Auth:** `Authorization: Bearer <token>` on all protected routes

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/register/` | No | Register new user |
| POST | `/api/v1/auth/login/` | No | Login, returns token |
| GET | `/api/v1/auth/me/` | Yes | Current user profile |

### Users
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/users/search/?email=` | Yes | Find user by email |

### Groups
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/groups/` | Yes | List user's groups |
| POST | `/api/v1/groups/` | Yes | Create group |
| GET | `/api/v1/groups/:id/` | Yes | Group detail + members |
| DELETE | `/api/v1/groups/:id/` | Yes | Delete group (admin only) |
| POST | `/api/v1/groups/:id/members/` | Yes | Add member by email |
| DELETE | `/api/v1/groups/:id/members/:userId/` | Yes | Remove member (admin) or leave (self) |

### Expenses
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/groups/:id/expenses/` | Yes | List all expenses in group |
| POST | `/api/v1/groups/:id/expenses/` | Yes | Add new expense |
| PUT | `/api/v1/groups/:id/expenses/:expId/` | Yes | Edit expense (creator or admin) |
| DELETE | `/api/v1/groups/:id/expenses/:expId/` | Yes | Delete expense (creator or admin) |

### Balances
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/groups/:id/balances/` | Yes | Pairwise balances for a group |
| GET | `/api/v1/dashboard/balances/` | Yes | Overall net balance + per-group summary |

### Settlements
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/groups/:id/settlements/` | Yes | List settlements for group |
| POST | `/api/v1/groups/:id/settlements/` | Yes | Record a settlement |

### Sample Response Shapes

**GET `/api/v1/groups/:id/balances/`**
```json
{
  "group_id": "abc123",
  "balances": [
    { "from_user": { "id": "u1", "name": "Alice" },
      "to_user":   { "id": "u2", "name": "Bob" },
      "amount": 25.00 }
  ]
}
```

**GET `/api/v1/dashboard/balances/`**
```json
{
  "overall_net": 45.00,
  "you_are_owed": 70.00,
  "you_owe": 25.00,
  "by_group": [
    { "group_id": "g1", "group_name": "Trip India", "net": 45.00 }
  ]
}
```

---

## 12. UI Screens & Routing

| Route | Screen | Key Elements |
|---|---|---|
| `/login` | Login | Email + password form, inline validation, link to register |
| `/register` | Register | Name, email, password form |
| `/dashboard` | Dashboard | Full-width header. Two-column layout: groups list (left) + sticky overall balance/actions panel (right) |
| `/groups/new` | Create Group | Full-width header. Two-column layout: form (left) + quick-fill templates panel (right) |
| `/groups/:id` | Group Detail | Members list (top), Tabs: [Expenses | Balances], Settle Up button |
| `/groups/:id/expenses/new` | Add Expense | Full-width header. Two-column layout: form (left) + live split preview panel (right) |
| `/groups/:id/settle` | Settle Up | Visual payer→payee flow diagram, quick-fill outstanding balance rows |

### Navigation
- **Desktop**: Persistent left sidebar — logo, Dashboard link, Groups list, user avatar
- **Mobile**: Bottom nav bar — Dashboard icon, Groups icon, Add (+) icon

---

## 13. UX Patterns

| Pattern | Decision |
|---|---|
| Error feedback | Toast (Sonner) for API errors; inline messages for form validation |
| Loading states | Shimmer skeleton loaders for group list, expense list, balances; spinner for form submits |
| Form layout | Two-column layout on desktop: form on left, contextual help/preview on right sticky panel |
| Page header | Full-width title and primary actions, above the content columns |
| Empty states | Illustration + descriptive text + prominent CTA button |
| Member left group | Display name as "Alice [Left]" — balances still shown |
| Group detail | Tabs: Expenses tab (list + Add Expense button) | Balances tab (pairwise list + Settle Up button) |

---

## 14. Frontend Architecture

```
src/
  components/
    ui/                   # shadcn/ui primitives
    layout/
      Sidebar.jsx
      BottomNav.jsx
      PageWrapper.jsx
    groups/
      GroupCard.jsx
      GroupDetail.jsx
      CreateGroupForm.jsx
      MemberList.jsx
    expenses/
      ExpenseList.jsx
      ExpenseItem.jsx
      AddExpenseForm.jsx
    settlements/
      SettleUpForm.jsx
      SettlementList.jsx
    balances/
      BalancePanel.jsx       # pairwise balance list
      DashboardSummary.jsx   # overall banner + per-group cards
    common/
      EmptyState.jsx
      LoadingSkeleton.jsx
      Avatar.jsx
  pages/
    LoginPage.jsx
    RegisterPage.jsx
    DashboardPage.jsx
    GroupDetailPage.jsx
    AddExpensePage.jsx
    SettleUpPage.jsx
    CreateGroupPage.jsx
  services/
    api.js            # Axios instance — base URL from env, attaches Bearer token
    authService.js
    groupService.js
    expenseService.js
    settlementService.js
    balanceService.js
  context/
    AuthContext.jsx   # currentUser, token, login(), logout()
  hooks/
    useAuth.js
    useGroups.js
  App.jsx             # React Router v6 routes
  main.jsx
```

---

## 15. Backend Architecture

```
splitwise_backend/
  manage.py
  requirements.txt
  splitwise/
    settings.py       # MongoEngine connect, JWT config, CORS config
    urls.py           # include app routers
    wsgi.py
  apps/
    users/
      models.py       # User MongoEngine document
      serializers.py
      views.py        # register, login, me, user search
      urls.py
    groups/
      models.py       # Group document
      serializers.py
      views.py        # CRUD + member management
      urls.py
    expenses/
      models.py       # Expense document
      serializers.py
      views.py        # CRUD
      urls.py
    settlements/
      models.py       # Settlement document
      serializers.py
      views.py        # create + list
      urls.py
  utils/
    balance_calculator.py   # pure function — takes expenses + settlements, returns balance pairs
    jwt_utils.py            # token encode/decode helpers
  tests/
    test_balance_calculator.py   # unit tests for balance logic
```

---

## 14. Deployment Configuration

| Service | Platform | Config |
|---|---|---|
| Frontend | Vercel | Auto-deploy from GitHub, `VITE_API_BASE_URL` env var, `vercel.json` for SPA routing |
| Backend | Render | `Procfile` + `render.yaml` IaC, gunicorn server |
| Database | MongoDB Atlas | Free M0 cluster, IP whitelist 0.0.0.0/0 for Render |

**Deployment Files Created:**
- `backend/Procfile` — gunicorn start command for Render
- `backend/render.yaml` — Render IaC config (auto-generates JWT + Django secrets)
- `frontend/vercel.json` — SPA rewrite rule (all routes → index.html)
- `frontend/.env.example` — production env template
- `backend/.env.example` — backend env template

**Environment Variables:**

Backend (Render):
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<random 64-char string>
ALLOWED_ORIGINS=https://<your-vercel-app>.vercel.app
DJANGO_SECRET_KEY=<random string>
DJANGO_SETTINGS_MODULE=splitwise.settings
DEBUG=False
```

Frontend (Vercel):
```
VITE_API_BASE_URL=https://<your-render-app>.onrender.com
```

**Health Check:** `GET /api/health/` — returns `{"status": "ok"}`, Render uses this for uptime monitoring.

### CORS Config (Django)
```python
CORS_ALLOWED_ORIGINS = [os.environ.get("ALLOWED_ORIGINS")]
CORS_ALLOW_CREDENTIALS = True
```

---

## 17. Testing

| Scope | Type | Priority |
|---|---|---|
| `balance_calculator.py` | Python unit tests | HIGH — core business logic |
| API endpoints | Manual testing via Postman/browser | Medium |
| Frontend flows | Manual testing in browser | Medium |
| Frontend automated tests | None | Out of scope |

### Key Test Cases for `balance_calculator.py`
1. Single expense, 2 members — payer owed half from other
2. Multiple expenses, same payer
3. Multiple payers
4. Partial settlement — balance reduced correctly
5. Full settlement — balance reaches zero
6. Over-settlement — direction flips correctly
7. Three-way group — all pairwise balances correct

---

## 18. Known Risks & Tradeoffs

| Risk | Mitigation |
|---|---|
| MongoEngine + DRF serialization (no native ORM) | Manually serialize MongoEngine documents to dict/JSON |
| JWT without DRF SimpleJWT (MongoEngine incompatible with Django ORM) | Implement JWT manually with PyJWT library |
| ObjectId not JSON serializable | Convert `str(obj.id)` in all serializers |
| Balance correctness | Unit test before wiring to API |
| CORS on Render + Vercel | django-cors-headers with exact origin |
| Render free tier cold starts (~30s) | Frontend shows loading state; note in README |
| Members snapshot in expenses | `participants` field stores member IDs at creation time — handles "member left" correctly |

---

## 19. All Decisions — Quick Reference

| Topic | Decision |
|---|---|
| Split type | Equal split, all members always |
| Balance algo | Raw pairwise (no consolidation) |
| Balance computed by | Backend (`balance_calculator.py`) |
| Settlement | Separate model, partial allowed, any member initiates |
| Auth | JWT (PyJWT), single token, 7 days, localStorage |
| Login | Email only |
| Group admin | Creator only; can delete group, remove members |
| Member left | Shown as "[Left]", balances preserved |
| Group delete | Cascade deletes expenses + settlements |
| Expense edit/delete | Creator or group admin |
| Dashboard | Overall net + per-group net |
| Group detail | Tabs: Expenses | Balances |
| Navigation | Sidebar (desktop) + bottom nav (mobile) |
| Theme | Light mode, green accent (#00C48C) |
| Errors | Toast (Sonner) + inline form validation |
| Loading | Skeleton/spinner for major fetches |
| Empty states | Illustration + CTA |
| Testing | Unit tests for balance logic only |
| ODM | MongoEngine |
| API prefix | `/api/v1/` |
| Pagination | None (return all) |
