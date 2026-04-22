# CLAUDE.md — Telemedicine Frontend (Vue 3)

This file provides guidance to Claude Code when working in this Vue 3 frontend project.

## Commands

```bash
npm run dev        # Start Vite dev server (hot reload)
npm run build      # Production build
npm run preview    # Preview production build locally
```

No test suite is configured yet.

## Project Purpose

This is the **frontend client** for the Telemedicine REST API located at
`../telemedicine` (the sibling directory). The API runs at `http://localhost:3002`
in development (see `PORT` in the backend `.env`).

The platform has three user roles with distinct flows:
- **PATIENT** — browse practitioners, send consultation requests, track relationships, view medical records, receive notifications
- **PRACTITIONER** — manage incoming consultation requests, manage patient relationships, create/update medical records
- **ADMIN** — approve/reject practitioners, activate/deactivate users, view system statistics

---

## Backend API Reference

Base URL: `http://localhost:3002/api`

All authenticated requests send a **Bearer token** in the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

Tokens expire after **1 day**. Store the token in `localStorage` or a Pinia store.
Token payload includes: `userId`, `role`.

### Auth Endpoints

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/auth/register` | No | Body: `{ phoneNumber, password, role, fullName, ... }` |
| POST | `/auth/login` | No | Body: `{ phoneNumber, password }` → `{ token, user }` |
| GET | `/auth/me` | Yes | Returns current user + role-specific profile |

**Register body fields:**
- All roles: `phoneNumber` (Kenya `KE` format), `password` (min 8 chars, upper + lower + digit), `role` (PATIENT or PRACTITIONER)
- PATIENT adds: `fullName`, `dateOfBirth`, `gender`
- PRACTITIONER adds: `fullName`, `licenseNumber`, `specialization`

### Profile Endpoints

| Method | Path | Auth | Role | Notes |
|--------|------|------|------|-------|
| GET | `/profile/practitioners` | No | — | Paginated list of approved practitioners |
| GET | `/profile/practitioners/:id` | No | — | Single practitioner detail |
| PUT | `/profile/patients/me` | Yes | PATIENT | Update `fullName`, `dateOfBirth`, `gender` |
| PUT | `/profile/practitioners/me` | Yes | PRACTITIONER | Update `fullName`, `specialization` |

### Consultation Request Endpoints

| Method | Path | Auth | Role | Notes |
|--------|------|------|------|-------|
| POST | `/consultation-requests` | Yes | PATIENT | Body: `{ practitionerId, message }` |
| GET | `/consultation-requests/mine` | Yes | PATIENT | Paginated; query: `?status=PENDING\|ACCEPTED\|REJECTED\|CANCELLED` |
| GET | `/consultation-requests/incoming` | Yes | PRACTITIONER | Paginated; query: `?status=...` |
| GET | `/consultation-requests/:id` | Yes | Any | Either party in the request |
| POST | `/consultation-requests/:id/accept` | Yes | PRACTITIONER | Creates a relationship, notifies patient |
| POST | `/consultation-requests/:id/reject` | Yes | PRACTITIONER | Notifies patient |
| POST | `/consultation-requests/:id/cancel` | Yes | PATIENT | Notifies practitioner |

### Relationship Endpoints

| Method | Path | Auth | Role | Notes |
|--------|------|------|------|-------|
| GET | `/relationships` | Yes | PATIENT or PRACTITIONER | Paginated; query: `?status=ACTIVE\|TERMINATED` |
| GET | `/relationships/:id` | Yes | Either party | Single relationship detail |
| POST | `/relationships/:id/terminate` | Yes | Either party | Ends relationship |

### Medical Record Endpoints

| Method | Path | Auth | Role | Notes |
|--------|------|------|------|-------|
| POST | `/medical-records` | Yes | PRACTITIONER | Requires ACTIVE relationship; body: `{ patientId, relationshipId, recordType, title, description, attachmentUrl? }` |
| GET | `/medical-records/mine` | Yes | PATIENT | Paginated; query: `?recordType=NOTE\|DIAGNOSIS\|PRESCRIPTION\|LAB_RESULT` |
| GET | `/medical-records/:id` | Yes | Either party | |
| PATCH | `/medical-records/:id` | Yes | PRACTITIONER | Creator only; body: `{ title?, description?, attachmentUrl? }` |
| GET | `/patients/:id/medical-records` | Yes | PRACTITIONER | Requires ACTIVE relationship with patient |

### Admin Endpoints (role: ADMIN)

| Method | Path | Notes |
|--------|------|-------|
| GET | `/admin/stats` | System-wide statistics |
| GET | `/admin/practitioners` | All practitioners (paginated); query: `?verificationStatus=PENDING\|APPROVED\|REJECTED` |
| POST | `/admin/practitioners/:id/approve` | Sets `kmpdcVerified=true`, `verificationStatus=APPROVED` |
| POST | `/admin/practitioners/:id/reject` | Sets `kmpdcVerified=false`, `verificationStatus=REJECTED` |
| GET | `/admin/users` | All users (paginated); query: `?role=PATIENT\|PRACTITIONER\|ADMIN` |
| POST | `/admin/users/:id/deactivate` | Sets `isActive=false` |
| POST | `/admin/users/:id/activate` | Sets `isActive=true` |

### Standard Response Shapes

**Success:**
```json
{ "success": true, "data": { ... } }
```

**Error:**
```json
{ "success": false, "error": { "message": "..." } }
```

**Paginated list responses** include: `{ data: [...], pagination: { page, limit, total, totalPages } }`

### HTTP Status Codes Used

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request (validation failure) |
| 401 | Unauthorized (missing/invalid/expired token) |
| 403 | Forbidden (wrong role, deactivated account) |
| 404 | Not Found |
| 409 | Conflict (e.g. duplicate pending request) |
| 422 | Unprocessable Entity |
| 500 | Server Error |

---

## Data Model Summary

### Enums to know

```
UserRole:             PATIENT | PRACTITIONER | ADMIN
ConsultationStatus:   PENDING | ACCEPTED | REJECTED | CANCELLED
RelationshipStatus:   ACTIVE | TERMINATED
TerminatedBy:         PATIENT | PRACTITIONER
RecordType:           NOTE | DIAGNOSIS | PRESCRIPTION | LAB_RESULT
VerificationStatus:   PENDING | APPROVED | REJECTED
NotificationType:     REQUEST_RECEIVED | REQUEST_ACCEPTED | REQUEST_REJECTED | REQUEST_CANCELLED
```

### Core Business Logic to drive the UI

1. **Consultation lifecycle**: Patient → creates request (PENDING) → Practitioner accepts/rejects → ACCEPTED creates a Relationship; Patient can cancel PENDING requests.
2. **Relationship gate**: Medical records can only be created or viewed by parties in an **ACTIVE** relationship.
3. **Practitioner access**: A practitioner only appears in the public list after their `verificationStatus` is `APPROVED` and `kmpdcVerified` is `true`.
4. **Deactivated accounts**: A deactivated user (`isActive=false`) gets a 403 on any authenticated request. Log them out and show an appropriate message.
5. **Notifications**: The backend generates notifications automatically on request state changes. The frontend should poll or display them from `GET /auth/me` (which returns notifications) or via a dedicated endpoint if added.

---

## Tech Stack (current)

- **Vue 3** with Composition API (`<script setup>`)
- **Vite** for bundling and dev server
- No router, state manager, or HTTP client installed yet — add as needed

### Recommended additions (install before building features)

```bash
npm install vue-router@4          # Client-side routing
npm install pinia                  # State management (auth store, etc.)
npm install axios                  # HTTP client with interceptors for auth token
```

---

## Architecture Conventions (to establish)

### Directory Structure to build toward

```
src/
├── api/               # One file per resource (auth.js, consultations.js, etc.)
│   └── client.js      # Axios instance with baseURL + auth interceptor
├── stores/            # Pinia stores (auth.js, notifications.js, etc.)
├── router/            # index.js — Vue Router with route guards
├── views/             # Page-level components (one per route)
│   ├── auth/
│   ├── patient/
│   ├── practitioner/
│   └── admin/
├── components/        # Reusable UI components
├── composables/       # Reusable Composition API logic
└── assets/
```

### Auth Store (Pinia)

The auth store should:
- Persist the JWT token to `localStorage`
- Expose `user`, `token`, `role`, `isAuthenticated`
- On app mount, call `GET /auth/me` to rehydrate user state from a stored token
- Provide a `logout()` action that clears token and redirects to login
- Intercept 401 responses globally (via Axios interceptor) to auto-logout

### Route Guards

Use Vue Router navigation guards to:
- Redirect unauthenticated users to `/login`
- Redirect authenticated users away from `/login` and `/register`
- Restrict `/admin/*` routes to `role === 'ADMIN'`
- Restrict `/practitioner/*` routes to `role === 'PRACTITIONER'`
- Restrict `/patient/*` routes to `role === 'PATIENT'`

### API Layer

Create a thin wrapper per resource in `src/api/`. Example:

```js
// src/api/client.js
import axios from 'axios'
const client = axios.create({ baseURL: 'http://localhost:3002/api' })
client.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
export default client
```

---

## Environment

Create a `.env` file in the project root:
```
VITE_API_BASE_URL=http://localhost:3002/api
```

Reference it as `import.meta.env.VITE_API_BASE_URL` in code.

---

## Swagger / API Docs

The backend serves interactive API documentation at:
```
http://localhost:3002/swagger
```

Use this to test endpoints and inspect request/response schemas while building the frontend.
