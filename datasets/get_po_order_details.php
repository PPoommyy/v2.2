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
        $filterConditions[] = "po.order_status_id = :order_status";
        $filterParams[':order_status'] = $status;
    }

    $dateStart = getFilterValue('date_start');
    $dateEnd = getFilterValue('date_end');
    if ($dateStart && $dateEnd) {
        $filterConditions[] = "po.order_date BETWEEN :date_start AND :date_end";
        $filterParams[':date_start'] = date_format(date_create($dateStart), 'Y-m-d H:i:s');
        $filterParams[':date_end'] = date_format(date_create($dateEnd), 'Y-m-d H:i:s');
    }

    $filter = empty($filterConditions) ? '' : 'WHERE ' . implode(' AND ', $filterConditions);
    $offset = ($page - 1) * $limit;
    
    try {
        $pos = json_decode(get_po_orders($conn, $limit, $offset, $filter, $filterParams), true);

        $arrayObject = array_map(function ($po) use ($conn) {
            $items = json_decode(get_order_items($conn, $po['order_id']), true);
            return [
                'details' => $po,
                'items' => $items
            ];
        }, $pos);

        // Fetch related data using get_data function
        $factories = get_data($conn, 'factories', 'id, name');
        $order_status = get_data($conn, 'order_status', 'id, name');
        $payment_status = array(
            array("name" => "Paid"),
            array("name" => "Unpaid")
        );

        $arrayObject2 = array(
            'factories' => $factories,
            'order_status' => $order_status,
            'payment_status' => $payment_status,
            'count' => count($pos)
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
