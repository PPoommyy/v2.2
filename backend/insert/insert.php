<?php
    include('../config.php');
    include('../controllers/data_controller.php');
?>
<?php
    $data = json_decode(file_get_contents('php://input'), true);

    $insertedData = $data['insertedData'];
    $table = $data['table'];
    try {
        $res = insert($conn, $table, $insertedData);
        $response = [
            'insertedData' => json_encode($insertedData),
            'status' => $res
        ];

        $jsonData = json_encode($response);
        echo $jsonData;
    }   catch (\Exception $e) {
        echo $e->getMessage();
    }
?>