<?php
    include('config.php');
    include('./controllers/data_controller.php');
?>
<?php
    $requestData = json_decode(file_get_contents('php://input'), true);
    $username = $requestData['username'];
    $password = $requestData['password'];
    try {
        $valid_username = check_username($conn, $username);
        $res = check_password($conn, $username, $password);
        $response = [
            'requestData' => $requestData,
            'res' => $res,
            'valid_username' => $valid_username,
            'valid_password' => $res
        ];

        $jsonData = json_encode($response);
        echo $jsonData;
    }   catch (\Exception $e) {
        echo $e->getMessage();
    }
?>