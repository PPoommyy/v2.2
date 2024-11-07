<?php
    include('config.php');
    include('./controllers/data_controller.php');
?>
<?php
    try {
        $websites = json_decode(get_websites_details($conn), true);
        $currencies = json_decode(get_currencies_name($conn), true);
        $payment_methods = json_decode(get_payment_methods($conn), true);
        $order_status = json_decode(select($conn, "order_status", ["id", "name"], "id", false, false), true);
        $order_types = json_decode(select($conn, "order_types", ["id", "name"], "id", false, false), true);
        $arrayObject = array(
            'websites' => $websites,
            'currencies' => $currencies,
            'payment_methods' => $payment_methods,
            'order_status' => $order_status,
            'order_types' => $order_types
        );

        $jsonData = json_encode($arrayObject);

        echo $jsonData;
    }   catch (\Exception $e) {
        echo $e->getMessage();
    }
?>