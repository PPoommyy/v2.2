<?php
    include('../../config.php');
    include('../../controllers/data_controller.php');
?>
<?php
    try {
        $searchTerm = isset($_GET['searchTerm']) ? $_GET['searchTerm'] : "";
        $searchTerm = trim($searchTerm);
    
        $sku_list = json_decode(get_sku_by_search($conn, $searchTerm), true);
    
        $response = [
            'success' => true,
            'data' => $sku_list
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