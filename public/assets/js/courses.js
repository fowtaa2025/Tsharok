/**
 * Course Catalog & Enrollment JavaScript with Axios
 * Tsharok LMS
 */

/**
 * Fetch all courses (catalog) using Axios
 */
async function fetchCourses(filters = {}) {
    try {
        // Prepare query parameters
        const params = {};
        
        if (filters.search) params.search = filters.search;
        if (filters.major) params.major = filters.major;
        if (filters.level) params.level = filters.level;
        if (filters.instructor) params.instructor = filters.instructor;
        if (filters.limit) params.limit = filters.limit;
        if (filters.offset) params.offset = filters.offset;
        if (filters.sort) params.sort = filters.sort;
        if (filters.order) params.order = filters.order;
        
        // Make request with Axios
        const response = await axiosInstance.get('/courses.php', { params });
        
        if (response.success) {
            return response.data;
        } else {
            throw new Error(response.message || 'Failed to fetch courses');
        }
    } catch (error) {
        console.error('Error fetching courses:', error);
        throw error;
    }
}

/**
 * Fetch course details using Axios
 */
async function fetchCourseDetails(courseId) {
    try {
        const response = await axiosInstance.get('/course-details.php', {
            params: { courseId }
        });
        
        if (response.success) {
            return response.data.course;
        } else {
            throw new Error(response.message || 'Failed to fetch course details');
        }
    } catch (error) {
        console.error('Error fetching course details:', error);
        throw error;
    }
}

/**
 * Fetch user's enrolled courses using Axios
 */
async function fetchMyCourses(status = 'active') {
    try {
        const response = await axiosInstance.get('/my-courses.php', {
            params: { status }
        });
        
        if (response.success) {
            return response.data;
        } else {
            throw new Error(response.message || 'Failed to fetch enrolled courses');
        }
    } catch (error) {
        console.error('Error fetching my courses:', error);
        throw error;
    }
}

/**
 * Enroll in a course using Axios
 */
async function enrollInCourse(courseId) {
    try {
        const response = await axiosInstance.post('/enroll.php', { courseId });
        
        if (response.success) {
            return response.data;
        } else {
            throw new Error(response.message || 'Failed to enroll in course');
        }
    } catch (error) {
        console.error('Error enrolling in course:', error);
        throw error;
    }
}

/**
 * Unenroll from a course using Axios
 */
async function unenrollFromCourse(courseId) {
    try {
        const response = await axiosInstance.post('/unenroll.php', { courseId });
        
        if (response.success) {
            return response.data;
        } else {
            throw new Error(response.message || 'Failed to unenroll from course');
        }
    } catch (error) {
        console.error('Error unenrolling from course:', error);
        throw error;
    }
}

/**
 * Fetch all majors using Axios
 */
async function fetchMajors() {
    try {
        const response = await axiosInstance.get('/majors.php');
        
        if (response.success) {
            return response.data.majors;
        } else {
            throw new Error(response.message || 'Failed to fetch majors');
        }
    } catch (error) {
        console.error('Error fetching majors:', error);
        throw error;
    }
}

/**
 * Display courses in a grid
 */
