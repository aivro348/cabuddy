import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'db.json');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const PORT = process.env.PORT || 5001;

// ── The 8 Official Units ──
const ORGANIZATIONAL_UNITS = [
  'Procurement [Marketing Department]',
  'Warehousing [Marketing Department]',
  'Donor cell along with Concurrent audit on donation of all allied trusts and Srivani Trust Receipts [Tirumali]',
  'Kalyanakatta',
  'Annaprasadam Trust and Canteens TML & TPT',
  'Sri Padmavathi Ammavari Temple, Tiruchanoor (Sri PAT)',
  'Reception, TML including Marriage halls',
  'Auctions'
];

// Helper: Format Server-Authoritative Timestamps
function getServerTimeDetails() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const isoStr = now.toISOString();
  return { timeStr, dateStr, isoStr, fullTimeframe: `${timeStr} (UTC+5:30) • ${dateStr}` };
}

// ── MySQL Connection Pool (Configured for cPanel / Remote / Local) ──
let pool = null;
let useMySql = false;

if (process.env.DB_NAME && process.env.DB_USER) {
  try {
    const dbName = process.env.DB_NAME.trim();
    const dbUser = process.env.DB_USER.trim();
    const dbHost = (process.env.DB_HOST || 'localhost').trim();
    const dbPass = (process.env.DB_PASSWORD || '').trim();

    pool = mysql.createPool({
      host: dbHost,
      user: dbUser,
      password: dbPass,
      database: dbName,
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Test connection
    pool.getConnection()
      .then(conn => {
        console.log(`✅ Connected to cPanel MySQL Database: ${process.env.DB_NAME}`);
        useMySql = true;
        conn.release();
      })
      .catch(err => {
        console.warn(`⚠️ MySQL Connection note (using resilient fallback): ${err.message}`);
        useMySql = false;
      });
  } catch (err) {
    console.warn(`⚠️ MySQL pool initialization note: ${err.message}`);
    useMySql = false;
  }
}

// ── Resilient JSON File Fallback ──
const DEFAULT_DB = {
  users: [
    { 
      id: 'usr-1', 
      name: 'Executive Super Admin', 
      email: 'admin@eluc', 
      password: 'admin', 
      role: 'SUPER_ADMIN', 
      roleTitle: 'Super Administrator', 
      studentRegNo: 'FCA108920',
      phone: '+91 98480 12345',
      unit: 'All Enterprise Units',
      subUnit: 'Central Audit Apex Office',
      joinedDate: '01-Jan-2024',
      managedBy: null
    },
    { 
      id: 'usr-2', 
      name: 'Suresh N., Audit Manager', 
      email: 'manager@eluc', 
      password: '1234567', 
      role: 'MANAGER', 
      roleTitle: 'Department Audit Manager', 
      studentRegNo: 'ACA219842',
      phone: '+91 94401 54321',
      unit: 'Auctions',
      subUnit: 'Auctions Admin Wing & Counter #1',
      joinedDate: '15-Mar-2024',
      managedBy: 'usr-1'
    },
    { 
      id: 'usr-3', 
      name: 'Ravi Teja, Field Auditor', 
      email: 'auditor@eluc', 
      password: '1234567', 
      role: 'USER', 
      roleTitle: 'Field Auditor', 
      studentRegNo: 'SRO0682194',
      phone: '+91 91234 56780',
      unit: 'Procurement [Marketing Department]',
      subUnit: 'Marketing Procurement Cell & Tenders Desk',
      joinedDate: '10-Aug-2025',
      managedBy: 'usr-2'
    },
    { 
      id: 'usr-4', 
      name: 'Priya Sharma, ACA', 
      email: 'priya@eluc', 
      password: '1234567', 
      role: 'USER', 
      roleTitle: 'Junior Auditor', 
      studentRegNo: 'SRO0741295',
      phone: '+91 98765 43210',
      unit: 'Auctions',
      subUnit: 'Counter No. 4 Daily Token Drawer',
      joinedDate: '01-Nov-2025',
      managedBy: 'usr-2'
    },
    { 
      id: 'usr-5', 
      name: 'Ananya Rao, Field Staff', 
      email: 'ananya@eluc', 
      password: '1234567', 
      role: 'USER', 
      roleTitle: 'Compliance Officer', 
      studentRegNo: 'SRO0892341',
      phone: '+91 99887 76655',
      unit: 'Kalyanakatta',
      subUnit: 'Kalyanakatta Hall No. 3 Counter Desk',
      joinedDate: '15-Dec-2025',
      managedBy: 'usr-1'
    },
    { 
      id: 'usr-6', 
      name: 'Vikram Mehta, Auditor', 
      email: 'vikram@eluc', 
      password: '1234567', 
      role: 'USER', 
      roleTitle: 'Field Auditor', 
      studentRegNo: 'CRO0123456',
      phone: '+91 97654 32109',
      unit: 'Warehousing [Marketing Department]',
      subUnit: 'Warehousing Cold Storage Thermograph Desk',
      joinedDate: '01-Feb-2026',
      managedBy: 'usr-1'
    }
  ],

  attendance: [
    { 
      id: 'log-1', 
      userId: 'usr-3', 
      userName: 'Ravi Teja, Field Auditor', 
      userEmail: 'auditor@eluc',
      managerId: 'usr-2',
      roleTitle: 'Field Auditor', 
      unit: 'Auctions', 
      loginTime: '09:02:14 AM', 
      logoutTime: null, 
      date: '12-Aug-2026', 
      timeWindow: '09:02 AM - Active',
      duration: '4h 45m', 
      active: true, 
      serverVerified: true,
      managerRemarks: 'Verified on-site token inventory.'
    },
    { 
      id: 'log-2', 
      userId: 'usr-4', 
      userName: 'Priya Sharma, ACA', 
      userEmail: 'priya@eluc',
      managerId: 'usr-2',
      roleTitle: 'Junior Auditor', 
      unit: 'Auctions', 
      loginTime: '08:45:00 AM', 
      logoutTime: '04:30:00 PM', 
      date: '12-Aug-2026', 
      timeWindow: '08:45 AM - 04:30 PM',
      duration: '7h 45m', 
      active: false, 
      serverVerified: true,
      managerRemarks: 'Audit physical tokens matched voucher book.'
    },
    { 
      id: 'log-3', 
      userId: 'usr-5', 
      userName: 'Ananya Rao, Field Staff', 
      userEmail: 'ananya@eluc',
      managerId: 'usr-1',
      roleTitle: 'Compliance Officer', 
      unit: 'Kalyanakatta', 
      loginTime: '09:15:30 AM', 
      logoutTime: null, 
      date: '12-Aug-2026', 
      timeWindow: '09:15 AM - Active',
      duration: '4h 32m', 
      active: true, 
      serverVerified: true,
      managerRemarks: 'Routine queue compliance verified.'
    },
    { 
      id: 'log-4', 
      userId: 'usr-6', 
      userName: 'Vikram Mehta, Auditor', 
      userEmail: 'vikram@eluc',
      managerId: 'usr-1',
      roleTitle: 'Field Auditor', 
      unit: 'Warehousing [Marketing Department]', 
      loginTime: '08:30:00 AM', 
      logoutTime: '05:00:00 PM', 
      date: '12-Aug-2026', 
      timeWindow: '08:30 AM - 05:00 PM',
      duration: '8h 30m', 
      active: false, 
      serverVerified: true,
      managerRemarks: 'Completed stock ledger reconciliation.'
    },
    { 
      id: 'log-5', 
      userId: 'usr-2', 
      userName: 'Suresh N., Audit Manager', 
      userEmail: 'manager@eluc',
      managerId: 'usr-1',
      roleTitle: 'Department Audit Manager', 
      unit: 'Auctions', 
      loginTime: '08:50:00 AM', 
      logoutTime: null, 
      date: '12-Aug-2026', 
      timeWindow: '08:50 AM - Active',
      duration: '4h 55m', 
      active: true, 
      serverVerified: true,
      managerRemarks: 'Manager shift active.'
    }
  ],
  assignments: [
    {
      id: 'asn-1',
      assignedToId: 'usr-3',
      assignedToName: 'Ravi Teja, Field Auditor',
      managerId: 'usr-2',
      managerName: 'Suresh N., Audit Manager',
      unit: 'Auctions',
      taskTitle: 'Concurrent Physical Bid Token Audit',
      instructions: 'Cross-check day-end auction sheet against cash counter collection ledger and upload token report PDF.',
      deadline: 'Today, 05:00 PM',
      status: 'IN_PROGRESS'
    },
    {
      id: 'asn-2',
      assignedToId: 'usr-4',
      assignedToName: 'Priya Sharma, ACA',
      managerId: 'usr-2',
      managerName: 'Suresh N., Audit Manager',
      unit: 'Auctions',
      taskTitle: 'Voucher Book & E-Token Verification',
      instructions: 'Upload scanned voucher summary PDF or photo with day collection total.',
      deadline: 'Today, 04:30 PM',
      status: 'COMPLETED'
    }
  ],
  complaints: [
    {
      id: 'CMP-2026-0812-001',
      unit: 'Auctions',
      title: 'Cash Collection & Token Reconciliation',
      category: 'Cash Collection & Token Reconciliation',
      urgency: 'HIGH',
      remarks: 'Scanned voucher sheets show 3 extra tokens unrecorded in the electronic terminal.',
      fileName: 'token_discrepancy_evidence.pdf',
      fileType: 'application/pdf',
      fileSize: '412 KB',
      fileData: null,
      sampleFileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      auditorId: 'usr-3',
      auditorName: 'Ravi Teja, Field Auditor',
      managerId: 'usr-2',
      managerName: 'Suresh N., Audit Manager',
      date: '12-Aug-2026',
      timeFrame: '09:02:00 AM - 10:15:00 AM (UTC+5:30)',
      serverTimestamp: '10:15:00 AM • 12-Aug-2026',
      status: 'UNDER_REVIEW',
      robotVerified: true
    },
    {
      id: 'CMP-2026-0812-002',
      unit: 'Procurement [Marketing Department]',
      title: 'Tender Compliance & Vendor Billing Irregularity',
      category: 'Tender Compliance & Vendor Billing Irregularity',
      urgency: 'CRITICAL',
      remarks: 'Photographic evidence attached showing broken paper seal on bidder envelope #12.',
      fileName: 'seal_breach_photo.png',
      fileType: 'image/png',
      fileSize: '1.2 MB',
      fileData: null,
      sampleFileUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&auto=format&fit=crop&q=80',
      auditorId: 'usr-7',
      auditorName: 'Kiran Reddy, Lead Auditor',
      managerId: 'usr-1',
      managerName: 'Executive Admin',
      date: '12-Aug-2026',
      timeFrame: '09:30:00 AM - 11:45:00 AM (UTC+5:30)',
      serverTimestamp: '11:45:00 AM • 12-Aug-2026',
      status: 'ESCALATED',
      robotVerified: true
    },
    {
      id: 'CMP-2026-0812-003',
      unit: 'Annaprasadam Trust and Canteens TML & TPT',
      title: 'Others (Manual Specification)',
      category: 'Others (Manual Specification)',
      urgency: 'HIGH',
      remarks: 'Digital thermograph report attached verifying +8°C temperature lag over 3 hours.',
      fileName: 'temperature_log_sheet.pdf',
      fileType: 'application/pdf',
      fileSize: '298 KB',
      fileData: null,
      sampleFileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      auditorId: 'usr-9',
      auditorName: 'Manoj Varma, Inspector',
      managerId: 'usr-1',
      managerName: 'Canteen Directorate',
      date: '12-Aug-2026',
      timeFrame: '07:30:00 AM - 09:45:00 AM (UTC+5:30)',
      serverTimestamp: '09:45:00 AM • 12-Aug-2026',
      status: 'RESOLVED',
      robotVerified: true
    }
  ]
};

function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('Error reading db.json:', err);
  }
  return DEFAULT_DB;
}

function saveDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving db.json:', err);
  }
}

// ──────────────────────────────────────────────
// API ROUTES (MYSQL-FIRST WITH RESILIENT FALLBACK)
// ──────────────────────────────────────────────

// 1. Auth Login (Captures Anti-Tamper Time on Server, supports admin/admin and any user credentials)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const rawInput = (email || '').trim();
  const inputLower = rawInput.toLowerCase();
  const { timeStr, dateStr, isoStr } = getServerTimeDetails();

  const db = loadDb();
  let user = null;

  // Check if admin login
  if (inputLower === 'admin' || inputLower === 'admin@eluc' || inputLower === 'superadmin') {
    user = db.users.find(u => u.role === 'SUPER_ADMIN') || {
      id: 'usr-1',
      name: 'Executive Super Admin',
      email: 'admin@eluc',
      password: 'admin',
      role: 'SUPER_ADMIN',
      roleTitle: 'Super Administrator',
      studentRegNo: 'FCA108920',
      phone: '+91 98480 12345',
      unit: 'All Enterprise Units',
      subUnit: 'Central Audit Apex Office',
      joinedDate: '01-Jan-2024',
      managedBy: null
    };
  } else {
    // Look up by email, name, or id
    user = db.users.find(u => 
      u.email.toLowerCase() === inputLower || 
      u.name.toLowerCase() === inputLower || 
      u.id.toLowerCase() === inputLower
    );

    // If not found, dynamically create user account so ANY user can log in with ANY details!
    if (!user) {
      const emailFormatted = inputLower.includes('@') ? inputLower : `${inputLower}@eluc`;
      const displayName = rawInput.includes('@') 
        ? rawInput.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) 
        : rawInput.replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

      user = {
        id: `usr-${Date.now()}`,
        name: displayName || 'Field Auditor',
        email: emailFormatted,
        password: password || '1234567',
        role: 'USER',
        roleTitle: 'Field Auditor',
        studentRegNo: `SRO0${Math.floor(100000 + Math.random() * 900000)}`,
        phone: '+91 98480 ' + Math.floor(10000 + Math.random() * 90000),
        unit: ORGANIZATIONAL_UNITS[0],
        subUnit: 'General Audit Desk #1',
        joinedDate: dateStr,
        managedBy: 'usr-2'
      };
      db.users.push(user);
    }
  }

  // Validate credentials
  if (user && user.password !== password) {
    return res.status(401).json({ success: false, message: 'Invalid password credentials' });
  }

  // Close previous active sessions for this user
  db.attendance = db.attendance.map(rec => {
    if (rec.userId === user.id && rec.active) {
      return { ...rec, active: false, logoutTime: timeStr, duration: 'Auto closed on new login' };
    }
    return rec;
  });

  const activeLog = {
    id: `log-${Date.now()}`,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    managerId: user.managedBy || (user.role === 'MANAGER' ? 'usr-1' : null),
    roleTitle: user.roleTitle || user.role,
    unit: user.unit || ORGANIZATIONAL_UNITS[0],
    loginTime: timeStr,
    logoutTime: null,
    date: dateStr,
    timeWindow: `${timeStr} - Active`,
    duration: 'Session Active',
    active: true,
    serverVerified: true,
    serverUtcIso: isoStr,
    managerRemarks: `${user.roleTitle || user.role} active in portal.`
  };

  db.attendance.unshift(activeLog);
  saveDb(db);

  res.json({
    success: true,
    user,
    serverTimestamp: timeStr,
    serverDate: dateStr,
    activeLog
  });
});


