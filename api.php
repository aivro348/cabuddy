<?php
// ── CA Buddy PHP REST API Router ──
// Place this file in your root public directory

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 1. Parse .env File
function loadEnv() {
    $envPath = __DIR__ . '/.env';
    $vars = [];
    if (file_exists($envPath)) {
        $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0) continue;
            $parts = explode('=', $line, 2);
            if (count($parts) === 2) {
                $vars[trim($parts[0])] = trim($parts[1]);
            }
        }
    }
    return $vars;
}

$env = loadEnv();
$dbHost = isset($env['DB_HOST']) ? $env['DB_HOST'] : 'localhost';
$dbName = isset($env['DB_NAME']) ? $env['DB_NAME'] : '';
$dbUser = isset($env['DB_USER']) ? $env['DB_USER'] : '';
$dbPass = isset($env['DB_PASSWORD']) ? $env['DB_PASSWORD'] : '';

// 2. Establish PDO MySQL Connection
try {
    $pdo = new PDO("mysql:host=$dbHost;dbname=$dbName;charset=utf8mb4", $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $e) {
    echo json_encode([
        "success" => false,
        "message" => "Database connection failed: " . $e->getMessage()
    ]);
    exit();
}

// 3. Helper to get Server Time details
function getServerTimeDetails() {
    date_default_timezone_set('Asia/Kolkata');
    return [
        'timeStr' => date('h:i:s A'),
        'dateStr' => date('d-M-Y'),
        'isoStr' => date('c')
    ];
}

// 4. Parse Request Details
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
// Normalize routing relative to /api/ or api.php/
$route = preg_replace('/^.*?api\.php/', '', $requestUri);
$route = preg_replace('/^.*?\/api/', '', $route);
$route = '/' . trim($route, '/');

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true) ?? [];

