# 🔐 Secure Document Vault

[![Django](https://img.shields.io/badge/Django-DRF-092E20?logo=django&logoColor=white)](https://www.django-rest-framework.org/)
[![React](https://img.shields.io/badge/React-Vite-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![AWS S3](https://img.shields.io/badge/AWS-S3-FF9900?logo=amazons3&logoColor=white)](https://aws.amazon.com/s3/)
[![JWT](https://img.shields.io/badge/Auth-SimpleJWT-000000?logo=jsonwebtokens&logoColor=white)](https://django-rest-framework-simplejwt.readthedocs.io/)

**A security-first, full-stack document storage platform.** Users upload, encrypt, tag, search, preview, and manage sensitive files through an authenticated, ownership-scoped API — built to demonstrate real backend engineering discipline, not just CRUD boilerplate.

Every file is encrypted **before** it touches S3. Every endpoint checks resource ownership server-side. Every design trade-off is documented, not hidden.

## 🚀 Live Demo

- **Frontend:** [https://secure-vault-tau.vercel.app](https://secure-vault-tau.vercel.app)
- **Backend API:** [https://secure-vault-7i43.onrender.com](https://secure-vault-7i43.onrender.com)

<!-- ![Dashboard Screenshot](./screenshots/dashboard.png) -->

---

## ✨ Key Features

| Capability | Description |
|---|---|
| **Encryption at Rest** | Files are encrypted with **Fernet (symmetric AES)** server-side *before* upload — S3 never stores plaintext. |
| **JWT Auth with Auto-Refresh** | Access + refresh token flow (SimpleJWT). Frontend intercepts `401` responses, silently refreshes the token, and retries the original request — tested end-to-end. |
| **Ownership-Scoped Access Control** | Every CRUD operation validates the requesting user owns the resource server-side — no IDOR. |
| **Fuzzy Tag Search** | Powered by `rapidfuzz` with a 70% similarity threshold, so partial or slightly-misspelled tags still match. |
| **Smart Inline Preview** | PDFs and images open in a new tab via blob URLs with the correct `Content-Type` header. Non-previewable types (`.docx`, `.zip`, etc.) automatically fall back to direct download. |
| **Server-Side File Validation** | Type and size checks enforced in the backend (30MB cap), not just the UI. |
| **Per-Action Loading States** | Granular `Loader2` spinners scoped to each row/action (upload, view, download, delete) instead of one global spinner. |
| **Dark / Light Theming** | Class-based (`.dark` selector) theming via React Context. |
| **Fully Responsive** | Verified down to 540px (Surface Duo) — filenames truncate with `title` tooltips, forms stack on mobile. |
| **Transparent Security Page** | Public `/security` route listing the actual measures implemented — no marketing fluff. |

---

## 🛠 Tech Stack

**Backend**
- Django + Django REST Framework
- SimpleJWT — access/refresh token authentication
- `cryptography` (Fernet) — field/file-level encryption
- `boto3` / `django-storages` — AWS S3 integration
- `rapidfuzz` — fuzzy string matching for tag search
- **PostgreSQL** — primary database

**Frontend**
- React + Vite
- Tailwind CSS
- React Router — protected route guards
- Axios — with interceptor-based token refresh
- lucide-react — icons (`Loader2` for async states)

**Infrastructure**
- AWS S3 — encrypted document storage
- PostgreSQL — relational data (users, documents, tags, metadata)

---

## 📁 Project Structure

```text
secure-document-vault/
├── config/                 # Django project settings
├── vault/                  # Core app — models, serializers, views, validators
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   └── validators.py       # File type/size validation
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/         # ThemeContext, AuthContext
│   │   ├── pages/            # Dashboard, Login, Security, Landing
│   │   └── App.css
│   ├── .env.example
│   └── package.json
├── manage.py
├── requirements.txt
├── .env.example
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL (local instance or hosted, e.g. Render/Supabase)
- AWS account with an S3 bucket

### Backend Setup

```bash
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt

cp .env.example .env         # fill in your values
python manage.py migrate
python manage.py runserver
```

**Required environment variables** (`.env`):
```env
SECRET_KEY=your-django-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
FERNET_KEY=your-fernet-key

DB_NAME=your-db-name
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_HOST=your-db-host
DB_PORT=5432

AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET_NAME=your-bucket-name
AWS_S3_REGION=your-region

CORS_ALLOWED_ORIGINS=http://localhost:5173
CSRF_TRUSTED_ORIGINS=http://localhost:5173
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env         # fill in your values
npm run dev
```

**Required environment variables** (`frontend/.env`):
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/token/` | Obtain JWT access + refresh token pair (login) |
| `POST` | `/api/auth/token/refresh/` | Exchange refresh token for a new access token |
| `GET` | `/api/documents/` | List authenticated user's documents (supports tag search) |
| `POST` | `/api/documents/` | Upload a new document (encrypted before S3 storage) |
| `GET` | `/api/documents/:id/view/` | Stream file inline (PDF/image) via signed blob URL |
| `GET` | `/api/documents/:id/download/` | Force download of the decrypted file |
| `DELETE` | `/api/documents/:id/` | Delete a document (ownership-checked) |

---

## ✅ Tested Scenarios

- **Token refresh flow**: expired access token → `401` → silent refresh → original request auto-retried, verified end-to-end
- **Upload error handling**: fixed a bug where error messages showed only the first character due to an array/string type mismatch in the response handler
- **File preview fallback**: non-previewable types (`.docx`, `.zip`) correctly fall back to download instead of failing silently
- **Mobile responsiveness**: verified on a 540px viewport (Surface Duo) — no layout breakage, filenames truncate with tooltips
- **Fuzzy tag search**: verified partial/misspelled tag queries still return relevant matches at the 70% threshold
- **File size validation**: uploads over 30MB are rejected server-side, not just blocked in the UI

---

## 🔒 Security Notes

- Files are encrypted (Fernet/AES) **before** upload — S3 never holds plaintext
- Every API endpoint validates resource ownership server-side
- Secrets are loaded from environment variables only — never hardcoded
- JWT access tokens are short-lived, with automatic silent refresh

**Known trade-off:** JWT tokens are currently stored in `localStorage` for simplicity, which carries a theoretical XSS exposure risk. A production-hardened version would move to `httpOnly` cookies with CSRF protection — documented here as a conscious, explainable trade-off rather than an oversight.

Full breakdown of implemented measures is visible on the live `/security` page.

---

## 👤 Author

**Neeraj Giri**
[GitHub](https://github.com/ineerajgiri)

---

## 📄 License

This project is provided for educational and portfolio demonstration purposes. Configure your own credentials before any production deployment.