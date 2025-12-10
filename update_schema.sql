-- Update content table to make course_id nullable
-- This allows uploads without requiring a course reference in the database
-- Courses are managed in localStorage on the frontend

-- Drop the existing content table
DROP TABLE IF EXISTS content;

-- Recreate with nullable course_id
CREATE TABLE IF NOT EXISTS content (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('lecture', 'assignment', 'video', 'document', 'quiz', 'other')),
  file_url TEXT,
  file_key TEXT,
  upload_date TEXT NOT NULL DEFAULT (datetime('now')),
  uploader_id INTEGER NOT NULL,
  course_id INTEGER,  -- Made nullable
  is_approved INTEGER DEFAULT 0,
  description TEXT,
  file_size INTEGER,
  mime_type TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (uploader_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
);

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_content_uploader ON content(uploader_id);
CREATE INDEX IF NOT EXISTS idx_content_course ON content(course_id);
CREATE INDEX IF NOT EXISTS idx_content_type ON content(type);
CREATE INDEX IF NOT EXISTS idx_content_approved ON content(is_approved);
