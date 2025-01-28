<?php
    include('config.php');
    include('./controllers/sku_controller.php');
    include('./controllers/data_controller.php');
?>
<?php
    try {
        $warehouse_skus = json_decode(get_warehouse_skus($conn), true);
        $count = json_decode(get_warehouse_skus_count($conn), true);
        $response = [
            'count' => $count[0]['count'],
            'data' => $warehouse_skus,
        ];

        $jsonData = json_encode($response);
        echo $jsonData;
    }   catch (\Exception $e) {
        echo $e->getMessage();
    }
?>