# Simple Test Script for Tsharok API Endpoints
$baseUrl = "http://127.0.0.1:8787"
$passed = 0
$failed = 0

Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host "  Tsharok API - Endpoint Tests" -ForegroundColor Cyan  
Write-Host "=====================================" -ForegroundColor Cyan

# Phase 1: Course Management
Write-Host "`n=== Phase 1: Course Management ===" -ForegroundColor Yellow

try {
    $r = Invoke-RestMethod "$baseUrl/api/majors" -UseBasicParsing
    if ($r.success) { Write-Host "✓ GET /api/majors" -ForegroundColor Green; $passed++ }
    else { Write-Host "✗ GET /api/majors" -ForegroundColor Red; $failed++ }
} catch { Write-Host "✗ GET /api/majors - ERROR" -ForegroundColor Red; $failed++ }

try {
    $r = Invoke-RestMethod "$baseUrl/api/filter-options" -UseBasicParsing
    if ($r.success) { Write-Host "✓ GET /api/filter-options" -ForegroundColor Green; $passed++ }
    else { Write-Host "✗ GET /api/filter-options" -ForegroundColor Red; $failed++ }
} catch { Write-Host "✗ GET /api/filter-options - ERROR" -ForegroundColor Red; $failed++ }

try {
    $r = Invoke-RestMethod "$baseUrl/api/courses?limit=5" -UseBasicParsing
   if ($r.success) { Write-Host "✓ GET /api/courses" -ForegroundColor Green; $passed++ }
    else { Write-Host "✗ GET /api/courses" -ForegroundColor Red; $failed++ }
} catch { Write-Host "✗ GET /api/courses - ERROR" -ForegroundColor Red; $failed++ }

try {
    $r = Invoke-RestMethod "$baseUrl/api/course-details?courseId=1" -UseBasicParsing
    if ($r.success) { Write-Host "✓ GET /api/course-details" -ForegroundColor Green; $passed++ }
    else { Write-Host "✗ GET /api/course-details" -ForegroundColor Red; $failed++ }
} catch { Write-Host "✗ GET /api/course-details - ERROR" -ForegroundColor Red; $failed++ }

try {
    $r = Invoke-RestMethod "$baseUrl/api/my-courses?userId=1" -UseBasicParsing
    if ($r.success) { Write-Host "✓ GET /api/my-courses" -ForegroundColor Green; $passed++ }
    else { Write-Host "✗ GET /api/my-courses" -ForegroundColor Red; $failed++ }
} catch { Write-Host "✗ GET /api/my-courses - ERROR" -ForegroundColor Red; $failed++ }

# Phase 7: Internationalization
Write-Host "`n=== Phase 7: Internationalization ===" -ForegroundColor Yellow

try {
    $r = Invoke-RestMethod "$baseUrl/api/get-available-languages" -UseBasicParsing
    if ($r.success) { Write-Host "✓ GET /api/get-available-languages" -ForegroundColor Green; $passed++ }
    else { Write-Host "✗ GET /api/get-available-languages" -ForegroundColor Red; $failed++ }
} catch { Write-Host "✗ GET /api/get-available-languages - ERROR" -ForegroundColor Red; $failed++ }

try {
    $r = Invoke-RestMethod "$baseUrl/api/get-translations?lang=en" -UseBasicParsing
    if ($r.success) { Write-Host "✓ GET /api/get-translations" -ForegroundColor Green; $passed++ }
    else { Write-Host "✗ GET /api/get-translations" -ForegroundColor Red; $failed++ }
} catch { Write-Host "✗ GET /api/get-translations - ERROR" -ForegroundColor Red; $failed++ }

# Summary
Write-Host "`n=====================================" -ForegroundColor Cyan
Write-Host "Tests Passed: $passed" -ForegroundColor Green
Write-Host "Tests Failed: $failed" -ForegroundColor $(if($failed -gt 0){"Red"}else{"Green"})
Write-Host "=====================================" -ForegroundColor Cyan

if ($failed -eq 0) {
    Write-Host "`n✓ All tests passed!" -ForegroundColor Green
}