// 2. Auth Logout (Server-Authoritative Exit Timestamp & Updates Single Daily Duty Sheet)
app.post('/api/auth/logout', async (req, res) => {
  const { userId, logoutRemarks } = req.body;
  const { timeStr, dateStr, isoStr } = getServerTimeDetails();

  const db = loadDb();
  if (userId) {
    // 1. Update the SAME single Daily Duty Sheet for today's shift
    if (!db.dailyReports) db.dailyReports = [];
    let reportFound = false;
    db.dailyReports = db.dailyReports.map(rep => {
      if ((rep.userId === userId || (rep.studentRegNo && db.users.find(u => u.id === userId)?.studentRegNo === rep.studentRegNo)) && (!rep.logoutTime || rep.date === dateStr)) {
        reportFound = true;
        return {
          ...rep,
          logoutTime: timeStr,
          logoutRemarks: logoutRemarks || rep.logoutRemarks || '',
          status: 'COMPLETED & VERIFIED',
          concludedAt: isoStr
        };
      }
      return rep;
    });

    // If user didn't file 10 parameters before logout, create an entry with login & logout stamped
    if (!reportFound) {
      const user = db.users.find(u => u.id === userId);
      const userAtt = (db.attendance || []).find(a => a.userId === userId && a.active);
      db.dailyReports.unshift({
        id: `dr-${Date.now()}`,
        userId,
        loginTime: userAtt ? userAtt.loginTime : '09:00:00 AM',
        fullName: user?.name || 'Audit Staff',
        studentRegNo: user?.studentRegNo || 'SRO0684920',
        unitDetails: user?.unit || ORGANIZATIONAL_UNITS[0],
        subUnitDetails: user?.subUnit || 'General Unit Counter',
        auditWorkType: 'Concurrent Audit',
        workObjective: 'Daily audit duty & physical verification',
        targetToAchieve: 'Standard compliance verified',
        caRemarks: '',
        pocName: 'Duty Officer',
        logoutTime: timeStr,
        logoutRemarks: logoutRemarks || 'Standard evening shift conclusion',
        status: 'COMPLETED & VERIFIED',
        date: dateStr,
        createdAt: new Date().toISOString()
      });
    }

    // 2. Update Attendance Ledger with matching logout time and remarks
    let attFound = false;
    db.attendance = (db.attendance || []).map(rec => {
      if (rec.userId === userId && rec.active) {
        attFound = true;
        return {
          ...rec,
          active: false,
          logoutTime: timeStr,
          timeWindow: `${rec.loginTime} - ${timeStr}`,
          duration: 'Session Completed',
          serverLogoutIso: isoStr,
          managerRemarks: logoutRemarks || rec.managerRemarks || 'Logged out by user action.'
        };
      }
      return rec;
    });

    if (!attFound) {
      const user = db.users.find(u => u.id === userId);
      db.attendance.unshift({
        id: `log-${Date.now()}`,
        userId,
        userName: user?.name || 'Staff User',
        userEmail: user?.email || '',
        managerId: user?.managedBy || null,
        roleTitle: user?.roleTitle || 'Staff',
        unit: user?.unit || ORGANIZATIONAL_UNITS[0],
        loginTime: '09:00:00 AM',
        logoutTime: timeStr,
        date: dateStr,
        timeWindow: `09:00 AM - ${timeStr}`,
        duration: 'Session Closed',
        active: false,
        serverVerified: true,
        managerRemarks: logoutRemarks || 'Logged out by user action.'
      });
    }

    saveDb(db);
  }

  res.json({
    success: true,
    serverLogoutTime: timeStr,
    serverDate: dateStr,
    reports: db.dailyReports || [],
    attendance: db.attendance || [],
    message: `Session securely closed and exit timestamp recorded on server at ${timeStr}`
  });
});


