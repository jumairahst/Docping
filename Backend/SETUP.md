# SETUP — One-Time Configuration (your side)

This backend assumes you already have a running MongoDB and a Firebase project.
Complete the steps below once, before running the server.

---

## 1. MongoDB

**Option A — Local (easiest):**
1. Install MongoDB Community Server and MongoDB Compass.
2. Start the MongoDB service (e.g. `brew services start mongodb-community` on macOS).
3. Open Compass and connect to `mongodb://127.0.0.1:27017`.
4. Database name: `docping` (it is created automatically on first write).

**Option B — MongoDB Atlas (cloud):**
1. Create a free cluster at https://www.mongodb.com/atlas.
2. Add a database user with password.
3. Network Access → allow your IP (or `0.0.0.0/0` for dev).
4. Copy the connection string, e.g.
   `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/docping`

Then put the URI in `Backend/.env`:

```
MONGODB_URI=mongodb://127.0.0.1:27017/docping
```

---

## 2. Firebase Authentication

1. Go to https://console.firebase.google.com → **Add project** → name it `DocPing`.
2. **Build → Authentication → Get started**.
3. Under **Sign-in method**, enable **Email/Password** (optionally **Google**).
4. **Project Settings → Your apps** → add a **Web app**:
   - Copy the Firebase web config (`apiKey`, `authDomain`, `projectId`, …) — the
     **frontend** needs these to sign users in and obtain ID tokens.
5. **Project Settings → Service Accounts → Generate new private key**.
   - This downloads a JSON file. Save it as:

   ```
   Backend/firebase-service-account.json
   ```

   > This file grants admin access to your Firebase project. It is gitignored —
   > **never** commit or share it.

6. In `Backend/.env`, set:

   ```
   FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
   ```

---

## 3. Environment file

```bash
cd Backend
cp .env.example .env
```

Edit `.env` with your real MongoDB URI and (if changed) the service account path.

---

## 4. Run

```bash
cd Backend
npm install
npm run seed    # optional but recommended — loads sample doctors
npm run dev
```

Verify:
- Server: http://localhost:5000/health → `{ "status": "ok" }`
- Swagger docs: http://localhost:5000/api-docs

---

## 5. Frontend-side notes

The frontend sends the Firebase ID token on every request:

```
Authorization: Bearer <ID_TOKEN>
```

- Webpack dev server runs on port `3000`. If your frontend uses a different
  origin, set `CORS_ORIGIN` in `.env` accordingly (default is open for dev).
- Registering: after Firebase sign-up, call `POST /api/auth/register` with
  `{ role, name, ... }` and the ID token. Pass `role: "doctor"` and a `specialty`
  to create a doctor profile.

---

## 6. Testing the API

Use Postman or the Swagger UI (`/api-docs` — click **Authorize** and paste an ID
token to test protected routes).

How to get an ID token for testing:
- Sign in via your frontend, or
- In the browser console:
  ```js
  import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
  const t = await signInWithEmailAndPassword(getAuth(), 'you@email.com', 'password');
  console.log(await t.user.getIdToken());
  ```

Full request examples are in the Swagger docs.
