<?php
// ThaiBulkSMS API details
$api_url = 'https://tbs-email-api-gateway.omb.to/email/v1/send_template';
$api_key = 'EMJXnVd5--VcxW6ZfWSwUVdxULMVPq';
$api_secret = 'nERhn1Ye7I7coovI1NTNL9MuKKnmF8';

// Replace with actual UUID of your template
$template_uuid = '24092314-2820-8d99-a046-be37ae7e2dd2';

function sendEmail($email, $title, $firstName, $skuSummary, $emailContent, $buttons, $skuImagePath = null) {
    global $api_url, $api_key, $api_secret, $template_uuid;
    
    // Prepare email parameters
    $OPTION_1 = 'http://localhost/test/work/v2.2/pages/pre_po.php';
    $OPTION_2 = 'http://localhost/test/work/v2.2/pages/pre_po.php';
    $OPTION_3 = 'http://localhost/test/work/v2.2/pages/pre_po.php';
    
    // If the image path is provided, include it, otherwise use a default value or leave it empty
    $OPTION_4 = $skuImagePath ? 'http://localhost/test/work/v2.2/files/' . basename($skuImagePath) : 'No image uploaded';
    
    $emailParams = [
        'template_uuid' => $template_uuid,
        'mail_from' => [
            'email' => 's6404062630511@email.kmutnb.ac.th'
        ],
        'mail_to' => [
            'email' => $email
        ],
        'payload' => [
            'OPTION_1' => $OPTION_1,
            'OPTION_2' => $OPTION_2,
            'OPTION_3' => $OPTION_3,
            'OPTION_4' => $OPTION_4 // Include image path or placeholder
        ],
        'subject' => $title, // Subject line of the email
    ];

    return sendRequest($api_url, $emailParams);
}

function sendRequest($url, $params) {
    global $api_key, $api_secret;

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($params));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Basic ' . base64_encode($api_key . ':' . $api_secret)
    ]);

    // Enable SSL verification
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);

    $response = curl_exec($ch);

    if ($response === false) {
        $error = curl_error($ch);
        curl_close($ch);
        throw new Exception("cURL Error: " . $error);
    }

    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $decodedResponse = json_decode($response, true);

    if ($httpCode !== 201) {
        throw new Exception("HTTP Error: " . $httpCode . ". Response: " . $response);
    }

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("JSON Decode Error: " . json_last_error_msg() . ". Raw response: " . $response);
    }

    return $decodedResponse;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $title = $_POST['title'] ?? '';
    $firstName = $_POST['first_name'] ?? '';
    $email = $_POST['email'] ?? '';
    $buttons = json_decode($_POST['buttons'] ?? '[]', true);
    $skuSummary = $_POST['skuSummary'] ?? '';
    $emailContent = $_POST['emailContent'] ?? '';

    // Initialize upload file path variable
    $uploadFile = null;

    try {
        if (empty($email)) {
            throw new Exception("Email address is missing");
        }

        if (isset($_FILES['png_image']) && $_FILES['png_image']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = '../files/';
            $filename = uniqid() . '.png';
            $uploadFile = $uploadDir . basename($filename);

            // Move the uploaded file to the target directory
            if (move_uploaded_file($_FILES['png_image']['tmp_name'], $uploadFile)) {
                echo json_encode(['success' => true, 'filePath' => $uploadFile]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Failed to move uploaded file.']);
                $uploadFile = null; // Reset uploadFile if the file upload fails
            }
        }

        // Send the email (include the image path if available)
        $response = sendEmail($email, $title, $firstName, $skuSummary, $emailContent, $buttons, $uploadFile);

        if ($response['message_id']) {
            echo json_encode(['success' => true, 'message' => 'Email sent successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Email sending failed: ' . ($response['message'] ?? 'Unknown error'), 'response' => $response]);
        }
    } catch (Exception $e) {
        error_log("Error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Failed to send email: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}
?>