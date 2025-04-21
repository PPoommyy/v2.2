<?php
include('../config.php');
include('../controllers/data_controller.php');

$data = json_decode(file_get_contents('php://input'), true);
$insertedData = $data['insertedData'];
$table = $data['table'];

if (isset($insertedData['password_hash'])) {
    $insertedData['password_hash'] = password_hash($insertedData['password_hash'], PASSWORD_BCRYPT);
}

try {
    $res = insert($conn, $table, $insertedData);
    $response = [
        'insertedData' => json_encode($insertedData),
        'status' => $res
    ];

    echo json_encode($response);
} catch (Exception $e) {
    echo json_encode([
        'error' => $e->getMessage()
    ]);
}
