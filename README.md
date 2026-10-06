# 🎟️ EventHub: Smart College Event & Fest Management System

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-purple.svg)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-4.18-lightgrey.svg)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)

> **Academic Mini-Project Submission (TYCS-B)**  
> **Department of Computer Science & Information Technology**  
> - **Student Author:** Harsh Yadav (Roll No: 129, Class: TYCS-B)  
> - **Project Guide:** Faculty Coordinator  
> - **Academic Year:** 2025–2026  

---

## 📌 Project Overview
Managing inter-college fests, workshops, hackathons, and cultural nights traditionally involves chaotic paper ticketing, fragmented Google Forms, slow gate check-ins, and manual certificate distribution.

**EventHub** is a production-grade, full-stack college event and fest management system designed to streamline the entire event lifecycle:
1. **Student Event Discovery & Repeatable E-Pass Issuance:** Instant seat booking authenticated with college email & password, supporting repeated registrations (`EH-2026-XXXXXX-PX`).
2. **Tamper-Proof QR E-Tickets:** Cryptographically salted verification hashes (`SHA-256`) embedded in scannable digital passes with PNG and `.ics` calendar download.
3. **Live Gate Webcam Scanning (`html5-qrcode`):** Real-time duplicate entry prevention at college entrance gates with sound chime audio feedback.
4. **Dedicated Admin Portal & Registration Records Ledger:** Full search, filtering, pass inspection modal, manual check-in status override, pass revocation, and master CSV sheet exports.
5. **Automated Official Certificate Generation & Public Verification:** Instant downloadable signed PDF certificates and a public credential verification ledger.
6. **Aesthetic Light UI Architecture:** Serene mint, emerald, and lime pastel design system featuring floating cards, dot-matrix patterns, and fluid gradient curves.

---

## 🚀 Key Modules & Functional Architecture

### 1. Multi-Role Authentication & 1-Click Persona Switch
- **Role-Based Access Control (RBAC):** Distinct interfaces and capabilities for `student`, `organizer`, and `admin`.
- **JWT Middleware Security:** Bearer token verification protecting critical endpoints.
- **Top Quick-Switch Bar:** 1-Click demo buttons to immediately switch between Student (Harsh Yadav), Organizer (Tech Club Lead), and Admin (Faculty Coordinator) without typing credentials during viva evaluations.

### 2. Email & Password Authenticated Pass Generation
- Pass generation requires students to input their college email and password, validating account ownership before issuing a pass.
- **Repeat Registration Support:** Students can register multiple times for the same event (e.g. for team passes or multiple tickets), automatically numbering each pass (`Pass #1`, `Pass #2`, etc.) with a unique ticket ID and HMAC-SHA256 hash.

### 3. Dedicated Admin Portal & Registration Records Ledger
- Accessible via the **Admin Login** or top persona switcher.
- **Comprehensive Ledger:** Displays all student registrations across all events with ticket ID, student name, class (`TYCS-B`), roll number (`129`), department, fee paid, registration date, and gate admittance status.
- **Search & Filters:** Search by student name, roll number, or ticket ID; filter by event, academic department, and gate check-in status.
- **Interactive Pass Inspector:** Preview any attendee's QR code, verification hash, and credentials in an inspection modal.
- **Manual Gate Override:** 1-click status toggle to mark students as checked-in or revert status.
- **CSV Data Export:** One-click download of the complete fest registration master spreadsheet (`.CSV`).

### 4. QR-Code Ticketing & Live Gate Scanner
- High-resolution QR code generation embedding student credentials and cryptographic signature.
- Scanned with `html5-qrcode` using device webcam or laptop camera.
- **Duplicate Entry Guard:**
  - *First Scan:* 🟢 **"Entry Verified: Welcome [Student Name]!"** (marks `checkInStatus: true`, saves timestamp).
  - *Subsequent Scans:* 🔴 **"Duplicate Entry Warning! Already scanned at [Time]"**.
- Manual code entry fallback for testing on systems without a webcam.

### 5. Event Discovery & Organizer Control
- Filter events by **Category** (*Technical, Cultural, Sports, Workshop, Gaming*), **Status** (*Upcoming, Ongoing, Completed*), and **Fee** (*Free vs Paid*).
- Live capacity progress bars preventing over-booking.
- Organizers can create, edit, delete, broadcast urgent fest notices, or mark events as "Completed" to unlock attendee certificates.

### 6. Official Signed Certificate Generator & Public Verifier
- When an event is marked **Completed**, attendees with verified gate check-in can download an official styled landscape A4 PDF via `jsPDF` with golden borders, college seal, and Faculty Coordinator signature.
- **Public Verification Modal:** Anyone (recruiters, examiners) can enter a Ticket ID to audit its cryptographic authenticity against the database ledger.

---

## 🔑 Pre-Seeded Demonstration Credentials

| Role | Name | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Student** | Harsh Yadav | `harsh@college.edu` | `student123` | Roll No: 129, TYCS-B (Event discovery, passes, certificates) |
| **Organizer** | CS Tech Club Lead | `techclub@college.edu` | `club123` | Host events, manage live attendee rosters, notices |
| **Admin** | Faculty Coordinator | `admin@college.edu` | `admin123` | Registration ledger, pass audit, manual check-in, CSV export |

