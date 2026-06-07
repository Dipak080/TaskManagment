# TaskOps — Task Management System

Task management system for **Ajay Chemicals**, built as a **React (Vite) SPA** talking to a
**CodeIgniter 4 REST API** backed by **MySQL (MySQLi driver)**.

```
taskm/
├─ frontend/              React + Vite SPA (this folder)
└─ (backend lives in WAMP) → C:\wamp64\www\taskops   CodeIgniter 4 API
```

The original design reference is `task-management.html`.

---

## Multi-tenancy & Authentication

> **Note on Supabase:** Supabase Auth + Row Level Security require PostgreSQL. Per the
> requirement to stay on **MySQL with no extra database**, auth is implemented in
> CodeIgniter 4 (JWT) and tenant isolation is enforced in the **application layer**
> instead of Postgres RLS. A tenant-scoped base model (`TenantModel`) automatically
> constrains every read/write to the logged-in user's `company_id`; platform admins bypass it.

**Model:**
- `companies` — tenants. `users` — auth identities (`company_id`, `role_id` nullable, `is_platform_admin`).
- Every business table (`tasks`, `comments`, `activity_log`, `departments`) carries `company_id`.
- After login the JWT carries `company_id` + `role_id`; the React `AuthContext` stores the user.
- **Platform Admin console** (only for `is_platform_admin` users) to create/manage companies
  and create each company's first admin user.
- Roles are intentionally **not hardcoded yet** — `role_id` stays nullable (roles come next).

### Seeded accounts

| Role                  | Email                        | Password       |
|-----------------------|------------------------------|----------------|
| **Platform super admin** | `dipakbarman080@gmail.com`   | `Admin@12345`  |
| Company admin (Ajay Chemicals) | `admin@ajaychemicals.com` | `Company@123`  |

> ⚠️ Change these passwords after first login. The platform admin lands on the Platform
> Console; the company admin lands on the Task Dashboard scoped to its company.

## Dynamic Roles & Permissions

Per-company RBAC, enforced in the application layer (same MySQL/CI4 approach as tenancy).

**Model:**
- `roles` (per company), `pages` (global master list of permission-controlled screens),
  `role_permissions` (per company/role/page with `can_view`/`can_create`/`can_edit`/`can_close`).
- Each user has exactly one `role_id`. On login, `/api/auth/login` + `/api/auth/me` return the
  user's `role` and a `permissions` array (every page with its flags).
- `PermissionService` answers `can(page, action)` and is called by **every** task/role/user
  endpoint — the UI is never trusted. Platform admins bypass.

**Frontend uses the permission map to:**
- build the **sidebar dynamically** (only pages with `can_view`, grouped by `module_group`);
- show/hide **New Task / Edit / comment / Complete-Reject** by `can_create`/`can_edit`/`can_close`;
- gate the **Role Management** and **User Management** screens.

**Screens (Company Admin):**
- **Role Management** — create/activate roles + a **Permission Matrix** (pages × View/Create/Edit/Close).
- **User Management** — create users and assign exactly one role.

**Auto-provisioning:** creating a company auto-creates a **Company Admin** system role with full
permissions on all pages; the company's first admin user is assigned that role.

**Pages seeded:** Dashboard, Tasks, Create Task, Masters-Divisions, Masters-Departments,
Masters-Sections, Masters-Designations, Masters-Plants, Masters-PlantUnits, Masters-TaskConfig,
Role Management, User Management, Reports, Wall Board.

### Role/permission endpoints
| Method | Path | Gated by |
|--------|------|----------|
| GET/POST | `/api/roles` | Role Management view/create |
| PUT | `/api/roles/{id}` | Role Management edit |
| GET/PUT | `/api/roles/{id}/permissions` | Role Management view/edit (the matrix) |
| GET | `/api/pages` | Role Management view |
| GET | `/api/users` | any company member (assignee dropdown) |
| POST/PUT | `/api/users`, `/api/users/{id}` | User Management create/edit |

### Auth endpoints
| Method | Path | Notes |
|--------|------|-------|
| POST | `/api/auth/login` | public — returns `{ token, user }` |
| GET  | `/api/auth/me` | current user (Bearer token) |
| POST | `/api/auth/logout` | client discards token |
| GET/POST | `/api/admin/companies` | platform admin only |
| PUT  | `/api/admin/companies/{id}` | platform admin only |
| POST | `/api/admin/companies/{id}/admin-user` | create company's first admin |

All `/api/*` routes except `login` require a valid Bearer JWT (`auth` filter);
`/api/admin/*` additionally requires `is_platform_admin` (`platformadmin` filter).

---

## Prerequisites

- Node.js (tested on v24) + npm
- WAMP with MySQL 9.x and PHP 8.3 (CLI). CI4 requires **PHP 8.2+**.
- Composer

> ⚠️ **WAMP Apache is on PHP 7.4**, but CodeIgniter 4 needs PHP 8.2+. So in development the
> API is served with the PHP 8.3 CLI via `php spark serve` (see below). To run it under
> Apache instead, switch Apache's PHP version to 8.2+ from the WAMP tray icon.

---

## 1. Database

Already created and seeded, but to recreate from scratch:

```sql
CREATE DATABASE IF NOT EXISTS taskops_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Then from `C:\wamp64\www\taskops`:

```bash
php spark migrate          # creates departments, users, tasks, comments, activity_log
php spark db:seed TaskOpsSeeder   # loads sample tasks matching the design
```

DB connection is configured in `C:\wamp64\www\taskops\.env` (host `localhost`, user `root`,
empty password, driver `MySQLi`).

---

## 2. Backend API (CodeIgniter 4)

```bash
cd C:\wamp64\www\taskops
php spark serve --port 8080
```

API base: **http://localhost:8080/api**

### Endpoints

| Method | Path                          | Description                         |
|--------|-------------------------------|-------------------------------------|
| GET    | `/api/tasks`                  | List tasks (filters: `status`, `department`, `priority`, `assignee`, `q`) |
| GET    | `/api/tasks/{id}`             | Single task                         |
| POST   | `/api/tasks`                  | Create task (auto-generates `TASK-####` code) |
| PUT    | `/api/tasks/{id}`             | Update task / change status         |
| DELETE | `/api/tasks/{id}`             | Delete task                         |
| GET    | `/api/tasks/{id}/comments`    | Task comments                       |
| POST   | `/api/tasks/{id}/comments`    | Add comment                         |
| GET    | `/api/tasks/{id}/activity`    | Activity log                        |
| GET    | `/api/departments`            | Department list                     |
| GET    | `/api/users`                  | User list                           |
| GET    | `/api/stats`                  | Dashboard summary stats             |

CORS is configured in `app/Config/Cors.php` to allow `http://localhost:5173`.

---

## 3. Frontend (React)

```bash
cd frontend
npm install      # first time only
npm run dev
```

App: **http://localhost:5173**

The API URL is set in `frontend/.env` (`VITE_API_BASE`). If the backend is unreachable,
the UI falls back to bundled sample data and shows a "backend offline" note, so the design
always renders.

### Features
- Dashboard with live stat cards (urgent/overdue, pending, in progress, closed today, avg close time)
- Task list grouped by priority, with status pills, due-date colouring and age
- Filters (status tabs, department, priority, assignee) + global search
- Sidebar navigation (All / My / Overdue / by department)
- Task detail panel: description, metadata, activity timeline, add comment, complete/reject
- Create Task modal
- **TV Display mode** — full-screen live board with clock and scrolling ticker

---

## Build for production

```bash
cd frontend
npm run build    # outputs to frontend/dist
```
