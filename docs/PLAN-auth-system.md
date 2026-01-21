# Authentication System Plan

## Overview

Xây dựng hệ thống authentication fullstack với **Login** và **Register** cho ứng dụng React + Express, sử dụng **MongoDB Native Driver** (không dùng Mongoose).

**Project Type:** FULLSTACK (WEB)

---

## Success Criteria

| Criteria         | Metric                                              |
| ---------------- | --------------------------------------------------- |
| Register         | User có thể tạo tài khoản mới với email/password    |
| Login            | User có thể đăng nhập và nhận JWT token             |
| Validation       | Input được validate (email format, password length) |
| Security         | Password được hash với bcrypt, JWT cho session      |
| Protected Routes | API endpoint được bảo vệ bởi auth middleware        |
| Frontend Forms   | Login/Register forms hoạt động với validation       |

---

## Tech Stack

| Layer          | Technology              | Rationale                            |
| -------------- | ----------------------- | ------------------------------------ |
| Database       | MongoDB (Native Driver) | Theo yêu cầu - không dùng Mongoose   |
| Auth           | JWT + bcrypt            | Industry standard cho stateless auth |
| Validation     | Zod                     | Type-safe validation cho cả FE và BE |
| Frontend Forms | React Hook Form         | Performance, validation integration  |

---

## File Structure

### Backend Changes

```
backend/src/
├── config/
│   ├── index.ts              # [MODIFY] Thêm MongoDB config
│   └── database.ts           # [NEW] MongoDB connection
├── controllers/
│   └── auth.controller.ts    # [NEW] Login/Register handlers
├── middlewares/
│   ├── errorHandler.ts       # [EXISTING]
│   └── auth.middleware.ts    # [NEW] JWT verification
├── routes/
│   ├── index.ts              # [MODIFY] Add auth routes
│   └── auth.routes.ts        # [NEW] Auth route definitions
├── services/
│   └── auth.service.ts       # [NEW] Auth business logic
├── validators/
│   └── auth.validator.ts     # [NEW] Zod schemas
└── types/
    └── auth.types.ts         # [NEW] Auth type definitions
```

### Frontend Changes

```
frontend/src/
├── pages/
│   ├── LoginPage.tsx         # [NEW] Login form
│   └── RegisterPage.tsx      # [NEW] Register form
├── components/
│   └── common/
│       └── Input.tsx         # [NEW] Reusable input component
├── services/
│   ├── api.ts                # [MODIFY] Add auth endpoints
│   └── auth.service.ts       # [NEW] Auth API calls
├── stores/
│   └── authStore.ts          # [NEW] Auth state (Zustand)
├── hooks/
│   └── useAuth.ts            # [NEW] Auth hook
└── types/
    └── auth.ts               # [NEW] Auth types
```

---

## Task Breakdown

### Phase 1: Database Setup (P0)

#### Task 1.1: MongoDB Connection

- **Agent:** `backend-specialist`
- **Priority:** P0 (Blocker)
- **Dependencies:** None
- **INPUT:** MongoDB URI từ .env
- **OUTPUT:** `database.ts` với connection pool
- **VERIFY:** `npm run dev` logs "MongoDB connected"

#### Task 1.2: User Collection Setup

- **Agent:** `backend-specialist`
- **Priority:** P0
- **Dependencies:** Task 1.1
- **INPUT:** User schema definition
- **OUTPUT:** User collection với indexes (unique email)
- **VERIFY:** MongoDB Compass shows collection

---

### Phase 2: Backend Auth (P1)

#### Task 2.1: Auth Types & Validators

- **Agent:** `backend-specialist`
- **Priority:** P1
- **Dependencies:** None
- **INPUT:** Auth requirements
- **OUTPUT:** `auth.types.ts`, `auth.validator.ts`
- **VERIFY:** TypeScript compiles without errors

#### Task 2.2: Auth Service

- **Agent:** `backend-specialist`
- **Priority:** P1
- **Dependencies:** Task 1.1, Task 2.1
- **INPUT:** User model, validators
- **OUTPUT:** `auth.service.ts` (register, login, verify)
- **VERIFY:** Unit tests pass

#### Task 2.3: Auth Controller & Routes

- **Agent:** `backend-specialist`
- **Priority:** P1
- **Dependencies:** Task 2.2
- **INPUT:** Auth service
- **OUTPUT:** `auth.controller.ts`, `auth.routes.ts`
- **VERIFY:** Postman: POST /api/auth/register, /api/auth/login return expected responses

#### Task 2.4: Auth Middleware

- **Agent:** `backend-specialist`
- **Priority:** P1
- **Dependencies:** Task 2.3
- **INPUT:** JWT secret
- **OUTPUT:** `auth.middleware.ts`
- **VERIFY:** Protected route returns 401 without token, 200 with valid token

---

### Phase 3: Frontend Auth (P2)

#### Task 3.1: Auth Types & Store

- **Agent:** `frontend-specialist`
- **Priority:** P2
- **Dependencies:** Task 2.3
- **INPUT:** API response types
- **OUTPUT:** `auth.ts` (types), `authStore.ts` (Zustand)
- **VERIFY:** TypeScript compiles

#### Task 3.2: Auth Service

- **Agent:** `frontend-specialist`
- **Priority:** P2
- **Dependencies:** Task 3.1
- **INPUT:** API endpoints
- **OUTPUT:** `auth.service.ts`
- **VERIFY:** Network tab shows correct API calls

#### Task 3.3: Login Page

- **Agent:** `frontend-specialist`
- **Priority:** P2
- **Dependencies:** Task 3.2
- **INPUT:** UI design, auth store
- **OUTPUT:** `LoginPage.tsx` với form validation
- **VERIFY:** Form validates, submits, handles errors

#### Task 3.4: Register Page

- **Agent:** `frontend-specialist`
- **Priority:** P2
- **Dependencies:** Task 3.2
- **INPUT:** UI design, auth store
- **OUTPUT:** `RegisterPage.tsx` với form validation
- **VERIFY:** Form validates, submits, redirects to login

#### Task 3.5: Routing & Protected Routes

- **Agent:** `frontend-specialist`
- **Priority:** P2
- **Dependencies:** Task 3.3, Task 3.4
- **INPUT:** Auth store
- **OUTPUT:** React Router setup với protected routes
- **VERIFY:** Unauthenticated user redirected to login

---

### Phase X: Verification

- [ ] `npm run lint && npx tsc --noEmit` - Both FE & BE pass
- [ ] Security: Passwords hashed, no secrets in code
- [ ] API: Register creates user, Login returns JWT
- [ ] Frontend: Forms work with validation
- [ ] Integration: Full flow works (Register → Login → Access protected)
- [ ] Build: `npm run build` passes for both FE & BE

---

## Dependencies (Package Installation)

### Backend

```bash
npm install mongodb bcryptjs jsonwebtoken
npm install -D @types/bcryptjs @types/jsonwebtoken
```

### Frontend

```bash
npm install react-router-dom zustand react-hook-form @hookform/resolvers
```

---

## Environment Variables

### Backend (.env)

```
MONGODB_URI=mongodb://localhost:27017/exe_auth
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d
```

---

## Risk Areas

| Risk                      | Mitigation                        |
| ------------------------- | --------------------------------- |
| MongoDB connection fails  | Retry logic, clear error messages |
| Token expiration handling | Refresh token strategy (future)   |
| Password security         | bcrypt with salt rounds >= 10     |
