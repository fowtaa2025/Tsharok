-- Add file_extension column to content table
ALTER TABLE content ADD COLUMN file_extension TEXT;

-- Update existing records to extract extension from file_url
UPDATE content 
SET file_extension = LOWER(
    CASE 
        WHEN file_url LIKE '%.pdf' THEN 'pdf'
        WHEN file_url LIKE '%.doc' THEN 'doc'
        WHEN file_url LIKE '%.docx' THEN 'docx'
        WHEN file_url LIKE '%.ppt' THEN 'ppt'
        WHEN file_url LIKE '%.pptx' THEN 'pptx'
        WHEN file_url LIKE '%.jpg' THEN 'jpg'
        WHEN file_url LIKE '%.jpeg' THEN 'jpeg'
        WHEN file_url LIKE '%.png' THEN 'png'
        WHEN file_url LIKE '%.gif' THEN 'gif'
        WHEN file_url LIKE '%.mp4' THEN 'mp4'
        WHEN file_url LIKE '%.avi' THEN 'avi'
        WHEN file_url LIKE '%.mov' THEN 'mov'
        ELSE ''
    END
)
WHERE file_extension IS NULL;
