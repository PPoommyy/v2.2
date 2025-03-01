<?php
    include('../config.php');
    include('../controllers/order_controller.php');
    include('../controllers/data_controller.php');
?>
<?php
    $factory_id = isset($_GET['factory_id']) ? (int)$_GET['factory_id'] : null;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $offset = ($page - 1) * $limit;
    
    try {
        $orders = json_decode(get_orders($conn, $limit, $offset, $filter, $filterParams), true);
        $arrayObject = array_map(function ($order) use ($conn, $factory_id) {
            $items = json_decode(get_pre_po_order_items($conn, $factory_id, $order['order_id']), true);
            return [
                'details' => $order,
                'items' => $items
            ];
        }, $orders);

        $response = [
            'data1' => $arrayObject
        ];

        $jsonData = json_encode($response);
        echo $jsonData;
    }   catch (\Exception $e) {
        echo $e->getMessage();
    }
?>    