// 5. REST API ROUTING
try {
    // ── ROUTE: /auth/login ──
    if ($route === '/auth/login' && $method === 'POST') {
        $email = trim($input['email'] ?? '');
        $password = $input['password'] ?? '';
        $location = $input['location'] ?? null;
        $timeData = getServerTimeDetails();

        $stmt = $pdo->prepare("SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(name) = ? OR id = ?");
        $stmt->execute([strtolower($email), strtolower($email), $email]);
        $user = $stmt->fetch();

        // Admin fallback if users table is empty
        if (!$user && (strtolower($email) === 'admin' || strtolower($email) === 'admin@eluc' || strtolower($email) === 'superadmin')) {
            $stmt = $pdo->prepare("SELECT * FROM users WHERE role = 'SUPER_ADMIN'");
            $stmt->execute();
            $user = $stmt->fetch();
        }

        if (!$user) {
            // Auto provision user
            $newId = 'usr-' . round(microtime(true) * 1000);
            $emailFormatted = strpos($email, '@') !== false ? $email : "$email@eluc";
            $displayName = ucwords(str_replace(['.', '_'], ' ', explode('@', $email)[0]));
            
            $user = [
                'id' => $newId,
                'name' => $displayName ?: 'Field Auditor',
                'email' => $emailFormatted,
                'password' => $password ?: '1234567',
                'role' => 'USER',
                'roleTitle' => 'Field Auditor',
                'studentRegNo' => 'SRO0' . rand(100000, 999999),
                'phone' => '+91 98480 ' . rand(10000, 99999),
                'unit' => 'Auctions',
                'subUnit' => 'General Audit Desk #1',
                'joinedDate' => $timeData['dateStr'],
                'managedBy' => 'usr-2'
            ];

            $ins = $pdo->prepare("INSERT INTO users (id, name, email, password, role, roleTitle, studentRegNo, phone, unit, subUnit, joinedDate, managedBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $ins->execute([$user['id'], $user['name'], $user['email'], $user['password'], $user['role'], $user['roleTitle'], $user['studentRegNo'], $user['phone'], $user['unit'], $user['subUnit'], $user['joinedDate'], $user['managedBy']]);
        }

        if ($user['password'] !== $password) {
            http_response_code(401);
            echo json_encode(["success" => false, "message" => "Invalid credentials password"]);
            exit();
        }

        // Close previous active sessions
        $stmt = $pdo->prepare("UPDATE attendance SET active = 0, logoutTime = ?, duration = 'Auto closed on new login' WHERE userId = ? AND active = 1");
        $stmt->execute([$timeData['timeStr'], $user['id']]);

        // Insert new active attendance log
        $activeLog = [
            'id' => 'log-' . round(microtime(true) * 1000),
            'userId' => $user['id'],
            'userName' => $user['name'],
            'userEmail' => $user['email'],
            'managerId' => $user['managedBy'] ?? ($user['role'] === 'MANAGER' ? 'usr-1' : null),
            'roleTitle' => $user['roleTitle'] ?? $user['role'],
            'unit' => $user['unit'] ?? 'Auctions',
            'loginTime' => $timeData['timeStr'],
            'logoutTime' => null,
            'date' => $timeData['dateStr'],
            'timeWindow' => $timeData['timeStr'] . ' - Active',
            'duration' => 'Session Active',
            'active' => 1,
            'serverVerified' => 1,
            'serverUtcIso' => $timeData['isoStr'],
            'managerRemarks' => $user['roleTitle'] . ' active in portal.',
            'loginLocation' => $location ? json_encode($location) : null
        ];

        $ins = $pdo->prepare("INSERT INTO attendance (id, userId, userName, userEmail, managerId, roleTitle, unit, loginTime, logoutTime, date, timeWindow, duration, active, serverVerified, serverUtcIso, managerRemarks, loginLocation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $ins->execute([$activeLog['id'], $activeLog['userId'], $activeLog['userName'], $activeLog['userEmail'], $activeLog['managerId'], $activeLog['roleTitle'], $activeLog['unit'], $activeLog['loginTime'], $activeLog['logoutTime'], $activeLog['date'], $activeLog['timeWindow'], $activeLog['duration'], $activeLog['active'], $activeLog['serverVerified'], $activeLog['serverUtcIso'], $activeLog['managerRemarks'], $activeLog['loginLocation']]);

        if ($activeLog['loginLocation']) {
            $activeLog['loginLocation'] = json_decode($activeLog['loginLocation'], true);
        }

        echo json_encode([
            "success" => true,
            "user" => $user,
            "serverTimestamp" => $timeData['timeStr'],
            "serverDate" => $timeData['dateStr'],
            "activeLog" => $activeLog
        ]);
        exit();
    }

    // ── ROUTE: /auth/logout ──
    elseif ($route === '/auth/logout' && $method === 'POST') {
        $userId = $input['userId'] ?? '';
        $logoutRemarks = $input['logoutRemarks'] ?? '';
        $location = $input['location'] ?? null;
        $timeData = getServerTimeDetails();

        $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        // Update daily report status
        $stmt = $pdo->prepare("UPDATE daily_reports SET status = 'COMPLETED & VERIFIED' WHERE studentRegNo = ? AND status = 'SUBMITTED'");
        $stmt->execute([$user ? $user['studentRegNo'] : '']);

        // Update attendance active session
        $stmt = $pdo->prepare("UPDATE attendance SET active = 0, logoutTime = ?, timeWindow = CONCAT(loginTime, ' - ', ?), duration = 'Session Completed', serverLogoutIso = ?, managerRemarks = ?, logoutLocation = ? WHERE userId = ? AND active = 1");
        $stmt->execute([$timeData['timeStr'], $timeData['timeStr'], $timeData['isoStr'], $logoutRemarks ?: 'Logged out by user action.', $location ? json_encode($location) : null, $userId]);

        // Get all reports & attendance
        $repStmt = $pdo->query("SELECT * FROM daily_reports ORDER BY id DESC");
        $allReports = $repStmt->fetchAll();

        $attStmt = $pdo->query("SELECT * FROM attendance ORDER BY id DESC");
        $allAttendance = $attStmt->fetchAll();
        foreach ($allAttendance as &$att) {
            $att['active'] = (bool)$att['active'];
            $att['serverVerified'] = (bool)$att['serverVerified'];
            if ($att['loginLocation']) $att['loginLocation'] = json_decode($att['loginLocation'], true);
            if ($att['logoutLocation']) $att['logoutLocation'] = json_decode($att['logoutLocation'], true);
        }

        echo json_encode([
            "success" => true,
            "serverLogoutTime" => $timeData['timeStr'],
            "serverDate" => $timeData['dateStr'],
            "reports" => $allReports,
            "attendance" => $allAttendance,
            "message" => "Session securely closed on server at " . $timeData['timeStr']
        ]);
        exit();
    }

    // ── ROUTE: /users ──
    elseif ($route === '/users') {
        if ($method === 'GET') {
            $stmt = $pdo->query("SELECT * FROM users ORDER BY id DESC");
            $users = $stmt->fetchAll();
            echo json_encode(["success" => true, "users" => $users]);
            exit();
        } 
        elseif ($method === 'POST') {
            $name = trim($input['name'] ?? '');
            $email = trim($input['email'] ?? '');
            $password = $input['password'] ?? '1234567';
            $roleTitle = $input['roleTitle'] ?? 'Field Auditor';
            $unit = $input['unit'] ?? 'Auctions';
            $managerId = $input['managerId'] ?? 'usr-1';
            
            $role = strpos($roleTitle, 'Manager') !== false ? 'MANAGER' : (strpos($roleTitle, 'Super') !== false ? 'SUPER_ADMIN' : 'USER');
            $newId = 'usr-' . round(microtime(true) * 1000);
            $timeData = getServerTimeDetails();

            $ins = $pdo->prepare("INSERT INTO users (id, name, email, password, role, roleTitle, unit, managedBy, joinedDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $ins->execute([$newId, $name, strtolower($email), $password, $role, $roleTitle, $unit, $managerId, $timeData['dateStr']]);

            $stmt = $pdo->query("SELECT * FROM users ORDER BY id DESC");
            $users = $stmt->fetchAll();

            echo json_encode([
                "success" => true,
                "user" => ["id" => $newId, "name" => $name, "email" => $email, "role" => $role, "roleTitle" => $roleTitle, "unit" => $unit, "managedBy" => $managerId],
                "users" => $users
            ]);
            exit();
        }
    }

    // ── ROUTE: /users/:id/role ──
    elseif (preg_match('/^\/users\/([^\/]+)\/role$/', $route, $matches) && $method === 'PATCH') {
        $id = $matches[1];
        $roleTitle = $input['roleTitle'] ?? '';
        $unit = $input['unit'] ?? '';

        $stmt = $pdo->prepare("UPDATE users SET roleTitle = ?, unit = ? WHERE id = ?");
        $stmt->execute([$roleTitle, $unit, $id]);

        $stmt = $pdo->prepare("UPDATE attendance SET roleTitle = ?, unit = ? WHERE userId = ?");
        $stmt->execute([$roleTitle, $unit, $id]);

        echo json_encode(["success" => true]);
        exit();
    }

    // ── ROUTE: /attendance ──
    elseif ($route === '/attendance' && $method === 'GET') {
        $role = $_GET['role'] ?? '';
        $managerId = $_GET['managerId'] ?? '';

        if ($role === 'MANAGER' && $managerId) {
            $stmt = $pdo->prepare("SELECT * FROM attendance WHERE managerId = ? ORDER BY id DESC");
            $stmt->execute([$managerId]);
        } else {
            $stmt = $pdo->query("SELECT * FROM attendance ORDER BY id DESC");
        }

        $rows = $stmt->fetchAll();
        foreach ($rows as &$r) {
            $r['active'] = (bool)$r['active'];
            $r['serverVerified'] = (bool)$r['serverVerified'];
            if ($r['loginLocation']) $r['loginLocation'] = json_decode($r['loginLocation'], true);
            if ($r['logoutLocation']) $r['logoutLocation'] = json_decode($r['logoutLocation'], true);
        }

        echo json_encode(["success" => true, "attendance" => $rows]);
        exit();
    }

    // ── ROUTE: /daily-reports ──
    elseif ($route === '/daily-reports') {
        if ($method === 'GET') {
            $stmt = $pdo->query("SELECT * FROM daily_reports ORDER BY id DESC");
            $reports = $stmt->fetchAll();
            echo json_encode(["success" => true, "reports" => $reports]);
            exit();
        } 
        elseif ($method === 'POST') {
            $fullName = $input['fullName'] ?? 'Audit Student';
            $studentRegNo = $input['studentRegNo'] ?? '';
            $unitDetails = $input['unitDetails'] ?? 'Auctions';
            $studentPhone = $input['studentPhone'] ?? '';
            $dutyAssignedDate = $input['dutyAssignedDate'] ?? '';
            $dutyTimePeriod = $input['dutyTimePeriod'] ?? '';
            $reportVerificationTime = $input['reportVerificationTime'] ?? '';
            $auditWorkType = $input['auditWorkType'] ?? 'Monthly Internal Audit';
            $workObjective = $input['workObjective'] ?? '';
            $vouchersVerified = $input['vouchersVerified'] ?? '0';
            $caRemarks = $input['caRemarks'] ?? '';
            $status = $input['status'] ?? 'SUBMITTED';

            $timeData = getServerTimeDetails();
            $targetDate = $dutyAssignedDate ?: $timeData['dateStr'];

            $stmt = $pdo->prepare("SELECT * FROM daily_reports WHERE studentRegNo = ? AND dutyAssignedDate = ?");
            $stmt->execute([$studentRegNo, $targetDate]);
            $report = $stmt->fetch();

            if ($report) {
                $stmt = $pdo->prepare("UPDATE daily_reports SET fullName = ?, unitDetails = ?, studentPhone = ?, dutyTimePeriod = ?, reportVerificationTime = ?, auditWorkType = ?, workObjective = ?, vouchersVerified = ?, caRemarks = ?, status = ? WHERE id = ?");
                $stmt->execute([
                    $fullName, $unitDetails, $studentPhone,
                    $dutyTimePeriod ?: $report['dutyTimePeriod'],
                    $reportVerificationTime ?: $report['reportVerificationTime'],
                    $auditWorkType, $workObjective, $vouchersVerified, $caRemarks,
                    $status, $report['id']
                ]);
            } else {
                $newId = 'dr-' . round(microtime(true) * 1000);
                $ins = $pdo->prepare("INSERT INTO daily_reports (id, fullName, studentRegNo, unitDetails, studentPhone, dutyAssignedDate, dutyTimePeriod, reportVerificationTime, auditWorkType, workObjective, vouchersVerified, caRemarks, status, createdAt, studentEmail) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '')");
                $ins->execute([
                    $newId, $fullName, $studentRegNo, $unitDetails, $studentPhone,
                    $targetDate, $dutyTimePeriod ?: $timeData['timeStr'],
                    $reportVerificationTime, $auditWorkType, $workObjective, $vouchersVerified,
                    $caRemarks, $status, date('c')
                ]);
            }

            $stmt = $pdo->query("SELECT * FROM daily_reports ORDER BY id DESC");
            $allReports = $stmt->fetchAll();

            echo json_encode(["success" => true, "reports" => $allReports]);
            exit();
        }
    }

    // ── ROUTE: /moms ──
    elseif ($route === '/moms') {
        if ($method === 'GET') {
            $stmt = $pdo->query("SELECT * FROM moms ORDER BY id DESC");
            $moms = $stmt->fetchAll();
            echo json_encode(["success" => true, "moms" => $moms]);
            exit();
        } 
        elseif ($method === 'POST') {
            $meetingTitle = $input['meetingTitle'] ?? 'Weekly Team Meeting';
            $meetingType = $input['meetingType'] ?? 'Team Meeting';
            $date = $input['date'] ?? '';
            $time = $input['time'] ?? '';
            $organizer = $input['organizer'] ?? 'Demo Managing Partner';
            $location = $input['location'] ?? 'Conference Room A';
            $attendees = $input['attendees'] ?? '';
            $agenda = $input['agenda'] ?? '';
            $discussions = $input['discussions'] ?? '';
            $actionItems = $input['actionItems'] ?? '';
            $nextMeeting = $input['nextMeeting'] ?? '';

            $timeData = getServerTimeDetails();
            $newId = 'mom-' . round(microtime(true) * 1000);

            $ins = $pdo->prepare("INSERT INTO moms (id, title, type, date, time, organizer, location, attendees, agenda, discussions, actionItems, nextMeeting) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $ins->execute([
                $newId, $meetingTitle, $meetingType,
                $date ?: $timeData['dateStr'],
                $time ?: $timeData['timeStr'],
                $organizer, $location, $attendees, $agenda, $discussions, $actionItems, $nextMeeting
            ]);

            $stmt = $pdo->query("SELECT * FROM moms ORDER BY id DESC");
            $moms = $stmt->fetchAll();

            echo json_encode(["success" => true, "moms" => $moms]);
            exit();
        }
    }

    // ── ROUTE: /tasks ──
    elseif ($route === '/tasks') {
        if ($method === 'GET') {
            $stmt = $pdo->query("SELECT * FROM tasks ORDER BY id DESC");
            $tasks = $stmt->fetchAll();
            echo json_encode(["success" => true, "tasks" => $tasks]);
            exit();
        } 
        elseif ($method === 'POST') {
            $taskTitle = $input['taskTitle'] ?? 'Audit Verification Task';
            $priority = $input['priority'] ?? 'Medium Priority';
            $description = $input['description'] ?? '';
            $assignedTo = $input['assignedTo'] ?? 'Demo Managing Partner';
            $dueDate = $input['dueDate'] ?? '';
            $project = $input['project'] ?? '';
            $category = $input['category'] ?? 'General';

            $timeData = getServerTimeDetails();
            $newId = 'tsk-' . round(microtime(true) * 1000);

            $ins = $pdo->prepare("INSERT INTO tasks (id, title, description, priority, category, project, assignedTo, dueDate, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'IN_PROGRESS')");
            $ins->execute([
                $newId, $taskTitle, $description, $priority, $category, $project, $assignedTo, $dueDate ?: $timeData['dateStr']
            ]);

            $stmt = $pdo->query("SELECT * FROM tasks ORDER BY id DESC");
            $tasks = $stmt->fetchAll();

            echo json_encode(["success" => true, "tasks" => $tasks]);
            exit();
        }
    }

    // ── Fallback 404 ──
    http_response_code(404);
    echo json_encode(["success" => false, "message" => "API Route not found: " . $route]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Internal Server Error: " . $e->getMessage()
    ]);
}
