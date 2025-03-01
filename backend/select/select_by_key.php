<?php
    include('../config.php');
    include('../controllers/data_controller.php');
?>
<?php
    $table = $_GET['table'];
    $limit = isset($_GET['limit']) ? $_GET['limit'] : null;
    $page = isset($_GET['page']) ? $_GET['page'] : null;
    $column = isset($_GET['column']) ? $_GET['column'] : "*";
    $requestData = json_decode(file_get_contents('php://input'), true);
    $key = $requestData['key'];
    $value = $requestData['value'];
    $order_by = $requestData['orderBy']? $requestData['orderBy'] : "id";
    
    try {
        $res = json_decode(get_value_by_key($conn, $table, $column, $key, $value, $order_by, $limit, $page), true);
        $response = [
            'id' => $id,
            'table' => $table,
            'column' => $column,
            'request' => $requestData,
            'status' => $res
        ];

        $jsonData = json_encode($response);
        echo $jsonData;
    }   catch (\Exception $e) {
        echo $e->getMessage();
    }
?>