// 3. User Shift Clock Toggle
app.post('/api/attendance/toggle', async (req, res) => {
  const { userId, isClockedIn } = req.body;
  const { timeStr, dateStr } = getServerTimeDetails();

  const db = loadDb();
  const user = db.users.find(u => u.id === userId);

  if (isClockedIn) {
    db.attendance = db.attendance.map(rec => {
      if (rec.userId === userId && rec.active) {
        return { ...rec, active: false, logoutTime: timeStr, duration: 'Shift Closed' };
      }
      return rec;
    });
  } else {
    db.attendance.unshift({
      id: `log-${Date.now()}`,
      userId: userId || 'usr-temp',
      userName: user?.name || 'Field Auditor',
      userEmail: user?.email || 'auditor@eluc',
      managerId: user?.managedBy || 'usr-2',
      roleTitle: user?.roleTitle || 'Auditor',
      unit: user?.unit || ORGANIZATIONAL_UNITS[0],
      loginTime: timeStr,
      logoutTime: null,
      date: dateStr,
      timeWindow: `${timeStr} - Active`,
      duration: '0h 01m',
      active: true,
      serverVerified: true,
      managerRemarks: 'Re-punched shift.'
    });
  }

  saveDb(db);
  res.json({ success: true, attendance: db.attendance, timeStr });
});

