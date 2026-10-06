# 📋 EventHub: Implementation Plan & System Architecture

**Academic Mini-Project Submission (TYCS-B)**  
**Department of Computer Science & Information Technology**  
- **Author:** Harsh Yadav (Roll No: 129, Class: TYCS-B)  
- **Project Guide:** Faculty Coordinator  
- **Academic Year:** 2025–2026  

---

## 1. System Architecture

```text
+-------------------------------------------------------------+
|                      CLIENT LAYER                           |
|  - Modern Mint/Emerald/Lime Light UI (Minimalist & Clean)   |
|  - Hero Fest Showcase with Circular Action & Dot Matrix     |
|  - Multi-Role Portal (Student / Organizer / Admin)         |
|  - HTML5 QR Webcam Scanner (html5-qrcode) + Audio Chimes   |
|  - jsPDF Digital Certificate Engine                         |
+------------------------------+------------------------------+
                               | REST API (JSON / JWT)
+------------------------------v------------------------------+
|                      SERVER LAYER                           |
|  - Node.js & Express.js RESTful API                         |
|  - JWT Bearer Authentication & Role-Based Middleware        |
|  - HMAC-SHA256 Cryptographic Ticket Verification Hash       |
|  - Gate Admittance & Real-Time Duplicate Prevention Engine   |
|  - CSV Roster Export Stream Generator                       |
+------------------------------+------------------------------+
                               |
+------------------------------v------------------------------+
|                     DATABASE LAYER                          |
|  - Embedded JSON Memory Database (Zero External Crashes)    |
|  - Collections: Users, Events, Registrations, Announcements |
+-------------------------------------------------------------+
```

---

## 2. Core Functional Modules

### Module 1: Multi-Role Authentication & 1-Click Persona Switch
- Secure user registration and login with bcrypt password encryption.
- Distinct permissions for:
  - **Student:** Event discovery, credential-validated pass generation, ticket passes ledger, participation certificates.
  - **Organizer:** Event publishing, attendee roster management, notice broadcasting.
  - **Admin:** Master registration records ledger, pass audit & inspection, manual check-in status toggle, CSV export, analytics.
- 1-Click top switcher for instant viva demonstration.

### Module 2: Email & Password Authenticated Pass Generation
- Requires student email and password verification before generating official passes.
- **Repeat Pass Generation:** Supports registering multiple times for an event (e.g. for multiple passes or teammates), assigning unique ticket IDs (`EH-2026-XXXXXX-P1`, `EH-2026-XXXXXX-P2`) and independent cryptographic hashes.

### Module 3: Live Gate QR Scanner & Duplicate Prevention
- Uses device camera via `html5-qrcode`.
- First scan: Validates pass, checks event capacity, marks `checkInStatus: true`, records timestamp, and plays harmonic success chime.
- Repeated scan: Returns 409 Conflict with duplicate alert buzzer and exact previous check-in timestamp.
- Manual ticket ID search fallback for camera-less viva PCs.

### Module 4: Admin Registration Records Ledger
- Live audit table of all student registrations across all events.
- Search by student name, roll number, or ticket ID.
- Dynamic filtering by Event, Academic Department, and Gate Check-In Status.
- Pass Inspection Modal with full QR preview, verification hash, and 1-click status override.
- Master CSV export.

### Module 5: Public Credential Verification & Certificate Issuance
- When events conclude (marked "Completed"), checked-in students unlock high-resolution signed PDF certificates.
- Public verifier audits any pass against the database cryptographic ledger.

---

## 3. Database Schema

- **Users:** `_id`, `name`, `email`, `password` (hashed), `role`, `department`, `rollNo`, `studentClass`, `createdAt`
- **Events:** `_id`, `title`, `description`, `category`, `date`, `time`, `venue`, `registrationFee`, `capacity`, `registeredCount`, `bannerUrl`, `status`
- **Registrations:** `_id`, `ticketId`, `studentId`, `studentName`, `rollNo`, `studentClass`, `department`, `eventId`, `eventTitle`, `eventCategory`, `eventDate`, `eventVenue`, `feePaid`, `registeredAt`, `checkInStatus`, `checkInTime`, `verificationHash`, `qrCodeDataUrl`
- **Announcements:** `_id`, `title`, `message`, `type`, `eventId`, `eventTitle`, `createdAt`

---

## 4. Academic Authorship
- **Student:** Harsh Yadav (Roll No: 129, TYCS-B)
- **Project Guide:** Faculty Coordinator
