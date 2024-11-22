<?php
    include('config.php');
    include('./controllers/data_controller.php');

    function sendRequest($url, $method, $headers, $content) {
        $options = [
            'http' => [
                'method' => $method,
                'header' => $headers,
                'content' => $content,
                'ignore_errors' => true // This allows us to get the response even if it's an error
            ]
        ];

        $context = stream_context_create($options);
        $result = file_get_contents($url, false, $context);

        // Get the response headers
        $responseHeaders = $http_response_header;

        // Get the HTTP status code
        $statusCode = 0;
        if (is_array($responseHeaders)) {
            $parts = explode(' ', $responseHeaders[0]);
            if (count($parts) > 1) {
                $statusCode = intval($parts[1]);
            }
        }

        return [
            'statusCode' => $statusCode,
            'headers' => $responseHeaders,
            'body' => $result
        ];
    }

    $requestData = json_decode(file_get_contents('php://input'), true);
    $apiHost = "https://dpostinter.thailandpost.com";
    //$apiHost = "https://dpinterapi.thailandpost.com";
    /* $urlencoded = http_build_query([
        'username' => 'testuser1',
        'password' => '12345',
        'grant_type' => 'password'
    ]); */
    $urlencoded = http_build_query([
        'username' => 'boxsense',
        'password' => 'QUEBECpost',
        'grant_type' => 'password'
    ]);


    try {
        $headers = "Content-Type: application/x-www-form-urlencoded";

        $response = sendRequest("$apiHost/api/token", 'POST', $headers, $urlencoded);

        $result = [
            'statusCode' => $response['statusCode'],
            'response' => json_decode($response['body'], true)
        ];

        echo json_encode($result);
    } catch (Exception $e) {
        $errorResult = [
            'statusCode' => 500,
            'error' => $e->getMessage()
        ];
        echo json_encode($errorResult);
    }
?>