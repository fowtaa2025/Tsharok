// Comment Features Integration
// Add this script to file.html to enable database-backed likes and replies

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Comment features: Initializing...');

    // Override toggleLike to use API
    window.toggleLike = function(commentIndex) {
        console.log('toggleLike called for index:', commentIndex);
        
        const token = localStorage.getItem('token');
        if (!token) {
            showToast('Please login to like comments', 'error');
            return;
        }

        // Get comment ID from the DOM
        const commentElement = document.querySelector(`[data-comment-index="${commentIndex}"]`);
        if (!commentElement) {
            console.error('Comment element not found for index:', commentIndex);
            return;
        }

        const commentId = commentElement.dataset.commentId;
        console.log('Comment ID:', commentId);
        
        if (!commentId) {
            console.error('Comment ID not found in element');
            return;
        }

        // Call API to toggle like
        fetch('/api/comment-likes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ commentId: parseInt(commentId) })
        })
        .then(response => response.json())
        .then(result => {
            console.log('Like toggle result:', result);
            if (result.success) {
                // Reload comments to show updated likes
                loadComments();
                showToast(result.liked ? 'Liked!' : 'Unliked!', 'success');
            } else {
                throw new Error(result.error || 'Failed to toggle like');
            }
        })
        .catch(error => {
            console.error('Error toggling like:', error);
            showToast(error.message || 'Failed to toggle like', 'error');
        });
    if (!text) {
        showToast('Please enter a reply', 'error');
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        showToast('Please login to reply', 'error');
        return;
    }

    // Get comment ID from the DOM
    const commentElement = document.querySelector(`[data-comment-index="${commentIndex}"]`);
    if (!commentElement) {
        console.error('Comment element not found');
        return;
    }

    const commentId = commentElement.dataset.commentId;
    if (!commentId) {
        console.error('Comment ID not found');
        return;
    }

    // Call API to add reply
    fetch('/api/comment-replies', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            commentId: parseInt(commentId),
            text: text
        })
    })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                // Clear input and hide form
                replyInput.value = '';
                toggleReplyForm(commentIndex);

                // Reload comments to show the new reply
                loadComments();

                showToast('Reply added!', 'success');
            } else {
                throw new Error(result.error || 'Failed to add reply');
            }
        })
        .catch(error => {
            console.error('Error adding reply:', error);
            showToast(error.message || 'Failed to add reply', 'error');
        });
};

// Override getCommentHTML to include comment ID
window.getCommentHTML = function (comment, index) {
    const starsHTML = Array(5).fill(0).map((_, i) =>
        `<i class="${i < (comment.rating || 0) ? 'fas' : 'far'} fa-star text-xs"></i>`
    ).join('');

    const initials = (comment.author || 'S').charAt(0).toUpperCase();
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500'];
    const randomColor = colors[Math.abs(comment.author?.charCodeAt(0) || 0) % colors.length];
    const likes = comment.likes || 0;
    const isLiked = comment.likedByMe ? 'fas text-red-500' : 'far text-gray-400';

    // Ensure replies array exists
    const replies = comment.replies || [];
    const replyCount = replies.length;

    // Generate replies HTML
    let repliesHTML = '';
    if (replyCount > 0) {
        repliesHTML = replies.map((reply, replyIndex) => getReplyHTML(reply, index, replyIndex)).join('');
    }

    return `
    <div class="bg-gray-50 rounded-xl p-4" data-comment-index="${index}" data-comment-id="${comment.id || ''}">
        <div class="flex items-start gap-3">
            <div class="w-8 h-8 ${randomColor} rounded-full flex items-center justify-center flex-shrink-0">
                <span class="text-white text-sm font-bold">${initials}</span>
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-semibold text-gray-800 text-sm">${comment.author || 'Student'}</span>
                    <div class="flex text-yellow-400">${starsHTML}</div>
                    <span class="text-gray-400 text-xs">${comment.date || 'Just now'}</span>
                </div>
                <p class="text-gray-600 text-sm mt-1">${comment.text}</p>
                <div class="flex items-center gap-3 mt-2">
                    <button onclick="toggleLike(${index})" class="flex items-center gap-1 text-sm hover:scale-110 transition">
                        <i class="${isLiked} fa-heart"></i>
                        <span class="text-gray-500">${likes}</span>
                    </button>
                    <button onclick="toggleReplyForm(${index})" class="flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition">
                        <i class="far fa-comment"></i>
                        <span>Reply</span>
                    </button>
                </div>
                
                <!-- Reply Input Form (Hidden by default) -->
                <div id="replyForm-${index}" class="hidden mt-3 pl-4 border-l-2 border-gray-300">
                    <div class="flex items-start gap-2">
                        <textarea id="replyInput-${index}" placeholder="Write a reply..." class="flex-1 p-2 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm" rows="2"></textarea>
                    </div>
                    <div class="flex justify-end gap-2 mt-2">
                        <button onclick="toggleReplyForm(${index})" class="px-3 py-1 text-gray-600 hover:text-gray-800 text-sm">
                            Cancel
                        </button>
                        <button onclick="addReply(${index})" class="bg-primary text-white px-3 py-1 rounded-lg hover:bg-primary-dark text-sm transition">
                            <i class="fas fa-paper-plane mr-1"></i>Reply
                        </button>
                    </div>
                </div>
                
                <!-- Replies Section -->
                ${replyCount > 0 ? `
                    <div class="mt-3">
                        <button onclick="toggleReplies(${index})" class="flex items-center gap-1 text-sm text-primary hover:text-primary-dark font-medium transition">
                            <i id="replyToggleIcon-${index}" class="fas fa-chevron-down text-xs"></i>
                            <span id="replyToggleText-${index}">View ${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}</span>
                        </button>
                        <div id="repliesContainer-${index}" class="hidden mt-2 pl-4 border-l-2 border-gray-300 space-y-2">
                            ${repliesHTML}
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
    </div>
`;
};

console.log('Comment features integration loaded');
