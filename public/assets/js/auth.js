// Authentication JavaScript for Login and Register pages

// Toggle password visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(inputId + '-icon');

    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Show message notification
function showMessage(message, type = 'success') {
    const container = document.getElementById('message-container');
    const icon = document.getElementById('message-icon');
    const text = document.getElementById('message-text');

    if (!container) return;

    // Set icon based on type
    if (type === 'success') {
        icon.innerHTML = '<i class="fas fa-check-circle text-green-500 text-2xl"></i>';
    } else if (type === 'error') {
        icon.innerHTML = '<i class="fas fa-exclamation-circle text-red-500 text-2xl"></i>';
    } else {
        icon.innerHTML = '<i class="fas fa-info-circle text-blue-500 text-2xl"></i>';
    }

    text.textContent = message;
    container.classList.remove('hidden');

    // Auto hide after 5 seconds
    setTimeout(() => {
        closeMessage();
    }, 5000);
}

function closeMessage() {
    const container = document.getElementById('message-container');
    if (container) {
        container.classList.add('hidden');
    }
}

// Password strength checker
function checkPasswordStrength(password) {
    const lengthCheck = document.getElementById('length-check');
    const uppercaseCheck = document.getElementById('uppercase-check');
    const numberCheck = document.getElementById('number-check');

    if (!lengthCheck || !uppercaseCheck || !numberCheck) return;

    // Check length
    if (password.length >= 8) {
        lengthCheck.classList.remove('text-gray-400');
        lengthCheck.classList.add('text-green-500');
        lengthCheck.innerHTML = '<i class="fas fa-check-circle text-xs"></i> 8+ characters';
    } else {
        lengthCheck.classList.remove('text-green-500');
        lengthCheck.classList.add('text-gray-400');
        lengthCheck.innerHTML = '<i class="fas fa-circle text-xs"></i> 8+ characters';
    }

    // Check uppercase
    if (/[A-Z]/.test(password)) {
        uppercaseCheck.classList.remove('text-gray-400');
        uppercaseCheck.classList.add('text-green-500');
        uppercaseCheck.innerHTML = '<i class="fas fa-check-circle text-xs"></i> Uppercase';
    } else {
        uppercaseCheck.classList.remove('text-green-500');
        uppercaseCheck.classList.add('text-gray-400');
        uppercaseCheck.innerHTML = '<i class="fas fa-circle text-xs"></i> Uppercase';
    }

    // Check number
    if (/\d/.test(password)) {
        numberCheck.classList.remove('text-gray-400');
        numberCheck.classList.add('text-green-500');
        numberCheck.innerHTML = '<i class="fas fa-check-circle text-xs"></i> Number';
    } else {
        numberCheck.classList.remove('text-green-500');
        numberCheck.classList.add('text-gray-400');
        numberCheck.innerHTML = '<i class="fas fa-circle text-xs"></i> Number';
    }
}

// Check if passwords match
function checkPasswordMatch() {
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirm-password');
    const errorMessage = document.getElementById('password-match-error');

    if (!password || !confirmPassword || !errorMessage) return;

    if (confirmPassword.value && password.value !== confirmPassword.value) {
        errorMessage.classList.remove('hidden');
        confirmPassword.classList.add('border-red-500');
        return false;
    } else {
        errorMessage.classList.add('hidden');
        confirmPassword.classList.remove('border-red-500');
        return true;
    }
}

// Handle role selection styling
function handleRoleSelection() {
    const roleInputs = document.querySelectorAll('input[name="role"]');
    const majorField = document.getElementById('major-field');

    roleInputs.forEach(input => {
        input.addEventListener('change', function () {
            // Update visual selection
            roleInputs.forEach(r => {
                const label = r.parentElement;
                if (r.checked) {
                    label.classList.add('border-primary', 'bg-indigo-50');
                } else {
                    label.classList.remove('border-primary', 'bg-indigo-50');
                }
            });

            // Show/hide major field based on role
            if (majorField) {
                if (this.value === 'student') {
                    majorField.style.display = 'block';
                    document.getElementById('major').setAttribute('required', 'required');
                } else {
                    majorField.style.display = 'none';
                    document.getElementById('major').removeAttribute('required');
                }
            }
        });
    });
}

