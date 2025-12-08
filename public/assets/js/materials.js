/**
 * Course Materials JavaScript
 * Integrates with view-materials.php API endpoint to display course materials
 * 
 * FEATURES:
 * - Loads materials from API by course ID
 * - Filters by type (lecture, video, assignment, document, quiz)
 * - Search functionality
 * - Dynamic rendering of material cards
 * - Pagination support
 * - Loading and error states
 * 
 * USAGE:
 * 1. Include this file in course-materials.html
 * 2. Pass course_id as URL parameter: ?course_id=1
 * 3. Materials will automatically load on page load
 * 
 * API ENDPOINT:
 * ../api/view-materials.php?course_id={id}&type={type}&search={term}
 */

// Global variables
let allMaterials = [];
let currentCourseId = null;

document.addEventListener('DOMContentLoaded', function() {
    // Get course ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    currentCourseId = urlParams.get('course_id');
    
    // Load materials if course ID is present
    if (currentCourseId) {
        loadMaterials(currentCourseId);
    } else {
        console.warn('No course ID provided in URL');
    }
    
    // Tab switching
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            tabButtons.forEach(btn => {
                btn.classList.remove('active', 'bg-primary', 'text-white');
                btn.classList.add('text-gray-700', 'hover:bg-gray-100');
            });
            
            // Add active class to clicked button
            this.classList.add('active', 'bg-primary', 'text-white');
            this.classList.remove('text-gray-700', 'hover:bg-gray-100');
            
            const tabType = this.dataset.tab;
            filterMaterialsByType(tabType);
        });
    });

    // Initialize active tab styling
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab) {
        activeTab.classList.add('bg-primary', 'text-white');
        activeTab.classList.remove('text-gray-700');
    }

    // Search functionality
    const searchInput = document.getElementById('searchMaterials');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            filterMaterialsBySearch(searchTerm);
        });
    }

    // Week section toggle
    const weekToggles = document.querySelectorAll('.bg-gray-50 button');
    weekToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const section = this.closest('.bg-white');
            const content = section.querySelector('.p-6');
            const icon = this.querySelector('i');
            
            if (content) {
                if (content.style.display === 'none') {
                    content.style.display = 'block';
                    icon.classList.remove('fa-chevron-right');
                    icon.classList.add('fa-chevron-down');
                } else {
                    content.style.display = 'none';
                    icon.classList.remove('fa-chevron-down');
                    icon.classList.add('fa-chevron-right');
                }
            }
        });
    });

    // Material card actions
    setupMaterialActions();
});

/**
 * Load materials from the API
 */
async function loadMaterials(courseId, filters = {}) {
    try {
        // Show loading indicator
        showLoadingState();
        
        // Build query parameters
        const params = new URLSearchParams({ course_id: courseId });
        
        if (filters.type) params.append('type', filters.type);
        if (filters.search) params.append('search', filters.search);
        if (filters.sort_by) params.append('sort_by', filters.sort_by);
        if (filters.sort_order) params.append('sort_order', filters.sort_order);
        if (filters.limit) params.append('limit', filters.limit);
        if (filters.offset) params.append('offset', filters.offset);
        
        const response = await fetch(`../api/view-materials.php?${params.toString()}`);
        const result = await response.json();
        
        if (result.success) {
            allMaterials = result.data.materials;
            displayMaterials(allMaterials);
            updateCourseInfo(result.data.course);
            updateStatistics(result.data);
            
            if (result.data.pagination) {
                displayPagination(result.data.pagination);
            }
            
            showToast('Materials loaded successfully', 'success');
        } else {
            showToast(result.message || 'Failed to load materials', 'error');
            showErrorState(result.message);
        }
    } catch (error) {
        console.error('Error loading materials:', error);
        showToast('An error occurred while loading materials', 'error');
        showErrorState('Unable to connect to server');
    }
}

/**
 * Display materials in the UI
 */
function displayMaterials(materials) {
    const materialsContainer = document.querySelector('.space-y-6');
    
    if (!materials || materials.length === 0) {
        materialsContainer.innerHTML = `
            <div class="bg-white rounded-xl shadow-md p-12 text-center">
                <i class="fas fa-folder-open text-6xl text-gray-300 mb-4"></i>
                <h3 class="text-xl font-bold text-gray-900 mb-2">No Materials Found</h3>
                <p class="text-gray-600">There are no materials available for this course yet.</p>
            </div>
        `;
        return;
    }
    
    // Group materials by week or category if needed
    const groupedMaterials = groupMaterialsByWeek(materials);
    
    // Clear existing content
    materialsContainer.innerHTML = '';
    
    // Render each group
    for (const [weekName, weekMaterials] of Object.entries(groupedMaterials)) {
        const weekSection = createWeekSection(weekName, weekMaterials);
        materialsContainer.appendChild(weekSection);
    }
}

