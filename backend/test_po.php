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
    $supplierName = getFilterValue('supplier_name');
    if ($supplierName) {
        $filterConditions[] = "f.name = :supplier_name";
        $filterParams[':supplier_name'] = $supplierName;
    }

    $status = getFilterValue('status');
    if ($status) {
        $filterConditions[] = "po.status_id = :status";
        $filterParams[':status'] = $status;
    }

    $paymentStatus = getFilterValue('payment_status');
    if ($paymentStatus) {
        $filterConditions[] = "po.payment_status = :payment_status";
        $filterParams[':payment_status'] = $paymentStatus;
    }

    $dateStart = getFilterValue('date_start');
    $dateEnd = getFilterValue('date_end');
    if ($dateStart && $dateEnd) {
        $filterConditions[] = "po.po_order_date BETWEEN :date_start AND :date_end";
        $filterParams[':date_start'] = date_format(date_create($dateStart), 'Y-m-d H:i:s');
        $filterParams[':date_end'] = date_format(date_create($dateEnd), 'Y-m-d H:i:s');
    }

    $filter = empty($filterConditions) ? '' : 'WHERE ' . implode(' AND ', $filterConditions);
    $offset = ($page - 1) * $limit;
    
    try {
        // $pos = json_decode(get_po_orders($conn, $limit, $offset, $filter, $filterParams), true);

        /* // Debugging: Log the response from get_po_orders
        file_put_contents('debug_log.txt', "POS Data: " . print_r($pos, true) . "\n", FILE_APPEND);

        $arrayObject = array_map(function ($po) use ($conn) {
            $items = json_decode(get_order_items($conn, $po['po_order_id']), true);
            return [
                'details' => $po,
                'items' => $items
            ];
        }, $pos);

        // Fetch related data using get_data function
        $factories = get_data($conn, 'factories', 'id, name');
        $po_order_status = get_data($conn, 'po_order_status', 'id, name');
        $order_payment_status = array(
            array("name" => "Paid"),
            array("name" => "Unpaid")
        );

        $arrayObject2 = array(
            'factories' => $factories,
            'po_order_status' => $po_order_status,
            'order_payment_status' => $order_payment_status,
        );

        $response = [
            'data1' => $arrayObject,
            'data2' => $arrayObject2,
        ]; */

        $items = json_decode(get_order_items($conn, "PO001"), true);
        $jsonData = json_encode($items);
        echo $jsonData;
    } catch (\Exception $e) {
        echo json_encode(['error' => 'Error: ' . $e->getMessage()]);
    }
?>
