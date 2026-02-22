# Felicity Event Management System (MERN)

A role-based MERN application for participants, organizers, and admin to manage fest events, registrations, merchandise purchases, attendance, and communication.

## Tech Stack

### Backend
- **Node.js + Express.js**: REST APIs and middleware flow.
- **MongoDB + Mongoose**: flexible schema design for users/events/registrations.
- **JWT + bcryptjs**: secure authentication and password hashing.
- **Socket.IO**: real-time forum updates.
- **Multer**: payment proof upload for merchandise approval workflow.
- **QRCode + nanoid**: unique ticket and QR generation.
- **csv-stringify**: CSV export for participants and attendance.

### Frontend
- **React (Vite)**: responsive SPA for all three roles.
- **React Router**: protected, role-based routing.
- **Axios**: API client with JWT interceptor.
- **Socket.IO Client**: real-time forum message updates.

## Role Model
Each user has exactly one immutable role:
- `participant`
- `organizer`
- `admin`

No role switching is implemented.

## Core Features Implemented

### Authentication & Security
- Participant signup with IIIT email domain validation for IIIT users.
- Organizer self-signup disabled; organizer accounts created only by admin.
- Admin seeded from backend env (`ADMIN_EMAIL`, `ADMIN_PASSWORD`).
- Passwords hashed with bcrypt.
- JWT auth on protected APIs.
- Role-based protected frontend routes.
- Session persistence via stored JWT; logout clears token.

### Participant Features
- Dashboard with upcoming events and categorized participation history.
- Browse events with:
   - partial + fuzzy search (event/organizer),
  - trending top 5 by recent registrations,
  - filters (event type, eligibility, followed clubs).
- Event details page:
  - validation for deadline and stock/limits,
  - registration/purchase actions.
- Normal event registration with dynamic form answers.
- Ticket generation with unique ticket ID + QR.
- Profile edit (required editable + non-editable fields enforced).
- Organizer list + follow/unfollow.
- Organizer detail page with upcoming/past events.

### Organizer Features
- Organizer dashboard event cards and analytics for completed events.
- Event creation in draft state and updates with status-aware editing constraints.
- Dynamic custom form builder (field types, required/flexible, ordering).
- Event detail management:
  - analytics,
  - participant list,
  - CSV export.
- Attendance scanning by ticket ID with duplicate prevention.
- Attendance dashboard + attendance CSV export.
- Organizer profile edit + Discord webhook URL field.

### Admin Features
- Create organizer accounts (auto-generated login + password).
- Disable/archive/delete organizer accounts.
- Password reset request queue management (approve/reject + comments).

## Advanced Features Chosen (Part-2)

## Tier A (Choose 2)
1. **Merchandise Payment Approval Workflow**
   - Participant uploads payment proof image.
   - Order enters `PENDING_APPROVAL`.
   - Organizer can approve/reject from dedicated screen.
   - On approval: stock decrements, ticket + QR generated, confirmation mail stub sent.
   - No QR in pending/rejected state.

2. **QR Scanner & Attendance Tracking**
   - Organizer scans by ticket ID (manual scanner input API).
   - Duplicate scans rejected.
   - Attendance timestamp stored.
   - Live scanned vs pending counters.
   - Attendance CSV export.

## Tier B (Choose 2)
1. **Organizer Password Reset Workflow**
   - Organizer raises reset request with reason.
   - Admin can approve/reject with comments.
   - Approval auto-generates a new password.
   - Status tracking and history maintained.

2. **Real-Time Discussion Forum**
   - Event-specific forum thread.
   - Registered participants can post messages.
   - Organizer can pin/delete messages.
   - Reactions supported.
   - Socket.IO broadcast for real-time updates.

## Tier C (Choose 1)
1. **Add to Calendar Integration**
   - Event `.ics` generation endpoint.
   - Google Calendar and Outlook links generated in response headers.

## Project Structure
```
<roll_no>/
|-- backend/
|-- frontend/
|-- README.md
|-- deployment.txt
```

## Setup Instructions

### 1) Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Set required variables in `backend/.env`:
- `MONGO_URI`
- `JWT_SECRET`
- `FRONTEND_URL`
- `IIIT_EMAIL_DOMAINS` (comma-separated), e.g. `iiit.ac.in,students.iiit.ac.in,research.iiit.ac.in`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

### 2) Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Set in `frontend/.env`:
- `VITE_API_URL=http://localhost:5000/api`
- `VITE_SOCKET_URL=http://localhost:5000`

## API Highlights
- `POST /api/auth/participant-signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/admin/organizers`
- `PATCH /api/admin/organizers/:organizerId/disable`
- `GET /api/events/browse`
- `POST /api/events/:eventId/register`
- `POST /api/events/:eventId/purchase`
- `PATCH /api/events/organizer/merch-orders/:registrationId/decision`
- `POST /api/events/organizer/:eventId/attendance/scan`
- `GET /api/events/:eventId/calendar.ics`
- `POST /api/events/organizer/reset-request`
- `PATCH /api/admin/reset-requests/:requestId`

## Notes
- Email sending is currently implemented as a console mail stub (`sendMail`) for local/dev.
- Discord webhook action is simulated (console) to keep setup lightweight for assignment evaluation.
- Payment proof files are stored under `backend/uploads`.
