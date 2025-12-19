// ====================================
// DEBUG SCRIPT FOR KNOWLEDGE RATING
// ====================================
// Paste this into browser console on course page (F12)

console.log('🔍 Starting Knowledge Rating Debug...\n');

// 1. Check what courseId is loaded
console.log('1️⃣ Current Course ID:', window.currentCourseId);

// 2. Check if files data exists
console.log('2️⃣ Files data:', window.allFiles?.length || 0, 'files loaded');

// 3. Log first file structure to see what data we have
if (window.allFiles && window.allFiles[0]) {
    console.log('3️⃣ First file structure:');
    console.log(JSON.stringify(window.allFiles[0], null, 2));
    console.log('   - Has rating field?', 'rating' in window.allFiles[0]);
    console.log('   - Has statistics field?', 'statistics' in window.allFiles[0]);
    console.log('   - Statistics value:', window.allFiles[0].statistics);
}

// 4. Calculate what the rating SHOULD be
console.log('4️⃣ Calculating Knowledge Rating...');
let ratings = [];
if (window.allFiles) {
    window.allFiles.forEach((file, idx) => {
        const statRating = file.statistics?.avg_rating;
        const oldRating = file.rating;
        const rating = parseFloat(statRating || oldRating || 0);

        console.log(`   File ${idx + 1}: "${file.title}"
      - statistics.avg_rating: ${statRating} (${typeof statRating})
      - file.rating: ${oldRating} (${typeof oldRating})
      - Parsed rating: ${rating}`);

        if (!isNaN(rating) && rating > 0) {
            ratings.push(rating);
        }
    });

    const avg = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    console.log(`\n   ✅ CALCULATED KNOWLEDGE RATING: ${avg.toFixed(1)}`);
    console.log(`   📊 Based on ${ratings.length} files with ratings`);
}

// 5. Check what's displayed on page
const displayedRating = document.getElementById('courseRating')?.textContent;
console.log('5️⃣ Currently displayed rating:', displayedRating);

// 6. Check the updateCourseRating function
console.log('6️⃣ Checking updateCourseRating function...');
console.log('   Function exists?', typeof window.updateCourseRating === 'function');

// 7. Fetch fresh data from API
console.log('7️⃣ Fetching fresh data from API...');
fetch(`https://tsharok-api.fow-taa-2025.workers.dev/api/view-materials?course_id=${window.currentCourseId || 40}`)
    .then(r => r.json())
    .then(data => {
        console.log('   API Response:', data);
        if (data.data?.materials) {
            console.log(`   API returned ${data.data.materials.length} files`);
            const apiRatings = data.data.materials
                .map(f => parseFloat(f.statistics?.avg_rating || 0))
                .filter(r => !isNaN(r) && r > 0);
            const apiAvg = apiRatings.length > 0 ? apiRatings.reduce((a, b) => a + b) / apiRatings.length : 0;
            console.log(`   ✅ API CALCULATED RATING: ${apiAvg.toFixed(1)}`);
            console.log(`   📊 Based on ${apiRatings.length} files from API\n`);

            // Show discrepancy
            console.log('8️⃣ COMPARISON:');
            console.log(`   Displayed on page: ${displayedRating}`);
            console.log(`   Should be (from API): ${apiAvg.toFixed(1)}★`);
            console.log(`   Match? ${displayedRating === apiAvg.toFixed(1) + '★' ? '✅ YES' : '❌ NO'}`);
        }
    })
    .catch(err => console.error('API Error:', err));

console.log('\n📋 Debug complete! Check output above.');
