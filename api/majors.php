<?php
/**
 * Get All Majors API
 * Tsharok LMS
 */

define('TSHAROK_INIT', true);

ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJsonResponse(false, 'Invalid request method.');
}

try {
    $db = getDB();
    
    $stmt = $db->prepare("
        SELECT 
            m.id,
            m.name,
            m.description
        FROM majors m
        ORDER BY m.name ASC
    ");
    
    $stmt->execute();
    $majors = $stmt->fetchAll();
    
    $formattedMajors = array_map(function($major) {
        return [
            'majorId' => $major['id'],
            'majorName' => $major['name'],
            'description' => $major['description'],
            'courseCount' => 0 // Will be implemented later when courses have major_id
        ];
    }, $majors);
    
    sendJsonResponse(true, 'Majors retrieved successfully.', [
        'majors' => $formattedMajors,
        'totalCount' => count($formattedMajors)
    ]);
    
} catch (Exception $e) {
    error_log("Majors API Exception: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    // In development, show the actual error
    sendJsonResponse(false, 'Failed to retrieve majors: ' . $e->getMessage());
}
?>
