# LegalCheck 360: Python Backend with Firebase Authentication

This service provides an optional Python backend for **LegalCheck 360**, implementing Firebase ID token verification, user-isolated inspection history, and SQLite persistence.

---

## Features

- **Optional Authentication:** Guests can inspect packaging with zero friction without signing in.
- **Firebase Token Verification:** Authenticates tokens sent via `Authorization: Bearer <token>` using `firebase-admin`.
- **User Data Isolation:** Authenticated users have dedicated persistent audit trails tied to their Firebase UID (`user_uid`).
- **Guest-to-Account Transition:** API endpoint `/api/user/claim-scan` seamlessly claims guest scans into the authenticated user's history.
- **Render Ready:** Configured with `render.yaml` and `gunicorn` for continuous deployment.

---

## Local Setup & Execution

### 1. Install Dependencies

```bash
cd backend/python
pip install -r requirements.txt
```

### 2. Configure Firebase (Optional for Development)

In development mode, the service will run even without credentials using fallback token decoding. For production token verification:

1. Go to **Firebase Console** -> **Project Settings** -> **Service Accounts**.
2. Click **Generate New Private Key** and download the JSON file.
3. Set the environment variable:

```bash
export FIREBASE_SERVICE_ACCOUNT_PATH="/path/to/service-account.json"
# Or directly as a JSON string:
# export FIREBASE_SERVICE_ACCOUNT_JSON='{"type": "service_account", ...}'
```

### 3. Run the Service

```bash
python3 app.py
```

The API will listen at `http://127.0.0.1:5001`.

---

## Deploy to Render

1. Connect your GitHub repository to Render.
2. Select **Web Service** and choose **Render Blueprint** (`render.yaml`).
3. Under Environment Variables in the Render dashboard, set:
   - `FIREBASE_SERVICE_ACCOUNT_JSON`: Paste the contents of your Firebase service account private key JSON.
4. Deploy!
