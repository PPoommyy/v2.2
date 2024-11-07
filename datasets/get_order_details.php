<?php
    include('config.php');
    include('./controllers/order_controller.php');
    include('./controllers/data_controller.php');
?>
<?php
    $order_id = isset($_GET['order_id']) ? $_GET['order_id'] : "";

    try {
        $orders = json_decode(get_order_details_by_id($conn, $order_id), true)[0];
        $total = json_decode(get_order_total($conn, $orders['order_id']), true);
        $items = json_decode(get_order_items($conn, $orders['order_id']), true);
        $files = json_decode(get_order_files($conn, $orders['order_id']), true);
        $arrayObject = [
            'details' => $orders,
            'all_total' => $total[0]['total'] + $orders['shipping_fee'] - $orders['ship_promotion_discount'],
            'items' => $items,
            'files' => $files
        ];
        $websites = json_decode(get_websites_details($conn), true);
        $currencies = json_decode(get_currencies_name($conn), true);
        $payment_methods = json_decode(get_payment_methods($conn), true);
        $order_status = json_decode(select($conn, "order_status", ["id", "name"], "id", false, false), true);
        $order_types = json_decode(select($conn, "order_types", ["id", "name"], "id", false, false), true);
        $arrayObject2 = array(
            'websites' => $websites,
            'order_date' => $orders['payments_date'],
            'currencies' => $currencies,
            'payment_methods' => $payment_methods,
            'order_status' => $order_status,
            'order_types' => $order_types
        );

        $response = [
            'data1' => $arrayObject,
            'data2' => $arrayObject2
        ];

        $jsonData = json_encode($response);

        echo $jsonData;
    }   catch (\Exception $e) {
        echo $e->getMessage();
    }
?>    