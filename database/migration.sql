-- SQL migration script to update students table schema (Revert to simple VARCHAR branch and year)

-- 1. Drop branch_id foreign key and column
ALTER TABLE students DROP COLUMN IF EXISTS branch_id CASCADE;

-- 2. Add branch column as simple VARCHAR
ALTER TABLE students ADD COLUMN IF NOT EXISTS branch VARCHAR(100) NOT NULL DEFAULT 'CO';
ALTER TABLE students ALTER COLUMN branch DROP DEFAULT;

-- 3. Rename year_of_study to year
ALTER TABLE students RENAME COLUMN year_of_study TO year;

-- 4. Ensure constraints are correct on year
ALTER TABLE students ALTER COLUMN year TYPE VARCHAR(50);
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_year_of_study_check;
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_year_check;
ALTER TABLE students ADD CONSTRAINT students_year_check CHECK (year IN ('First Year', 'Second Year', 'Third Year'));

-- 5. Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';

-- 6. SQL migration script for Rooms Management
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

-- Ensure allotments table points to rooms table
ALTER TABLE allotments DROP COLUMN IF EXISTS room_id CASCADE;
ALTER TABLE allotments ADD COLUMN room_id UUID REFERENCES rooms(id) ON DELETE SET NULL;

NOTIFY pgrst, 'reload schema';
