<?php
/**
 * Markdown Helper Functions
 * Safe rendering of markdown using League/CommonMark
 */

// Prevent direct access
defined('TSHAROK_INIT') or die('Direct access not permitted');

use League\CommonMark\CommonMarkConverter;
use League\CommonMark\Environment\Environment;
use League\CommonMark\Extension\CommonMark\CommonMarkCoreExtension;
use League\CommonMark\Extension\GithubFlavoredMarkdownExtension;
use League\CommonMark\Extension\Autolink\AutolinkExtension;
use League\CommonMark\MarkdownConverter;

/**
 * Initialize Markdown Converter
 */
function initMarkdownConverter($safeMode = true) {
    static $converter = null;
    
    if ($converter === null) {
        // Check if vendor autoload exists
        if (!file_exists(__DIR__ . '/../vendor/autoload.php')) {
            return null;
        }
        
        require_once __DIR__ . '/../vendor/autoload.php';
        
        $config = [
            'html_input' => $safeMode ? 'strip' : 'escape',
            'allow_unsafe_links' => false,
            'max_nesting_level' => 10,
            'renderer' => [
                'block_separator' => "\n",
                'inner_separator' => "\n",
                'soft_break' => "\n",
            ],
        ];
        
        $environment = new Environment($config);
        $environment->addExtension(new CommonMarkCoreExtension());
        $environment->addExtension(new GithubFlavoredMarkdownExtension());
        $environment->addExtension(new AutolinkExtension());
        
        $converter = new MarkdownConverter($environment);
    }
    
    return $converter;
}

/**
 * Convert Markdown to HTML safely
 */
function markdownToHtml($markdown) {
    if (empty($markdown)) {
        return '';
    }
    
    $converter = initMarkdownConverter(true);
    
    // Fallback if CommonMark is not available
    if ($converter === null) {
        return nl2br(htmlspecialchars($markdown, ENT_QUOTES, 'UTF-8'));
    }
    
    try {
        $html = $converter->convert($markdown);
        
        // Additional XSS protection
        $html = purifyHtml($html);
        
        return $html;
        
    } catch (Exception $e) {
        error_log("Markdown conversion error: " . $e->getMessage());
        return nl2br(htmlspecialchars($markdown, ENT_QUOTES, 'UTF-8'));
    }
}

/**
 * Purify HTML to prevent XSS
 */
function purifyHtml($html) {
    // Remove potentially dangerous tags
    $dangerousTags = [
        'script', 'iframe', 'object', 'embed', 'applet',
        'meta', 'link', 'style', 'base', 'form'
    ];
    
    foreach ($dangerousTags as $tag) {
        $html = preg_replace('/<' . $tag . '\b[^>]*>.*?<\/' . $tag . '>/is', '', $html);
        $html = preg_replace('/<' . $tag . '\b[^>]*\/?>/is', '', $html);
    }
    
    // Remove on* event attributes
    $html = preg_replace('/\s*on\w+\s*=\s*["\'][^"\']*["\']/i', '', $html);
    $html = preg_replace('/\s*on\w+\s*=\s*[^\s>]*/i', '', $html);
    
    // Remove javascript: protocol
    $html = preg_replace('/href\s*=\s*["\']javascript:[^"\']*["\']/i', '', $html);
    $html = preg_replace('/src\s*=\s*["\']javascript:[^"\']*["\']/i', '', $html);
    
    return $html;
}

/**
 * Strip Markdown formatting (for previews)
 */
function stripMarkdown($markdown) {
    // Remove markdown syntax
    $text = $markdown;
    
    // Remove headers
    $text = preg_replace('/^#{1,6}\s+/m', '', $text);
    
    // Remove bold/italic
    $text = preg_replace('/\*\*([^*]+)\*\*/', '$1', $text);
    $text = preg_replace('/\*([^*]+)\*/', '$1', $text);
    $text = preg_replace('/__([^_]+)__/', '$1', $text);
    $text = preg_replace('/_([^_]+)_/', '$1', $text);
    
    // Remove links
    $text = preg_replace('/\[([^\]]+)\]\([^\)]+\)/', '$1', $text);
    
    // Remove images
    $text = preg_replace('/!\[([^\]]*)\]\([^\)]+\)/', '', $text);
    
    // Remove code blocks
    $text = preg_replace('/```[^`]*```/s', '', $text);
    $text = preg_replace('/`([^`]+)`/', '$1', $text);
    
    // Remove lists
    $text = preg_replace('/^\s*[-*+]\s+/m', '', $text);
    $text = preg_replace('/^\s*\d+\.\s+/m', '', $text);
    
    // Remove blockquotes
    $text = preg_replace('/^>\s+/m', '', $text);
    
    return trim($text);
}

/**
 * Validate and sanitize markdown input
 */
function sanitizeMarkdown($markdown) {
    // Trim whitespace
    $markdown = trim($markdown);
    
    // Remove null bytes
    $markdown = str_replace("\0", '', $markdown);
    
    // Normalize line endings
    $markdown = str_replace("\r\n", "\n", $markdown);
    $markdown = str_replace("\r", "\n", $markdown);
    
    // Limit excessive newlines
    $markdown = preg_replace("/\n{4,}/", "\n\n\n", $markdown);
    
    return $markdown;
}

/**
 * Generate markdown preview
 */
function generateMarkdownPreview($markdown, $maxLength = 200) {
    $stripped = stripMarkdown($markdown);
    
    if (mb_strlen($stripped) > $maxLength) {
        $stripped = mb_substr($stripped, 0, $maxLength) . '...';
    }
    
    return $stripped;
}

/**
 * Check if markdown contains mentions (@username)
 */
function extractMentions($markdown) {
    preg_match_all('/@([a-zA-Z0-9_]+)/', $markdown, $matches);
    return array_unique($matches[1]);
}

/**
 * Check if markdown contains URLs
 */
function extractUrls($markdown) {
    preg_match_all('/https?:\/\/[^\s<>"{}|\\^`\[\]]+/', $markdown, $matches);
    return array_unique($matches[0]);
}

/**
 * Validate markdown length
 */
function validateMarkdownLength($markdown, $minLength = 10, $maxLength = 5000) {
    $length = mb_strlen($markdown);
    
    if ($length < $minLength) {
        return [
            'valid' => false,
            'message' => "Content must be at least $minLength characters"
        ];
    }
    
    if ($length > $maxLength) {
        return [
            'valid' => false,
            'message' => "Content must not exceed $maxLength characters"
        ];
    }
    
    return ['valid' => true, 'message' => 'Valid'];
}
?>

