
# Invoicer — AI-Powered Invoice & Billing Manager

A modern, full-stack invoicing platform designed to simplify billing, client management, payment tracking, and financial workflows using AI-powered features.

### 🌐 [Live Demo](https://ai-invoice-billing-app.vercel.app/)

## 🚀 Overview

Invoicer helps businesses and freelancers manage their invoicing process from a centralized dashboard.

The platform combines traditional invoice management with AI-assisted tools to streamline repetitive tasks and provide useful financial insights.

## 📸 Application Screenshots
<img width="1893" height="908" alt="Screenshot (1556)" src="https://github.com/user-attachments/assets/6d4b979c-fd4c-40d3-a476-b02018d1df80" />
<img width="1890" height="913" alt="Screenshot (1536)" src="https://github.com/user-attachments/assets/cb1aa266-4554-45be-bc20-5d2b36f247f5" />

## ✨ Features

- 🔐 **User Authentication** — Secure login and account management.
- 📄 **Invoice Management** — Create, organize, and manage invoices.
- 👥 **Client Management** — Maintain client information and billing records.
- 💳 **Payment Tracking** — Monitor invoice payments and outstanding balances.
- 🤖 **AI Receipt Processing** — AI-assisted receipt analysis and information extraction.
- 📩 **Smart Reminders** — Generate payment follow-up reminders.
- 📊 **Revenue Insights** — View financial summaries and track business performance.
- 📱 **Responsive Interface** — Modern dashboard designed for different screen sizes.

## 🛠️ Technology Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | JavaScript, Vite |
| Backend | Node.js, Express.js |
| Database | PostgreSQL, Neon |
| Authentication | JWT |
| AI Integration | Google Gemini |
| Deployment | Vercel |

## 🏗️ Project Structure

```text
ai-invoice-billing-app/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── scripts/
│   └── package.json
├── frontend/
│   └── invoicer/
│       ├── src/
│       └── package.json
└── vercel.json
```

## ⚙️ Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/hussien-alloush/ai-invoice-billing-app.git
cd ai-invoice-billing-app
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Configure environment variables

Create a `.env` file in the backend directory.

Required configuration includes:

```env
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_secure_jwt_secret
```

Add any other API keys required by the AI integration and application configuration.

**Never commit real credentials or `.env` files to GitHub.**

### 4. Install frontend dependencies

```bash
cd ../frontend/invoicer
npm install
```

Use the development scripts defined in each application's `package.json` to start the frontend and backend.

## ☁️ Deployment

The application is deployed using **Vercel Services**.

- The Vite frontend serves the user interface.
- The Express backend handles API requests.
- Neon PostgreSQL provides the cloud database.
- Frontend and backend share one public application domain.



## 👨‍💻 Project

Developed as a full-stack project exploring modern web technologies, business workflow automation, and practical AI integration.