/**
 * Group materials by week (placeholder - customize based on your data structure)
 */
function groupMaterialsByWeek(materials) {
    // For now, group all materials under "All Materials"
    // You can enhance this to group by actual week numbers or dates
    return {
        'All Materials': materials
    };
}

/**
 * Create a week section HTML element
 */
function createWeekSection(weekName, materials) {
    const section = document.createElement('div');
    section.className = 'bg-white rounded-xl shadow-md overflow-hidden';
    
    const header = document.createElement('div');
    header.className = 'bg-gray-50 px-6 py-4 border-b flex items-center justify-between cursor-pointer';
    header.innerHTML = `
        <div>
            <h2 class="text-xl font-bold text-gray-900">${weekName}</h2>
            <p class="text-sm text-gray-600 mt-1">${materials.length} item${materials.length !== 1 ? 's' : ''}</p>
        </div>
        <button class="text-primary hover:text-indigo-700 week-toggle">
            <i class="fas fa-chevron-down text-lg"></i>
        </button>
    `;
    
    const content = document.createElement('div');
    content.className = 'p-6 week-content';
    
    const grid = document.createElement('div');
    grid.className = 'grid md:grid-cols-2 gap-4';
    
    materials.forEach(material => {
        const card = createMaterialCard(material);
        grid.appendChild(card);
    });
    
    content.appendChild(grid);
    section.appendChild(header);
    section.appendChild(content);
    
    // Add toggle functionality
    header.addEventListener('click', function() {
        const icon = this.querySelector('i');
        if (content.style.display === 'none') {
            content.style.display = 'block';
            icon.classList.remove('fa-chevron-right');
            icon.classList.add('fa-chevron-down');
        } else {
            content.style.display = 'none';
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-right');
        }
    });
    
    return section;
}

/**
 * Create a material card HTML element
 */
function createMaterialCard(material) {
    const card = document.createElement('div');
    card.className = 'border border-gray-200 rounded-lg p-4 hover:shadow-md transition group';
    card.dataset.materialId = material.id;
    card.dataset.materialType = material.type;
    
    const typeConfig = getMaterialTypeConfig(material.type);
    
    card.innerHTML = `
        <div class="flex items-start gap-4">
            <div class="${typeConfig.bgColor} w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                <i class="${typeConfig.icon} ${typeConfig.textColor} text-xl"></i>
            </div>
            <div class="flex-1">
                <div class="flex items-start justify-between mb-2">
                    <div>
                        <h3 class="font-semibold text-gray-900 group-hover:text-primary transition">${escapeHtml(material.title)}</h3>
                        <p class="text-sm text-gray-500">${material.mime_type || material.file_size_formatted || 'File'}</p>
                    </div>
                    ${material.is_approved ? 
                        '<span class="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded">Approved</span>' : 
                        '<span class="bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-1 rounded">Pending</span>'
                    }
                </div>
                <p class="text-sm text-gray-600 mb-3">${escapeHtml(material.description || 'No description available')}</p>
                <div class="flex items-center gap-3 flex-wrap">
                    <a href="material-view.html?id=${material.id}" class="text-primary hover:text-indigo-700 text-sm font-medium">
                        <i class="fas fa-eye mr-1"></i>View
                    </a>
                    <button class="text-gray-600 hover:text-gray-900 text-sm font-medium download-btn" data-material-id="${material.id}">
                        <i class="fas fa-download mr-1"></i>Download
                    </button>
                    ${material.statistics.avg_rating ? `
                        <span class="text-xs text-gray-500">
                            <i class="fas fa-star text-yellow-500 mr-1"></i>${material.statistics.avg_rating} (${material.statistics.rating_count})
                        </span>
                    ` : ''}
                    <span class="ml-auto text-xs text-gray-500">
                        <i class="fas fa-download mr-1"></i>${material.statistics.download_count} downloads
                    </span>
                </div>
                <div class="mt-2 text-xs text-gray-500">
                    <i class="fas fa-user mr-1"></i>${escapeHtml(material.uploader.name)} • 
                    <i class="fas fa-clock mr-1"></i>${material.upload_date_formatted}
                </div>
            </div>
        </div>
    `;
    
    return card;
}

