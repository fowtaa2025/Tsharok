/**
 * Ratings and Comments Management
 * Handles star ratings, reviews, and comments with AJAX
 * Uses Axios for HTTP requests and Moment.js for date formatting
 */

// Configure Moment.js
if (typeof moment !== 'undefined') {
    moment.locale('en'); // Set default locale
}

// Global state
let currentContentId = null;
let currentUserRating = null;
let currentPage = 1;
let currentFilter = 'all';
let currentSort = 'recent';
let isLoading = false;

/**
 * Initialize on page load
 */
document.addEventListener('DOMContentLoaded', function () {
    // Get content ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentContentId = urlParams.get('id') || 1;

    // Load course data
    loadCourseDetails();
    loadRatings();
    loadReviews();

    // Setup event listeners
    setupEventListeners();
    setupStarRating();
});

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Write review button
    document.getElementById('writeReviewBtn')?.addEventListener('click', openRatingModal);

    // Close modal
    document.getElementById('closeModalBtn')?.addEventListener('click', closeRatingModal);
    document.getElementById('cancelReviewBtn')?.addEventListener('click', closeRatingModal);

    // Review form
    document.getElementById('reviewForm')?.addEventListener('submit', submitReview);

    // Character counter
    document.getElementById('reviewContent')?.addEventListener('input', updateCharCount);

    // Filter and sort
    document.getElementById('ratingFilter')?.addEventListener('change', handleFilterChange);
    document.getElementById('sortReviews')?.addEventListener('change', handleSortChange);

    // Load more
    document.getElementById('loadMoreReviews')?.addEventListener('click', loadMoreReviews);

    // Close modal on backdrop click
    document.getElementById('ratingModal')?.addEventListener('click', function (e) {
        if (e.target.id === 'ratingModal') {
            closeRatingModal();
        }
    });
}

/**
 * Setup interactive star rating
 */
function setupStarRating() {
    const starContainer = document.getElementById('modalStarRating');
    if (!starContainer) return;

    const stars = starContainer.querySelectorAll('.star');
    let selectedRating = 0;

    stars.forEach((star, index) => {
        // Hover effect
        star.addEventListener('mouseenter', function () {
            highlightStars(index + 1);
        });

        // Click to select
        star.addEventListener('click', function () {
            selectedRating = index + 1;
            document.getElementById('ratingValue').value = selectedRating;
            updateRatingText(selectedRating);
            highlightStars(selectedRating, true);
        });
    });

    // Reset on mouse leave
    starContainer.addEventListener('mouseleave', function () {
        if (selectedRating > 0) {
            highlightStars(selectedRating, true);
        } else {
            resetStars();
        }
    });
}

/**
 * Highlight stars up to given rating
 */
function highlightStars(rating, permanent = false) {
    const stars = document.querySelectorAll('#modalStarRating .star');
    stars.forEach((star, index) => {
        star.classList.remove('active', 'hover');
        if (index < rating) {
            star.classList.add(permanent ? 'active' : 'hover');
        }
    });
}

/**
 * Reset all stars
 */
function resetStars() {
    const stars = document.querySelectorAll('#modalStarRating .star');
    stars.forEach(star => {
        star.classList.remove('active', 'hover');
    });
}

/**
 * Update rating text
 */
function updateRatingText(rating) {
    const texts = {
        1: 'Poor - Needs improvement',
        2: 'Fair - Below expectations',
        3: 'Good - Meets expectations',
        4: 'Very Good - Exceeds expectations',
        5: 'Excellent - Outstanding!'
    };
    document.getElementById('ratingText').textContent = texts[rating] || 'Click to rate';
}

/**
 * Update character count
 */
function updateCharCount() {
    const content = document.getElementById('reviewContent').value;
    const count = content.length;
    document.getElementById('charCount').textContent = count;

    if (count > 1000) {
        document.getElementById('reviewContent').value = content.substring(0, 1000);
        document.getElementById('charCount').textContent = '1000';
    }
}

/**
 * Load course details
 */
