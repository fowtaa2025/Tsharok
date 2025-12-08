/**
 * Moderation Panel JavaScript
 * Handles content moderation functionality
 * Tsharok LMS
 */

// Global state
let currentPage = 1;
let currentFilters = {
    status: 'pending',
    type: 'all',
    search: '',
    sort: 'newest'
};
let selectedContentIds = new Set();
let currentPreviewId = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    await checkAdminAuth();
    await loadStatistics();
    await loadContent();
    setupEventListeners();
    setupUserMenu();
});

/**
 * Check if user is authenticated as admin
 */
async function checkAdminAuth() {
    try {
        const response = await axios.get('/api/check-auth.php');
        if (!response.data.success || response.data.user.role !== 'admin') {
            window.location.href = '/admin-login.html';
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/admin-login.html';
    }
}

/**
 * Load moderation statistics
 */
async function loadStatistics() {
    try {
        const response = await axios.get('/api/moderation-stats.php');
        if (response.data.success) {
            const stats = response.data.data.stats;
            document.getElementById('pendingCount').textContent = stats.pending;
            document.getElementById('approvedCount').textContent = stats.approved;
            document.getElementById('rejectedCount').textContent = stats.rejected;
        }
    } catch (error) {
        console.error('Failed to load statistics:', error);
    }
}

/**
 * Load content based on filters
 */
async function loadContent() {
    showLoading(true);
    hideEmptyState();
    
    try {
        const params = new URLSearchParams({
            status: currentFilters.status,
            type: currentFilters.type,
            search: currentFilters.search,
            sort: currentFilters.sort,
            page: currentPage,
            limit: 20
        });
        
        const response = await axios.get(`/api/get-pending-content.php?${params}`);
        
        if (response.data.success) {
            const content = response.data.data.content;
            const pagination = response.data.data.pagination;
            
            if (content.length === 0) {
                showEmptyState();
            } else {
                renderContent(content);
                renderPagination(pagination);
            }
        }
    } catch (error) {
        console.error('Failed to load content:', error);
        showToast('Failed to load content', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Render content items
 */
function renderContent(content) {
    const grid = document.getElementById('filesGrid');
    grid.innerHTML = '';
    
    content.forEach(item => {
        const card = createContentCard(item);
        grid.appendChild(card);
    });
}

/**
 * Create content card element
 */
function createContentCard(item) {
    const card = document.createElement('div');
    card.className = 'file-card bg-white rounded-lg shadow-md p-6 border border-gray-200';
    
    const statusColor = item.status === 'approved' ? 'green' : 
                       item.status === 'rejected' ? 'red' : 'yellow';
    const statusIcon = item.status === 'approved' ? 'check' : 
                      item.status === 'rejected' ? 'times' : 'clock';
    
    const typeIcon = getTypeIcon(item.type);
    
    card.innerHTML = `
        <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                    <input 
                        type="checkbox" 
                        class="w-4 h-4 text-indigo-600 rounded content-checkbox"
                        data-content-id="${item.id}"
                        ${selectedContentIds.has(item.id) ? 'checked' : ''}
                        onchange="toggleContentSelection(${item.id})"
                    >
                    <i class="fas fa-${typeIcon} text-gray-400"></i>
                    <span class="text-xs text-gray-500 uppercase">${item.type}</span>
                </div>
                <h3 class="font-semibold text-gray-900 mb-2 line-clamp-2">${escapeHtml(item.title)}</h3>
            </div>
            <span class="status-badge px-3 py-1 rounded-full text-xs font-semibold bg-${statusColor}-100 text-${statusColor}-700">
                <i class="fas fa-${statusIcon} mr-1"></i>${item.status}
            </span>
        </div>
        
        <p class="text-sm text-gray-600 mb-4 line-clamp-2">${escapeHtml(item.description || 'No description')}</p>
        
        <div class="space-y-2 mb-4 text-xs text-gray-600">
            <div class="flex items-center gap-2">
                <i class="fas fa-book w-4"></i>
                <span>${escapeHtml(item.course.title)}</span>
            </div>
            <div class="flex items-center gap-2">
                <i class="fas fa-user w-4"></i>
                <span>${escapeHtml(item.uploader.fullName)}</span>
            </div>
            <div class="flex items-center gap-2">
                <i class="fas fa-calendar w-4"></i>
                <span>${item.uploadDateFormatted}</span>
            </div>
            <div class="flex items-center gap-2">
                <i class="fas fa-file w-4"></i>
                <span>${item.fileSizeFormatted}</span>
            </div>
        </div>
        
        <div class="flex gap-2">
            <button 
                onclick="viewContent(${item.id})"
                class="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
                <i class="fas fa-eye mr-1"></i>View
            </button>
            ${item.status === 'pending' ? `
                <button 
                    onclick="quickApprove(${item.id})"
                    class="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    title="Quick Approve"
                >
                    <i class="fas fa-check"></i>
                </button>
                <button 
                    onclick="quickReject(${item.id})"
                    class="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    title="Quick Reject"
                >
                    <i class="fas fa-times"></i>
                </button>
            ` : ''}
        </div>
    `;
    
    return card;
}

/**
 * Get icon for content type
 */
function getTypeIcon(type) {
    const icons = {
        'lecture': 'chalkboard-teacher',
        'assignment': 'tasks',
        'video': 'video',
        'document': 'file-alt',
        'quiz': 'question-circle',
        'other': 'file'
    };
    return icons[type] || 'file';
}

/**
 * Toggle content selection
 */
function toggleContentSelection(contentId) {
    if (selectedContentIds.has(contentId)) {
        selectedContentIds.delete(contentId);
    } else {
        selectedContentIds.add(contentId);
    }
    updateBulkActions();
}

/**
 * Update bulk action buttons
 */
function updateBulkActions() {
    const count = selectedContentIds.size;
    const bulkApprove = document.getElementById('bulkApprove');
    const bulkReject = document.getElementById('bulkReject');
    
    bulkApprove.disabled = count === 0;
    bulkReject.disabled = count === 0;
}

/**
 * View content details
 */
async function viewContent(contentId) {
    currentPreviewId = contentId;
    // Show preview modal with content details
    // Implementation depends on your preview modal structure
    document.getElementById('previewModal').classList.remove('hidden');
}

/**
 * Close preview modal
 */
function closePreview() {
    document.getElementById('previewModal').classList.add('hidden');
    currentPreviewId = null;
}

/**
 * Quick approve content
 */
async function quickApprove(contentId) {
    if (!confirm('Are you sure you want to approve this content?')) {
        return;
    }
    
    try {
        const response = await axios.post('/api/approve-content.php', {
            contentId: contentId
        });
        
        if (response.data.success) {
            showToast('Content approved successfully', 'success');
            await loadStatistics();
            await loadContent();
        } else {
            showToast(response.data.message || 'Failed to approve content', 'error');
        }
    } catch (error) {
        console.error('Approval failed:', error);
        showToast('Failed to approve content', 'error');
    }
}

/**
 * Quick reject content
 */
function quickReject(contentId) {
    currentPreviewId = contentId;
    document.getElementById('rejectModal').classList.remove('hidden');
}

/**
 * Approve file (from preview modal)
 */
async function approveFile() {
    if (!currentPreviewId) return;
    await quickApprove(currentPreviewId);
    closePreview();
}

/**
 * Reject file (from preview modal)
 */
function rejectFile() {
    if (!currentPreviewId) return;
    document.getElementById('rejectModal').classList.remove('hidden');
}

/**
 * Close reject modal
 */
function closeRejectModal() {
    document.getElementById('rejectModal').classList.add('hidden');
}

/**
 * Confirm rejection
 */
async function confirmReject() {
    const reason = document.getElementById('rejectionReason').value;
    const comments = document.getElementById('rejectionComments').value;
    
    if (!reason) {
        showToast('Please select a rejection reason', 'error');
        return;
    }
    
    try {
        const response = await axios.post('/api/reject-content.php', {
            contentId: currentPreviewId,
            reason: reason,
            comments: comments
        });
        
        if (response.data.success) {
            showToast('Content rejected successfully', 'success');
            closeRejectModal();
            closePreview();
            await loadStatistics();
            await loadContent();
            
            // Reset form
            document.getElementById('rejectionReason').value = '';
            document.getElementById('rejectionComments').value = '';
        } else {
            showToast(response.data.message || 'Failed to reject content', 'error');
        }
    } catch (error) {
        console.error('Rejection failed:', error);
        showToast('Failed to reject content', 'error');
    }
}

/**
 * Bulk approve
 */
async function bulkApprove() {
    if (selectedContentIds.size === 0) return;
    
    if (!confirm(`Are you sure you want to approve ${selectedContentIds.size} content item(s)?`)) {
        return;
    }
    
    try {
        const response = await axios.post('/api/approve-content.php', {
            contentIds: Array.from(selectedContentIds)
        });
        
        if (response.data.success) {
            showToast(`Successfully approved ${response.data.data.successCount} item(s)`, 'success');
            selectedContentIds.clear();
            updateBulkActions();
            await loadStatistics();
            await loadContent();
        }
    } catch (error) {
        console.error('Bulk approval failed:', error);
        showToast('Failed to approve content', 'error');
    }
}

/**
 * Bulk reject
 */
function bulkReject() {
    if (selectedContentIds.size === 0) return;
    currentPreviewId = null; // Bulk operation
    document.getElementById('rejectModal').classList.remove('hidden');
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Filter listeners
    document.getElementById('statusFilter').addEventListener('change', (e) => {
        currentFilters.status = e.target.value;
        currentPage = 1;
        loadContent();
    });
    
    document.getElementById('typeFilter').addEventListener('change', (e) => {
        currentFilters.type = e.target.value;
        currentPage = 1;
        loadContent();
    });
    
    document.getElementById('sortFilter').addEventListener('change', (e) => {
        currentFilters.sort = e.target.value;
        currentPage = 1;
        loadContent();
    });
    
    document.getElementById('searchInput').addEventListener('input', debounce((e) => {
        currentFilters.search = e.target.value;
        currentPage = 1;
        loadContent();
    }, 500));
    
    // Select all
    document.getElementById('selectAll').addEventListener('change', (e) => {
        const checkboxes = document.querySelectorAll('.content-checkbox');
        checkboxes.forEach(cb => {
            const id = parseInt(cb.dataset.contentId);
            cb.checked = e.target.checked;
            if (e.target.checked) {
                selectedContentIds.add(id);
            } else {
                selectedContentIds.delete(id);
            }
        });
        updateBulkActions();
    });
    
    // Bulk actions
    document.getElementById('bulkApprove').addEventListener('click', bulkApprove);
    document.getElementById('bulkReject').addEventListener('click', () => {
        if (selectedContentIds.size > 0) {
            bulkReject();
        }
    });
    
    // Update reject confirmation to handle bulk
    const originalConfirmReject = window.confirmReject;
    window.confirmReject = async function() {
        if (currentPreviewId) {
            // Single item
            await originalConfirmReject();
        } else {
            // Bulk items
            const reason = document.getElementById('rejectionReason').value;
            const comments = document.getElementById('rejectionComments').value;
            
            if (!reason) {
                showToast('Please select a rejection reason', 'error');
                return;
            }
            
            try {
                const response = await axios.post('/api/reject-content.php', {
                    contentIds: Array.from(selectedContentIds),
                    reason: reason,
                    comments: comments
                });
                
                if (response.data.success) {
                    showToast(`Successfully rejected ${response.data.data.successCount} item(s)`, 'success');
                    closeRejectModal();
                    selectedContentIds.clear();
                    updateBulkActions();
                    await loadStatistics();
                    await loadContent();
                    
                    document.getElementById('rejectionReason').value = '';
                    document.getElementById('rejectionComments').value = '';
                }
            } catch (error) {
                console.error('Bulk rejection failed:', error);
                showToast('Failed to reject content', 'error');
            }
        }
    };
}

/**
 * Setup user menu
 */
function setupUserMenu() {
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userMenu = document.getElementById('userMenu');
    
    if (userMenuBtn && userMenu) {
        userMenuBtn.addEventListener('click', () => {
            userMenu.classList.toggle('hidden');
        });
        
        document.addEventListener('click', (e) => {
            if (!userMenuBtn.contains(e.target) && !userMenu.contains(e.target)) {
                userMenu.classList.add('hidden');
            }
        });
    }
}

/**
 * Render pagination
 */
function renderPagination(pagination) {
    const pageNumbers = document.getElementById('pageNumbers');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    pageNumbers.innerHTML = '';
    
    // Previous button
    prevBtn.disabled = !pagination.hasPreviousPage;
    prevBtn.onclick = () => {
        if (pagination.hasPreviousPage) {
            currentPage--;
            loadContent();
        }
    };
    
    // Page numbers
    for (let i = 1; i <= pagination.totalPages; i++) {
        if (
            i === 1 ||
            i === pagination.totalPages ||
            (i >= currentPage - 2 && i <= currentPage + 2)
        ) {
            const btn = document.createElement('button');
            btn.textContent = i;
            btn.className = `px-4 py-2 border rounded-lg ${
                i === currentPage
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'border-gray-300 hover:bg-gray-50'
            }`;
            btn.onclick = () => {
                currentPage = i;
                loadContent();
            };
            pageNumbers.appendChild(btn);
        } else if (
            i === currentPage - 3 ||
            i === currentPage + 3
        ) {
            const span = document.createElement('span');
            span.textContent = '...';
            span.className = 'px-2';
            pageNumbers.appendChild(span);
        }
    }
    
    // Next button
    nextBtn.disabled = !pagination.hasNextPage;
    nextBtn.onclick = () => {
        if (pagination.hasNextPage) {
            currentPage++;
            loadContent();
        }
    };
}

/**
 * Show loading state
 */
function showLoading(show) {
    const loadingState = document.getElementById('loadingState');
    const filesGrid = document.getElementById('filesGrid');
    
    if (show) {
        loadingState.classList.remove('hidden');
        filesGrid.classList.add('hidden');
    } else {
        loadingState.classList.add('hidden');
        filesGrid.classList.remove('hidden');
    }
}

/**
 * Show empty state
 */
function showEmptyState() {
    document.getElementById('emptyState').classList.remove('hidden');
    document.getElementById('filesGrid').classList.add('hidden');
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
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');
    
    const icons = {
        success: '<i class="fas fa-check-circle text-2xl text-green-600"></i>',
        error: '<i class="fas fa-exclamation-circle text-2xl text-red-600"></i>',
        info: '<i class="fas fa-info-circle text-2xl text-blue-600"></i>'
    };
    
    const colors = {
        success: 'border-green-600',
        error: 'border-red-600',
        info: 'border-blue-600'
    };
    
    toastIcon.innerHTML = icons[type] || icons.info;
    toastMessage.textContent = message;
    toast.className = `fixed bottom-4 right-4 bg-white rounded-lg shadow-2xl p-4 transition-all duration-300 z-50 max-w-sm border-l-4 ${colors[type] || colors.info}`;
    toast.style.transform = 'translateY(0)';
    
    setTimeout(() => {
        closeToast();
    }, 5000);
}

/**
 * Close toast
 */
function closeToast() {
    const toast = document.getElementById('toast');
    toast.style.transform = 'translateY(8rem)';
}

/**
 * Logout
 */
async function logout() {
    try {
        await axios.post('/api/logout.php');
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        localStorage.removeItem('user');
        sessionStorage.removeItem('sessionToken');
        window.location.href = '/admin-login.html';
    }
}

/**
 * Debounce function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Download file
 */
function downloadFile() {
    if (!currentPreviewId) return;
    // Implement file download
    showToast('Download started', 'success');
}

/**
 * View history
 */
function viewHistory() {
    if (!currentPreviewId) return;
    // Implement history view
    showToast('History view coming soon', 'info');
}

/**
 * Toggle language
 */
function toggleLanguage() {
    // Implement language toggle
    showToast('Language toggle coming soon', 'info');
}
