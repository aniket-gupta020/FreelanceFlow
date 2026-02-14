# 🚀 FreelanceFlow

## 📖 Overview

**FreelanceFlow** is a comprehensive, all-in-one platform designed to streamline the entire freelance lifecycle. Bridging the gap between **Project Management**, **CRM**, **Time Tracking**, and **Financial Reporting**, it empowers independent professionals to manage their business with ease and elegance.

Built on the robust **MERN Stack** and featuring a modern "Glassmorphism" UI, FreelanceFlow ensures a seamless, secure, and visually stunning experience from client acquisition to final invoicing.

**Live Demo:** [freelance-flow-omega.vercel.app](https://freelance-flow-omega.vercel.app)

---

## 📑 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running Locally](#running-locally)
- [Project Structure](#-project-structure)
- [Testing](#-testing)
- [License & Legal](#-license--legal)
- [Contact](#-contact)

---

## ✨ Features

- **📊 Smart Dashboard**: Real-time insights into active projects, total clients, and revenue via interactive charts.
- **👥 CRM System**: Complete client lifecycle management with detailed history and project linking.
- **⏱️ Precision Time Tracking**: Integrated stopwatch and manual logging for accurate billing.
- **💰 Automated Invoicing**: One-click PDF generation with "Mark as Paid" tracking.
- **📱 Mobile-First Design**: Fully responsive UI with sidebar-to-hamburger navigation.
- **🔐 Secure Authentication**: JWT-based auth with session management.
- **📈 Tiered Access**: Logic for Free vs. Pro plans (Freemium model).

---

## 🛠 Tech Stack

### Frontend (Client)
- **Framework**: React (Vite)
- **Styling**: Tailwind CSS (Glassmorphism & Backdrop-blur)
- **State & Routing**: React Router DOM, React Hooks, Axios
- **Visualization**: Recharts
- **PDF Engine**: jspdf (Client-side generation)

### Backend (Server)
- **Runtime**: Node.js & Express.js
- **Database**: MongoDB Atlas (Mongoose ODM)
- **Security**: JWT, Bcrypt, CORS
- **Hosting**: Render (Backend), Vercel (Frontend)

---

## 🚀 Getting Started

Follow these instructions to set up the project locally.

### Prerequisites
- **Node.js** (v14 or higher)
- **MongoDB** (Local or Atlas connection string)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/aniket-guptaji/FreelanceFlow.git
   cd FreelanceFlow
   ```

2. **Install Backend Dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../client
   npm install
   ```

### Environment Variables

Create a `.env` file in the `server` directory with the following variables:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
# Add other backend variables as needed
```

*(Optional)* Create a `.env` file in the `client` directory if you want to override the API URL:

```env
VITE_API_URL=http://localhost:5000/api
```

### Running Locally

1. **Start the Backend Server**
   ```bash
   cd server
   npm run dev
   # Server runs on http://localhost:5000
   ```

2. **Start the Frontend Client**
   ```bash
   cd client
   npm run dev
   # Client runs on http://localhost:5173 (usually)
   ```

---

## 📂 Project Structure

```bash
FreelanceFlow/
├── client/                 # React + Vite Frontend
│   ├── src/
│   │   ├── components/     # UI Components (Stopwatch, Charts, etc.)
│   │   ├── pages/          # Page Views (Dashboard, Invoices, Profile)
│   │   └── api.js          # Axios Configuration
│   └── public/             # Static Assets
└── server/                 # Node.js + Express Backend
    ├── models/             # Mongoose Schemas (User, Client, Project)
    ├── routes/             # API Routes
    ├── controllers/        # Request Handlers
    └── middleware/         # Auth & Validation
```

---

## 🧪 Testing

To verify the system functionality, please refer to the detailed [Testing Guide](TESTING.md).

- **Load Sample Data**: Use the "Load Sample Data" button on the Dashboard.
- **Auth Flow**: Test registration, login, and token persistence.
- **Core Features**: Subscription limits, Project logic, and Invoicing accuracy.

---

## ⚠️ License & Legal

**© 2026 Aniket Guptaji. All rights reserved.**

The source code, database schema, and UI design are the **exclusive property** of Aniket Guptaji.

- **Unauthorized Cloning/Forking** is strictly prohibited.
- **Commercial Use** without a valid license will result in legal action.

---

## 📬 Contact

For licensing inquiries or technical support:

- **Developer**: Aniket Guptaji
- **LinkedIn**: [aniket-guptaji](https://linkedin.com/in/aniket-guptaji)
- **Email**: mail.akguptaji@gmail.com