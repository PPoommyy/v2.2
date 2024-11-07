<?php

// Specify the path to your Excel file
$file_name = $_GET['fileName'];
$file_path = '../reports/' . $file_name;

// Check if the file exists
if (file_exists($file_path)) {
    // Set the content type header to indicate that the response is a file
    header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet; charset=utf-8');

    // Set the content disposition header to specify the file name
    header('Content-Disposition: attachment; filename="' . $file_name . '"');

    // Read the file content and echo it back as the response
    readfile($file_path);
} else {
    // If the file doesn't exist, return an error response
    http_response_code(404);
    echo 'File not found.';
}

?>