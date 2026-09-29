# TCHS Automation — The Happy Club Studios

A modern, full-stack Proposal and Sales Invoice automation web application built for **The Happy Club Studios (TCHS)** and **The Cliffhanger Studios**. Replaces manual spreadsheet calculations with automated pricing, custom discount configurations, Canva-styled PDF quotation generation, digital staff signature stamps, and cloud database synchronization.

---

## 🚀 Key Features

- **Automated Proposal & Invoice Engine**: Real-time subtotal, dynamic add-on selection, automated invoice numbering (`TCHS-YYYYMMDD-XXXX`), and mobilization fee calculation per location zone.
- **Dynamic Discounts & Promos**:
  - Staff can selectively include or exclude discounts for specific clients.
  - Inline editing of discount names and calculation types (`%` percentage or `₱` fixed amount).
  - On-the-fly custom discount creation (e.g., *Early Bird Promo*, *Bridal Fair Special*, *Flash Sale*).
- **Canva-Themed Document Generator**:
  - Warm craft-paper aesthetic matching Canva templates (Great Vibes cursive calligraphy, Cinzel headers, sunflower accents).
  - One-click toggle between **Canva Quotation PDF** and **Official Formal Sales Invoice**.
  - Browser print-ready styling (`window.print()`).
- **Service Catalog Management (`/catalog`)**:
  - Centralized master catalog for Service Packages, Categories, Add-ons, and pricing intervals.
  - Strict separation of concerns: Proposal screen only picks from catalog; permanent catalog edits happen exclusively in `/catalog`.
- **Role-Based Authentication & Supabase Cloud Sync**:
  - Secure login with Supabase Auth and `public.profiles`.
  - **Admin-Only Account Provisioning**: Regular staff cannot register publicly; only users with `role: 'admin'` can create new staff credentials inside `/settings`.
  - Offline-first fallback to local storage when offline or configuring credentials.
- **Digital Signatures**:
  - HTML5 Canvas signature pad allowing staff to draw their signature stamp or upload an image signature.
  - Automatically stamps generated proposals and invoices with the active staff member's credentials.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16.3.6 (React 19, Turbopack, App Router)
- **Styling**: Tailwind CSS v4
- **Database & Auth**: Supabase Cloud PostgreSQL (Free Tier: $0/month)
- **Icons**: Lucide React
- **Language**: TypeScript

---

## 🏁 Getting Started

### 1. Clone the repository
```bash
git clone git@github.com:kuuz4n/tchs-automation.git
cd tchs-automation
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.local.example` to `.env.local`:
```bash
cp .env.local.example .env.local
```
Fill in your Supabase project credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Database Schema Setup
Execute the SQL schema in `supabase/schema.sql` in your Supabase SQL Editor, then optionally run the seed script:
```bash
node scripts/seed-cloud.js
```

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to access the application.

---

## 📂 Project Structure

```
├── scripts/
│   └── seed-cloud.js             # Supabase cloud database seeding script
├── src/
│   ├── app/
│   │   ├── catalog/page.tsx      # Master Service Catalog CRUD
│   │   ├── invoices/page.tsx     # Generated Sales Invoices archive
│   │   ├── login/page.tsx        # Staff login portal
│   │   ├── settings/page.tsx     # Admin user provisioning & digital signatures
│   │   ├── globals.css           # Tailwind v4 configuration & print CSS
│   │   ├── layout.tsx            # App root layout with AuthGuard & Navbar
│   │   └── page.tsx              # Proposal & Invoice Calculator
│   ├── components/
│   │   ├── auth/AuthGuard.tsx    # Route protection & role enforcement
│   │   ├── invoice/CanvaDocumentView.tsx  # Dual Canva PDF & Invoice preview
│   │   └── layout/Navbar.tsx     # App navigation & active session status
│   ├── lib/
│   │   ├── auth.ts               # Supabase auth helpers & admin account creation
│   │   ├── seed-data.ts          # Default packages, add-ons, zones & users
│   │   ├── storage.ts            # Local + Supabase synchronization engine
│   │   └── supabase.ts           # Supabase client initializer & URL sanitization
│   └── types/
│       └── index.ts              # TypeScript interfaces (Packages, Discounts, Invoices)
└── supabase/
    └── schema.sql                # PostgreSQL database schema & RLS rules
```

---

## 🔒 Security & Roles

- **Admin (`admin`)**: Full access to provision staff accounts, manage all employee profiles, update global branding, and edit master service catalog.
- **Sales Representative (`sales_rep`)**: Can build proposals, customize client discounts, generate invoices, and manage personal profile/signature. Cannot create or edit other staff accounts.
