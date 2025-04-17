<?php
if (isset($_GET['pathname'])) {
    $pathname = $_GET['pathname'];

    $filePath = realpath($pathname);

    if (file_exists($filePath) && is_file($filePath)) {
        header('Content-Type: application/octet-stream');
        header('Content-Disposition: attachment; filename="' . basename($filePath) . '"');
        header('Content-Length: ' . filesize($filePath));

        readfile($filePath);
        exit;
    } else {
        http_response_code(404);
        echo "File not found.";
        exit;
    }
} else {
    http_response_code(400);
    echo "Missing 'pathname' parameter.";
    exit;
}
