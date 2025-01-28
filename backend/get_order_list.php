<?php
    include('config.php');
    include('./controllers/order_controller.php');
    include('./controllers/data_controller.php');
?>
<?php
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $filterConditions = [];
    $filterParams = [];

    function getFilterValue($filterName) {
        return isset($_GET[$filterName]) ? htmlspecialchars($_GET[$filterName]) : null;
    }

    $website = getFilterValue('website');
    if ($website) {
        $filterConditions[] = "w.name = :website";
        $filterParams[':website'] = $website;
    }

    $orderStatus = getFilterValue('order_status');
    if ($orderStatus) {
        $filterConditions[] = "order_status_id = :order_status_id";
        $filterParams[':order_status_id'] = $orderStatus;
    }

    $fulfillmentStatus = getFilterValue('fulfillment_status');
    if ($fulfillmentStatus) {
        $filterConditions[] = "fulfillment_status = :fulfillment_status";
        $filterParams[':fulfillment_status'] = $fulfillmentStatus;
    }

    $paymentMethod = getFilterValue('payment_method');
    if ($paymentMethod) {
        $filterConditions[] = "pm.name = :payment_method";
        $filterParams[':payment_method'] = $paymentMethod;
    }

    $date_start = getFilterValue('date_start');
    $date_end = getFilterValue('date_end');
    if ($date_start && $date_end) {
        $filterConditions[] = "o.payments_date BETWEEN :date_start AND :date_end";
        $filterParams[':date_start'] = date_format(date_create($date_start), 'Y-m-d H:i:s');
        $filterParams[':date_end'] = date_format(date_create($date_end), 'Y-m-d H:i:s');
    }

    $filter = empty($filterConditions) ? '' : 'WHERE ' . implode(' AND ', $filterConditions);
    $offset = ($page - 1) * $limit;
    
    try {
        $orders = json_decode(get_orders($conn, $limit, $offset, $filter, $filterParams), true);
        $arrayObject = array_map(function ($order) use ($conn) {
            $total = json_decode(get_order_total($conn, $order['order_id']), true);
            $enable_invoice = json_decode(get_value_by_key($conn, "country_currency", "enable_invoice", "country_code", $order['ship_country'], "id", 1), true)[0];
            $service_id = json_decode(get_value_by_key($conn, "country_currency", "service_id", "country_code", $order['ship_country'], "id", 1), true)[0];
            $tax_rate = json_decode(get_value_by_key($conn, "country_currency", "tax_rate", "country_code", $order['ship_country'], "id", 1), true)[0];
            $items = json_decode(get_order_items($conn, $order['order_id']), true);
            $files = json_decode(get_order_files($conn, $order['order_id']), true);
            $tracking = json_decode(get_order_tracking($conn, $order['order_id']), true);
            return [
                'details' => $order,
                'all_total' => round($total[0]['total'] + $order['shipping_fee'] - $order['ship_promotion_discount'],2),
                'sub_total' => round($total[0]['total'],2),
                'items' => $items,
                'enable_invoice' => $enable_invoice['enable_invoice'],
                'service_id' => $service_id,
                'tax_rate' => $tax_rate,
                'files' => $files,
                'tracking' => $tracking 
            ];
        }, $orders);

        $websites = json_decode(get_websites_details($conn), true);
        $payment_methods = json_decode(get_payment_methods($conn), true);
        $order_status = json_decode(get_order_status_name($conn), true);
        $fulfillment_status = array(
            array("name" => "Processing"),
            array("name" => "Done")
        );
        $arrayObject2 = array(
            'websites' => $websites,
            'order_status' => $order_status,
            'fulfillment_status' => $fulfillment_status,
            'payment_methods' => $payment_methods,
        );

        $response = [
            'data1' => $arrayObject,
            'data2' => $arrayObject2,
        ];

        $jsonData = json_encode($response);
        echo $jsonData;
    }   catch (\Exception $e) {
        echo $e->getMessage();
    }
?>    