<?php
include('../config.php');
include('../controllers/data_controller.php');
?>
<?php
$table = $_GET['table'];
$order_by = isset($_GET['order_by']) ? $_GET['order_by'] : null;
$group_by = isset($_GET['group_by']) ? $_GET['group_by'] : null;
$order_by_type = isset($_GET['order_by_type']) ? $_GET['order_by_type'] : "ASC";
$limit = isset($_GET['limit']) ? $_GET['limit'] : null;
$page = isset($_GET['page']) ? $_GET['page'] : null;
$requestData = json_decode(file_get_contents('php://input'), true);
$column = $requestData['column'];
$join = isset($requestData['join']) ? $requestData['join'] : [[]];
$where = isset($requestData['where']) ? $requestData['where'] : [[]];
$logical_operator = isset($requestData['logical_operator']) ? $requestData['logical_operator'] : "AND";

try {
    $responseData = select($conn, $table, $column, $order_by, $order_by_type, $limit, $page, $join, $where, $logical_operator, $group_by);
    $response = json_decode($responseData, true);
    $response = [
        'status' => $response['result'],
        'query' => $response['query']
    ];

    $jsonData = json_encode($response);
    echo $jsonData;
} catch (\Exception $e) {
    echo $e->getMessage();
}
?>