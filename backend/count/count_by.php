<?php
    include('../../config.php');
    include('../controllers/data_controller.php');
    include('../controllers/order_controller.php')
?>
<?php
    $table = isset($_GET['table']) ? $_GET['table'] : "";
    $column = isset($_GET['column']) ? $_GET['column'] : "*";
    $order_by = isset($_GET['order_by']) ? $_GET['order_by'] : "id";

    $table_key = isset($_GET['table_key']) ? $_GET['table_key'] : "";
    $key = isset($_GET['key']) ? $_GET['key'] : "";
    $data_key = isset($_GET['data_key']) ? $_GET['data_key'] : "id";
    $date = isset($_GET['date']) ? $_GET['date'] : "payments_date";
    try {
        $datas = json_decode(get_data($conn, $table, $column, '', [], $order_by), true);
        $arrayObject = array_map(function ($data) use ($conn, $table_key, $key, $data_key, $date) {
            $count_datas = json_decode(count_by($conn, $table_key, $key, $data[$data_key], $date));
            return [
                "details" => $data,
                "count_datas" => $count_datas
            ];
        }, $datas);
        $response = [
            'data' => $arrayObject,
        ];

        $jsonData = json_encode($response);
        echo $jsonData;
    }   catch (\Exception $e) {
        echo $e->getMessage();
    }
?>