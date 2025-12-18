/**
 * Content Upload Form Handler
 */

// Backend API URL
const API_URL = 'https://jungle-chapel-barcelona-cornwall.trycloudflare.com';

document.addEventListener('DOMContentLoaded', function () {
    const uploadForm = document.getElementById('uploadContentForm');
    const fileInput = document.getElementById('fileInput');
    const fileUploadArea = document.getElementById('fileUploadArea');
    const uploadPrompt = document.getElementById('uploadPrompt');
    const uploadProgress = document.getElementById('uploadProgress');
    const uploadComplete = document.getElementById('uploadComplete');
    const progressBar = document.getElementById('progressBar');
    const progressPercent = document.getElementById('progressPercent');
    const changeFileBtn = document.getElementById('changeFileBtn');
    const successModal = document.getElementById('successModal');

    let uploadedFile = null;

    // Character counter for description
    const descriptionField = document.getElementById('contentDescription');
    const charCount = document.getElementById('charCount');

    if (descriptionField && charCount) {
        descriptionField.addEventListener('input', function () {
            const length = this.value.length;
            charCount.textContent = length;
            if (length > 500) {
                charCount.classList.add('text-red-600');
                charCount.classList.remove('text-gray-500');
            } else {
                charCount.classList.remove('text-red-600');
                charCount.classList.add('text-gray-500');
            }
        });
    }

    // Tags functionality
    const tags = [];
    const tagInput = document.getElementById('tagInput');
    const addTagBtn = document.getElementById('addTagBtn');
    const tagsContainer = document.getElementById('tagsContainer');

    if (addTagBtn) {
        addTagBtn.addEventListener('click', addTag);
    }

    if (tagInput) {
        tagInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
            }
        });
    }

    function addTag() {
        if (!tagInput) return;

        const tagValue = tagInput.value.trim();
        if (tagValue && !tags.includes(tagValue)) {
            tags.push(tagValue);
            renderTags();
            tagInput.value = '';
        }
    }

    function removeTag(tag) {
        const index = tags.indexOf(tag);
        if (index > -1) {
            tags.splice(index, 1);
            renderTags();
        }
    }

    function renderTags() {
        if (!tagsContainer) return;

        tagsContainer.innerHTML = tags.map(tag => `
            <span class="bg-indigo-100 text-primary px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                ${escapeHtml(tag)}
                <button type="button" onclick="window.removeContentTag('${escapeHtml(tag)}')" class="text-primary hover:text-indigo-700">
                    <i class="fas fa-times"></i>
                </button>
            </span>
        `).join('');
    }

    // Make removeTag accessible globally
    window.removeContentTag = removeTag;

    // File upload area click handler
    if (fileUploadArea && fileInput) {
        fileUploadArea.addEventListener('click', function () {
            if (uploadComplete && !uploadComplete.classList.contains('hidden')) return;
            fileInput.click();
        });

        fileInput.addEventListener('change', function (e) {
            if (this.files.length > 0) {
                handleFileUpload(this.files[0]);
            }
        });
    }

    // Drag and drop functionality
    if (fileUploadArea) {
        fileUploadArea.addEventListener('dragover', function (e) {
            e.preventDefault();
            this.classList.add('dragover');
        });

        fileUploadArea.addEventListener('dragleave', function (e) {
            e.preventDefault();
            this.classList.remove('dragover');
        });

        fileUploadArea.addEventListener('drop', function (e) {
            e.preventDefault();
            this.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                handleFileUpload(e.dataTransfer.files[0]);
            }
        });
    }

    async function handleFileUpload(file) {
        // Validate file size (100MB)
        const maxSize = 100 * 1024 * 1024;
        if (file.size > maxSize) {
            showToast('File size exceeds 100MB limit', 'error');
            return;
        }

        // Validate file type
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'video/mp4',
            'video/x-msvideo',
            'video/quicktime',
            'application/zip',
            'application/x-rar-compressed',
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp'
        ];

        if (!allowedTypes.includes(file.type)) {
            showToast('File type not supported', 'error');
            return;
        }

        uploadedFile = file;

        // Show file info
        if (document.getElementById('fileName')) {
            document.getElementById('fileName').textContent = file.name;
        }
        if (document.getElementById('fileSize')) {
            document.getElementById('fileSize').textContent = formatFileSize(file.size);
        }

        // Hide prompt, show progress
        if (uploadPrompt) uploadPrompt.classList.add('hidden');
        if (uploadProgress) uploadProgress.classList.remove('hidden');

        // Upload to staging area
        try {
            await uploadToStaging(file);
        } catch (error) {
            console.error('Upload to staging failed:', error);
            showToast('Upload failed: ' + error.message, 'error');
            resetUpload();
        }
    }

    async function uploadToStaging(file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_type', 'content');

        // Get course ID if selected
        const courseSelect = document.getElementById('courseSelect');
        if (courseSelect && courseSelect.value) {
            formData.append('course_id', courseSelect.value);
        }

        // Process images if it's an image file
        if (file.type.startsWith('image/')) {
            formData.append('process_image', 'true');
            formData.append('max_width', '1920');
            formData.append('max_height', '1080');
            formData.append('quality', '85');
        } else {
            formData.append('process_image', 'false');
        }

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            // Track upload progress
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percent = Math.round((e.loaded / e.total) * 100);
                    if (progressBar) progressBar.style.width = percent + '%';
                    if (progressPercent) progressPercent.textContent = percent;
                }
            });

            // Upload complete
            xhr.addEventListener('load', () => {
                if (xhr.status === 200) {
                    try {
                        const response = JSON.parse(xhr.responseText);

                        if (response.success) {
                            // Store staging info for final upload
                            window.stagingUploadData = response.data;
                            showUploadComplete();
                            showToast('File uploaded to staging area', 'success');
                            resolve(response);
                        } else {
                            reject(new Error(response.message || 'Upload failed'));
                        }
                    } catch (error) {
                        reject(new Error('Invalid server response'));
                    }
                } else {
                    reject(new Error('Upload failed with status: ' + xhr.status));
                }
            });

            // Upload error
            xhr.addEventListener('error', () => {
                reject(new Error('Network error during upload'));
            });

            // Send request
            xhr.open('POST', 'https://tsharok-api.fow-taa-2025.workers.dev/api/file-upload-handler', true);
            xhr.send(formData);
        });
    }

    function showUploadComplete() {
        if (uploadProgress) uploadProgress.classList.add('hidden');
        if (uploadComplete) uploadComplete.classList.remove('hidden');
        if (document.getElementById('completedFileName')) {
            document.getElementById('completedFileName').textContent = uploadedFile ? uploadedFile.name : '';
        }
    }

    if (changeFileBtn) {
        changeFileBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            resetUpload();
        });
    }

    function resetUpload() {
        uploadedFile = null;
        if (fileInput) fileInput.value = '';
        if (uploadComplete) uploadComplete.classList.add('hidden');
        if (uploadPrompt) uploadPrompt.classList.remove('hidden');
        if (progressBar) progressBar.style.width = '0%';
        if (progressPercent) progressPercent.textContent = '0';
    }

    // Form submission
    if (uploadForm) {
        uploadForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            // Validate form
            const contentUrl = document.getElementById('contentUrl');
            if (!uploadedFile && (!contentUrl || !contentUrl.value)) {
                showToast('Please upload a file or provide a URL', 'error');
                return;
            }

            // Prepare form data
            const formData = new FormData(this);

            // Add staging data if file was uploaded
            if (uploadedFile && window.stagingUploadData) {
                // Add primary file from staging
                if (window.stagingUploadData.files.optimized) {
                    formData.append('file_url', window.stagingUploadData.files.optimized.filename);
                } else if (window.stagingUploadData.files.original) {
                    formData.append('file_url', window.stagingUploadData.files.original.filename);
                }

                // Add metadata from staging
                formData.append('file_size', window.stagingUploadData.file_info.size);
                formData.append('mime_type', uploadedFile.type);
                formData.append('from_staging', 'true');

                // Add processing info
                formData.append('processed', window.stagingUploadData.processed ? 'true' : 'false');

                // Add thumbnail if available
                if (window.stagingUploadData.files.thumbnail) {
                    formData.append('thumbnail', window.stagingUploadData.files.thumbnail.filename);
                }
            } else if (uploadedFile) {
                // Fallback: upload file directly if staging failed
                formData.append('file', uploadedFile);
            }

            // Add tags
            formData.append('tags', tags.join(','));

            // Convert checkbox values
            const checkboxes = ['publish_now', 'allow_downloads', 'allow_comments', 'notify_students'];
            checkboxes.forEach(name => {
                const checkbox = document.getElementById(name.replace(/_/g, ''));
                if (checkbox) {
                    formData.set(name, checkbox.checked ? 'true' : 'false');
                }
            });

            try {
                // Show loading state
                const submitBtn = this.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Publishing...';

                // Submit form
                const response = await fetch('https://tsharok-api.fow-taa-2025.workers.dev/api/content-upload', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                // Restore button
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;

                if (result.success) {
                    // Clear staging data
                    window.stagingUploadData = null;

                    // Show success modal
                    if (successModal) {
                        successModal.classList.remove('hidden');
                    } else {
                        showToast('Content uploaded successfully!', 'success');
                        setTimeout(() => {
                            window.location.href = 'content-library.html';
                        }, 2000);
                    }
                } else {
                    showToast(result.message || 'Upload failed', 'error');
                }

            } catch (error) {
                console.error('Upload error:', error);
                showToast('An error occurred during upload', 'error');

                // Restore button
                const submitBtn = this.querySelector('button[type="submit"]');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-upload mr-2"></i>Upload Content';
            }
        });
    }

    // Save draft functionality
    const saveDraftBtn = document.getElementById('saveDraftBtn');
    if (saveDraftBtn) {
        saveDraftBtn.addEventListener('click', function () {
            if (confirm('Save this content as a draft?')) {
                // In real implementation, save to localStorage or server
                const formData = new FormData(uploadForm);
                const draftData = {};
                for (let [key, value] of formData.entries()) {
                    draftData[key] = value;
                }
                draftData.tags = tags;

                localStorage.setItem('contentDraft', JSON.stringify(draftData));
                showToast('Draft saved successfully!', 'success');
            }
        });
    }

    // Load draft if exists
    const savedDraft = localStorage.getItem('contentDraft');
    if (savedDraft) {
        const shouldLoad = confirm('A saved draft was found. Would you like to load it?');
        if (shouldLoad) {
            try {
                const draftData = JSON.parse(savedDraft);

                // Populate form fields
                for (let [key, value] of Object.entries(draftData)) {
                    const field = uploadForm.querySelector(`[name="${key}"]`);
                    if (field) {
                        field.value = value;
                    }
                }

                // Load tags
                if (draftData.tags && Array.isArray(draftData.tags)) {
                    tags.length = 0;
                    tags.push(...draftData.tags);
                    renderTags();
                }

                showToast('Draft loaded successfully!', 'success');
                localStorage.removeItem('contentDraft');
            } catch (error) {
                console.error('Error loading draft:', error);
            }
        } else {
            localStorage.removeItem('contentDraft');
        }
    }

    // Show/hide due date based on content type
    const contentTypeSelect = document.getElementById('contentType');
    if (contentTypeSelect) {
        contentTypeSelect.addEventListener('change', function () {
            const dueDateField = document.getElementById('dueDate');
            if (dueDateField) {
                const dueDateContainer = dueDateField.closest('div');
                if (this.value === 'assignment') {
                    dueDateContainer.classList.remove('opacity-50');
                    dueDateField.required = true;
                } else {
                    dueDateContainer.classList.add('opacity-50');
                    dueDateField.required = false;
                    dueDateField.value = '';
                }
            }
        });
    }

    // Utility functions
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        const bgColor = type === 'success' ? 'bg-green-500' :
            type === 'error' ? 'bg-red-500' : 'bg-blue-500';

        toast.className = `fixed top-20 right-4 z-50 px-6 py-4 rounded-lg shadow-xl transform transition-all duration-300 ${bgColor} text-white`;
        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.transform = 'translateX(400px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    console.log('Content upload page initialized');
});

