<?php
    include('config.php');
    include('./controllers/sku_controller.php');
?>
<?php
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;

    $offset = ($page - 1) * $limit;
    
    try {
        $brands = json_decode(get_sku_brands($conn, $limit, $offset), true);
        $count = json_decode(get_sku_brands_count($conn), true);
        $response = [
            'count' => $count[0]['count'],
            'data' => $brands
        ];

        $jsonData = json_encode($response);
        echo $jsonData;
    }   catch (\Exception $e) {
        echo $e->getMessage();
    }
?>