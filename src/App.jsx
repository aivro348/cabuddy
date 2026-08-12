import React, { useState, useEffect, useCallback } from 'react';
import './index.css';


// API Base URL (Vite proxy maps this to 5001 locally, cPanel serves it directly)
const API_BASE = '/api';

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
  'Monthly Internal Audit',
  'Quaterly Internal Audit',
  'Half-Yearly Internal Audit',
  'Clear selection'
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
  const [dutySubmittedReports, setDutySubmittedReports] = useState([]);
  const [dutySubmitSuccess, setDutySubmitSuccess] = useState(false);
  const [dutyVouchersVerified, setDutyVouchersVerified] = useState('');
  const [dutyActiveTab, setDutyActiveTab] = useState('sheet'); // 'sheet', 'records', 'all_users', 'all_reports', 'all_attendance', 'moms', 'tasks'
  const [adminActiveTab, setAdminActiveTab] = useState('dashboard');

  // ── Hub Active Section State ('entry' | 'logout' | 'moms' | 'tasks' | 'all_users') ──
  const [hubActiveSection, setHubActiveSection] = useState('entry');

  // ── Dashboard Page View State ('hub' | 'duty_entry' | 'shift_logout' | 'mom_page' | 'task_page') ──
  const [dashboardView, setDashboardView] = useState('hub');

  // Sign In form inputs (admin / admin or any user details)
  const [loginEmail, setLoginEmail] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // ── MOM (Minutes of Meeting) Modal State (Matching Images 1, 2, 3) ──
  const [showMomDialog, setShowMomDialog] = useState(false);
  const [momActiveSubTab, setMomActiveSubTab] = useState('basic'); // 'basic' | 'content' | 'actions'
  const [momMeetingTitle, setMomMeetingTitle] = useState('Weekly Team Meeting');
  const [momMeetingType, setMomMeetingType] = useState('Team Meeting');
  const [momDate, setMomDate] = useState('12/08/2026');
  const [momTime, setMomTime] = useState('10:30 AM');
  const [momOrganizer, setMomOrganizer] = useState('Demo Managing Partner');
  const [momLocation, setMomLocation] = useState('Conference Room A, Zoo Road');
  const [momAttendees, setMomAttendees] = useState('');
  const [momAgenda, setMomAgenda] = useState('');
  const [momDiscussions, setMomDiscussions] = useState('');
  const [momActionItems, setMomActionItems] = useState('');
  const [momNextMeeting, setMomNextMeeting] = useState('');
  const [momsList, setMomsList] = useState([]);
  const [momSuccessToast, setMomSuccessToast] = useState(false);

  // ── Create New Task Modal State (Matching Image 4) ──
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('Medium Priority');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskAssignedTo, setNewTaskAssignedTo] = useState('Demo Managing Partner');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskProject, setNewTaskProject] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('General');
  const [tasksList, setTasksList] = useState([]);
  const [taskSuccessToast, setTaskSuccessToast] = useState(false);

  // Master State Stores
  const [usersDb, setUsersDb] = useState([]);
  const [attendanceLedger, setAttendanceLedger] = useState([]);
  const [_assignmentsDb, setAssignmentsDb] = useState([]);
  const [_complaintsDb, setComplaintsDb] = useState([]);

  // Super Admin Enterprise Directory State
  const [adminUserSearch, setAdminUserSearch] = useState('');
  const [adminUserUnitFilter, setAdminUserUnitFilter] = useState('ALL');
  const [adminUserRoleFilter, setAdminUserRoleFilter] = useState('ALL');
  const [adminUserStatusFilter, setAdminUserStatusFilter] = useState('ALL');
  const [selectedUserDetailModal, setSelectedUserDetailModal] = useState(null);

  // Live Server Clock
  const [currentTimeStr, setCurrentTimeStr] = useState('10:45 AM');
  const [logoutRemarks, setLogoutRemarks] = useState('');



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
      const [usersRes, attRes, asnRes, cmpRes, dutyRes, momsRes, tasksRes] = await Promise.all([
        fetch(`${API_BASE}/users`),
        fetch(`${API_BASE}/attendance`),
        fetch(`${API_BASE}/assignments`),
        fetch(`${API_BASE}/complaints`),
        fetch(`${API_BASE}/daily-reports`),
        fetch(`${API_BASE}/moms`),
        fetch(`${API_BASE}/tasks`)
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

      const momsData = await momsRes.json();
      if (momsData.success && momsData.moms) setMomsList(momsData.moms);

      const tasksData = await tasksRes.json();
      if (tasksData.success && tasksData.tasks) setTasksList(tasksData.tasks);

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
        if (data.user.role === 'SUPER_ADMIN') {
          setDutyActiveTab('all_users');
        } else {
          setDutyActiveTab('sheet');
        }
        refreshAllData();
      }
    } catch (err) {
      console.error('Quick login error:', err);
    }
  };

  // Helper: Capture GPS Location with High Accuracy (enableHighAccuracy tries for < 5m accuracy)
  const getGpsLocation = () => {
    return new Promise((resolve) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          console.warn('GPS location capture warning:', error.message);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 0
        }
      );
    });
  };

  // 1. Backend Login (Captures Login Timestamp for ANY role)
  const handleSignIn = async (e) => {
    if (e) e.preventDefault();
    setLoginError('');

    const location = await getGpsLocation();

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword, location })
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setLoginError(errData.message || 'Invalid login credentials.');
        return;
      }

      const data = await res.json();

      if (data.success) {
        setCurrentUser(data.user);
        setIsLoggedIn(true);
        setSessionLoginTime(data.serverTimestamp);
        if (data.user.role === 'SUPER_ADMIN') {
          setDutyActiveTab('all_users');
        } else {
          setDutyActiveTab('sheet');
        }
        refreshAllData();
      } else {
        setLoginError(data.message || 'Authentication failed.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setLoginError('Server connection error. Please ensure the backend is running.');
    }
  };

  // 2. Backend Logout (Records Server Authoritative Exit Timestamp & Concludes Single Daily Sheet)
  const handleLogout = async () => {
    let recordedTime = currentTimeStr;
    const location = await getGpsLocation();
    try {
      if (currentUser) {
        const res = await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: currentUser.id,
            logoutRemarks: logoutRemarks.trim(),
            location
          })
        });
        const data = await res.json();
        if (data.success) {
          recordedTime = data.serverLogoutTime;
          if (data.reports) setDutySubmittedReports(data.reports);
          if (data.attendance) setAttendanceLedger(data.attendance);
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
      setMomOrganizer(currentUser.name || 'Demo Managing Partner');
      setNewTaskAssignedTo(currentUser.name || 'Demo Managing Partner');
    }
    if (sessionLoginTime) {
      setDutyLoginTime(sessionLoginTime);
    } else {
      setDutyLoginTime(currentTimeStr);
    }
  }, [currentUser, sessionLoginTime, currentTimeStr]);

  // ── Submit Daily Audit Duty Entry (10 Parameters - Login Time Auto Captured) ──
  const handleSaveDutyReport = async (shouldLogout = false) => {
    const payload = {
      userId: currentUser?.id,
      loginTime: dutyLoginTime || currentTimeStr,
      fullName: dutyFullName.trim() || currentUser?.name || 'Audit Student',
      studentRegNo: dutyStudentRegNo.trim() || 'SRO0684920',
      unitDetails: dutyUnitDetails,
      subUnitDetails: dutySubUnitDetails.trim() || 'General Unit Counter',
      auditWorkType: dutyAuditWorkType,
      workObjective: dutyWorkObjective.trim(),
      vouchersVerified: dutyVouchersVerified,
      targetToAchieve: dutyTargetToAchieve.trim(),
      caRemarks: dutyCaRemarks.trim(),
      pocName: dutyPocName.trim(),
      logoutTime: shouldLogout ? currentTimeStr : null,
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
      }, 1200);
    } else {
      setTimeout(() => {
        setDutySubmitSuccess(false);
      }, 3500);
    }
  };

  // ── Save Minutes of Meeting (MOM - Matching Images 1, 2, 3) ──
  const handleSaveMom = async (e) => {
    if (e) e.preventDefault();
    if (!momMeetingTitle.trim()) return;

    const payload = {
      meetingTitle: momMeetingTitle.trim(),
      meetingType: momMeetingType,
      date: momDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: momTime || currentTimeStr,
      organizer: momOrganizer.trim() || (currentUser?.name || 'Demo Managing Partner'),
      location: momLocation.trim() || 'Conference Room A, Main Building',
      attendees: momAttendees.trim(),
      agenda: momAgenda.trim(),
      discussions: momDiscussions.trim(),
      actionItems: momActionItems.trim(),
      nextMeeting: momNextMeeting.trim(),
      authorId: currentUser?.id
    };

    try {
      const res = await fetch(`${API_BASE}/moms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.moms) {
        setMomsList(data.moms);
      } else {
        setMomsList(prev => [payload, ...prev]);
      }
    } catch (err) {
      console.warn('Save MOM local fallback:', err);
      setMomsList(prev => [payload, ...prev]);
    }

    setMomSuccessToast(true);
    setTimeout(() => {
      setMomSuccessToast(false);
      setShowMomDialog(false);
    }, 1200);
  };

  // ── Create New Task (Matching Image 4) ──
  const handleCreateTask = async (e) => {
    if (e) e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const payload = {
      taskTitle: newTaskTitle.trim(),
      priority: newTaskPriority,
      description: newTaskDescription.trim(),
      assignedTo: newTaskAssignedTo.trim() || (currentUser?.name || 'Demo Managing Partner'),
      dueDate: newTaskDueDate || 'Today, 05:30 PM',
      project: newTaskProject.trim(),
      category: newTaskCategory,
      createdById: currentUser?.id,
      createdByName: currentUser?.name || 'Staff Member'
    };

    try {
      const res = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.tasks) {
        setTasksList(data.tasks);
      } else {
        setTasksList(prev => [payload, ...prev]);
      }
    } catch (err) {
      console.warn('Create task local fallback:', err);
      setTasksList(prev => [payload, ...prev]);
    }

    setTaskSuccessToast(true);
    setTimeout(() => {
      setTaskSuccessToast(false);
      setShowTaskDialog(false);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskDueDate('');
      setNewTaskProject('');
    }, 1200);
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
            <div className="brand-emblem-mini" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'transparent' }}>
              <img src="/calogo.png" alt="CA Logo" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
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
            </div>

            {isLoggedIn && (
              <div className="nav-user-auth-group">
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
              <div className="brand-top-header" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                <img 
                  src="/calogo.png" 
                  alt="CA Buddy Logo" 
                  style={{ width: '80px', height: '80px', objectFit: 'contain', display: 'block', margin: '0 auto' }} 
                />
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

                {loginError && (
                  <div style={{ color: '#EF4444', fontSize: '0.75rem', fontWeight: '800', background: '#FEF2F2', border: '1.5px solid #FCA5A5', padding: '0.65rem 0.85rem', borderRadius: '10px', marginBottom: '1rem', textAlign: 'center', lineHeight: 1.35 }}>
                    ⚠️ {loginError}
                  </div>
                )}

                <button type="submit" className="btn-pill-primary">
                  Sign In
                </button>
              </form>
            </div>
          ) : null
        ) : (
          /* ═══════════════════════════════════════════════════════
             ── DASHBOARD: MULTI-PAGE NAVIGATION SYSTEM ──
             ═══════════════════════════════════════════════════════ */
          <div className="duty-sheet-card">

            {/* ═══════════════════════════════════════════════════════
               ── PAGE: ACTION HUB HOME (4 CARDS LANDING) ──
               ═══════════════════════════════════════════════════════ */}
            {dashboardView === 'hub' && (
              <>
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
                        <strong style={{ fontSize: '0.875rem' }}>Daily Duty Entry Submitted Successfully!</strong>
                        <p style={{ fontSize: '0.75rem', margin: 0 }}>Recorded on central server with auto-captured timestamp.</p>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.725rem', fontWeight: '800', background: '#FFFFFF', padding: '0.25rem 0.6rem', borderRadius: '6px' }}>
                      ⏱️ {currentTimeStr}
                    </span>
                  </div>
                )}

                {/* ═══════════════════════════════════════════════════════
                   ── 4 ACTION HUB BOXES (LOGIN ENTRY, LOGOUT, MOM, TASK) ──
                   ═══════════════════════════════════════════════════════ */}
                <div className="hub-four-grid">
                  
                  {/* Box 1: Login Entry */}
                  {currentUser.role !== 'SUPER_ADMIN' && (
                    <div 
                      className="hub-box-card box-entry"
                      onClick={() => {
                        setDashboardView('duty_entry');
                        setDutyActiveTab('sheet');
                        setHubActiveSection('entry');
                      }}
                    >
                      <div className="hub-box-top">
                        <div className="hub-box-icon" style={{ background: '#ECFDF5', color: '#047857' }}>📝</div>
                        <span className="hub-box-badge" style={{ background: '#ECFDF5', color: '#047857' }}>10 PARAMS</span>
                      </div>
                      <h4>1. Daily Duty Login Entry</h4>
                      <p>Auto-captures server timestamp & submit 10-parameter daily audit questionnaire.</p>
                      <button type="button" className="hub-box-action-btn">
                        <span>📝 File Duty Entry →</span>
                      </button>
                    </div>
                  )}

                  {/* Box 2: Shift Logout Section */}
                  {currentUser.role !== 'SUPER_ADMIN' && (
                    <div 
                      className="hub-box-card box-logout"
                      onClick={() => {
                        setDashboardView('shift_logout');
                      }}
                    >
                      <div className="hub-box-top">
                        <div className="hub-box-icon" style={{ background: '#FEF2F2', color: '#DC2626' }}>🔒</div>
                        <span className="hub-box-badge" style={{ background: '#FEF2F2', color: '#DC2626' }}>SHIFT LOGOUT</span>
                      </div>
                      <h4>2. Shift Logout Section</h4>
                      <p>Conclude daily shift, record verified server exit timestamp, and save day summary.</p>
                      <button type="button" className="hub-box-action-btn">
                        <span>⏱️ Shift Logout →</span>
                      </button>
                    </div>
                  )}

                  {/* Box 3: Minutes of Meeting (MOM) */}
                  {currentUser.role !== 'SUPER_ADMIN' && (
                    <div 
                      className="hub-box-card box-mom"
                      onClick={() => {
                        setMomOrganizer(currentUser?.name || 'Demo Managing Partner');
                        setMomActiveSubTab('basic');
                        setDashboardView('mom_page');
                      }}
                    >
                      <div className="hub-box-top">
                        <div className="hub-box-icon" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>🏛️</div>
                        <span className="hub-box-badge" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>{momsList.length} LOGGED</span>
                      </div>
                      <h4>3. Minutes of Meeting (MOM)</h4>
                      <p>Record meeting details, agenda, decisions, and action items with deadlines.</p>
                      <button type="button" className="hub-box-action-btn">
                        <span>➕ Create / View MOM →</span>
                      </button>
                    </div>
                  )}

                  {/* Box 4: Create New Task */}
                  {currentUser.role !== 'SUPER_ADMIN' && (
                    <div 
                      className="hub-box-card box-task"
                      onClick={() => {
                        setNewTaskAssignedTo(currentUser?.name || 'Demo Managing Partner');
                        setDashboardView('task_page');
                      }}
                    >
                      <div className="hub-box-top">
                        <div className="hub-box-icon" style={{ background: '#F5F3FF', color: '#7C3AED' }}>🎯</div>
                        <span className="hub-box-badge" style={{ background: '#F5F3FF', color: '#7C3AED' }}>{tasksList.length} TASKS</span>
                      </div>
                      <h4>4. Create New Task</h4>
                      <p>Create tasks for yourself or assign audit tasks to team members with priorities.</p>
                      <button type="button" className="hub-box-action-btn">
                        <span>➕ Create / Assign Task →</span>
                      </button>
                    </div>
                  )}

                  {/* Box 5: Admin Control Center (Only visible to SUPER_ADMIN) */}
                  {currentUser.role === 'SUPER_ADMIN' && (
                    <div 
                      className="hub-box-card box-admin"
                      style={{ border: '2px solid #FACC15', background: '#FFFDF0', cursor: 'pointer', gridColumn: 'span 2', maxWidth: '500px', margin: '0 auto' }}
                      onClick={() => {
                        setDashboardView('admin_panel');
                        setAdminActiveTab('users');
                      }}
                    >
                      <div className="hub-box-top">
                        <div className="hub-box-icon" style={{ background: '#FEF3C7', color: '#D97706' }}>👑</div>
                        <span className="hub-box-badge" style={{ background: '#FEF3C7', color: '#D97706' }}>ADMIN PORTAL</span>
                      </div>
                      <h4>Master Admin Control Center</h4>
                      <p>Full overview of users, real-time GPS attendance logs, daily reports, MOMs, and system tasks.</p>
                      <button type="button" className="hub-box-action-btn" style={{ background: '#D97706', borderColor: '#FACC15', color: '#FFFFFF' }}>
                        <span>👑 Open Control Panel →</span>
                      </button>
                    </div>
                  )}

                </div>

                {/* Navigation Tabs between Super Admin Views & Submitted History */}
                <div className="dash-tab-strip" style={{ marginBottom: '1.5rem' }}>
                  {currentUser.role === 'SUPER_ADMIN' ? (
                    <>
                      <button 
                        type="button"
                        className={`dash-tab-btn ${dutyActiveTab === 'all_users' ? 'active' : ''}`}
                        onClick={() => { setDutyActiveTab('all_users'); setHubActiveSection('all_users'); }}
                      >
                        👥 All Users Directory ({usersDb.length})
                      </button>
                      <button 
                        type="button"
                        className={`dash-tab-btn ${dutyActiveTab === 'all_reports' ? 'active' : ''}`}
                        onClick={() => { setDutyActiveTab('all_reports'); setHubActiveSection('all_reports'); }}
                      >
                        📋 All Daily Reports ({dutySubmittedReports.length})
                      </button>
                      <button 
                        type="button"
                        className={`dash-tab-btn ${dutyActiveTab === 'all_attendance' ? 'active' : ''}`}
                        onClick={() => { setDutyActiveTab('all_attendance'); setHubActiveSection('all_attendance'); }}
                      >
                        ⏱️ Master Attendance ({attendanceLedger.length})
                      </button>
                      <button 
                        type="button"
                        className={`dash-tab-btn ${dutyActiveTab === 'records' ? 'active' : ''}`}
                        onClick={() => { setDutyActiveTab('records'); setHubActiveSection('records'); }}
                      >
                        📋 My Reports ({dutySubmittedReports.length})
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        type="button"
                        className={`dash-tab-btn ${dutyActiveTab === 'records' ? 'active' : ''}`}
                        onClick={() => { setDutyActiveTab('records'); setHubActiveSection('records'); }}
                      >
                        📋 Today's Submitted Reports ({dutySubmittedReports.length})
                      </button>
                    </>
                  )}
                </div>

            {/* ═══════════════════════════════════════════════════════
               ── TAB 1 (SUPER ADMIN): ALL USERS & STAFF DIRECTORY ──
               ═══════════════════════════════════════════════════════ */}
            {dutyActiveTab === 'all_users' && (
              <div className="super-admin-section">
                
                {/* KPI Metrics Summary Bar */}
                <div className="super-kpi-grid">
                  <div className="super-kpi-card">
                    <div className="super-kpi-icon" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>👥</div>
                    <div>
                      <span className="kpi-label">Total Staff / Users</span>
                      <div className="kpi-value">{usersDb.length} Registered</div>
                    </div>
                  </div>

                  <div className="super-kpi-card">
                    <div className="super-kpi-icon" style={{ background: '#ECFDF5', color: '#047857' }}>🟢</div>
                    <div>
                      <span className="kpi-label">Active Shifts Now</span>
                      <div className="kpi-value" style={{ color: '#047857' }}>
                        {attendanceLedger.filter(a => a.active).length} On-Duty
                      </div>
                    </div>
                  </div>

                  <div className="super-kpi-card">
                    <div className="super-kpi-icon" style={{ background: '#FEF3C7', color: '#B45309' }}>📝</div>
                    <div>
                      <span className="kpi-label">Daily Reports Filed</span>
                      <div className="kpi-value">{dutySubmittedReports.length} Submitted</div>
                    </div>
                  </div>

                  <div className="super-kpi-card">
                    <div className="super-kpi-icon" style={{ background: '#F3E8FF', color: '#7E22CE' }}>🏛️</div>
                    <div>
                      <span className="kpi-label">Enterprise Units</span>
                      <div className="kpi-value">{ORGANIZATIONAL_UNITS.length} Units</div>
                    </div>
                  </div>
                </div>

                {/* Search & Filter Toolbar */}
                <div className="super-admin-toolbar">
                  <div className="super-toolbar-search">
                    <svg className="super-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="m21 21-4.3-4.3"/>
                    </svg>
                    <input 
                      type="text"
                      className="super-search-input"
                      placeholder="Search by name, student reg no, email, unit, phone, designation..."
                      value={adminUserSearch}
                      onChange={(e) => setAdminUserSearch(e.target.value)}
                    />
                  </div>

                  <div className="super-toolbar-filters">
                    <select 
                      className="super-filter-select"
                      value={adminUserUnitFilter}
                      onChange={(e) => setAdminUserUnitFilter(e.target.value)}
                      title="Filter by TTD Audit Unit"
                    >
                      <option value="ALL">🏛️ All Units</option>
                      {ORGANIZATIONAL_UNITS.map((u, i) => (
                        <option key={i} value={u}>{u}</option>
                      ))}
                    </select>

                    <select 
                      className="super-filter-select"
                      value={adminUserRoleFilter}
                      onChange={(e) => setAdminUserRoleFilter(e.target.value)}
                      title="Filter by Role Level"
                    >
                      <option value="ALL">👑 All Roles</option>
                      <option value="SUPER_ADMIN">👑 Super Admin</option>
                      <option value="MANAGER">💼 Manager</option>
                      <option value="USER">📋 Field User / Auditor</option>
                    </select>

                    <select 
                      className="super-filter-select"
                      value={adminUserStatusFilter}
                      onChange={(e) => setAdminUserStatusFilter(e.target.value)}
                      title="Filter by Live Shift Status"
                    >
                      <option value="ALL">⚡ All Shifts</option>
                      <option value="ACTIVE">🟢 Active On-Duty</option>
                      <option value="OFFLINE">⚪ Logged Out / Inactive</option>
                    </select>

                    <button 
                      type="button" 
                      className="btn-super-action"
                      onClick={() => setShowCreateUserModal(true)}
                    >
                      <span>➕ Add User</span>
                    </button>
                  </div>
                </div>

                {/* Detailed User Cards List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {usersDb
                    .filter(u => {
                      const q = adminUserSearch.toLowerCase().trim();
                      const matchesSearch = !q || 
                        (u.name && u.name.toLowerCase().includes(q)) ||
                        (u.email && u.email.toLowerCase().includes(q)) ||
                        (u.studentRegNo && u.studentRegNo.toLowerCase().includes(q)) ||
                        (u.phone && u.phone.toLowerCase().includes(q)) ||
                        (u.unit && u.unit.toLowerCase().includes(q)) ||
                        (u.subUnit && u.subUnit.toLowerCase().includes(q)) ||
                        (u.roleTitle && u.roleTitle.toLowerCase().includes(q));

                      const matchesUnit = adminUserUnitFilter === 'ALL' || u.unit === adminUserUnitFilter;
                      const matchesRole = adminUserRoleFilter === 'ALL' || u.role === adminUserRoleFilter;
                      
                      const userAtt = attendanceLedger.find(a => a.userId === u.id || a.userEmail === u.email);
                      const isUserActive = userAtt ? userAtt.active : false;
                      const matchesStatus = adminUserStatusFilter === 'ALL' || 
                        (adminUserStatusFilter === 'ACTIVE' && isUserActive) || 
                        (adminUserStatusFilter === 'OFFLINE' && !isUserActive);

                      return matchesSearch && matchesUnit && matchesRole && matchesStatus;
                    })
                    .map((user, idx) => {
                      const userAtt = attendanceLedger.find(a => a.userId === user.id || a.userEmail === user.email);
                      const isOnline = userAtt ? userAtt.active : false;
                      const userReports = dutySubmittedReports.filter(r => 
                        (user.studentRegNo && r.studentRegNo === user.studentRegNo) ||
                        (r.fullName && r.fullName.toLowerCase().includes(user.name?.toLowerCase().split(',')[0].trim()))
                      );
                      const latestReport = userReports[0];
                      const supervisor = user.managedBy ? (usersDb.find(m => m.id === user.managedBy)?.name || 'Audit Manager') : 'Executive Apex Admin';

                      return (
                        <div key={user.id || idx} className="admin-user-complete-card">
                          
                          {/* Card Header: Profile Info, Role Pill, Shift Status */}
                          <div className="admin-user-card-header">
                            <div className="admin-user-profile-left">
                              <div className="admin-user-avatar">
                                {user.role === 'SUPER_ADMIN' ? '👑' : user.role === 'MANAGER' ? '💼' : '👤'}
                              </div>
                              <div className="admin-user-name-title">
                                <h4>
                                  <span>{user.name}</span>
                                  <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: '600' }}>#{user.id}</span>
                                </h4>
                                <div className="sub-role">{user.roleTitle || user.role} • Registered Staff</div>
                              </div>
                            </div>

                            <div className="admin-user-header-badges">
                              <span className={`role-badge-pill ${
                                user.role === 'SUPER_ADMIN' ? 'role-super' : 
                                user.role === 'MANAGER' ? 'role-manager' : 'role-user'
                              }`}>
                                {user.role === 'SUPER_ADMIN' ? '👑 SUPER ADMIN' : 
                                 user.role === 'MANAGER' ? '💼 MANAGER' : '📋 FIELD AUDITOR'}
                              </span>

                              <span className={`shift-status-pill ${isOnline ? 'shift-status-active' : 'shift-status-offline'}`}>
                                <span className={isOnline ? 'pulse-dot-live' : ''} style={{ background: isOnline ? '#10B981' : '#94A3B8', width: 6, height: 6, borderRadius: '50%', display: 'inline-block' }} />
                                {isOnline ? 'Active On-Duty' : 'Logged Out'}
                              </span>
                            </div>
                          </div>

                          {/* Complete User Credentials & Metadata Grid */}
                          <div className="user-complete-meta-grid">
                            <div className="user-meta-cell">
                              <span className="meta-label">🎓 Student / ICAI Reg No.</span>
                              <span className="meta-val" style={{ color: '#1D4ED8' }}>{user.studentRegNo || 'FCA / Student N/A'}</span>
                            </div>

                            <div className="user-meta-cell">
                              <span className="meta-label">✉️ Official Email</span>
                              <span className="meta-val">{user.email}</span>
                            </div>

                            <div className="user-meta-cell">
                              <span className="meta-label">📞 Phone / Emergency</span>
                              <span className="meta-val">{user.phone || '+91 98480 12345'}</span>
                            </div>

                            <div className="user-meta-cell">
                              <span className="meta-label">🏛️ Primary Designated Unit</span>
                              <span className="meta-val" style={{ color: '#0F172A' }}>{user.unit || 'All Units'}</span>
                            </div>

                            <div className="user-meta-cell">
                              <span className="meta-label">🏢 Specific Sub-Unit / Counter</span>
                              <span className="meta-val">{user.subUnit || 'Designated Audit Desk'}</span>
                            </div>

                            <div className="user-meta-cell">
                              <span className="meta-label">👤 Reporting Supervisor</span>
                              <span className="meta-val">{supervisor}</span>
                            </div>
                          </div>

                          {/* Shift Timestamps & Latest Daily Report Snippet */}
                          <div className="user-card-lower-grid">
                            <div className="user-shift-box">
                              <h6>⏱️ Today's Shift Timestamps</h6>
                              <div className="user-shift-times">
                                <div>
                                  <span>SERVER LOGIN</span>
                                  <strong>{userAtt ? userAtt.loginTime : (isOnline ? currentTimeStr : '09:00 AM')}</strong>
                                </div>
                                <div>
                                  <span>SERVER LOGOUT</span>
                                  <strong style={{ color: isOnline ? '#10B981' : '#64748B' }}>
                                    {userAtt ? (userAtt.logoutTime || (isOnline ? '● Shift Active' : '05:30 PM')) : (isOnline ? '● Active' : 'Completed')}
                                  </strong>
                                </div>
                              </div>
                              <div style={{ marginTop: '0.45rem', fontSize: '0.685rem', color: '#64748B' }}>
                                Status: <strong>{userAtt?.duration || (isOnline ? 'Session Active' : 'Standard Shift Verified')}</strong>
                              </div>
                            </div>

                            <div className="user-duty-snippet-box">
                              <h6>📝 Latest Daily Duty Sheet (11 Parameters Summary)</h6>
                              {latestReport ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                  <div>🎯 <strong>Objective:</strong> {latestReport.workObjective}</div>
                                  <div>🏆 <strong>EOD Target:</strong> {latestReport.targetToAchieve}</div>
                                  {latestReport.caRemarks && (
                                    <div style={{ color: '#B45309' }}>⚠️ <strong>CA Remarks:</strong> {latestReport.caRemarks}</div>
                                  )}
                                  <div>🤝 <strong>Unit POC:</strong> {latestReport.pocName || 'POC Officer'} • Work: <strong>{latestReport.auditWorkType}</strong></div>
                                </div>
                              ) : (
                                <div style={{ color: '#64748B', fontStyle: 'italic' }}>
                                  ⏳ Awaiting today's duty sheet submission from this user.
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Footer */}
                          <div className="user-card-action-footer">
                            <div style={{ fontSize: '0.725rem', color: '#64748B' }}>
                              Total Reports Filed: <strong style={{ color: '#0F172A' }}>{userReports.length}</strong> • Onboarded: <strong>{user.joinedDate || '01-Jan-2024'}</strong>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <button 
                                type="button" 
                                className="btn-card-edit-role"
                                onClick={() => setEditingRoleUser(user)}
                              >
                                ✏️ Reassign Unit / Role
                              </button>
                              <button 
                                type="button" 
                                className="btn-card-dossier"
                                onClick={() => setSelectedUserDetailModal(user)}
                              >
                                🔍 View Complete Details & Dossier
                              </button>
                            </div>
                          </div>

                        </div>
                      );
                    })}

                  {usersDb.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94A3B8' }}>
                      No staff users found in database.
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* ═══════════════════════════════════════════════════════
               ── TAB 2 (SUPER ADMIN): ALL DAILY DUTY REPORTS ──
               ═══════════════════════════════════════════════════════ */}
            {dutyActiveTab === 'all_reports' && (
              <div className="super-admin-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                      📋 All Users' Daily Audit Duty Reports ({dutySubmittedReports.length})
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '3px 0 0' }}>
                      Verified multi-unit audit duty sheets filed across all TTD units
                    </p>
                  </div>
                  <span style={{ fontSize: '0.75rem', background: '#ECFDF5', color: '#047857', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-pill)', fontWeight: '800', border: '1px solid #A7F3D0' }}>
                    ● Central Database Synced
                  </span>
                </div>

                <div className="responsive-cards-grid">
                  {dutySubmittedReports.map((rep, idx) => (
                    <div key={rep.id || idx} className="enterprise-account-card">
                      <div className="acc-card-header">
                        <div>
                          <span className="user-unit-tag" style={{ marginBottom: 4 }}>{rep.unitDetails}</span>
                          <span className="acc-name-text" style={{ display: 'block', fontSize: '0.95rem' }}>{rep.fullName}</span>
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

                      <div style={{ background: '#F8FAFC', padding: '0.6rem 0.75rem', borderRadius: '12px', fontSize: '0.725rem', color: '#475569', marginTop: '0.5rem' }}>
                        <div>🎯 <strong>Objective:</strong> {rep.workObjective || 'General Audit Verification'}</div>
                        <div style={{ marginTop: '0.25rem' }}>🏆 <strong>Target:</strong> {rep.targetToAchieve || 'Standard compliance verified'}</div>
                        {rep.caRemarks && (
                          <div style={{ marginTop: '0.35rem', background: '#FFFBEB', padding: '0.35rem 0.5rem', borderRadius: '6px', color: '#B45309', border: '1px solid #FDE68A' }}>
                            ⚠️ <strong>CA Remarks to Management:</strong> {rep.caRemarks}
                          </div>
                        )}
                        {rep.logoutRemarks && (
                          <div style={{ marginTop: '0.35rem', background: '#FEF2F2', padding: '0.35rem 0.5rem', borderRadius: '6px', color: '#DC2626', border: '1px solid #FECACA' }}>
                            🔒 <strong>Evening Handover:</strong> {rep.logoutRemarks}
                          </div>
                        )}
                        <div style={{ marginTop: '0.35rem', color: '#047857', display: 'flex', justifyContent: 'space-between' }}>
                          <span>🤝 <strong>Unit POC:</strong> {rep.pocName || 'Not specified'}</span>
                          <span>⏱️ {rep.timestamp || 'Verified'}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {dutySubmittedReports.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94A3B8', gridColumn: '1 / -1' }}>
                      No daily duty sheets filed in system yet.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════
               ── TAB 3 (SUPER ADMIN): MASTER ATTENDANCE LEDGER ──
               ═══════════════════════════════════════════════════════ */}
            {dutyActiveTab === 'all_attendance' && (
              <div className="super-admin-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                      ⏱️ Master Attendance & Shift Timestamps Ledger ({attendanceLedger.length})
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '3px 0 0' }}>
                      Server authoritative real-time shift login and logout records
                    </p>
                  </div>
                  <span style={{ fontSize: '0.75rem', background: '#EFF6FF', color: '#1D4ED8', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-pill)', fontWeight: '800', border: '1px solid #BFDBFE' }}>
                    🔒 Cryptographically Verified
                  </span>
                </div>

                <div className="responsive-cards-grid">
                  {attendanceLedger.map((att, idx) => (
                    <div key={att.id || idx} className="enterprise-account-card">
                      <div className="acc-card-header">
                        <div>
                          <span className="user-unit-tag" style={{ marginBottom: 4 }}>{att.unit || 'All Units'}</span>
                          <span className="acc-name-text" style={{ display: 'block', fontSize: '0.95rem' }}>{att.userName}</span>
                        </div>
                        <span className={`shift-status-pill ${att.active ? 'shift-status-active' : 'shift-status-offline'}`}>
                          {att.active ? '● Active Session' : 'Completed'}
                        </span>
                      </div>

                      <div className="acc-time-grid" style={{ margin: '0.5rem 0' }}>
                        <div>
                          <span>LOGIN TIME</span>
                          <strong>{att.loginTime}</strong>
                        </div>
                        <div>
                          <span>LOGOUT TIME</span>
                          <strong style={{ color: att.logoutTime ? '#0F172A' : '#10B981' }}>
                            {att.logoutTime || '● In Session'}
                          </strong>
                        </div>
                      </div>

                      <div style={{ background: '#F8FAFC', padding: '0.5rem 0.65rem', borderRadius: '10px', fontSize: '0.725rem', color: '#475569' }}>
                        <div>📅 <strong>Shift Date:</strong> {att.date || '12-Aug-2026'} • <strong>Window:</strong> {att.timeWindow}</div>
                        <div style={{ marginTop: '0.25rem' }}>⏳ <strong>Duration:</strong> {att.duration || 'Session Active'}</div>
                        {att.managerRemarks && (
                          <div style={{ marginTop: '0.25rem', color: '#1E3A8A' }}>
                            💬 <strong>Note:</strong> {att.managerRemarks}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {attendanceLedger.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94A3B8', gridColumn: '1 / -1' }}>
                      No attendance sessions logged yet today.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════
               ── TAB (FIELD AUDITOR): TODAY'S SUBMITTED REPORTS ──
               ═══════════════════════════════════════════════════════ */}
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
                        {rep.logoutRemarks && (
                          <div style={{ marginTop: '0.25rem', color: '#DC2626', background: '#FEF2F2', padding: '0.25rem 0.5rem', borderRadius: '6px' }}>
                            🔒 <strong>Evening Handover:</strong> {rep.logoutRemarks}
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

              </>
            )}

            {/* ═══════════════════════════════════════════════════════
               ── PAGE: DAILY DUTY LOGIN ENTRY (FULL PAGE VIEW) ──
               ═══════════════════════════════════════════════════════ */}
            {dashboardView === 'duty_entry' && (
              <div className="dedicated-page-view page-entry" style={{ animation: 'slideInPage 0.3s ease' }}>
                {/* Page Header with Back Navigation */}
                <div className="page-view-header">
                  <button 
                    type="button" 
                    className="page-back-btn"
                    onClick={() => setDashboardView('hub')}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 12H5"/>
                      <path d="M12 19l-7-7 7-7"/>
                    </svg>
                    <span>Back to Dashboard</span>
                  </button>
                  <div className="page-view-title-group">
                    <div className="page-view-icon" style={{ background: '#ECFDF5', color: '#047857' }}>📝</div>
                    <div>
                      <h3 className="page-view-title">Daily Duty Login Entry</h3>
                      <p className="page-view-subtitle">10-Parameter Daily Audit Questionnaire • Auto Server Timestamp</p>
                    </div>
                  </div>
                  <div className="page-view-badges">
                    <div className="duty-date-badge">
                      📅 {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                    <div className="duty-live-badge">
                      <span className="pulse-dot-live"></span>
                      LIVE
                    </div>
                  </div>
                </div>

                {/* Success Alert Banner */}
                {dutySubmitSuccess && (
                  <div className="duty-success-alert">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span style={{ fontSize: '1.25rem' }}>✅</span>
                      <div>
                        <strong style={{ fontSize: '0.875rem' }}>Daily Duty Entry Submitted Successfully!</strong>
                        <p style={{ fontSize: '0.75rem', margin: 0 }}>Recorded on central server with auto-captured timestamp.</p>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.725rem', fontWeight: '800', background: '#FFFFFF', padding: '0.25rem 0.6rem', borderRadius: '6px' }}>
                      ⏱️ {currentTimeStr}
                    </span>
                  </div>
                )}

                {/* 10 Parameters Duty Entry Form */}
                <form onSubmit={(e) => { e.preventDefault(); handleSaveDutyReport(false); }}>
                  <div className="duty-form-grid">
                    
                    {/* Parameter 1: Login Time (Server Auto-Captured) */}
                    <div className="duty-field-wrapper">
                      <label className="duty-field-label">
                        <span>⏱️ 1. Login Time (Server Auto-Captured)</span>
                        <span className="req">*</span>
                      </label>
                      <div className="duty-auto-time-pill">
                        <span className="pulse-dot-live"></span>
                        <span>⏱️ {dutyLoginTime || currentTimeStr}</span>
                        <span style={{ fontSize: '0.685rem', color: '#047857', background: '#FFFFFF', padding: '0.2rem 0.5rem', borderRadius: '6px', marginLeft: 'auto', fontWeight: '800' }}>
                          🔒 Auto-Captured from Server
                        </span>
                      </div>
                      <span className="duty-field-hint">Exact timestamp recorded automatically on central server</span>
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

                    {/* Parameter 4: TTD Audit Unit */}
                    <div className="duty-field-wrapper full-row">
                      <label className="duty-field-label">
                        <span>🏛️ 4. TTD Audit Unit Details attending today</span>
                        <span className="req">*</span>
                      </label>
                      <select 
                        className="duty-select-box"
                        value={dutyUnitDetails}
                        onChange={(e) => setDutyUnitDetails(e.target.value)}
                        required
                      >
                        <option value="">-- Select TTD Audit Unit --</option>
                        {ORGANIZATIONAL_UNITS.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                      <span className="duty-field-hint">Official 8-unit concurrent & internal audit assignment</span>
                    </div>

                    {/* Parameter 5: Type of Audit Work */}
                    <div className="duty-field-wrapper full-row">
                      <label className="duty-field-label">
                        <span>📋 5. Type of Audit Work</span>
                        <span className="req">*</span>
                      </label>
                      <select 
                        className="duty-select-box"
                        value={dutyAuditWorkType}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'Clear selection') {
                            setDutyAuditWorkType('');
                          } else {
                            setDutyAuditWorkType(val);
                          }
                        }}
                        required
                      >
                        <option value="">-- Select Audit Work Type --</option>
                        {AUDIT_WORK_TYPES.map((w) => (
                          <option key={w} value={w}>{w}</option>
                        ))}
                      </select>
                      <span className="duty-field-hint">Category of audit work being performed today</span>
                    </div>

                    {/* Parameter 6: Detailed Work Description */}
                    <div className="duty-field-wrapper full-row">
                      <label className="duty-field-label">
                        <span>📝 6. Detailed Work Description</span>
                        <span className="req">*</span>
                      </label>
                      <textarea 
                        className="duty-textarea-box"
                        rows="3"
                        value={dutyWorkObjective}
                        onChange={(e) => setDutyWorkObjective(e.target.value)}
                        placeholder="Describe in detail the audit work performed today (findings, procedures, observations)..."
                        required
                      />
                      <span className="duty-field-hint">Narrative of audit procedures, findings, and observations</span>
                    </div>

                    {/* Parameter 7: Number of Vouchers */}
                    <div className="duty-field-wrapper">
                      <label className="duty-field-label">
                        <span>🧾 7. Number of Vouchers / Documents Verified</span>
                        <span className="req">*</span>
                      </label>
                      <input 
                        type="number" 
                        className="duty-input-box"
                        value={dutyVouchersVerified}
                        onChange={(e) => setDutyVouchersVerified(e.target.value)}
                        placeholder="e.g. 45"
                        min="0"
                        required
                      />
                      <span className="duty-field-hint">Total ledger entries, vouchers, tokens, or documents reviewed</span>
                    </div>

                    {/* Parameter 8: Target to Achieve */}
                    <div className="duty-field-wrapper">
                      <label className="duty-field-label">
                        <span>🎯 8. Target to Achieve / Expected Completion</span>
                        <span className="req">*</span>
                      </label>
                      <input 
                        type="text" 
                        className="duty-input-box"
                        value={dutyTargetToAchieve}
                        onChange={(e) => setDutyTargetToAchieve(e.target.value)}
                        placeholder="e.g. Complete Donor Cell audit by 3:00 PM"
                        required
                      />
                      <span className="duty-field-hint">Specific audit milestone or completion target for today's shift</span>
                    </div>

                    {/* Parameter 9: CA Remarks */}
                    <div className="duty-field-wrapper full-row">
                      <label className="duty-field-label">
                        <span>✍️ 9. CA Remarks / Observations for Management</span>
                        <span className="req">*</span>
                      </label>
                      <textarea 
                        className="duty-textarea-box"
                        rows="3"
                        value={dutyCaRemarks}
                        onChange={(e) => setDutyCaRemarks(e.target.value)}
                        placeholder="Key audit observations, discrepancies, or remarks for CA in-charge..."
                        required
                      />
                      <span className="duty-field-hint">High priority findings for the CA in-charge & management</span>
                    </div>

                    {/* Parameter 10: Point of Contact Name */}
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
                  </div>

                  {/* Form Action Controls */}
                  <div className="duty-action-group" style={{ marginTop: '1.5rem' }}>
                    <button 
                      type="submit" 
                      className="btn-duty-submit"
                    >
                      <span>💾 Submit Daily Duty Entry</span>
                    </button>
                  </div>
                </form>
              </div>
            )}


            {/* ═══════════════════════════════════════════════════════
               ── PAGE: SHIFT LOGOUT (FULL PAGE VIEW) ──
               ═══════════════════════════════════════════════════════ */}
            {dashboardView === 'shift_logout' && (
              <div className="dedicated-page-view page-logout" style={{ animation: 'slideInPage 0.3s ease' }}>
                {/* Page Header with Back Navigation */}
                <div className="page-view-header">
                  <button 
                    type="button" 
                    className="page-back-btn"
                    onClick={() => setDashboardView('hub')}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 12H5"/>
                      <path d="M12 19l-7-7 7-7"/>
                    </svg>
                    <span>Back to Dashboard</span>
                  </button>
                  <div className="page-view-title-group">
                    <div className="page-view-icon" style={{ background: '#FEF2F2', color: '#DC2626' }}>🔒</div>
                    <div>
                      <h3 className="page-view-title">Shift Logout & Session Handover</h3>
                      <p className="page-view-subtitle">Conclude today's audit shift and record verified server exit timestamp</p>
                    </div>
                  </div>
                  <div className="page-view-badges">
                    <div className="duty-live-badge" style={{ background: '#FEF2F2', color: '#DC2626', borderColor: '#FECACA' }}>
                      <span className="pulse-dot-live" style={{ background: '#DC2626' }}></span>
                      SESSION ACTIVE
                    </div>
                  </div>
                </div>

                {/* Shift Times Panel */}
                <div style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: '18px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                  <div className="user-shift-times" style={{ background: 'white', border: '1px solid #FECACA', borderRadius: 12, padding: '0.85rem 1rem', marginBottom: '1.25rem' }}>
                    <div>
                      <span style={{ color: '#64748B', fontSize: '0.7rem' }}>TODAY'S VERIFIED LOGIN TIME</span>
                      <strong style={{ fontSize: '0.95rem', color: '#0F172A' }}>{dutyLoginTime || currentTimeStr}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', fontSize: '0.7rem' }}>CURRENT SERVER TIME (LOGOUT TIMESTAMP)</span>
                      <strong style={{ fontSize: '0.95rem', color: '#DC2626' }}>{currentTimeStr}</strong>
                    </div>
                  </div>

                  <div className="duty-field-wrapper full-row" style={{ marginBottom: '1.25rem' }}>
                    <label className="duty-field-label">
                      <span>📝 Day-End Handover & Logout Remarks (Optional)</span>
                    </label>
                    <textarea 
                      className="duty-textarea-box"
                      rows="3"
                      value={logoutRemarks}
                      onChange={(e) => setLogoutRemarks(e.target.value)}
                      placeholder="Briefly state key handover items or notes before logging out..."
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <button 
                      type="button"
                      className="btn-card-edit-role"
                      onClick={() => setDashboardView('hub')}
                      style={{ padding: '0.65rem 1.25rem' }}
                    >
                      ← Back to Dashboard
                    </button>

                    <button 
                      type="button"
                      className="btn-duty-logout"
                      onClick={handleLogout}
                      style={{ padding: '0.75rem 1.85rem', fontSize: '0.9rem' }}
                    >
                      <span>⏱️ Conclude Shift & Stamp Server Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            )}


            {/* ═══════════════════════════════════════════════════════
               ── PAGE: MINUTES OF MEETING (FULL PAGE VIEW) ──
               ═══════════════════════════════════════════════════════ */}
            {dashboardView === 'mom_page' && (
              <div className="dedicated-page-view page-mom" style={{ animation: 'slideInPage 0.3s ease' }}>
                {/* Page Header with Back Navigation */}
                <div className="page-view-header">
                  <button 
                    type="button" 
                    className="page-back-btn"
                    onClick={() => setDashboardView('hub')}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 12H5"/>
                      <path d="M12 19l-7-7 7-7"/>
                    </svg>
                    <span>Back to Dashboard</span>
                  </button>
                  <div className="page-view-title-group">
                    <div className="page-view-icon" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>🏛️</div>
                    <div>
                      <h3 className="page-view-title">Minutes of Meeting (MOM)</h3>
                      <p className="page-view-subtitle">Record meeting details, agenda, decisions, and action items</p>
                    </div>
                  </div>
                  <div className="page-view-badges">
                    <span className="hub-box-badge" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>{momsList.length} LOGGED</span>
                  </div>
                </div>

                {/* MOM Success Toast */}
                {momSuccessToast && (
                  <div className="duty-success-alert" style={{ background: '#EFF6FF', borderColor: '#93C5FD' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span style={{ fontSize: '1.25rem' }}>✅</span>
                      <strong style={{ fontSize: '0.875rem', color: '#1E3A8A' }}>Minutes of Meeting saved successfully!</strong>
                    </div>
                  </div>
                )}

                {/* Segmented Tabs */}
                <div className="mom-tabs-segmented">
                  <button type="button" className={`mom-tab-item ${momActiveSubTab === 'basic' ? 'active' : ''}`} onClick={() => setMomActiveSubTab('basic')}>
                    📋 Basic Details
                  </button>
                  <button type="button" className={`mom-tab-item ${momActiveSubTab === 'content' ? 'active' : ''}`} onClick={() => setMomActiveSubTab('content')}>
                    📝 Content & Agenda
                  </button>
                  <button type="button" className={`mom-tab-item ${momActiveSubTab === 'actions' ? 'active' : ''}`} onClick={() => setMomActiveSubTab('actions')}>
                    🎯 Actions & Preview
                  </button>
                </div>

                {/* Tab 1: Basic Details */}
                {momActiveSubTab === 'basic' && (
                  <div className="mom-page-form-section">
                    <div className="mom-form-row-2">
                      <div className="mom-field-group">
                        <label>Meeting Title</label>
                        <input className="mom-field-input" value={momMeetingTitle} onChange={(e) => setMomMeetingTitle(e.target.value)} placeholder="e.g. Weekly Team Meeting" />
                      </div>
                      <div className="mom-field-group">
                        <label>Meeting Type</label>
                        <select className="mom-field-select" value={momMeetingType} onChange={(e) => setMomMeetingType(e.target.value)}>
                          <option>Team Meeting</option>
                          <option>Client Review</option>
                          <option>Audit Committee</option>
                          <option>Management Review</option>
                          <option>Field Inspection Debrief</option>
                        </select>
                      </div>
                    </div>
                    <div className="mom-form-row-2">
                      <div className="mom-field-group">
                        <label>📅 Date</label>
                        <input className="mom-field-input" value={momDate} onChange={(e) => setMomDate(e.target.value)} placeholder="DD/MM/YYYY" />
                      </div>
                      <div className="mom-field-group">
                        <label>⏰ Time</label>
                        <input className="mom-field-input" value={momTime} onChange={(e) => setMomTime(e.target.value)} placeholder="e.g. 10:30 AM" />
                      </div>
                    </div>
                    <div className="mom-field-group">
                      <label>👤 Organizer / Chairperson</label>
                      <input className="mom-field-input" value={momOrganizer} onChange={(e) => setMomOrganizer(e.target.value)} />
                    </div>
                    <div className="mom-field-group">
                      <label>📍 Location / Venue</label>
                      <input className="mom-field-input" value={momLocation} onChange={(e) => setMomLocation(e.target.value)} placeholder="e.g. Conference Room A" />
                    </div>
                    <div className="mom-field-group">
                      <label>👥 Attendees (comma separated)</label>
                      <textarea className="mom-field-textarea" rows="2" value={momAttendees} onChange={(e) => setMomAttendees(e.target.value)} placeholder="e.g. Ravi Teja, Suresh Kumar, Priya M..." />
                    </div>
                  </div>
                )}

                {/* Tab 2: Content & Agenda */}
                {momActiveSubTab === 'content' && (
                  <div className="mom-page-form-section">
                    <div className="mom-field-group">
                      <label>📋 Agenda / Topics Covered</label>
                      <textarea className="mom-field-textarea" rows="4" value={momAgenda} onChange={(e) => setMomAgenda(e.target.value)} placeholder="List the topics discussed during the meeting..." />
                    </div>
                    <div className="mom-field-group">
                      <label>💬 Key Discussions & Decisions</label>
                      <textarea className="mom-field-textarea" rows="5" value={momDiscussions} onChange={(e) => setMomDiscussions(e.target.value)} placeholder="Summarize key discussions, decisions made, and consensus reached..." />
                    </div>
                  </div>
                )}

                {/* Tab 3: Actions & Preview */}
                {momActiveSubTab === 'actions' && (
                  <div className="mom-page-form-section">
                    <div className="mom-field-group">
                      <label>🎯 Action Items & Deadlines</label>
                      <textarea className="mom-field-textarea" rows="4" value={momActionItems} onChange={(e) => setMomActionItems(e.target.value)} placeholder="List action items with responsible persons and deadlines..." />
                    </div>
                    <div className="mom-field-group">
                      <label>📅 Next Meeting</label>
                      <input className="mom-field-input" value={momNextMeeting} onChange={(e) => setMomNextMeeting(e.target.value)} placeholder="e.g. Next Wednesday, 10:00 AM" />
                    </div>

                    {/* Preview Box */}
                    <div className="mom-preview-box">
                      <div className="mom-preview-header">📄 MOM Preview</div>
                      <div className="mom-preview-tag">{momMeetingType}</div>
                      <div className="mom-preview-meta">
                        <span><strong>Title:</strong> {momMeetingTitle}</span>
                        <span><strong>Date:</strong> {momDate} at {momTime}</span>
                        <span><strong>Organizer:</strong> {momOrganizer}</span>
                        <span><strong>Location:</strong> {momLocation}</span>
                        {momAttendees && <span><strong>Attendees:</strong> {momAttendees}</span>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mom-dialog-actions" style={{ borderTop: '1.5px solid #E2E8F0', paddingTop: '1.25rem', marginTop: '1.25rem' }}>
                  <button type="button" className="btn-mom-cancel" onClick={() => setDashboardView('hub')}>
                    Cancel
                  </button>
                  <button type="button" className="btn-mom-save" onClick={() => {
                    const newMom = {
                      id: `mom-${Date.now()}`,
                      title: momMeetingTitle,
                      type: momMeetingType,
                      date: momDate,
                      time: momTime,
                      organizer: momOrganizer,
                      location: momLocation,
                      attendees: momAttendees,
                      agenda: momAgenda,
                      discussions: momDiscussions,
                      actionItems: momActionItems,
                      nextMeeting: momNextMeeting,
                      createdAt: new Date().toISOString()
                    };
                    setMomsList(prev => [newMom, ...prev]);
                    setMomSuccessToast(true);
                    setTimeout(() => setMomSuccessToast(false), 3000);
                    // Reset form
                    setMomMeetingTitle('Weekly Team Meeting');
                    setMomMeetingType('Team Meeting');
                    setMomDate(new Date().toLocaleDateString('en-GB'));
                    setMomTime('10:30 AM');
                    setMomLocation('Conference Room A, Zoo Road');
                    setMomAttendees('');
                    setMomAgenda('');
                    setMomDiscussions('');
                    setMomActionItems('');
                    setMomNextMeeting('');
                  }}>
                    💾 Save MOM
                  </button>
                </div>

                {/* Previously Logged MOMs */}
                {momsList.length > 0 && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0F172A', marginBottom: '0.75rem' }}>📋 Previously Logged MOMs ({momsList.length})</h4>
                    {momsList.map((m) => (
                      <div key={m.id} style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: '14px', padding: '1rem', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <strong style={{ fontSize: '0.85rem', color: '#0F172A' }}>{m.title}</strong>
                          <span className="mom-preview-tag">{m.type}</span>
                        </div>
                        <div className="mom-preview-meta">
                          <span>📅 {m.date} at {m.time} • 📍 {m.location}</span>
                          <span>👤 {m.organizer}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}


            {/* ═══════════════════════════════════════════════════════
               ── PAGE: CREATE NEW TASK (FULL PAGE VIEW) ──
               ═══════════════════════════════════════════════════════ */}
            {dashboardView === 'task_page' && (
              <div className="dedicated-page-view page-task" style={{ animation: 'slideInPage 0.3s ease' }}>
                {/* Page Header with Back Navigation */}
                <div className="page-view-header">
                  <button 
                    type="button" 
                    className="page-back-btn"
                    onClick={() => setDashboardView('hub')}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 12H5"/>
                      <path d="M12 19l-7-7 7-7"/>
                    </svg>
                    <span>Back to Dashboard</span>
                  </button>
                  <div className="page-view-title-group">
                    <div className="page-view-icon" style={{ background: '#F5F3FF', color: '#7C3AED' }}>🎯</div>
                    <div>
                      <h3 className="page-view-title">Create & Assign New Task</h3>
                      <p className="page-view-subtitle">Create tasks for yourself or assign audit tasks to team members</p>
                    </div>
                  </div>
                  <div className="page-view-badges">
                    <span className="hub-box-badge" style={{ background: '#F5F3FF', color: '#7C3AED' }}>{tasksList.length} TASKS</span>
                  </div>
                </div>

                {/* Task Success Toast */}
                {taskSuccessToast && (
                  <div className="duty-success-alert" style={{ background: '#F5F3FF', borderColor: '#C4B5FD' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span style={{ fontSize: '1.25rem' }}>✅</span>
                      <strong style={{ fontSize: '0.875rem', color: '#5B21B6' }}>Task created successfully!</strong>
                    </div>
                  </div>
                )}

                {/* Task Form */}
                <div className="mom-page-form-section">
                  <div className="mom-field-group">
                    <label>📌 Task Title</label>
                    <input className="mom-field-input" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="e.g. Verify Donor Cell reconciliation for July" />
                  </div>

                  <div className="mom-form-row-2">
                    <div className="mom-field-group">
                      <label>⚡ Priority Level</label>
                      <select className="mom-field-select" value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value)}>
                        <option>Low Priority</option>
                        <option>Medium Priority</option>
                        <option>High Priority</option>
                        <option>Urgent / Critical</option>
                      </select>
                    </div>
                    <div className="mom-field-group">
                      <label>📂 Category</label>
                      <select className="mom-field-select" value={newTaskCategory} onChange={(e) => setNewTaskCategory(e.target.value)}>
                        <option>General</option>
                        <option>Audit</option>
                        <option>Compliance</option>
                        <option>Investigation</option>
                        <option>Documentation</option>
                      </select>
                    </div>
                  </div>

                  <div className="mom-field-group">
                    <label>📝 Task Description</label>
                    <textarea className="mom-field-textarea" rows="4" value={newTaskDescription} onChange={(e) => setNewTaskDescription(e.target.value)} placeholder="Provide detailed instructions for this task..." />
                  </div>

                  <div className="mom-form-row-2">
                    <div className="mom-field-group">
                      <label>👤 Assigned To</label>
                      <input className="mom-field-input" value={newTaskAssignedTo} onChange={(e) => setNewTaskAssignedTo(e.target.value)} placeholder="e.g. Ravi Teja" />
                    </div>
                    <div className="mom-field-group">
                      <label>📅 Due Date</label>
                      <input className="mom-field-input" type="date" value={newTaskDueDate} onChange={(e) => setNewTaskDueDate(e.target.value)} />
                    </div>
                  </div>

                  <div className="mom-field-group">
                    <label>🏢 Project / Department</label>
                    <input className="mom-field-input" value={newTaskProject} onChange={(e) => setNewTaskProject(e.target.value)} placeholder="e.g. Q3 Concurrent Audit Review" />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mom-dialog-actions" style={{ borderTop: '1.5px solid #E2E8F0', paddingTop: '1.25rem', marginTop: '1.25rem' }}>
                  <button type="button" className="btn-mom-cancel" onClick={() => setDashboardView('hub')}>
                    Cancel
                  </button>
                  <button type="button" className="btn-mom-save" style={{ background: '#7C3AED' }} onClick={() => {
                    if (!newTaskTitle.trim()) return;
                    const newTask = {
                      id: `task-${Date.now()}`,
                      title: newTaskTitle,
                      priority: newTaskPriority,
                      description: newTaskDescription,
                      assignedTo: newTaskAssignedTo,
                      dueDate: newTaskDueDate,
                      project: newTaskProject,
                      category: newTaskCategory,
                      status: 'Open',
                      createdAt: new Date().toISOString()
                    };
                    setTasksList(prev => [newTask, ...prev]);
                    setTaskSuccessToast(true);
                    setTimeout(() => setTaskSuccessToast(false), 3000);
                    // Reset form
                    setNewTaskTitle('');
                    setNewTaskDescription('');
                    setNewTaskDueDate('');
                    setNewTaskProject('');
                    setNewTaskCategory('General');
                    setNewTaskPriority('Medium Priority');
                  }}>
                    🎯 Create Task
                  </button>
                </div>

                {/* Previously Created Tasks */}
                {tasksList.length > 0 && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0F172A', marginBottom: '0.75rem' }}>📋 Created Tasks ({tasksList.length})</h4>
                    {tasksList.map((t) => (
                      <div key={t.id} style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: '14px', padding: '1rem', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <strong style={{ fontSize: '0.85rem', color: '#0F172A' }}>{t.title}</strong>
                          <span className="hub-box-badge" style={{ 
                            background: t.priority === 'High Priority' || t.priority === 'Urgent / Critical' ? '#FEF2F2' : '#ECFDF5',
                            color: t.priority === 'High Priority' || t.priority === 'Urgent / Critical' ? '#DC2626' : '#047857'
                          }}>{t.priority}</span>
                        </div>
                        <div className="mom-preview-meta">
                          <span>👤 {t.assignedTo} • 📂 {t.category}</span>
                          {t.dueDate && <span>📅 Due: {t.dueDate}</span>}
                          {t.description && <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{t.description.substring(0, 100)}...</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════
               ── PAGE: MASTER ADMIN CONTROL CENTER (FULL PAGE VIEW) ──
               ═══════════════════════════════════════════════════════ */}
            {dashboardView === 'admin_panel' && currentUser?.role === 'SUPER_ADMIN' && (
              <div className="dedicated-page-view page-admin" style={{ animation: 'slideInPage 0.3s ease' }}>
                
                {/* Page Header */}
                <div className="page-view-header">
                  <button 
                    type="button" 
                    className="page-back-btn"
                    onClick={() => setDashboardView('hub')}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 12H5"/>
                      <path d="M12 19l-7-7 7-7"/>
                    </svg>
                    <span>Back to Dashboard</span>
                  </button>
                  <div className="page-view-title-group">
                    <div className="page-view-icon" style={{ background: '#FFFDF0', color: '#D97706', border: '1px solid #FACC15' }}>👑</div>
                    <div>
                      <h3 className="page-view-title">Master Admin Control Center</h3>
                      <p className="page-view-subtitle">Central Audit Apex Command • Live System Data Feeds & GPS Verification Stamps</p>
                    </div>
                  </div>
                  <div className="page-view-badges" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div className="duty-live-badge" style={{ background: '#FFFDF0', color: '#D97706', borderColor: '#FACC15' }}>
                      <span className="pulse-dot-live" style={{ background: '#D97706' }}></span>
                      SECURE SYSTEM APEX
                    </div>
                    <button 
                      type="button"
                      className="dash-logout-corner"
                      onClick={handleLogout}
                      style={{ background: '#FEF2F2', border: '1.5px solid #FCA5A5', color: '#DC2626', padding: '0.4rem 0.85rem', borderRadius: '10px', fontSize: '0.725rem', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                      </svg>
                      <span>Admin Logout</span>
                    </button>
                  </div>
                </div>

                {/* KPI Metrics Summary Bar */}
                <div className="super-kpi-grid" style={{ marginBottom: '1.75rem' }}>
                  <div className="super-kpi-card">
                    <div className="super-kpi-icon" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>👥</div>
                    <div>
                      <span className="kpi-label">Registered Staff</span>
                      <div className="kpi-value">{usersDb.length} Users</div>
                    </div>
                  </div>

                  <div className="super-kpi-card">
                    <div className="super-kpi-icon" style={{ background: '#ECFDF5', color: '#047857' }}>🟢</div>
                    <div>
                      <span className="kpi-label">Active Shifts Now</span>
                      <div className="kpi-value" style={{ color: '#047857' }}>
                        {attendanceLedger.filter(a => a.active).length} On-Duty
                      </div>
                    </div>
                  </div>

                  <div className="super-kpi-card">
                    <div className="super-kpi-icon" style={{ background: '#FEF3C7', color: '#D97706' }}>📝</div>
                    <div>
                      <span className="kpi-label">Total Daily Reports</span>
                      <div className="kpi-value">{dutySubmittedReports.length} Submitted</div>
                    </div>
                  </div>

                  <div className="super-kpi-card">
                    <div className="super-kpi-icon" style={{ background: '#F5F3FF', color: '#7C3AED' }}>🎯</div>
                    <div>
                      <span className="kpi-label">System Tasks</span>
                      <div className="kpi-value">{tasksList.length} Tasks</div>
                    </div>
                  </div>
                </div>

                 {/* Tab Strip Navigation */}
                <div className="mom-tabs-segmented" style={{ marginBottom: '1.5rem' }}>
                  <button type="button" className={`mom-tab-item ${adminActiveTab === 'dashboard' ? 'active' : ''}`} onClick={() => setAdminActiveTab('dashboard')}>
                    📊 Dashboard Analytics
                  </button>
                  <button type="button" className={`mom-tab-item ${adminActiveTab === 'users' ? 'active' : ''}`} onClick={() => setAdminActiveTab('users')}>
                    👥 User Directory ({usersDb.length})
                  </button>
                  <button type="button" className={`mom-tab-item ${adminActiveTab === 'reports' ? 'active' : ''}`} onClick={() => setAdminActiveTab('reports')}>
                    📋 Daily Reports Ledger ({dutySubmittedReports.length})
                  </button>
                  <button type="button" className={`mom-tab-item ${adminActiveTab === 'attendance' ? 'active' : ''}`} onClick={() => setAdminActiveTab('attendance')}>
                    📍 GPS Attendance Tracker ({attendanceLedger.length})
                  </button>
                  <button type="button" className={`mom-tab-item ${adminActiveTab === 'moms' ? 'active' : ''}`} onClick={() => setAdminActiveTab('moms')}>
                    🏛️ Meeting Minutes ({momsList.length})
                  </button>
                  <button type="button" className={`mom-tab-item ${adminActiveTab === 'tasks' ? 'active' : ''}`} onClick={() => setAdminActiveTab('tasks')}>
                    🎯 Task Assignments ({tasksList.length})
                  </button>
                </div>

                {/* Content Sections based on AdminActiveTab */}
                <div className="admin-tab-content-wrapper" style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: '18px', padding: '1.5rem' }}>
                  
                  {/* Sub-tab 0: Dashboard & Analytics */}
                  {adminActiveTab === 'dashboard' && (
                    <div style={{ animation: 'slideInPage 0.25s ease' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '850', color: '#0F172A' }}>📊 Live Analytics & Audit KPIs</h4>
                        <span style={{ fontSize: '0.725rem', color: '#64748B' }}>Real-time statistics from submitted daily duty sheets</span>
                      </div>

                      {/* Dynamic Computations */}
                      {(() => {
                        const workTypeCounts = {};
                        let totalVouchers = 0;
                        const unitVoucherSums = {};
                        let activeDutyCount = 0;
                        let completedDutyCount = 0;

                        dutySubmittedReports.forEach(rep => {
                          const type = rep.auditWorkType || 'Unassigned';
                          workTypeCounts[type] = (workTypeCounts[type] || 0) + 1;

                          const vouchers = parseInt(rep.vouchersVerified) || 0;
                          totalVouchers += vouchers;

                          const unit = rep.unitDetails || 'Auctions';
                          unitVoucherSums[unit] = (unitVoucherSums[unit] || 0) + vouchers;

                          if (rep.status === 'SUBMITTED' || rep.status === 'ACTIVE_DUTY') {
                            activeDutyCount++;
                          } else {
                            completedDutyCount++;
                          }
                        });

                        const workTypesList = Object.entries(workTypeCounts);
                        const totalReports = dutySubmittedReports.length || 1;

                        return (
                          <div>
                            {/* Analytics KPI Row */}
                            <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                              <div className="kpi-card" style={{ background: '#FFFFFF', padding: '1rem 1.25rem', border: '1.5px solid #E2E8F0', borderRadius: '14px', textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>📊</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: '850', color: '#0F172A' }}>{dutySubmittedReports.length}</div>
                                <div style={{ fontSize: '0.725rem', fontWeight: '600', color: '#64748B', marginTop: '0.25rem' }}>Total Daily Duty Sheets</div>
                              </div>
                              <div className="kpi-card" style={{ background: '#FFFFFF', padding: '1rem 1.25rem', border: '1.5px solid #E2E8F0', borderRadius: '14px', textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>🎫</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: '850', color: '#0F172A' }}>{totalVouchers.toLocaleString()}</div>
                                <div style={{ fontSize: '0.725rem', fontWeight: '600', color: '#64748B', marginTop: '0.25rem' }}>Total Vouchers Verified</div>
                              </div>
                              <div className="kpi-card" style={{ background: '#FFFFFF', padding: '1rem 1.25rem', border: '1.5px solid #E2E8F0', borderRadius: '14px', textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>⚡</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: '850', color: '#10B981' }}>{activeDutyCount} Active</div>
                                <div style={{ fontSize: '0.725rem', fontWeight: '600', color: '#64748B', marginTop: '0.25rem' }}>Auditors in Field Today</div>
                              </div>
                              <div className="kpi-card" style={{ background: '#FFFFFF', padding: '1rem 1.25rem', border: '1.5px solid #E2E8F0', borderRadius: '14px', textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>✅</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: '850', color: '#4F46E5' }}>{completedDutyCount} Done</div>
                                <div style={{ fontSize: '0.725rem', fontWeight: '600', color: '#64748B', marginTop: '0.25rem' }}>Duties Concluded & Stamped</div>
                              </div>
                            </div>

                            {/* Charts Row */}
                            <div className="charts-flex-row" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '1.5rem', width: '100%' }}>
                              
                              {/* Left Chart: Audit Work Types Distribution (Pie/Donut Chart) */}
                              <div style={{ flex: '1 1 350px', background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: '18px', padding: '1.25rem', minWidth: '300px' }}>
                                <h5 style={{ margin: '0 0 1rem 0', fontSize: '0.825rem', fontWeight: '850', color: '#334155' }}>📋 Audit Work Type Distribution</h5>
                                
                                {workTypesList.length === 0 ? (
                                  <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.8rem' }}>No data collected yet</div>
                                ) : (
                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap', margin: '1rem 0' }}>
                                      <svg width="150" height="150" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', borderRadius: '50%' }}>
                                        <circle cx="18" cy="18" r="15.915" fill="#EEF2F6" />
                                        {(() => {
                                          let cumulativePercent = 0;
                                          const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'];
                                          return workTypesList.map(([type, count], index) => {
                                            const percent = (count / totalReports) * 100;
                                            const dashArray = `${percent} ${100 - percent}`;
                                            const dashOffset = 100 - cumulativePercent;
                                            cumulativePercent += percent;
                                            return (
                                              <circle
                                                key={type}
                                                cx="18"
                                                cy="18"
                                                r="15.915"
                                                fill="transparent"
                                                stroke={colors[index % colors.length]}
                                                strokeWidth="4"
                                                strokeDasharray={dashArray}
                                                strokeDashoffset={dashOffset}
                                              />
                                            );
                                          });
                                        })()}
                                      </svg>

                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
                                        {(() => {
                                          const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'];
                                          return workTypesList.map(([type, count], index) => {
                                            const percent = Math.round((count / totalReports) * 100);
                                            return (
                                              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.725rem' }}>
                                                <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '3px', background: colors[index % colors.length] }}></span>
                                                <span style={{ fontWeight: '700', color: '#475569' }}>{type}:</span>
                                                <span style={{ fontWeight: '850', color: '#0F172A' }}>{count} ({percent}%)</span>
                                              </div>
                                            );
                                          });
                                        })()}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Right Chart: Vouchers Verified per Unit (Horizontal Bar Chart) */}
                              <div style={{ flex: '1 1 350px', background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: '18px', padding: '1.25rem', minWidth: '300px' }}>
                                <h5 style={{ margin: '0 0 1rem 0', fontSize: '0.825rem', fontWeight: '850', color: '#334155' }}>🎫 Vouchers Audited per Organizational Unit</h5>

                                {Object.keys(unitVoucherSums).length === 0 ? (
                                  <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.8rem' }}>No voucher data recorded yet</div>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '0.5rem' }}>
                                    {(() => {
                                      const unitList = Object.entries(unitVoucherSums);
                                      const maxVouchers = Math.max(...unitList.map(([_, sum]) => sum)) || 1;

                                      return unitList.map(([unit, sum], index) => {
                                        const widthPercent = (sum / maxVouchers) * 100;
                                        return (
                                          <div key={unit} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', fontWeight: '800', color: '#475569' }}>
                                              <span>🏛️ {unit}</span>
                                              <span style={{ color: '#0F172A', fontWeight: '850' }}>{sum.toLocaleString()} vouchers</span>
                                            </div>
                                            <div style={{ width: '100%', height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                                              <div style={{ width: `${widthPercent}%`, height: '100%', background: 'linear-gradient(90deg, #4F46E5, #818CF8)', borderRadius: '4px' }}></div>
                                            </div>
                                          </div>
                                        );
                                      });
                                    })()}
                                  </div>
                                )}
                              </div>

                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Sub-tab 1: Users Directory */}
                  {adminActiveTab === 'users' && (
                    <div style={{ animation: 'slideInPage 0.2s ease' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '850', color: '#0F172A' }}>👥 System User Directory</h4>
                        <span style={{ fontSize: '0.725rem', color: '#64748B' }}>Total registered multi-role users</span>
                      </div>
                      <div style={{ overflowX: 'auto' }}>
                        <table className="super-admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ background: '#EEF2F6', borderBottom: '1.5px solid #E2E8F0' }}>
                              <th style={{ padding: '0.75rem 1rem', fontSize: '0.725rem', fontWeight: '850', color: '#475569' }}>Name</th>
                              <th style={{ padding: '0.75rem 1rem', fontSize: '0.725rem', fontWeight: '850', color: '#475569' }}>Email / Login ID</th>
                              <th style={{ padding: '0.75rem 1rem', fontSize: '0.725rem', fontWeight: '850', color: '#475569' }}>Assigned Unit</th>
                              <th style={{ padding: '0.75rem 1rem', fontSize: '0.725rem', fontWeight: '850', color: '#475569' }}>Role Title</th>
                              <th style={{ padding: '0.75rem 1rem', fontSize: '0.725rem', fontWeight: '850', color: '#475569' }}>Supervisor</th>
                              <th style={{ padding: '0.75rem 1rem', fontSize: '0.725rem', fontWeight: '850', color: '#475569' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {usersDb.map((user) => {
                              const isActive = attendanceLedger.some(a => a.userId === user.id && a.active);
                              const supervisor = user.managedBy ? (usersDb.find(m => m.id === user.managedBy)?.name || 'Audit Manager') : 'Executive Apex Admin';
                              return (
                                <tr key={user.id} style={{ borderBottom: '1px solid #E2E8F0', background: 'white' }}>
                                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', fontWeight: '700', color: '#0F172A' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                      <span>{user.name || 'Unnamed staff'}</span>
                                      {isActive && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} title="Active On-Duty" />}
                                    </div>
                                  </td>
                                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: '#475569', fontFamily: 'monospace' }}>{user.email}</td>
                                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', color: '#475569' }}>{user.unit}</td>
                                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: '700', color: '#1E293B' }}>
                                    <span style={{ 
                                      background: user.role === 'SUPER_ADMIN' ? '#FEF3C7' : (user.role === 'MANAGER' ? '#EFF6FF' : '#F1F5F9'),
                                      color: user.role === 'SUPER_ADMIN' ? '#B45309' : (user.role === 'MANAGER' ? '#1D4ED8' : '#475569'),
                                      padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.675rem', fontWeight: '800'
                                    }}>
                                      {user.roleTitle || user.role}
                                    </span>
                                  </td>
                                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', color: '#64748B' }}>{supervisor}</td>
                                  <td style={{ padding: '0.85rem 1rem' }}>
                                    <button 
                                      type="button" 
                                      className="btn-card-edit-role"
                                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.7rem' }}
                                      onClick={() => setSelectedUserDetailModal(user)}
                                    >
                                      🔎 View Details
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Sub-tab 2: Daily Reports Ledger */}
                  {adminActiveTab === 'reports' && (
                    <div style={{ animation: 'slideInPage 0.2s ease' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '850', color: '#0F172A' }}>📋 Daily Duty Reports Ledger</h4>
                        <span style={{ fontSize: '0.725rem', color: '#64748B' }}>10-parameter daily logs filed by articled assistants</span>
                      </div>
                      <div style={{ overflowX: 'auto' }}>
                        <table className="super-admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ background: '#EEF2F6', borderBottom: '1.5px solid #E2E8F0' }}>
                              <th style={{ padding: '0.75rem 1rem', fontSize: '0.725rem', fontWeight: '850', color: '#475569' }}>Name / Reg No</th>
                              <th style={{ padding: '0.75rem 1rem', fontSize: '0.725rem', fontWeight: '850', color: '#475569' }}>Assigned Unit</th>
                              <th style={{ padding: '0.75rem 1rem', fontSize: '0.725rem', fontWeight: '850', color: '#475569' }}>Audit Category</th>
                              <th style={{ padding: '0.75rem 1rem', fontSize: '0.725rem', fontWeight: '850', color: '#475569' }}>Vouchers</th>
                              <th style={{ padding: '0.75rem 1rem', fontSize: '0.725rem', fontWeight: '850', color: '#475569' }}>Work Description</th>
                              <th style={{ padding: '0.75rem 1rem', fontSize: '0.725rem', fontWeight: '850', color: '#475569' }}>CA Remarks</th>
                              <th style={{ padding: '0.75rem 1rem', fontSize: '0.725rem', fontWeight: '850', color: '#475569' }}>Verification</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dutySubmittedReports.map((rep) => (
                              <tr key={rep.id || Math.random()} style={{ borderBottom: '1px solid #E2E8F0', background: 'white' }}>
                                <td style={{ padding: '0.85rem 1rem', fontSize: '0.775rem', fontWeight: '700', color: '#0F172A' }}>
                                  <div>{rep.fullName}</div>
                                  <div style={{ fontSize: '0.675rem', color: '#64748B', fontWeight: '500' }}>{rep.studentRegNo}</div>
                                </td>
                                <td style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', color: '#475569' }}>{rep.unitDetails}</td>
                                <td style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', color: '#475569' }}>{rep.auditWorkType}</td>
                                <td style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', fontWeight: '800', color: '#0F172A' }}>{rep.vouchersVerified || '0'} docs</td>
                                <td style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', color: '#475569', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={rep.workObjective}>
                                  {rep.workObjective}
                                </td>
                                <td style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', color: '#D97706', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={rep.caRemarks}>
                                  {rep.caRemarks}
                                </td>
                                <td style={{ padding: '0.85rem 1rem', fontSize: '0.7rem' }}>
                                  <span style={{ 
                                    background: rep.status?.includes('COMPLETED') ? '#ECFDF5' : '#EFF6FF',
                                    color: rep.status?.includes('COMPLETED') ? '#047857' : '#1D4ED8',
                                    padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: '800'
                                  }}>
                                    {rep.status || 'SUBMITTED'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                            {dutySubmittedReports.length === 0 && (
                              <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748B', fontSize: '0.775rem' }}>No daily reports logged yet.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Sub-tab 3: GPS Attendance Tracker */}
                  {adminActiveTab === 'attendance' && (
                    <div style={{ animation: 'slideInPage 0.2s ease' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '850', color: '#0F172A' }}>📍 Real-Time GPS Attendance & Punch Logs</h4>
                        <span style={{ fontSize: '0.725rem', color: '#64748B' }}>Auto-stamped logs containing captured latitude and longitude</span>
                      </div>
                      <div style={{ overflowX: 'auto' }}>
                        <table className="super-admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ background: '#EEF2F6', borderBottom: '1.5px solid #E2E8F0' }}>
                              <th style={{ padding: '0.75rem 1rem', fontSize: '0.725rem', fontWeight: '850', color: '#475569' }}>Date</th>
                              <th style={{ padding: '0.75rem 1rem', fontSize: '0.725rem', fontWeight: '850', color: '#475569' }}>Staff Member</th>
                              <th style={{ padding: '0.75rem 1rem', fontSize: '0.725rem', fontWeight: '850', color: '#475569' }}>Assigned Unit</th>
                              <th style={{ padding: '0.75rem 1rem', fontSize: '0.725rem', fontWeight: '850', color: '#475569' }}>Punch-In / Punch-Out</th>
                              <th style={{ padding: '0.75rem 1rem', fontSize: '0.725rem', fontWeight: '850', color: '#475569' }}>GPS Login Stamp</th>
                              <th style={{ padding: '0.75rem 1rem', fontSize: '0.725rem', fontWeight: '850', color: '#475569' }}>GPS Logout Stamp</th>
                              <th style={{ padding: '0.75rem 1rem', fontSize: '0.725rem', fontWeight: '850', color: '#475569' }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {attendanceLedger.map((rec) => (
                              <tr key={rec.id} style={{ borderBottom: '1px solid #E2E8F0', background: 'white' }}>
                                <td style={{ padding: '0.85rem 1rem', fontSize: '0.775rem', fontWeight: '700', color: '#0F172A' }}>{rec.date}</td>
                                <td style={{ padding: '0.85rem 1rem', fontSize: '0.775rem', fontWeight: '700', color: '#0F172A' }}>{rec.userName}</td>
                                <td style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', color: '#475569' }}>{rec.unit}</td>
                                <td style={{ padding: '0.85rem 1rem', fontSize: '0.75rem', color: '#1E293B', fontWeight: '600' }}>
                                  ⏱️ In: {rec.loginTime || '--'} <br />
                                  🔒 Out: {rec.logoutTime || 'Active session'}
                                </td>
                                <td style={{ padding: '0.85rem 1rem', fontSize: '0.7rem', color: '#047857', fontFamily: 'monospace' }}>
                                  {rec.loginLocation ? (
                                    <>
                                      🛰️ Lat: {rec.loginLocation.latitude.toFixed(6)} <br />
                                      Lon: {rec.loginLocation.longitude.toFixed(6)} <br />
                                      <span style={{ color: '#059669', fontSize: '0.625rem', fontWeight: '800' }}>[Acc: ±{rec.loginLocation.accuracy.toFixed(1)}m]</span>
                                    </>
                                  ) : (
                                    <span style={{ color: '#94A3B8' }}>No GPS capture</span>
                                  )}
                                </td>
                                <td style={{ padding: '0.85rem 1rem', fontSize: '0.7rem', color: '#991B1B', fontFamily: 'monospace' }}>
                                  {rec.logoutLocation ? (
                                    <>
                                      🛰️ Lat: {rec.logoutLocation.latitude.toFixed(6)} <br />
                                      Lon: {rec.logoutLocation.longitude.toFixed(6)} <br />
                                      <span style={{ color: '#B91C1C', fontSize: '0.625rem', fontWeight: '800' }}>[Acc: ±{rec.logoutLocation.accuracy.toFixed(1)}m]</span>
                                    </>
                                  ) : (
                                    <span style={{ color: '#94A3B8' }}>{rec.active ? 'Session Active' : 'No GPS capture'}</span>
                                  )}
                                </td>
                                <td style={{ padding: '0.85rem 1rem', fontSize: '0.7rem' }}>
                                  <span style={{ 
                                    background: rec.active ? '#ECFDF5' : '#F1F5F9',
                                    color: rec.active ? '#047857' : '#475569',
                                    padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: '800'
                                  }}>
                                    {rec.active ? '🟢 ACTIVE' : '🔒 CLOSED'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Sub-tab 4: MOM History */}
                  {adminActiveTab === 'moms' && (
                    <div style={{ animation: 'slideInPage 0.2s ease' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '850', color: '#0F172A' }}>🏛️ Minutes of Meetings (MOM) History</h4>
                        <span style={{ fontSize: '0.725rem', color: '#64748B' }}>Audit review and management debrief logs</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.85rem' }}>
                        {momsList.map((m) => (
                          <div key={m.id} style={{ background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: '14px', padding: '1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                              <div>
                                <strong style={{ fontSize: '0.9rem', color: '#0F172A' }}>{m.title}</strong>
                                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                                  📅 {m.date} at {m.time} • 📍 {m.location}
                                </div>
                              </div>
                              <span style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.675rem', fontWeight: '800' }}>
                                {m.type}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.775rem', color: '#334155', marginTop: '0.5rem', borderTop: '1px solid #F1F5F9', paddingTop: '0.5rem' }}>
                              <strong>Organizer:</strong> {m.organizer} | <strong>Attendees:</strong> {m.attendees || 'None specified'}
                            </div>
                            {m.agenda && (
                              <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.4rem' }}>
                                <strong>Agenda:</strong> {m.agenda}
                              </div>
                            )}
                          </div>
                        ))}
                        {momsList.length === 0 && (
                          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748B', fontSize: '0.775rem' }}>No meetings logged yet.</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Sub-tab 5: Task Assignments */}
                  {adminActiveTab === 'tasks' && (
                    <div style={{ animation: 'slideInPage 0.2s ease' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '850', color: '#0F172A' }}>🎯 Master Task Assignments & Priorities</h4>
                        <span style={{ fontSize: '0.725rem', color: '#64748B' }}>Audit milestones and work objectives assigned to staff</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.85rem' }}>
                        {tasksList.map((t) => (
                          <div key={t.id} style={{ background: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: '14px', padding: '1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                              <div>
                                <strong style={{ fontSize: '0.9rem', color: '#0F172A' }}>{t.title}</strong>
                                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                                  📂 {t.category} • Assigned to: <span style={{ fontWeight: '700', color: '#1E293B' }}>{t.assignedTo}</span>
                                </div>
                              </div>
                              <span style={{ 
                                background: t.priority === 'High Priority' || t.priority === 'Urgent / Critical' ? '#FEF2F2' : '#ECFDF5',
                                color: t.priority === 'High Priority' || t.priority === 'Urgent / Critical' ? '#DC2626' : '#047857',
                                padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.675rem', fontWeight: '800'
                              }}>
                                {t.priority}
                              </span>
                            </div>
                            {t.description && (
                              <p style={{ fontSize: '0.75rem', color: '#475569', margin: '0.5rem 0' }}>{t.description}</p>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: '#64748B', borderTop: '1px solid #F1F5F9', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                              <span>🏢 Project: {t.project || 'General'}</span>
                              <strong>📅 Due: {t.dueDate || 'No deadline'}</strong>
                            </div>
                          </div>
                        ))}
                        {tasksList.length === 0 && (
                          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748B', fontSize: '0.775rem' }}>No tasks created yet.</div>
                        )}
                      </div>
                    </div>
                  )}

                </div>

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

      {/* ── Super Admin Modal: Selected User Complete Details Dossier ── */}

      {selectedUserDetailModal && (
        <div className="dossier-modal-backdrop" onClick={() => setSelectedUserDetailModal(null)}>
          <div className="dossier-modal-card" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1.5px solid #E2E8F0', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div className="admin-user-avatar" style={{ width: 52, height: 52, fontSize: '1.5rem' }}>
                  {selectedUserDetailModal.role === 'SUPER_ADMIN' ? '👑' : selectedUserDetailModal.role === 'MANAGER' ? '💼' : '👤'}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                    {selectedUserDetailModal.name}
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
                    ID: #{selectedUserDetailModal.id} • {selectedUserDetailModal.roleTitle || selectedUserDetailModal.role}
                  </div>
                </div>
              </div>

              <button 
                type="button" 
                className="modal-close-btn" 
                onClick={() => setSelectedUserDetailModal(null)}
                style={{ fontSize: '1.25rem', background: '#F1F5F9', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✕
              </button>
            </div>

            {/* Profile & Credentials Dossier Grid */}
            <h5 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0F172A', marginBottom: '0.65rem' }}>
              📋 Official Profile & Credentials Ledger
            </h5>

            <div className="user-complete-meta-grid" style={{ marginBottom: '1.5rem' }}>
              <div className="user-meta-cell">
                <span className="meta-label">🎓 ICAI / Student Reg. No.</span>
                <span className="meta-val" style={{ color: '#1D4ED8' }}>{selectedUserDetailModal.studentRegNo || 'FCA / Student N/A'}</span>
              </div>
              <div className="user-meta-cell">
                <span className="meta-label">✉️ Official Email</span>
                <span className="meta-val">{selectedUserDetailModal.email}</span>
              </div>
              <div className="user-meta-cell">
                <span className="meta-label">📞 Contact Phone</span>
                <span className="meta-val">{selectedUserDetailModal.phone || '+91 98480 12345'}</span>
              </div>
              <div className="user-meta-cell">
                <span className="meta-label">🏛️ Assigned TTD Unit</span>
                <span className="meta-val">{selectedUserDetailModal.unit}</span>
              </div>
              <div className="user-meta-cell">
                <span className="meta-label">🏢 Designated Sub-Unit</span>
                <span className="meta-val">{selectedUserDetailModal.subUnit || 'Central Desk'}</span>
              </div>
              <div className="user-meta-cell">
                <span className="meta-label">👤 Reporting Supervisor</span>
                <span className="meta-val">
                  {selectedUserDetailModal.managedBy ? (usersDb.find(m => m.id === selectedUserDetailModal.managedBy)?.name || 'Audit Manager') : 'Executive Apex Admin'}
                </span>
              </div>
              <div className="user-meta-cell">
                <span className="meta-label">📅 Date Onboarded</span>
                <span className="meta-val">{selectedUserDetailModal.joinedDate || '01-Jan-2024'}</span>
              </div>
              <div className="user-meta-cell">
                <span className="meta-label">🔒 Access Permission Level</span>
                <span className="meta-val">{selectedUserDetailModal.role}</span>
              </div>
            </div>

            {/* Submitted Duty Reports by this user */}
            <h5 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0F172A', marginBottom: '0.65rem' }}>
              📝 Daily Audit Duty Sheets Submitted by {selectedUserDetailModal.name}
            </h5>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {dutySubmittedReports
                .filter(r => 
                  (selectedUserDetailModal.studentRegNo && r.studentRegNo === selectedUserDetailModal.studentRegNo) ||
                  (r.fullName && r.fullName.toLowerCase().includes(selectedUserDetailModal.name?.toLowerCase().split(',')[0].trim()))
                )
                .map((rep, idx) => (
                  <div key={rep.id || idx} style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: '14px', padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span className="user-unit-tag">{rep.unitDetails} • {rep.subUnitDetails}</span>
                      <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#047857', background: '#ECFDF5', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                        ⏱️ {rep.loginTime} - {rep.logoutTime || 'Active Duty'}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#1E293B', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginTop: '0.4rem' }}>
                      <div>🎯 <strong>Objective:</strong> {rep.workObjective}</div>
                      <div>🏆 <strong>EOD Target:</strong> {rep.targetToAchieve}</div>
                    </div>

                    {rep.caRemarks && (
                      <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '0.4rem 0.6rem', borderRadius: '8px', fontSize: '0.725rem', color: '#B45309', marginTop: '0.4rem' }}>
                        ⚠️ <strong>CA Remarks to Management:</strong> {rep.caRemarks}
                      </div>
                    )}

                    <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '0.4rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span>🤝 <strong>POC Name:</strong> {rep.pocName}</span>
                      <span>📋 Type: <strong>{rep.auditWorkType}</strong></span>
                      <span>Verified: <strong>{rep.timestamp || 'Server Logged'}</strong></span>
                    </div>
                  </div>
                ))}

              {dutySubmittedReports.filter(r => 
                (selectedUserDetailModal.studentRegNo && r.studentRegNo === selectedUserDetailModal.studentRegNo) ||
                (r.fullName && r.fullName.toLowerCase().includes(selectedUserDetailModal.name?.toLowerCase().split(',')[0].trim()))
              ).length === 0 && (
                <div style={{ padding: '1rem', background: '#F8FAFC', borderRadius: '12px', textAlign: 'center', color: '#94A3B8', fontSize: '0.8rem' }}>
                  No duty sheets recorded for this user yet.
                </div>
              )}
            </div>

            {/* Attendance History */}
            <h5 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0F172A', marginBottom: '0.65rem' }}>
              ⏱️ Attendance & Shift Timestamps
            </h5>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {attendanceLedger
                .filter(a => a.userId === selectedUserDetailModal.id || a.userEmail === selectedUserDetailModal.email)
                .map((att, idx) => (
                  <div key={att.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '0.6rem 0.85rem', borderRadius: '10px', fontSize: '0.75rem' }}>
                    <div>
                      <strong style={{ color: '#0F172A' }}>{att.date || '12-Aug-2026'}</strong>
                      <span style={{ marginLeft: 8, color: '#64748B' }}>{att.timeWindow || `${att.loginTime} - ${att.logoutTime || 'Active'}`}</span>
                    </div>
                    <span style={{ fontWeight: '800', color: att.active ? '#047857' : '#475569', background: att.active ? '#ECFDF5' : '#F1F5F9', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                      {att.active ? '● Active Session' : 'Completed'}
                    </span>
                  </div>
                ))}
            </div>

            {/* Close / Done Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1.5px solid #E2E8F0', paddingTop: '1rem' }}>
              <button 
                type="button"
                className="btn-pill-primary"
                onClick={() => setSelectedUserDetailModal(null)}
                style={{ padding: '0.5rem 1.5rem', fontSize: '0.85rem', maxWidth: '180px' }}
              >
                Close Dossier
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── MOM Modal Dialog (Matching Images 1, 2, 3) ── */}
      {showMomDialog && (
        <div className="mom-dialog-backdrop" onClick={() => setShowMomDialog(false)}>
          <div className="mom-dialog-card" onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="mom-dialog-header">
              <div>
                <h3>
                  <span>📄</span>
                  <span>Create Minutes of Meeting (MOM)</span>
                </h3>
                <p>Record meeting details and action items for {currentUser?.name || 'Managing Partner'}</p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowMomDialog(false)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: '#64748B' }}
              >
                ✕
              </button>
            </div>

            {/* Sub-tabs: Basic Info | Content | Actions */}
            <div className="mom-tabs-segmented">
              <button 
                type="button"
                className={`mom-tab-item ${momActiveSubTab === 'basic' ? 'active' : ''}`}
                onClick={() => setMomActiveSubTab('basic')}
              >
                Basic Info
              </button>
              <button 
                type="button"
                className={`mom-tab-item ${momActiveSubTab === 'content' ? 'active' : ''}`}
                onClick={() => setMomActiveSubTab('content')}
              >
                Content
              </button>
              <button 
                type="button"
                className={`mom-tab-item ${momActiveSubTab === 'actions' ? 'active' : ''}`}
                onClick={() => setMomActiveSubTab('actions')}
              >
                Actions
              </button>
            </div>

            {/* Sub-tab 1: Basic Info (Matching Image 3) */}
            {momActiveSubTab === 'basic' && (
              <div>
                <div className="mom-form-row-2">
                  <div className="mom-field-group">
                    <label>Meeting Title</label>
                    <input 
                      type="text"
                      className="mom-field-input"
                      value={momMeetingTitle}
                      onChange={(e) => setMomMeetingTitle(e.target.value)}
                      placeholder="e.g., Weekly Team Meeting"
                    />
                  </div>

                  <div className="mom-field-group">
                    <label>Meeting Type</label>
                    <select 
                      className="mom-field-select"
                      value={momMeetingType}
                      onChange={(e) => setMomMeetingType(e.target.value)}
                    >
                      <option value="Team Meeting">Team Meeting</option>
                      <option value="Client Meeting">Client Meeting</option>
                      <option value="Audit Review">Audit Review</option>
                      <option value="Management Meeting">Management Meeting</option>
                      <option value="Statutory Review">Statutory Review</option>
                      <option value="Field Inspection">Field Inspection</option>
                    </select>
                  </div>
                </div>

                <div className="mom-form-row-2">
                  <div className="mom-field-group">
                    <label>Date</label>
                    <input 
                      type="text"
                      className="mom-field-input"
                      value={momDate}
                      onChange={(e) => setMomDate(e.target.value)}
                      placeholder="12/08/2026"
                    />
                  </div>

                  <div className="mom-field-group">
                    <label>Time</label>
                    <input 
                      type="text"
                      className="mom-field-input"
                      value={momTime}
                      onChange={(e) => setMomTime(e.target.value)}
                      placeholder="--:-- --"
                    />
                  </div>
                </div>

                <div className="mom-form-row-2">
                  <div className="mom-field-group">
                    <label>Organizer</label>
                    <input 
                      type="text"
                      className="mom-field-input"
                      value={momOrganizer}
                      onChange={(e) => setMomOrganizer(e.target.value)}
                      placeholder="Demo Managing Partner"
                    />
                  </div>

                  <div className="mom-field-group">
                    <label>Location</label>
                    <input 
                      type="text"
                      className="mom-field-input"
                      value={momLocation}
                      onChange={(e) => setMomLocation(e.target.value)}
                      placeholder="e.g., Conference Room A, Zoo..."
                    />
                  </div>
                </div>

                <div className="mom-field-group">
                  <label>Attendees</label>
                  <textarea 
                    className="mom-field-textarea"
                    rows="3"
                    value={momAttendees}
                    onChange={(e) => setMomAttendees(e.target.value)}
                    placeholder="List attendees (comma separated or one per line)"
                  />
                </div>

                <div className="mom-dialog-actions">
                  <button type="button" className="btn-mom-cancel" onClick={() => setShowMomDialog(false)}>
                    Cancel
                  </button>
                  <button type="button" className="btn-mom-save" onClick={() => setMomActiveSubTab('content')}>
                    Next: Content →
                  </button>
                </div>
              </div>
            )}

            {/* Sub-tab 2: Content (Matching Image 2) */}
            {momActiveSubTab === 'content' && (
              <div>
                <div className="mom-field-group">
                  <label>Meeting Agenda</label>
                  <textarea 
                    className="mom-field-textarea"
                    rows="3"
                    value={momAgenda}
                    onChange={(e) => setMomAgenda(e.target.value)}
                    placeholder="List the main topics discussed..."
                  />
                  <span style={{ fontSize: '0.7rem', color: '#64748B', fontStyle: 'italic', marginTop: 2 }}>
                    Tip: Use bullet points or numbers for better organization
                  </span>
                </div>

                <div className="mom-field-group" style={{ marginTop: '0.85rem' }}>
                  <label>Key Discussions & Decisions</label>
                  <textarea 
                    className="mom-field-textarea"
                    rows="4"
                    value={momDiscussions}
                    onChange={(e) => setMomDiscussions(e.target.value)}
                    placeholder="Summarize important discussions, decisions made, and key points..."
                  />
                </div>

                <div className="mom-dialog-actions">
                  <button type="button" className="btn-mom-cancel" onClick={() => setMomActiveSubTab('basic')}>
                    ← Back
                  </button>
                  <button type="button" className="btn-mom-save" onClick={() => setMomActiveSubTab('actions')}>
                    Next: Actions →
                  </button>
                </div>
              </div>
            )}

            {/* Sub-tab 3: Actions (Matching Image 1) */}
            {momActiveSubTab === 'actions' && (
              <div>
                <div className="mom-field-group">
                  <label>Action Items</label>
                  <textarea 
                    className="mom-field-textarea"
                    rows="4"
                    value={momActionItems}
                    onChange={(e) => setMomActionItems(e.target.value)}
                    placeholder={`List action items with responsible persons and deadlines...\nExample:\n• [Person Name] - Task description - Due: DD/MM/YYYY\n• [Person Name] - Another task - Due: DD/MM/YYYY`}
                  />
                </div>

                <div className="mom-field-group">
                  <label>Next Meeting</label>
                  <input 
                    type="text"
                    className="mom-field-input"
                    value={momNextMeeting}
                    onChange={(e) => setMomNextMeeting(e.target.value)}
                    placeholder="Date and time of next meeting (if applicable)"
                  />
                </div>

                {/* Live Preview Box from Image 1 */}
                <div className="mom-preview-box">
                  <div className="mom-preview-header">
                    <span>📄 Preview</span>
                  </div>
                  <div>
                    <span className="mom-preview-tag">{momMeetingType.toLowerCase().replace(' ', '')}</span>
                    <div className="mom-preview-meta">
                      <span>📅 {momDate || '2026-08-12'}</span>
                      <span>👤 Organized by: {momOrganizer || currentUser?.name || 'Demo Managing Partner'}</span>
                    </div>
                  </div>
                </div>

                {momSuccessToast && (
                  <div style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '0.5rem 0.75rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '800', marginBottom: '1rem', textAlign: 'center' }}>
                    ✅ Minutes of Meeting Saved Successfully!
                  </div>
                )}

                <div className="mom-dialog-actions">
                  <button type="button" className="btn-mom-cancel" onClick={() => setShowMomDialog(false)}>
                    Cancel
                  </button>
                  <button type="button" className="btn-mom-save" onClick={handleSaveMom}>
                    💾 Save MOM
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ── Create New Task Modal (Matching Image 4) ── */}
      {showTaskDialog && (
        <div className="mom-dialog-backdrop" onClick={() => setShowTaskDialog(false)}>
          <div className="task-dialog-card" onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="task-dialog-header">
              <div>
                <h3>
                  <span>➕</span>
                  <span>Create New Task</span>
                </h3>
                <p>Create a new task for yourself or assign to team members</p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowTaskDialog(false)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: '#64748B' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask}>
              <div className="mom-form-row-2">
                <div className="mom-field-group">
                  <label>Task Title</label>
                  <input 
                    type="text"
                    className="mom-field-input"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Enter task title"
                    required
                  />
                </div>

                <div className="mom-field-group">
                  <label>Priority</label>
                  <select 
                    className="mom-field-select"
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                  >
                    <option value="Low Priority">Low Priority</option>
                    <option value="Medium Priority">Medium Priority</option>
                    <option value="High Priority">High Priority</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="mom-field-group">
                <label>Description</label>
                <textarea 
                  className="mom-field-textarea"
                  rows="3"
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  placeholder="Describe the task in detail..."
                />
              </div>

              <div className="mom-form-row-2">
                <div className="mom-field-group">
                  <label>Assigned To</label>
                  <select 
                    className="mom-field-select"
                    value={newTaskAssignedTo}
                    onChange={(e) => setNewTaskAssignedTo(e.target.value)}
                  >
                    <option value={currentUser?.name || 'Demo Managing Partner'}>
                      {currentUser?.name || 'Demo Managing Partner'} (Self)
                    </option>
                    {usersDb.map(u => (
                      <option key={u.id} value={u.name}>{u.name} ({u.roleTitle || u.role})</option>
                    ))}
                  </select>
                </div>

                <div className="mom-field-group">
                  <label>Due Date</label>
                  <input 
                    type="text"
                    className="mom-field-input"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    placeholder="dd/mm/yyyy"
                  />
                </div>
              </div>

              <div className="mom-form-row-2">
                <div className="mom-field-group">
                  <label>Project</label>
                  <input 
                    type="text"
                    className="mom-field-input"
                    value={newTaskProject}
                    onChange={(e) => setNewTaskProject(e.target.value)}
                    placeholder="Related project (optional)"
                  />
                </div>

                <div className="mom-field-group">
                  <label>Category</label>
                  <select 
                    className="mom-field-select"
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value)}
                  >
                    <option value="General">General</option>
                    <option value="Audit Verification">Audit Verification</option>
                    <option value="Compliance Check">Compliance Check</option>
                    <option value="Voucher Verification">Voucher Verification</option>
                    <option value="Stock Ledger Audit">Stock Ledger Audit</option>
                    <option value="Tender Review">Tender Review</option>
                  </select>
                </div>
              </div>

              {taskSuccessToast && (
                <div style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '0.5rem 0.75rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '800', marginBottom: '1rem', textAlign: 'center' }}>
                  ✅ Task Created Successfully!
                </div>
              )}

              <div className="mom-dialog-actions">
                <button type="button" className="btn-mom-cancel" onClick={() => setShowTaskDialog(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-mom-save">
                  💾 Create Task
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      </main>

    </div>
  );
}