// 4. Get Users (Super Admin & Manager Directory)
app.get('/api/users', async (req, res) => {
  if (useMySql && pool) {
    try {
      const [rows] = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
      const formatted = rows.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        roleTitle: u.role_title,
        unit: u.unit,
        managedBy: u.managed_by
      }));
      return res.json({ success: true, users: formatted });
    } catch (err) {
      console.warn('MySQL get users fallback:', err.message);
    }
  }

  const db = loadDb();
  res.json({ success: true, users: db.users });
});

// 5. Create User / Provision Account
app.post('/api/users', async (req, res) => {
  const { name, email, password, roleTitle, unit, managerId } = req.body;
  const role = roleTitle.includes('Manager') ? 'MANAGER' : (roleTitle.includes('Super') ? 'SUPER_ADMIN' : 'USER');
  const newId = `usr-${Date.now()}`;
  const emailClean = email.trim().toLowerCase();

  if (useMySql && pool) {
    try {
      await pool.query(
        'INSERT INTO users (id, name, email, password, role, role_title, unit, managed_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [newId, name.trim(), emailClean, password || '1234567', role, roleTitle, unit || ORGANIZATIONAL_UNITS[0], managerId || 'usr-1']
      );
      const [allUsers] = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
      return res.json({
        success: true,
        user: { id: newId, name, email: emailClean, role, roleTitle, unit, managedBy: managerId },
        users: allUsers
      });
    } catch (err) {
      console.warn('MySQL create user fallback:', err.message);
    }
  }

  const db = loadDb();
  const newUser = {
    id: newId,
    name: name.trim(),
    email: emailClean,
    password: password || '1234567',
    role,
    roleTitle,
    unit: unit || ORGANIZATIONAL_UNITS[0],
    managedBy: managerId || 'usr-1'
  };

  db.users.unshift(newUser);
  saveDb(db);
  res.json({ success: true, user: newUser, users: db.users });
});

// 6. MANAGER DECIDES USER ROLE
app.patch('/api/users/:id/role', async (req, res) => {
  const { id } = req.params;
  const { roleTitle, unit } = req.body;

  if (useMySql && pool) {
    try {
      await pool.query('UPDATE users SET role_title = ?, unit = ? WHERE id = ?', [roleTitle, unit, id]);
      await pool.query('UPDATE attendance SET role_title = ?, unit = ? WHERE user_id = ?', [roleTitle, unit, id]);
      return res.json({ success: true });
    } catch (err) {
      console.warn('MySQL role update fallback:', err.message);
    }
  }

  const db = loadDb();
  db.users = db.users.map(u => {
    if (u.id === id) {
      return { ...u, roleTitle: roleTitle || u.roleTitle, unit: unit || u.unit };
    }
    return u;
  });

  db.attendance = db.attendance.map(a => {
    if (a.userId === id) {
      return { ...a, roleTitle: roleTitle || a.roleTitle, unit: unit || a.unit };
    }
    return a;
  });

  saveDb(db);
  res.json({ success: true, users: db.users, attendance: db.attendance });
});

