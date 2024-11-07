<?php
    include('config.php');
    include('./controllers/test_controller.php');
    include('./controllers/data_controller.php')
?>
<?php
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;

    $offset = ($page - 1) * $limit;
    
    try {
        $countries = json_decode(get_country_list($conn, $limit, $offset), true);
        $currencies = json_decode(get_currency_list($conn), true);
        $service_methods = json_decode(select($conn, 'service_methods', ["id", "name"], "id", $limit, $offset));
        $order_types = json_decode(select($conn, 'order_types', ["id", "name"], "id", $limit, $offset));

        $count = json_decode(get_country_list_count($conn), true);
        $response = [
            'count' => $count[0]['count'],
            'data' => $countries,
            'currencies' => $currencies,
            'service_methods' => $service_methods,
            'order_types' => $order_types
        ];

        $jsonData = json_encode($response);
        echo $jsonData;
    }   catch (\Exception $e) {
        echo $e->getMessage();
    }
?>