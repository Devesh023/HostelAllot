# AutoAllot
### Smart Hostel Merit & Automatic Hostel Allotment System

AutoAllot is a full stack web application designed for university administration staff. It streamlines the entry of student records, configuration of seats (branch-wise, category-wise, and hostel-wise), and runs an automated merit allocation algorithm.

Designed specifically for **Vercel Serverless Function** deployment with a **Supabase PostgreSQL** backend database, the system runs completely in-memory, requiring zero persistent disk state.

---

## 📁 Folder Structure Documentation

```
AutoAllot/
├── api/                       # Vercel Serverless Backend API
│   ├── config/                # Configuration (Supabase client init)
│   ├── controllers/           # MVC Controllers (auth, students, merit, etc.)
│   ├── middleware/            # JWT validation, central error handling, logging
│   ├── routes/                # Express routing endpoints
│   ├── index.js               # Express serverless entrypoint wrapper
│   └── local.js               # Local development entrypoint (port 5000)
├── public/                    # Static assets for React Vite frontend
├── src/                       # React 19 Frontend Client
│   ├── components/            # UI components (Sidebar, Navbar)
│   ├── context/               # Global states (AuthContext, ThemeContext)
│   ├── layout/                # Page layouts (AdminLayout)
│   ├── pages/                 # Views (Dashboard, Students, Ranks, Settings)
│   ├── services/              # API communications client (Axios client wrapper)
│   ├── styles/                # CSS configurations & Tailwind imports
│   ├── App.jsx                # Router & Provider mapping
│   └── main.jsx               # React DOM bootstrap
├── package.json               # joint dependencies for Node backend + React frontend
├── postcss.config.cjs         # PostCSS config
├── tailwind.config.js         # Tailwind configuration
├── vercel.json                # Vercel routing configuration
├── vite.config.js             # Vite compiler config
├── schema.sql                 # Supabase PostgreSQL DDL DML Schema Setup
└── .env                       # Local environment variables
```

---

## 🛢️ Database Documentation

