# Tsharok LMS - Installation Guide

## Prerequisites

- PHP 7.4 or higher
- MySQL 5.7+ or 8.0+
- Composer
- Web server (Apache/Nginx)
- SMTP email account (Gmail, SendGrid, etc.)

## Installation Steps

### 1. Install PHP Dependencies

```bash
# Windows
install.bat

# Linux/Mac
composer install
```

### 2. Database Setup

```bash
# Run the database setup script
setup_database_complete.bat

# Or manually
mysql -u root -p -e "CREATE DATABASE tsharok CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p tsharok < database/schema_with_verification.sql
```

### 3. Configure Database

Edit `config/database.php` with your MySQL credentials:

```php
private $host = 'localhost';
private $database = 'tsharok';
private $username = 'root';
private $password = 'your_password';
```

### 4. Configure Email (SMTP)

Edit `includes/email.php` and update the EmailConfig class:

```php
const SMTP_HOST = 'smtp.gmail.com';
const SMTP_PORT = 587;
const SMTP_USERNAME = 'your-email@gmail.com';
const SMTP_PASSWORD = 'your-app-password';
const FROM_EMAIL = 'noreply@tsharok.com';
```

#### Gmail Setup:
1. Enable 2-Factor Authentication on your Google account
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use the generated 16-character password in SMTP_PASSWORD

### 5. File Permissions

```bash
# Make directories writable (Linux/Mac)
chmod 755 api/
chmod 755 includes/
chmod 755 config/
```

### 6. Start Server

```bash
# Windows
start-server.bat

# Linux/Mac
./start-server.sh
```

### 7. Test Registration

1. Navigate to: http://localhost:8000/register.html
2. Fill in the registration form
3. Submit and check your email for verification link
4. Click verification link
5. Login with your credentials

## API Endpoints

### Registration
- **URL:** `/api/register.php`
- **Method:** POST
- **Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "Password123",
  "confirmPassword": "Password123",
  "role": "student",
  "major": "1",
  "phone": "+966501234567"
}
```

### Email Verification
- **URL:** `/api/verify-email.php?token={token}`
- **Method:** GET
- **Response:** Redirects to verification result page

### Resend Verification
- **URL:** `/api/resend-verification.php`
- **Method:** POST
- **Body:**
```json
{
  "email": "john@example.com"
}
```

## Security Features

✅ **Password Hashing:** BCrypt with cost factor 12  
✅ **SQL Injection Prevention:** Prepared statements with PDO  
✅ **XSS Protection:** Input sanitization and output encoding  
✅ **Rate Limiting:** 3 registration attempts per hour per IP  
✅ **Email Verification:** 24-hour token expiry  
✅ **CSRF Protection:** Token-based (to be implemented in frontend)  
✅ **Session Security:** HTTP-only cookies (to be implemented)  

## Database Tables

1. **users** - User accounts
2. **majors** - Academic majors
3. **email_verifications** - Email verification tokens
4. **activity_logs** - User activity tracking
5. **courses** - Course information
6. **enrollments** - Student enrollments
7. **content** - Course materials
8. **ratings** - Content ratings
9. **comments** - User comments
10. **downloads** - Download tracking
11. **admin_actions** - Admin activity logs

## Troubleshooting

### Email Not Sending

1. Check SMTP credentials in `includes/email.php`
2. Verify firewall allows SMTP port (587/465)
3. Check error logs: `error_log` in PHP
4. Test with a simple PHPMailer script

### Database Connection Error

1. Verify MySQL is running
2. Check credentials in `config/database.php`
3. Ensure database exists
4. Check user permissions

### Registration Fails

1. Check PHP error logs
2. Verify all required tables exist
3. Check file permissions
4. Enable error reporting in development

### Email Verification Link Invalid

1. Check token in database `email_verifications` table
2. Verify link hasn't expired (24 hours)
3. Check if already verified (`verified = 1`)

## Development vs Production

### Development
- Enable error display in PHP files
- Use local SMTP or mail testing tools (Mailtrap)
- Debug mode ON

### Production
- Disable error display
- Use proper SMTP service (SendGrid, AWS SES)
- Enable HTTPS
- Set secure session cookies
- Implement CSRF protection
- Add security headers
- Use environment variables for credentials

## Next Steps

1. Implement Login API (`api/login.php`)
2. Add Password Reset functionality
3. Implement Session Management
4. Add CSRF Protection
5. Create Admin Panel
6. Implement Course Management APIs
7. Add File Upload handling

## Support

For issues or questions:
1. Check error logs
2. Review database tables
3. Verify SMTP configuration
4. Test with sample data

---

**Tsharok LMS v1.0**  
Last Updated: November 2025
