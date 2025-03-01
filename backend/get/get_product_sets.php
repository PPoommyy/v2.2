<?php
    include('../config.php');
    include('../controllers/sku_controller.php');
    include('../controllers/data_controller.php');
?>
<?php
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;

    $offset = ($page - 1) * $limit;
    
    try {
        // $product_sets = json_decode(get_product_sets($conn, "sku_settings", ['id', 'order_product_sku'], 'id', $limit, $offset), true);
        // $skus = json_decode(get_skus($conn, $limit, $offset), true);
        $count = json_decode(get_product_sets_count($conn), true);
        $product_sets = json_decode(get_product_sets($conn), true);
        $arrayObject = array_map(function ($product_set) use ($conn) {
            $product_set_items = json_decode(get_product_set_items($conn, "product_set_id", $product_set['product_set_id']), true);
            return [
                'details' => $product_set,
                'items' => $product_set_items,
            ];
        }, $product_sets);
        $response = [
            'count' => $count[0]['count'],
            'product_sets' => $arrayObject
        ];

        $jsonData = json_encode($response);
        echo $jsonData;
    }   catch (\Exception $e) {
        echo $e->getMessage();
    }
?>