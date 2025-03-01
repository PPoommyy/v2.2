<?php
    include('../../config.php');
    include('../../controllers/data_controller.php');
?>
<?php
    try {
        $timesort = isset($_GET['timesort']) ? $_GET['timesort'] : "";
    
        $orders = json_decode(get_order_by_timesort($conn, $timesort), true);
    
        $response = [
            'status' => count($orders)>0?200:400,
            'data' => $orders
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