/**
 * Get material type configuration
 */
function getMaterialTypeConfig(type) {
    const configs = {
        'lecture': {
            icon: 'fas fa-book-open',
            bgColor: 'bg-blue-100',
            textColor: 'text-blue-600'
        },
        'video': {
            icon: 'fas fa-video',
            bgColor: 'bg-red-100',
            textColor: 'text-red-600'
        },
        'assignment': {
            icon: 'fas fa-clipboard-check',
            bgColor: 'bg-purple-100',
            textColor: 'text-purple-600'
        },
        'quiz': {
            icon: 'fas fa-question-circle',
            bgColor: 'bg-green-100',
            textColor: 'text-green-600'
        },
        'document': {
            icon: 'fas fa-file-alt',
            bgColor: 'bg-yellow-100',
            textColor: 'text-yellow-600'
        },
        'other': {
            icon: 'fas fa-file',
            bgColor: 'bg-gray-100',
            textColor: 'text-gray-600'
        }
    };
    
    return configs[type] || configs['other'];
}

/**
 * Update course information in the header
 */
function updateCourseInfo(course) {
    if (!course) return;
    
    const titleElement = document.querySelector('h1');
    if (titleElement) {
        titleElement.textContent = course.course_name;
    }
    
    const codeElement = document.querySelector('.text-indigo-100');
    if (codeElement) {
        codeElement.textContent = `${course.course_code} • Spring 2025`;
    }
}

/**
 * Update statistics display
 */
function updateStatistics(data) {
    const totalMaterials = data.total_count || 0;
    const statsContainer = document.querySelector('.grid.md\\:grid-cols-4');
    
    if (statsContainer) {
        const totalElement = statsContainer.querySelector('p.text-2xl');
        if (totalElement) {
            totalElement.textContent = totalMaterials;
        }
    }
}

/**
 * Show loading state
 */
function showLoadingState() {
    const materialsContainer = document.querySelector('.space-y-6');
    if (materialsContainer) {
        materialsContainer.innerHTML = `
            <div class="bg-white rounded-xl shadow-md p-12 text-center">
                <i class="fas fa-spinner fa-spin text-6xl text-primary mb-4"></i>
                <h3 class="text-xl font-bold text-gray-900 mb-2">Loading Materials...</h3>
                <p class="text-gray-600">Please wait while we fetch the course materials.</p>
            </div>
        `;
    }
}

/**
 * Show error state
 */
function showErrorState(message) {
    const materialsContainer = document.querySelector('.space-y-6');
    if (materialsContainer) {
        materialsContainer.innerHTML = `
            <div class="bg-white rounded-xl shadow-md p-12 text-center">
                <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
                <h3 class="text-xl font-bold text-gray-900 mb-2">Error Loading Materials</h3>
                <p class="text-gray-600 mb-4">${escapeHtml(message)}</p>
                <button onclick="location.reload()" class="bg-primary text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition">
                    <i class="fas fa-redo mr-2"></i>Try Again
                </button>
            </div>
        `;
    }
}

/**
 * Filter materials by type
 */
function filterMaterialsByType(type) {
    if (type === 'all') {
        displayMaterials(allMaterials);
    } else {
        const typeMap = {
            'lectures': 'lecture',
            'videos': 'video',
            'assignments': 'assignment',
            'documents': 'document',
            'quizzes': 'quiz'
        };
        
        const actualType = typeMap[type] || type;
        const filtered = allMaterials.filter(m => m.type === actualType);
        displayMaterials(filtered);
    }
}

/**
 * Old filterMaterials function - kept for compatibility
 */
function filterMaterials(type) {
    const materialCards = document.querySelectorAll('[class*="border border-gray-200"]');
    
    materialCards.forEach(card => {
        if (type === 'all') {
            card.parentElement.style.display = 'block';
        } else {
            const cardType = card.querySelector('.bg-blue-100, .bg-red-100, .bg-purple-100, .bg-green-100, .bg-yellow-100');
            if (cardType) {
                const materialType = getMaterialTypeFromIcon(cardType);
                if (materialType === type) {
                    card.parentElement.style.display = 'block';
                } else {
                    card.parentElement.style.display = 'none';
                }
            }
        }
    });
}