async function loadCourseDetails() {
    try {
        const response = await axios.get(`/api/course-details.php?id=${currentCourseId}`);

        if (response.data.success) {
            const course = response.data.data;

            // Update UI
            document.getElementById('courseTitle').textContent = course.title;
            document.getElementById('courseDescription').textContent = course.description;
            document.getElementById('instructorName').textContent = course.instructor;
            document.getElementById('studentsCount').textContent = `${course.enrollmentCount} students`;
            document.getElementById('courseDuration').textContent = course.duration;
            document.getElementById('courseLevel').textContent = course.level;
            document.getElementById('courseCategory').textContent = course.category;
            document.getElementById('startDate').textContent = formatDate(course.startDate);
            document.getElementById('endDate').textContent = formatDate(course.endDate);
        }
    } catch (error) {
        console.error('Error loading course details:', error);
        showToast('Failed to load course details', 'error');
    }
}

/**
 * Load ratings statistics
 */
async function loadRatings() {
    try {
        showLoader('ratingsLoader');

        const response = await axios.get(`https://tsharok-api.fow-taa-2025.workers.dev/api/ratings?contentId=${currentContentId}`);

        if (response.data.success) {
            const data = response.data.data;

            // Update average rating
            document.getElementById('averageRating').textContent = data.averageRating.toFixed(1);
            document.getElementById('totalRatingsCount').textContent = `(${data.totalRatings} ratings)`;
            document.getElementById('totalReviews').textContent = `Based on ${data.totalRatings} reviews`;

            // Update star display
            displayStars('averageStars', data.averageRating);

            // Update distribution
            updateRatingDistribution(data.distribution);
        }
    } catch (error) {
        console.error('Error loading ratings:', error);
        showToast('Failed to load ratings', 'error');
    } finally {
        hideLoader('ratingsLoader');
    }
}

/**
 * Update rating distribution bars
 */
function updateRatingDistribution(distribution) {
    const total = distribution.reduce((sum, item) => sum + item.count, 0);

    distribution.forEach((item, index) => {
        const rating = 5 - index; // 5 stars to 1 star
        const percentage = total > 0 ? (item.count / total * 100) : 0;

        const element = document.getElementById(`rating${rating}`);
        if (element) {
            const bar = element.querySelector('.rating-bar-fill');
            const count = element.querySelector('.text-right');

            bar.style.width = `${percentage}%`;
            count.textContent = item.count;
        }
    });
}

/**
 * Display stars based on rating
 */
function displayStars(elementId, rating) {
    const container = document.getElementById(elementId);
    if (!container) return;

    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    let html = '';

    // Full stars
    for (let i = 0; i < fullStars; i++) {
        html += '<i class="fas fa-star text-yellow-400"></i>';
    }

    // Half star
    if (hasHalfStar) {
        html += '<i class="fas fa-star-half-alt text-yellow-400"></i>';
    }

    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
        html += '<i class="far fa-star text-yellow-400"></i>';
    }

    container.innerHTML = html;
}

/**
 * Load reviews
 */
