<?php
/**
 * SECURITY QUICK REFERENCE GUIDE
 * Tsharok LMS - Essential Security Practices
 * 
 * Keep this file handy when developing new features!
 */
die('Quick reference guide - do not execute');
?>

<!-- ============================================ -->
<!-- PREPARED STATEMENTS - ALWAYS USE THESE -->
<!-- ============================================ -->

<?php
// ✓ CORRECT - Using prepared statements
$stmt = $db->prepare("SELECT * FROM users WHERE user_id = ?");
$stmt->execute([$userId]);

$stmt = $db->prepare("SELECT * FROM courses WHERE title LIKE ? AND level = ?");
$stmt->execute(['%' . $search . '%', $level]);

// ❌ WRONG - NEVER do this!
$query = "SELECT * FROM users WHERE user_id = $userId"; // SQL INJECTION!
$query = "SELECT * FROM users WHERE username = '$username'"; // SQL INJECTION!
?>

<!-- ============================================ -->
<!-- INPUT VALIDATION - VALIDATE EVERYTHING -->
<!-- ============================================ -->

<?php
// Validate integers
$courseId = validateInteger($_GET['course_id'], 1, null, 0);
$page = validateInteger($_GET['page'], 1, 1000, 1);
$limit = validateInteger($_GET['limit'], 1, 100, 20);

// Validate floats
$rating = validateFloat($_GET['rating'], 0, 5, 0);
$price = validateFloat($_GET['price'], 0, 10000, 0);

// Validate enums (whitelists)
$level = validateEnum($_GET['level'], ['beginner', 'intermediate', 'advanced'], 'all');
$status = validateEnum($_GET['status'], ['active', 'pending', 'completed'], 'active');

// Using InputValidator class
$result = InputValidator::validateCourseId($_GET['course_id']);
if (!$result['valid']) {
    sendJsonResponse(false, $result['error']);
}
$courseId = $result['value'];
?>

<!-- ============================================ -->
<!-- ORDER BY - USE WHITELIST -->
<!-- ============================================ -->

<?php
// ✓ CORRECT - Whitelist validation
$allowedFields = ['id', 'title', 'created_at', 'updated_at'];
$sortBy = validateEnum($_GET['sort'], $allowedFields, 'id');
$sortOrder = validateEnum($_GET['order'], ['ASC', 'DESC'], 'DESC');
$query = "SELECT * FROM courses ORDER BY $sortBy $sortOrder";

// OR use sanitizeOrderBy()
$sortBy = sanitizeOrderBy($_GET['sort'], $allowedFields, 'id');
$query = "SELECT * FROM courses ORDER BY $sortBy";

// ❌ WRONG - Direct use of user input
$query = "SELECT * FROM courses ORDER BY " . $_GET['sort']; // SQL INJECTION!
?>

<!-- ============================================ -->
<!-- WHERE CLAUSE - ALWAYS USE PARAMETERS -->
<!-- ============================================ -->

<?php
// ✓ CORRECT - Prepared statement with parameters
$whereConditions = [];
$params = [];

if (!empty($category)) {
    $whereConditions[] = 'category = ?';
    $params[] = $category;
}

if (!empty($level)) {
    $whereConditions[] = 'level = ?';
    $params[] = $level;
}

$whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';
$query = "SELECT * FROM courses $whereClause";
$stmt = $db->prepare($query);
$stmt->execute($params);

// ❌ WRONG - String concatenation
$where = "WHERE category = '$category'"; // SQL INJECTION!
?>

<!-- ============================================ -->
<!-- LIKE QUERIES - ESCAPE WILDCARDS -->
<!-- ============================================ -->

<?php
// ✓ CORRECT - Escape and use prepared statement
$searchTerm = escapeLikePattern($_GET['search'], 'both');
$stmt = $db->prepare("SELECT * FROM courses WHERE title LIKE ?");
$stmt->execute([$searchTerm]);

// ❌ WRONG
$query = "SELECT * FROM courses WHERE title LIKE '%$search%'"; // SQL INJECTION!
?>

<!-- ============================================ -->
<!-- HAVING CLAUSE - USE PARAMETERS -->
<!-- ============================================ -->

