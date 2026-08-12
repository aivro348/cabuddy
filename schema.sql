-- ==============================================================================
-- CA Buddy Enterprise Audit System - MySQL Production Database Schema (cPanel)
-- Database: servobite_audit_db (or your cPanel database name)
-- ==============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- 1. Table structure for `users`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL DEFAULT '1234567',
  `role` ENUM('SUPER_ADMIN', 'MANAGER', 'USER') NOT NULL DEFAULT 'USER',
  `role_title` VARCHAR(100) NOT NULL DEFAULT 'Field Auditor',
  `unit` VARCHAR(255) NOT NULL DEFAULT 'Procurement [Marketing Department]',
  `managed_by` VARCHAR(64) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_manager` (`managed_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. Table structure for `attendance`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `attendance`;
CREATE TABLE `attendance` (
  `id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `user_name` VARCHAR(191) NOT NULL,
  `user_email` VARCHAR(191) NOT NULL,
  `manager_id` VARCHAR(64) NULL,
  `role_title` VARCHAR(100) NOT NULL,
  `unit` VARCHAR(255) NOT NULL,
  `login_time` VARCHAR(30) NOT NULL,
  `logout_time` VARCHAR(30) NULL,
  `date_str` VARCHAR(30) NOT NULL,
  `time_window` VARCHAR(80) NOT NULL,
  `duration` VARCHAR(50) NOT NULL DEFAULT 'Session Active',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `server_verified` TINYINT(1) NOT NULL DEFAULT 1,
  `server_utc_iso` VARCHAR(50) NULL,
  `manager_remarks` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_att_user` (`user_id`),
  INDEX `idx_att_manager` (`manager_id`),
  INDEX `idx_att_active` (`is_active`),
  INDEX `idx_att_date` (`date_str`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. Table structure for `assignments`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `assignments`;
CREATE TABLE `assignments` (
  `id` VARCHAR(64) NOT NULL,
  `assigned_to_id` VARCHAR(64) NOT NULL,
  `assigned_to_name` VARCHAR(191) NOT NULL,
  `manager_id` VARCHAR(64) NOT NULL,
  `manager_name` VARCHAR(191) NOT NULL,
  `unit` VARCHAR(255) NOT NULL,
  `task_title` VARCHAR(255) NOT NULL,
  `instructions` TEXT NULL,
  `deadline` VARCHAR(80) NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'ASSIGNED',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_asn_user` (`assigned_to_id`),
  INDEX `idx_asn_manager` (`manager_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. Table structure for `complaints`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `complaints`;
CREATE TABLE `complaints` (
  `id` VARCHAR(64) NOT NULL,
  `unit` VARCHAR(255) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `category` VARCHAR(191) NOT NULL,
  `urgency` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'MEDIUM',
  `remarks` TEXT NULL,
  `file_name` VARCHAR(255) NULL,
  `file_type` VARCHAR(100) NULL,
  `file_size` VARCHAR(50) NULL,
  `file_data` LONGTEXT NULL,
  `sample_file_url` TEXT NULL,
  `auditor_id` VARCHAR(64) NOT NULL,
  `auditor_name` VARCHAR(191) NOT NULL,
  `manager_id` VARCHAR(64) NULL,
  `manager_name` VARCHAR(191) NULL,
  `date_str` VARCHAR(30) NOT NULL,
  `time_frame` VARCHAR(100) NOT NULL,
  `server_timestamp` VARCHAR(60) NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED',
  `robot_verified` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_cmp_unit` (`unit`),
  INDEX `idx_cmp_manager` (`manager_id`),
  INDEX `idx_cmp_urgency` (`urgency`),
  INDEX `idx_cmp_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- INITIAL SEED DATA (Ready-to-use Accounts & Evidence Records)
-- ==============================================================================

-- 1. Insert Master Accounts
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `role_title`, `unit`, `managed_by`) VALUES
('usr-1', 'Executive Super Admin', 'admin@eluc', '1234567', 'SUPER_ADMIN', 'Super Administrator', 'All Enterprise Units', NULL),
('usr-2', 'Suresh N., Audit Manager', 'manager@eluc', '1234567', 'MANAGER', 'Department Audit Manager', 'Auctions', 'usr-1'),
('usr-3', 'Ravi Teja, Field Auditor', 'auditor@eluc', '1234567', 'USER', 'Field Auditor', 'Auctions', 'usr-2'),
('usr-4', 'Priya Sharma, ACA', 'priya@eluc', '1234567', 'USER', 'Junior Auditor', 'Auctions', 'usr-2'),
('usr-5', 'Ananya Rao, Field Staff', 'ananya@eluc', '1234567', 'USER', 'Compliance Officer', 'Kalyanakatta', 'usr-1'),
('usr-6', 'Vikram Mehta, Auditor', 'vikram@eluc', '1234567', 'USER', 'Field Auditor', 'Warehousing [Marketing Department]', 'usr-1')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 2. Insert Attendance Logs
INSERT INTO `attendance` (`id`, `user_id`, `user_name`, `user_email`, `manager_id`, `role_title`, `unit`, `login_time`, `logout_time`, `date_str`, `time_window`, `duration`, `is_active`, `server_verified`, `manager_remarks`) VALUES
('log-1', 'usr-3', 'Ravi Teja, Field Auditor', 'auditor@eluc', 'usr-2', 'Field Auditor', 'Auctions', '09:02:14 AM', NULL, '12-Aug-2026', '09:02 AM - Active', '4h 45m', 1, 1, 'Verified on-site token inventory.'),
('log-2', 'usr-4', 'Priya Sharma, ACA', 'priya@eluc', 'usr-2', 'Junior Auditor', 'Auctions', '08:45:00 AM', '04:30:00 PM', '12-Aug-2026', '08:45 AM - 04:30 PM', '7h 45m', 0, 1, 'Audit physical tokens matched voucher book.'),
('log-3', 'usr-5', 'Ananya Rao, Field Staff', 'ananya@eluc', 'usr-1', 'Compliance Officer', 'Kalyanakatta', '09:15:30 AM', NULL, '12-Aug-2026', '09:15 AM - Active', '4h 32m', 1, 1, 'Routine queue compliance verified.'),
('log-4', 'usr-6', 'Vikram Mehta, Auditor', 'vikram@eluc', 'usr-1', 'Field Auditor', 'Warehousing [Marketing Department]', '08:30:00 AM', '05:00:00 PM', '12-Aug-2026', '08:30 AM - 05:00 PM', '8h 30m', 0, 1, 'Completed stock ledger reconciliation.'),
('log-5', 'usr-2', 'Suresh N., Audit Manager', 'manager@eluc', 'usr-1', 'Department Audit Manager', 'Auctions', '08:50:00 AM', NULL, '12-Aug-2026', '08:50 AM - Active', '4h 55m', 1, 1, 'Manager shift active.')
ON DUPLICATE KEY UPDATE `user_name`=VALUES(`user_name`);

-- 3. Insert Work Assignments
INSERT INTO `assignments` (`id`, `assigned_to_id`, `assigned_to_name`, `manager_id`, `manager_name`, `unit`, `task_title`, `instructions`, `deadline`, `status`) VALUES
('asn-1', 'usr-3', 'Ravi Teja, Field Auditor', 'usr-2', 'Suresh N., Audit Manager', 'Auctions', 'Concurrent Physical Bid Token Audit', 'Cross-check day-end auction sheet against cash counter collection ledger and upload token report PDF.', 'Today, 05:00 PM', 'IN_PROGRESS'),
('asn-2', 'usr-4', 'Priya Sharma, ACA', 'usr-2', 'Suresh N., Audit Manager', 'Auctions', 'Voucher Book & E-Token Verification', 'Upload scanned voucher summary PDF or photo with day collection total.', 'Today, 04:30 PM', 'COMPLETED')
ON DUPLICATE KEY UPDATE `task_title`=VALUES(`task_title`);

-- 4. Insert Complaints & Evidence Files
INSERT INTO `complaints` (`id`, `unit`, `title`, `category`, `urgency`, `remarks`, `file_name`, `file_type`, `file_size`, `sample_file_url`, `auditor_id`, `auditor_name`, `manager_id`, `manager_name`, `date_str`, `time_frame`, `server_timestamp`, `status`, `robot_verified`) VALUES
('CMP-2026-0812-001', 'Auctions', 'Cash Collection & Token Reconciliation', 'Cash Collection & Token Reconciliation', 'HIGH', 'Scanned voucher sheets show 3 extra tokens unrecorded in the electronic terminal.', 'token_discrepancy_evidence.pdf', 'application/pdf', '412 KB', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'usr-3', 'Ravi Teja, Field Auditor', 'usr-2', 'Suresh N., Audit Manager', '12-Aug-2026', '09:02:00 AM - 10:15:00 AM (UTC+5:30)', '10:15:00 AM • 12-Aug-2026', 'UNDER_REVIEW', 1),
('CMP-2026-0812-002', 'Procurement [Marketing Department]', 'Tender Compliance & Vendor Billing Irregularity', 'Tender Compliance & Vendor Billing Irregularity', 'CRITICAL', 'Photographic evidence attached showing broken paper seal on bidder envelope #12.', 'seal_breach_photo.png', 'image/png', '1.2 MB', 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&auto=format&fit=crop&q=80', 'usr-7', 'Kiran Reddy, Lead Auditor', 'usr-1', 'Executive Admin', '12-Aug-2026', '09:30:00 AM - 11:45:00 AM (UTC+5:30)', '11:45:00 AM • 12-Aug-2026', 'ESCALATED', 1),
('CMP-2026-0812-003', 'Annaprasadam Trust and Canteens TML & TPT', 'Others (Manual Specification)', 'Others (Manual Specification)', 'HIGH', 'Digital thermograph report attached verifying +8°C temperature lag over 3 hours.', 'temperature_log_sheet.pdf', 'application/pdf', '298 KB', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'usr-9', 'Manoj Varma, Inspector', 'usr-1', 'Canteen Directorate', '12-Aug-2026', '07:30:00 AM - 09:45:00 AM (UTC+5:30)', '09:45:00 AM • 12-Aug-2026', 'RESOLVED', 1)
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);

SET FOREIGN_KEY_CHECKS = 1;
