@echo off
REM Tsharok LMS - Run All Tests
REM Executes comprehensive testing suite

echo.
echo ===============================================================================
echo   TSHAROK LMS - COMPREHENSIVE TESTING SUITE
echo ===============================================================================
echo.

REM Check if PHP is available
where php >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: PHP is not in your PATH
    echo Please add PHP to your system PATH and try again
    pause
    exit /b 1
)

echo Starting comprehensive testing...
echo.

REM Test 1: Security Tests
echo [1/4] Running Security Tests...
echo -------------------------------------------------------------------------------
php tests\security-tests.php
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [FAILED] Security tests failed!
    set TEST_FAILED=1
) else (
    echo [PASSED] Security tests passed!
)
echo.

REM Test 2: Moderation Flow Tests
echo [2/4] Running Admin Moderation Flow Tests...
echo -------------------------------------------------------------------------------
php tests\moderation-flow-tests.php
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [FAILED] Moderation tests failed!
    set TEST_FAILED=1
) else (
    echo [PASSED] Moderation tests passed!
)
echo.

REM Test 3: API Endpoint Tests
echo [3/4] Running API Endpoint Tests...
echo -------------------------------------------------------------------------------
php tests\api-endpoint-tests.php
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [FAILED] API tests failed!
    set TEST_FAILED=1
) else (
    echo [PASSED] API tests passed!
)
echo.

REM Test 4: Authentication Tests
echo [4/4] Running Authentication Tests...
echo -------------------------------------------------------------------------------
php tests\auth-tests.php
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [FAILED] Authentication tests failed!
    set TEST_FAILED=1
) else (
    echo [PASSED] Authentication tests passed!
)
echo.

REM Summary
echo ===============================================================================
echo   TEST EXECUTION COMPLETE
echo ===============================================================================
echo.

if defined TEST_FAILED (
    echo Status: SOME TESTS FAILED
    echo Please review the output above for details.
    echo.
    echo Test results have been saved to tests/ directory:
    echo   - security-test-results.json
    echo   - api-test-results.json
    echo.
) else (
    echo Status: ALL TESTS PASSED!
    echo Your application is ready for deployment.
    echo.
)

echo Press any key to exit...
pause >nul