async function loadReviews(reset = false) {
    if (isLoading) return;

    try {
        isLoading = true;
        if (reset) currentPage = 1;

        showLoader('reviewsLoader');

        const userId = sessionStorage.getItem('userId') || '0';
        const response = await axios.get('https://tsharok-api.fow-taa-2025.workers.dev/api/comments', {
            params: {
                contentId: currentContentId,
                userId: userId,
                page: currentPage,
                limit: 10
            }
        });

        if (response.data.success) {
            const comments = response.data.data.comments;
            const hasMore = response.data.data.hasMore;

            if (reset) {
                displayReviews(comments);
            } else {
                appendReviews(comments);
            }

            // Show/hide load more button
            const loadMoreBtn = document.getElementById('loadMoreReviews');
            if (loadMoreBtn) {
                loadMoreBtn.style.display = hasMore ? 'block' : 'none';
            }
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
        showToast(error.response?.data?.message || 'Failed to load reviews', 'error');
    } finally {
        isLoading = false;
        hideLoader('reviewsLoader');
    }
}

/**
 * Display reviews
 */
function displayReviews(reviews) {
    const container = document.getElementById('reviewsList');
    if (!container) return;

    if (reviews.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-comments text-gray-300 text-6xl mb-4"></i>
                <p class="text-gray-600">No reviews yet. Be the first to review!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = reviews.map(review => createReviewCard(review)).join('');

    // Setup action buttons
    setupReviewActions();
}

/**
 * Append reviews
 */
function appendReviews(reviews) {
    const container = document.getElementById('reviewsList');
    if (!container) return;

    const fragment = document.createDocumentFragment();
    reviews.forEach(review => {
        const div = document.createElement('div');
        div.innerHTML = createReviewCard(review);
        fragment.appendChild(div.firstChild);
    });

    container.appendChild(fragment);
    setupReviewActions();
}

/**
 * Create review card HTML
 */
function createReviewCard(review) {
    const starsHtml = Array(5).fill(0).map((_, i) => {
        return i < review.rating
            ? '<i class="fas fa-star text-yellow-400"></i>'
            : '<i class="far fa-star text-gray-300"></i>';
    }).join('');

    const isOwnReview = review.isOwnReview || false;

    return `
        <div class="comment-card border-b pb-6" data-review-id="${review.id}">
            <div class="flex items-start gap-4">
                <!-- Avatar -->
                <img 
                    src="${review.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.userName)}&background=4F46E5&color=fff`}" 
                    alt="${review.userName}"
                    class="w-12 h-12 rounded-full"
                >
                
                <div class="flex-1">
                    <!-- Header -->
                    <div class="flex items-start justify-between mb-2">
                        <div>
                            <h4 class="font-semibold text-gray-900">${escapeHtml(review.userName)}</h4>
                            <div class="flex items-center gap-2 mt-1">
                                <div class="flex gap-1">
                                    ${starsHtml}
                                </div>
                                <span class="text-sm text-gray-500">•</span>
                                <span class="text-sm text-gray-500">${formatTimeAgo(review.createdAt)}</span>
                            </div>
                        </div>
                        
                        <!-- Actions -->
                        ${isOwnReview ? `
                            <div class="comment-actions flex gap-2">
                                <button class="edit-review text-indigo-600 hover:text-indigo-700 text-sm" data-id="${review.id}">
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                                <button class="delete-review text-red-600 hover:text-red-700 text-sm" data-id="${review.id}">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </div>
                        ` : ''}
                    </div>
                    
                    <!-- Title -->
                    ${review.title ? `<h5 class="font-semibold text-gray-900 mb-2">${escapeHtml(review.title)}</h5>` : ''}
                    
                    <!-- Content (Rendered HTML from Markdown) -->
                    <div class="text-gray-700 mb-3 prose prose-sm max-w-none">${review.comment}</div>
                    
                    <!-- Recommendation -->
                    ${review.wouldRecommend ? `
                        <div class="inline-flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm mb-3">
                            <i class="fas fa-thumbs-up"></i>
                            <span>Recommends this course</span>
                        </div>
                    ` : ''}
                    
                    <!-- Footer Actions -->
                    <div class="flex items-center gap-4 text-sm">
                        <button class="helpful-btn flex items-center gap-1 text-gray-600 hover:text-indigo-600 transition" data-id="${review.id}">
                            <i class="far fa-thumbs-up"></i>
                            <span>Helpful (${review.helpfulCount || 0})</span>
                        </button>
                        <button class="reply-btn text-gray-600 hover:text-indigo-600 transition" data-id="${review.id}">
                            <i class="far fa-comment"></i>
                            Reply
                        </button>
                    </div>
                    
                    <!-- Reply Section (hidden by default) -->
                    <div class="reply-section hidden mt-4 pl-4 border-l-2 border-gray-200">
                        <textarea 
                            class="reply-input w-full px-3 py-2 border rounded-lg text-sm resize-none"
                            rows="2"
                            placeholder="Write a reply..."
                        ></textarea>
                        <div class="flex gap-2 mt-2">
                            <button class="submit-reply bg-indigo-600 text-white px-4 py-1 rounded text-sm hover:bg-indigo-700">
                                Reply
                            </button>
                            <button class="cancel-reply text-gray-600 px-4 py-1 rounded text-sm hover:bg-gray-100">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Setup review action buttons
 */
function setupReviewActions() {
    // Helpful buttons
    document.querySelectorAll('.helpful-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            markAsHelpful(this.dataset.id);
        });
    });

    // Reply buttons
    document.querySelectorAll('.reply-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            toggleReplySection(this.dataset.id);
        });
    });

    // Cancel reply
    document.querySelectorAll('.cancel-reply').forEach(btn => {
        btn.addEventListener('click', function () {
            const replySection = this.closest('.reply-section');
            replySection.classList.add('hidden');
        });
    });

    // Submit reply
    document.querySelectorAll('.submit-reply').forEach(btn => {
        btn.addEventListener('click', function () {
            const reviewId = this.closest('[data-review-id]').dataset.reviewId;
            const input = this.closest('.reply-section').querySelector('.reply-input');
            submitReply(reviewId, input.value);
        });
    });

    // Edit review
    document.querySelectorAll('.edit-review').forEach(btn => {
        btn.addEventListener('click', function () {
            editReview(this.dataset.id);
        });
    });

    // Delete review
    document.querySelectorAll('.delete-review').forEach(btn => {
        btn.addEventListener('click', function () {
            deleteReview(this.dataset.id);
        });
    });
}

