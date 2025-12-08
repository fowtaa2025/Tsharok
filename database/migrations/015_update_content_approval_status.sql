-- Migration: Update Content Approval Status
-- Version: 015
-- Date: 2025-11-19
-- Description: Update content table to support rejection status (-1)

-- Modify the is_approved column to use TINYINT to support -1 (rejected), 0 (pending), 1 (approved)
ALTER TABLE content 
MODIFY COLUMN is_approved TINYINT DEFAULT 0 
COMMENT '0=pending, 1=approved, -1=rejected';

-- Add index for better query performance
CREATE INDEX idx_content_approval_status ON content(is_approved);

-- Add comment to table for documentation
ALTER TABLE content 
COMMENT = 'Stores course content with approval workflow: staging -> approved/rejected';

