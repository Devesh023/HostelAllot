-- AutoAllot Database Schema (Refactored Student Quotas Management)

-- 1. Users Table (Binds Supabase Auth UUID to platform accounts)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'admin' CHECK (role IN ('admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Branches Table
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_name VARCHAR(255) NOT NULL,
    branch_code VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed default branches
INSERT INTO branches (branch_name, branch_code) VALUES 
('Computer Engineering', 'CO'),
('Information Technology', 'IT'),
('Electronics & Telecommunication', 'ENTC'),
('Mechanical Engineering', 'MECH')
ON CONFLICT (branch_code) DO NOTHING;

-- 4. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_name VARCHAR(100) UNIQUE NOT NULL,
    reservation_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed default categories
INSERT INTO categories (category_name, reservation_percentage) VALUES 
('OPEN', 50.00),
('OBC', 19.00),
('SC', 13.00),
('ST', 8.00),
('EWS', 10.00)
ON CONFLICT (category_name) DO NOTHING;

-- 5. Refactored Students Table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    branch VARCHAR(100) NOT NULL,
    percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    year VARCHAR(50) NOT NULL CHECK (year IN ('First Year', 'Second Year', 'Third Year')),
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('Male', 'Female')),
    disability BOOLEAN NOT NULL DEFAULT FALSE,
    income NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    mobile VARCHAR(10) NOT NULL,
    nashik_municipal_corporation BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Hostels Table
CREATE TABLE IF NOT EXISTS hostels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hostel_name VARCHAR(255) UNIQUE NOT NULL,
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('Male', 'Female', 'Co-Ed')),
    building VARCHAR(255) NOT NULL,
    floors INT NOT NULL DEFAULT 1,
    capacity INT NOT NULL DEFAULT 0,
    occupied INT NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed default hostels
INSERT INTO hostels (hostel_name, gender, building, floors, capacity, occupied, status) VALUES 
('Aryabhata Boys Hostel', 'Male', 'Building A', 4, 120, 0, 'Active'),
('Kalpana Chawla Girls Hostel', 'Female', 'Building B', 4, 100, 0, 'Active')
ON CONFLICT (hostel_name) DO NOTHING;

-- 7. Rooms Table
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hostel_id UUID NOT NULL REFERENCES hostels(id) ON DELETE CASCADE,
    room_number VARCHAR(50) NOT NULL,
    floor INT NOT NULL DEFAULT 1,
    capacity INT NOT NULL DEFAULT 0,
    occupied INT NOT NULL DEFAULT 0,
    available INT GENERATED ALWAYS AS (capacity - occupied) STORED,
    status VARCHAR(50) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Maintenance')),
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('Male', 'Female')),
    room_type VARCHAR(30) NOT NULL DEFAULT 'Normal' CHECK (room_type IN ('Normal', 'Accessible')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(hostel_id, room_number)
);

-- 8. Seat Configuration Table
CREATE TABLE IF NOT EXISTS seat_configuration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    hostel_id UUID NOT NULL REFERENCES hostels(id) ON DELETE CASCADE,
    seat_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(branch_id, category_id, hostel_id)
);

-- 9. Merit List Table
CREATE TABLE IF NOT EXISTS merit_list (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    rank INT NOT NULL,
    marks NUMERIC(5, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Eligible' CHECK (status IN ('Eligible', 'Allotted', 'Waiting')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Allotments Table
CREATE TABLE IF NOT EXISTS allotments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    hostel_id UUID NOT NULL REFERENCES hostels(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    seat_number VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Archived', 'Cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES admins(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. Settings Table
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    college_name VARCHAR(255) NOT NULL,
    academic_year VARCHAR(50) NOT NULL,
    reservation_rules JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed default settings
INSERT INTO settings (college_name, academic_year, reservation_rules) VALUES 
('AutoAllot Engineering College', '2026-27', '{"rules": "Standard state reservation rules apply."}'::jsonb)
ON CONFLICT DO NOTHING;
