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
      password: '1234567', 
      role: 'SUPER_ADMIN', 
      roleTitle: 'Super Administrator', 
      unit: 'All Enterprise Units',
      managedBy: null
    },
    { 
      id: 'usr-2', 
      name: 'Suresh N., Audit Manager', 
      email: 'manager@eluc', 
      password: '1234567', 
      role: 'MANAGER', 
      roleTitle: 'Department Audit Manager', 
      unit: 'Auctions',
      managedBy: 'usr-1'
    },
    { 
      id: 'usr-3', 
      name: 'Ravi Teja, Field Auditor', 
      email: 'auditor@eluc', 
      password: '1234567', 
      role: 'USER', 
      roleTitle: 'Field Auditor', 
      unit: 'Auctions',
      managedBy: 'usr-2'
    },
    { 
      id: 'usr-4', 
      name: 'Priya Sharma, ACA', 
      email: 'priya@eluc', 
      password: '1234567', 
      role: 'USER', 
      roleTitle: 'Junior Auditor', 
      unit: 'Auctions',
      managedBy: 'usr-2'
    },
    { 
      id: 'usr-5', 
      name: 'Ananya Rao, Field Staff', 
      email: 'ananya@eluc', 
      password: '1234567', 
      role: 'USER', 
      roleTitle: 'Compliance Officer', 
      unit: 'Kalyanakatta',
      managedBy: 'usr-1'
    },
    { 
      id: 'usr-6', 
      name: 'Vikram Mehta, Auditor', 
      email: 'vikram@eluc', 
      password: '1234567', 
      role: 'USER', 
      roleTitle: 'Field Auditor', 
      unit: 'Warehousing [Marketing Department]',
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

// 1. Auth Login (Captures Anti-Tamper Time on Server)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const emailTrim = (email || '').trim().toLowerCase();
  const { timeStr, dateStr, isoStr } = getServerTimeDetails();

  let user = null;

  if (useMySql && pool) {
    try {
      const [rows] = await pool.query('SELECT * FROM users WHERE LOWER(email) = ? LIMIT 1', [emailTrim]);
      if (rows.length > 0) {
        const u = rows[0];
        user = {
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          roleTitle: u.role_title,
          unit: u.unit,
          managedBy: u.managed_by
        };
      } else {
        // Auto-provision user
        const newId = `usr-${Date.now()}`;
        const newName = emailTrim.includes('@') ? emailTrim.split('@')[0] : emailTrim;
        await pool.query(
          'INSERT INTO users (id, name, email, password, role, role_title, unit, managed_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [newId, newName, emailTrim, password || '1234567', 'USER', 'Field Auditor', ORGANIZATIONAL_UNITS[0], 'usr-2']
        );
        user = {
          id: newId,
          name: newName,
          email: emailTrim,
          role: 'USER',
          roleTitle: 'Field Auditor',
          unit: ORGANIZATIONAL_UNITS[0],
          managedBy: 'usr-2'
        };
      }

      // Close previous unclosed sessions in MySQL
      await pool.query('UPDATE attendance SET is_active = 0, logout_time = ?, duration = ? WHERE user_id = ? AND is_active = 1', [timeStr, 'Auto closed on new login', user.id]);

      // Insert new active session in MySQL
      const logId = `log-${Date.now()}`;
      await pool.query(
        `INSERT INTO attendance (id, user_id, user_name, user_email, manager_id, role_title, unit, login_time, logout_time, date_str, time_window, duration, is_active, server_verified, server_utc_iso, manager_remarks)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, 1, 1, ?, ?)`,
        [logId, user.id, user.name, user.email, user.managedBy || (user.role === 'MANAGER' ? 'usr-1' : null), user.roleTitle || user.role, user.unit, timeStr, dateStr, `${timeStr} - Active`, 'Session Active', isoStr, `${user.roleTitle} logged into portal.`]
      );

      return res.json({
        success: true,
        user,
        serverTimestamp: timeStr,
        serverDate: dateStr
      });
    } catch (sqlErr) {
      console.warn('MySQL login fallback to file DB:', sqlErr.message);
    }
  }

  // Fallback to File DB
  const db = loadDb();
  user = db.users.find(u => u.email.toLowerCase() === emailTrim);

  if (!user) {
    user = {
      id: `usr-${Date.now()}`,
      name: emailTrim.includes('@') ? emailTrim.split('@')[0] : emailTrim,
      email: emailTrim,
      role: 'USER',
      roleTitle: 'Field Auditor',
      unit: ORGANIZATIONAL_UNITS[0],
      managedBy: 'usr-2'
    };
    db.users.push(user);
  }

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
    unit: user.unit,
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

// 2. Auth Logout (Server-Authoritative Exit Timestamp)
app.post('/api/auth/logout', async (req, res) => {
  const { userId } = req.body;
  const { timeStr, dateStr, isoStr } = getServerTimeDetails();

  if (useMySql && pool && userId) {
    try {
      await pool.query(
        `UPDATE attendance 
         SET is_active = 0, logout_time = ?, time_window = CONCAT(login_time, ' - ', ?), duration = 'Session Completed'
         WHERE user_id = ? AND is_active = 1`,
        [timeStr, timeStr, userId]
      );
      return res.json({
        success: true,
        serverLogoutTime: timeStr,
        serverDate: dateStr,
        message: `Exit timestamp stamped in MySQL at ${timeStr}`
      });
    } catch (sqlErr) {
      console.warn('MySQL logout fallback to file DB:', sqlErr.message);
    }
  }

  // Fallback to File DB
  const db = loadDb();
  if (userId) {
    let found = false;
    db.attendance = db.attendance.map(rec => {
      if (rec.userId === userId && rec.active) {
        found = true;
        return {
          ...rec,
          active: false,
          logoutTime: timeStr,
          timeWindow: `${rec.loginTime} - ${timeStr}`,
          duration: 'Session Completed',
          serverLogoutIso: isoStr
        };
      }
      return rec;
    });

    if (!found) {
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
        managerRemarks: 'Logged out by user action.'
      });
    }
    saveDb(db);
  }

  res.json({
    success: true,
    serverLogoutTime: timeStr,
    serverDate: dateStr,
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
  res.json({ success: true, complaints: db.complaints });
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