---

## 🛠️ Technology Stack

- **Frontend:** React 18, Vite, Lucide-React Icons, Custom Vanilla CSS (Modern Mint Light Theme).
- **Backend:** Node.js, Express.js RESTful API architecture.
- **Database:** Fail-Safe Embedded JSON/Memory DB (Guaranteed **Zero Crashes** during evaluation even without an external MongoDB service).
- **QR Engine:** `qrcode` (e-ticket generation), `html5-qrcode` (webcam gate scanning).
- **Document Export:** `jspdf` (client-side high-resolution PDF rendering), Canvas (PNG ticket pass).

---

## 📂 Project Directory Structure

```text
EventHub/
├── .gitignore                 # Excludes node_modules, logs, dist, and environment files
├── README.md                  # Comprehensive project documentation
├── package.json               # Root orchestrator script
├── run.bat                    # One-click Windows starter script
├── server/
│   ├── package.json           # Backend dependencies
│   ├── server.js              # Express server & API routes
│   ├── seed.js                # Demo data generator
│   ├── db/
│   │   └── memoryDb.js        # Fail-safe database store
│   ├── middleware/
│   │   └── auth.js            # JWT role verification middleware
│   ├── models/
│   │   ├── User.js            # User accounts & roles
│   │   ├── Event.js           # Fest events schema
│   │   ├── Registration.js    # Tickets & QR hashes
│   │   └── Announcement.js    # College notices
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── eventController.js
│   │   ├── ticketController.js
│   │   └── analyticsController.js
│   └── routes/
│       ├── authRoutes.js
│       ├── eventRoutes.js
│       ├── ticketRoutes.js
│       └── analyticsRoutes.js
└── client/
    ├── package.json           # Frontend dependencies
    ├── vite.config.js         # Vite configuration
    ├── index.html             # HTML entry point
    └── src/
        ├── index.css          # Design system (Mint light theme, dot-matrix, badges)
        ├── App.jsx            # App shell, router, layout & modal orchestrator
        ├── components/
        │   ├── Navbar.jsx               # Navigation bar with active indicator
        │   ├── QuickLoginBar.jsx        # 1-Click viva persona switch bar
        │   ├── TicketCard.jsx           # Perforated pass with QR & actions
        │   ├── RegisterPassModal.jsx    # Email & password pass generator
        │   ├── QRScannerModal.jsx       # Webcam gate scanner & duplicate guard
        │   ├── EventDetailModal.jsx     # Event agenda, perks & .ics export
        │   ├── CertificateModal.jsx     # PDF certificate preview & export
        │   ├── VerifyCertificateModal.jsx # Public credential audit modal
        │   ├── VivaTourModal.jsx        # Interactive project walkthrough
        │   ├── StatsCard.jsx            # KPI metric cards
        │   └── AnnouncementBanner.jsx   # Live fest notices feed
        └── pages/
            ├── StudentDashboard.jsx     # Hero banner, event grid, passes ledger
            ├── AdminDashboard.jsx       # Master registration ledger & analytics
            ├── OrganizerDashboard.jsx   # Event host & attendee roster
            └── Login.jsx                # Clean authentication card & demo logins
```

---

## ⚡ Quick Start & Setup Instructions

### Prerequisites
- [Node.js (v18 or higher)](https://nodejs.org/)
- npm (bundled with Node.js)
- A modern web browser (Chrome, Edge, Firefox, or Safari)

### Option 1: One-Click Launch (Windows)
Double-click `run.bat` in the project root directory. It will automatically install dependencies and launch both servers.

### Option 2: Command Line Setup
1. **Clone the repository:**
   ```bash
   git clone https://github.com/Harshyadav5970/EventHub-Smart-College-Event-Fest-Management-System.git
   cd EventHub-Smart-College-Event-Fest-Management-System
   ```

2. **Install root dependencies:**
   ```bash
   npm install
   ```

3. **Install server dependencies:**
   ```bash
   cd server
   npm install
   cd ..
   ```

4. **Install client dependencies:**
   ```bash
   cd client
   npm install
   cd ..
   ```

5. **Start both backend & frontend concurrently:**
   ```bash
   npm run dev:all
   ```

6. Open your browser and navigate to:
   - **Frontend App:** [http://localhost:5173](http://localhost:5173)
   - **Backend API:** [http://localhost:5000](http://localhost:5000)

---

## 📤 How to Push Changes to GitHub

To upload or update your code on GitHub:

```bash
# 1. Check changed files
git status

# 2. Stage all systematic files
git add .

# 3. Commit with a meaningful message
git commit -m "feat: complete modern mint light UI, admin records ledger, and pass generator"

# 4. Push to your GitHub main branch
git push origin main
```

---

## 👨‍💻 Project Authorship & Credits
- **Student Author:** Harsh Yadav (Roll No: 129, TYCS-B)
- **Department:** Computer Science & Information Technology
- **Project Guide:** Faculty Coordinator
