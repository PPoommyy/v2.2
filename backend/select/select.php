<?php
    include('../config.php');
    include('../controllers/data_controller.php');
?>
<?php
    $table = $_GET['table'];
    $order_by = isset($_GET['order_by']) ? $_GET['order_by'] : null;
    $limit = isset($_GET['limit']) ? $_GET['limit'] : null;
    $page = isset($_GET['page']) ? $_GET['page'] : null;
    $requestData = json_decode(file_get_contents('php://input'), true);
    $column = $requestData['column'];

    try {
        $res = select($conn, $table, $column, $order_by, $limit, $page);
        $response = [
            'status' => $res
        ];

        $jsonData = json_encode($response);
        echo $jsonData;
    }   catch (\Exception $e) {
        echo $e->getMessage();
    }
?>