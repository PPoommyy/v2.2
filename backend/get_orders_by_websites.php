<?php
    include('config.php');
    include('./controllers/data_controller.php');
    include('./controllers/order_controller.php')
?>
<?php
    try {
        $websites = json_decode(select($conn, "websites", ["*"], "id", false, false), true);
        $arrayObject = array_map(function ($website) use ($conn) {
            // orders join website by orders.website_id = websites.id
            $count_orders = json_decode(count_orders_by($conn, "website_id", $website["id"]));
            return [
                "details" => $website,
                "orders" => $count_orders
            ];
        }, $websites);
        $response = [
            'data' => $arrayObject,
        ];

        $jsonData = json_encode($response);
        echo $jsonData;
    }   catch (\Exception $e) {
        echo $e->getMessage();
    }
?>