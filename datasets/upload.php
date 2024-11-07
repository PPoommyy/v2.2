<?php
if ($_FILES['file']['error'] === UPLOAD_ERR_OK) {
    $uploadDir = isset($_GET['uploadDir']) ? $_GET['uploadDir'] : '../files/'; // Default upload directory
    $filename = $_FILES['file']['name'];
    $tmpFilePath = $_FILES['file']['tmp_name'];

    // Move uploaded file to the target directory
    $targetFilePath = $uploadDir . $filename;
    if (move_uploaded_file($tmpFilePath, $targetFilePath)) {
        // File upload successful
        $response = [
            'fileName' => $filename,
            'filePath' => $targetFilePath
        ];
        echo json_encode($response);
    } else {
        // Error moving file to destination
        echo json_encode(['error' => 'Error moving file to destination.' . $tmpFilePath . $targetFilePath]);
    }
} else {
    // File upload failed
    echo json_encode(['error' => 'File upload failed with error code: ' . $_FILES['file']['error']]);
}
?>