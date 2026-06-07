# 🚀 TaskOps — Enterprise Task Management System



**TaskOps** is a comprehensive, multi-tenant enterprise task management system designed to streamline operational workflows, boost productivity, and provide real-time visibility into organizational tasks.

Built with a modern tech stack focusing on high performance, robust security, and an exceptional user experience, TaskOps is engineered to meet the demanding requirements of modern businesses.

---

## 🛠 Tech Stack

### Frontend
- **Framework:** React (Bootstrapped with Vite for lightning-fast HMR)
- **Architecture:** Single Page Application (SPA)
- **Styling:** Custom responsive CSS architecture 
- **State Management:** React Context API + Custom Hooks

### Backend
- **Framework:** CodeIgniter 4 (PHP 8.2+)
- **Architecture:** RESTful API
- **Database:** MySQL (MySQLi driver)
- **Authentication:** Custom JWT-based stateless authentication

---

## ✨ Key Features

- **Multi-Tenancy Architecture:** Strict tenant isolation at the application level ensuring data privacy across different organizations.
- **Dynamic Role-Based Access Control (RBAC):** Flexible, per-company roles with granular permissions (View, Create, Edit, Close) controlled via a dynamic Permission Matrix.
- **Real-Time Dashboard:** Live statistical insights including urgent/overdue tasks, daily completions, and average resolution times.
- **Advanced Task Management:** Status pills, priority grouping, due-date color coding, and global search filters.
- **TV Display Mode:** A full-screen live board with a scrolling ticker, designed for office wall-mounted displays.
- **Audit Trails:** Comprehensive activity logging and timeline visualization for every task.
- **Platform Admin Console:** Centralized management for platform administrators to provision and govern tenants.

---

## 🔒 Security & Architecture Highlights

- **Stateless JWT Auth:** Secure, scalable API authentication without relying on database sessions.
- **Centralized Permission Service:** UI is never trusted. Every endpoint strictly validates the user's role and tenant scope (`company_id`).
- **Resilient Frontend:** The React app gracefully falls back to bundled mock data if the backend API is unreachable, ensuring a seamless demo experience.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v24+) & npm
- **PHP** (8.2+)
- **MySQL** (9.x)
- **Composer**

### 1. Database Setup
```sql
CREATE DATABASE IF NOT EXISTS taskops_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
Navigate to your API directory:
```bash
php spark migrate          # Run database migrations
php spark db:seed TaskOpsSeeder   # Seed initial demo data
```

### 2. Backend API Setup (CodeIgniter 4)
Navigate to your API directory and start the local development server:
```bash
php spark serve --port 8080
```
*The API will be available at: **http://localhost:8080/api***

### 3. Frontend Setup (React)
Navigate to the `frontend` directory:
```bash
cd frontend
npm install
npm run dev
```
*The React application will be available at: **http://localhost:5173***

---

## 👤 Default Seeded Accounts

| Role | Email | Password | Landing Page |
|------|-------|----------|--------------|
| **Platform Super Admin** | `dipakbarman080@gmail.com` | `Admin@12345` | Platform Console |
| **Company Admin** | `admin@ajaychemicals.com` | `Company@123` | Task Dashboard |

*(Please ensure to change these credentials after your first login in a production environment)*

---
*Designed & Developed with ❤️ focusing on scalable architecture and premium UI/UX.*
