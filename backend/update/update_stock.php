<?php
include('../config.php');
include('../controllers/stock_controller.php');

$requestData = json_decode(file_get_contents('php://input'), true);
$to_update = $requestData['toUpdate']; 

try {
    $res = update_stock($conn, $to_update);
    $response = [
        'request' => $requestData,
        'status' => $res
    ];
    echo json_encode($response);
} catch (\Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
