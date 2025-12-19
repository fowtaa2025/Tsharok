-- Create notifications table for course content alerts
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  course_id INTEGER,
  content_id INTEGER,
  type TEXT NOT NULL DEFAULT 'content_upload',
  title TEXT NOT NULL,
  message TEXT,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (course_id) REFERENCES courses(course_id),
  FOREIGN KEY (content_id) REFERENCES content(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
