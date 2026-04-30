# 🍽 The Chef's Track — Fine Dining Indian Restaurant Management System

**DBMS Project (UCS310) | Thapar Institute of Engineering & Technology**

**Team:**  Mukul Ghai (102303463) | Sabyasachi Chaturvedi (102303458) | Saarthi Arora (102303457) 

---

## 🌟 Overview
The Chef's Track has been completely redesigned into a **luxury 5-star fine dining Indian restaurant experience**. The system features a highly polished customer-facing ordering interface with cinematic food photography and a robust backend to handle full restaurant operations.

## 📋 Features
- **Customer Side (Luxury UI)**: Browse a curated menu of authentic Indian dishes (Appetizers, Main Course, Breads, Desserts, Beverages), real-time stock-aware cart, place orders, and view detailed dynamic bills.
- **Admin Panel**: Secure dashboard with real-time stats, comprehensive menu CRUD, order management, dynamic bill generation (with taxes and discounts), staff and customer tracking.
- **Backend Logic**: All PL/SQL logic (triggers, procedures, functions) engineered as robust Next.js API routes with strict validation, concurrency controls, and transactional integrity.

## 🛠 Tech Stack
| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 18, Custom CSS Architecture |
| **Design System** | Cormorant Garamond & Montserrat Typography |
| **Backend** | Next.js API Routes (Serverless-ready) |
| **Database** | `sql.js` (In-memory SQLite compiled to WebAssembly) |

## 📂 Project Structure
```
├── lib/db.js              # Database init, race-condition locks & full Indian menu seeding
├── pages/
│   ├── index.js           # Customer menu & checkout flow (Redesigned)
│   ├── admin.js           # Admin management dashboard
│   ├── _app.js            # Global app layout
│   ├── _document.js       # Document-level font loading
│   └── api/
│       ├── menu.js        # CRUD operations for menu items
│       ├── orders.js      # Place & manage orders, stock deduction
│       ├── bills.js       # Generate bills with discount/tax logic
│       └── staff.js       # Waiters, chefs, customers, tips
├── public/food/           # High-quality AI-generated dish photography
└── styles/globals.css     # Luxury CSS design system
```

## ⚙️ Run Locally
```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# The app will be available at http://localhost:3000
```

## 🗄 Database Schema
Matches the original Oracle SQL schema from the project report:
- `waiter`, `customer`, `chef`, `food`, `prepares`, `ord`, `contains`, `bill`, `tips`

## 🔐 Admin Access
The admin panel is accessible at `/admin`.
The password is set via environment variable `NEXT_PUBLIC_ADMIN_PASSWORD`.
If not set, the default local fallback is `admin123`.
