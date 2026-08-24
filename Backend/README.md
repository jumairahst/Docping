# DocPing Backend

RESTful API for the DocPing doctor appointment platform.

- **Stack:** Node.js + Express, MongoDB + Mongoose, Firebase Authentication (Firebase Admin SDK)
- **Docs:** Swagger UI at `/api-docs`
- **Port:** `5000` by default (frontend dev server runs on `3000`)

```
Frontend (React, port 3000)
   │  Authorization: Bearer <Firebase ID token>
   ▼
Backend (Express, port 5000)
   ├─ verifyIdToken (firebase-admin) → role check → controller
   └─ MongoDB (Mongoose)
```

## Quick Start

Prerequisites: Node.js LTS, MongoDB (local or Atlas), and a Firebase project
(**see [SETUP.md](SETUP.md) for one-time Firebase/MongoDB setup**).

```bash
cd Backend
npm install
cp .env.example .env     # then edit .env
npm run seed             # optional: load sample doctors/availability/reviews
npm run dev              # starts server on http://localhost:5000
```

Open the API docs: http://localhost:5000/api-docs

## Scripts

| Command | Description |
|---|---|
| `npm start` | Run the server |
| `npm run dev` | Run with nodemon (auto-restart on changes) |
| `npm run seed` | Wipe and seed sample data (doctors, availability, reviews) |

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Server port |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/docping` | MongoDB connection string |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | `./firebase-service-account.json` | Path to Firebase service account JSON |
| `FIREBASE_DATABASE_URL` | — | Only needed if you use Firebase Realtime Database |
| `CORS_ORIGIN` | `*` | Allowed frontend origin, e.g. `http://localhost:3000` |

## Authentication

1. The **frontend** signs the user in with Firebase and obtains an ID token.
2. Every protected request sends `Authorization: Bearer <idToken>`.
3. The backend verifies the token with `firebase-admin` and loads the matching
   `User` record (looked up by Firebase uid).
4. Role checks (`patient` / `doctor`) are enforced by middleware.

After Firebase sign-up, the client must call **`POST /api/auth/register`** once with
the user's `role` so a DocPing account (and Doctor profile, if role is `doctor`) is created.

## REST API Overview

All endpoints under `/api`. Full interactive docs: `/api-docs`.

| Method & Path | Access | Description |
|---|---|---|
| `POST /auth/register` | Firebase token | Register role + create doctor profile |
| `GET /users/me` | Any user | Own profile (incl. doctor profile) |
| `PUT /users/me` | Any user | Update name / phone / age |
| `GET /doctors` | Public | List with `specialty`, `search`, `minRating`, `sort`, `limit`, `skip` |
| `GET /doctors/:id` | Public | Doctor detail |
| `PUT /doctors/me` | Doctor | Update own doctor profile |
| `DELETE /doctors/me` | Doctor | Delete own profile + related data |
| `POST /appointments` | Patient | Book an appointment (atomic, prevents double-booking) |
| `GET /appointments/my` | Patient | Own appointments |
| `PUT /appointments/:id/cancel` | Patient | Cancel own appointment |
| `GET /appointments/doctor` | Doctor | Assigned appointments (`?status=`) |
| `PUT /appointments/:id/status` | Doctor | Set status to confirmed/completed/cancelled |
| `GET /reviews/doctor/:doctorId` | Public | Reviews for a doctor |
| `POST /reviews` | Patient | Review a doctor (requires a completed appointment) |
| `PUT /reviews/:id` | Patient | Update own review |
| `DELETE /reviews/:id` | Patient | Delete own review |
| `GET /availability/doctor/:doctorId` | Public | Availability (`?date=YYYY-MM-DD`), includes booked slots |
| `POST /availability` | Doctor | Create/update availability for a date |
| `PUT /availability/:id` | Doctor | Update availability entry |
| `DELETE /availability/:id` | Doctor | Delete availability entry |

## Concurrency / Double-Booking

A unique MongoDB index on `(doctor, date, timeSlot)` with a partial filter
(`active: true`) makes slot booking atomic. `active` is set to `false` when an
appointment is cancelled, which removes it from the index and frees the slot while
keeping the record. Two patients hitting `POST /api/appointments` at the same time
for the same slot: one wins, the other gets a `409 Conflict`.

## Project Structure

```
Backend/
├── server.js                  # app entry, mounts routes, swagger, error handling
├── config/                    # db.js (mongoose), firebase.js (admin SDK)
├── models/                    # User, Doctor, Appointment, Review, Availability
├── controllers/               # request handlers
├── routes/                    # Express routers
├── middleware/                # auth (firebase verify), role guard, asyncHandler
├── swagger/                   # OpenAPI spec served at /api-docs
├── seed/                      # npm run seed sample data
├── .env.example
└── .gitignore                 # ignores .env, firebase-service-account.json, node_modules
```

## Security Notes

- `.env` and `firebase-service-account.json` are gitignored — never commit them.
- The backend always verifies the Firebase token; frontend-only role checks are not trusted.
- Appointment dates/times are validated server-side.

