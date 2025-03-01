<?php
include('../../config.php');
include('../../controllers/data_controller.php');

function getBlob($url) {
    $options = [
        'http' => [
            'method' => 'GET',
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
        'body' => $result
    ];
}
$requestData = json_decode(file_get_contents('php://input'), true);
$fileUrl = $requestData['fileUrl'];
try {
    $response = getBlob($fileUrl);
    if ($response['statusCode'] == 200) {
        header("Content-Type: application/pdf");
        header("Content-Length: " . strlen($response['body']));
        header("Content-Disposition: inline; filename=label.pdf");
        echo $response['body'];
    } else {
        header("Content-Type: application/json");
        $result = [
            'statusCode' => $response['statusCode'],
            'error' => "Failed to retrieve file. Status code: " . $response['statusCode']
        ];
        echo json_encode($result);
    }
} catch (Exception $e) {
    header("Content-Type: application/json");
    $errorResult = [
        'statusCode' => 500,
        'error' => $e->getMessage()
    ];
    echo json_encode($errorResult);
}
?>