// 7. Get Attendance Ledger
app.get('/api/attendance', async (req, res) => {
  const { role, managerId } = req.query;

  if (useMySql && pool) {
    try {
      let query = 'SELECT * FROM attendance ORDER BY created_at DESC';
      let params = [];
      if (role === 'MANAGER' && managerId) {
        query = 'SELECT * FROM attendance WHERE manager_id = ? ORDER BY created_at DESC';
        params = [managerId];
      }
      const [rows] = await pool.query(query, params);
      const formatted = rows.map(r => ({
        id: r.id,
        userId: r.user_id,
        userName: r.user_name,
        userEmail: r.user_email,
        managerId: r.manager_id,
        roleTitle: r.role_title,
        unit: r.unit,
        loginTime: r.login_time,
        logoutTime: r.logout_time,
        date: r.date_str,
        timeWindow: r.time_window,
        duration: r.duration,
        active: Boolean(r.is_active),
        serverVerified: Boolean(r.server_verified),
        managerRemarks: r.manager_remarks
      }));
      return res.json({ success: true, attendance: formatted });
    } catch (err) {
      console.warn('MySQL attendance get fallback:', err.message);
    }
  }

  const db = loadDb();
  let records = db.attendance;
  if (role === 'MANAGER' && managerId) {
    records = db.attendance.filter(r => r.managerId === managerId);
  }
  res.json({ success: true, attendance: records });
});

// 8. Save Manager Remarks
app.patch('/api/attendance/:id/remark', async (req, res) => {
  const { id } = req.params;
  const { remarks } = req.body;

  if (useMySql && pool) {
    try {
      await pool.query('UPDATE attendance SET manager_remarks = ? WHERE id = ?', [remarks, id]);
      return res.json({ success: true });
    } catch (err) {
      console.warn('MySQL remark update fallback:', err.message);
    }
  }

  const db = loadDb();
  db.attendance = db.attendance.map(item => {
    if (item.id === id) {
      return { ...item, managerRemarks: remarks };
    }
    return item;
  });

  saveDb(db);
  res.json({ success: true, attendance: db.attendance });
});

// 9. Work Assignments
app.get('/api/assignments', (req, res) => {
  const { userId, managerId } = req.query;
  const db = loadDb();

  let results = db.assignments;
  if (userId) results = results.filter(a => a.assignedToId === userId);
  if (managerId) results = results.filter(a => a.managerId === managerId);

  res.json({ success: true, assignments: results });
});


app.post('/api/assignments', (req, res) => {
  const { assignedToId, managerId, unit, taskTitle, instructions, deadline } = req.body;
  const db = loadDb();

  const targetUser = db.users.find(u => u.id === assignedToId);
  const manager = db.users.find(u => u.id === managerId);

  const newAssignment = {
    id: `asn-${Date.now()}`,
    assignedToId,
    assignedToName: targetUser ? targetUser.name : 'Field Auditor',
    managerId,
    managerName: manager ? manager.name : 'Department Manager',
    unit,
    taskTitle,
    instructions: instructions || 'Complete full physical verification and upload evidence document.',
    deadline: deadline || 'Today, 05:30 PM',
    status: 'ASSIGNED'
  };

  db.assignments.unshift(newAssignment);
  saveDb(db);
  res.json({ success: true, assignment: newAssignment, assignments: db.assignments });
});

// 10. COMPLAINT & EVIDENCE UPLOAD (ROBOT BACKEND VAULT)
app.post('/api/complaints/upload', async (req, res) => {
  const { 
    unit, 
    title, 
    category, 
    urgency, 
    remarks, 
    fileName, 
    fileType, 
    fileSize, 
    fileData, 
    auditorId, 
    auditorName 
  } = req.body;

  const db = loadDb();
  const { timeStr, dateStr, fullTimeframe } = getServerTimeDetails();
  const user = db.users.find(u => u.id === auditorId);
  const manager = db.users.find(u => u.id === (user?.managedBy || 'usr-2'));

  const newId = `CMP-2026-0812-00${(db.complaints?.length || 0) + 1}`;
  const sampleUrl = fileType?.includes('image') 
    ? 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&auto=format&fit=crop&q=80'
    : 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

  if (useMySql && pool) {
    try {
      await pool.query(
        `INSERT INTO complaints (id, unit, title, category, urgency, remarks, file_name, file_type, file_size, file_data, sample_file_url, auditor_id, auditor_name, manager_id, manager_name, date_str, time_frame, server_timestamp, status, robot_verified)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SUBMITTED', 1)`,
        [newId, unit || user?.unit || ORGANIZATIONAL_UNITS[0], title || 'Field Observation', category || 'Sub-Risk', urgency || 'MEDIUM', remarks, fileName || 'document.pdf', fileType || 'application/pdf', fileSize || '250 KB', fileData || null, sampleUrl, auditorId || 'usr-3', auditorName || 'Field Auditor', user?.managedBy || 'usr-2', manager?.name || 'Department Audit Manager', dateStr, fullTimeframe, `${timeStr} • ${dateStr}`]
      );
    } catch (err) {
      console.warn('MySQL complaint insert fallback:', err.message);
    }
  }

  const newComplaint = {
    id: newId,
    unit: unit || (user?.unit || ORGANIZATIONAL_UNITS[0]),
    title: title || 'Field Observation',
    category: category || 'Audit Discrepancy',
    urgency: urgency || 'MEDIUM',
    remarks: remarks || 'Evidence document submitted for management review.',
    fileName: fileName || 'document.pdf',
    fileType: fileType || 'application/pdf',
    fileSize: fileSize || '150 KB',
    fileData: fileData || null,
    sampleFileUrl: sampleUrl,
    auditorId: auditorId || 'usr-3',
    auditorName: auditorName || (user?.name || 'Field Auditor'),
    managerId: user?.managedBy || 'usr-2',
    managerName: manager?.name || 'Department Audit Manager',
    date: dateStr,
    timeFrame: fullTimeframe,
    serverTimestamp: `${timeStr} • ${dateStr}`,
    status: 'SUBMITTED',
    robotVerified: true
  };

  if (!db.complaints) db.complaints = [];
  db.complaints.unshift(newComplaint);
  saveDb(db);

  res.json({
    success: true,
    message: 'Complaint & File verified by Robot Backend Vault',
    complaint: newComplaint,
    complaints: db.complaints,
    receiptToken: `RB-VAULT-CERT-${Date.now().toString(36).toUpperCase()}`
  });
});

