<?php

// Specify the path to your file
$file_name = $_GET['fileName'];
$file_path = '../reports/' . $file_name;

// Check if the file exists
if (file_exists($file_path)) {
    // Get the file extension
    $file_extension = pathinfo($file_path, PATHINFO_EXTENSION);

    // Determine the correct content type and headers based on file type
    switch (strtolower($file_extension)) {
        case 'xlsx':
            header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet; charset=utf-8');
            header('Content-Disposition: attachment; filename="' . $file_name . '"');
            break;

        case 'csv':
            header('Content-Type: text/csv; charset=utf-8');
            header('Content-Disposition: attachment; filename="' . $file_name . '"');
            break;

        default:
            http_response_code(400); // Bad Request
            echo 'Unsupported file format.';
            exit;
    }

    // Read the file content and echo it back as the response
    readfile($file_path);
} else {
    // If the file doesn't exist, return an error response
    http_response_code(404);
    echo 'File not found.';
}
?>