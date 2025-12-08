// Course Form JavaScript

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('addCourseForm');
    
    if (!form) return;

    // File upload handlers
    setupFileUpload('thumbnail', 'image');
    setupFileUpload('syllabusFile', 'document');

    // Form validation
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (validateForm()) {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            
            console.log('Course data:', data);
            
            // Show success message
            showSuccessModal();
            
            // Simulate API call
            setTimeout(() => {
                // window.location.href = 'instructor.html';
            }, 2000);
        }
    });

    // Real-time validation
    const requiredFields = form.querySelectorAll('[required]');
    requiredFields.forEach(field => {
        field.addEventListener('blur', function() {
            validateField(this);
        });
    });

    // Date validation
    const startDateInput = form.querySelector('[name="startDate"]');
    const endDateInput = form.querySelector('[name="endDate"]');
    
    if (startDateInput && endDateInput) {
        startDateInput.addEventListener('change', function() {
            endDateInput.min = this.value;
            validateDateRange();
        });
        
        endDateInput.addEventListener('change', validateDateRange);
    }

    // Character counter for textareas
    const textareas = form.querySelectorAll('textarea');
    textareas.forEach(textarea => {
        addCharacterCounter(textarea);
    });

    // Toggle publish status
    const publishToggle = form.querySelector('[name="isPublished"]');
    if (publishToggle) {
        publishToggle.addEventListener('change', function() {
            if (this.checked) {
                showConfirmDialog('Are you sure you want to publish this course? It will be visible to all students.');
            }
        });
    }

    // Save draft functionality
    const saveDraftButtons = document.querySelectorAll('button[type="button"]');
    saveDraftButtons.forEach(button => {
        if (button.textContent.includes('Draft')) {
            button.addEventListener('click', saveDraft);
        }
    });
});

// Setup file upload with preview
function setupFileUpload(inputId, type) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const container = input.parentElement;
    
    container.addEventListener('click', () => input.click());
    
    input.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // Validate file
        const maxSize = type === 'image' ? 5 * 1024 * 1024 : 10 * 1024 * 1024; // 5MB for images, 10MB for documents
        if (file.size > maxSize) {
            showToast(`File size must be less than ${maxSize / 1024 / 1024}MB`, 'error');
            input.value = '';
            return;
        }
        
        // Show preview
        const reader = new FileReader();
        reader.onload = function(e) {
            if (type === 'image') {
                showImagePreview(container, e.target.result, file.name);
            } else {
                showDocumentPreview(container, file.name);
            }
        };
        reader.readAsDataURL(file);
    });
    
    // Drag and drop
    container.addEventListener('dragover', (e) => {
        e.preventDefault();
        container.classList.add('border-primary', 'bg-indigo-50');
    });
    
    container.addEventListener('dragleave', () => {
        container.classList.remove('border-primary', 'bg-indigo-50');
    });
    
    container.addEventListener('drop', (e) => {
        e.preventDefault();
        container.classList.remove('border-primary', 'bg-indigo-50');
        
        const file = e.dataTransfer.files[0];
        if (file) {
            input.files = e.dataTransfer.files;
            input.dispatchEvent(new Event('change'));
        }
    });
}

// Show image preview
function showImagePreview(container, src, filename) {
    container.innerHTML = `
        <div class="relative">
            <img src="${src}" alt="Preview" class="max-h-48 mx-auto rounded-lg mb-2">
            <p class="text-sm text-gray-600">${filename}</p>
            <button type="button" onclick="clearUpload(this, 'thumbnail')" class="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
}

// Show document preview
function showDocumentPreview(container, filename) {
    container.innerHTML = `
        <div class="relative">
            <i class="fas fa-file-pdf text-4xl text-primary mb-2"></i>
            <p class="text-sm text-gray-900 font-medium">${filename}</p>
            <button type="button" onclick="clearUpload(this, 'syllabusFile')" class="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
}

