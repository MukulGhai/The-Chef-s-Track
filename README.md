# The Chef's Track — Fine Dining Indian Restaurant Management System

**DBMS Project (UCS310) | Thapar Institute of Engineering & Technology**

**Team:** Mukul Ghai (102303463) | Sabyasachi Chaturvedi (102303458) | Saarthi Arora (102303457)

---

## Deployment Link
https://the-chef-s-track.vercel.app/

## Overview
The Chef's Track is a **luxury 5-star fine dining Indian restaurant management system**. It features a polished customer-facing ordering interface with cinematic food photography, persistent cloud storage via Supabase, and a robust admin dashboard for full restaurant operations.

## Features
- **Customer Side (Luxury UI)**: Browse a curated menu of authentic Indian dishes (Appetizers, Main Course, Breads, Desserts, Beverages), real-time stock-aware cart, place orders, and view detailed dynamic bills.
- **Admin Panel**: Secure dashboard with real-time stats, comprehensive menu CRUD with **image upload support**, order management, dynamic bill generation (with taxes and discounts), staff and customer tracking.
- **Cloud Database**: Persistent data storage via **Supabase PostgreSQL** — data is never lost between deploys or restarts.
- **Image Uploads**: Upload food photos directly from the admin panel — stored in **Supabase Storage** with public CDN delivery.

## Tech Stack
| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 18, Custom CSS Architecture |
| **Design System** | Cormorant Garamond & Montserrat Typography |
| **Backend** | Next.js API Routes (Serverless-ready) |
| **Database** | Supabase PostgreSQL (Cloud) |
| **File Storage** | Supabase Storage (for food images) |
| **Hosting** | Vercel |

## Project Structure
```
├── lib/db.js              # Supabase client initialization
├── pages/
│   ├── index.js           # Customer menu & checkout flow
│   ├── admin.js           # Admin management dashboard (with image upload)
│   ├── _app.js            # Global app layout
│   ├── _document.js       # Document-level font loading
│   └── api/
│       ├── menu.js        # CRUD operations for menu items (+ image URL)
│       ├── orders.js      # Place & manage orders, stock deduction
│       ├── bills.js       # Generate bills with discount/tax logic
│       ├── staff.js       # Waiters, chefs, customers, tips
│       └── upload.js      # Image upload to Supabase Storage
├── public/food/           # Fallback food photography
├── styles/globals.css     # Luxury CSS design system
└── supabase_migration.sql # Database schema + seed data
```

## Setup

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to **SQL Editor** and run the contents of `supabase_migration.sql`
4. Go to **Storage** → Create a new bucket called `food-images` and set it to **Public**

### 2. Configure Environment Variables
Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_ADMIN_PASSWORD=admin123
```

### 3. Run Locally
```bash
npm install
npm run dev
# Open http://localhost:3000
```

### 4. Deploy on Vercel
Add the same 3 environment variables in your Vercel project settings.

## Database Schema
PostgreSQL tables hosted on Supabase:
- `waiter`, `customer`, `chef`, `food` (with `item_image` and `item_description`), `prepares`, `ord`, `contains`, `bill`, `tips`

## Admin Access
The admin panel is accessible at `/admin`.
Password is set via `NEXT_PUBLIC_ADMIN_PASSWORD` environment variable.
