<?php
$api_url = 'https://tbs-email-api-gateway.omb.to/email/v1/send_template';
$api_key = '...';
$api_secret = '...';

$template_uuid = '...';

function sendEmail($title, $email, $pdfUrl, $pngUrl, $accept_url, $cancel_url)
{
    global $api_url, $api_key, $api_secret, $template_uuid;

    $emailParams = [...];

    return sendRequest($api_url, $emailParams);
}

function sendRequest($url, $params)
{
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
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $decodedResponse = json_decode($response, true);
    return $decodedResponse;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $title = $_POST['title'] ?? '';
    $accept_url = $_POST['accept_url'] ?? '';
    $cancle_url = $_POST['cancle_url'] ?? '';
    $email = $_POST['email'] ?? '';
    $pdfUrl = $_POST['pdf_url'] ?? '';
    $pngUrl = $_POST['png_url'] ?? '';
    try {
        $response = sendEmail($title, $email, $pdfUrl, $pngUrl, $accept_url, $cancle_url);