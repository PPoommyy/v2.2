<?php
    include('config.php');
    include('./controllers/data_controller.php');
?>
<?php
    try {
        $name = isset($_GET['name']) ? $_GET['name'] : "";
    
        $sku = json_decode(get_sku_by_name($conn, $name), true);
    
        $response = [
            'status' => count($sku)>0?200:400,
            'data' => $sku
        ];
    
        echo json_encode($response);
    } catch (\Exception $e) {
        $response = [
            'status' => 400,
            'error' => $e->getMessage(),
        ];
    
        echo json_encode($response);
    }
?>