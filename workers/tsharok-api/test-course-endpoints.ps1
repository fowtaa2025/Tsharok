# Tsharok API - Course Management Endpoint Tests
# Run after starting: wrangler dev

$BASE_URL = "http://localhost:8787"

Write-Host "`n=== Testing Course Management Endpoints ===" -ForegroundColor Cyan

# Test 1: Get Majors
Write-Host "`n[Test 1] GET /api/majors" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/majors" -Method Get
    Write-Host "✓ Success: Found $($response.data.totalCount) majors" -ForegroundColor Green
    $response.data.majors | Format-Table -Property majorId, majorName
} catch {
    Write-Host "✗ Failed: $_" -ForegroundColor Red
}

# Test 2: Get Filter Options
Write-Host "`n[Test 2] GET /api/filter-options" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/filter-options" -Method Get
    Write-Host "✓ Success: Found $($response.data.levels.Count) levels and $($response.data.majors.Count) majors" -ForegroundColor Green
    Write-Host "Levels: $($response.data.levels -join ', ')"
} catch {
    Write-Host "✗ Failed: $_" -ForegroundColor Red
}

# Test 3: Get Courses (first 5)
Write-Host "`n[Test 3] GET /api/courses?limit=5" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/courses?limit=5" -Method Get
    Write-Host "✓ Success: Found $($response.data.pagination.total) total courses" -ForegroundColor Green
    $response.data.courses | Format-Table -Property courseId, courseCode, courseName, level
} catch {
    Write-Host "✗ Failed: $_" -ForegroundColor Red
}

# Test 4: Search Courses
Write-Host "`n[Test 4] GET /api/courses?search=computer&limit=3" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/courses?search=computer&limit=3" -Method Get
    Write-Host "✓ Success: Found $($response.data.courses.Count) courses matching 'computer'" -ForegroundColor Green
    $response.data.courses | Format-Table -Property courseId, courseName
} catch {
    Write-Host "✗ Failed: $_" -ForegroundColor Red
}

# Test 5: Get Course Details (using first course)
Write-Host "`n[Test 5] GET /api/course-details?courseId=1" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/course-details?courseId=1" -Method Get
    Write-Host "✓ Success: Retrieved course details" -ForegroundColor Green
    $course = $response.data.course
    Write-Host "  Course: $($course.courseName)"
    Write-Host "  Code: $($course.courseCode)"
    Write-Host "  Level: $($course.level)"
    Write-Host "  Enrollments: $($course.enrollmentCount)"
    Write-Host "  Materials: $($course.materialsCount)"
} catch {
    Write-Host "✗ Failed: $_" -ForegroundColor Red
}

# Test 6: Get My Courses (using userId=1)
Write-Host "`n[Test 6] GET /api/my-courses?userId=1" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/api/my-courses?userId=1" -Method Get
    Write-Host "✓ Success: User has $($response.data.totalCount) enrolled courses" -ForegroundColor Green
    if ($response.data.courses.Count -gt 0) {
        $response.data.courses | Format-Table -Property courseId, courseName, status, progress
    }
} catch {
    Write-Host "✗ Failed: $_" -ForegroundColor Red
}

# Test 7: Unenroll (will only work if user is enrolled)
Write-Host "`n[Test 7] POST /api/unenroll" -ForegroundColor Yellow
Write-Host "  (Skipping - would modify database)" -ForegroundColor Gray

Write-Host "`n=== All Tests Complete ===" -ForegroundColor Cyan
Write-Host "Note: For Test 7 (unenroll), use this command when ready:" -ForegroundColor Gray
Write-Host '  $body = @{ userId = 1; courseId = 2 } | ConvertTo-Json' -ForegroundColor Gray
Write-Host '  Invoke-RestMethod -Uri "$BASE_URL/api/unenroll" -Method Post -ContentType "application/json" -Body $body' -ForegroundColor Gray
