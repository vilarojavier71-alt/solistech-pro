# QA Test Plan - MotorGap Local Deployment

## Pre-Flight Verification - December 16, 2025

### Infrastructure Status

- [x] Docker PostgreSQL: **Running (Healthy)** on port 5435
- [x] Next.js Server: **Running** at <http://localhost:3000>
- [x] Legal Compliance (RGPD/LOPD): **Enhanced**

---

## User Verification Mission Checklist

### 1. Authentication Flow

| Test | Expected Result | Status |
|------|----------------|--------|
| Access `/auth/login` | MotorGap branded login page | ⬜ |
| Login with credentials | Redirect to `/dashboard` | ⬜ |
| Access `/auth/register` | Registration form displays | ⬜ |
| Register new user | User created, logged in | ⬜ |
| Logout | Session cleared, redirect to login | ⬜ |

### 2. Dashboard & Navigation

| Test | Expected Result | Status |
|------|----------------|--------|
| Sidebar displays | "MotorGap" branding (Car icon, blue) | ⬜ |
| Navigate all modules | No 404 errors | ⬜ |
| Theme toggle | Light/Dark modes work | ⬜ |
| Mobile menu | Hamburger menu functional | ⬜ |

### 3. Data Creation Flow

| Test | Expected Result | Status |
|------|----------------|--------|
| Create new client | Client saved to DB | ⬜ |
| Create new project | Project linked to client | ⬜ |
| Create invoice | Invoice with PDF generation | ⬜ |
| Create time entry | Time logged correctly | ⬜ |

### 4. Data Persistence Verification

```bash
# Restart Docker PostgreSQL
docker-compose restart postgres

# Wait 10 seconds, then verify data is still present in the app
```

| Test | Expected Result | Status |
|------|----------------|--------|
| Data survives DB restart | All previously created data visible | ⬜ |

### 5. Legal Compliance Verification  

| Test | Expected Result | Status |
|------|----------------|--------|
| Cookie banner | Shows on first visit | ⬜ |
| `/legal/terms` | MotorGap terms with Spain law | ⬜ |
| `/legal/privacy` | ARCO rights + AEPD info | ⬜ |
| `/legal/cookies` | Cookie policy accessible | ⬜ |

### 6. Error Simulation

| Test | Expected Result | Status |
|------|----------------|--------|
| Invalid form submission | Validation errors display | ⬜ |
| Network error (disconnect) | Graceful error handling | ⬜ |
| Check browser console | No critical JS errors | ⬜ |

---

## Quick Commands

```powershell
# Stop all services
docker-compose down

# Start PostgreSQL
docker-compose up -d postgres

# Run development server
npm run dev

# Run production build & start
npm run build && npm run start
```

## Access Points

- **App**: <http://localhost:3000>
- **DB Admin (Adminer)**: <http://localhost:8080> (run with `docker-compose --profile dev up -d`)