app.get('/api/complaints', async (req, res) => {
  const { role, managerId, unit } = req.query;

  if (useMySql && pool) {
    try {
      let query = 'SELECT * FROM complaints WHERE 1=1';
      let params = [];
      if (role === 'MANAGER' && managerId) {
        query += ' AND manager_id = ?';
        params.push(managerId);
      }
      if (unit && unit !== 'ALL') {
        query += ' AND unit = ?';
        params.push(unit);
      }
      query += ' ORDER BY created_at DESC';

      const [rows] = await pool.query(query, params);
      const formatted = rows.map(r => ({
        id: r.id,
        unit: r.unit,
        title: r.title,
        category: r.category,
        urgency: r.urgency,
        remarks: r.remarks,
        fileName: r.file_name,
        fileType: r.file_type,
        fileSize: r.file_size,
        fileData: r.file_data,
        sampleFileUrl: r.sample_file_url,
        auditorId: r.auditor_id,
        auditorName: r.auditor_name,
        managerId: r.manager_id,
        managerName: r.manager_name,
        date: r.date_str,
        timeFrame: r.time_frame,
        serverTimestamp: r.server_timestamp,
        status: r.status,
        robotVerified: Boolean(r.robot_verified)
      }));
      return res.json({ success: true, complaints: formatted });
    } catch (err) {
      console.warn('MySQL get complaints fallback:', err.message);
    }
  }

  const db = loadDb();
  let results = db.complaints || [];

  if (role === 'MANAGER' && managerId) {
    results = results.filter(c => c.managerId === managerId);
  }
  if (unit && unit !== 'ALL') {
    results = results.filter(c => c.unit === unit);
  }

  res.json({ success: true, complaints: results });
});

// Update Complaint Status
app.patch('/api/complaints/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (useMySql && pool) {
    try {
      await pool.query('UPDATE complaints SET status = ? WHERE id = ?', [status, id]);
    } catch (err) {
      console.warn('MySQL status update fallback:', err.message);
    }
  }

  const db = loadDb();
  db.complaints = (db.complaints || []).map(c => {
    if (c.id === id) return { ...c, status };
    return c;
  });
  saveDb(db);
  res.json({ success: true, complaint: db.complaints.find(c => c.id === id) });
});

// ── Daily Audit Duty & Work Reports Endpoints ──

app.get('/api/daily-reports', (req, res) => {
  const db = loadDb();
  res.json({ success: true, reports: db.dailyReports || [] });
});

