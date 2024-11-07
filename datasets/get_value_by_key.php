<?php
    include('config.php');
    include('./controllers/data_controller.php');
?>
<?php
    $table = $_GET['table'];
    $column = isset($_GET['column']) ? $_GET['column'] : "*";
    $requestData = json_decode(file_get_contents('php://input'), true);
    $key = $requestData['key'];
    $value = $requestData['value'];
    
    try {
        $res = get_value_by_key($conn, $table, $column, $key, $value, "id", 1);
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