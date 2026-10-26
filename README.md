# Property Listing & Rental Portal

## 1. Overview
A full-stack property listing and rental portal built with vanilla JavaScript frontend and Node.js/Express/MongoDB backend. Supports seekers, owners (including agents), and admins. Listings go through optional moderation. No payments or contracts are handled — the platform is for discovery and inquiries only.

## 2. Features
- User registration (seeker/owner only), login, password reset (email or console in dev)
- Property CRUD with status workflow and moderation
- Image upload (Cloudinary in prod, local in dev)
- Search with filters, pagination, text search
- Inquiries and viewing requests with slot conflict detection
- Favorites, reports
- Admin dashboard, user suspension, listing moderation, audit logs
- Secure auth (JWT HttpOnly cookie, bcrypt cost 12+, tokenVersion, CSRF header + origin check)
- Rate limiting, Helmet CSP (no inline scripts), input sanitization

## 3. Stack
- Frontend: HTML5, CSS3 (Flexbox/Grid), vanilla ES6+ modules, Fetch API
- Backend: Node.js 20 LTS, Express 4.x, MongoDB + Mongoose
- Auth: bcryptjs, jsonwebtoken, cookie-parser
- Validation: express-validator
- Security: helmet, cors, express-rate-limit, custom sanitizer
- Images: multer + cloudinary (or local disk)
- Email: nodemailer (or console)
- Tests: Jest, Supertest, mongodb-memory-server

## 4. Project Structure
```
server/
  config/       # db, env validation
  controllers/  # auth, etc.
  middleware/   # auth, csrf, sanitize, error
  models/       # User, Property, Inquiry, Favorite, Report, AuditLog, PasswordReset
  routes/       # auth, users, properties, inquiries, reports, admin, health
  services/     # property transitions, image, email
  utils/
  server.js
client/
  pages/        # HTML pages (index, login, search, details, profile, admin*, etc.)
  assets/css/
  assets/js/    # api.js, auth.js, ui.js, layout.js, guards.js, page-specific
  components/
scripts/        # createAdmin.js, seed.js
tests/
uploads/        # local images (dev only, gitignored)
```

