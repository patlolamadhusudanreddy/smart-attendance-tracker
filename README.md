# 🎓 Smart Student Attendance System

> A production-ready, full-stack **MERN** application designed for universities, colleges, and academic institutions to manage attendance digitally with role-based access control (RBAC), multi-factor email OTP authentication, QR code sessions, Excel bulk imports, and exportable PDF audit reports.

[![Tech Stack](https://img.shields.io/badge/Stack-MongoDB%20%7C%20Express%20%7C%20React%20%7C%20Node-6366f1?style=for-the-badge)](https://github.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Deployment](https://img.shields.io/badge/Deploy-Render%20Ready-blue?style=for-the-badge)](https://render.com)

---

## 📌 Table of Contents
1. [Project Overview](#-project-overview)
2. [Key Features](#-key-features)
3. [Tech Stack](#-tech-stack)
4. [Folder Structure](#-folder-structure)
5. [Prerequisites & Requirements](#-prerequisites--requirements)
6. [Local Installation & Setup](#-local-installation--setup)
7. [Environment Variables](#-environment-variables)
8. [MongoDB Atlas Setup Guide](#-mongodb-atlas-setup-guide)
9. [Database Seeding & Demo Logins](#-database-seeding--demo-logins)
10. [REST API Documentation](#-rest-api-documentation)
11. [GitHub Push Commands](#-github-push-commands)
12. [Render Deployment Guide](#-render-deployment-guide)
13. [Screenshots Overview](#-screenshots-overview)
14. [Future Scope](#-future-scope)

---

## 🚀 Project Overview

Managing physical paper registers in educational institutions leads to proxy attendance, human errors, slow data retrieval, and wasted administrative hours. 

The **Smart Student Attendance System** solves this by unifying:
- **Instant Attendance Logging**: Teachers can mark batch attendance with single clicks or launch **Dynamic QR Code sessions** on classroom projectors.
- **Students Portal**: Students track their personal attendance rate in real-time with visual indicators (maintaining 75% examination compliance), review past logs on an **Interactive Attendance Calendar**, and export official reports.
- **Administrative Control**: Complete CRUD governance over students, teachers, and subjects, along with automated Excel bulk imports, PDF audit sheet generators, and live activity auditing.

---

## ✨ Key Features

### 🔐 1. Authentication & Security
- **Email + 6-Digit OTP Verification**: Registration requires verified institutional email via Nodemailer. OTPs expire in 5 minutes with automated TTL index cleanup.
- **Forgot Password Workflow**: Secure email verification OTP for password resets.
- **JWT Authentication**: JSON Web Tokens signed with configurable expiration (`7d`).
- **Role-Based Access Control (RBAC)**: Distinct permissions for `admin`, `teacher`, and `student`.
- **Security Headers & Defense**: `helmet`, `cors`, `express-rate-limit`, `express-mongo-sanitize`, and `bcryptjs` password hashing.

### 👑 2. Administrator Portal
- **Dashboard Telemetry**: Real-time charts for department enrollments, overall attendance percentage, and status distribution.
- **Manage Students**: Search, filter, add, edit, delete, and upload student profile avatars.
- **Bulk Excel Import**: Ingest dozens of students at once via `.xlsx` or `.xls` spreadsheets.
- **Manage Faculty (Teachers)**: Create teacher profiles, assign subjects, and monitor workload.
- **Manage Subjects**: Curriculum course codes, semester credit weighting, and teacher linking.
- **Institutional Reports**: Export institutional attendance records to **PDF**, **Excel**, or **CSV**.
- **Audit Trails**: Live logging of critical administrative operations.

### 🧑‍🏫 3. Teacher Portal
- **Classroom Attendance Sheet**: Filter by assigned subject & date, with one-click **"All Present"** / **"All Absent"** buttons and individual status toggles (*Present, Absent, Late, Excused*).
- **Dynamic QR Code Sessions**: Generate a live classroom QR code with a 10-minute expiry window for instant student mobile check-ins.
- **Attendance History & Adjustments**: Review past logs, edit erroneous entries, and add customized lecture remarks.
- **Subject Analytics**: Visual attendance rates for individual classes.

### 🎓 4. Student Portal
- **Attendance Percentage Gauge**: Real-time percentage counter with color-coded warnings if attendance drops below 75%.
- **Subject-Wise Breakdown**: Detailed progress bars per enrolled curriculum subject.
- **Interactive Attendance Calendar**: Visual color-coded calendar highlighting daily attendance.
- **QR Code Attendance Scanner**: Scan the teacher's projected QR code or paste session keys to verify participation.
- **Download Personal Audit Report**: 1-click download of an official signed PDF attendance record.

---

## 🛠 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React, Recharts, Axios, React Router v6 |
| **Backend** | Node.js, Express.js (MVC Architecture) |
| **Database** | MongoDB Atlas / Mongoose ODM |
| **Security & Auth**| JWT, Bcrypt.js, Helmet, CORS, Express-Rate-Limit, Express-Mongo-Sanitize |
| **Email Service** | Nodemailer (Gmail / SMTP / Ethereal Test fallback) |
| **File Processing** | PDFKit (PDF generation), XLSX (Spreadsheets), Multer (File uploads), QRCode |
| **Deployment** | Render (Web Service & Static Site), MongoDB Atlas Cloud |

---

## 📂 Folder Structure

```
smart-student-attendance-system/
├── backend/
│   ├── config/
│   │   ├── db.js                 # MongoDB Atlas Mongoose connection
│   │   └── nodemailer.js         # Transporter configuration & dev fallback
│   ├── controllers/
│   │   ├── authController.js     # Register, OTP verify, Login, Forgot PW
│   │   ├── studentController.js  # Student CRUD, Excel upload, Avatar upload
│   │   ├── teacherController.js  # Teacher CRUD, Assigned subjects
│   │   ├── subjectController.js  # Subject CRUD, Teacher assignment
│   │   ├── attendanceController.js # Batch marking, QR sessions, Calendar
│   │   ├── reportController.js   # PDF, CSV, Excel generation
│   │   ├── dashboardController.js# Admin & Teacher analytics
│   │   └── notificationController.js # User notifications
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT Bearer verification & RBAC check
│   │   ├── errorMiddleware.js    # 404 & Centralized error handler
│   │   ├── rateLimiter.js        # Express rate limiting
│   │   └── uploadMiddleware.js   # Multer storage for images & spreadsheets
│   ├── models/
│   │   ├── User.js               # User accounts & Bcrypt hooks
│   │   ├── Student.js            # Student profile details
│   │   ├── Teacher.js            # Faculty credentials
│   │   ├── Subject.js            # Course subjects
│   │   ├── Attendance.js         # Daily attendance records
│   │   ├── Otp.js                # 6-digit OTPs with TTL index
│   │   ├── ActivityLog.js        # Audit trail records
│   │   └── Notification.js       # User notifications
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── studentRoutes.js
│   │   ├── teacherRoutes.js
│   │   ├── subjectRoutes.js
│   │   ├── attendanceRoutes.js
│   │   ├── reportRoutes.js
│   │   ├── dashboardRoutes.js
│   │   └── notificationRoutes.js
│   ├── services/
│   │   ├── emailService.js       # HTML templates for OTP & alerts
│   │   ├── pdfService.js         # PDFKit institutional report generator
│   │   ├── excelService.js       # XLSX spreadsheet parser & generator
│   │   └── qrService.js          # QR code generation & signing
│   ├── utils/
│   │   ├── apiResponse.js        # Standardized JSON response envelope
│   │   ├── generateToken.js      # JWT generator
│   │   └── otpGenerator.js       # Cryptographic 6-digit OTP generator
│   ├── uploads/                  # Upload directory for avatars
│   ├── .env.example
│   ├── package.json
│   ├── seed.js                   # Instant demo database seeder
│   └── server.js                 # Express server entry point
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Navbar.jsx    # Top navigation & notifications dropdown
│   │   │   │   ├── Sidebar.jsx   # Role-based collapsible drawer menu
│   │   │   │   ├── ProtectedRoute.jsx # RBAC route guard
│   │   │   │   ├── StatCard.jsx  # Metric cards
│   │   │   │   ├── Pagination.jsx# Reusable table pagination
│   │   │   │   ├── Modal.jsx     # Reusable dialog modal
│   │   │   │   ├── Loader.jsx    # Animated loading spinner
│   │   │   │   └── NotificationToast.jsx # Floating alerts
│   │   │   └── attendance/
│   │   │       ├── AttendanceCalendar.jsx # Monthly calendar view
│   │   │       ├── AttendanceSheet.jsx    # Interactive batch marking table
│   │   │       └── QrAttendanceScanner.jsx# QR display & student scanner
│   │   ├── context/
│   │   │   ├── AuthContext.jsx   # Authentication state & session
│   │   │   └── ThemeContext.jsx  # Dark / Light theme toggle
│   │   ├── pages/
│   │   │   ├── auth/             # Login, Register, VerifyOtp, ForgotPassword
│   │   │   ├── admin/            # Dashboard, ManageStudents, Teachers, Reports
│   │   │   ├── teacher/          # Dashboard, MarkAttendance, History, Reports
│   │   │   ├── student/          # Dashboard, Attendance, QR Scan
│   │   │   └── common/           # Profile, NotFound
│   │   ├── services/
│   │   │   └── api.js            # Axios client with JWT interceptor
│   │   ├── App.jsx               # Router & Layout definitions
│   │   ├── index.css             # Tailwind base & custom styles
│   │   └── main.jsx
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── package.json                  # Root monorepo orchestration
├── .gitignore
└── README.md
```

---

## 📋 Prerequisites & Requirements

- **Node.js**: v18.0.0 or higher (Tested on Node v20+)
- **NPM**: v9.0.0 or higher
- **MongoDB Atlas** account (or local MongoDB Community Server)
- Gmail / SMTP Account (for sending real OTP emails; fallback logger enabled by default)

---

## ⚙️ Local Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/smart-student-attendance-system.git
cd smart-student-attendance-system
```

### 2. Install Dependencies
Install dependencies for both backend and frontend:
```bash
# Using root shortcut:
npm run install:all

# OR manually:
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 3. Configure Environment Variables
Inside `backend/`, copy `.env.example` to `.env`:
```bash
cd backend
cp .env.example .env
```
Fill in your configuration details (see [Environment Variables](#-environment-variables) below).

### 4. Seed the Database
Populate the database with demo accounts, subjects, students, and 14 days of realistic attendance history:
```bash
cd backend
npm run seed
```

### 5. Start the Application
Run both backend and frontend concurrently:
```bash
# Terminal 1 - Backend Server (Port 5000)
cd backend
npm run dev

# Terminal 2 - Frontend Client (Port 5173)
cd frontend
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

## 🔑 Environment Variables

### Backend Configuration (`backend/.env`)

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB Atlas URI
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/smart_attendance?retryWrites=true&w=majority

# JWT Token Secret & Expiration
JWT_SECRET=super_secret_jwt_key_smart_attendance_system_2025_secure_key
JWT_EXPIRES_IN=7d

# Nodemailer SMTP Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM="Smart Attendance System <no-reply@smartattendance.edu>"

# Frontend URL (For CORS validation)
CLIENT_URL=http://localhost:5173

# QR Code Token Secret
QR_SECRET=qr_session_secret_attendance_system_secure_token
```

> **Note on Nodemailer**: If you do not provide real Gmail credentials in development, the system automatically runs an internal logger/Ethereal fallback so that OTP codes are printed directly to the terminal console without throwing errors!

---

## 🍃 MongoDB Atlas Setup Guide

1. Log in or create an account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free shared cluster (**M0 Free Tier**).
3. **Database Access**:
   - Go to **Security > Database Access**.
   - Click **Add New Database User**.
   - Create a user with password authentication (e.g., `attendance_admin`).
4. **Network Access**:
   - Go to **Security > Network Access**.
   - Click **Add IP Address** and choose **Allow Access From Anywhere** (`0.0.0.0/0`) for development and cloud deployments (Render).
5. **Get Connection String**:
   - Go to **Database > Clusters** and click **Connect**.
   - Select **Drivers** (Node.js).
   - Copy your connection string and replace `<password>` with your database user's password.
   - Paste into `backend/.env` under `MONGO_URI`.

---

## 🧪 Database Seeding & Demo Logins

After configuring `MONGO_URI`, run:
```bash
cd backend
npm run seed
```

Use the one-click **Quick Demo Fill** buttons on the login screen, or enter credentials manually:

| Role | Email Address | Password | Permissions |
|---|---|---|---|
| **👑 Admin** | `admin@smartattendance.edu` | `Admin@123` | Full Administrative & Academic Control |
| **🧑‍🏫 Teacher** | `teacher.sharma@smartattendance.edu` | `Teacher@123` | Mark attendance, QR Sessions, Subject Reports |
| **🧑‍🏫 Teacher 2**| `teacher.patel@smartattendance.edu` | `Teacher@123` | Mark attendance for Web Dev & Networks |
| **🎓 Student** | `student.aarav@smartattendance.edu` | `Student@123` | Check personal attendance, Calendar, Scan QR |
| **🎓 Student 2**| `student.priya@smartattendance.edu` | `Student@123` | Check personal attendance, Calendar, Scan QR |

---

## 📡 REST API Documentation

### Authentication Endpoints (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new user & send 6-digit OTP |
| `POST` | `/api/auth/verify-otp` | Public | Verify 6-digit registration OTP |
| `POST` | `/api/auth/resend-otp` | Public | Resend fresh OTP code |
| `POST` | `/api/auth/login` | Public | Authenticate user & receive JWT token |
| `POST` | `/api/auth/forgot-password`| Public | Request password reset OTP |
| `POST` | `/api/auth/verify-forgot-otp` | Public | Verify reset OTP |
| `POST` | `/api/auth/reset-password` | Public | Reset account password |
| `GET`  | `/api/auth/me` | Private | Retrieve authenticated user profile |
| `PUT`  | `/api/auth/profile` | Private | Update avatar, name, and phone |

### Student Endpoints (`/api/students`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/students` | Admin, Teacher | Paginated list of students with search |
| `POST` | `/api/students` | Admin | Create single student profile |
| `GET` | `/api/students/:id` | Private | Student details & summary |
| `PUT` | `/api/students/:id` | Admin | Update student profile |
| `DELETE` | `/api/students/:id` | Admin | Delete student and records |
| `POST` | `/api/students/bulk-upload` | Admin | Import students via Excel spreadsheet |
| `POST` | `/api/students/:id/photo` | Private | Upload student profile photo |

### Teacher Endpoints (`/api/teachers`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/teachers` | Admin, Teacher | Faculty list with assigned subjects |
| `POST` | `/api/teachers` | Admin | Create teacher account & profile |
| `GET` | `/api/teachers/my-subjects` | Teacher | Get logged-in teacher's subjects |
| `PUT` | `/api/teachers/:id` | Admin | Update teacher details & subjects |
| `DELETE`| `/api/teachers/:id` | Admin | Delete teacher account |

### Subject Endpoints (`/api/subjects`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/subjects` | Private | List all curriculum subjects |
| `POST` | `/api/subjects` | Admin | Create new course subject |
| `PUT` | `/api/subjects/:id` | Admin | Update subject credits & syllabus |
| `PUT` | `/api/subjects/:id/assign-teacher` | Admin | Assign faculty instructor |
| `DELETE`| `/api/subjects/:id` | Admin | Remove subject |

### Attendance Endpoints (`/api/attendance`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/attendance/batch` | Admin, Teacher | Batch mark attendance for classroom |
| `POST` | `/api/attendance/qr-session` | Admin, Teacher | Generate live dynamic QR token |
| `POST` | `/api/attendance/mark-qr` | Student | Mark student presence via QR token |
| `GET` | `/api/attendance` | Private | Query attendance logs with filters |
| `GET` | `/api/attendance/calendar` | Private | Monthly calendar aggregate data |
| `GET` | `/api/attendance/my-summary`| Student | Student percentage & subject breakdown |
| `PUT` | `/api/attendance/:id` | Admin, Teacher | Edit attendance status or remarks |
| `DELETE`| `/api/attendance/:id` | Admin, Teacher | Delete record |

### Reports Endpoints (`/api/reports`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/reports/daily` | Admin, Teacher | Daily attendance report |
| `GET` | `/api/reports/weekly` | Admin, Teacher | 7-day attendance trend |
| `GET` | `/api/reports/monthly` | Admin, Teacher | Monthly aggregate |
| `GET` | `/api/reports/export/pdf` | Private | Download official PDF audit document |
| `GET` | `/api/reports/export/excel` | Admin, Teacher | Download formatted Excel workbook |
| `GET` | `/api/reports/export/csv` | Admin, Teacher | Download CSV raw data |

---

## 📦 GitHub Push Commands

To push this project to a new repository on GitHub:

```bash
# 1. Initialize git repository
git init

# 2. Add all project files
git add .

# 3. Create initial commit
git commit -m "feat: complete production-ready Smart Student Attendance System"

# 4. Set main branch
git branch -M main

# 5. Link your GitHub remote repository
git remote add origin https://github.com/<your-github-username>/smart-student-attendance-system.git

# 6. Push code to GitHub
git push -u origin main
```

---

## 🚀 Render Deployment Guide

The project is structured to deploy smoothly on **Render** (as a Web Service for the backend and a Static Site for the frontend).

### Step 1: Deploy Backend (Render Web Service)
1. Go to [Render Dashboard](https://dashboard.render.com) and click **New + > Web Service**.
2. Connect your GitHub repository.
3. Configure settings:
   - **Name**: `smart-attendance-api`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. Add **Environment Variables** in Render:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `MONGO_URI`: `your_mongodb_atlas_connection_string`
   - `JWT_SECRET`: `your_random_secure_jwt_secret`
   - `EMAIL_HOST`: `smtp.gmail.com`
   - `EMAIL_PORT`: `587`
   - `EMAIL_USER`: `your_email@gmail.com`
   - `EMAIL_PASS`: `your_app_password`
   - `CLIENT_URL`: `https://smart-attendance-client.onrender.com` (your frontend Render URL)
5. Click **Create Web Service**. Note your backend URL (e.g., `https://smart-attendance-api.onrender.com`).

### Step 2: Deploy Frontend (Render Static Site)
1. In Render Dashboard, click **New + > Static Site**.
2. Connect the same repository.
3. Configure settings:
   - **Name**: `smart-attendance-client`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Add **Environment Variables**:
   - `VITE_API_URL`: `https://smart-attendance-api.onrender.com/api` (your deployed backend URL)
5. Add **Rewrite / Redirect Rule** (for React Router single-page navigation):
   - Under **Redirects/Rewrites**:
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Action**: `Rewrite`
6. Click **Create Static Site**.

---

## 📸 Screenshots Overview

| Screen | Description |
|---|---|
| **Admin Dashboard** | High-level analytics, enrollment counts, department bar charts, and live activity audits. |
| **Interactive Marking Sheet** | Live classroom roster with bulk "All Present" buttons and real-time attendance tallies. |
| **Dynamic Classroom QR** | Teacher-facing QR session screen with 10-minute expiry countdown. |
| **Student Workspace** | Color-coded 75% compliance gauges and subject progress bars. |
| **Attendance Calendar** | Monthly color-coded attendance calendar for quick visual audits. |
| **PDF Audit Export** | Formatted institutional document ready for faculty archiving. |

---

## 🔮 Future Scope

- **Face Recognition Integration**: AI-driven facial verification using webcam snapshots for automated classroom check-in.
- **Geofencing Verification**: GPS-restricted QR code scanning allowing attendance only within campus lecture halls.
- **WhatsApp / SMS Gateway Alerts**: Instant parent notifications when a student is marked absent.
- **Biometric Device Sync**: Integration with ZKTeco or Essl hardware biometric fingerprint scanners.
- **Timetable Automation**: Dynamic class scheduler with lecture room conflict prevention.

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
