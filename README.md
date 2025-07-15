# Cloud ERP - Frontend (Sales Module)

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

This is the **Frontend of the Cloud ERP System**, designed specifically for the Sales Module. It is implemented as a modern web application using **React.js**, **Next.js (App Router)**, **Redux Toolkit**, and **Tailwind CSS**, following a layered architecture for scalability and maintainability. The application is fully containerized with Docker for seamless deployment.

The frontend communicates with the **Cloud ERP Services backend** to provide clean, efficient, and user-friendly interfaces for all sales-related operations.

## 🚀 Technology Stack

### 🔧 Frontend
- **React.js** `19.x` — for building dynamic UI components
- **Next.js** `15.x` (App Router) — for server-side rendering and routing
- **Redux Toolkit** — for state management
- **Tailwind CSS** — for responsive, utility-first styling
- **Axios** — for API requests to the backend
- **React Hook Form** — for form handling and validation
- **Layered Architecture** — for modular, maintainable code
- **Docker** — for containerization and deployment

### ⚙️ Build & Tools
- **Node.js** `20.x` (LTS) — runtime environment
- **npm** — package management
- **ESLint & Prettier** — code linting and formatting
- **Jest & React Testing Library** — frontend testing

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

The frontend provides a responsive and intuitive interface for the following features:

### 1. Inventory Management
- View, add, update, and delete inventory records

### 2. Suppliers Management
- View, add, update, and delete supplier records

### 3. Customers Management
- View, add, update, and delete customer records

### 4. Sales Management
- View, add, update, and delete sales
- Visualize sales insights and trends with analytics dashboards

### 5. Reports Management
- View, add, update, and delete reports and invoices
- Export data and reports as JSON, PDF, and CSV

### 6. Authentication & Authorization
- Register and log in users
- Handle forgot/reset password flows
- Implement role-based access control

## 📂 Project Structure

```
📂 cloud_erp_frontend/
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

## 🚀 Getting Started

### Prerequisites
- Node.js 20.x (LTS) or higher
- npm 10.x or higher
- Docker (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/cloud-erp-frontend.git
   cd cloud-erp-frontend
   ```