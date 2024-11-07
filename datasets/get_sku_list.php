<?php
    include('config.php');
    include('./controllers/sku_controller.php');
    include('./controllers/data_controller.php');
?>
<?php
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;

    $offset = ($page - 1) * $limit;
    
    try {
        $skus = json_decode(get_skus($conn, $limit, $offset), true);
        $warehouseSkus = json_decode(get_warehouse_skus($conn), true);
        $skuBrands = json_decode(get_sku_brands($conn), true);
        $warehouses = json_decode(select($conn, "warehouses", ["id", "name", "description"], "id", false, false), true);
        $count = json_decode(get_sku_count($conn), true);
        $response = [
            'count' => $count[0]['count'],
            'skus' => $skus,
            'warehouses' => $warehouses,
            'warehouseSkus' => $warehouseSkus,
            'skuBrands' => $skuBrands
        ];

        $jsonData = json_encode($response);
        echo $jsonData;
    }   catch (\Exception $e) {
        echo $e->getMessage();
    }
?>