# 🎓Smart Campus

> IoT-based university access control system featuring dynamic QR codes, academic record integration, and a real-time administrative dashboard. Developed as a Capstone Project for the **Systems Analysis and Development Program** at **Senac College**.

[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE) 
[![Senac](https://img.shields.io/badge/Institution-Senac%20College-blue)](https://www.senac.br/) 
[![LGPD](https://img.shields.io/badge/Compliance-LGPD%20Ready-blueviolet)](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm) 


---
## 📋 Project Overview

**Smart Campus** is an IoT-based university access control system designed to improve campus security and attendance management through dynamic QR Code authentication. The platform integrates a mobile application, cloud services, and embedded hardware to provide a secure, real-time access management solution.

### Key Features

* **Dynamic QR Code Access:** Students generate temporary QR Codes through a mobile application for secure campus entry.

* **ESP32-Powered Turnstile Control:** An ESP32 device installed at the entrance validates QR Codes and controls physical access.

* **Real-Time Access Logging:** Every entry and exit is automatically recorded in a centralized database, enabling complete access history tracking.

* **Administrative Dashboard:** Administrators can monitor access events, review attendance records, and manage users in real time.

* **Cloud-Based Architecture:** The solution combines a cloud-hosted REST API, a managed relational database, and IoT hardware in an end-to-end integrated ecosystem.

--- 

## 🔒 LGPD & Data Privacy Compliance (Lei Geral de Proteção de Dados)

Because this application processes **Personal Data** related to student identification and campus access records, privacy and data protection were considered fundamental requirements throughout the development process, in compliance with Brazilian Federal Law nº 13.709/2018 (LGPD).

### Implemented Privacy Standards

* **Legal Basis for Processing (Art. 7º):** Personal data is collected exclusively for authentication, access control, attendance management, and campus security purposes. User registration and data processing are performed with the knowledge and consent of the student.

* **Data Minimization:** Only the information strictly necessary for user identification and access validation is stored, such as student ID, academic information, and access logs.

* **Access History Management:** Entry and exit records are securely stored and made available only to authorized administrators for operational and security purposes.

* **User Rights (Art. 18):** The platform provides mechanisms for users to:

  * Access their registered personal information.
  * Request correction of inaccurate or outdated data.
  * Request the deletion of their account and associated personal data when legally applicable.

* **Security Measures (Art. 46):** User credentials are protected using industry-standard password hashing techniques (bcrypt), while all communications between the mobile application, API, database, and IoT devices are performed through secure protocols.

* **Controlled Access to Data:** Administrative features are protected by authentication and authorization mechanisms, ensuring that sensitive information can only be accessed by authorized personnel.

--- 

## 🛠️ Tech Stack

* **Mobile Application:** React Native, TypeScript

* **Backend:** Node.js, Express.js, TypeScript

* **Database:** PostgreSQL, Prisma ORM

* **IoT Communication:** MQTT Protocol, ESP32

* **Authentication & Security:** JWT (JSON Web Tokens)

* **Data Validation:** Zod

* **Architecture:** REST API integrated with cloud services and IoT devices for real-time access control

--- 


## 👥 User Roles

| Role              | Responsibilities                                                                                               |
| ----------------- | -------------------------------------------------------------------------------------------------------------- |
| **Student**       | Generates dynamic QR Codes, accesses campus facilities, and views attendance records and academic evaluations. |
| **Professor**     | Records attendance and submits academic evaluations for each class session.                                    |
| **Administrator** | Monitors real-time building occupancy, analyzes access flow reports, and manages users and permissions.        |

---

## 🏗️ System Architecture

```text
┌─────────────────┐     MQTT      ┌──────────────────────┐     REST/JSON    ┌──────────────────┐
│  ESP32 + Camera │ ────────────► │   Node.js Backend    │ ◄─────────────── │ React Native App │
│   (Turnstile)   │ ◄──────────── │   (This Repository)  │                  │                  │
└─────────────────┘  OPEN / DENY  └──────────────────────┘                  └──────────────────┘
                                           │
                                           ▼
                                   ┌──────────────┐
                                   │ PostgreSQL   │
                                   └──────────────┘
```

### Communication Protocols

* **MQTT** — Lightweight communication between IoT devices and the backend (ESP32 ↔ Backend ↔ Turnstile).
* **REST/HTTP** — Structured communication between the mobile application and backend services (JWT + JSON).

---

## 📦 Prerequisites

Before running the project, make sure you have the following installed:

* Node.js v20+
* Docker & Docker Compose
* npm v9+

---

## ⚙️ Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/ViniciusMLAraujo/ProjetoPIBack.git
cd university-access
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Update the `.env` file with your local credentials and configuration values.

---

## 🗄️ Database Setup

### Start PostgreSQL with Docker

```bash
docker-compose up -d
```

### Run Migrations

```bash
npx prisma migrate dev
```

### Generate Prisma Client

```bash
npx prisma generate
```

### Seed Initial Data

```bash
npm run db:seed
```

A default administrator account will be created:

| Field    | Value             |
| -------- | ----------------- |
| Email    | `admin@teste.com` |
| Password | `123456`          |

> ⚠️ Development environment only. Never execute seed scripts in production.

### Open Prisma Studio

```bash
npm run db:studio
```

Available at:

```text
http://localhost:5555
```

---

## 🚀 Running the Application

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

The API will be available at:

```text
http://localhost:3000
```

Or the port configured through the `PORT` environment variable.

### Health Check

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "..."
}
```

---

## 🧪 Testing

Run all automated tests:

```bash
npm test
```

Generate a coverage report:

```bash
npm run test:coverage
```

### Testing Stack

* **Jest**
* **ts-jest**
* **Prisma Mocks**

No real database connection is required during test execution.

### Coverage Requirements

Minimum coverage threshold:

* **70% Branches**
* **70% Functions**
* **70% Lines**
* **70% Statements**


---

## 📂 Project Structure

```text
university-access/
├── prisma/
│   ├── schema.prisma          # Database blueprint — all tables and relationships
│   ├── seed.ts                # Seeds the database with initial test data
│   └── migrations/            # Database migration history (generated by Prisma)
│
├── src/
│   ├── config/
│   │   ├── env.ts             # Reads and validates environment variables
│   │   └── prisma.ts          # PrismaClient singleton instance
│   │
│   ├── modules/               # Business modules — one module per domain
│   │   ├── auth/              # Authentication, JWT, user creation ✅ Sprint 1
│   │   ├── students/          # Student CRUD 🔜 Sprint 1 (Dev 2)
│   │   ├── courses/           # Course CRUD 🔜 Sprint 1 (Dev 2)
│   │   ├── rooms/             # Room CRUD 🔜 Sprint 1 (Dev 3)
│   │   ├── schedules/         # Schedule CRUD 🔜 Sprint 1 (Dev 3)
│   │   ├── qrcode/            # QR Code generation and validation 🔜 Sprint 2
│   │   ├── access/            # Entry/exit logging + MQTT 🔜 Sprint 2
│   │   ├── attendance/        # Attendance and academic evaluations 🔜 Sprint 3
│   │   └── reports/           # Reports and admin dashboard 🔜 Sprint 3
│   │
│   ├── shared/
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.ts   # Authentication + role authorization ✅
│   │   │   └── error.middleware.ts  # Global error handler ✅
│   │   ├── utils/             # Shared utility functions
│   │   └── mqtt/              # MQTT client 🔜 Sprint 2
│   │
│   ├── __mocks__/             # Prisma mocks for testing
│   ├── __tests__/             # Automated tests
│   └── server.ts              # Application entry point (Express + routes)
│
├── .env.example               # Environment variables template
├── jest.config.js
├── tsconfig.json
└── package.json
```

### Module Pattern

Each module follows a three-file architecture:

| File            | Responsibility                                             |
| --------------- | ---------------------------------------------------------- |
| `service.ts`    | Business logic and database access through Prisma          |
| `routes.ts`     | Endpoint definitions, Zod validation, and error forwarding |
| `validation.ts` | Reusable Zod schemas                                       |

---

## 🔌 Available Endpoints

### ✅ Implemented (Sprint 1)

| Method | Endpoint          | Access        | Description                                            |
| ------ | ----------------- | ------------- | ------------------------------------------------------ |
| `POST` | `/api/auth/login` | Public        | Login endpoint — returns a JWT token                   |
| `GET`  | `/api/auth/me`    | Authenticated | Returns information about the currently logged-in user |
| `GET`  | `/health`         | Public        | Server health check                                    |

### 🚧 Planned Endpoints

| Method | Endpoint                    | Access                  | Sprint     |
| ------ | --------------------------- | ----------------------- | ---------- |
| `GET`  | `/api/students`             | ADMIN, PROFESSOR        | Dev 2 · S1 |
| `POST` | `/api/students`             | ADMIN                   | Dev 2 · S1 |
| `GET`  | `/api/courses`              | Authenticated           | Dev 2 · S1 |
| `POST` | `/api/courses`              | ADMIN                   | Dev 2 · S1 |
| `GET`  | `/api/rooms`                | Authenticated           | Dev 3 · S1 |
| `POST` | `/api/rooms`                | ADMIN                   | Dev 3 · S1 |
| `GET`  | `/api/schedules`            | Authenticated           | Dev 3 · S1 |
| `POST` | `/api/qrcode/generate`      | STUDENT                 | Dev 2 · S2 |
| `POST` | `/api/qrcode/validate`      | Internal (MQTT)         | Dev 3 · S2 |
| `GET`  | `/api/access/now`           | ADMIN                   | Dev 1 · S2 |
| `POST` | `/api/access/exit`          | STUDENT, ADMIN          | Dev 1 · S2 |
| `POST` | `/api/attendance`           | PROFESSOR               | Dev 1 · S3 |
| `GET`  | `/api/students/:id/history` | ADMIN, PROFESSOR, Owner | Dev 2 · S3 |
| `GET`  | `/api/reports/flow`         | ADMIN                   | Dev 1 · S3 |

---

## 🔐 Authentication

The system uses **JWT (JSON Web Tokens)** for authentication.

### Authentication Flow

1. Send a `POST /api/auth/login` request with `{ email, password }`.
2. The API returns `{ token, role }`.
3. All protected routes require the following header:

```http
Authorization: Bearer <token>
```

4. Tokens expire according to the `JWT_EXPIRES_IN` environment variable (default: `8h`).

### Available Roles

| Role        | Description                                                   |
| ----------- | ------------------------------------------------------------- |
| `ADMIN`     | Full system access                                            |
| `PROFESSOR` | Records attendance and manages academic information           |
| `STUDENT`   | Generates QR Codes and accesses personal academic information |


## 🛡️ Protecting New Routes

Use the authentication and authorization middlewares to secure endpoints based on user roles.

```typescript id="bq2m2x"
import { authMiddleware, requireRole } from '../../shared/middlewares/auth.middleware'
import { Role } from '@prisma/client'

// Authenticated users only
router.get('/route', authMiddleware, handler)

// ADMIN only
router.delete('/route/:id', authMiddleware, requireRole(Role.ADMIN), handler)

// ADMIN or PROFESSOR
router.get(
  '/classroom',
  authMiddleware,
  requireRole(Role.ADMIN, Role.PROFESSOR),
  handler
)
```

---

## 🔳 QR Code Access Flow

```text id="2u2ah7"
Student opens the mobile app
    → GET /api/qrcode/generate (authenticated with JWT)
    → Backend generates a unique UUID
    → Stores it in the database (QRToken) linked to the Student
    → Returns a Base64-encoded QR Code image

Student presents the QR Code at the turnstile
    → ESP32 scans the token
    → Publishes via MQTT:
      turnstile/scan { token, studentId }

Backend receives the MQTT message
    → Validates:
       • Token existence
       • Expiration (5 minutes)
       • Single-use policy
       • Correct owner
    → Creates an AccessLog entry with timestamp
    → Publishes via MQTT:
       turnstile/command { action: 'OPEN' }
       or
       turnstile/command { action: 'DENY' }

ESP32 activates the turnstile motor
```

> ⚠️ **Important:** The QR Code only grants physical access through the turnstile. It **does not record classroom attendance**. Attendance is managed separately by professors through the academic module.

---

## 👨‍💻 Team Responsibilities

| Developer | Sprint 1                                                | Sprint 2               | Sprint 3                                 |
| --------- | ------------------------------------------------------- | ---------------------- | ---------------------------------------- |
| **Dev 1** | Database schema, authentication, middlewares, testing ✅ | `access/`, MQTT client | `attendance/`, `reports/`                |
| **Dev 2** | Students, courses, and enrollment CRUD                  | `qrcode/generate`      | Student history and academic evaluations |
| **Dev 3** | Rooms and schedules CRUD                                | `qrcode/validate`      | Class attendance management              |

### Repository Ownership

**Dev 1 is responsible for:**

* `prisma/schema.prisma` — All database schema modifications must be reviewed here.
* `src/shared/middlewares/` — Centralized middleware management.
* `main` branch — Only Dev 1 can merge into the protected branch after all tests pass successfully.

---

## 📝 Commit Convention

This project follows the **Conventional Commits** specification:

| Prefix      | Usage                                          | Example                                             |
| ----------- | ---------------------------------------------- | --------------------------------------------------- |
| `feat:`     | New feature                                    | `feat: add student CRUD module`                     |
| `fix:`      | Bug fix                                        | `fix: resolve duplicate enrollment validation`      |
| `refactor:` | Internal improvement without changing behavior | `refactor: move hashing logic to utility functions` |
| `test:`     | New or updated tests                           | `test: add unit tests for students module`          |
| `chore:`    | Maintenance tasks                              | `chore: update project dependencies`                |
| `docs:`     | Documentation updates                          | `docs: update README with new endpoints`            |

### 🌿 Branch Strategy

| Branch                 | Owner | Purpose                                             |
| ---------------------- | ----- | --------------------------------------------------- |
| `main`                 | Team  | Stable production-ready codebase (protected branch) |
| `feat/dev1-foundation` | Dev 1 | Sprint 1 — Schema, authentication, middlewares      |
| `feat/dev1-mqtt`       | Dev 1 | Sprint 2 — MQTT client and access module            |
| `feat/dev2-students`   | Dev 2 | Sprint 1 — Students module                          |
| `feat/dev2-qrcode-gen` | Dev 2 | Sprint 2 — QR Code generation                       |
| `feat/dev3-rooms`      | Dev 3 | Sprint 1 — Rooms module                             |
| `feat/dev3-qrcode-val` | Dev 3 | Sprint 2 — QR Code validation                       |

---

## ⚙️ Environment Variables

Copy the example configuration file:

```bash id="hrv8k8"
cp .env.example .env
```

Then configure the following variables:

| Variable          | Description                        | Example                                                       |
| ----------------- | ---------------------------------- | ------------------------------------------------------------- |
| `DATABASE_URL`    | PostgreSQL connection string       | `postgresql://user:password@localhost:5432/university_access` |
| `JWT_SECRET`      | Secret key used to sign JWT tokens | Any long, random, secure string                               |
| `JWT_EXPIRES_IN`  | Token expiration time              | `8h`                                                          |
| `MQTT_BROKER_URL` | MQTT broker address                | `mqtt://localhost:1883`                                       |
| `PORT`            | HTTP server port                   | `3000`                                                        |

> ⚠️ **Never commit the `.env` file to Git.** It is already included in `.gitignore` to prevent accidental exposure of sensitive credentials.
---

## 🚀 Future Improvements

If we had additional development time, we would like to implement:

* **Biometric Authentication:** Add facial recognition or fingerprint verification as a second authentication factor for enhanced campus security.

* **Offline Validation Mode:** Enable temporary offline QR Code validation on ESP32 devices during network outages, synchronizing logs once connectivity is restored.

* **Real-Time Notifications:** Notify students and administrators about successful access events, denied entries, and unusual activity.

* **Advanced Analytics Dashboard:** Provide insights into campus occupancy, peak access hours, attendance trends, and building usage statistics.

* **Visitor Management System:** Allow temporary visitor registration with time-limited QR Codes and approval workflows.

* **Multi-Campus Support:** Extend the platform to manage access across multiple campuses and buildings through a centralized administration panel.

---

## 👥 Authors & Project Team

### Mobile Development

* **Isabel Vitória** — React Native Developer
* **Lucas Eloi** — React Native Developer

### Backend Development

* **Ronald Paixão** — Backend Developer
* **Nikolas Martins** — Backend Developer
* **Vinícius Manoel** — Backend Developer

### Hardware & IoT

* **Amanda Ellen** — Hardware & Embedded Systems Developer
* **Phelipe Leandro** — Hardware & Embedded Systems Developer

### Project Management

* **Gilberto Quintino** — Project Manager

### Academic Advisor

* **Prof. Arnott Caiado**

### Tech English Course Professor

* **Prof. Leonardo Trevas**