## 5. Prerequisites (Mac)
1. **Node.js 20 LTS**: Install via [nodejs.org](https://nodejs.org) or Homebrew:
   ```bash
   brew install node@20
   ```
2. **MongoDB**: 
   - Local: `brew tap mongodb/brew && brew install mongodb-community` then `brew services start mongodb-community`
   - Or use MongoDB Atlas (free tier) and set `MONGODB_URI` accordingly.
3. Optional for production features:
   - Cloudinary account (image uploads)
   - SMTP provider (Gmail App Password, SendGrid, etc.) for emails

## 6. Install
```bash
git clone https://github.com/AkshayPallekona/property-listing-portal.git
cd property-listing-portal
npm install
cp .env.example .env
# Edit .env with your MONGODB_URI, JWT_SECRET (≥32 chars), etc.
```

## 7. Environment Variables
See `.env.example`. Required:
- `JWT_SECRET` (min 32 characters)
- `MONGODB_URI`
In production also Cloudinary vars and proper `EMAIL_MODE=smtp` with SMTP config. Startup fails if missing.

`MODERATION_REQUIRED=true` (default) forces pending_review on publish.

## 8. MongoDB Setup
**Local**:
```bash
brew services start mongodb-community
# Default URI: mongodb://localhost:27017/property_portal
```
**Atlas**:
1. Create free cluster at cloud.mongodb.com
2. Create database user
3. Get connection string, whitelist your IP (or 0.0.0.0/0 for testing)
4. Set `MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/property_portal`

## 9. Running
**Development**:
```bash
npm run dev          # nodemon server/server.js
# In another terminal (first time):
npm run seed         # creates demo owner/seeker + one listing (refuses if NODE_ENV=production)
```
Open http://localhost:5000/pages/index.html

**Create admin** (interactive or via env):
```bash
npm run create-admin
# or set ADMIN_EMAIL / ADMIN_PASSWORD in .env and run
```

**Production mode local smoke test**:
```bash
NODE_ENV=production npm start
# Requires Cloudinary + SMTP config or it will exit with clear error
```

**Tests**:
```bash
npm test
```

## 10. API Summary (prefix /api/v1)
All responses: `{ success: true, data, message }` or `{ success: false, error: { code, message, details? } }`

- `POST /auth/register` `{name, email, password, role?}` → 201
- `POST /auth/login` `{email, password}` → sets HttpOnly cookie
- `POST /auth/logout`
- `POST /auth/forgot-password` `{email}` (always generic success)
- `POST /auth/reset-password` `{token, password}`
- `GET /auth/me`
- `PATCH /auth/change-password`
- `GET /properties` (filters: q, city, propertyType, purpose, minPrice, maxPrice, bedrooms, sort, page, limit≤50)
- `GET /properties/featured`, `/recent`, `/:id`
- `POST /properties` (owner) → draft
- `POST /properties/:id/images` (multipart)
- `POST /properties/:id/publish`
- `GET /users/me`, `PATCH /users/me` (allowlist name/phone)
- `GET /users/me/favorites`, `/inquiries`, `/properties`
- Health: `GET /health`

CSRF: All state-changing requests require header `X-Requested-With: XMLHttpRequest` and matching Origin.

## 11. Admin Setup
Run `node scripts/createAdmin.js` after setting ADMIN_* env vars or providing args. No default password. Admins cannot be registered via API.

## 12. Cloudinary
Set `CLOUDINARY_CLOUD_NAME`, `_API_KEY`, `_API_SECRET`. In production the app refuses to start without them. Local disk used only when not in production and Cloudinary not configured.

## 13. SMTP
Set `EMAIL_MODE=smtp` + SMTP_* vars. In development `EMAIL_MODE=console` prints reset links to terminal (clearly labeled DEV ONLY). Production refuses console mode.

## 14. Deployment
Recommended: Node host (Render, Railway, Fly.io, VPS) + MongoDB Atlas.
1. Set `NODE_ENV=production`
2. Set all required env vars including Cloudinary and SMTP
3. `TRUST_PROXY=true` if behind reverse proxy
4. Ensure HTTPS (Secure cookie)
5. Health check on `/api/v1/health`
6. Run `npm install --production` and `npm start`
Do not run seed in production.

## 15. Troubleshooting
- "Missing JWT_SECRET": set a long random string in .env
- Mongo connection failed: check URI, network access, or start local mongod
- Images fail in prod: Cloudinary credentials
- CORS / CSRF errors: check ALLOWED_ORIGINS matches your frontend origin exactly
- Rate limited: wait or increase limits in .env for testing

## 16. Limitations
- emailVerified field exists but no verification flow is implemented
- Messaging is limited to the initial inquiry message; no chat
- No payments, contracts, or booking confirmation beyond inquiry status
- Soft delete only (archive); hard delete not exposed
- Frontend is multi-page vanilla HTML; not a full SPA
- Search text index has standard MongoDB limitations (no stemming by default, etc.)
- Multer 1.x has known vulnerabilities; upgrade carefully if needed

## 17. Security Notes
- Role, status, ownerId never accepted from client body
- Field allowlists on all creates/updates
- JWT includes tokenVersion; invalidated on password change
- Suspended users blocked on every request
- No stack traces in production
- .env gitignored

## 18. Tests
Jest + Supertest + mongodb-memory-server. Cover auth flows, property transitions, inquiries, favorites, admin, role escalation attempts. Frontend jsdom tests for api wrapper and guards.

Run `npm test` and `npm run lint` before committing.

---

**What was verified in this environment**: Core structure, models, auth middleware, basic routes, frontend skeleton, env validation, seed refusal in production. Full end-to-end with real MongoDB, Cloudinary, and SMTP could not be executed here (no local Mongo daemon available in the build sandbox; network for npm was slow). Please run locally on your Mac following the steps above and report any issues.
