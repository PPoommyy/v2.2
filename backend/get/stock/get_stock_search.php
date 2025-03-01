<?php
    include('../../config.php');
    include('../../controllers/stock_controller.php');
?>
<?php
    try {
        $searchTerm = isset($_GET['searchTerm']) ? $_GET['searchTerm'] : "";
        $searchTerm = trim($searchTerm);
    
        $stock_list = json_decode(get_stock_by_search($conn, $searchTerm), true);
    
        $response = [
            'success' => true,
            'data' => $stock_list
        ];
    
        echo json_encode($response);
    } catch (\Exception $e) {
        $response = [
            'success' => false,
            'error' => $e->getMessage(),
        ];
    
        echo json_encode($response);
    }
?>