<?php
// ✓ CORRECT - Parameters in HAVING
$havingParts = [];
if ($minRating > 0) {
    $havingParts[] = 'average_rating >= ?';
    $params[] = $minRating;
}
if (!empty($havingParts)) {
    $query .= ' HAVING ' . implode(' AND ', $havingParts);
}

// ❌ WRONG - Direct interpolation
$query .= " HAVING average_rating >= $minRating"; // SQL INJECTION!
?>

<!-- ============================================ -->
<!-- PAGINATION - VALIDATE PARAMETERS -->
<!-- ============================================ -->

<?php
// ✓ CORRECT - Use validatePagination()
$pagination = validatePagination($_GET['page'], $_GET['limit'], 50);
$page = $pagination['page'];
$limit = $pagination['limit'];
$offset = $pagination['offset'];

$stmt = $db->prepare("SELECT * FROM courses LIMIT ? OFFSET ?");
$stmt->execute([$limit, $offset]);

// OR manual validation
$page = max(1, intval($_GET['page']));
$limit = min(50, max(1, intval($_GET['limit'])));
$offset = ($page - 1) * $limit;
?>

<!-- ============================================ -->
<!-- SEARCH QUERIES - SANITIZE INPUT -->
<!-- ============================================ -->

<?php
// ✓ CORRECT - Sanitize search query
$searchQuery = sanitizeSearchQuery($_GET['q'], 200);

// OR use InputValidator
$result = InputValidator::validateSearchQuery($_GET['q']);
if ($result['valid']) {
    $searchQuery = $result['value'];
}

// Then use in prepared statement
$stmt = $db->prepare("SELECT * FROM courses WHERE title LIKE ?");
$stmt->execute(['%' . $searchQuery . '%']);
?>

<!-- ============================================ -->
<!-- RATE LIMITING - PROTECT SENSITIVE OPERATIONS -->
<!-- ============================================ -->

<?php
// Check rate limit before processing
if (!checkRateLimit('login_' . getClientIP(), 5, 900)) {
    sendJsonResponse(false, 'Too many attempts. Please try again later.');
}

// Rate limit examples:
checkRateLimit('login_' . getClientIP(), 5, 900);        // 5 per 15 min
checkRateLimit('register_' . getClientIP(), 3, 3600);    // 3 per hour
checkRateLimit('password_reset_' . $email, 3, 3600);    // 3 per hour
?>

<!-- ============================================ -->
<!-- PASSWORD HANDLING - ALWAYS HASH -->
<!-- ============================================ -->

<?php
// ✓ CORRECT - Hash passwords
$passwordHash = hashPassword($password); // Uses bcrypt cost 12
$stmt = $db->prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)");
$stmt->execute([$username, $passwordHash]);

// Verify passwords
if (verifyPassword($inputPassword, $storedHash)) {
    // Password correct
}

// ❌ WRONG - NEVER store plain text
$stmt = $db->prepare("INSERT INTO users (password) VALUES (?)");
$stmt->execute([$password]); // SECURITY RISK!
?>

<!-- ============================================ -->
<!-- FILE UPLOADS - VALIDATE THOROUGHLY -->
<!-- ============================================ -->

<?php
// Validate file upload
$validation = validateFileUpload($_FILES['file'], [
    'maxSize' => 10 * 1024 * 1024, // 10MB
    'allowedTypes' => ['image/jpeg', 'image/png', 'application/pdf'],
    'allowedExtensions' => ['jpg', 'jpeg', 'png', 'pdf']
]);

if (!$validation['valid']) {
    sendJsonResponse(false, $validation['error']);
}

// Generate secure filename
$secureFilename = generateSecureFilename($_FILES['file']['name'], $userId);
?>

<!-- ============================================ -->
<!-- CSRF PROTECTION - STATE-CHANGING OPERATIONS -->
<!-- ============================================ -->

<?php
// Generate token (in form)
$csrfToken = generateCsrfToken();
echo '<input type="hidden" name="csrf_token" value="' . $csrfToken . '">';

// Validate token (on submission)
if (!validateCsrfToken($_POST['csrf_token'])) {
    sendJsonResponse(false, 'Invalid CSRF token');
}
?>

