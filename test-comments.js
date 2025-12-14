// Test script to verify comment APIs are working
// Run this in browser console on the file page

async function testCommentAPIs() {
    console.log('=== TESTING COMMENT APIs ===');

    // Get current file ID from URL
    const params = new URLSearchParams(window.location.search);
    const fileId = params.get('fileId');
    console.log('File ID:', fileId);

    if (!fileId) {
        console.error('No file ID in URL');
        return;
    }

    // Test 1: Get comments
    console.log('\n--- Test 1: GET /api/comments ---');
    try {
        const response = await fetch(`/api/comments?contentId=${fileId}`);
        const data = await response.json();
        console.log('Response:', data);

        if (data.success && data.comments && data.comments.length > 0) {
            console.log('✅ Comments loaded:', data.comments.length);
            console.log('First comment:', data.comments[0]);
            console.log('Comment has ID?', !!data.comments[0].id);
            console.log('Comment has likes?', data.comments[0].likes);
            console.log('Comment has replies?', data.comments[0].replies);
        } else {
            console.log('⚠️ No comments found');
        }
    } catch (error) {
        console.error('❌ Error getting comments:', error);
    }

    // Test 2: Check if comment IDs are in HTML
    console.log('\n--- Test 2: Check HTML for comment IDs ---');
    const commentElements = document.querySelectorAll('[data-comment-index]');
    console.log('Found comment elements:', commentElements.length);

    commentElements.forEach((el, i) => {
        const index = el.dataset.commentIndex;
        const id = el.dataset.commentId;
        console.log(`Comment ${i}: index=${index}, id=${id}`);
    });

    if (commentElements.length === 0) {
        console.log('⚠️ No comment elements in HTML');
    }

    // Test 3: Check if functions are overridden
    console.log('\n--- Test 3: Check function overrides ---');
    console.log('toggleLike type:', typeof window.toggleLike);
    console.log('addReply type:', typeof window.addReply);
    console.log('toggleLike code:', window.toggleLike.toString().substring(0, 100));

    console.log('\n=== TEST COMPLETE ===');
}

// Run the test
testCommentAPIs();
