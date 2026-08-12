-- CA Buddy MySQL Database Schema
-- Execute these queries inside your cPanel phpMyAdmin / MySQL Database page

USE `cabuddy-353131378c7f`;

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    roleTitle VARCHAR(100),
    studentRegNo VARCHAR(100),
    phone VARCHAR(50),
    unit VARCHAR(255),
    subUnit VARCHAR(255),
    joinedDate VARCHAR(50),
    managedBy VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Attendance Tracker table
CREATE TABLE IF NOT EXISTS attendance (
    id VARCHAR(50) PRIMARY KEY,
    userId VARCHAR(50) NOT NULL,
    userName VARCHAR(255) NOT NULL,
    userEmail VARCHAR(255) NOT NULL,
    managerId VARCHAR(50),
    roleTitle VARCHAR(100),
    unit VARCHAR(255),
    loginTime VARCHAR(50),
    logoutTime VARCHAR(50),
    date VARCHAR(50),
    timeWindow VARCHAR(100),
    duration VARCHAR(50),
    active BOOLEAN DEFAULT TRUE,
    serverVerified BOOLEAN DEFAULT TRUE,
    serverUtcIso VARCHAR(100),
    serverLogoutIso VARCHAR(100),
    managerRemarks TEXT,
    loginLocation TEXT, -- JSON Stringified
    logoutLocation TEXT -- JSON Stringified
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Daily Duty Reports table
CREATE TABLE IF NOT EXISTS daily_reports (
    id VARCHAR(50) PRIMARY KEY,
    fullName VARCHAR(255) NOT NULL,
    studentRegNo VARCHAR(100) NOT NULL,
    unitDetails VARCHAR(255),
    studentPhone VARCHAR(50),
    dutyAssignedDate VARCHAR(50),
    dutyTimePeriod VARCHAR(50),
    reportVerificationTime VARCHAR(50),
    auditWorkType VARCHAR(255),
    workObjective TEXT,
    vouchersVerified VARCHAR(50),
    caRemarks TEXT,
    status VARCHAR(100),
    createdAt VARCHAR(100),
    studentEmail VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(50),
    category VARCHAR(100),
    project VARCHAR(255),
    assignedTo VARCHAR(255),
    dueDate VARCHAR(50),
    status VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Minutes of Meetings (MOM) table
CREATE TABLE IF NOT EXISTS moms (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    date VARCHAR(50),
    time VARCHAR(50),
    organizer VARCHAR(255),
    location VARCHAR(255),
    attendees TEXT,
    agenda TEXT,
    discussions TEXT,
    actionItems TEXT,
    nextMeeting TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert Seed Fallback Admin Users
INSERT IGNORE INTO users (id, name, email, password, role, roleTitle, studentRegNo, phone, unit, subUnit, joinedDate, managedBy)
VALUES 
('usr-1', 'Executive Super Admin', 'admin@eluc', 'admin', 'SUPER_ADMIN', 'Super Administrator', 'FCA108920', '+91 98480 12345', 'All Enterprise Units', 'Central Audit Apex Office', '01-Jan-2024', NULL),
('usr-2', 'Suresh N., Audit Manager', 'manager@eluc', '1234567', 'MANAGER', 'Department Audit Manager', 'ACA219842', '+91 94401 54321', 'Auctions', 'Auctions Admin Wing & Counter #1', '15-Mar-2024', 'usr-1'),
('usr-3', 'Ravi Teja, Field Auditor', 'auditor@eluc', '1234567', 'USER', 'Field Auditor', 'SRO0682194', '+91 91234 56780', 'Procurement [Marketing Department]', 'Marketing Procurement Cell & Tenders Desk', '10-Aug-2025', 'usr-2');
