<?php
/**
 * Query Optimizer
 * Database query optimization utilities
 * Tsharok LMS
 */

// Prevent direct access
if (!defined('TSHAROK_INIT')) {
    http_response_code(403);
    exit('Direct access not permitted');
}

/**
 * Simple query cache
 */
class QueryCache {
    private static $cache = [];
    private static $enabled = true;
    private static $ttl = 3600; // 1 hour default
    
    /**
     * Get cached query result
     */
    public static function get($key) {
        if (!self::$enabled) {
            return null;
        }
        
        if (isset(self::$cache[$key])) {
            $cached = self::$cache[$key];
            if (time() < $cached['expires']) {
                return $cached['data'];
            } else {
                unset(self::$cache[$key]);
            }
        }
        
        return null;
    }
    
    /**
     * Set query result in cache
     */
    public static function set($key, $data, $ttl = null) {
        if (!self::$enabled) {
            return;
        }
        
        $ttl = $ttl ?? self::$ttl;
        
        self::$cache[$key] = [
            'data' => $data,
            'expires' => time() + $ttl
        ];
    }
    
    /**
     * Clear cache
     */
    public static function clear($key = null) {
        if ($key === null) {
            self::$cache = [];
        } else {
            unset(self::$cache[$key]);
        }
    }
    
    /**
     * Enable/disable cache
     */
    public static function setEnabled($enabled) {
        self::$enabled = $enabled;
    }
    
    /**
     * Generate cache key from query and params
     */
    public static function generateKey($query, $params = []) {
        return md5($query . serialize($params));
    }
}

/**
 * Execute query with caching
 */
function cachedQuery($db, $query, $params = [], $ttl = null) {
    if (!defined('CACHE_ENABLED') || !CACHE_ENABLED) {
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }
    
    $cacheKey = QueryCache::generateKey($query, $params);
    $cached = QueryCache::get($cacheKey);
    
    if ($cached !== null) {
        return $cached;
    }
    
    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $result = $stmt->fetchAll();
    
    QueryCache::set($cacheKey, $result, $ttl);
    
    return $result;
}

/**
 * Batch query executor to prevent N+1 problems
 */
class BatchLoader {
    private $db;
    private $queries = [];
    
    public function __construct($db) {
        $this->db = $db;
    }
    
    /**
     * Add query to batch
     */
    public function addQuery($name, $query, $params = []) {
        $this->queries[$name] = [
            'query' => $query,
            'params' => $params,
            'result' => null
        ];
    }
    
    /**
     * Execute all queries
     */
    public function execute() {
        foreach ($this->queries as $name => &$query) {
            $stmt = $this->db->prepare($query['query']);
            $stmt->execute($query['params']);
            $query['result'] = $stmt->fetchAll();
        }
    }
    
    /**
     * Get result by name
     */
    public function getResult($name) {
        return isset($this->queries[$name]) ? $this->queries[$name]['result'] : null;
    }
}

/**
 * Pagination helper with query optimization
 */
function paginatedQuery($db, $query, $params, $page = 1, $limit = DEFAULT_PAGE_SIZE) {
    // Validate pagination parameters
    $page = max(1, intval($page));
    $limit = min(MAX_PAGE_SIZE, max(1, intval($limit)));
    $offset = ($page - 1) * $limit;
    
    // Get total count (extract from main query)
    $countQuery = preg_replace('/SELECT .+ FROM/i', 'SELECT COUNT(*) as total FROM', $query);
    // Remove ORDER BY and LIMIT clauses for count
    $countQuery = preg_replace('/ORDER BY .+/i', '', $countQuery);
    $countQuery = preg_replace('/LIMIT .+/i', '', $countQuery);
    
    $stmt = $db->prepare($countQuery);
    $stmt->execute($params);
    $total = $stmt->fetch()['total'];
    
    // Add pagination to main query
    $query .= " LIMIT ? OFFSET ?";
    $paginatedParams = array_merge($params, [$limit, $offset]);
    
    $stmt = $db->prepare($query);
    $stmt->execute($paginatedParams);
    $results = $stmt->fetchAll();
    
    return [
        'data' => $results,
        'pagination' => [
            'current_page' => $page,
            'per_page' => $limit,
            'total' => intval($total),
            'total_pages' => ceil($total / $limit),
            'has_more' => ($page * $limit) < $total
        ]
    ];
}

/**
 * Optimize query by analyzing EXPLAIN
 */
function analyzeQuery($db, $query, $params = []) {
    if (!defined('APP_DEBUG') || !APP_DEBUG) {
        return null;
    }
    
    try {
        $explainQuery = "EXPLAIN " . $query;
        $stmt = $db->prepare($explainQuery);
        $stmt->execute($params);
        $explain = $stmt->fetchAll();
        
        $warnings = [];
        
        foreach ($explain as $row) {
            // Check for full table scans
            if ($row['type'] === 'ALL') {
                $warnings[] = "Full table scan detected on table: {$row['table']}";
            }
            
            // Check for missing indexes
            if ($row['key'] === null) {
                $warnings[] = "No index used on table: {$row['table']}";
            }
            
            // Check for excessive rows examined
            if (isset($row['rows']) && $row['rows'] > 10000) {
                $warnings[] = "Large number of rows examined ({$row['rows']}) on table: {$row['table']}";
            }
        }
        
        return [
            'explain' => $explain,
            'warnings' => $warnings
        ];
    } catch (Exception $e) {
        logError("Failed to analyze query: " . $e->getMessage());
        return null;
    }
}

