<?php
try {
    // Set headers for JSON response
    header('Content-type: application/json');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Cache-Control: post-check=0, pre-check=0', false);
    header('Pragma: no-cache');

    // Database connection details
    $source_db = new PDO("mysql:host=209.97.142.44;dbname=muaythaisp_oc;charset=utf8", 'muaythaisp_test', '65465465fgdgf');
    $target_db = new PDO("mysql:host=localhost;dbname=komsant_om;charset=utf8", 'root', '');
    $source_db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $target_db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Function to generate a unique order_id
    function generateUniqueOrderId($target_db)
    {
        try {
            do {
                $newOrderId = uniqid();

                // Check if the order_id already exists in the target database
                $stmt = $target_db->prepare("SELECT 1 FROM orders WHERE order_id = ? LIMIT 1");
                $stmt->execute([$newOrderId]);
                $orderExists = $stmt->fetchColumn() !== false;
            } while ($orderExists); // Continue looping if the order_id exists

            return $newOrderId;
        } catch (PDOException $e) {
            throw new Exception("Error generating unique order ID: " . $e->getMessage());
        }
    }

    // Function to generate a new time sort value
    function generateNewTimeSort($date)
    {
        // Get latest time sort from target database to ensure continuity
        global $target_db;

        $stmt = $target_db->prepare("SELECT timesort FROM orders WHERE timesort LIKE ? ORDER BY timesort DESC LIMIT 1");
        $stmt->execute([substr($date, 0, 4) . '%']);
        $lastTimeSort = $stmt->fetchColumn();

        $year = substr($date, 0, 2);
        $month = substr($date, 2, 2);

        if ($lastTimeSort) {
            // If we found a time sort with same year/month prefix
            if (substr($lastTimeSort, 0, 4) === $year . $month) {
                // Increment the sequence number
                $seqNum = intval(substr($lastTimeSort, 4)) + 1;
                return $year . $month . str_pad($seqNum, 4, '0', STR_PAD_LEFT);
            }
        }

        // If no matching time sort or different year/month, start a new sequence
        return $year . $month . '0001';
    }

    // Function to format address to ensure consistency
    function formatAddress($orderData)
    {
        $address = [
            'ship_address_1' => !empty($orderData['shipping_address_1']) ? $orderData['shipping_address_1'] : null,
            'ship_address_2' => !empty($orderData['shipping_address_2']) ? $orderData['shipping_address_2'] : null,
            'ship_address_3' => null, // Default empty as source doesn't have this field
            'ship_city' => !empty($orderData['shipping_city']) ? $orderData['shipping_city'] : null,
            'ship_state' => !empty($orderData['shipping_zone']) ? $orderData['shipping_zone'] : null,
            'ship_postal_code' => !empty($orderData['shipping_postcode']) ? $orderData['shipping_postcode'] : null,
            'ship_country' => !empty($orderData['shipping_country']) ?
                (strlen($orderData['shipping_country']) > 2 ? getCountryCode($orderData['shipping_country']) : $orderData['shipping_country']) : null,
            'raw_address' => sprintf(
                "%s %s\n%s\n%s%s\n%s %s\nT. %s\n%s",
                $orderData['shipping_firstname'],
                $orderData['shipping_lastname'],
                $orderData['shipping_address_1'],
                !empty($orderData['shipping_address_2']) ? $orderData['shipping_address_2'] . ' · ' : null,
                $orderData['shipping_city'],
                $orderData['shipping_zone'],
                $orderData['shipping_country'],
                $orderData['telephone'],
                $orderData['email']
            )
        ];

        return $address;
    }

    // Function to get standard 2-letter country code
    function getCountryCode($countryName)
    {
        $countryCodes = [
            'Thailand' => 'TH',
            'United States' => 'US',
            'United Kingdom' => 'GB',
            // Add more country mappings as needed
        ];

        return isset($countryCodes[$countryName]) ? $countryCodes[$countryName] : substr($countryName, 0, 2);
    }

    // Track inserted orders and order items
    $insertedOrders = [];
    $insertedOrderItems = [];

    // Create a cache of existing orders in target DB for faster lookup
    // Use source order_id for our reference key
    $stmt = $target_db->prepare("SELECT source_order_id FROM orders WHERE website_id = 15 AND source_order_id IS NOT NULL");
    $stmt->execute();
    $existingSourceOrderIds = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $existingSourceOrderIds[$row['source_order_id']] = true;
    }

    // Calculate the date 30 days ago
    $thirtyDaysAgo = date('Y-m-d H:i:s', strtotime('-30 days'));

    // Fetch orders from source DB from the last 30 days only
    $stmt = $source_db->prepare("SELECT * FROM oc_order WHERE date_added >= ? ORDER BY date_added DESC");
    $stmt->execute([$thirtyDaysAgo]);
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $processedCount = 0;
    $skippedCount = 0;

    // First, modify the orders table to add a source_order_id column if it doesn't exist
    try {
        $columnCheckStmt = $target_db->prepare("SHOW COLUMNS FROM orders LIKE 'source_order_id'");
        $columnCheckStmt->execute();
        if ($columnCheckStmt->rowCount() === 0) {
            // Add the source_order_id column
            $alterTableStmt = $target_db->prepare("ALTER TABLE orders ADD COLUMN source_order_id varchar(255) DEFAULT NULL");
            $alterTableStmt->execute();
        }
    } catch (PDOException $e) {
        // If we can't add the column, continue without it
        error_log("Could not add source_order_id column: " . $e->getMessage());
    }

    // Process each order from source DB
    foreach ($orders as $order) {
        // Get source order ID (original order_id from muaythaisp_oc)
        $sourceOrderId = $order['order_id'];

        // Check if already exists in the cache of source order IDs
        if ($existingSourceOrderIds[$sourceOrderId]) {
            $skippedCount++;
            continue; // Skip if source_order_id already exists in target_db
        }

        // Generate unique order_id for target system
        $targetOrderId = generateUniqueOrderId($target_db);

        // Format date for timesort
        $orderDate = new DateTime($order['date_added']);
        $yearMonth = $orderDate->format('ym'); // Format: yymm (year and month)
        $newTimeSort = generateNewTimeSort($yearMonth);

        // Format address data
        $addressData = formatAddress($order);

        // Fetch matching currency
        $currency_stmt = $target_db->prepare("SELECT id, name FROM currencies WHERE name = ?");
        $currency_stmt->execute([$order['currency_code']]);
        $currency = $currency_stmt->fetch(PDO::FETCH_ASSOC);

        // If currency doesn't exist, use a default
        $currencyId = $currency ? $currency['id'] : 1; // Default to ID 1 if not found

        // Current date for created/updated timestamps
        $currentDateTime = date('Y-m-d H:i:s');

        // Format buyer name
        $buyerName = trim($order['firstname'] . ' ' . $order['lastname']);
        $recipientName = trim($order['shipping_firstname'] . ' ' . $order['shipping_lastname']);

        // Prepare the order insert statement with all required fields including source_order_id
        $orderInsertQuery = "INSERT INTO orders (
            order_id, source_order_id, payments_date, buyer_email, buyer_name, 
            buyer_phone_number, recipient_name, ship_phone_number, ship_promotion_discount, 
            shipping_fee, ship_address_1, ship_address_2, ship_address_3, 
            ship_city, ship_state, ship_postal_code, ship_country, 
            date_created, date_updated, timesort, order_status_id,
            order_type_id, fulfillment_status, website_id, currency_id,
            payment_method_id, raw_address, order_note
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )";

        $orderInsertStmt = $target_db->prepare($orderInsertQuery);

        // Payment method mapping (adjust as needed)
        $paymentMethodId = 1; // Default
        if (strpos($order['payment_code'], 'bluesnap') !== false) {
            $paymentMethodId = 17; // Assuming 17 is for credit card payments
        }

        // Execute the insert with all required fields and appropriate defaults
        $orderInsertStmt->execute([
            $targetOrderId,
            $sourceOrderId, // Store the original source_order_id for future reference
            $order['date_added'],
            $order['email'] ?? null,
            $buyerName,
            $order['telephone'] ?? null,
            $recipientName,
            $order['telephone'] ?? null,
            0.0, // ship_promotion_discount (default)
            0.0, // shipping_fee (default)
            $addressData['ship_address_1'],
            $addressData['ship_address_2'],
            $addressData['ship_address_3'],
            $addressData['ship_city'],
            $addressData['ship_state'],
            $addressData['ship_postal_code'],
            $addressData['ship_country'],
            $currentDateTime, // date_created
            $currentDateTime, // date_updated
            $newTimeSort,
            1, // order_status_id (default to "Processing")
            1, // order_type_id (default)
            'Processing', // fulfillment_status
            15, // website_id (as specified)
            $currencyId,
            $paymentMethodId,
            $addressData['raw_address'],
            null // order_note (default empty)
        ]);

        // Track this order in our inserted orders array
        $insertedOrders[] = [
            'source_order_id' => $sourceOrderId,
            'target_order_id' => $targetOrderId,
            'buyer_name' => $buyerName,
            'date_added' => $order['date_added']
        ];

        // Now process order items from oc_order_product
        $orderItemsStmt = $source_db->prepare("SELECT op.*, p.model AS product_model 
                                              FROM oc_order_product op 
                                              LEFT JOIN oc_product p ON op.product_id = p.product_id 
                                              WHERE op.order_id = ?");
        $orderItemsStmt->execute([$sourceOrderId]);
        $orderItems = $orderItemsStmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($orderItems as $item) {
            // Use model from oc_product if available, otherwise use item model
            $productModel = !empty($item['product_model']) ? $item['product_model'] : $item['model'];

            // Check if the product model matches any sku_settings.order_product_sku
            $skuSettingsStmt = $target_db->prepare("SELECT id FROM sku_settings WHERE order_product_sku = ?");
            $skuSettingsStmt->execute([$productModel]);
            $skuSettings = $skuSettingsStmt->fetch(PDO::FETCH_ASSOC);

            if ($skuSettings) {
                // Create a unique_id using order_id and sku_settings_id
                $uniqueId = $targetOrderId . ',' . $skuSettings['id'];

                // Prepare insert statement for order items
                $orderSkuInsertStmt = $target_db->prepare("INSERT INTO orders_skus (
                    unique_id, order_id, order_item_id, sku_settings_id, 
                    item_price, shipping_price, total, quantity_purchased, 
                    is_amazon, date_created, product_status_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

                // Execute with proper values
                $orderSkuInsertStmt->execute([
                    $uniqueId,
                    $targetOrderId,
                    $skuSettings['id'],
                    $skuSettings['id'], // sku_settings_id
                    $item['price'],
                    0.0, // shipping_price (default)
                    $item['total'],
                    $item['quantity'],
                    1, // is_amazon (default to 0 for website orders)
                    $currentDateTime, // date_created
                    1  // product_status_id (default)
                ]);

                // Track this order item in our inserted items array
                $insertedOrderItems[] = [
                    'source_order_id' => $sourceOrderId,
                    'target_order_id' => $targetOrderId,
                    'product_model' => $productModel,
                    'sku_settings_id' => $skuSettings['id'],
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                    'total' => $item['total']
                ];
            }
        }

        $processedCount++;

        // Add to our cache to prevent duplicates in the current batch
        $existingSourceOrderIds[$sourceOrderId] = true;
    }

    // Response after successful insert
    echo json_encode([
        'success' => true,
        'message' => "Orders transfer completed: $processedCount orders processed, $skippedCount orders skipped (already exist)",
        'processed_count' => $processedCount,
        'skipped_count' => $skippedCount,
        'inserted_orders' => $insertedOrders,
        'inserted_order_items' => $insertedOrderItems
    ]);
} catch (PDOException $e) {
    // Handle error and return as JSON
    echo json_encode([
        'error' => true,
        'message' => "Connection failed: " . $e->getMessage()
    ]);
} catch (Exception $e) {
    // Handle general exceptions
    echo json_encode([
        'error' => true,
        'message' => "Error: " . $e->getMessage()
    ]);
}
