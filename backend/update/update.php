<?php
    include('../../config.php');
    include('../controllers/data_controller.php');
?>
<?php
    $table = $_GET['table'];
    $requestData = json_decode(file_get_contents('php://input'), true);
    $key = $requestData['key'];
    $value = $requestData['value'];
    $to_update = $requestData['toUpdate'];
    
    try {
        $res = update($conn, $table, $key, $value, $to_update);
        $response = [
            'request' => $requestData,
            'status' => $res
        ];
        echo json_encode($response);
    }   catch (\Exception $e) {
        echo $e->getMessage();
    }
?>