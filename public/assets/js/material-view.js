/**
 * Material View Page Handler
 */

document.addEventListener('DOMContentLoaded', function() {
    // Get content ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const contentId = urlParams.get('id');

    if (contentId) {
        loadContentDetails(contentId);
    }

    // Bookmark functionality
    const bookmarkBtn = document.getElementById('bookmarkBtn');
    let isBookmarked = false;

    if (bookmarkBtn) {
        // Check if already bookmarked
        const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
        if (bookmarks.includes(contentId)) {
            isBookmarked = true;
            bookmarkBtn.classList.remove('text-gray-400');
            bookmarkBtn.classList.add('text-yellow-500');
            bookmarkBtn.querySelector('i').classList.remove('far');
            bookmarkBtn.querySelector('i').classList.add('fas');
        }

        bookmarkBtn.addEventListener('click', function() {
            isBookmarked = !isBookmarked;
            const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
            
            if (isBookmarked) {
                this.classList.remove('text-gray-400');
                this.classList.add('text-yellow-500');
                this.querySelector('i').classList.remove('far');
                this.querySelector('i').classList.add('fas');
                
                if (!bookmarks.includes(contentId)) {
                    bookmarks.push(contentId);
                }
                showToast('Added to bookmarks', 'success');
            } else {
                this.classList.remove('text-yellow-500');
                this.classList.add('text-gray-400');
                this.querySelector('i').classList.remove('fas');
                this.querySelector('i').classList.add('far');
                
                const index = bookmarks.indexOf(contentId);
                if (index > -1) {
                    bookmarks.splice(index, 1);
                }
                showToast('Removed from bookmarks', 'info');
            }
            
            localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
        });
    }

    // Rating modal
    const ratingModal = document.getElementById('ratingModal');
    const rateBtn = document.getElementById('rateBtn');
    const cancelRating = document.getElementById('cancelRating');
    const submitRating = document.getElementById('submitRating');
    const ratingStars = document.querySelectorAll('.rating-star');
    let selectedRating = 0;

    if (rateBtn) {
        rateBtn.addEventListener('click', function() {
            ratingModal.classList.remove('hidden');
        });
    }

    if (cancelRating) {
        cancelRating.addEventListener('click', function() {
            ratingModal.classList.add('hidden');
            resetRating();
        });
    }

    ratingStars.forEach(star => {
        star.addEventListener('click', function() {
            selectedRating = parseInt(this.dataset.rating);
            updateStars();
        });

        star.addEventListener('mouseenter', function() {
            const rating = parseInt(this.dataset.rating);
            highlightStars(rating);
        });
    });

    const ratingStarsContainer = document.getElementById('ratingStars');
    if (ratingStarsContainer) {
        ratingStarsContainer.addEventListener('mouseleave', function() {
            updateStars();
        });
    }

    function highlightStars(rating) {
        ratingStars.forEach((star, index) => {
            if (index < rating) {
                star.classList.remove('text-gray-300');
                star.classList.add('text-yellow-500');
            } else {
                star.classList.remove('text-yellow-500');
                star.classList.add('text-gray-300');
            }
        });
    }

    function updateStars() {
        highlightStars(selectedRating);
    }

    function resetRating() {
        selectedRating = 0;
        updateStars();
        const feedbackField = document.getElementById('ratingFeedback');
        if (feedbackField) {
            feedbackField.value = '';
        }
    }

    if (submitRating) {
        submitRating.addEventListener('click', async function() {
            if (selectedRating === 0) {
                showToast('Please select a rating', 'error');
                return;
            }
            
            const feedback = document.getElementById('ratingFeedback');
            const comment = feedback ? feedback.value : '';
            
            try {
                const response = await fetch('../api/content-interactions.php?action=rate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        content_id: contentId,
                        rating: selectedRating,
                        comment: comment
                    })
                });

                const result = await response.json();

                if (result.success) {
                    showToast(`Thank you for rating (${selectedRating} stars)!`, 'success');
                    ratingModal.classList.add('hidden');
                    resetRating();
                    
                    // Update rating display
                    if (result.data) {
                        updateRatingDisplay(result.data);
                    }
                } else {
                    showToast(result.message || 'Failed to submit rating', 'error');
                }
            } catch (error) {
                console.error('Rating error:', error);
                showToast('An error occurred while submitting rating', 'error');
            }
        });
    }

    // Comment functionality
    const commentInput = document.getElementById('commentInput');
    const postCommentBtn = document.querySelector('button:has(.fa-paper-plane)');

    if (postCommentBtn) {
        postCommentBtn.addEventListener('click', async function() {
            const comment = commentInput ? commentInput.value.trim() : '';
            
            if (!comment) {
                showToast('Please enter a comment', 'error');
                return;
            }

            try {
                const response = await fetch('../api/content-interactions.php?action=comment', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        content_id: contentId,
                        comment: comment
                    })
                });

                const result = await response.json();

                if (result.success) {
                    showToast('Comment posted successfully!', 'success');
                    if (commentInput) commentInput.value = '';
                    
                    // Reload comments
                    loadComments(contentId);
                } else {
                    showToast(result.message || 'Failed to post comment', 'error');
                }
            } catch (error) {
                console.error('Comment error:', error);
                showToast('An error occurred while posting comment', 'error');
            }
        });
    }

    // Download functionality
    const downloadBtns = document.querySelectorAll('button:has(.fa-download)');
    downloadBtns.forEach(btn => {
        btn.addEventListener('click', async function() {
            try {
                const response = await fetch('../api/content-interactions.php?action=download', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        content_id: contentId
                    })
                });

                const result = await response.json();

                if (result.success) {
                    showToast('Downloading...', 'success');
                    
                    // Trigger download
                    if (result.data && result.data.file_url) {
                        const link = document.createElement('a');
                        link.href = result.data.file_url;
                        link.download = result.data.filename || 'download';
                        link.click();
                    }
                } else {
                    showToast(result.message || 'Download failed', 'error');
                }
            } catch (error) {
                console.error('Download error:', error);
                showToast('An error occurred during download', 'error');
            }
        });
    });

    // Mark as complete functionality
    const markCompleteBtn = document.querySelector('button:has(.fa-check-circle)');
    if (markCompleteBtn) {
        markCompleteBtn.addEventListener('click', function() {
            const completed = JSON.parse(localStorage.getItem('completedContent') || '[]');
            
            if (!completed.includes(contentId)) {
                completed.push(contentId);
                localStorage.setItem('completedContent', JSON.stringify(completed));
                
                this.innerHTML = '<i class="fas fa-check-circle mr-2"></i>Completed';
                this.classList.remove('bg-primary', 'hover:bg-indigo-700');
                this.classList.add('bg-green-500', 'hover:bg-green-600');
                
                showToast('Marked as complete!', 'success');
            }
        });
    }

    // Load content details
    async function loadContentDetails(contentId) {
        try {
            const response = await fetch(`../api/content-upload.php?content_id=${contentId}`);
            const result = await response.json();

            if (result.success && result.data) {
                updateContentDisplay(result.data);
                loadComments(contentId);
            }
        } catch (error) {
            console.error('Error loading content:', error);
        }
    }

    // Update content display
    function updateContentDisplay(content) {
        // Update title
        const titleEl = document.querySelector('h1');
        if (titleEl) titleEl.textContent = content.title;

        // Update description
        const descEl = document.querySelector('h1 + p');
        if (descEl) descEl.textContent = content.description;

        // Update stats
        const viewsEl = document.querySelector('.fa-eye').parentElement;
        if (viewsEl) viewsEl.innerHTML = `<i class="fas fa-eye mr-1"></i>${content.views || 0} views`;

        const downloadsEl = document.querySelector('.fa-download').parentElement;
        if (downloadsEl) downloadsEl.innerHTML = `<i class="fas fa-download mr-1"></i>${content.download_count || 0} downloads`;

        // Update rating
        if (content.avg_rating) {
            updateRatingDisplay({
                avg_rating: content.avg_rating,
                rating_count: content.rating_count
            });
        }
    }

    // Update rating display
    function updateRatingDisplay(data) {
        const ratingEl = document.querySelector('.font-semibold.text-gray-900');
        if (ratingEl) ratingEl.textContent = data.avg_rating;

        const countEl = document.querySelector('.text-gray-600');
        if (countEl) countEl.textContent = `(${data.rating_count} ratings)`;
    }

    // Load comments
    async function loadComments(contentId) {
        try {
            const response = await fetch(`../api/content-interactions.php?action=comment&content_id=${contentId}`);
            const result = await response.json();

            if (result.success && result.data) {
                renderComments(result.data);
            }
        } catch (error) {
            console.error('Error loading comments:', error);
        }
    }

    // Render comments
    function renderComments(comments) {
        const commentsContainer = document.querySelector('.space-y-4');
        if (!commentsContainer) return;

        // Clear existing comments (keep only the first child which is the comment input area)
        while (commentsContainer.children.length > 0) {
            commentsContainer.removeChild(commentsContainer.lastChild);
        }

        comments.forEach(comment => {
            const commentEl = createCommentElement(comment);
            commentsContainer.appendChild(commentEl);
        });
    }

    // Create comment element
    function createCommentElement(comment) {
        const div = document.createElement('div');
        div.className = 'comment-item p-4 rounded-lg transition';
        
        const timeAgo = getTimeAgo(new Date(comment.comment_date));
        
        div.innerHTML = `
            <div class="flex gap-3">
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(comment.name)}&background=random&color=fff&size=40" 
                     alt="User" class="w-10 h-10 rounded-full">
                <div class="flex-1">
                    <div class="flex items-center justify-between mb-2">
                        <div>
                            <span class="font-semibold text-gray-900">${escapeHtml(comment.name)}</span>
                            ${comment.user_type === 'instructor' ? '<span class="bg-primary text-white text-xs px-2 py-0.5 rounded ml-2">Instructor</span>' : ''}
                            <span class="text-sm text-gray-500 ml-2">${timeAgo}</span>
                        </div>
                    </div>
                    <p class="text-gray-700 mb-3">${escapeHtml(comment.comment_text)}</p>
                    <div class="flex items-center gap-4 text-sm">
                        <button class="text-gray-600 hover:text-primary flex items-center gap-1">
                            <i class="far fa-thumbs-up"></i>
                            <span>${comment.likes || 0}</span>
                        </button>
                        <button class="text-gray-600 hover:text-primary">
                            <i class="fas fa-reply mr-1"></i>Reply
                        </button>
                    </div>
                    ${comment.replies && comment.replies.length > 0 ? renderReplies(comment.replies) : ''}
                </div>
            </div>
        `;
        
        return div;
    }

    // Render replies
    function renderReplies(replies) {
        return replies.map(reply => {
            const timeAgo = getTimeAgo(new Date(reply.comment_date));
            return `
                <div class="mt-4 ml-8 p-4 bg-gray-50 rounded-lg">
                    <div class="flex gap-3">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(reply.name)}&background=random&color=fff&size=32" 
                             alt="User" class="w-8 h-8 rounded-full">
                        <div class="flex-1">
                            <div class="flex items-center gap-2 mb-2">
                                <span class="font-semibold text-gray-900">${escapeHtml(reply.name)}</span>
                                ${reply.user_type === 'instructor' ? '<span class="bg-primary text-white text-xs px-2 py-0.5 rounded">Instructor</span>' : ''}
                                <span class="text-sm text-gray-500">${timeAgo}</span>
                            </div>
                            <p class="text-gray-700 mb-2">${escapeHtml(reply.comment_text)}</p>
                            <button class="text-gray-600 hover:text-primary text-sm flex items-center gap-1">
                                <i class="far fa-thumbs-up"></i>
                                <span>${reply.likes || 0}</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Utility functions
    function getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        
        let interval = Math.floor(seconds / 31536000);
        if (interval > 1) return interval + ' years ago';
        if (interval === 1) return '1 year ago';
        
        interval = Math.floor(seconds / 2592000);
        if (interval > 1) return interval + ' months ago';
        if (interval === 1) return '1 month ago';
        
        interval = Math.floor(seconds / 86400);
        if (interval > 1) return interval + ' days ago';
        if (interval === 1) return '1 day ago';
        
        interval = Math.floor(seconds / 3600);
        if (interval > 1) return interval + ' hours ago';
        if (interval === 1) return '1 hour ago';
        
        interval = Math.floor(seconds / 60);
        if (interval > 1) return interval + ' minutes ago';
        if (interval === 1) return '1 minute ago';
        
        return 'just now';
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

    console.log('Material view page initialized');
});

