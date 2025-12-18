-- SQL Script to fix file URLs in content table
-- Run this on your D1 database to add the R2 domain prefix to relative file paths

UPDATE content 
SET file_url = 'https://pub-cd42bce9da7242b69d703b8bf1e9e4b6.r2.dev/' || file_url
WHERE file_url NOT LIKE 'https://%' 
  AND file_url IS NOT NULL 
  AND file_url != '';

-- This will update all rows where file_url doesn't start with https://
-- Examples:
-- Before: course-40/1766094391897-intellectual property C&S copy.pdf
-- After:  https://pub-cd42bce9da7242b69d703b8bf1e9e4b6.r2.dev/course-40/1766094391897-intellectual property C&S copy.pdf