The system uses a Supabase PostgreSQL database. The schemas are configured inside [schema.sql](file:///c:/Users/deves/OneDrive/Desktop/HostelAllot/schema.sql).

### Table Schema Summary

1. **admins**: Stores administrative staff credentials.
   - `id` (UUID, Primary Key)
   - `username`, `email` (Unique strings)
   - `password` (Hashed via Bcrypt)
   - `role` (superadmin/admin)
2. **branches**: Academic departments.
   - `id` (UUID, Primary Key)
   - `branch_name`, `branch_code` (Unique code, e.g. CO, IT)
3. **categories**: Reservation categories.
   - `id` (UUID, Primary Key)
   - `category_name` (Unique category)
   - `reservation_percentage` (Decimal, e.g., 15.00)
4. **hostels**: Residential buildings.
   - `id` (UUID, Primary Key)
   - `hostel_name`, `gender` (Male/Female/Co-Ed), `capacity`, `occupied`, `status`
5. **students**: Enrolled candidate profiles.
   - `id` (UUID, Primary Key)
   - `student_name`, `branch`, `category`, `percentage` (Merit sort metric), `year` (First Year/Second Year/Third Year), `gender` (Male/Female), `disability` (Boolean), `income` (Decimal), `mobile` (String), `nashik_municipal_corporation` (Boolean)
6. **seat_configuration**: Quota seat counts.
   - `branch_id`, `category_id`, `hostel_id`, `seat_count` (Unique combination)
7. **allotments**: Active seat mappings.
   - `student_id`, `hostel_id`, `seat_number`, `status` (Active/Archived)
8. **waiting_list**: Overflow waitlisted records.
   - `student_id`, `reason`

---

## 🌐 API Documentation

### Authentication Routes (`/api/auth`)
- `POST /login` - Admin login. Returns JWT token and admin details.
- `POST /logout` - Logs out active session. (Protected)
- `GET /me` - Validates JWT cookie/header and returns admin details. (Protected)
- `PUT /change-password` - Changes password. (Protected)
- `POST /forgot-password` - Administrative reset using secret key `AUTOALLOT_RESET_2026`.

### Student Routes (`/api/students`)
- `GET /` - Retrieves paginated students with filter params. (Protected)
- `POST /` - Creates student record. (Protected)
- `PUT /:id` - Updates student record. (Protected)
- `DELETE /:id` - Deletes student record. (Protected)
- `DELETE /bulk-delete` - Triggers bulk deletion of array of IDs. (Protected)
- `GET /export/excel` - Downloads student roster as Excel sheet. (Protected)
- `POST /import/excel` - Accepts file upload, parses spreadsheet in-memory. (Protected)

### Merit & Allotment Routes (`/api/merit`)
- `GET /` - Fetches rank list. (Protected)
- `GET /allotments` - Fetches active hostel allotments. (Protected)
- `POST /generate-merit` - Runs the allotment algorithm. (Protected)

### Reports Routes (`/api/reports`)
- `GET /pdf` - Generates custom PDF report (merit/allotment/waiting/occupancy/branch/category). (Protected)
- `GET /excel` - Generates custom Excel report. (Protected)

### Settings Routes (`/api/settings`)
- `GET /` - Fetches college profiles. (Protected)
- `PUT /` - Updates college profiles. (Protected)
- `GET /backup` - Exports entire DB as a downloadable JSON backup. (Protected)
- `POST /restore` - Accepts JSON upload, recreates DB tables in dependency order. (Protected)

---

## 🛠️ Installation & Local Development Guide

### Prerequisites
- Node.js installed (v18 or higher recommended).
- A Supabase account and database project.

### 1. Database Setup
1. Log in to your **Supabase Console** and select your project.
2. Open the **SQL Editor** tab.
3. Paste the contents of [schema.sql](file:///c:/Users/deves/OneDrive/Desktop/HostelAllot/schema.sql) and click **Run**. This constructs tables and seeds a default administrator:
   - **Email**: `admin@autoallot.com`
   - **Password**: `admin123`

### 2. Configure Environment Variables
Create a file named `.env` in the root directory:
```env
# Get from Supabase Console -> Project Settings -> API
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-supabase-service-role-key-bypass-rls

# Secret key for JWT signing
JWT_SECRET=autoallot_secure_jwt_token_secret_9988776655
JWT_EXPIRES_IN=24h

PORT=5000
```

### 3. Local Installation & Run
Install dependencies in the project root:
```bash
npm install
```

Start the local backend API server:
```bash
# This starts the Express server on http://localhost:5000
node api/local.js
```

In a new terminal window, start the React Vite frontend dev client:
```bash
# This starts the Vite compiler on http://localhost:3000
npm run dev
```
Open your browser and navigate to `http://localhost:3000` to log in using the seeded admin credentials.

---

## 🚀 Vercel Production Deployment

AutoAllot is structured to deploy directly on Vercel as a single application containing both React static hosting and Serverless Node.js functions.

### 1. Push code to GitHub
Initialize your Git repository, commit the files, and push them to a private or public GitHub repository.

### 2. Import project to Vercel
1. Log in to **Vercel Dashboard** and click **Add New** -> **Project**.
2. Select your imported GitHub repository.
3. Under **Configure Project**:
   - Vercel automatically detects the Vite config and configures the build settings correctly.
4. Add the following **Environment Variables**:
   - `SUPABASE_URL`: Your Supabase API project URL.
   - `SUPABASE_KEY`: Your Supabase Service Role Secret Key.
   - `JWT_SECRET`: A secure signing string.
   - `JWT_EXPIRES_IN`: e.g. `24h`.
5. Click **Deploy**. Vercel will build the React bundle to static files, spin up Serverless Functions for all `/api` endpoints, and serve the application live under a generated subdomain.