/**
 * Toggle reply section
 */
function toggleReplySection(reviewId) {
    const card = document.querySelector(`[data-review-id="${reviewId}"]`);
    const replySection = card.querySelector('.reply-section');
    replySection.classList.toggle('hidden');
}

/**
 * Mark review as helpful
 */
async function markAsHelpful(reviewId) {
    try {
        const btn = document.querySelector(`.helpful-btn[data-id="${reviewId}"]`);
        const icon = btn.querySelector('i');

        // Optimistic UI update
        icon.classList.remove('far');
        icon.classList.add('fas', 'text-indigo-600');
        btn.disabled = true;

        const response = await axios.post('https://tsharok-api.fow-taa-2025.workers.dev/api/comments/like', {
            commentId: reviewId
        }, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('userId')}`
            }
        });

        if (response.data.success) {
            // Update count with animation
            const span = btn.querySelector('span');
            if (span) {
                const currentCount = parseInt(span.textContent.match(/\d+/)[0]);
                span.textContent = `Helpful (${currentCount + 1})`;
                span.classList.add('font-semibold');
            }
            showToast('Thanks for your feedback! 👍', 'success');
        }
    } catch (error) {
        console.error('Error marking as helpful:', error);

        // Revert UI on error
        const btn = document.querySelector(`.helpful-btn[data-id="${reviewId}"]`);
        const icon = btn.querySelector('i');
        icon.classList.remove('fas', 'text-indigo-600');
        icon.classList.add('far');
        btn.disabled = false;

        const errorMsg = error.response?.data?.message || 'Failed to mark as helpful';
        showToast(errorMsg, 'error');
    }
}

/**
 * Submit reply
 */
async function submitReply(reviewId, content) {
    if (!content.trim()) {
        showToast('Please write a reply', 'error');
        return;
    }

    try {
        const response = await axios.post('https://tsharok-api.fow-taa-2025.workers.dev/api/comments/reply', {
            commentId: reviewId,
            text: content
        }, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('userId')}`
            }
        });

        if (response.data.success) {
            showToast('Reply posted successfully', 'success');
            // Reload reviews
            loadReviews(true);
        }
    } catch (error) {
        console.error('Error posting reply:', error);
        showToast('Failed to post reply', 'error');
    }
}

/**
 * Edit review
 */
async function editReview(reviewId) {
    try {
        const response = await axios.get(`/api/get-review.php?id=${reviewId}`);

        if (response.data.success) {
            const review = response.data.data;

            // Populate modal with existing data
            document.getElementById('ratingValue').value = review.rating;
            document.getElementById('reviewTitle').value = review.title || '';
            document.getElementById('reviewContent').value = review.comment;
            document.getElementById('wouldRecommend').checked = review.wouldRecommend;

            highlightStars(review.rating, true);
            updateRatingText(review.rating);
            updateCharCount();

            // Change form to edit mode
            document.getElementById('reviewForm').dataset.editId = reviewId;

            openRatingModal();
        }
    } catch (error) {
        console.error('Error loading review:', error);
        showToast('Failed to load review', 'error');
    }
}

/**
 * Delete review
 */
async function deleteReview(reviewId) {
    if (!confirm('⚠️ Are you sure you want to delete this review?\n\nThis action cannot be undone.')) {
        return;
    }

    try {
        // Optimistic UI - fade out review
        const reviewCard = document.querySelector(`[data-review-id="${reviewId}"]`);
        if (reviewCard) {
            reviewCard.style.opacity = '0.5';
            reviewCard.style.pointerEvents = 'none';
        }

        const response = await axios.delete('/api/delete-review.php', {
            data: {
                reviewId: reviewId,
                courseId: currentCourseId
            }
        });

        if (response.data.success) {
            showToast('Review deleted successfully 🗑️', 'success');

            // Remove from DOM with animation
            if (reviewCard) {
                reviewCard.style.transition = 'all 0.3s ease';
                reviewCard.style.transform = 'translateX(-100%)';
                setTimeout(() => {
                    reviewCard.remove();
                }, 300);
            }

            // Reload data
            await Promise.all([
                loadReviews(true),
                loadRatings()
            ]);
        }
    } catch (error) {
        console.error('Error deleting review:', error);

        // Revert UI on error
        const reviewCard = document.querySelector(`[data-review-id="${reviewId}"]`);
        if (reviewCard) {
            reviewCard.style.opacity = '1';
            reviewCard.style.pointerEvents = 'auto';
        }

        const errorMsg = error.response?.data?.message || 'Failed to delete review';
        showToast(errorMsg, 'error');
    }
}

