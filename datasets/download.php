<?php
if (isset($_GET['pathname'])) {
    $pathname = $_GET['pathname'];

    $filePath = realpath($pathname);

    if (file_exists($filePath) && is_file($filePath)) {
        // Set appropriate headers for file download
        header('Content-Type: application/octet-stream');
        header('Content-Disposition: attachment; filename="' . basename($filePath) . '"');
        header('Content-Length: ' . filesize($filePath));

        // Read the file and output its contents to the response
        readfile($filePath);
        exit;
    } else {
        // File not found or invalid path
        http_response_code(404);
        echo "File not found.";
        exit;
    }
} else {
    // 'pathname' parameter is missing
    http_response_code(400);
    echo "Missing 'pathname' parameter.";
    exit;
}
?>
