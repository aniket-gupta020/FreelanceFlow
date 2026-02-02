# 🚀 **FreelanceFlow**

**User and Rightholder:** *Aniket Guptaji*  
**Year Created:** *January 2026*

---

**FreelanceFlow** is a *comprehensive Freelance Marketplace and CRM application* designed to streamline the **entire freelance lifecycle**—from project inception to final invoicing. It integrates **project management**, **client interactions**, **real-time time tracking**, and **financial reporting** into a single, cohesive platform.

---

## ⚠️ **Legal Warning & Copyright Notice**

> **© January 2026 Aniket Guptaji. All rights reserved.**

The **source code, design, database schema, and intellectual property** contained within this repository are the **exclusive property of Aniket Guptaji**.

- 🚫 **Unauthorized Cloning:** Cloning, forking, or downloading this repository without *explicit written permission* from the Rightholder is **strictly prohibited**.
- 🔐 **Unauthorized Access:** Accessing this codebase, database, or associated APIs without authorization is a **violation of applicable cyber laws**.
- 💼 **Commercial Use:** No part of this software may be used for commercial purposes, sold, or distributed without a **valid license agreement**.

> **Any violation of these terms will be met with legal action.**

---

## 🚀 **Features**

### 💼 **Project & Client Management**
- **Centralized Dashboard:** Real-time visual insights using `recharts` for financial health and project status.
- **CRM:** Maintain detailed *client profiles*, *contact history*, and *project associations*.
- **Kanban/Task System:** Organize work with a **drag-and-drop** capable task management system.

### ⏱️ **Productivity Tools**
- **Smart Time Tracking:** Integrated **stopwatch** and **manual time logging** (`Stopwatch.jsx`, `TimeTracker.jsx`).
- **Activity Logs:** Track hours spent on specific tasks for *accurate billing*.

### 💳 **Financials**
- **Automated Invoicing:** Generate professional **PDF invoices** instantly using `jspdf` and `pdfkit`.
- **Revenue Tracking:** Visual breakdowns of *pending* vs. *paid* invoices.

### 🔒 **Security & UX**
- **Authentication:** Secure **JWT-based login** with **Bcrypt hashing**.
- **Antigravity UI:** Modern **"Glassmorphism"** design using **Tailwind CSS** with *backdrop-blur effects*.
- **Global Notifications:** Non-intrusive **toast notifications** for all system actions.

---

## 🛠️ **Technology Stack**

### **Client (Frontend)**
- **Framework:** React (via Vite)
- **Styling:** Tailwind CSS
- **State & Routing:** React Router DOM, React Hooks
- **Key Libraries:**
  - `axios` (API Requests)
  - `lucide-react` (Iconography)
  - `react-hot-toast` (Notifications)
  - `recharts` (Data Visualization)
  - `jspdf` (Client-side PDF generation)

### **Server (Backend)**
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Atlas/Local) with Mongoose ODM
- **Security:** `jsonwebtoken` (JWT), `bcryptjs`, `cors`
- **Utilities:** `pdfkit` (Server-side PDF), `faker` (Data Seeding)

---

## � **Project Structure**

```bash
FreelanceFlow/
├── client/                 # Frontend React Application
│   ├── src/
│   │   ├── components/     # Reusable UI (FinancialDashboard, Stopwatch, etc.)
│   │   ├── pages/          # Full Views (Dashboard, Invoices, Clients)
│   │   ├── api.js          # Centralized Axios Configuration
│   │   └── App.jsx         # Main Entry & Routing
│   └── ...
└── server/                 # Backend Node/Express Application
    ├── models/             # Mongoose Schemas (Invoice, Project, User)
    ├── routes/             # API Endpoints
    ├── middleware/         # Auth & Validation
    └── index.js            # Server Entry 
```

---

## ⚡ **Getting Started**

### **1. Server Setup**
Navigate to the server directory and install dependencies:

```bash
cd server
npm install
```

Create a `.env` file in the server root directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
```

Start the backend:

```bash
npm run dev
```

### **2. Client Setup**
Open a new terminal, navigate to the client directory, and install dependencies:

```bash
cd client
npm install
```

Start the Vite development server:

```bash
npm run dev
```

The application will launch at `http://localhost:5173` (or your configured port).

---

## 📬 **Contact & Support**

For **licensing inquiries**, **permissions**, or **support**, please contact the developer directly:

- 👤 **Developer:** [Aniket Guptaji](https://ianiket.netlify.app)
- 🌐 **Portfolio:** [ianiket.netlify.app](https://ianiket.netlify.app)
- 🔗 **LinkedIn:** [linkedin.com/in/aniket-guptaji](https://linkedin.com/in/aniket-guptaji)
- 📧 **Email:** [mail.akguptaji@gmail.com](mailto:mail.akguptaji@gmail.com)
- 📱 **Mobile:** +91 74149 08640

> **© 2026 Aniket Guptaji.**