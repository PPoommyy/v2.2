<?php
// ThaiBulkSMS API details
$api_url = 'https://tbs-email-api-gateway.omb.to/email/v1/send_template';
$api_key = 'EMJXnVd5--VcxW6ZfWSwUVdxULMVPq';
$api_secret = 'nERhn1Ye7I7coovI1NTNL9MuKKnmF8';

// UUID ของ Template อีเมล
$template_uuid = '24092314-2820-8d99-a046-be37ae7e2dd2';

function sendEmail($email, $title, $body, $buttons, $pdfUrl, $pngUrl) {
    global $api_url, $api_key, $api_secret, $template_uuid;

    // ตรวจสอบว่า URL เป็น absolute URL แล้ว
    if (!filter_var($pdfUrl, FILTER_VALIDATE_URL)) {
        throw new Exception("Invalid PDF URL: " . $pdfUrl);
    }
    if (!filter_var($pngUrl, FILTER_VALIDATE_URL)) {
        throw new Exception("Invalid PNG URL: " . $pngUrl);
    }

    $emailParams = [
        'template_uuid' => $template_uuid,
        'mail_from' => ['email' => 's6404062630511@email.kmutnb.ac.th'],
        'mail_to' => ['email' => $email],
        'payload' => [
            'OPTION_1' => 'http://localhost/test/work/v2.2/pages/pre_po.php',
            'OPTION_2' => 'http://localhost/test/work/v2.2/pages/pre_po.php',
            'OPTION_3' => $pdfUrl,
            'OPTION_4' => $pngUrl
        ],
        'subject' => $title,
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

    $response = curl_exec($ch);

    if ($response === false) {
        throw new Exception("cURL Error: " . curl_error($ch));
    }

    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $decodedResponse = json_decode($response, true);

    if ($httpCode !== 201) {
        throw new Exception("HTTP Error: " . $httpCode . ". Response: " . $response);
    }

    return $decodedResponse;
}

// รับค่า POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $title = $_POST['title'] ?? '';
    $email = $_POST['email'] ?? '';
    $buttons = json_decode($_POST['buttons'] ?? '[]', true);
    $pdfUrl = $_POST['pdf_url'] ?? '';
    $pngUrl = $_POST['png_url'] ?? '';

    try {
        if (empty($email)) {
            throw new Exception("Email address is missing");
        }

        // ส่งอีเมลพร้อมลิงก์ไฟล์แนบ
        $response = sendEmail($email, $title, '', $buttons, $pdfUrl, $pngUrl);

        if ($response['message_id']) {
            echo json_encode(['success' => true, 'message' => 'Email sent successfully', 'request' => $pdfUrl . "\n" . $pngUrl]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Email sending failed', 'response' => $response]);
        }
    } catch (Exception $e) {
        error_log("Error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Failed to send email: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}
?>