function getMaterialTypeFromIcon(iconContainer) {
    if (iconContainer.querySelector('.fa-book-open')) return 'lectures';
    if (iconContainer.querySelector('.fa-video')) return 'videos';
    if (iconContainer.querySelector('.fa-clipboard-check')) return 'assignments';
    if (iconContainer.querySelector('.fa-question-circle')) return 'quizzes';
    if (iconContainer.querySelector('.fa-file-alt')) return 'documents';
    return 'other';
}

function filterMaterialsBySearch(searchTerm) {
    const materialCards = document.querySelectorAll('[class*="border border-gray-200"]');
    
    materialCards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        const description = card.querySelector('.text-sm.text-gray-600').textContent.toLowerCase();
        
        if (title.includes(searchTerm) || description.includes(searchTerm)) {
            card.parentElement.style.display = 'block';
        } else {
            card.parentElement.style.display = 'none';
        }
    });
}

function setupMaterialActions() {
    // View action
    const viewButtons = document.querySelectorAll('button:has(.fa-eye)');
    viewButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const materialTitle = this.closest('[class*="border border-gray-200"]').querySelector('h3').textContent;
            showToast(`Opening: ${materialTitle}`, 'info');
            // Implement view functionality
        });
    });

    // Download action
    const downloadButtons = document.querySelectorAll('button:has(.fa-download), button:has(.fa-file-download)');
    downloadButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const materialTitle = this.closest('[class*="border border-gray-200"]').querySelector('h3').textContent;
            showToast(`Downloading: ${materialTitle}`, 'success');
            simulateDownload();
        });
    });

    // Play video action
    const playButtons = document.querySelectorAll('button:has(.fa-play)');
    playButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const materialTitle = this.closest('[class*="border border-gray-200"]').querySelector('h3').textContent;
            showToast(`Playing: ${materialTitle}`, 'info');
            // Implement video player functionality
        });
    });

    // Submit assignment action
    const submitButtons = document.querySelectorAll('button:has(.fa-upload)');
    submitButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            showSubmissionModal();
        });
    });

    // Start quiz action
    const quizButtons = document.querySelectorAll('button:contains("Start Quiz")');
    quizButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const quizTitle = this.closest('[class*="border border-gray-200"]').querySelector('h3').textContent;
            if (confirm(`Are you ready to start ${quizTitle}? Once started, the timer will begin.`)) {
                showToast('Starting quiz...', 'info');
                // Redirect to quiz page
            }
        });
    });

    // Rating action
    const rateButtons = document.querySelectorAll('button:has(.fa-star)');
    rateButtons.forEach(button => {
        if (button.textContent.includes('Rate')) {
            button.addEventListener('click', function(e) {
                e.stopPropagation();
                showRatingModal();
            });
        }
    });

    // Comment action
    const commentButtons = document.querySelectorAll('button:has(.fa-comment)');
    commentButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const materialTitle = this.closest('[class*="border border-gray-200"]').querySelector('h3').textContent;
            showToast(`Opening comments for: ${materialTitle}`, 'info');
            // Implement comments section
        });
    });
}