function displayCourses(courses, containerId) {
    const container = document.getElementById(containerId);
    
    if (!container) {
        console.error('Container not found:', containerId);
        return;
    }
    
    if (courses.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
                <p class="text-gray-500 text-lg">No courses found</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = courses.map(course => createCourseCard(course)).join('');
}

/**
 * Create course card HTML
 */
function createCourseCard(course) {
    const stars = generateStarRating(course.avgRating);
    
    return `
        <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition duration-300">
            <div class="relative h-48 bg-gradient-to-br from-indigo-500 to-purple-600">
                <img src="${course.imageUrl}" alt="${course.courseName}" 
                     class="w-full h-full object-cover"
                     onerror="this.src='/assets/images/course-placeholder.jpg'">
                <div class="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-sm font-semibold text-indigo-600">
                    Level ${course.level}
                </div>
            </div>
            
            <div class="p-6">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-semibold text-gray-500 uppercase">${course.courseCode}</span>
                    <span class="text-xs text-gray-500">${course.majorName || 'General'}</span>
                </div>
                
                <h3 class="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                    ${course.courseName}
                </h3>
                
                <p class="text-gray-600 text-sm mb-4 line-clamp-2">
                    ${course.description || 'No description available'}
                </p>
                
                <div class="flex items-center mb-4">
                    <img src="${course.instructorImage || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(course.instructorName)}" 
                         alt="${course.instructorName}"
                         class="w-8 h-8 rounded-full mr-2">
                    <span class="text-sm text-gray-700">${course.instructorName}</span>
                </div>
                
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center">
                        ${stars}
                        <span class="text-sm text-gray-600 ml-2">${course.avgRating.toFixed(1)} (${course.ratingCount})</span>
                    </div>
                    <div class="text-sm text-gray-600">
                        <i class="fas fa-users mr-1"></i>${course.enrollmentCount}
                    </div>
                </div>
                
                <button onclick="viewCourse(${course.courseId})" 
                        class="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition">
                    <i class="fas fa-eye mr-2"></i>View Course
                </button>
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
    
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star text-yellow-400"></i>';
    }
    
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt text-yellow-400"></i>';
    }
    
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star text-yellow-400"></i>';
    }
    
    return stars;
}

/**
 * View course details
 */
async function viewCourse(courseId) {
    // Store course ID in session and redirect
    sessionStorage.setItem('selectedCourseId', courseId);
    window.location.href = '/dashboard/course-materials.html?courseId=' + courseId;
}

/**
 * Handle enrollment button
 */
async function handleEnrollment(courseId, buttonElement) {
    if (!buttonElement) return;
    
    const originalText = buttonElement.innerHTML;
    buttonElement.disabled = true;
    buttonElement.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Processing...';
    
    try {
        const result = await enrollInCourse(courseId);
        
        // Show success message
        showNotification('Success!', result.courseName + ' - Enrollment successful!', 'success');
        
        // Update button
        buttonElement.innerHTML = '<i class="fas fa-check mr-2"></i>Enrolled';
        buttonElement.classList.remove('bg-indigo-600', 'hover:bg-indigo-700');
        buttonElement.classList.add('bg-green-600', 'cursor-not-allowed');
        
        // Refresh course details if on details page
        if (typeof refreshCourseDetails === 'function') {
            refreshCourseDetails();
        }
        
    } catch (error) {
        showNotification('Error', error.message, 'error');
        buttonElement.disabled = false;
        buttonElement.innerHTML = originalText;
    }
}

/**
 * Handle unenrollment button
 */
async function handleUnenrollment(courseId, buttonElement) {
    if (!buttonElement) return;
    
    if (!confirm('Are you sure you want to unenroll from this course?')) {
        return;
    }
    
    const originalText = buttonElement.innerHTML;
    buttonElement.disabled = true;
    buttonElement.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Processing...';
    
    try {
        const result = await unenrollFromCourse(courseId);
        
        showNotification('Success!', 'Successfully unenrolled from ' + result.courseName, 'success');
        
        // Refresh the page or update UI
        setTimeout(() => {
            window.location.reload();
        }, 1500);
        
    } catch (error) {
        showNotification('Error', error.message, 'error');
        buttonElement.disabled = false;
        buttonElement.innerHTML = originalText;
    }
}

/**
 * Show notification
 */
function showNotification(title, message, type = 'info') {
    // Check if there's a custom notification function
    if (typeof showMessage === 'function') {
        showMessage(message, type);
        return;
    }
    
    // Fallback to alert
    alert(`${title}: ${message}`);
}

/**
 * Search courses
 */
function setupCourseSearch(inputId, containerId) {
    const searchInput = document.getElementById(inputId);
    
    if (!searchInput) return;
    
    let searchTimeout;
    
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        
        searchTimeout = setTimeout(async () => {
            const searchTerm = this.value.trim();
            
            try {
                const data = await fetchCourses({ search: searchTerm });
                displayCourses(data.courses, containerId);
            } catch (error) {
                console.error('Search error:', error);
            }
        }, 500);
    });
}

/**
 * Setup major filter
 */
async function setupMajorFilter(selectId, containerId) {
    const majorSelect = document.getElementById(selectId);
    
    if (!majorSelect) return;
    
    try {
        // Load majors
        const majors = await fetchMajors();
        
        majors.forEach(major => {
            const option = document.createElement('option');
            option.value = major.majorId;
            option.textContent = `${major.majorName} (${major.courseCount})`;
            majorSelect.appendChild(option);
        });
        
        // Add change event
        majorSelect.addEventListener('change', async function() {
            const majorId = this.value;
            
            try {
                const filters = majorId ? { major: majorId } : {};
                const data = await fetchCourses(filters);
                displayCourses(data.courses, containerId);
            } catch (error) {
                console.error('Filter error:', error);
            }
        });
        
    } catch (error) {
        console.error('Error setting up major filter:', error);
    }
}

// Export functions for global use
window.fetchCourses = fetchCourses;
window.fetchCourseDetails = fetchCourseDetails;
window.fetchMyCourses = fetchMyCourses;
window.enrollInCourse = enrollInCourse;
window.unenrollFromCourse = unenrollFromCourse;
window.fetchMajors = fetchMajors;
window.displayCourses = displayCourses;
window.viewCourse = viewCourse;
window.handleEnrollment = handleEnrollment;
window.handleUnenrollment = handleUnenrollment;
window.setupCourseSearch = setupCourseSearch;
window.setupMajorFilter = setupMajorFilter;