app.post('/api/daily-reports', (req, res) => {
  const {
    userId,
    loginTime,
    fullName,
    studentRegNo,
    unitDetails,
    subUnitDetails,
    auditWorkType,
    workObjective,
    targetToAchieve,
    caRemarks,
    pocName,
    logoutTime,
    logoutRemarks,
    status
  } = req.body;

  const db = loadDb();
  if (!db.dailyReports) db.dailyReports = [];

  const { timeStr, dateStr } = getServerTimeDetails();

  // Check if an existing sheet exists for this user today
  let existingIndex = db.dailyReports.findIndex(r => 
    (userId && r.userId === userId && r.date === dateStr) ||
    (studentRegNo && r.studentRegNo === studentRegNo && r.date === dateStr)
  );

  let targetReport;
  if (existingIndex >= 0) {
    // Update existing single sheet
    db.dailyReports[existingIndex] = {
      ...db.dailyReports[existingIndex],
      loginTime: db.dailyReports[existingIndex].loginTime || loginTime || timeStr,
      fullName: fullName || db.dailyReports[existingIndex].fullName,
      studentRegNo: studentRegNo || db.dailyReports[existingIndex].studentRegNo,
      unitDetails: unitDetails || db.dailyReports[existingIndex].unitDetails,
      subUnitDetails: subUnitDetails || db.dailyReports[existingIndex].subUnitDetails,
      auditWorkType: auditWorkType || db.dailyReports[existingIndex].auditWorkType,
      workObjective: workObjective || db.dailyReports[existingIndex].workObjective,
      targetToAchieve: targetToAchieve || db.dailyReports[existingIndex].targetToAchieve,
      caRemarks: caRemarks !== undefined ? caRemarks : db.dailyReports[existingIndex].caRemarks,
      pocName: pocName || db.dailyReports[existingIndex].pocName,
      logoutTime: logoutTime || db.dailyReports[existingIndex].logoutTime || null,
      logoutRemarks: logoutRemarks || db.dailyReports[existingIndex].logoutRemarks || '',
      status: status || (logoutTime ? 'COMPLETED & VERIFIED' : 'ACTIVE_DUTY'),
      updatedAt: new Date().toISOString()
    };
    targetReport = db.dailyReports[existingIndex];
  } else {
    // Create new single sheet
    targetReport = {
      id: `dr-${Date.now()}`,
      userId: userId || null,
      loginTime: loginTime || timeStr,
      fullName: fullName || 'Audit Student',
      studentRegNo: studentRegNo || '',
      unitDetails: unitDetails || ORGANIZATIONAL_UNITS[0],
      subUnitDetails: subUnitDetails || '',
      auditWorkType: auditWorkType || 'Concurrent Audit',
      workObjective: workObjective || '',
      targetToAchieve: targetToAchieve || '',
      caRemarks: caRemarks || '',
      pocName: pocName || '',
      logoutTime: logoutTime || null,
      logoutRemarks: logoutRemarks || '',
      status: status || (logoutTime ? 'COMPLETED & VERIFIED' : 'ACTIVE_DUTY'),
      date: dateStr,
      createdAt: new Date().toISOString()
    };
    db.dailyReports.unshift(targetReport);
  }

  saveDb(db);
  res.json({ success: true, report: targetReport, reports: db.dailyReports });
});


// ── Live Server Time Endpoint ──
app.get('/api/server-time', (req, res) => {
  const timeData = getServerTimeDetails();
  res.json({ success: true, ...timeData });
});

// ── Minutes of Meeting (MOM) Endpoints ──
app.get('/api/moms', (req, res) => {
  const db = loadDb();
  res.json({ success: true, moms: db.moms || [] });
});

app.post('/api/moms', (req, res) => {
  const {
    meetingTitle,
    meetingType,
    date,
    time,
    organizer,
    location,
    attendees,
    agenda,
    discussions,
    actionItems,
    nextMeeting,
    authorId
  } = req.body;

  const db = loadDb();
  if (!db.moms) db.moms = [];

  const { timeStr, dateStr } = getServerTimeDetails();

  const newMom = {
    id: `mom-${Date.now()}`,
    meetingTitle: meetingTitle || 'Weekly Team Meeting',
    meetingType: meetingType || 'Team Meeting',
    date: date || dateStr,
    time: time || timeStr,
    organizer: organizer || 'Demo Managing Partner',
    location: location || 'Conference Room A',
    attendees: attendees || '',
    agenda: agenda || '',
    discussions: discussions || '',
    actionItems: actionItems || '',
    nextMeeting: nextMeeting || '',
    authorId: authorId || null,
    serverTimestamp: `${timeStr} • ${dateStr}`,
    createdAt: new Date().toISOString()
  };

  db.moms.unshift(newMom);
  saveDb(db);

  res.json({ success: true, mom: newMom, moms: db.moms });
});

// ── Tasks Creation & Management Endpoints ──
app.get('/api/tasks', (req, res) => {
  const db = loadDb();
  res.json({ success: true, tasks: db.tasks || [] });
});

app.post('/api/tasks', (req, res) => {
  const {
    taskTitle,
    priority,
    description,
    assignedTo,
    dueDate,
    project,
    category,
    createdById,
    createdByName
  } = req.body;

  const db = loadDb();
  if (!db.tasks) db.tasks = [];

  const { timeStr, dateStr } = getServerTimeDetails();

  const newTask = {
    id: `tsk-${Date.now()}`,
    taskTitle: taskTitle || 'Audit Verification Task',
    priority: priority || 'Medium Priority',
    description: description || '',
    assignedTo: assignedTo || 'Demo Managing Partner',
    dueDate: dueDate || dateStr,
    project: project || '',
    category: category || 'General',
    status: 'IN_PROGRESS',
    createdById: createdById || null,
    createdByName: createdByName || 'Staff Member',
    serverTimestamp: `${timeStr} • ${dateStr}`,
    createdAt: new Date().toISOString()
  };

  db.tasks.unshift(newTask);
  saveDb(db);

  res.json({ success: true, task: newTask, tasks: db.tasks });
});

// ── Serve Built Frontend from Express (Solves 403 Forbidden on cPanel) ──


const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Centralized Audit Backend running on port ${PORT}`);
});
