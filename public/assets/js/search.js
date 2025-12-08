/**
 * Search and Filter Logic
 * Tsharok LMS - Search Results Page
 */

// Global state
let currentFilters = {
    searchQuery: '',
    category: 'all',
    level: 'all',
    minRating: 0,
    semester: 'all',
    sortBy: 'relevance',
    page: 1
};

let totalResults = 0;
let totalPages = 0;
let isLoading = false;

// Debounce helper
let autocompleteTimeout = null;

/**
 * Initialize on page load
 */
document.addEventListener('DOMContentLoaded', function() {
    // Get search query from URL
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    
    if (query) {
        currentFilters.searchQuery = query;
        document.getElementById('mainSearchInput').value = query;
    }
    
    // Load filter options
    loadFilterOptions();
    
    // Perform initial search
    performSearch();
    
    // Setup event listeners
    setupEventListeners();
});

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Main search input
    const searchInput = document.getElementById('mainSearchInput');
    searchInput.addEventListener('input', handleSearchInput);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch(true);
        }
    });
    
    // Clear search button
    document.getElementById('clearSearch').addEventListener('click', function() {
        document.getElementById('mainSearchInput').value = '';
        currentFilters.searchQuery = '';
        this.classList.add('hidden');
        performSearch(true);
    });
    
    // Filter selects
    document.getElementById('categoryFilter').addEventListener('change', function() {
        currentFilters.category = this.value;
    });
    
    document.getElementById('levelFilter').addEventListener('change', function() {
        currentFilters.level = this.value;
    });
    
    document.getElementById('ratingFilter').addEventListener('change', function() {
        currentFilters.minRating = parseFloat(this.value);
    });
    
    document.getElementById('semesterFilter').addEventListener('change', function() {
        currentFilters.semester = this.value;
    });
    
    // Sort dropdown
    document.getElementById('sortBy').addEventListener('change', function() {
        currentFilters.sortBy = this.value;
        performSearch(true);
    });
    
    // Apply filters button
    document.getElementById('applyFilters').addEventListener('click', function() {
        performSearch(true);
    });
    
    // Clear filters buttons
    document.getElementById('clearFilters').addEventListener('click', clearAllFilters);
    document.getElementById('clearActiveFilters').addEventListener('click', clearAllFilters);
    
    // Pagination
    document.getElementById('prevPage').addEventListener('click', function() {
        if (currentFilters.page > 1) {
            currentFilters.page--;
            performSearch();
            window.scrollTo(0, 0);
        }
    });
    
    document.getElementById('nextPage').addEventListener('click', function() {
        if (currentFilters.page < totalPages) {
            currentFilters.page++;
            performSearch();
            window.scrollTo(0, 0);
        }
    });
}

/**
 * Handle search input with autocomplete
 */
function handleSearchInput(e) {
    const query = e.target.value;
    currentFilters.searchQuery = query;
    
    // Show/hide clear button
    const clearBtn = document.getElementById('clearSearch');
    if (query.length > 0) {
        clearBtn.classList.remove('hidden');
    } else {
        clearBtn.classList.add('hidden');
    }
    
    // Debounce autocomplete
    clearTimeout(autocompleteTimeout);
    
    if (query.length >= 2) {
        autocompleteTimeout = setTimeout(() => {
            loadAutocomplete(query);
        }, 300);
    } else {
        hideAutocomplete();
    }
}

/**
 * Load autocomplete suggestions
 */
async function loadAutocomplete(query) {
    try {
        const response = await axios.get('/api/search-suggestions.php', {
            params: { q: query, limit: 8 }
        });
        
        if (response.data.success) {
            displayAutocomplete(response.data.data.suggestions);
        }
    } catch (error) {
        console.error('Autocomplete error:', error);
    }
}

/**
 * Display autocomplete dropdown
 */
function displayAutocomplete(suggestions) {
    const dropdown = document.getElementById('autocompleteDropdown');
    
    if (suggestions.length === 0) {
        hideAutocomplete();
        return;
    }
    
    const html = suggestions.map(suggestion => `
        <div class="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0" 
             onclick="selectSuggestion('${escapeHtml(suggestion)}')">
            <i class="fas fa-search text-gray-400 mr-2"></i>
            ${escapeHtml(suggestion)}
        </div>
    `).join('');
    
    dropdown.innerHTML = html;
    dropdown.classList.remove('hidden');
    
    // Close dropdown when clicking outside
    document.addEventListener('click', closeAutocompleteOutside);
}

