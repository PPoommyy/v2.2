<?php
    include('../../config.php');
    include('../controllers/data_controller.php');
?>
<?php
    $table = $_GET['table'];
    $requestData = json_decode(file_get_contents('php://input'), true);
    $key = $requestData['key'];
    $value = $requestData['value'];
    
    try {
        $res = delete($conn, $table, $key, $value);
        $response = [
            'request' => $requestData,
            'status' => $res
        ];

        $jsonData = json_encode($response);
        echo $jsonData;
    }   catch (\Exception $e) {
        echo $e->getMessage();
    }
?>