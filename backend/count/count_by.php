<?php
// Set header to return JSON
header('Content-Type: application/json');

// Include database configuration (provides $conn)
include('../config.php');
// include('../controllers/data_controller.php'); // ไม่ได้ใช้โดยตรงใน script นี้

// --- Input Parameters ---
$table = isset($_GET['table']) ? trim($_GET['table']) : null;
$count = 0; // Default count

// --- Basic Input Validation ---
if (!$conn) {
    // Log the error for server admin
    error_log("FATAL ERROR in count_by.php: Database connection (\$conn) not established from config.php.");
    // Return a generic error message
    echo json_encode(['error' => 'Server configuration error: Database connection failed.']);
    http_response_code(500); // Internal Server Error
    exit;
}
if (!$table) {
    echo json_encode(['error' => 'Table parameter is required.']);
    http_response_code(400); // Bad Request
    exit;
}

// --- Security: Whitelist allowed table names ---
$allowedTables = ['orders', 'purchase_orders', 'returns', 'stock'];
if (!in_array($table, $allowedTables)) {
    echo json_encode(['error' => 'Invalid or disallowed table specified.']);
    http_response_code(400); // Bad Request
    exit;
}

// --- Build WHERE Clause ---
// Define $sql and $params outside the try block for logging in catch
$sql = "";
$params = [];
try {
    // Ensure PDO is set to throw exceptions (important for catch block)
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $conditions = [];

    // --- Map special conditions ---
    $dateColumnMap = [
        'orders'          => 'order_date',     // *** ตรวจสอบชื่อคอลัมน์นี้ ***
        'purchase_orders' => 'created_at',     // *** ตรวจสอบชื่อคอลัมน์นี้ ***
        'returns'         => 'requested_at', // *** ตรวจสอบชื่อคอลัมน์นี้ ***
    ];

    // Iterate through all GET parameters to build conditions
    foreach ($_GET as $key => $value) {
        if ($key === 'table') {
            continue;
        }
        // Validate parameter key (basic)
        if (!preg_match('/^[a-zA-Z0-9_]+$/', $key)) {
            error_log("Warning: Invalid parameter key received in count_by.php: " . $key);
            continue;
        }

        $paramPlaceholder = ":" . $key;

        // --- Handle Special Conditions ---
        if ($key === 'date' && strtolower($value) === 'today') {
            if (isset($dateColumnMap[$table])) {
                $dateColumn = $dateColumnMap[$table];
                // Use backticks for safety
                $conditions[] = "DATE(`" . $dateColumn . "`) = CURDATE()";
            } else {
                error_log("Warning: 'date=today' filter requested for table '$table' with no defined date column mapping in count_by.php.");
                continue; // Ignore condition if date column unknown
            }
        }
        // --- *** CRITICAL: EDIT THIS STOCK LOGIC *** ---
        elseif ($table === 'stock' && $key === 'level' && strtolower($value) === 'low') {
            // --- Option 1: If you have 'quantity' and 'reorder_level' columns ---
            $conditions[] = "`quantity` <= `reorder_level`"; // *** VERIFY these column names ***
            // --- Option 2: If you have a 'stock_status' column ('in stock', 'low stock', etc.) ---
            // $conditions[] = "`stock_status` = :level_value";
            // $params[':level_value'] = 'low stock'; // *** VERIFY this value ***
            // --- Option 3: If 'low' means quantity <= a fixed number (e.g., 10) ---
            // $conditions[] = "`quantity` <= :low_stock_threshold";
            // $params[':low_stock_threshold'] = 10; // *** VERIFY this threshold ***

            // --- >> CHOOSE AND EDIT ONE of the options above << ---
            // --- >> DELETE the other options and this comment << ---

        }
        // --- Default Condition: column = value ---
        else {
            // Use backticks for safety
            $conditions[] = "`" . $key . "` = " . $paramPlaceholder;
            $params[$paramPlaceholder] = $value;
        }
    }

    // --- Construct the SQL Query ---
    // Use backticks for table name
    $sql = "SELECT COUNT(*) as count FROM `" . $table . "`";
    if (!empty($conditions)) {
        $sql .= " WHERE " . implode(" AND ", $conditions);
    }

    // --- Prepare and Execute Statement ---
    $stmt = $conn->prepare($sql);
    $stmt->execute($params);

    // --- Fetch Result ---
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    $count = ($result !== false) ? (int) $result['count'] : 0;

    // --- Return JSON Response ---
    echo json_encode(['count' => $count]);
} catch (PDOException $e) {
    error_log("Database Error in count_by.php: " . $e->getMessage() . " | SQL: " . $sql . " | Params: " . json_encode($params));
    echo json_encode(['error' => 'Database query failed.', 'count' => 0]); // Return count 0 on error
    http_response_code(500); // Internal Server Error
    exit;
} catch (Exception $e) {
    error_log("General Error in count_by.php: " . $e->getMessage());
    echo json_encode(['error' => 'An unexpected server error occurred.', 'count' => 0]);
    http_response_code(500);
    exit;
}
