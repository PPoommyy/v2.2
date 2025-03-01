<?php
    include('../../config.php');
    include('../../controllers/data_controller.php');
?>
<?php
    try {
        $searchTerm = isset($_GET['searchTerm']) ? $_GET['searchTerm'] : "";
        $factory_id = isset($_GET['factory_id']) ? $_GET['factory_id'] : "";
        $searchTerm = trim($searchTerm);
    
        $sku_list = json_decode(get_factory_sku_by_search($conn, $searchTerm, $factory_id), true);
    
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