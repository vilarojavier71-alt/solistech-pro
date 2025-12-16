# SolisTech Pro 🚀

**SolisTech Pro** is a comprehensive, modern SaaS management platform designed for technical installation companies (Solar, HVAC, Electrical). It streamlines operations from lead acquisition to project execution and invoicing.

## 🏗 Technology Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Actions)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL, RLS, Realtime)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/) (Radix Primitives)
- **Maps**: Leaflet / React-Leaflet
- **Validation**: Zod
- **Forms**: React Hook Form

## 🧩 Core Modules

### 1. 📊 Dashboard & Analytics
- Real-time overview of business health.
- **Notifications System**: In-app alerts for critical events.

### 2. 🤝 CRM (Customer Relationship Management)
- **Clients**: Management of residential and corporate clients.
- **Leads**: Pipeline tracking from prospect to conversion.

### 3. 🛠 Operations & Projects
- **Project Management**: Track installation status, locations, and technical details.
- **Technical Memories**: Automated PDF generation for legal documentation.
- **Photo Gallery**: Specialized upload system for installation evidence.

### 4. 💰 Sales & Finance
- **Quotes (Presupuestos)**: Create and track estimates.
- **Invoices (Facturas)**: Professional invoicing with AEAT compliance features.
- **Payments**: Track status (Pending, Paid, Overdue).

### 5. 👷 Human Resources (HR)
- **Time Tracking (Fichajes)**:
    - **Geolocation**: Clock-in restricted to 500m radius of project site.
    - **Visual History**: Timeline of employee activity.
    - **Export**: Generate reports for labor inspections.

### 6. 🌍 Tools
- **Catastro Explorer**: 
    - Interactive Map (Leaflet) for parcel visualization.
    - Smart search by Address, Coordinates, or Catastral Reference (RC).
    - Validation of property data.

## 🔒 Security
- **Row Level Security (RLS)**: Data access is strictly controlled at the database level based on Organization ID and User Roles.
- **Server Actions**: Secure backend logic execution.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase Project

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd solistech-pro
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   Create a `.env.local` file with your credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_key (Optional)
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```

## 📂 Project Structure

- `/src/app`: App Router pages and layouts.
- `/src/components`: Reusable UI components (Dashboard, Shadcn, Charts).
- `/src/lib/actions`: Server Actions (Backend Logic).
- `/src/lib/services`: External API integrations (Catastro, etc.).
- `/supabase`: SQL Migrations and types.
