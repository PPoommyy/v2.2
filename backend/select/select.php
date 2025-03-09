<?php
    include('../config.php');
    include('../controllers/data_controller.php');
?>
<?php
    $table = $_GET['table'];
    $order_by = isset($_GET['order_by']) ? $_GET['order_by'] : null;
    $limit = isset($_GET['limit']) ? $_GET['limit'] : 100;
    $page = isset($_GET['page']) ? $_GET['page'] : 1;
    $requestData = json_decode(file_get_contents('php://input'), true);
    $column = $requestData['column'];
    $join = isset($requestData['join']) ? $requestData['join'] : [[]];
    $where = isset($requestData['where']) ? $requestData['where'] : [[]];
    $logical_operator = isset($requestData['logical_operator']) ? $requestData['logical_operator'] : "AND";

    try {
        $res = json_decode(select($conn, $table, $column, $order_by, $limit, $page, $join, $where, $logical_operator), true);
        $response = [
            'status' => $res
        ];

        $jsonData = json_encode($response);
        echo $jsonData;
    }   catch (\Exception $e) {
        echo $e->getMessage();
    }
?>