<?php
if ($_FILES['file']['error'] === UPLOAD_ERR_OK) {
    $uploadDir = isset($_GET['uploadDir']) ? $_GET['uploadDir'] : '../../files/'; // Default upload directory
    $filename = $_FILES['file']['name'];
    $tmpFilePath = $_FILES['file']['tmp_name'];

    $targetFilePath = $uploadDir . $filename;
    if (move_uploaded_file($tmpFilePath, $targetFilePath)) {
        $response = [
            'fileName' => $filename,
            'filePath' => $targetFilePath
        ];
        echo json_encode($response);
    } else {
        echo json_encode(['error' => 'Error moving file to destination.' . $tmpFilePath . "->" . $targetFilePath . " = " . file_exists($targetFilePath)]);
    }
} else {
    echo json_encode(['error' => 'File upload failed with error code: ' . $_FILES['file']['error']]);
}