// Login Form Handler
function handleLoginForm() {
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const formData = new FormData(loginForm);
            const data = {
                identifier: formData.get('identifier'),
                password: formData.get('password'),
                remember: formData.get('remember') === 'on'
            };

            // Basic validation
            if (!data.identifier || !data.password) {
                showMessage('Please fill in all required fields', 'error');
                return;
            }

            // Disable submit button
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Signing In...';

            try {
                // Call login API
                const response = await fetch('https://tsharok-api.fow-taa-2025.workers.dev/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (result.success) {
                    showMessage(result.message, 'success');

                    // Store user data in both sessionStorage and localStorage
                    if (result.user) {
                        sessionStorage.setItem('user', JSON.stringify(result.user));
                        localStorage.setItem('user', JSON.stringify(result.user));  // Also save to localStorage for persistence
                        if (result.user.sessionToken) {
                            localStorage.setItem('token', result.user.sessionToken);  // Save token for API auth
                        }
                    }

                    // Redirect to appropriate dashboard
                    setTimeout(() => {
                        const redirectUrl = result.redirectUrl || '/dashboard/student.html';
                        window.location.href = redirectUrl;
                    }, 1000);
                } else {
                    showMessage(result.message, 'error');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }

            } catch (error) {
                console.error('Login error:', error);
                showMessage('An error occurred. Please try again.', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }
}

// Register Form Handler
function handleRegisterForm() {
    const registerForm = document.getElementById('registerForm');

    if (registerForm) {
        // Password strength checker
        const passwordInput = document.getElementById('password');
        if (passwordInput) {
            passwordInput.addEventListener('input', function () {
                checkPasswordStrength(this.value);
            });
        }

        // Password match checker
        const confirmPasswordInput = document.getElementById('confirm-password');
        if (confirmPasswordInput) {
            confirmPasswordInput.addEventListener('input', checkPasswordMatch);
        }

        // Form submission
        registerForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            // Check password match
            if (!checkPasswordMatch()) {
                showMessage('Passwords do not match', 'error');
                return;
            }

            const formData = new FormData(registerForm);
            const data = {
                role: formData.get('role'),
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                username: formData.get('username'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                major: formData.get('major'),
                password: formData.get('password'),
                confirmPassword: formData.get('confirmPassword'),
                terms: formData.get('terms') === 'on'
            };

            // Validation
            if (!data.terms) {
                showMessage('Please accept the terms and conditions', 'error');
                return;
            }

            if (data.username.length < 3) {
                showMessage('Username must be at least 3 characters', 'error');
                return;
            }

            if (data.password.length < 8) {
                showMessage('Password must be at least 8 characters', 'error');
                return;
            }

            // Disable submit button
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creating Account...';

            try {
                // Call registration API
                const response = await fetch('https://tsharok-api.fow-taa-2025.workers.dev/api/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (result.success) {
                    showMessage(result.message, 'success');

                    // Show email verification notice
                    setTimeout(() => {
                        alert('Registration successful! Please check your email to verify your account. Check your spam folder if you don\'t see it.');
                        window.location.href = 'login.html';
                    }, 1000);
                } else {
                    showMessage(result.message, 'error');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }

            } catch (error) {
                console.error('Registration error:', error);
                showMessage('An error occurred. Please try again.', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    handleLoginForm();
    handleRegisterForm();
    handleRoleSelection();

    // Set initial role selection styling
    const checkedRole = document.querySelector('input[name="role"]:checked');
    if (checkedRole) {
        checkedRole.parentElement.classList.add('border-primary', 'bg-indigo-50');
    }
});
