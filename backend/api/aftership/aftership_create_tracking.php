<?php
    include('../../config.php');
    include('../../controllers/data_controller.php');

    function sendRequest($url, $method, $headers, $content) {
        $options = [
            'http' => [
                'method' => $method,
                'header' => $headers,
                'content' => $content,
                'ignore_errors' => true
            ]
        ];
        $context = stream_context_create($options);
        $result = file_get_contents($url, false, $context);
        $responseHeaders = $http_response_header;
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
    $apiHost = "https://api.aftership.com";
    $api_key = "asa";
    $payload = $requestData['payload'];

    try {
        $jsonPayload = json_encode($payload);
        $headers = "as-api-key: $api_key\r\nContent-Type: application/json";
        $response = sendRequest("$apiHost/tracking/2024-07/trackings", 'POST', $headers, $jsonPayload);

        $result = [
            'statusCode' => $response['statusCode'],
            'response' => json_decode($response['body'], true),
            'requestData' => $payload
        ];

        /* $result = [
            'apiHost' => $apiHost,
            'api_key' => $api_key,
            'requestData' => $requestData,
            'payload' => $payload
        ]; */

        echo json_encode($result);
    } catch (Exception $e) {
        $errorResult = [
            'statusCode' => 500,
            'error' => $e->getMessage()
        ];
        echo json_encode($errorResult);
    }
?>