import React, { useState, useEffect, useCallback, useRef } from 'react';
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

// Predefined Sub-Risk Categories
const SUB_RISK_OPTIONS = [
  'Inventory Discrepancy & Stock Reconciliation',
  'Cash Collection & Token Reconciliation',
  'Tender Compliance & Vendor Billing Irregularity',
  'Asset Custody & Physical Verification',
  'Statutory Register Non-Compliance',
  'Others (Manual Specification)'
];

export default function App() {
  // ── Auth & Current Session ──
  const [authView, setAuthView] = useState('signin');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [sessionLoginTime, setSessionLoginTime] = useState(null);
  const [logoutToast, setLogoutToast] = useState(null);

  // Sign In form inputs
  const [loginEmail, setLoginEmail] = useState('admin@eluc');
  const [loginPassword, setLoginPassword] = useState('1234567');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedDemoRole, setSelectedDemoRole] = useState('SUPER_ADMIN');

  // Navigation tab state per portal
  const [adminTab, setAdminTab] = useState('complaints_vault'); // 'complaints_vault', 'accounts_directory'
  const [managerTab, setManagerTab] = useState('team_users'); // 'team_users', 'team_complaints', 'assignments', 'team_timestamps'
  const [userTab, setUserTab] = useState('upload_report'); // 'upload_report', 'my_assignment'

  // Master State Stores
  const [usersDb, setUsersDb] = useState([]);
  const [attendanceLedger, setAttendanceLedger] = useState([]);
  const [assignmentsDb, setAssignmentsDb] = useState([]);
  const [complaintsDb, setComplaintsDb] = useState([]);

  // Field User Shift Clock
  const [isUserClockedIn, setIsUserClockedIn] = useState(true);
  const [currentTimeStr, setCurrentTimeStr] = useState('10:45 AM');

  // ── Super Admin Filters ──
  const [adminUnitFilter, setAdminUnitFilter] = useState('ALL');
  const [adminUrgencyFilter, setAdminUrgencyFilter] = useState('ALL');

  // ── Field User: Sub-Risk & Upload State ──
  const [selectedSubRisk, setSelectedSubRisk] = useState(SUB_RISK_OPTIONS[0]);
  const [customProblemDetail, setCustomProblemDetail] = useState('');
  const [reportUrgency, setReportUrgency] = useState('HIGH');
  const [reportRemarks, setReportRemarks] = useState('');
  
  // File Upload State
  const [uploadedFile, setUploadedFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('IDLE'); // 'IDLE', 'UPLOADING', 'SUCCESS', 'ERROR'
  const [robotReceipt, setRobotReceipt] = useState(null);
  const fileInputRef = useRef(null);

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

  // Manager Remark Text State
  const [remarkInputs, setRemarkInputs] = useState({});

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

  // ── Live Backend Data Fetching ──
  const refreshAllData = useCallback(async () => {
    try {
      const [usersRes, attRes, asnRes, cmpRes] = await Promise.all([
        fetch(`${API_BASE}/users`),
        fetch(`${API_BASE}/attendance`),
        fetch(`${API_BASE}/assignments`),
        fetch(`${API_BASE}/complaints`)
      ]);

      const usersData = await usersRes.json();
      if (usersData.success) setUsersDb(usersData.users);

      const attData = await attRes.json();
      if (attData.success) setAttendanceLedger(attData.attendance);

      const asnData = await asnRes.json();
      if (asnData.success) setAssignmentsDb(asnData.assignments);

      const cmpData = await cmpRes.json();
      if (cmpData.success) setComplaintsDb(cmpData.complaints);
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
    setSelectedDemoRole(roleKey);
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
    } else if (roleKey === 'USER') {
      targetEmail = 'auditor@eluc';
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
        setIsUserClockedIn(true);
        setSessionLoginTime(data.serverTimestamp);

        if (data.user.role === 'SUPER_ADMIN') {
          setAdminTab('complaints_vault');
        } else if (data.user.role === 'MANAGER') {
          setManagerTab('team_users');
        } else {
          setUserTab('upload_report');
        }

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
        setIsUserClockedIn(true);
        setSessionLoginTime(data.serverTimestamp);

        if (data.user.role === 'SUPER_ADMIN') {
          setAdminTab('complaints_vault');
        } else if (data.user.role === 'MANAGER') {
          setManagerTab('team_users');
        } else {
          setUserTab('upload_report');
        }

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


  // 3. User Shift Clock Toggle (Field Users Only)
  const handleUserClockToggle = async () => {
    try {
      const res = await fetch(`${API_BASE}/attendance/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser?.id, isClockedIn: isUserClockedIn })
      });
      const data = await res.json();
      if (data.success) {
        setIsUserClockedIn(!isUserClockedIn);
        refreshAllData();
      }
    } catch (err) {
      console.error('Clock toggle error:', err);
    }
  };

  // 4. File Selection Handler (Images & PDF)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFile(file);
      setUploadStatus('IDLE');
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 5. Submit Complaint & Upload to Robot Backend Vault
  const handleSendToRobotVault = async (e) => {
    if (e) e.preventDefault();

    const finalTitle = selectedSubRisk === 'Others (Manual Specification)'
      ? (customProblemDetail.trim() || 'Custom Field Observation')
      : selectedSubRisk;

    if (selectedSubRisk === 'Others (Manual Specification)' && !customProblemDetail.trim()) {
      alert('Please explain the problem details in the specification box.');
      return;
    }

    setUploadStatus('UPLOADING');

    try {
      const payload = {
        unit: currentUser?.unit || ORGANIZATIONAL_UNITS[0],
        title: finalTitle,
        category: selectedSubRisk,
        urgency: reportUrgency,
        remarks: reportRemarks || (selectedSubRisk === 'Others (Manual Specification)' ? customProblemDetail : 'Sub-risk evidence document submitted for review.'),
        fileName: uploadedFile ? uploadedFile.name : 'evidence_doc.pdf',
        fileType: uploadedFile ? uploadedFile.type : 'application/pdf',
        fileSize: uploadedFile ? `${(uploadedFile.size / 1024).toFixed(1)} KB` : '320 KB',
        fileData: filePreviewUrl || null,
        auditorId: currentUser?.id || 'usr-3',
        auditorName: currentUser?.name || 'Field Auditor'
      };

      const res = await fetch(`${API_BASE}/complaints/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        setUploadStatus('SUCCESS');
        setRobotReceipt(data.receiptToken);
        setCustomProblemDetail('');
        setReportRemarks('');
        setUploadedFile(null);
        setFilePreviewUrl(null);
        refreshAllData();
      } else {
        setUploadStatus('ERROR');
      }
    } catch (err) {
      console.error('Upload to robot vault error:', err);
      setUploadStatus('ERROR');
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

  // 8. Manager Saves Remark on Auditor Attendance
  const handleSaveRemark = async (logId) => {
    const remarkText = remarkInputs[logId];
    if (!remarkText) return;

    try {
      const res = await fetch(`${API_BASE}/attendance/${logId}/remark`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remarks: remarkText })
      });
      const data = await res.json();
      if (data.success) {
        setRemarkInputs(prev => ({ ...prev, [logId]: '' }));
        refreshAllData();
      }
    } catch (err) {
      console.error('Remark error:', err);
    }
  };

  // 9. Provision New User
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

  // Filtered Super Admin Complaints
  const structuredAdminComplaints = complaintsDb.filter(c => {
    const matchesUnit = adminUnitFilter === 'ALL' || c.unit === adminUnitFilter;
    const matchesUrgency = adminUrgencyFilter === 'ALL' || c.urgency?.toUpperCase() === adminUrgencyFilter.toUpperCase();
    return matchesUnit && matchesUrgency;
  });

  // Filtered Manager Team Complaints
  const managerTeamComplaints = complaintsDb.filter(c => {
    if (currentUser?.role === 'MANAGER') {
      return c.managerId === currentUser.id;
    }
    return true;
  });

  // Filtered Manager Team Timestamps
  const managerTeamAttendance = attendanceLedger.filter(item => {
    if (currentUser?.role === 'MANAGER') {
      return item.managerId === currentUser.id;
    }
    return true;
  });

  // Filtered Manager Team Users
  const managerTeamUsers = usersDb.filter(u => {
    if (currentUser?.role === 'MANAGER') {
      return u.managedBy === currentUser.id;
    }
    return true;
  });

  // Active User Assignment
  const currentUserAssignment = assignmentsDb.find(a => a.assignedToId === currentUser?.id);

  return (
    <div className="device-container">
      
      {/* ── Top iOS Status Bar & Dynamic Island ── */}
      <div className="status-bar">
        <span className="status-time">10:45</span>
        <div className="dynamic-island"></div>
        <div className="status-icons">
          <svg width="15" height="11" viewBox="0 0 17 11" fill="currentColor">
            <rect y="7" width="2.5" height="4" rx="0.5"/>
            <rect x="4.5" y="5" width="2.5" height="6" rx="0.5"/>
            <rect x="9" y="2.5" width="2.5" height="8.5" rx="0.5"/>
            <rect x="13.5" width="2.5" height="11" rx="0.5"/>
          </svg>
          <svg width="15" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
            <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
            <line x1="12" y1="20" x2="12.01" y2="20"/>
          </svg>
          <svg width="18" height="10" viewBox="0 0 22 11" fill="currentColor">
            <rect x="0.5" y="0.5" width="18" height="10" rx="2.5" fill="none" stroke="currentColor"/>
            <rect x="2" y="2" width="12" height="7" rx="1.5"/>
            <path d="M20 4v3" stroke="currentColor" strokeLinecap="round"/>
          </svg>
        </div>
      </div>

      {/* ── Scrollable Body Area ── */}
      <div className="screen-scroll-body">

        {!isLoggedIn ? (
          authView === 'signin' ? (
            /* ═══════════════════════════════════════════════════════
               ── SIGN IN SCREEN (WITH 1-CLICK ROLE CHIPS) ──
               ═══════════════════════════════════════════════════════ */
            <div>
              <div className="role-demo-bar">
                <button 
                  type="button"
                  className={`role-demo-chip ${selectedDemoRole === 'SUPER_ADMIN' ? 'active' : ''}`}
                  onClick={() => handleSelectDemoRole('SUPER_ADMIN')}
                >
                  👑 Super Admin
                </button>
                <button 
                  type="button"
                  className={`role-demo-chip ${selectedDemoRole === 'MANAGER' ? 'active' : ''}`}
                  onClick={() => handleSelectDemoRole('MANAGER')}
                >
                  💼 Manager
                </button>
                <button 
                  type="button"
                  className={`role-demo-chip ${selectedDemoRole === 'USER' ? 'active' : ''}`}
                  onClick={() => handleSelectDemoRole('USER')}
                >
                  📋 Field User
                </button>
              </div>

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
             ── LOGGED IN PORTAL (ROLE SEGREGATED) ──
             ═══════════════════════════════════════════════════════ */
          <div>
            {/* Header Topbar */}
            <div className="dash-topbar">
              <button 
                className="dash-logout-corner" 
                onClick={handleLogout}
                title="End Session & Record Logout Timestamp"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
                Log Out
              </button>

              <div style={{ textAlign: 'center' }}>
                <span className="dash-brand-title">CA Buddy</span>
                <span className={`role-badge-pill ${
                  currentUser.role === 'SUPER_ADMIN' ? 'role-super' : 
                  currentUser.role === 'MANAGER' ? 'role-manager' : 'role-user'
                }`} style={{ display: 'block', margin: '2px auto 0' }}>
                  {currentUser.role === 'SUPER_ADMIN' ? '👑 Executive Super Admin' : 
                   currentUser.role === 'MANAGER' ? '💼 Department Manager' : '📋 Field Auditor'}
                </span>
              </div>

              <div className="dash-avatar-badge" style={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                {currentUser?.name ? currentUser.name.substring(0, 2).toUpperCase() : 'CA'}
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════
               1. 👑 SUPER ADMIN PORTAL (VIEW ALL COMPLAINTS, PDFS & ACCOUNTS)
               ═══════════════════════════════════════════════════════ */}
            {currentUser.role === 'SUPER_ADMIN' && (
              <div>
                <div className="super-admin-banner">
                  <div className="super-meta-top">
                    <h5>👑 Enterprise Audit & Robot Vault</h5>
                    <span style={{ fontSize: '0.65rem', background: '#ECFDF5', color: '#047857', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: '800' }}>
                      ● LIVE AUDIT
                    </span>
                  </div>
                  <div className="super-kpi-grid">
                    <div className="super-kpi-chip">
                      <span>Accounts</span>
                      <strong>{usersDb.length}</strong>
                    </div>
                    <div className="super-kpi-chip">
                      <span>Evidence Files</span>
                      <strong>{complaintsDb.length}</strong>
                    </div>
                    <div className="super-kpi-chip">
                      <span>Active Shifts</span>
                      <strong style={{ color: '#10B981' }}>
                        {attendanceLedger.filter(l => l.active).length}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="dash-tab-strip">
                  <button 
                    className={`dash-tab-btn ${adminTab === 'complaints_vault' ? 'active' : ''}`}
                    onClick={() => setAdminTab('complaints_vault')}
                  >
                    📑 Complaints & Evidence ({structuredAdminComplaints.length})
                  </button>
                  <button 
                    className={`dash-tab-btn ${adminTab === 'accounts_directory' ? 'active' : ''}`}
                    onClick={() => setAdminTab('accounts_directory')}
                  >
                    👥 Accounts Directory ({usersDb.length})
                  </button>
                </div>

                {/* Super Admin: All Complaints & Evidence PDF/Image Viewer */}
                {adminTab === 'complaints_vault' && (
                  <div>
                    <div className="super-filter-card">
                      <div>
                        <label className="filter-group-header">🏢 Filter by Organization Unit:</label>
                        <button 
                          type="button"
                          className="unit-picker-trigger-btn"
                          onClick={() => setUnitPickerModal({
                            title: 'Select Scope / Unit Filter',
                            subtitle: 'Filter complaints & reports by department unit',
                            allowAll: true,
                            currentValue: adminUnitFilter,
                            onSelect: (val) => setAdminUnitFilter(val)
                          })}
                        >
                          <div className="unit-trigger-text">
                            <span className="unit-trigger-sub">Current Filter</span>
                            <strong className="unit-trigger-val">
                              {adminUnitFilter === 'ALL' ? '🌐 All 8 Organizational Units' : adminUnitFilter}
                            </strong>
                          </div>
                          <svg className="unit-trigger-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="6 9 12 15 18 9"/>
                          </svg>
                        </button>
                      </div>

                      <div>
                        <label className="filter-group-header">⚡ Filter by Severity Level:</label>
                        <div className="structured-filter-bar">
                          <button 
                            type="button"
                            className={`filter-pill ${adminUrgencyFilter === 'ALL' ? 'active' : ''}`}
                            onClick={() => setAdminUrgencyFilter('ALL')}
                          >
                            All Severity
                          </button>
                          <button 
                            type="button"
                            className={`filter-pill risk-crit ${adminUrgencyFilter === 'CRITICAL' ? 'active' : ''}`}
                            onClick={() => setAdminUrgencyFilter('CRITICAL')}
                          >
                            🔥 Critical
                          </button>
                          <button 
                            type="button"
                            className={`filter-pill risk-high ${adminUrgencyFilter === 'HIGH' ? 'active' : ''}`}
                            onClick={() => setAdminUrgencyFilter('HIGH')}
                          >
                            ⚠️ High
                          </button>
                          <button 
                            type="button"
                            className={`filter-pill risk-med ${adminUrgencyFilter === 'MEDIUM' ? 'active' : ''}`}
                            onClick={() => setAdminUrgencyFilter('MEDIUM')}
                          >
                            ⚡ Medium
                          </button>
                        </div>
                      </div>
                    </div>

                    {structuredAdminComplaints.map(cmp => (
                      <div key={cmp.id} className="complaint-evidence-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <span className="user-unit-tag" style={{ marginBottom: 4 }}>{cmp.unit}</span>
                            <h6 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0F172A', marginTop: 2 }}>
                              {cmp.title}
                            </h6>
                          </div>
                          <span style={{ 
                            fontSize: '0.65rem', 
                            fontWeight: '800', 
                            padding: '0.15rem 0.5rem', 
                            borderRadius: '6px',
                            background: cmp.urgency === 'CRITICAL' ? '#FEF2F2' : (cmp.urgency === 'HIGH' ? '#FFF7ED' : '#FFFBEB'),
                            color: cmp.urgency === 'CRITICAL' ? '#DC2626' : (cmp.urgency === 'HIGH' ? '#EA580C' : '#D97706'),
                            border: '1px solid currentColor'
                          }}>
                            {cmp.urgency} URGENCY
                          </span>
                        </div>

                        <p style={{ fontSize: '0.75rem', color: '#475569', lineHeight: 1.35 }}>
                          {cmp.remarks}
                        </p>

                        {/* File Attachment & Instant View Button */}
                        <div className="file-attachment-box">
                          <div className="file-info-group">
                            <div className={`file-icon-badge ${cmp.fileType?.includes('pdf') ? 'pdf' : 'img'}`}>
                              {cmp.fileType?.includes('pdf') ? 'PDF' : 'IMG'}
                            </div>
                            <div>
                              <div className="file-name-text">{cmp.fileName}</div>
                              <div style={{ fontSize: '0.625rem', color: '#94A3B8' }}>{cmp.fileSize || 'Verified File'}</div>
                            </div>
                          </div>
                          <button 
                            className="btn-view-doc"
                            onClick={() => setViewingDoc(cmp)}
                          >
                            👁️ View Document
                          </button>
                        </div>

                        <div className="audit-timeframe-box">
                          <span>⏱️ Timeframe:</span>
                          <strong>{cmp.timeFrame}</strong>
                          <span style={{ marginLeft: 'auto', color: '#10B981', fontWeight: '700' }}>● Robot Vault Verified</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.685rem', color: '#64748B', borderTop: '1px solid #F1F5F9', paddingTop: '0.35rem' }}>
                          <span>Auditor: <strong>{cmp.auditorName}</strong></span>
                          <span>Manager: <strong>{cmp.managerName}</strong></span>
                        </div>
                      </div>
                    ))}

                    {structuredAdminComplaints.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94A3B8', fontSize: '0.825rem' }}>
                        No complaint evidence records found matching current filters.
                      </div>
                    )}
                  </div>
                )}

                {/* Super Admin: Accounts Directory */}
                {adminTab === 'accounts_directory' && (
                  <div>
                    <div className="manager-action-bar">
                      <div>
                        <h5 style={{ fontSize: '0.875rem', fontWeight: '800', color: '#0F172A' }}>Enterprise Accounts Directory</h5>
                        <p style={{ fontSize: '0.7rem', color: '#64748B' }}>Complete staff roster with server timestamps</p>
                      </div>
                      <button className="btn-create-user" onClick={() => setShowCreateUserModal(true)}>
                        + Onboard User
                      </button>
                    </div>

                    {usersDb.map((user, index) => {
                      const userLog = attendanceLedger.find(l => l.userId === user.id || l.userEmail === user.email);
                      const loginTimeDisplay = userLog ? userLog.loginTime : (user.role === 'SUPER_ADMIN' ? '08:30:00 AM' : '09:00:00 AM');
                      const logoutTimeDisplay = userLog ? (userLog.logoutTime || (userLog.active ? '● On-Duty Active' : 'Logged Out')) : '● Active';

                      return (
                        <div key={user.id} className="enterprise-account-card">
                          <div className="acc-card-header">
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <span className="sno-pill">#{index + 1}</span>
                              <span className="acc-name-text">{user.name}</span>
                            </div>
                            <span className={`role-badge-pill ${
                              user.role === 'SUPER_ADMIN' ? 'role-super' : 
                              user.role === 'MANAGER' ? 'role-manager' : 'role-user'
                            }`}>
                              {user.roleTitle || user.role}
                            </span>
                          </div>

                          <div className="acc-email-sub">
                            ✉️ {user.email} • <strong>{user.unit}</strong>
                          </div>

                          <div className="acc-time-grid">
                            <div>
                              <span>LOGIN TIME</span>
                              <strong>{loginTimeDisplay}</strong>
                            </div>
                            <div>
                              <span>LOGOUT TIME</span>
                              <strong style={{ color: logoutTimeDisplay.includes('Active') ? '#10B981' : '#0F172A' }}>
                                {logoutTimeDisplay}
                              </strong>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════
               2. 💼 MANAGER PORTAL (DECIDE USER ROLES & VIEW TEAM COMPLAINTS)
               ═══════════════════════════════════════════════════════ */}
            {currentUser.role === 'MANAGER' && (
              <div>
                <div className="dash-tab-strip">
                  <button 
                    className={`dash-tab-btn ${managerTab === 'team_users' ? 'active' : ''}`}
                    onClick={() => setManagerTab('team_users')}
                  >
                    👥 Team Users ({managerTeamUsers.length})
                  </button>
                  <button 
                    className={`dash-tab-btn ${managerTab === 'team_complaints' ? 'active' : ''}`}
                    onClick={() => setManagerTab('team_complaints')}
                  >
                    📑 Complaints ({managerTeamComplaints.length})
                  </button>
                  <button 
                    className={`dash-tab-btn ${managerTab === 'assignments' ? 'active' : ''}`}
                    onClick={() => setManagerTab('assignments')}
                  >
                    📋 Assign Work
                  </button>
                  <button 
                    className={`dash-tab-btn ${managerTab === 'team_timestamps' ? 'active' : ''}`}
                    onClick={() => setManagerTab('team_timestamps')}
                  >
                    ⏱️ Timestamps
                  </button>
                </div>

                {/* 1. MANAGER: TEAM USERS WITH ROLE DECISION BUTTON */}
                {managerTab === 'team_users' && (
                  <div>
                    <div className="manager-action-bar">
                      <div>
                        <h5 style={{ fontSize: '0.875rem', fontWeight: '800', color: '#0F172A' }}>Auditor Team Roster</h5>
                        <p style={{ fontSize: '0.7rem', color: '#64748B' }}>You decide and assign each auditor's designated role</p>
                      </div>
                      <button className="btn-create-user" onClick={() => setShowCreateUserModal(true)}>
                        + Add Member
                      </button>
                    </div>

                    {managerTeamUsers.map((user, index) => (
                      <div key={user.id} className="enterprise-account-card">
                        <div className="acc-card-header">
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span className="sno-pill">#{index + 1}</span>
                            <span className="acc-name-text">{user.name}</span>
                          </div>
                          <span className="role-badge-pill role-user">
                            {user.roleTitle || 'Field Auditor'}
                          </span>
                        </div>

                        <div className="acc-email-sub">
                          ✉️ {user.email} • <strong>{user.unit}</strong>
                        </div>

                        {/* Manager Role Assignment Button */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #F1F5F9', paddingTop: '0.4rem', marginTop: '0.2rem' }}>
                          <button 
                            className="btn-create-user"
                            style={{ padding: '0.3rem 0.65rem', fontSize: '0.685rem' }}
                            onClick={() => {
                              setEditingRoleUser(user);
                              setSelectedRoleTitle(user.roleTitle || AUDITOR_ROLES[0]);
                              setSelectedRoleUnit(user.unit || ORGANIZATIONAL_UNITS[0]);
                            }}
                          >
                            ✏️ Decide User Role
                          </button>
                        </div>
                      </div>
                    ))}

                    {managerTeamUsers.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94A3B8', fontSize: '0.825rem' }}>
                        No team members registered yet under your jurisdiction.
                      </div>
                    )}
                  </div>
                )}

                {/* 2. MANAGER: TEAM COMPLAINTS & PDF/IMAGE VIEWER */}
                {managerTab === 'team_complaints' && (
                  <div>
                    <div style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h5 style={{ fontSize: '0.875rem', fontWeight: '800', color: '#0F172A' }}>
                          Team Complaints & Evidence ({currentUser.unit})
                        </h5>
                        <p style={{ fontSize: '0.7rem', color: '#64748B' }}>Audit evidence submitted by your field team</p>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: '700' }}>● Live Robot Sync</span>
                    </div>

                    {managerTeamComplaints.map(cmp => (
                      <div key={cmp.id} className="complaint-evidence-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <span className="user-unit-tag" style={{ marginBottom: 4 }}>{cmp.unit}</span>
                            <h6 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0F172A', marginTop: 2 }}>
                              {cmp.title}
                            </h6>
                          </div>
                          <span style={{ 
                            fontSize: '0.65rem', 
                            fontWeight: '800', 
                            padding: '0.15rem 0.5rem', 
                            borderRadius: '6px',
                            background: cmp.urgency === 'CRITICAL' ? '#FEF2F2' : '#FFF7ED',
                            color: cmp.urgency === 'CRITICAL' ? '#DC2626' : '#EA580C',
                            border: '1px solid currentColor'
                          }}>
                            {cmp.urgency}
                          </span>
                        </div>

                        <p style={{ fontSize: '0.75rem', color: '#475569', lineHeight: 1.35 }}>
                          {cmp.remarks}
                        </p>

                        <div className="file-attachment-box">
                          <div className="file-info-group">
                            <div className={`file-icon-badge ${cmp.fileType?.includes('pdf') ? 'pdf' : 'img'}`}>
                              {cmp.fileType?.includes('pdf') ? 'PDF' : 'IMG'}
                            </div>
                            <div>
                              <div className="file-name-text">{cmp.fileName}</div>
                              <div style={{ fontSize: '0.625rem', color: '#94A3B8' }}>{cmp.fileSize || 'Verified File'}</div>
                            </div>
                          </div>
                          <button 
                            className="btn-view-doc"
                            onClick={() => setViewingDoc(cmp)}
                          >
                            👁️ View Document
                          </button>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.685rem', color: '#64748B', borderTop: '1px solid #F1F5F9', paddingTop: '0.35rem' }}>
                          <span>Auditor: <strong>{cmp.auditorName}</strong></span>
                          <span>Timestamp: <strong>{cmp.serverTimestamp}</strong></span>
                        </div>
                      </div>
                    ))}

                    {managerTeamComplaints.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94A3B8', fontSize: '0.825rem' }}>
                        No complaint reports filed by your team yet today.
                      </div>
                    )}
                  </div>
                )}

                {/* 3. MANAGER: ASSIGN WORK */}
                {managerTab === 'assignments' && (
                  <div>
                    <div className="manager-action-bar">
                      <div>
                        <h5 style={{ fontSize: '0.875rem', fontWeight: '800', color: '#0F172A' }}>Work Assignments</h5>
                        <p style={{ fontSize: '0.7rem', color: '#64748B' }}>Dispatch audit tasks & instructions to auditors</p>
                      </div>
                      <button className="btn-create-user" onClick={() => setShowAssignModal(true)}>
                        + Assign Work
                      </button>
                    </div>

                    {assignmentsDb.filter(a => a.managerId === currentUser.id).map(asn => (
                      <div key={asn.id} className="assignment-card">
                        <div className="assignment-card-header">
                          <span className="user-unit-tag">{asn.unit}</span>
                          <span className="assignment-task-badge">{asn.status}</span>
                        </div>
                        <h6 style={{ fontSize: '0.875rem', fontWeight: '800', color: '#0F172A', marginTop: '0.25rem' }}>{asn.taskTitle}</h6>
                        <p style={{ fontSize: '0.75rem', color: '#475569', margin: '0.35rem 0', lineHeight: 1.3 }}>{asn.instructions}</p>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #F1F5F9', paddingTop: '0.4rem', fontSize: '0.685rem', color: '#64748B' }}>
                          <span>Assigned To: <strong>{asn.assignedToName}</strong></span>
                          <span>Deadline: <strong>{asn.deadline}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 4. MANAGER: TEAM TIMESTAMPS */}
                {managerTab === 'team_timestamps' && (
                  <div>
                    <div style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h5 style={{ fontSize: '0.875rem', fontWeight: '800', color: '#0F172A' }}>
                          Team Attendance & Timestamps ({currentUser.unit})
                        </h5>
                        <p style={{ fontSize: '0.7rem', color: '#64748B' }}>Server-authoritative timestamps for your team only</p>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: '700' }}>● Verified</span>
                    </div>

                    {managerTeamAttendance.map((item, index) => (
                      <div key={item.id} className="enterprise-account-card">
                        <div className="acc-card-header">
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span className="sno-pill">#{index + 1}</span>
                            <span className="acc-name-text">{item.userName}</span>
                          </div>
                          <span style={{ 
                            fontSize: '0.65rem', 
                            fontWeight: '700', 
                            padding: '0.15rem 0.5rem', 
                            borderRadius: 'var(--radius-pill)',
                            background: item.active ? '#ECFDF5' : '#F1F5F9',
                            color: item.active ? '#047857' : '#64748B'
                          }}>
                            {item.active ? '● Active On-Duty' : 'Logged Out'}
                          </span>
                        </div>

                        <div className="acc-email-sub">
                          ✉️ {item.userEmail} • <strong>{item.unit}</strong>
                        </div>

                        <div className="acc-time-grid">
                          <div>
                            <span>SERVER LOGIN TIME</span>
                            <strong>{item.loginTime}</strong>
                          </div>
                          <div>
                            <span>SERVER LOGOUT TIME</span>
                            <strong style={{ color: item.logoutTime ? '#0F172A' : '#10B981' }}>
                              {item.logoutTime || '● Currently Active'}
                            </strong>
                          </div>
                        </div>

                        <div style={{ fontSize: '0.725rem', color: '#475569', background: '#FFFBEB', padding: '0.45rem 0.65rem', borderRadius: '8px', border: '1px solid #FDE68A', marginTop: '0.2rem' }}>
                          <span>📝 <strong>Manager Remarks:</strong> {item.managerRemarks || 'No remarks added yet.'}</span>
                        </div>

                        <div className="manager-remark-box">
                          <input 
                            type="text" 
                            className="manager-remark-input"
                            placeholder="Add or update evaluation remark..."
                            value={remarkInputs[item.id] || ''}
                            onChange={(e) => setRemarkInputs({ ...remarkInputs, [item.id]: e.target.value })}
                          />
                          <button 
                            className="manager-remark-btn"
                            onClick={() => handleSaveRemark(item.id)}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════
               3. 📋 FIELD USER PORTAL (SUB-RISK SELECTION & FILE UPLOAD)
               ═══════════════════════════════════════════════════════ */}
            {currentUser.role === 'USER' && (
              <div>
                <div className="live-session-card">
                  <div className="session-meta">
                    <h5>
                      <span className="pulse-dot-live"></span>
                      {isUserClockedIn ? `Server Verified Shift: ${currentTimeStr}` : 'Shift Logged Out'}
                    </h5>
                    <p>
                      {currentUser.name} • <strong>{currentUser.roleTitle || 'Field Auditor'}</strong> ({currentUser.unit})
                    </p>
                  </div>
                  <button 
                    className={`clock-toggle-btn ${isUserClockedIn ? 'out' : 'in'}`}
                    onClick={handleUserClockToggle}
                  >
                    {isUserClockedIn ? 'Clock Out' : 'Clock In'}
                  </button>
                </div>

                <div className="dash-tab-strip">
                  <button 
                    className={`dash-tab-btn ${userTab === 'upload_report' ? 'active' : ''}`}
                    onClick={() => setUserTab('upload_report')}
                  >
                    📤 Upload & Report
                  </button>
                  <button 
                    className={`dash-tab-btn ${userTab === 'my_assignment' ? 'active' : ''}`}
                    onClick={() => setUserTab('my_assignment')}
                  >
                    📌 My Work Assignment
                  </button>
                </div>

                {/* Field User: Sub-Risk Selection & Image/PDF Upload */}
                {userTab === 'upload_report' && (
                  <div className="evo-card-container">
                    <div className="evo-header-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0F172A' }}>Field Complaint & Evidence Upload</h4>
                      <span style={{ fontSize: '0.725rem', color: '#10B981', fontWeight: '700' }}>● Robot Vault</span>
                    </div>

                    <form onSubmit={handleSendToRobotVault}>
                      {/* Sub-Risk Category Selection */}
                      <label className="sub-risk-label">Select Sub-Risk Category:</label>
                      <div className="sub-risk-grid">
                        {SUB_RISK_OPTIONS.map((riskOpt, idx) => (
                          <div 
                            key={idx}
                            className={`sub-risk-card ${selectedSubRisk === riskOpt ? 'selected' : ''}`}
                            onClick={() => setSelectedSubRisk(riskOpt)}
                          >
                            <span>{riskOpt}</span>
                            {selectedSubRisk === riskOpt && <span style={{ color: '#059669', fontWeight: 'bold' }}>✓</span>}
                          </div>
                        ))}
                      </div>

                      {/* Custom Problem Specification Box when "Others" is selected */}
                      {selectedSubRisk === 'Others (Manual Specification)' && (
                        <div className="custom-problem-card">
                          <label className="sub-risk-label" style={{ color: '#92400E' }}>
                            ✍️ Explain the Problem / Specific Issue:
                          </label>
                          <textarea 
                            rows="3"
                            style={{
                              width: '100%',
                              padding: '0.65rem',
                              borderRadius: '10px',
                              border: '1.5px solid #FCD34D',
                              fontSize: '0.8rem',
                              fontFamily: 'inherit',
                              outline: 'none',
                              background: '#FFFFFF'
                            }}
                            placeholder="Detail the exact field issue, token discrepancy, or violation observed..."
                            value={customProblemDetail}
                            onChange={(e) => setCustomProblemDetail(e.target.value)}
                            required
                          />
                        </div>
                      )}

                      <div style={{ marginBottom: '0.85rem' }}>
                        <label className="sub-risk-label">Risk Severity Level:</label>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((lvl) => (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => setReportUrgency(lvl)}
                              style={{
                                flex: 1,
                                padding: '0.4rem',
                                borderRadius: '10px',
                                border: '1.5px solid',
                                fontSize: '0.685rem',
                                fontWeight: '800',
                                cursor: 'pointer',
                                borderColor: reportUrgency === lvl ? (lvl === 'CRITICAL' || lvl === 'HIGH' ? '#EF4444' : '#F59E0B') : '#E2E8F0',
                                background: reportUrgency === lvl ? (lvl === 'CRITICAL' || lvl === 'HIGH' ? '#FEF2F2' : '#FFFBEB') : 'white',
                                color: reportUrgency === lvl ? (lvl === 'CRITICAL' || lvl === 'HIGH' ? '#EF4444' : '#B45309') : '#64748B'
                              }}
                            >
                              {lvl}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Upload Section: Image or PDF */}
                      <label className="sub-risk-label">Attach Image or PDF Document Evidence:</label>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        style={{ display: 'none' }}
                        accept="image/*,.pdf,application/pdf"
                        onChange={handleFileChange}
                      />

                      {!uploadedFile ? (
                        <div 
                          className="upload-dropzone"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <div className="upload-icon-circle">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                              <polyline points="17 8 12 3 7 8"/>
                              <line x1="12" y1="3" x2="12" y2="15"/>
                            </svg>
                          </div>
                          <div style={{ fontSize: '0.825rem', fontWeight: '800', color: '#0F172A' }}>
                            Tap to Upload Image or PDF
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: 2 }}>
                            Supports PNG, JPG, JPEG, and PDF documents
                          </div>
                        </div>
                      ) : (
                        <div className="upload-selected-preview">
                          <div className="file-info-group">
                            <div className={`file-icon-badge ${uploadedFile.type.includes('pdf') ? 'pdf' : 'img'}`}>
                              {uploadedFile.type.includes('pdf') ? 'PDF' : 'IMG'}
                            </div>
                            <div>
                              <div className="file-name-text">{uploadedFile.name}</div>
                              <div style={{ fontSize: '0.65rem', color: '#64748B' }}>
                                {(uploadedFile.size / 1024).toFixed(1)} KB • Ready to send
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <button 
                              type="button" 
                              className="btn-view-doc"
                              onClick={() => setViewingDoc({
                                title: selectedSubRisk === 'Others (Manual Specification)' ? (customProblemDetail || 'Custom Field Observation') : selectedSubRisk,
                                fileName: uploadedFile.name,
                                fileType: uploadedFile.type,
                                fileData: filePreviewUrl,
                                fileSize: `${(uploadedFile.size / 1024).toFixed(1)} KB`,
                                remarks: reportRemarks
                              })}
                            >
                              👁️ View
                            </button>
                            <button 
                              type="button" 
                              style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontWeight: 'bold', color: '#64748B' }}
                              onClick={() => { setUploadedFile(null); setFilePreviewUrl(null); }}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      )}

                      <div style={{ marginBottom: '0.85rem' }}>
                        <label className="sub-risk-label">Observation Notes & Remarks:</label>
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
                          placeholder="Enter voucher numbers, token verification notes..."
                          value={reportRemarks}
                          onChange={(e) => setReportRemarks(e.target.value)}
                        />
                      </div>

                      {/* Robot Backend Status Message */}
                      {uploadStatus === 'SUCCESS' && (
                        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '0.65rem', borderRadius: '12px', textAlign: 'center', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.75rem' }}>
                          ✓ Successfully Verified & Stored in Robot Backend Vault!
                          <div style={{ fontSize: '0.65rem', color: '#047857', marginTop: '2px' }}>
                            Receipt: {robotReceipt}
                          </div>
                        </div>
                      )}

                      {uploadStatus === 'ERROR' && (
                        <div>
                          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '0.65rem', borderRadius: '12px', textAlign: 'center', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.45rem' }}>
                            ⚠️ Robot Backend Vault verification failed.
                          </div>
                          <button 
                            type="button" 
                            className="btn-retry-upload"
                            onClick={handleSendToRobotVault}
                          >
                            🔄 Retry Upload to Robot
                          </button>
                        </div>
                      )}

                      {uploadStatus !== 'ERROR' && (
                        <button 
                          type="submit" 
                          className="btn-pill-primary"
                          disabled={uploadStatus === 'UPLOADING'}
                        >
                          {uploadStatus === 'UPLOADING' ? '🚀 Sending to Robot Vault...' : '📤 Send to Robot Backend Vault'}
                        </button>
                      )}
                    </form>
                  </div>
                )}

                {/* Field User: View Assigned Work */}
                {userTab === 'my_assignment' && (
                  <div>
                    {currentUserAssignment ? (
                      <div className="user-assigned-notice">
                        <span className="assignment-task-badge">ASSIGNED BY MANAGER</span>
                        <h6 style={{ fontSize: '0.875rem', fontWeight: '800', marginTop: '0.4rem' }}>{currentUserAssignment.taskTitle}</h6>
                        <p style={{ margin: '0.35rem 0' }}>{currentUserAssignment.instructions}</p>
                        <div style={{ fontSize: '0.685rem', color: '#065F46', borderTop: '1px solid #A7F3D0', paddingTop: '0.35rem', marginTop: '0.35rem' }}>
                          <span>Target Unit: <strong>{currentUserAssignment.unit}</strong> • Deadline: <strong>{currentUserAssignment.deadline}</strong></span>
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94A3B8', fontSize: '0.8rem' }}>
                        No pending work assignments from your manager today.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════
               🚪 UNIVERSAL SECURE LOGOUT SECTION (AVAILABLE TO ALL ROLES AT ANY TIME)
               ═══════════════════════════════════════════════════════ */}
            <div className="portal-logout-section">
              <div className="portal-logout-header">
                <h6>🚪 Active Server Session</h6>
                <span style={{ fontSize: '0.65rem', background: '#ECFDF5', color: '#047857', padding: '0.15rem 0.5rem', borderRadius: '6px', fontWeight: '800' }}>
                  ● Session Active ({sessionLoginTime || '09:00 AM'})
                </span>
              </div>
              <div className="portal-logout-meta">
                <span>Server Clock: <strong>{currentTimeStr}</strong></span>
                <span>Anti-Tamper: <strong style={{ color: '#10B981' }}>✓ Enforced</strong></span>
              </div>
              <button 
                type="button"
                className="btn-record-logout"
                onClick={handleLogout}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
                Log Out & Stamp Exit Timestamp
              </button>
            </div>

          </div>
        )}

      </div>

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


      {/* ── Bottom iOS Home Indicator ── */}
      <div className="home-indicator-bar">
        <div className="home-indicator-pill"></div>
      </div>

    </div>
  );
}

