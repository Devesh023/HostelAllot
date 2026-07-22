# AutoAllot API Reference Guide

This document lists the REST API routes exposed by the Express backend.

## Base URL
`http://localhost:5000/api`

---

## 🔐 Authentication
- `POST /auth/signup` - Register a new administrative or student account.
- `POST /auth/login` - Sign in using email and password.
- `POST /auth/logout` - Sign out the active session.
- `GET /auth/me` - Query active admin/student profile metadata.
- `PUT /auth/change-password` - Update account password.
- `POST /auth/forgot-password` - Reset account password.

---

## 🧑‍🎓 Student Records
- `GET /students` - Query paginated students list (with branch, category, gender filters).
- `POST /students` - Add student record.
- `GET /students/:id` - Fetch student details.
- `PUT /students/:id` - Edit student details.
- `DELETE /students/:id` - Remove student record.
- `DELETE /students/bulk-delete` - Delete multiple students.
- `GET /students/export/excel` - Export spreadsheet of students.
- `POST /students/import/excel` - Import spreadsheet of students.

---

## 🏢 Hostels & Rooms
- `GET /hostels` - List all hostels with capacity tallies.
- `POST /hostels` - Add hostel building.
- `PUT /hostels/:id` - Edit hostel building.
- `DELETE /hostels/:id` - Remove hostel building.

---

## 🏆 Merit & Allotment
- `GET /merit` - Fetch ranks list.
- `GET /merit/allotments` - Fetch active allotments.
- `POST /merit/generate-merit` - Execute the allotment algorithm.
