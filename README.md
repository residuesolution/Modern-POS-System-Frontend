# Modern POS System – Frontend

<div align="center">
  <img src="https://img.shields.io/badge/React-18.x-61DAFB" alt="React">
  <img src="https://img.shields.io/badge/Next.js-14.x-000000" alt="Next.js">
  <img src="https://img.shields.io/badge/Redux_Toolkit-Latest-764ABC" alt="Redux Toolkit">
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.x-06B6D4" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Node.js-20.x-339933" alt="Node.js">
  <img src="https://img.shields.io/badge/Docker-Containerized-2496ED" alt="Docker">
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License">
</div>

## 📋 Overview

This is the **Frontend** of the **Modern POS System** for retail and hospitality, built as a scalable and modular web application using **React.js**, **Next.js (App Router)**, **Redux Toolkit**, and **Tailwind CSS**. The frontend is designed for optimal user experience, real-time operations, and seamless integration with the backend (Spring Boot) and third-party services. The app is containerized with Docker for efficient development and deployment.

## 🚀 Technology Stack

### 🔧 Frontend
- **React.js 18.x:** Dynamic and responsive UI components
- **Next.js 14.x (App Router):** Server-side rendering, routing, and scalability
- **Redux Toolkit:** Predictable, high-performance state management
- **Tailwind CSS:** Utility-first, responsive styling
- **Axios:** API requests to backend services
- **React Hook Form:** Robust form state management and validation
- **Layered Architecture:** For modular and maintainable codebase
- **Docker:** Containerization and deployment

### ⚙️ Build & Tools
- **Node.js 20.x (LTS):** Runtime environment
- **npm:** Dependency and build management
- **ESLint & Prettier:** Linting and code formatting
- **Jest & React Testing Library:** Unit and integration tests

## 📦 Project Dependencies

Key dependencies used in the project:

- `react`
- `react-dom`
- `next`
- `@reduxjs/toolkit`
- `react-redux`
- `tailwindcss`
- `axios`
- `react-hook-form`
- `eslint`
- `prettier`

## ✅ Functional Requirements Overview

### 1. Inventory Management
- View, add, update, and delete inventories, with real-time status and alerts

### 2. Suppliers Management
- View, add, update, and delete supplier information

### 3. Customers Management
- View, add, update, and delete customer records and purchase histories

### 4. Sales Management
- Scan/add products, process multi-mode payments
- View, add, update, and delete sales transactions
- See insights and trends in sales analytics dashboards

### 5. Reports Management
- View, add, update, delete reports and invoices
- Export data and reports as JSON, PDF, and CSV

### 6. Authentication & Authorization
- User registration and login flows
- Forgot and reset password
- Role-based access control (admin, cashier, manager)
- (Optionally) biometric authentication support

## 📂 Project Structure

```
📂 modern_pos_frontend/
├── 📂 app/
│   ├── 📂 admin/
│   ├── 📂 auth/
│   ├── 📄 favicon.ico
│   ├── 📄 layout.tsx
│   └── 📄 page.tsx
├── 📂 components/
├── 📂 config/
├── 📂 hooks/
├── 📂 public/
├── 📂 repositories/
├── 📂 services/
├── 📂 store/
├── 📂 styles/
├── 📂 types/
├── 📂 utils/
├── 📄 .env
├── 📄 .gitignore
├── 📄 Dockerfile
├── 📄 next.config.js
├── 📄 package.json
├── 📄 tailwind.config.js
└── 📄 README.md
```

## 🛠️ Setup Instructions

### Prerequisites
- **Node.js** 20.x or higher
- **npm** 10.x or higher
- **Docker** (for containerization and deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/residuesolution/modern_pos_frontend.git
   cd modern_pos_frontend
   ```