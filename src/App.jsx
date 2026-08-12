import React, { useState, useEffect, useCallback } from 'react';
import './index.css';


// Dynamic API URL: Automatically uses '/api' on cPanel production and 'http://localhost:5001/api' in local Vite dev
const API_BASE = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (window.location.port === '5173' || window.location.port === '5174'))
  ? 'http://localhost:5001/api'
  : '/api';

// ── The 8 Official Units from Field Requirement ──
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

// Available Auditor Staff Roles (Manager Decides)
const AUDITOR_ROLES = [
  'Field Auditor',
  'Junior Auditor',
  'Senior Field Staff',
  'Lead Auditor',
  'Compliance Officer'
];

// Predefined Audit Work Types for Daily Duty Reporting
const AUDIT_WORK_TYPES = [
  'Concurrent Audit',
  'Internal Audit & Systems Review',
  'Physical Inventory & Stock Verification',
  'Revenue, Donation & Token Reconciliation',
  'Tender, Bidder Envelope & Procurement Review',
  'Voucher & Ledger Transaction Verification',
  'Statutory & Regulatory Compliance Audit',
  'Special Investigation / Surprise Inspection'
];

export default function App() {

  // ── Auth & Current Session ──
  const [authView, setAuthView] = useState('signin');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [sessionLoginTime, setSessionLoginTime] = useState(null);
  const [logoutToast, setLogoutToast] = useState(null);

  // ── Daily Audit Duty & Work Reporting Sheet State (The 11 Parameters) ──
  const [dutyLoginTime, setDutyLoginTime] = useState('09:00:00 AM');
  const [dutyFullName, setDutyFullName] = useState('');
  const [dutyStudentRegNo, setDutyStudentRegNo] = useState('');
  const [dutyUnitDetails, setDutyUnitDetails] = useState(ORGANIZATIONAL_UNITS[0]);
  const [dutySubUnitDetails, setDutySubUnitDetails] = useState('');
  const [dutyAuditWorkType, setDutyAuditWorkType] = useState(AUDIT_WORK_TYPES[0]);
  const [dutyWorkObjective, setDutyWorkObjective] = useState('');
  const [dutyTargetToAchieve, setDutyTargetToAchieve] = useState('');
  const [dutyCaRemarks, setDutyCaRemarks] = useState('');
  const [dutyPocName, setDutyPocName] = useState('');
  const [dutyLogoutTime, setDutyLogoutTime] = useState('');
  const [dutySubmittedReports, setDutySubmittedReports] = useState([]);
  const [dutySubmitSuccess, setDutySubmitSuccess] = useState(false);
  const [dutyActiveTab, setDutyActiveTab] = useState('sheet'); // 'sheet' or 'records'

  // Sign In form inputs
  const [loginEmail, setLoginEmail] = useState('admin@eluc');
  const [loginPassword, setLoginPassword] = useState('1234567');
  const [showPassword, setShowPassword] = useState(false);


  // Master State Stores
  const [usersDb, setUsersDb] = useState([]);
  const [_attendanceLedger, setAttendanceLedger] = useState([]);
  const [_assignmentsDb, setAssignmentsDb] = useState([]);
  const [_complaintsDb, setComplaintsDb] = useState([]);

  // Live Server Clock
  const [currentTimeStr, setCurrentTimeStr] = useState('10:45 AM');

  // ── Document Viewer Modal State (Super Admin & Manager & User) ──
  const [viewingDoc, setViewingDoc] = useState(null);


  // ── Manager Role Switcher Modal State ──
  const [editingRoleUser, setEditingRoleUser] = useState(null);
  const [selectedRoleTitle, setSelectedRoleTitle] = useState(AUDITOR_ROLES[0]);
  const [selectedRoleUnit, setSelectedRoleUnit] = useState(ORGANIZATIONAL_UNITS[0]);

  // ── Manager Work Assignment Modal State ──
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTargetUserId, setAssignTargetUserId] = useState('');
  const [assignUnit, setAssignUnit] = useState(ORGANIZATIONAL_UNITS[0]);
  const [assignTaskTitle, setAssignTaskTitle] = useState('');
  const [assignInstructions, setAssignInstructions] = useState('');
  const [assignDeadline, setAssignDeadline] = useState('Today, 05:30 PM');

  // ── Manager User Provisioning Modal State ──
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('1234567');
  const [newUserRoleTitle, setNewUserRoleTitle] = useState('Field Auditor');
  const [newUserUnit, setNewUserUnit] = useState(ORGANIZATIONAL_UNITS[0]);

  // Forgot Password Modal

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState(false);

  // ── Universal In-App Mobile Unit Picker Modal (Fixes OS Dropdown Overflows) ──
  const [unitPickerModal, setUnitPickerModal] = useState(null);

  // ── Right Bottom Corner Widget State & 4-Sections Modals ──
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [showQuickLoginModal, setShowQuickLoginModal] = useState(false);
  const [showMumModal, setShowMumModal] = useState(false);
  const [mumTab, setMumTab] = useState('units_matrix'); // 'units_matrix', 'log_minutes', 'records'
  const [mumMinutesUnit, setMumMinutesUnit] = useState(ORGANIZATIONAL_UNITS[0]);
  const [mumAgenda, setMumAgenda] = useState('');
  const [mumDecisions, setMumDecisions] = useState('');
  const [mumActionOwner, setMumActionOwner] = useState('');
  const [mumDueDate, setMumDueDate] = useState('End of Month');
  const [mumSubmitSuccess, setMumSubmitSuccess] = useState(false);
  const [mumRecords, setMumRecords] = useState([
    {
      id: 'mum-1',
      unit: 'Auctions',
      agenda: 'Monthly Concurrent Token & Voucher Discrepancy Reconciliation',
      decisions: 'Adopted dual physical count protocol for daily token drawers. Audit compliance verified.',
      actionOwner: 'Ravi Teja (Auditor) & Suresh N. (Manager)',
      date: '12-Aug-2026',
      status: 'COMPLIANT'
    },
    {
      id: 'mum-2',
      unit: 'Procurement [Marketing Department]',
      agenda: 'Tender Bidder Envelope Verification & Seal Integrity Review',
      decisions: 'Implemented tamper-evident barcode seal on incoming tender boxes. Escalation documented.',
      actionOwner: 'Kiran Reddy, Lead Auditor',
      date: '11-Aug-2026',
      status: 'UNDER_REVIEW'
    },
    {
      id: 'mum-3',
      unit: 'Annaprasadam Trust and Canteens TML & TPT',
      agenda: 'Cold Storage Thermograph Log & Temperature Baseline Audit',
      decisions: 'Calibrated sensory temperature logger units across both TML and TPT canteens.',
      actionOwner: 'Manoj Varma, Compliance Inspector',
      date: '10-Aug-2026',
      status: 'COMPLIANT'
    },
    {
      id: 'mum-4',
      unit: 'Donor cell along with Concurrent audit on donation of all allied trusts and Srivani Trust Receipts [Tirumali]',
      agenda: 'Srivani Trust Donation Digital Receipt & Concurrent Register Review',
      decisions: 'Confirmed 100% matched reconciliation between electronic gateway receipts and bank deposit slips.',
      actionOwner: 'Auditor Compliance Cell',
      date: '08-Aug-2026',
      status: 'COMPLIANT'
    }
  ]);

  // ── Progressive Web App (PWA) Install State ──

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isPwaInstallable, setIsPwaInstallable] = useState(false);
  const [showPwaModal, setShowPwaModal] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsPwaInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    window.addEventListener('appinstalled', () => {
      setIsPwaInstallable(false);
      setDeferredPrompt(null);
      console.log('✅ CA Buddy PWA successfully installed!');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsPwaInstallable(false);
      }
      setDeferredPrompt(null);
    } else {
      setShowPwaModal(true);
    }
  };

  // ── Live Backend Data Fetching ──

  const refreshAllData = useCallback(async () => {
    try {
      const [usersRes, attRes, asnRes, cmpRes, dutyRes] = await Promise.all([
        fetch(`${API_BASE}/users`),
        fetch(`${API_BASE}/attendance`),
        fetch(`${API_BASE}/assignments`),
        fetch(`${API_BASE}/complaints`),
        fetch(`${API_BASE}/daily-reports`)
      ]);

      const usersData = await usersRes.json();
      if (usersData.success) setUsersDb(usersData.users);

      const attData = await attRes.json();
      if (attData.success) setAttendanceLedger(attData.attendance);

      const asnData = await asnRes.json();
      if (asnData.success) setAssignmentsDb(asnData.assignments);

      const cmpData = await cmpRes.json();
      if (cmpData.success) setComplaintsDb(cmpData.complaints);

      const dutyData = await dutyRes.json();
      if (dutyData.success && dutyData.reports) setDutySubmittedReports(dutyData.reports);

    } catch (err) {
      console.warn('Backend API sync notice:', err);
    }
  }, []);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Real-time server clock ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Quick Demo Role Switcher
  const handleSelectDemoRole = (roleKey) => {
    if (roleKey === 'SUPER_ADMIN') {
      setLoginEmail('admin@eluc');
      setLoginPassword('1234567');
    } else if (roleKey === 'MANAGER') {
      setLoginEmail('manager@eluc');
      setLoginPassword('1234567');
    } else {
      setLoginEmail('auditor@eluc');
      setLoginPassword('1234567');
    }
  };

  // Instant 1-Click Login from Quick Login Widget / Modal
  const handleQuickLoginRole = async (roleKey) => {
    handleSelectDemoRole(roleKey);
    let targetEmail = 'admin@eluc';
    let targetPwd = '1234567';
    if (roleKey === 'MANAGER') {
      targetEmail = 'manager@eluc';
      targetPwd = '1234567';
    } else if (roleKey === 'USER') {
      targetEmail = 'auditor@eluc';
      targetPwd = '1234567';
    }
    setLoginEmail(targetEmail);
    setLoginPassword(targetPwd);
    setShowQuickLoginModal(false);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, password: targetPwd })
      });
      const data = await res.json();

      if (data.success) {
        setCurrentUser(data.user);
        setIsLoggedIn(true);
        setSessionLoginTime(data.serverTimestamp);
        refreshAllData();
      }
    } catch (err) {
      console.error('Quick login error:', err);
    }
  };

  // 1. Backend Login (Captures Login Timestamp for ANY role)
  const handleSignIn = async (e) => {
    if (e) e.preventDefault();

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();

      if (data.success) {
        setCurrentUser(data.user);
        setIsLoggedIn(true);
        setSessionLoginTime(data.serverTimestamp);
        refreshAllData();
      }
    } catch (err) {
      console.error('Login error:', err);
    }
  };


  // 2. Backend Logout (Records Server Authoritative Exit Timestamp for ALL Roles at Any Time)
  const handleLogout = async () => {
    let recordedTime = currentTimeStr;
    try {
      if (currentUser) {
        const res = await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id })
        });
        const data = await res.json();
        if (data.success) {
          recordedTime = data.serverLogoutTime;
        }
      }
    } catch (err) {
      console.error('Logout error:', err);
    }

    // Show Brief Server Stamped Confirmation Toast
    setIsWidgetOpen(false);
    setLogoutToast({
      time: recordedTime,
      userName: currentUser?.name || 'User'
    });

    setTimeout(() => {
      setLogoutToast(null);
      setIsLoggedIn(false);
      setCurrentUser(null);
      setSessionLoginTime(null);
      setAuthView('signin');
      refreshAllData();
    }, 1200);
  };

  // ── Auto-Populate Duty Parameters on Login ──
  useEffect(() => {
    if (currentUser) {
      setDutyFullName(currentUser.name || 'Audit Articled Assistant');
      setDutyStudentRegNo(currentUser.studentRegNo || 'SRO' + Math.floor(100000 + Math.random() * 900000));
      if (currentUser.unit && currentUser.unit !== 'All Enterprise Units') {
        setDutyUnitDetails(currentUser.unit);
      }
    }
    if (sessionLoginTime) {
      setDutyLoginTime(sessionLoginTime);
    } else {
      setDutyLoginTime(currentTimeStr);
    }
  }, [currentUser, sessionLoginTime, currentTimeStr]);

  // ── Submit Daily Audit Duty & Work Reporting Sheet (11 Parameters) ──
  const handleSaveDutyReport = async (shouldLogout = false) => {
    const finalLogoutTime = shouldLogout ? currentTimeStr : (dutyLogoutTime || null);

    const payload = {
      userId: currentUser?.id,
      loginTime: dutyLoginTime || currentTimeStr,
      fullName: dutyFullName.trim() || currentUser?.name || 'Audit Student',
      studentRegNo: dutyStudentRegNo.trim() || 'SRO0684920',
      unitDetails: dutyUnitDetails,
      subUnitDetails: dutySubUnitDetails.trim() || 'General Unit Counter',
      auditWorkType: dutyAuditWorkType,
      workObjective: dutyWorkObjective.trim(),
      targetToAchieve: dutyTargetToAchieve.trim(),
      caRemarks: dutyCaRemarks.trim(),
      pocName: dutyPocName.trim(),
      logoutTime: finalLogoutTime,
      status: shouldLogout ? 'COMPLETED & LOGGED OUT' : 'SUBMITTED'
    };

    try {
      const res = await fetch(`${API_BASE}/daily-reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.reports) {
        setDutySubmittedReports(data.reports);
      } else {
        setDutySubmittedReports(prev => [payload, ...prev]);
      }
    } catch (err) {
      console.warn('Save daily report local fallback:', err);
      setDutySubmittedReports(prev => [payload, ...prev]);
    }

    setDutySubmitSuccess(true);

    if (shouldLogout) {
      setTimeout(() => {
        handleLogout();
      }, 1400);
    } else {
      setTimeout(() => {
        setDutySubmitSuccess(false);
      }, 3500);
    }
  };





  // 6. MANAGER DECIDES & UPDATES USER ROLE
  const handleSaveUserRole = async (e) => {
    e.preventDefault();
    if (!editingRoleUser) return;

    try {
      const res = await fetch(`${API_BASE}/users/${editingRoleUser.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleTitle: selectedRoleTitle,
          unit: selectedRoleUnit
        })
      });
      const data = await res.json();

      if (data.success) {
        setEditingRoleUser(null);
        refreshAllData();
      }
    } catch (err) {
      console.error('Role update error:', err);
    }
  };

  // 7. Dispatch Task / Create Assignment (Universal Support for All Roles)
  const handleCreateAssignment = async (e) => {
    if (e) e.preventDefault();
    if (!assignTaskTitle.trim()) return;

    try {
      const fallbackUser = usersDb.find(u => u.role === 'USER') || usersDb[0] || { id: 'usr-3', name: 'Field Auditor' };
      const targetUser = usersDb.find(u => u.id === assignTargetUserId) || fallbackUser;
      const effectiveManagerId = currentUser?.id || 'usr-2';

      const res = await fetch(`${API_BASE}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedToId: targetUser.id,
          managerId: effectiveManagerId,
          unit: assignUnit,
          taskTitle: assignTaskTitle.trim(),
          instructions: assignInstructions.trim() || 'Verify physical compliance and upload evidence document.',
          deadline: assignDeadline
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowAssignModal(false);
        setAssignTaskTitle('');
        setAssignInstructions('');
        refreshAllData();
      }
    } catch (err) {
      console.error('Assignment error:', err);
    }
  };

  // 7b. MUM (Monthly Unit Monitoring) Minutes Saver
  const handleSaveMumMinutes = (e) => {
    if (e) e.preventDefault();
    if (!mumAgenda.trim()) return;

    const newRecord = {
      id: `mum-${Date.now()}`,
      unit: mumMinutesUnit,
      agenda: mumAgenda.trim(),
      decisions: mumDecisions.trim() || 'All action items and concurrent audit queries reviewed in monthly committee.',
      actionOwner: mumActionOwner.trim() || (currentUser?.name || 'Department Manager'),
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      dueDate: mumDueDate,
      status: 'COMPLIANT'
    };

    setMumRecords(prev => [newRecord, ...prev]);
    setMumSubmitSuccess(true);

    setTimeout(() => {
      setMumSubmitSuccess(false);
      setMumTab('records');
      setMumAgenda('');
      setMumDecisions('');
      setMumActionOwner('');
    }, 1200);
  };

  // Provision New User
  const handleCreateUser = async (e) => {

    e.preventDefault();
    if (!newUserName || !newUserEmail) return;

    try {
      const res = await fetch(`${API_BASE}/users`, {

        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUserName.trim(),
          email: newUserEmail.trim().toLowerCase(),
          password: newUserPassword || '1234567',
          roleTitle: newUserRoleTitle,
          unit: newUserUnit,
          managerId: currentUser?.role === 'MANAGER' ? currentUser.id : 'usr-1'
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateUserModal(false);
        setNewUserName('');
        setNewUserEmail('');
        refreshAllData();
      }
    } catch (err) {
      console.error('User create error:', err);
    }
  };

  return (
    <div className="webapp-shell">

      
      {/* ── Sticky Top Web App Navigation Bar ── */}
      <header className="webapp-navbar">
        <div className="webapp-navbar-inner">
          <div className="webapp-brand-left">
            <div className="brand-emblem-mini">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v4M4.93 10.93a7 7 0 1 0 9.9 0L12 8l-2.83 2.93z" />
                <path d="M9 18h6M10 22h4" />
              </svg>
            </div>
            <div className="brand-name-group">
              <span className="brand-title">CA Buddy</span>
              <span className="brand-sub">Enterprise Audit & Robot Vault</span>
            </div>
          </div>

          <div className="webapp-nav-controls">
            <div className="nav-aux-group">
              <div className="live-clock-pill">
                <span className="pulse-dot-live"></span>
                <span>{currentTimeStr}</span>
              </div>

              {/* PWA Install Button */}
              <button 
                type="button"
                className="btn-pwa-install"
                onClick={handleInstallClick}
                title="Install CA Buddy as Desktop / Mobile App"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <span>Install App</span>
                {isPwaInstallable && (
                  <span className="pulse-dot-live" style={{ background: '#FACC15', width: 6, height: 6, marginLeft: 2 }} />
                )}
              </button>
            </div>

            {isLoggedIn && (
              <div className="nav-user-auth-group">
                <span className={`role-badge-pill ${
                  currentUser.role === 'SUPER_ADMIN' ? 'role-super' : 
                  currentUser.role === 'MANAGER' ? 'role-manager' : 'role-user'
                }`}>
                  {currentUser.role === 'SUPER_ADMIN' ? '👑 Super Admin' : 
                   currentUser.role === 'MANAGER' ? '💼 Manager' : '📋 Auditor'}
                </span>

                <button 
                  className="dash-logout-corner" 
                  onClick={handleLogout}
                  title="End Session & Record Logout Timestamp"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                  </svg>
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* ── Main Web App Body Area ── */}
      <main className="webapp-main-content">

        {!isLoggedIn ? (
          authView === 'signin' ? (
            /* ═══════════════════════════════════════════════════════
               ── SIGN IN SCREEN (CENTERED WEB APP CARD) ──
               ═══════════════════════════════════════════════════════ */
            <div className="webapp-auth-center">
              <div className="brand-top-header">
                <div className="brand-emblem-badge">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v4M4.93 10.93a7 7 0 1 0 9.9 0L12 8l-2.83 2.93z" />
                    <path d="M9 18h6M10 22h4" />
                  </svg>
                </div>
                <div className="brand-company-title">CA Buddy</div>
                <div className="brand-company-tagline">Centralized Multi-Role Audit & Robot Vault</div>
              </div>


              <h1 className="auth-title">Sign In</h1>

              <form onSubmit={handleSignIn} className="auth-form-stack">
                <div className="input-pill-wrapper">
                  <svg className="input-pill-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="3" y="5" width="18" height="14" rx="3"/>
                    <polyline points="3 7 12 13 21 7"/>
                  </svg>
                  <input 
                    type="text" 
                    className="input-pill-field"
                    placeholder="Login ID / Email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                </div>

                <div className="input-pill-wrapper">
                  <svg className="input-pill-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="3" y="11" width="18" height="11" rx="3" ry="3"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    className="input-pill-field"
                    placeholder="Password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                  <button 
                    type="button" 
                    className="input-pill-action"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M2 9a7 7 0 0 1 10-6 7 7 0 0 1 10 6"/>
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M2 15a7 7 0 0 0 10 6 7 7 0 0 0 10-6"/>
                    </svg>
                  </button>
                </div>

                <div className="forgot-pwd-row">
                  <a className="forgot-pwd-link" onClick={() => setShowForgotModal(true)}>
                    Forgotten Password?
                  </a>
                </div>

                <button type="submit" className="btn-pill-primary">
                  Sign In
                </button>
              </form>

              <div className="or-divider">OR</div>

              <div className="social-login-row">
                <div className="social-circle-btn x-btn" onClick={() => handleSignIn()} title="Sign in with X">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
                <div className="social-circle-btn fb-btn" onClick={() => handleSignIn()} title="Sign in with Facebook">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
                <div className="social-circle-btn google-btn" onClick={() => handleSignIn()} title="Sign in with Google">
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                </div>
              </div>

              <div className="auth-switch-footer">
                Robot Backend Connected • <strong>Port 5001</strong>
              </div>
            </div>
          ) : null
        ) : (
          /* ═══════════════════════════════════════════════════════
             ── NEW PAGE: DAILY AUDIT DUTY & WORK REPORTING SHEET ──
             ═══════════════════════════════════════════════════════ */
          <div className="duty-sheet-card">
            
            {/* Header Banner */}
            <div className="duty-header-banner">
              <div className="duty-header-left">
                <div className="duty-emblem">🏛️</div>
                <div className="duty-header-titles">
                  <h3>Daily Audit Duty & Work Reporting Sheet</h3>
                  <p>TTD Concurrent & Internal Audit Management Cell</p>
                </div>
              </div>

              <div className="duty-header-badges">
                <div className="duty-date-badge">
                  📅 {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
                <div className="duty-live-badge">
                  <span className="pulse-dot-live"></span>
                  LIVE DUTY SESSION
                </div>
              </div>
            </div>

            {/* Success Alert Banner */}
            {dutySubmitSuccess && (
              <div className="duty-success-alert">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>✅</span>
                  <div>
                    <strong style={{ fontSize: '0.875rem' }}>Daily Duty Sheet Submitted Successfully!</strong>
                    <p style={{ fontSize: '0.75rem', margin: 0 }}>Recorded on central server with verified timestamp.</p>
                  </div>
                </div>
                <span style={{ fontSize: '0.725rem', fontWeight: '800', background: '#FFFFFF', padding: '0.25rem 0.6rem', borderRadius: '6px' }}>
                  ⏱️ {currentTimeStr}
                </span>
              </div>
            )}

            {/* Navigation Tabs between Duty Sheet & Submitted History */}
            <div className="dash-tab-strip" style={{ marginBottom: '1.5rem' }}>
              <button 
                type="button"
                className={`dash-tab-btn ${dutyActiveTab === 'sheet' ? 'active' : ''}`}
                onClick={() => setDutyActiveTab('sheet')}
              >
                📝 Daily Audit Duty Sheet (11 Parameters)
              </button>
              <button 
                type="button"
                className={`dash-tab-btn ${dutyActiveTab === 'records' ? 'active' : ''}`}
                onClick={() => setDutyActiveTab('records')}
              >
                📋 Today's Submitted Reports ({dutySubmittedReports.length})
              </button>
            </div>

            {dutyActiveTab === 'sheet' && (
              <form onSubmit={(e) => { e.preventDefault(); handleSaveDutyReport(false); }}>
                
                <div className="duty-form-grid">
                  
                  {/* Parameter 1: Login Time */}
                  <div className="duty-field-wrapper">
                    <label className="duty-field-label">
                      <span>⏱️ 1. Login Time</span>
                      <span className="req">*</span>
                    </label>
                    <input 
                      type="text" 
                      className="duty-input-box time-box"
                      value={dutyLoginTime || currentTimeStr}
                      onChange={(e) => setDutyLoginTime(e.target.value)}
                      placeholder="e.g. 09:00:00 AM"
                      required
                    />
                    <span className="duty-field-hint">Auto-captured from verified server sign-in</span>
                  </div>

                  {/* Parameter 2: Full Name */}
                  <div className="duty-field-wrapper">
                    <label className="duty-field-label">
                      <span>👤 2. Full Name</span>
                      <span className="req">*</span>
                    </label>
                    <input 
                      type="text" 
                      className="duty-input-box"
                      value={dutyFullName}
                      onChange={(e) => setDutyFullName(e.target.value)}
                      placeholder="e.g. Ravi Teja / Audit Student Name"
                      required
                    />
                    <span className="duty-field-hint">Auditor / Articled Assistant Name</span>
                  </div>

                  {/* Parameter 3: Student Registration No. */}
                  <div className="duty-field-wrapper">
                    <label className="duty-field-label">
                      <span>🎓 3. Student Registration No.</span>
                      <span className="req">*</span>
                    </label>
                    <input 
                      type="text" 
                      className="duty-input-box"
                      value={dutyStudentRegNo}
                      onChange={(e) => setDutyStudentRegNo(e.target.value.toUpperCase())}
                      placeholder="e.g. SRO0684920 / CRO123456"
                      required
                    />
                    <span className="duty-field-hint">ICAI / SRO / CRO / NRO Student Reg. No.</span>
                  </div>

                  {/* Parameter 4: TTD Audit Unit Details attending today */}
                  <div className="duty-field-wrapper">
                    <label className="duty-field-label">
                      <span>🏛️ 4. TTD Audit Unit Details attending today</span>
                      <span className="req">*</span>
                    </label>
                    <select 
                      className="duty-input-box"
                      value={dutyUnitDetails}
                      onChange={(e) => setDutyUnitDetails(e.target.value)}
                      required
                    >
                      {ORGANIZATIONAL_UNITS.map((unit, idx) => (
                        <option key={idx} value={unit}>{unit}</option>
                      ))}
                    </select>
                    <span className="duty-field-hint">Select the designated TTD organizational unit</span>
                  </div>

                  {/* Parameter 5: TTD Audit Sub-Unit Details attending today */}
                  <div className="duty-field-wrapper">
                    <label className="duty-field-label">
                      <span>🏢 5. TTD Audit Sub-Unit Details attending today</span>
                      <span className="req">*</span>
                    </label>
                    <input 
                      type="text" 
                      className="duty-input-box"
                      value={dutySubUnitDetails}
                      onChange={(e) => setDutySubUnitDetails(e.target.value)}
                      placeholder="e.g. Cold Storage Thermograph Section / Counter No. 4 / Daily Token Drawer"
                      required
                    />
                    <span className="duty-field-hint">Specific department room, section, or counter</span>
                  </div>

                  {/* Parameter 6: Type of audit work done for */}
                  <div className="duty-field-wrapper">
                    <label className="duty-field-label">
                      <span>🔍 6. Type of audit work done for</span>
                      <span className="req">*</span>
                    </label>
                    <select 
                      className="duty-input-box"
                      value={dutyAuditWorkType}
                      onChange={(e) => setDutyAuditWorkType(e.target.value)}
                      required
                    >
                      {AUDIT_WORK_TYPES.map((type, idx) => (
                        <option key={idx} value={type}>{type}</option>
                      ))}
                    </select>
                    <span className="duty-field-hint">Classification of audit exercise</span>
                  </div>

                  {/* Parameter 7: Today's work Objective */}
                  <div className="duty-field-wrapper full-row">
                    <label className="duty-field-label">
                      <span>🎯 7. Today's work Objective</span>
                      <span className="req">*</span>
                    </label>
                    <textarea 
                      className="duty-textarea-box"
                      rows="3"
                      value={dutyWorkObjective}
                      onChange={(e) => setDutyWorkObjective(e.target.value)}
                      placeholder="State the primary audit goals, verification scope, token counts, or records to examine today..."
                      required
                    />
                    <span className="duty-field-hint">Detail the scope and targets for today's session</span>
                  </div>

                  {/* Parameter 8: Today's work to be achieved by end of day */}
                  <div className="duty-field-wrapper full-row">
                    <label className="duty-field-label">
                      <span>🏆 8. Today's work to be achieved by end of day</span>
                      <span className="req">*</span>
                    </label>
                    <textarea 
                      className="duty-textarea-box"
                      rows="3"
                      value={dutyTargetToAchieve}
                      onChange={(e) => setDutyTargetToAchieve(e.target.value)}
                      placeholder="Specify deliverables: e.g. 100% token count completed, 45 vouchers verified, temperature logs reconciled..."
                      required
                    />
                    <span className="duty-field-hint">Expected completion milestones by End of Day (EOD)</span>
                  </div>

                  {/* Parameter 9: Remarks that you need the CA heading audit/management team of audit to know */}
                  <div className="duty-field-wrapper full-row">
                    <label className="duty-field-label">
                      <span>⚠️ 9. Remarks that you need the CA heading audit / management team of audit to know</span>
                    </label>
                    <textarea 
                      className="duty-textarea-box"
                      rows="3"
                      value={dutyCaRemarks}
                      onChange={(e) => setDutyCaRemarks(e.target.value)}
                      placeholder="Note down critical observations, stock variances, missing tokens, register delays, or escalations for Principal CA & Manager..."
                    />
                    <span className="duty-field-hint">High priority findings for the CA in-charge & management</span>
                  </div>

                  {/* Parameter 10: Point of Contact Name [ POC ] within the unit */}
                  <div className="duty-field-wrapper">
                    <label className="duty-field-label">
                      <span>🤝 10. Point of Contact Name [ POC ] within the unit</span>
                      <span className="req">*</span>
                    </label>
                    <input 
                      type="text" 
                      className="duty-input-box"
                      value={dutyPocName}
                      onChange={(e) => setDutyPocName(e.target.value)}
                      placeholder="e.g. Sri S. Ramana Murthy, Superintendent / AEO"
                      required
                    />
                    <span className="duty-field-hint">Designated TTD officer or unit in-charge</span>
                  </div>

                  {/* Parameter 11: Logout Time */}
                  <div className="duty-field-wrapper">
                    <label className="duty-field-label">
                      <span>🚪 11. Logout Time</span>
                    </label>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <input 
                        type="text" 
                        className="duty-input-box time-box"
                        value={dutyLogoutTime || 'Pending at EOD'}
                        onChange={(e) => setDutyLogoutTime(e.target.value)}
                        placeholder="e.g. 05:30:00 PM"
                      />
                      <button 
                        type="button"
                        className="btn-pill-primary"
                        style={{ padding: '0.5rem 0.85rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                        onClick={() => setDutyLogoutTime(currentTimeStr)}
                        title="Stamp Current Time as Logout Time"
                      >
                        ⏱️ Stamp Now
                      </button>
                    </div>
                    <span className="duty-field-hint">Official departure timestamp stamped upon day completion</span>
                  </div>

                </div>

                {/* Form Action Controls */}
                <div className="duty-action-group">
                  <button 
                    type="submit" 
                    className="btn-duty-submit"
                  >
                    <span>💾 Submit Daily Duty Sheet</span>
                  </button>

                  <button 
                    type="button" 
                    className="btn-duty-logout"
                    onClick={() => {
                      setDutyLogoutTime(currentTimeStr);
                      handleSaveDutyReport(true);
                    }}
                    title="Save Report & Conclude Session with Logout"
                  >
                    <span>⏱️ Submit & Conclude Logout</span>
                  </button>
                </div>

              </form>
            )}

            {/* Today's Submitted Duty Records Tab */}
            {dutyActiveTab === 'records' && (
              <div className="duty-recent-table-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div>
                    <h5 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0F172A' }}>Today's Duty Records</h5>
                    <p style={{ fontSize: '0.725rem', color: '#64748B' }}>Audit logs filed during today's shift</p>
                  </div>
                  <span style={{ fontSize: '0.725rem', background: '#ECFDF5', color: '#047857', padding: '0.25rem 0.6rem', borderRadius: '8px', fontWeight: '800' }}>
                    ● Central Database Synced
                  </span>
                </div>

                <div className="responsive-cards-grid">
                  {dutySubmittedReports.map((rep, idx) => (
                    <div key={rep.id || idx} className="enterprise-account-card">
                      <div className="acc-card-header">
                        <div>
                          <span className="user-unit-tag" style={{ marginBottom: 4 }}>{rep.unitDetails}</span>
                          <span className="acc-name-text" style={{ display: 'block', fontSize: '0.9rem' }}>{rep.fullName}</span>
                        </div>
                        <span className="role-badge-pill role-user">
                          {rep.studentRegNo || 'STUDENT'}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.75rem', color: '#334155', margin: '0.4rem 0', fontWeight: '600' }}>
                        📍 Sub-Unit: <strong>{rep.subUnitDetails}</strong> • Type: <strong>{rep.auditWorkType}</strong>
                      </div>

                      <div className="acc-time-grid">
                        <div>
                          <span>LOGIN TIME</span>
                          <strong>{rep.loginTime}</strong>
                        </div>
                        <div>
                          <span>LOGOUT TIME</span>
                          <strong style={{ color: rep.logoutTime ? '#0F172A' : '#10B981' }}>
                            {rep.logoutTime || '● Active Duty'}
                          </strong>
                        </div>
                      </div>

                      <div style={{ background: '#F8FAFC', padding: '0.5rem 0.65rem', borderRadius: '10px', fontSize: '0.725rem', color: '#475569', marginTop: '0.4rem' }}>
                        <div>🎯 <strong>Objective:</strong> {rep.workObjective || 'General Audit Verification'}</div>
                        <div style={{ marginTop: '0.25rem' }}>🏆 <strong>Target:</strong> {rep.targetToAchieve || 'Standard compliance verified'}</div>
                        {rep.caRemarks && (
                          <div style={{ marginTop: '0.25rem', color: '#B45309' }}>
                            ⚠️ <strong>CA Remarks:</strong> {rep.caRemarks}
                          </div>
                        )}
                        <div style={{ marginTop: '0.25rem', color: '#047857' }}>
                          🤝 <strong>Unit POC:</strong> {rep.pocName || 'Not specified'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {dutySubmittedReports.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#94A3B8', fontSize: '0.85rem' }}>
                    No duty sheets filed yet for today. Use the "Daily Audit Duty Sheet" tab to submit.
                  </div>
                )}
              </div>
            )}

          </div>
        )}


      {/* ── Toast Modal: Server Stamped Logout Confirmation ── */}

      {logoutToast && (
        <div className="logout-stamp-toast">
          <div style={{ fontSize: '1.5rem', marginBottom: '0.35rem' }}>🔒</div>
          <h5 style={{ fontSize: '0.95rem', fontWeight: '800', marginBottom: '0.25rem' }}>
            Logged Out Successfully
          </h5>
          <p style={{ fontSize: '0.75rem', color: '#CBD5E1', lineHeight: 1.35 }}>
            Exit timestamp stamped on backend at:
          </p>
          <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#FACC15', marginTop: '0.35rem' }}>
            ⏱️ {logoutToast.time}
          </div>
        </div>
      )}

      {/* ── Modal: Document Previewer (PDF & Image Viewer) ── */}
      {viewingDoc && (
        <div className="modal-overlay" onClick={() => setViewingDoc(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h4>Document Evidence Viewer</h4>
                <p style={{ fontSize: '0.725rem', color: '#64748B' }}>{viewingDoc.fileName} • {viewingDoc.fileSize || 'Verified Document'}</p>
              </div>
              <button className="close-btn" onClick={() => setViewingDoc(null)}>✕</button>
            </div>

            <div className="doc-viewer-container">
              {viewingDoc.fileType?.includes('image') || (viewingDoc.fileData && viewingDoc.fileData.startsWith('data:image')) ? (
                <img 
                  src={viewingDoc.fileData || viewingDoc.sampleFileUrl || 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&auto=format&fit=crop&q=80'} 
                  alt="Audit Evidence" 
                  className="doc-viewer-img"
                />
              ) : (
                <div className="doc-viewer-pdf-frame">
                  <div style={{ width: 56, height: 56, borderRadius: '16px', background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>
                    📄
                  </div>
                  <h5 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0F172A' }}>{viewingDoc.fileName}</h5>
                  <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px', maxWidth: '280px' }}>
                    Official PDF Audit Verification Document certified by the Robot Backend Vault.
                  </p>
                  <a 
                    href={viewingDoc.fileData || viewingDoc.sampleFileUrl || '#'} 
                    target="_blank" 
                    rel="noreferrer"
                    style={{ textDecoration: 'none', width: '100%', marginTop: '1rem' }}
                  >
                    <button type="button" className="btn-pill-primary">
                      📥 Open / Download Full PDF
                    </button>
                  </a>
                </div>
              )}

              <div style={{ width: '100%', background: '#F8FAFC', padding: '0.65rem 0.85rem', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '0.725rem', color: '#475569' }}>
                <div>📌 <strong>Title / Category:</strong> {viewingDoc.title}</div>
                {viewingDoc.remarks && <div style={{ marginTop: 2 }}>📝 <strong>Notes:</strong> {viewingDoc.remarks}</div>}
                {viewingDoc.auditorName && <div style={{ marginTop: 2 }}>👤 <strong>Submitted By:</strong> {viewingDoc.auditorName}</div>}
              </div>

              <button 
                type="button" 
                className="btn-pill-primary"
                style={{ marginTop: '0.35rem' }}
                onClick={() => setViewingDoc(null)}
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Manager Decides User Role ── */}
      {editingRoleUser && (
        <div className="modal-overlay" onClick={() => setEditingRoleUser(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h4>Decide User Role & Permissions</h4>
                <p style={{ fontSize: '0.725rem', color: '#64748B' }}>User: <strong>{editingRoleUser.name}</strong></p>
              </div>
              <button className="close-btn" onClick={() => setEditingRoleUser(null)}>✕</button>
            </div>

            <form onSubmit={handleSaveUserRole} className="auth-form-stack">
              <div>
                <label className="sub-risk-label">Select Designated Auditor Role:</label>
                <select 
                  className="unit-select-custom"
                  value={selectedRoleTitle}
                  onChange={(e) => setSelectedRoleTitle(e.target.value)}
                >
                  {AUDITOR_ROLES.map((roleOpt, idx) => (
                    <option key={idx} value={roleOpt}>{roleOpt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="sub-risk-label">Assigned Organizational Unit:</label>
                <button 
                  type="button"
                  className="unit-picker-trigger-btn"
                  onClick={() => setUnitPickerModal({
                    title: 'Select Designated Unit',
                    subtitle: `Assign organizational unit to ${editingRoleUser.name}`,
                    allowAll: false,
                    currentValue: selectedRoleUnit,
                    onSelect: (val) => setSelectedRoleUnit(val)
                  })}
                >
                  <div className="unit-trigger-text">
                    <span className="unit-trigger-sub">Assigned Unit</span>
                    <strong className="unit-trigger-val">{selectedRoleUnit}</strong>
                  </div>
                  <svg className="unit-trigger-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
              </div>

              <button type="submit" className="btn-pill-primary" style={{ marginTop: '0.5rem' }}>
                Save & Enforce Role
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Manager Assigns Work ── */}
      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Assign Work to Field Auditor</h4>
              <button className="close-btn" onClick={() => setShowAssignModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateAssignment} className="auth-form-stack">
              <div>
                <label className="sub-risk-label">Select Field Auditor:</label>
                <select 
                  className="unit-select-custom"
                  style={{ marginBottom: 0 }}
                  value={assignTargetUserId}
                  onChange={(e) => setAssignTargetUserId(e.target.value)}
                >
                  {(managerTeamUsers.length > 0 ? managerTeamUsers : (usersDb.filter(u => u.role === 'USER').length > 0 ? usersDb.filter(u => u.role === 'USER') : usersDb)).map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.roleTitle || 'Auditor'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="sub-risk-label">Target Organizational Unit:</label>
                <button 
                  type="button"
                  className="unit-picker-trigger-btn"
                  onClick={() => setUnitPickerModal({
                    title: 'Select Target Unit',
                    subtitle: 'Assign work to department unit',
                    allowAll: false,
                    currentValue: assignUnit,
                    onSelect: (val) => setAssignUnit(val)
                  })}
                >
                  <div className="unit-trigger-text">
                    <span className="unit-trigger-sub">Target Unit</span>
                    <strong className="unit-trigger-val">{assignUnit}</strong>
                  </div>
                  <svg className="unit-trigger-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
              </div>

              <div>
                <label className="sub-risk-label">Task Title / Audit Scope:</label>
                <input 
                  type="text" 
                  className="input-pill-field" 
                  style={{ padding: '0.75rem 1rem' }}
                  placeholder="e.g. Day-End Cash & Token Physical Verification"
                  value={assignTaskTitle}
                  onChange={(e) => setAssignTaskTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="sub-risk-label">Manager Specific Instructions:</label>
                <textarea 
                  rows="2"
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '10px', border: '1px solid var(--border-input)', fontSize: '0.8rem' }}
                  placeholder="Instructions for auditor regarding vouchers, token tallies..."
                  value={assignInstructions}
                  onChange={(e) => setAssignInstructions(e.target.value)}
                />
              </div>

              <div>
                <label className="sub-risk-label">Target Completion Deadline:</label>
                <input 
                  type="text" 
                  className="input-pill-field" 
                  style={{ padding: '0.75rem 1rem' }}
                  placeholder="e.g. Today, 05:30 PM"
                  value={assignDeadline}
                  onChange={(e) => setAssignDeadline(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-pill-primary" style={{ marginTop: '0.5rem' }}>
                Dispatch Assignment
              </button>
            </form>

          </div>
        </div>
      )}

      {/* ── Modal: User Provisioning ── */}
      {showCreateUserModal && (
        <div className="modal-overlay" onClick={() => setShowCreateUserModal(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Create Account</h4>
              <button className="close-btn" onClick={() => setShowCreateUserModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateUser} className="auth-form-stack">
              <div>
                <label className="sub-risk-label">Full Name:</label>
                <input 
                  type="text" 
                  className="input-pill-field" 
                  style={{ padding: '0.75rem 1rem' }}
                  placeholder="e.g. Ramesh Babu, ACA"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="sub-risk-label">Login Email ID:</label>
                <input 
                  type="email" 
                  className="input-pill-field" 
                  style={{ padding: '0.75rem 1rem' }}
                  placeholder="e.g. ramesh@eluc"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="sub-risk-label">Initial Password:</label>
                <input 
                  type="text" 
                  className="input-pill-field" 
                  style={{ padding: '0.75rem 1rem' }}
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="sub-risk-label">Designation & Role:</label>
                <select 
                  className="unit-select-custom"
                  style={{ marginBottom: 0 }}
                  value={newUserRoleTitle}
                  onChange={(e) => setNewUserRoleTitle(e.target.value)}
                >
                  <option value="Field Auditor">Field Auditor</option>
                  <option value="Junior Auditor">Junior Auditor</option>
                  <option value="Senior Field Staff">Senior Field Staff</option>
                  <option value="Lead Auditor">Lead Auditor</option>
                  <option value="Compliance Officer">Compliance Officer</option>
                </select>
              </div>

              <div>
                <label className="sub-risk-label">Assigned Organizational Unit:</label>
                <button 
                  type="button"
                  className="unit-picker-trigger-btn"
                  onClick={() => setUnitPickerModal({
                    title: 'Select User Unit',
                    subtitle: 'Assign default unit to new user account',
                    allowAll: false,
                    currentValue: newUserUnit,
                    onSelect: (val) => setNewUserUnit(val)
                  })}
                >
                  <div className="unit-trigger-text">
                    <span className="unit-trigger-sub">Assigned Unit</span>
                    <strong className="unit-trigger-val">{newUserUnit}</strong>
                  </div>
                  <svg className="unit-trigger-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
              </div>

              <button type="submit" className="btn-pill-primary" style={{ marginTop: '0.5rem' }}>
                Create Account
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Forgot Password ── */}
      {showForgotModal && (
        <div className="modal-overlay" onClick={() => setShowForgotModal(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Account Recovery</h4>
              <button className="close-btn" onClick={() => setShowForgotModal(false)}>✕</button>
            </div>
            {recoverySuccess ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.5rem', fontSize: '1.25rem', fontWeight: 'bold' }}>✓</div>
                <h5 style={{ fontSize: '0.95rem', color: '#0F172A', marginBottom: '0.25rem' }}>Reset Instructions Dispatched</h5>
                <p style={{ fontSize: '0.75rem', color: '#64748B' }}>Contact your department manager or check email for access PIN.</p>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); setRecoverySuccess(true); setTimeout(() => { setShowForgotModal(false); setRecoverySuccess(false); }, 1800); }}>
                <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '1rem' }}>
                  Enter your registered work email or login ID to request an administrator password reset.
                </p>
                <input 
                  type="text" 
                  className="input-pill-field"
                  style={{ padding: '0.85rem 1rem', marginBottom: '1rem' }}
                  placeholder="Work Email or Login ID"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  required
                />
                <button type="submit" className="btn-pill-primary">
                  Request Manager Reset
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Universal In-App Unit Picker Bottom Sheet Modal (No OS Overflows) ── */}
      {unitPickerModal && (
        <div className="modal-overlay" onClick={() => setUnitPickerModal(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '85%' }}>
            <div className="modal-header">
              <div>
                <h4>🏢 {unitPickerModal.title}</h4>
                <p style={{ fontSize: '0.725rem', color: '#64748B', marginTop: 2 }}>{unitPickerModal.subtitle}</p>
              </div>
              <button className="close-btn" onClick={() => setUnitPickerModal(null)}>✕</button>
            </div>

            <div className="unit-picker-list">
              {unitPickerModal.allowAll && (
                <div 
                  className={`unit-picker-item ${unitPickerModal.currentValue === 'ALL' ? 'active' : ''}`}
                  onClick={() => {
                    unitPickerModal.onSelect('ALL');
                    setUnitPickerModal(null);
                  }}
                >
                  <div className="unit-item-badge">🌐</div>
                  <div className="unit-item-content">
                    <span className="unit-item-title">All 8 Organizational Units</span>
                    {unitPickerModal.currentValue === 'ALL' && (
                      <span className="unit-item-check">✓ Active Scope</span>
                    )}
                  </div>
                </div>
              )}

              {ORGANIZATIONAL_UNITS.map((unitName, idx) => {
                const isSelected = unitPickerModal.currentValue === unitName;
                return (
                  <div 
                    key={idx}
                    className={`unit-picker-item ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      unitPickerModal.onSelect(unitName);
                      setUnitPickerModal(null);
                    }}
                  >
                    <div className="unit-item-badge">#{idx + 1}</div>
                    <div className="unit-item-content">
                      <span className="unit-item-title">{unitName}</span>
                      {isSelected && (
                        <span className="unit-item-check">✓ Selected</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Quick Login / Role Switcher (from Widget Button) ── */}
      {showQuickLoginModal && (
        <div className="modal-overlay" onClick={() => setShowQuickLoginModal(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h4>🔑 Authentication & Role Switcher</h4>
                <p style={{ fontSize: '0.725rem', color: '#64748B' }}>
                  {isLoggedIn ? `Currently logged in as ${currentUser?.name}` : 'Select a demo role or enter credentials'}
                </p>
              </div>
              <button className="close-btn" onClick={() => setShowQuickLoginModal(false)}>✕</button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label className="sub-risk-label" style={{ marginBottom: '0.5rem' }}>1-Click Demo Login as Role:</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => handleQuickLoginRole('SUPER_ADMIN')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 0.95rem',
                    borderRadius: '14px',
                    border: '1.5px solid #DDD6FE',
                    background: '#F5F3FF',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>👑</span>
                    <div>
                      <strong style={{ fontSize: '0.85rem', color: '#5B21B6', display: 'block' }}>Super Administrator</strong>
                      <span style={{ fontSize: '0.685rem', color: '#6D28D9' }}>Full Vault Access, Evidence PDFs & Accounts</span>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.725rem', color: '#7C3AED', fontWeight: '800' }}>Enter →</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLoginRole('MANAGER')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 0.95rem',
                    borderRadius: '14px',
                    border: '1.5px solid #BFDBFE',
                    background: '#EFF6FF',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>💼</span>
                    <div>
                      <strong style={{ fontSize: '0.85rem', color: '#1E40AF', display: 'block' }}>Department Manager</strong>
                      <span style={{ fontSize: '0.685rem', color: '#256BF5' }}>Decide Auditor Roles, Assign Tasks & Remarks</span>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.725rem', color: '#256BF5', fontWeight: '800' }}>Enter →</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLoginRole('USER')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 0.95rem',
                    borderRadius: '14px',
                    border: '1.5px solid #A7F3D0',
                    background: '#ECFDF5',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>📋</span>
                    <div>
                      <strong style={{ fontSize: '0.85rem', color: '#065F46', display: 'block' }}>Field Auditor</strong>
                      <span style={{ fontSize: '0.685rem', color: '#059669' }}>Sub-Risk Reports, Vault PDF Uploads & Shifts</span>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.725rem', color: '#059669', fontWeight: '800' }}>Enter →</span>
                </button>
              </div>
            </div>

            <div className="or-divider">OR USE CUSTOM CREDENTIALS</div>

            <form onSubmit={(e) => { e.preventDefault(); setShowQuickLoginModal(false); handleSignIn(e); }} className="auth-form-stack">
              <input
                type="text"
                className="input-pill-field"
                style={{ padding: '0.75rem 1rem' }}
                placeholder="Login ID / Email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
              <input
                type="password"
                className="input-pill-field"
                style={{ padding: '0.75rem 1rem' }}
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
              <button type="submit" className="btn-pill-primary">
                Sign In With Credentials
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: MUM (Monthly Unit Monitoring & Minutes of Meeting) ── */}
      {showMumModal && (
        <div className="modal-overlay" onClick={() => setShowMumModal(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '88%' }}>
            <div className="modal-header">
              <div>
                <h4>🏛️ MUM — Monthly Unit Monitoring</h4>
                <p style={{ fontSize: '0.725rem', color: '#64748B' }}>
                  Minutes of Users Meeting & 8-Unit Continuous Governance
                </p>
              </div>
              <button className="close-btn" onClick={() => setShowMumModal(false)}>✕</button>
            </div>

            <div className="mum-kpi-summary">
              <div className="mum-kpi-card">
                <span>Monitored</span>
                <strong>8 Units</strong>
              </div>
              <div className="mum-kpi-card">
                <span>Status</span>
                <strong style={{ color: '#10B981' }}>100% Active</strong>
              </div>
              <div className="mum-kpi-card">
                <span>MUM Records</span>
                <strong style={{ color: '#256BF5' }}>{mumRecords.length} Logged</strong>
              </div>
            </div>

            {/* MUM Internal Sub-Tabs */}
            <div className="dash-tab-strip" style={{ marginBottom: '0.85rem' }}>
              <button 
                type="button"
                className={`dash-tab-btn ${mumTab === 'units_matrix' ? 'active' : ''}`}
                onClick={() => setMumTab('units_matrix')}
              >
                📊 Unit Status Matrix
              </button>
              <button 
                type="button"
                className={`dash-tab-btn ${mumTab === 'log_minutes' ? 'active' : ''}`}
                onClick={() => setMumTab('log_minutes')}
              >
                📝 Log MUM Minutes
              </button>
              <button 
                type="button"
                className={`dash-tab-btn ${mumTab === 'records' ? 'active' : ''}`}
                onClick={() => setMumTab('records')}
              >
                📜 Records ({mumRecords.length})
              </button>
            </div>

            <div className="mum-modal-body">
              {/* Tab 1: Unit Status Matrix */}
              {mumTab === 'units_matrix' && (
                <div>
                  <p style={{ fontSize: '0.725rem', color: '#64748B', marginBottom: '0.65rem' }}>
                    Continuous monthly audit health & risk matrix across official units:
                  </p>

                  {ORGANIZATIONAL_UNITS.map((unitName, idx) => {
                    const unitUsers = usersDb.filter(u => u.unit === unitName);
                    const unitComplaints = complaintsDb.filter(c => c.unit === unitName);
                    const unitMinutes = mumRecords.filter(m => m.unit === unitName);
                    const isCompliant = unitComplaints.filter(c => c.urgency === 'CRITICAL').length === 0;

                    return (
                      <div key={idx} className="mum-unit-item-card">
                        <div className="mum-unit-top">
                          <div>
                            <span className="user-unit-tag" style={{ marginBottom: 3 }}>Unit #{idx + 1}</span>
                            <h6 className="mum-unit-title">{unitName}</h6>
                          </div>
                          <span className={`mum-status-chip ${isCompliant ? 'mum-status-active' : 'mum-status-review'}`}>
                            {isCompliant ? '● Compliant' : '⚠️ Action Required'}
                          </span>
                        </div>

                        <div className="mum-unit-meta-grid">
                          <div>👥 Staff: <strong>{unitUsers.length > 0 ? `${unitUsers.length} Auditors` : '1 Assigned'}</strong></div>
                          <div>📑 Evidence: <strong>{unitComplaints.length} Records</strong></div>
                          <div>🗓️ MUM Minutes: <strong>{unitMinutes.length > 0 ? `${unitMinutes.length} Logged` : 'Scheduled'}</strong></div>
                          <div>🔒 Status: <strong style={{ color: isCompliant ? '#059669' : '#D97706' }}>Verified</strong></div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.4rem' }}>
                          <button
                            type="button"
                            style={{
                              background: '#F1F5F9',
                              border: '1px solid #CBD5E1',
                              padding: '0.25rem 0.55rem',
                              borderRadius: '6px',
                              fontSize: '0.65rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                              color: '#0F172A'
                            }}
                            onClick={() => {
                              setMumMinutesUnit(unitName);
                              setMumTab('log_minutes');
                            }}
                          >
                            + Record Minutes
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tab 2: Log Meeting Minutes */}
              {mumTab === 'log_minutes' && (
                <form onSubmit={handleSaveMumMinutes} className="mum-form-grid">
                  <div>
                    <label className="sub-risk-label">Select Department / Organizational Unit:</label>
                    <button 
                      type="button"
                      className="unit-picker-trigger-btn"
                      onClick={() => setUnitPickerModal({
                        title: 'Select Unit for MUM Minutes',
                        subtitle: 'Select department unit for minutes entry',
                        allowAll: false,
                        currentValue: mumMinutesUnit,
                        onSelect: (val) => setMumMinutesUnit(val)
                      })}
                    >
                      <div className="unit-trigger-text">
                        <span className="unit-trigger-sub">Target Unit</span>
                        <strong className="unit-trigger-val">{mumMinutesUnit}</strong>
                      </div>
                      <svg className="unit-trigger-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </button>
                  </div>

                  <div>
                    <label className="sub-risk-label">Meeting Agenda / Audit Objective:</label>
                    <input
                      type="text"
                      className="input-pill-field"
                      style={{ padding: '0.75rem 1rem' }}
                      placeholder="e.g. Monthly Concurrent Token & Register Audit Review"
                      value={mumAgenda}
                      onChange={(e) => setMumAgenda(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="sub-risk-label">Key Resolutions & Action Decisions:</label>
                    <textarea
                      rows="3"
                      style={{
                        width: '100%',
                        padding: '0.65rem',
                        borderRadius: '10px',
                        border: '1.5px solid var(--border-input)',
                        fontSize: '0.8rem',
                        fontFamily: 'inherit',
                        outline: 'none'
                      }}
                      placeholder="Detail the decisions reached, corrective protocols agreed, and audit notes..."
                      value={mumDecisions}
                      onChange={(e) => setMumDecisions(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div>
                      <label className="sub-risk-label">Responsible Person:</label>
                      <input
                        type="text"
                        className="input-pill-field"
                        style={{ padding: '0.65rem 0.85rem', fontSize: '0.785rem' }}
                        placeholder="e.g. Lead Auditor"
                        value={mumActionOwner}
                        onChange={(e) => setMumActionOwner(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="sub-risk-label">Target Due Date:</label>
                      <input
                        type="text"
                        className="input-pill-field"
                        style={{ padding: '0.65rem 0.85rem', fontSize: '0.785rem' }}
                        value={mumDueDate}
                        onChange={(e) => setMumDueDate(e.target.value)}
                      />
                    </div>
                  </div>

                  {mumSubmitSuccess && (
                    <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '0.65rem', borderRadius: '12px', textAlign: 'center', fontSize: '0.75rem', fontWeight: '700' }}>
                      ✓ MUM Meeting Minutes Certified & Stamped into Audit Log!
                    </div>
                  )}

                  <button type="submit" className="btn-pill-primary" style={{ marginTop: '0.35rem' }}>
                    📜 Save & Stamp MUM Minutes
                  </button>
                </form>
              )}

              {/* Tab 3: Records Archive */}
              {mumTab === 'records' && (
                <div>
                  <p style={{ fontSize: '0.725rem', color: '#64748B', marginBottom: '0.65rem' }}>
                    Historical Minutes of Users Meeting (MUM) entries and committee decisions:
                  </p>

                  {mumRecords.map(rec => (
                    <div key={rec.id} className="mum-timeline-card">
                      <div className="mum-timeline-header">
                        <span className="user-unit-tag">{rec.unit}</span>
                        <span style={{ fontSize: '0.65rem', fontWeight: '800', background: '#ECFDF5', color: '#047857', padding: '0.15rem 0.45rem', borderRadius: '6px', border: '1px solid #A7F3D0' }}>
                          ● {rec.status}
                        </span>
                      </div>
                      <h6 className="mum-timeline-agenda">{rec.agenda}</h6>
                      <p className="mum-timeline-desc">{rec.decisions}</p>
                      <div className="mum-timeline-footer">
                        <span>👤 Owner: <strong>{rec.actionOwner}</strong></span>
                        <span>🗓️ <strong>{rec.date}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Background Click-Backdrop when Widget is Open (After Login) ── */}
      {isLoggedIn && isWidgetOpen && (
        <div className="widget-click-backdrop" onClick={() => setIsWidgetOpen(false)} />
      )}

      {/* ── Right Bottom Corner Widget Button & 4-Sections Menu (Only Shown After Login) ── */}
      {isLoggedIn && (
        <div className="corner-widget-container">
          {isWidgetOpen && (
            <div className="widget-popup-menu" onClick={(e) => e.stopPropagation()}>
              <div className="widget-menu-header">
                <div className="widget-header-title">
                  <span style={{ fontSize: '1rem' }}>⚡</span>
                  <div>
                    <h5>Operations Widget</h5>
                    <span className="widget-header-sub">4 Quick Sections</span>
                  </div>
                </div>
                <button 
                  type="button" 
                  className="widget-close-mini"
                  onClick={() => setIsWidgetOpen(false)}
                  title="Close Widget Menu"
                >
                  ✕
                </button>
              </div>

              <div className="widget-sections-stack">
                {/* Section 1: Login Button */}
                <button 
                  type="button" 
                  className="widget-section-btn btn-login"
                  onClick={() => {
                    setIsWidgetOpen(false);
                    setShowQuickLoginModal(true);
                  }}
                >
                  <div className="widget-icon-pill login">🔑</div>
                  <div className="widget-item-content">
                    <span className="widget-item-name">Login</span>
                    <span className="widget-item-desc">
                      Switch account ({currentUser?.name?.split(' ')[0]})
                    </span>
                  </div>
                  <span className="widget-arrow-icon">→</span>
                </button>

                {/* Section 2: Log out Button */}
                <button 
                  type="button" 
                  className="widget-section-btn btn-logout"
                  onClick={() => {
                    setIsWidgetOpen(false);
                    handleLogout();
                  }}
                >
                  <div className="widget-icon-pill logout">🚪</div>
                  <div className="widget-item-content">
                    <span className="widget-item-name">Log out</span>
                    <span className="widget-item-desc">
                      Stamp exit time & end session
                    </span>
                  </div>
                  <span className="widget-arrow-icon">→</span>
                </button>

                {/* Section 3: MUM Button */}
                <button 
                  type="button" 
                  className="widget-section-btn btn-mum"
                  onClick={() => {
                    setIsWidgetOpen(false);
                    setShowMumModal(true);
                  }}
                >
                  <div className="widget-icon-pill mum">🏛️</div>
                  <div className="widget-item-content">
                    <span className="widget-item-name">MUM</span>
                    <span className="widget-item-desc">Monthly Unit Monitoring & Minutes</span>
                  </div>
                  <span className="widget-arrow-icon">→</span>
                </button>

                {/* Section 4: Create Task Button */}
                <button 
                  type="button" 
                  className="widget-section-btn btn-createtask"
                  onClick={() => {
                    setIsWidgetOpen(false);
                    if (!assignTargetUserId && usersDb.length > 0) {
                      const fallbackAuditor = usersDb.find(u => u.role === 'USER') || usersDb[0];
                      setAssignTargetUserId(fallbackAuditor.id);
                    }
                    setShowAssignModal(true);
                  }}
                >
                  <div className="widget-icon-pill createtask">📋</div>
                  <div className="widget-item-content">
                    <span className="widget-item-name">Create Task</span>
                    <span className="widget-item-desc">Dispatch audit task & instructions</span>
                  </div>
                  <span className="widget-arrow-icon">→</span>
                </button>
              </div>
            </div>
          )}

          {/* Floating Action Trigger Button (Right Bottom Corner) */}
          <button 
            type="button"
            className={`corner-widget-fab ${isWidgetOpen ? 'open' : ''}`}
            onClick={() => setIsWidgetOpen(!isWidgetOpen)}
            title="Quick Operations Widget"
            aria-label="Toggle Quick Operations Widget"
          >
            <div className="fab-icon-wrapper">
              {isWidgetOpen ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                </svg>
              )}
            </div>
            {!isWidgetOpen && <span className="fab-badge-chip">4</span>}
          </button>
        </div>
      )}


      {/* ── Modal: PWA Web App Installation Guide ── */}
      {showPwaModal && (
        <div className="modal-overlay" onClick={() => setShowPwaModal(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h4>📥 Install CA Buddy Web App</h4>
                <p style={{ fontSize: '0.725rem', color: '#64748B' }}>Standalone native experience for macOS, Windows, iOS & Android</p>
              </div>
              <button className="close-btn" onClick={() => setShowPwaModal(false)}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', margin: '0.5rem 0 1.25rem' }}>
              <div style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: '14px', padding: '0.85rem' }}>
                <strong style={{ fontSize: '0.825rem', color: '#0F172A', display: 'block', marginBottom: '4px' }}>💻 Desktop (Chrome, Edge & Brave):</strong>
                <p style={{ fontSize: '0.75rem', color: '#475569', lineHeight: 1.4 }}>
                  Click the <strong>Install icon (⊕ or 💻)</strong> on the right side of the browser address bar, or click <strong>Install App</strong> in the top navigation bar.
                </p>
              </div>

              <div style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: '14px', padding: '0.85rem' }}>
                <strong style={{ fontSize: '0.825rem', color: '#0F172A', display: 'block', marginBottom: '4px' }}>📱 iOS (iPhone & iPad Safari):</strong>
                <p style={{ fontSize: '0.75rem', color: '#475569', lineHeight: 1.4 }}>
                  Tap the <strong>Share icon</strong> at the bottom of Safari, scroll down and tap <strong>"Add to Home Screen"</strong>.
                </p>
              </div>

              <div style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: '14px', padding: '0.85rem' }}>
                <strong style={{ fontSize: '0.825rem', color: '#0F172A', display: 'block', marginBottom: '4px' }}>🤖 Android (Chrome):</strong>
                <p style={{ fontSize: '0.75rem', color: '#475569', lineHeight: 1.4 }}>
                  Tap the three-dots menu (⋮) at the top-right of Chrome, then select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                </p>
              </div>
            </div>

            <button 
              type="button" 
              className="btn-pill-primary"
              onClick={() => {
                if (deferredPrompt) {
                  deferredPrompt.prompt();
                  setShowPwaModal(false);
                } else {
                  setShowPwaModal(false);
                }
              }}
            >
              {deferredPrompt ? '🚀 Launch Direct Installation' : '✓ Got It / Close'}
            </button>
          </div>
        </div>
      )}

      </main>
    </div>
  );
}


