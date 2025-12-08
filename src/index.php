<?php
/**
 * Tsharok - Main Entry Point
 */

// Display errors in development
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Include configuration
require_once __DIR__ . '/../config/database.php';

echo "Tsharok Application - Welcome!";