/**
 * Hide autocomplete dropdown
 */
function hideAutocomplete() {
    document.getElementById('autocompleteDropdown').classList.add('hidden');
    document.removeEventListener('click', closeAutocompleteOutside);
}

/**
 * Close autocomplete when clicking outside
 */
function closeAutocompleteOutside(e) {
    const dropdown = document.getElementById('autocompleteDropdown');
    const searchInput = document.getElementById('mainSearchInput');
    
    if (!dropdown.contains(e.target) && e.target !== searchInput) {
        hideAutocomplete();
    }
}

/**
 * Select a suggestion
 */
function selectSuggestion(suggestion) {
    document.getElementById('mainSearchInput').value = suggestion;
    currentFilters.searchQuery = suggestion;
    hideAutocomplete();
    performSearch(true);
}

/**
 * Load filter options from API
 */
async function loadFilterOptions() {
    try {
        const response = await axios.get('/api/filter-options.php');
        
        if (response.data.success) {
            const options = response.data.data;
            
            // Populate category filter
            if (options.categories && options.categories.length > 0) {
                const categoryFilter = document.getElementById('categoryFilter');
                options.categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category;
                    option.textContent = category;
                    categoryFilter.appendChild(option);
                });
            }
            
            // Populate semester filter
            if (options.semesters && options.semesters.length > 0) {
                const semesterFilter = document.getElementById('semesterFilter');
                options.semesters.forEach(semester => {
                    const option = document.createElement('option');
                    option.value = semester;
                    option.textContent = semester;
                    semesterFilter.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error loading filter options:', error);
    }
}

/**
 * Perform search with current filters
 */
async function performSearch(resetPage = false) {
    if (isLoading) return;
    
    if (resetPage) {
        currentFilters.page = 1;
    }
    
    isLoading = true;
    showLoading();
    hideEmptyState();
    
    try {
        // Build params
        const params = {
            page: currentFilters.page,
            limit: 12,
            sortBy: currentFilters.sortBy
        };
        
        if (currentFilters.searchQuery) {
            params.q = currentFilters.searchQuery;
        }
        
        if (currentFilters.category !== 'all') {
            params.category = currentFilters.category;
        }
        
        if (currentFilters.level !== 'all') {
            params.level = currentFilters.level;
        }
        
        if (currentFilters.minRating > 0) {
            params.minRating = currentFilters.minRating;
        }
        
        if (currentFilters.semester !== 'all') {
            params.semester = currentFilters.semester;
        }
        
        // Call API
        const response = await axios.get('/api/search.php', { params });
        
        if (response.data.success) {
            const data = response.data.data;
            
            // Update results
            totalResults = data.pagination.totalResults;
            totalPages = data.pagination.totalPages;
            
            displayResults(data.courses);
            updateResultsHeader();
            updateActiveFilters();
            updatePagination(data.pagination);
        } else {
            showEmptyState();
        }
        
    } catch (error) {
        console.error('Search error:', error);
        showToast('Failed to load search results', 'error');
        showEmptyState();
    } finally {
        isLoading = false;
        hideLoading();
    }
}

/**
 * Listen for language changes and update display
 */
window.addEventListener('languageChanged', () => {
    // Re-display current results with new language
    if (state.results.length > 0) {
        displayResults(state.results);
    }
    // Update page info text
    updatePageInfo();
});

/**
 * Display search results
 */
function displayResults(courses) {
    const grid = document.getElementById('resultsGrid');
    
    if (courses.length === 0) {
        showEmptyState();
        return;
    }
    
    const html = courses.map(course => createCourseCard(course)).join('');
    grid.innerHTML = html;
}

/**
 * Create course card HTML
 */
function createCourseCard(course) {
    const stars = generateStarRating(course.averageRating);
    
    return `
        <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition transform hover:-translate-y-1">
            <a href="course-details.html?id=${course.courseId}">
                <img 
                    src="${course.thumbnail}" 
                    alt="${escapeHtml(course.title)}"
                    class="w-full h-48 object-cover"
                    onerror="this.src='/assets/images/default-course.jpg'"
                >
            </a>
            
            <div class="p-4">
                <!-- Category Badge -->
                <div class="flex items-center justify-between mb-2">
                    <span class="inline-block bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded">
                        ${escapeHtml(course.category)}
                    </span>
                    <span class="text-xs text-gray-500">
                        <i class="fas fa-clock mr-1"></i>
                        ${course.duration}
                    </span>
                </div>
                
                <!-- Title -->
                <a href="course-details.html?id=${course.courseId}">
                    <h3 class="text-lg font-bold text-gray-900 mb-2 hover:text-indigo-600 line-clamp-2">
                        ${escapeHtml(course.title)}
                    </h3>
                </a>
                
                <!-- Description -->
                <p class="text-gray-600 text-sm mb-3 line-clamp-2">
                    ${escapeHtml(course.description)}
                </p>
                
                <!-- Rating -->
                <div class="flex items-center mb-3">
                    <div class="flex text-yellow-400">
                        ${stars}
                    </div>
                    <span class="text-sm text-gray-600 ml-2">
                        ${course.averageRating.toFixed(1)} (${course.ratingCount})
                    </span>
                </div>
                
                <!-- Footer -->
                <div class="flex items-center justify-between pt-3 border-t">
                    <div class="flex items-center text-sm text-gray-500">
                        <i class="fas fa-users mr-1"></i>
                        <span class="ltr-numbers">${course.enrollmentCount}</span> ${typeof t !== 'undefined' ? t('course.students') : 'students'}
                    </div>
                    <span class="text-xs px-2 py-1 rounded ${getLevelBadgeClass(course.level)}">
                        ${course.level}
                    </span>
                </div>
                
                ${course.relevance > 0 ? `
                    <div class="mt-2 text-xs text-gray-500">
                        <i class="fas fa-fire text-orange-500 mr-1"></i>
                        ${typeof t !== 'undefined' ? t('course.relevance') : 'Relevance'}: <span class="ltr-numbers">${(course.relevance * 100).toFixed(0)}%</span>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

/**
 * Generate star rating HTML
 */
function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let html = '';
    
    for (let i = 0; i < fullStars; i++) {
        html += '<i class="fas fa-star"></i>';
    }
    
    if (hasHalfStar) {
        html += '<i class="fas fa-star-half-alt"></i>';
    }
    
    for (let i = 0; i < emptyStars; i++) {
        html += '<i class="far fa-star"></i>';
    }
    
    return html;
}

/**
 * Get level badge class
 */
function getLevelBadgeClass(level) {
    const classes = {
        'Beginner': 'bg-green-100 text-green-800',
        'Intermediate': 'bg-yellow-100 text-yellow-800',
        'Advanced': 'bg-red-100 text-red-800'
    };
    return classes[level] || 'bg-gray-100 text-gray-800';
}

/**
 * Update results header
 */
function updateResultsHeader() {
    const title = document.getElementById('resultsTitle');
    const count = document.getElementById('resultsCount');
    
    if (currentFilters.searchQuery) {
        title.textContent = `Search results for "${currentFilters.searchQuery}"`;
    } else {
        title.textContent = 'All Courses';
    }
    
    count.textContent = `${totalResults} ${totalResults === 1 ? 'course' : 'courses'} found`;
}

/**
 * Update active filters display
 */
function updateActiveFilters() {
    const container = document.getElementById('activeFilters');
    const list = document.getElementById('activeFiltersList');
    
    const badges = [];
    
    if (currentFilters.searchQuery) {
        badges.push(createFilterBadge('Search', currentFilters.searchQuery, 'searchQuery'));
    }
    
    if (currentFilters.category !== 'all') {
        badges.push(createFilterBadge('Category', currentFilters.category, 'category'));
    }
    
    if (currentFilters.level !== 'all') {
        badges.push(createFilterBadge('Level', currentFilters.level, 'level'));
    }
    
    if (currentFilters.minRating > 0) {
        badges.push(createFilterBadge('Rating', `${currentFilters.minRating}+ stars`, 'minRating'));
    }
    
    if (currentFilters.semester !== 'all') {
        badges.push(createFilterBadge('Semester', currentFilters.semester, 'semester'));
    }
    
    if (badges.length > 0) {
        list.innerHTML = badges.join('');
        container.classList.remove('hidden');
    } else {
        container.classList.add('hidden');
    }
}

/**
 * Create filter badge
 */
function createFilterBadge(label, value, key) {
    return `
        <span class="filter-badge inline-flex items-center gap-2 bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">
            <span><strong>${label}:</strong> ${escapeHtml(value)}</span>
            <button onclick="removeFilter('${key}')" class="hover:text-indigo-900">
                <i class="fas fa-times text-xs"></i>
            </button>
        </span>
    `;
}

/**
 * Remove specific filter
 */
function removeFilter(key) {
    switch(key) {
        case 'searchQuery':
            currentFilters.searchQuery = '';
            document.getElementById('mainSearchInput').value = '';
            break;
        case 'category':
            currentFilters.category = 'all';
            document.getElementById('categoryFilter').value = 'all';
            break;
        case 'level':
            currentFilters.level = 'all';
            document.getElementById('levelFilter').value = 'all';
            break;
        case 'minRating':
            currentFilters.minRating = 0;
            document.getElementById('ratingFilter').value = '0';
            break;
        case 'semester':
            currentFilters.semester = 'all';
            document.getElementById('semesterFilter').value = 'all';
            break;
    }
    
    performSearch(true);
}

/**
 * Clear all filters
 */
function clearAllFilters() {
    currentFilters = {
        searchQuery: '',
        category: 'all',
        level: 'all',
        minRating: 0,
        semester: 'all',
        sortBy: 'relevance',
        page: 1
    };
    
    // Reset UI
    document.getElementById('mainSearchInput').value = '';
    document.getElementById('categoryFilter').value = 'all';
    document.getElementById('levelFilter').value = 'all';
    document.getElementById('ratingFilter').value = '0';
    document.getElementById('semesterFilter').value = 'all';
    document.getElementById('sortBy').value = 'relevance';
    document.getElementById('clearSearch').classList.add('hidden');
    
    performSearch(true);
}

/**
 * Update pagination controls
 */
function updatePagination(pagination) {
    const paginationContainer = document.getElementById('pagination');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const pageNumbers = document.getElementById('pageNumbers');
    
    if (pagination.totalPages <= 1) {
        paginationContainer.classList.add('hidden');
        return;
    }
    
    paginationContainer.classList.remove('hidden');
    
    // Update buttons
    prevBtn.disabled = currentFilters.page === 1;
    nextBtn.disabled = currentFilters.page === pagination.totalPages;
    
    // Generate page numbers
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentFilters.page - Math.floor(maxVisible / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        pages.push(`
            <button 
                onclick="goToPage(${i})"
                class="px-4 py-2 border rounded-lg ${i === currentFilters.page ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 hover:bg-gray-50'}"
            >
                ${i}
            </button>
        `);
    }
    
    pageNumbers.innerHTML = pages.join('');
}

/**
 * Go to specific page
 */
function goToPage(page) {
    currentFilters.page = page;
    performSearch();
    window.scrollTo(0, 0);
}

/**
 * Show loading state
 */
function showLoading() {
    document.getElementById('loadingState').classList.remove('hidden');
    document.getElementById('resultsGrid').classList.add('hidden');
    document.getElementById('emptyState').classList.add('hidden');
}

/**
 * Hide loading state
 */
function hideLoading() {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('resultsGrid').classList.remove('hidden');
}

/**
 * Show empty state
 */
function showEmptyState() {
    document.getElementById('emptyState').classList.remove('hidden');
    document.getElementById('resultsGrid').classList.add('hidden');
    document.getElementById('pagination').classList.add('hidden');
}

/**
 * Hide empty state
 */
function hideEmptyState() {
    document.getElementById('emptyState').classList.add('hidden');
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const icon = document.getElementById('toastIcon');
    const messageEl = document.getElementById('toastMessage');
    
    const icons = {
        success: '<i class="fas fa-check-circle text-green-500 text-2xl"></i>',
        error: '<i class="fas fa-exclamation-circle text-red-500 text-2xl"></i>',
        info: '<i class="fas fa-info-circle text-blue-500 text-2xl"></i>'
    };
    
    icon.innerHTML = icons[type] || icons.info;
    messageEl.textContent = message;
    
    toast.classList.remove('hidden', 'translate-y-32');
    toast.classList.add('translate-y-0');
    
    setTimeout(hideToast, 3000);
}

/**
 * Hide toast notification
 */
function hideToast() {
    const toast = document.getElementById('toast');
    toast.classList.remove('translate-y-0');
    toast.classList.add('translate-y-32');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 300);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
