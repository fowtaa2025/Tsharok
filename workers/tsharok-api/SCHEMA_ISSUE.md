# Schema Mismatch Issue

## The Problem

The PHP code uses one schema, but your D1 database uses a different one:

**PHP Schema (from rating-handler.php):**
- Table: `comments` - columns: `comment_id`, `course_id`, `comment`, `title`, `would_recommend`
- Table: `ratings` - columns: `rating_id`, `course_id`, `rating`

**D1 Schema (actual cloud database):**
- Table: `comments` - columns: `id`, `content_id`, `content`  
- Table: `ratings` - columns: `id`, `content_id`, `score`

## Solution Options

### Option 1: Match D1 Schema (Recommended)
Update the Worker handlers to use `content_id` instead of `courseId`. This means:
- Ratings/comments are for **files** (content), not courses
- Frontend should pass `contentId` (the file ID) instead of `courseId`

### Option 2: Update D1 Schema
Run migrations on D1 to match the PHP schema with course ratings

## Which Do You Prefer?

**Quick Question:** Are ratings/comments supposed to be for:
1. **Files** (content) - like "this PDF is helpful" 
2. **Courses** - like "this course is great"

The D1 schema suggests #1 (file ratings), but the PHP code suggests #2 (course ratings).