/**
 * Open rating modal
 */
function openRatingModal() {
    document.getElementById('ratingModal').classList.remove('hidden');
    document.getElementById('ratingModal').classList.add('flex');
}

/**
 * Close rating modal
 */
function closeRatingModal() {
    document.getElementById('ratingModal').classList.add('hidden');
    document.getElementById('ratingModal').classList.remove('flex');
    document.getElementById('reviewForm').reset();
    delete document.getElementById('reviewForm').dataset.editId;
    resetStars();
    updateRatingText(0);
}

/**
 * Submit review
 */
async function submitReview(e) {
    e.preventDefault();

    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const editId = form.dataset.editId;
    const formData = new FormData(form);

    const data = {
        userId: sessionStorage.getItem('userId'),
        contentId: currentContentId,
        score: parseInt(formData.get('rating')),
        content: formData.get('comment')
    };

    if (!data.userId) {
        showToast('Please login to submit a review', 'error');
        return;
    }


    if (!data.score) {
        showToast('Please select a rating', 'error');
        return;
    }


    if (!data.content || data.content.trim().length < 10) {
        showToast('Comment must be at least 10 characters', 'error');
        return;
    }

    try {
        // Disable submit button
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Submitting...';

        const endpoint = editId ? '/api/update-review.php' : 'https://tsharok-api.fow-taa-2025.workers.dev/api/comments/add';
        const method = editId ? 'put' : 'post';

        if (editId) {
            data.reviewId = editId;
        }

        const response = await axios[method](endpoint, data);

        if (response.data.success) {
            showToast(editId ? 'Review updated successfully! 🎉' : 'Review posted successfully! 🎉', 'success');
            closeRatingModal();

            // Reload data without page refresh
            await Promise.all([
                loadReviews(true),
                loadRatings()
            ]);
        } else {
            showToast(response.data.message || 'Failed to submit review', 'error');
        }
    } catch (error) {
        console.error('Error submitting review:', error);
        const errorMsg = error.response?.data?.message || 'Failed to submit review. Please try again.';
        showToast(errorMsg, 'error');
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>' + (editId ? 'Update Review' : 'Post Review');
    }
}

/**
 * Handle filter change
 */
function handleFilterChange(e) {
    currentFilter = e.target.value;
    loadReviews(true);
}

/**
 * Handle sort change
 */
function handleSortChange(e) {
    currentSort = e.target.value;
    loadReviews(true);
}

/**
 * Load more reviews
 */
function loadMoreReviews() {
    currentPage++;
    loadReviews(false);
}

/**
 * Show toast notification
 */
function showToast(message, type = 'success') {
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

    toast.style.transform = 'translateY(0)';

    setTimeout(() => {
        toast.style.transform = 'translateY(8rem)';
    }, 3000);
}

/**
 * Utility functions
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Format date using Moment.js
 */
function formatDate(dateString) {
    if (typeof moment !== 'undefined' && dateString) {
        return moment(dateString).format('MMM D, YYYY');
    }
    // Fallback
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Format time ago using Moment.js
 */
function formatTimeAgo(dateString) {
    if (typeof moment !== 'undefined' && dateString) {
        return moment(dateString).fromNow();
    }
    // Fallback
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
        }
    }

    return 'just now';
}

/**
 * Format date with time using Moment.js
 */
function formatDateTime(dateString) {
    if (typeof moment !== 'undefined' && dateString) {
        return moment(dateString).format('MMM D, YYYY [at] h:mm A');
    }
    // Fallback
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

/**
 * Show loader
 */
function showLoader(loaderId) {
    const loader = document.getElementById(loaderId);
    if (loader) {
        loader.classList.remove('hidden');
    }
}

/**
 * Hide loader
 */
function hideLoader(loaderId) {
    const loader = document.getElementById(loaderId);
    if (loader) {
        loader.classList.add('hidden');
    }
}