function simulateDownload() {
    // Simulate download progress
    const progressToast = document.createElement('div');
    progressToast.className = 'fixed bottom-4 right-4 bg-white rounded-lg shadow-xl p-4 z-50';
    progressToast.innerHTML = `
        <div class="flex items-center gap-3">
            <i class="fas fa-download text-primary text-xl"></i>
            <div class="flex-1">
                <p class="text-sm font-medium text-gray-900">Downloading...</p>
                <div class="w-48 bg-gray-200 rounded-full h-2 mt-2">
                    <div class="bg-primary h-2 rounded-full transition-all duration-300" style="width: 0%" id="download-progress"></div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(progressToast);

    let progress = 0;
    const interval = setInterval(() => {
        progress += 10;
        const progressBar = document.getElementById('download-progress');
        if (progressBar) {
            progressBar.style.width = progress + '%';
        }
        
        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                progressToast.remove();
                showToast('Download complete!', 'success');
            }, 500);
        }
    }, 200);
}

function showSubmissionModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-xl p-8 max-w-md mx-4">
            <h3 class="text-2xl font-bold text-gray-900 mb-4">Submit Assignment</h3>
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Upload your file</label>
                <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition cursor-pointer">
                    <i class="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-2"></i>
                    <p class="text-gray-600">Click to upload or drag and drop</p>
                    <p class="text-sm text-gray-500 mt-1">PDF, DOC, DOCX up to 10MB</p>
                </div>
            </div>
            <div class="mb-6">
                <label class="block text-sm font-medium text-gray-700 mb-2">Comments (Optional)</label>
                <textarea rows="3" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Add any comments about your submission..."></textarea>
            </div>
            <div class="flex gap-3">
                <button onclick="this.closest('.fixed').remove()" class="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition">Cancel</button>
                <button onclick="submitAssignment(this)" class="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-indigo-700 transition">Submit</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function submitAssignment(button) {
    showToast('Assignment submitted successfully!', 'success');
    button.closest('.fixed').remove();
}

function showRatingModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-xl p-8 max-w-md mx-4">
            <h3 class="text-2xl font-bold text-gray-900 mb-4">Rate this Material</h3>
            <div class="mb-6 text-center">
                <div class="flex items-center justify-center gap-2 mb-4">
                    ${[1,2,3,4,5].map(i => `
                        <button class="rating-star text-4xl text-gray-300 hover:text-yellow-500 transition" data-rating="${i}">
                            <i class="fas fa-star"></i>
                        </button>
                    `).join('')}
                </div>
                <p class="text-sm text-gray-600">Click to rate</p>
            </div>
            <div class="mb-6">
                <label class="block text-sm font-medium text-gray-700 mb-2">Your Feedback (Optional)</label>
                <textarea rows="3" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Share your thoughts..."></textarea>
            </div>
            <div class="flex gap-3">
                <button onclick="this.closest('.fixed').remove()" class="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition">Cancel</button>
                <button onclick="submitRating(this)" class="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-indigo-700 transition">Submit Rating</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Star rating interaction
    const stars = modal.querySelectorAll('.rating-star');
    stars.forEach(star => {
        star.addEventListener('click', function() {
            const rating = this.dataset.rating;
            stars.forEach((s, index) => {
                if (index < rating) {
                    s.classList.remove('text-gray-300');
                    s.classList.add('text-yellow-500');
                } else {
                    s.classList.remove('text-yellow-500');
                    s.classList.add('text-gray-300');
                }
            });
        });
    });
}

function submitRating(button) {
    const modal = button.closest('.fixed');
    const selectedRating = modal.querySelectorAll('.text-yellow-500').length;
    
    if (selectedRating === 0) {
        showToast('Please select a rating', 'error');
        return;
    }
    
    showToast(`Thank you for rating (${selectedRating} stars)!`, 'success');
    modal.remove();
}

/**
 * Display pagination controls
 */
function displayPagination(pagination) {
    // Find or create pagination container
    let paginationContainer = document.querySelector('.pagination-container');
    
    if (!paginationContainer) {
        const mainContainer = document.querySelector('.space-y-6').parentElement;
        paginationContainer = document.createElement('div');
        paginationContainer.className = 'pagination-container flex justify-center items-center gap-2 mt-8';
        mainContainer.appendChild(paginationContainer);
    }
    
    paginationContainer.innerHTML = '';
    
    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.className = `px-4 py-2 rounded-lg ${pagination.current_page > 1 ? 'bg-primary text-white hover:bg-indigo-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`;
    prevBtn.textContent = 'Previous';
    prevBtn.disabled = pagination.current_page <= 1;
    prevBtn.addEventListener('click', () => {
        if (pagination.current_page > 1) {
            loadMaterials(currentCourseId, {
                limit: pagination.limit,
                offset: (pagination.current_page - 2) * pagination.limit
            });
        }
    });
    paginationContainer.appendChild(prevBtn);
    
    // Page info
    const pageInfo = document.createElement('span');
    pageInfo.className = 'text-gray-700 font-medium';
    pageInfo.textContent = `Page ${pagination.current_page} of ${pagination.total_pages}`;
    paginationContainer.appendChild(pageInfo);
    
    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.className = `px-4 py-2 rounded-lg ${pagination.current_page < pagination.total_pages ? 'bg-primary text-white hover:bg-indigo-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`;
    nextBtn.textContent = 'Next';
    nextBtn.disabled = pagination.current_page >= pagination.total_pages;
    nextBtn.addEventListener('click', () => {
        if (pagination.current_page < pagination.total_pages) {
            loadMaterials(currentCourseId, {
                limit: pagination.limit,
                offset: pagination.current_page * pagination.limit
            });
        }
    });
    paginationContainer.appendChild(nextBtn);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

// Toast notification (if not already defined)
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

console.log('Materials page initialized');
