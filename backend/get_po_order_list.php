<?php
    include('config.php');
    include('./controllers/po_controller.php');
    include('./controllers/data_controller.php');

    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $filterConditions = [];
    $filterParams = [];

    function getFilterValue($filterName) {
        return isset($_GET[$filterName]) ? htmlspecialchars($_GET[$filterName]) : null;
    }

    // Add filters based on user input
    $factoryName = getFilterValue('factory');
    if ($factoryName) {
        $filterConditions[] = "f.id = :factory_id";
        $filterParams[':factory_id'] = $factoryName;
    }

    $status = getFilterValue('order_status');
    if ($status) {
        $filterConditions[] = "po.po_orders_status_id = :po_orders_status";
        $filterParams[':po_orders_status'] = $status;
    }

    $dateStart = getFilterValue('date_start');
    $dateEnd = getFilterValue('date_end');
    if ($dateStart && $dateEnd) {
        $filterConditions[] = "po.po_orders_date BETWEEN :date_start AND :date_end";
        $filterParams[':date_start'] = date_format(date_create($dateStart), 'Y-m-d H:i:s');
        $filterParams[':date_end'] = date_format(date_create($dateEnd), 'Y-m-d H:i:s');
    }

    $filter = empty($filterConditions) ? '' : 'WHERE ' . implode(' AND ', $filterConditions);
    $offset = ($page - 1) * $limit;
    
    try {
        $po_orders = json_decode(get_po_orders($conn, $limit, $offset, $filter, $filterParams), true);

        $arrayObject = array_map(function ($po_order) use ($conn) {
            $items = json_decode(get_po_orders_items($conn, $po_order['po_orders_id']), true);
            $files = json_decode(select($conn, "po_orders_files", ["id", "po_orders_id", "file_name", "file_pathname"], "po_orders_id", $po_order['po_orders_id'], false), true);
            return [
                'details' => $po_order,
                'items' => $items,
                'files' => $files ? $files : []
            ];
        }, $po_orders);

        $factories = json_decode(get_data($conn, 'factories', 'id, name'), true);
        $po_orders_status = json_decode(get_data($conn, 'po_orders_status', 'id, name'), true);
        $count = json_decode(select_count($conn, "po_orders", "po_orders_id"), true);
        $payment_status = array(
            array("name" => "Paid"),
            array("name" => "Unpaid")
        );

        $arrayObject2 = array(
            'factories' => $factories,
            'po_orders_status' => $po_orders_status,
            'payment_status' => $payment_status,
            'count' => $count
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
