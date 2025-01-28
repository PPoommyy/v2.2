<?php
    include('config.php');
    include('./controllers/po_controller.php');
    include('./controllers/data_controller.php');

    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $offset = ($page - 1) * $limit;
    
    try {
        $factories = json_decode(select($conn, 'factories', ['*'], 'id', $limit, $offset), true);

        $arrayObject = array_map(function ($factory) use ($conn) {
            $join_factories_skus = [];
            $column_factories_skus = [];
            $where_factories_skus = [];
            $factory_skus = json_decode(select($conn, 'factory_sku', $column_factories_skus, 'sku_settings_id', null, null, $join_factories_skus, $where_factories_skus), true);
            return [
                'details' => $factory,
                'factory_skus' => $factory_skus
            ];
        }, $factories);
        $arrayObject2 = array(
            'count' => count($factories)
        );

        $response = [
            'data1' => $arrayObject,
            'data2' => $arrayObject2,
        ];

        $jsonData = json_encode($response);
        echo $jsonData;
    } catch (\Exception $e) {
        echo json_encode(['error' => 'Error: ' . $e->getMessage()]);
    }
?>