// Clear upload
function clearUpload(button, inputId) {
    const input = document.getElementById(inputId);
    if (input) {
        input.value = '';
        setupFileUpload(inputId, inputId === 'thumbnail' ? 'image' : 'document');
    }
}

// Form validation
function validateForm() {
    const form = document.getElementById('addCourseForm');
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });
    
    if (!validateDateRange()) {
        isValid = false;
    }
    
    return isValid;
}

// Validate individual field
function validateField(field) {
    const value = field.value.trim();
    
    if (!value) {
        showFieldError(field, 'This field is required');
        return false;
    }
    
    // Additional validation based on field type
    if (field.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            showFieldError(field, 'Please enter a valid email');
            return false;
        }
    }
    
    if (field.type === 'number') {
        const num = parseFloat(value);
        if (isNaN(num) || num < 0) {
            showFieldError(field, 'Please enter a valid positive number');
            return false;
        }
    }
    
    clearFieldError(field);
    return true;
}

// Validate date range
function validateDateRange() {
    const startDate = document.querySelector('[name="startDate"]');
    const endDate = document.querySelector('[name="endDate"]');
    
    if (startDate && endDate && startDate.value && endDate.value) {
        if (new Date(startDate.value) >= new Date(endDate.value)) {
            showFieldError(endDate, 'End date must be after start date');
            return false;
        }
        clearFieldError(endDate);
    }
    
    return true;
}

// Show field error
function showFieldError(field, message) {
    field.classList.add('border-red-500');
    
    let errorDiv = field.parentElement.querySelector('.error-message');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'error-message text-red-600 text-sm mt-1';
        field.parentElement.appendChild(errorDiv);
    }
    errorDiv.textContent = message;
}

// Clear field error
function clearFieldError(field) {
    field.classList.remove('border-red-500');
    const errorDiv = field.parentElement.querySelector('.error-message');
    if (errorDiv) {
        errorDiv.remove();
    }
}

// Add character counter
function addCharacterCounter(textarea) {
    const maxLength = textarea.getAttribute('maxlength');
    if (!maxLength) return;
    
    const counter = document.createElement('div');
    counter.className = 'text-sm text-gray-500 text-right mt-1';
    counter.textContent = `0 / ${maxLength}`;
    textarea.parentElement.appendChild(counter);
    
    textarea.addEventListener('input', function() {
        counter.textContent = `${this.value.length} / ${maxLength}`;
        if (this.value.length > maxLength * 0.9) {
            counter.classList.add('text-red-600');
        } else {
            counter.classList.remove('text-red-600');
        }
    });
}

// Save draft
function saveDraft() {
    const form = document.getElementById('addCourseForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    localStorage.setItem('course_draft', JSON.stringify(data));
    showToast('Draft saved successfully!', 'success');
    console.log('Draft saved:', data);
}

// Show success modal
function showSuccessModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-xl p-8 max-w-md mx-4 text-center">
            <div class="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-check text-3xl text-green-600"></i>
            </div>
            <h3 class="text-2xl font-bold text-gray-900 mb-2">Course Created!</h3>
            <p class="text-gray-600 mb-6">Your course has been created successfully and is ready for students.</p>
            <button onclick="this.parentElement.parentElement.remove()" class="bg-primary text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition">
                Close
            </button>
        </div>
    `;
    document.body.appendChild(modal);
}

// Show confirm dialog
function showConfirmDialog(message) {
    return confirm(message);
}

// Toast notification (if not already defined in dashboard.js)
if (typeof window.showToast === 'undefined') {
    window.showToast = function(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `fixed top-20 right-4 z-50 px-6 py-4 rounded-lg shadow-xl transform transition-all duration-300 ${
            type === 'success' ? 'bg-green-500' : 
            type === 'error' ? 'bg-red-500' : 
            'bg-blue-500'
        } text-white`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.transform = 'translateX(400px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };
}
