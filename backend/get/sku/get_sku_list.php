<?php
include('../../config.php');
include('../../controllers/sku_controller.php');

header('Content-Type: application/json');

// Sanitize and get parameters
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$offset = ($page - 1) * $limit;

// Get filters array
$filters_input = isset($_GET['filters']) && is_array($_GET['filters']) ? $_GET['filters'] : [];
$sanitized_filters = [];

// Sanitize filter values (replacing FILTER_SANITIZE_STRING)
foreach ($filters_input as $key => $value) {
    // Sanitize key as well, though it comes from our JS it's good practice
    $sanitized_key = htmlspecialchars(trim($key), ENT_QUOTES, 'UTF-8');
    $sanitized_value = htmlspecialchars(trim($value), ENT_QUOTES, 'UTF-8'); // Basic sanitization for strings
    if (!empty($sanitized_value)) { // Only add if value is not empty after trim
        $sanitized_filters[$sanitized_key] = $sanitized_value;
    }
}


try {
    // Pass the sanitized filters array to controller functions
    $skus_json = get_skus($conn, $limit, $offset, $sanitized_filters);
    $count_json = get_sku_count($conn, $sanitized_filters);

    $skus = json_decode($skus_json, true);
    $count_data = json_decode($count_json, true);

    if (json_last_error() !== JSON_ERROR_NONE || !is_array($skus) || !is_array($count_data) || !isset($count_data[0]['count'])) {
        error_log("Failed to decode JSON or invalid data structure. SKUs JSON: " . $skus_json . " Count JSON: " . $count_json . " Filters: " . json_encode($sanitized_filters));
        throw new Exception("Error processing data from controller.");
    }

    $response = [
        'count' => $count_data[0]['count'],
        'skus' => $skus,
        'limit' => $limit,
        'page' => $page,
        // 'filters_used' => $sanitized_filters // For debugging
    ];

    echo json_encode($response);
} catch (Exception $e) {
    http_response_code(500);
    error_log("Error in get_sku_list.php: " . $e->getMessage());
    echo json_encode(['error' => 'An error occurred: ' . $e->getMessage()]);
}
