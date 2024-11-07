<?php
    include('config.php');
    include('./controllers/test_controller.php');
?>
<?php
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;

    $offset = ($page - 1) * $limit;
    
    try {
        $column_name_query = "
        name, description, is_enabled
        ";
        $table_name_query = "
        currencies
        ";
        $join_table_query = "";
        $where_query = "";
        $order_by_query = "
        ORDER BY name ASC
        ";
        $limit_query = "
        LIMIT $limit
        ";
        $offset_query = "
        OFFSET $offset
        ";

        $currencies = json_decode(select($conn, $column_name_query, $table_name_query, $join_table_query, $where_query, $order_by_query, $limit_query, $offset_query), true);
        $response = [
            'data' => $currencies
        ];

        $jsonData = json_encode($response);
        echo $jsonData;
    }   catch (\Exception $e) {
        echo $e->getMessage();
    }
?>