<!-- ============================================ -->
<!-- XSS PROTECTION - ESCAPE OUTPUT -->
<!-- ============================================ -->

<?php
// ✓ CORRECT - Escape all user-generated content
echo htmlspecialchars($username, ENT_QUOTES, 'UTF-8');
echo htmlspecialchars($comment, ENT_QUOTES, 'UTF-8');

// In templates
<h1><?php echo htmlspecialchars($title); ?></h1>
<p><?php echo htmlspecialchars($description); ?></p>

// ❌ WRONG - Raw output
echo $username; // XSS RISK!
?>

<!-- ============================================ -->
<!-- SESSION SECURITY -->
<!-- ============================================ -->

<?php
// Create secure session
$sessionToken = createUserSession($userId, $db, $remember);

// Validate session
if (!validateUserSession($sessionToken, $db)) {
    sendJsonResponse(false, 'Session expired');
}

// Destroy session
destroyUserSession($sessionToken, $db);
?>

<!-- ============================================ -->
<!-- LOGGING SECURITY EVENTS -->
<!-- ============================================ -->

<?php
// Log security events
logSecurityEvent('failed_login', 'Multiple failed login attempts', [
    'username' => $username,
    'attempts' => $attemptCount
]);

logSecurityEvent('sql_injection_attempt', 'SQL injection pattern detected', [
    'input' => $suspiciousInput,
    'endpoint' => $_SERVER['REQUEST_URI']
]);
?>

<!-- ============================================ -->
<!-- CHECKLIST FOR NEW API ENDPOINTS -->
<!-- ============================================ -->

<!--
□ All queries use prepared statements?
□ All integers validated with validateInteger() or intval()?
□ All enums use whitelist validation?
□ ORDER BY uses whitelist?
□ Pagination validated?
□ Rate limiting implemented?
□ Authentication checked?
□ Authorization/permissions checked?
□ Input sanitized for output?
□ Security events logged?
□ Error messages don't leak sensitive info?
□ File uploads validated (if applicable)?
□ CSRF protection (if state-changing)?
-->

<!-- ============================================ -->
<!-- COMMON MISTAKES TO AVOID -->
<!-- ============================================ -->

<?php
// ❌ DON'T concatenate user input
$query = "SELECT * FROM users WHERE id = $id";
$query = "SELECT * FROM users WHERE name = '$name'";
$query = "SELECT * FROM courses ORDER BY " . $_GET['sort'];

// ❌ DON'T use unsanitized input in SQL
$db->query("SELECT * FROM users WHERE email = '{$_POST['email']}'");

// ❌ DON'T trust any user input, even from authenticated users
$isAdmin = $_POST['is_admin']; // User could send this!

// ❌ DON'T store passwords in plain text
$stmt->execute([$username, $password]); // Store hash instead!

// ❌ DON'T expose detailed error messages
echo "Query failed: " . $e->getMessage(); // Reveals database structure!

// ❌ DON'T skip validation because "it's admin only"
// Admins can be compromised too!
?>

<!-- ============================================ -->
<!-- SECURITY RESOURCES -->
<!-- ============================================ -->

<!--
📚 Files to Reference:
- includes/security.php - Security functions
- includes/input-validator.php - Validation class
- security-testing-guide.php - Testing guide
- SECURITY_HARDENING_SUMMARY.php - Full documentation
- database/security-audit.sql - Audit queries

🔗 External Resources:
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- PHP Security: https://www.php.net/manual/en/security.php
- SQL Injection Prevention: https://cheatsheetseries.owasp.org/

🧪 Testing:
- Run: mysql -u root -p tsharok < database/security-audit.sql
- Test all endpoints with SQL injection payloads
- Check logs regularly for suspicious activity
-->

<!-- ============================================ -->
<!-- REMEMBER -->
<!-- ============================================ -->

<!--
1. PREPARED STATEMENTS are your #1 defense
2. VALIDATE ALL inputs, even from trusted sources
3. USE WHITELISTS for dynamic SQL parts
4. LOG security events for monitoring
5. NEVER TRUST user input
6. KEEP security libraries updated
7. REVIEW code regularly
8. TEST with injection payloads

Security is not a feature, it's a requirement!
-->

