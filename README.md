# 🍽 The Chef's Track — Restaurant Management System

**DBMS Project (UCS310) | Thapar Institute of Engineering & Technology**

**Team:** Aditya Pratap (102103064) | Anubhav Sood (102103075) | Harsh Arora (102103085) | Deepanshu Batheja (102283017)

---

## 🚀 Live Demo
> Deploy link will go here after deployment

## 📋 Features
- **Customer Side**: Browse menu by category, add items to cart, place orders, get bills
- **Admin Panel**: Dashboard with stats, menu CRUD, order management, bill generation with discounts, staff & customer management
- **Backend Logic**: All PL/SQL logic (triggers, procedures, functions) recreated as API routes

## 🛠 Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18 |
| Backend | Next.js API Routes |
| Database | SQLite (better-sqlite3) |
| Deployment | Render (recommended) or Railway |

## 📂 Project Structure
```
├── lib/db.js              # Database init + seeding
├── pages/
│   ├── index.js           # Customer menu & ordering
│   ├── admin.js           # Admin panel (password: admin123)
│   └── api/
│       ├── menu.js        # CRUD for food items
│       ├── orders.js      # Place & manage orders
│       ├── bills.js       # Generate bills (with tax & discount)
│       └── staff.js       # Waiters, chefs, customers, tips
```

## ⚙️ Run Locally
```bash
npm install
npm run dev
# Open http://localhost:3000
```

## 🌐 Deploy on Render (Recommended — Free)
1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. Set:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: Node
5. Click Deploy!

## 🗄 Database Schema
Matches the original Oracle SQL schema from the project report:
- `waiter`, `customer`, `chef`, `food`, `prepares`, `ord`, `contains`, `bill`, `tips`

## 🔐 Admin Login
Password: `admin123`
