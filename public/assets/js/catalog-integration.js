/**
 * Advanced Catalog Integration with Axios
 * Tsharok LMS
 * 
 * This file demonstrates advanced AJAX techniques including:
 * - Request cancellation
 * - Parallel requests
 * - Request queuing
 * - Caching
 * - Progress tracking
 */

// Request cancellation support
let currentCoursesRequest = null;

/**
 * Load courses with request cancellation
 * Cancels previous request if a new one is made
 */
async function loadCoursesWithCancellation(filters = {}) {
    try {
        // Cancel previous request if exists
        if (currentCoursesRequest) {
            currentCoursesRequest.cancel('New request initiated');
        }

        // Create cancellation token
        const CancelToken = axios.CancelToken;
        const source = CancelToken.source();
        currentCoursesRequest = source;

        // Make request with cancellation token
        const response = await axiosInstance.get('/courses.php', {
            params: filters,
            cancelToken: source.token
        });

        // Clear cancellation token
        currentCoursesRequest = null;

        return response;

    } catch (error) {
        if (axios.isCancel(error)) {
            console.log('Request cancelled:', error.message);
            throw new Error('Request cancelled');
        }
        throw error;
    }
}

/**
 * Load catalog data in parallel
 * Demonstrates loading multiple resources simultaneously
 */
async function loadCatalogDataParallel() {
    try {
        console.log('⚡ Loading catalog data in parallel...');
        
        const startTime = performance.now();

        // Make parallel requests
        const [coursesData, majorsData, statsData] = await Promise.all([
            axiosInstance.get('/courses.php', { params: { limit: 12 } }),
            axiosInstance.get('/majors.php'),
            axiosInstance.get('/courses.php', { params: { limit: 1 } }) // For getting total count
        ]);

        const endTime = performance.now();
        console.log(`✅ Loaded all data in ${(endTime - startTime).toFixed(2)}ms`);

        return {
            courses: coursesData.data.courses,
            majors: majorsData.data.majors,
            totalCourses: statsData.data.pagination.total,
            loadTime: endTime - startTime
        };

    } catch (error) {
        console.error('❌ Error loading catalog data:', error);
        throw error;
    }
}

/**
 * Batch load course details
 * Efficiently loads multiple course details
 */
async function batchLoadCourseDetails(courseIds) {
    try {
        console.log(`📦 Batch loading ${courseIds.length} course details...`);

        // Create array of requests
        const requests = courseIds.map(courseId => 
            axiosInstance.get('/course-details.php', { 
                params: { courseId } 
            })
        );

        // Execute all requests in parallel
        const results = await Promise.allSettled(requests);

        // Process results
        const successfulResults = [];
        const failedResults = [];

        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                successfulResults.push({
                    courseId: courseIds[index],
                    data: result.value.data.course
                });
            } else {
                failedResults.push({
                    courseId: courseIds[index],
                    error: result.reason.message
                });
            }
        });

        console.log(`✅ Successfully loaded ${successfulResults.length}/${courseIds.length} courses`);
        
        if (failedResults.length > 0) {
            console.warn('⚠️ Failed to load some courses:', failedResults);
        }

        return {
            successful: successfulResults,
            failed: failedResults
        };

    } catch (error) {
        console.error('❌ Batch load error:', error);
        throw error;
    }
}

/**
 * Cache manager for catalog data
 */
class CatalogCache {
    constructor(ttl = 5 * 60 * 1000) { // 5 minutes default TTL
        this.cache = new Map();
        this.ttl = ttl;
    }

    set(key, value) {
        const expiresAt = Date.now() + this.ttl;
        this.cache.set(key, { value, expiresAt });
        console.log(`💾 Cached: ${key}`);
    }

    get(key) {
        const cached = this.cache.get(key);
        
        if (!cached) {
            return null;
        }

        if (Date.now() > cached.expiresAt) {
            this.cache.delete(key);
            console.log(`⏰ Cache expired: ${key}`);
            return null;
        }

        console.log(`✨ Cache hit: ${key}`);
        return cached.value;
    }

    clear() {
        this.cache.clear();
        console.log('🗑️ Cache cleared');
    }

    has(key) {
        const cached = this.cache.get(key);
        if (!cached) return false;
        if (Date.now() > cached.expiresAt) {
            this.cache.delete(key);
            return false;
        }
        return true;
    }
}

// Create global cache instance
window.catalogCache = new CatalogCache();

/**
 * Fetch courses with caching
 */
async function fetchCoursesWithCache(filters = {}) {
    const cacheKey = `courses_${JSON.stringify(filters)}`;

    // Check cache first
    const cached = catalogCache.get(cacheKey);
    if (cached) {
        return cached;
    }

    // Fetch from API
    const data = await fetchCourses(filters);

    // Cache the result
    catalogCache.set(cacheKey, data);

    return data;
}

