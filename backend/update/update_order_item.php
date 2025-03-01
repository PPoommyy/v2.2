<?php
    include('../../config.php');
    include('../controllers/order_controller.php');
?>
<?php
    $requestData = json_decode(file_get_contents('php://input'), true);
    $key = $requestData['key'];
    $value = $requestData['value'];
    $to_update = $requestData['toUpdate'];
    
    try {
        $res = update_order($conn, "orders_skus", $key, $value, $to_update);
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