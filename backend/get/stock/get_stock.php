<?php
    include('../../config.php');
    include('../../controllers/stock_controller.php'); // Make sure paths are correct

    // Sanitize inputs
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100; // Default limit
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;     // Default page
    $offset = ($page - 1) * $limit;

    $table = isset($_GET['table']) ? ($_GET['table']) : 'total';
    $search_sku = isset($_GET['search_sku']) ? (($_GET['search_sku'])) : null;
    $date_start = isset($_GET['date_start']) && !empty($_GET['date_start']) ? ($_GET['date_start']) : null;
    $date_end = isset($_GET['date_end']) && !empty($_GET['date_end']) ? ($_GET['date_end']) : null;

    $response = [];

    try {
        if ($table == 'total') {
            $stock = json_decode(get_total_stock($conn, $limit, $offset, $search_sku), true);
            $response['stock'] = $stock;
        } else if ($table == 'stock_in') {
            $stock_in = json_decode(get_stock_in_transactions($conn, $limit, $offset, $search_sku, $date_start, $date_end), true);
            $response['stock_in'] = $stock_in;
        } else if ($table == 'stock_out') {
            $stock_out = json_decode(get_stock_out_transactions($conn, $limit, $offset, $search_sku, $date_start, $date_end), true);
            $response['stock_out'] = $stock_out;
        } else {
            $response['message'] = 'Invalid table name specified.';
            http_response_code(400); // Bad Request
        }
    } catch (Exception $e) {
        $response['message'] = 'Error processing request: ' . $e->getMessage();
        http_response_code(500); // Internal Server Error
    }

    header('Content-Type: application/json');
    echo json_encode($response);
?>