/**
 * Prefetch next page of courses
 * Improves perceived performance
 */
async function prefetchNextPage(currentOffset, filters = {}) {
    const nextOffset = currentOffset + (filters.limit || 12);
    const nextFilters = { ...filters, offset: nextOffset };

    try {
        console.log('🔮 Prefetching next page...');
        await fetchCoursesWithCache(nextFilters);
        console.log('✅ Next page prefetched');
    } catch (error) {
        console.warn('⚠️ Prefetch failed:', error.message);
    }
}

/**
 * Search with auto-complete suggestions
 */
async function searchWithSuggestions(query) {
    if (!query || query.length < 2) {
        return [];
    }

    try {
        // Use a shorter limit for suggestions
        const response = await axiosInstance.get('/courses.php', {
            params: {
                search: query,
                limit: 5
            }
        });

        if (response.success) {
            return response.data.courses.map(course => ({
                id: course.courseId,
                name: course.courseName,
                code: course.courseCode
            }));
        }

        return [];

    } catch (error) {
        console.error('Search suggestions error:', error);
        return [];
    }
}

/**
 * Retry failed requests with exponential backoff
 */
async function retryRequest(requestFn, maxRetries = 3, baseDelay = 1000) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await requestFn();
        } catch (error) {
            if (attempt === maxRetries - 1) {
                throw error;
            }

            const delay = baseDelay * Math.pow(2, attempt);
            console.log(`⏳ Retry attempt ${attempt + 1}/${maxRetries} in ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

/**
 * Upload progress tracking (for future file uploads)
 */
function uploadWithProgress(file, url, onProgress) {
    const formData = new FormData();
    formData.append('file', file);

    return axiosInstance.post(url, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
            );
            if (onProgress) {
                onProgress(percentCompleted);
            }
            console.log(`📤 Upload progress: ${percentCompleted}%`);
        }
    });
}

/**
 * Download with progress tracking
 */
async function downloadWithProgress(url, filename, onProgress) {
    try {
        const response = await axiosInstance.get(url, {
            responseType: 'blob',
            onDownloadProgress: (progressEvent) => {
                if (progressEvent.lengthComputable) {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    if (onProgress) {
                        onProgress(percentCompleted);
                    }
                    console.log(`📥 Download progress: ${percentCompleted}%`);
                }
            }
        });

        // Create download link
        const blob = new Blob([response.data]);
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);

        return true;

    } catch (error) {
        console.error('Download error:', error);
        throw error;
    }
}

/**
 * Performance monitoring
 */
class PerformanceMonitor {
    constructor() {
        this.metrics = [];
    }

    recordRequest(url, duration, success) {
        this.metrics.push({
            url,
            duration,
            success,
            timestamp: Date.now()
        });

        // Keep only last 100 metrics
        if (this.metrics.length > 100) {
            this.metrics.shift();
        }
    }

    getAverageResponseTime() {
        if (this.metrics.length === 0) return 0;
        
        const total = this.metrics.reduce((sum, m) => sum + m.duration, 0);
        return (total / this.metrics.length).toFixed(2);
    }

    getSuccessRate() {
        if (this.metrics.length === 0) return 100;
        
        const successful = this.metrics.filter(m => m.success).length;
        return ((successful / this.metrics.length) * 100).toFixed(2);
    }

    getSummary() {
        return {
            totalRequests: this.metrics.length,
            averageResponseTime: this.getAverageResponseTime() + 'ms',
            successRate: this.getSuccessRate() + '%'
        };
    }
}

// Create global performance monitor
window.catalogPerformanceMonitor = new PerformanceMonitor();

// Add performance tracking to axios instance
axiosInstance.interceptors.request.use((config) => {
    config.metadata = { startTime: performance.now() };
    return config;
});

axiosInstance.interceptors.response.use(
    (response) => {
        const duration = performance.now() - response.config.metadata.startTime;
        catalogPerformanceMonitor.recordRequest(response.config.url, duration, true);
        return response;
    },
    (error) => {
        if (error.config && error.config.metadata) {
            const duration = performance.now() - error.config.metadata.startTime;
            catalogPerformanceMonitor.recordRequest(error.config.url, duration, false);
        }
        return Promise.reject(error);
    }
);

// Export functions
window.loadCoursesWithCancellation = loadCoursesWithCancellation;
window.loadCatalogDataParallel = loadCatalogDataParallel;
window.batchLoadCourseDetails = batchLoadCourseDetails;
window.fetchCoursesWithCache = fetchCoursesWithCache;
window.prefetchNextPage = prefetchNextPage;
window.searchWithSuggestions = searchWithSuggestions;
window.retryRequest = retryRequest;
window.uploadWithProgress = uploadWithProgress;
window.downloadWithProgress = downloadWithProgress;

console.log('🚀 Advanced catalog integration loaded');

