<?php
try {
    // --- Headers ---
    header('Content-type: application/json');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Cache-Control: post-check=0, pre-check=0', false);
    header('Pragma: no-cache');

    // --- Target DB Connection ---
    $target_db = new PDO("mysql:host=103.13.231.64;dbname=komsant_test;charset=utf8mb4", 'komsant', 'ktest347#');
    $target_db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // --- Helper Functions ---
    function generateUniqueOrderId($target_db_conn)
    {
        try {
            do {
                // Generate a more robust unique ID, uniqid() can have collisions in high concurrency
                $newOrderId = bin2hex(random_bytes(12)); // Generates a 24-character hex string
                $stmt = $target_db_conn->prepare("SELECT 1 FROM orders WHERE order_id = ? LIMIT 1");
                $stmt->execute([$newOrderId]);
                $orderExists = $stmt->fetchColumn() !== false;
            } while ($orderExists);
            return $newOrderId;
        } catch (PDOException $e) {
            error_log("PDOException in generateUniqueOrderId: " . $e->getMessage());
            throw new Exception("Error generating unique order ID: " . $e->getMessage());
        } catch (Exception $e) { // Catch other exceptions like from random_bytes
            error_log("Exception in generateUniqueOrderId: " . $e->getMessage());
            throw new Exception("Error generating unique order ID (general): " . $e->getMessage());
        }
    }

    function generateNewTimeSort($date_year_month, $target_db_conn)
    {
        try {
            $stmt = $target_db_conn->prepare("SELECT timesort FROM orders WHERE timesort LIKE ? ORDER BY timesort DESC LIMIT 1");
            // $date_year_month should be in 'ym' format e.g., '2311' for Nov 2023
            $stmt->execute([$date_year_month . '%']);
            $lastTimeSort = $stmt->fetchColumn();

            if ($lastTimeSort && substr($lastTimeSort, 0, 4) === $date_year_month) {
                $seqNum = intval(substr($lastTimeSort, 4)) + 1;
                return $date_year_month . str_pad($seqNum, 4, '0', STR_PAD_LEFT);
            }
            return $date_year_month . '0001';
        } catch (PDOException $e) {
            error_log("PDOException in generateNewTimeSort: " . $e->getMessage());
            throw new Exception("Error generating new timesort: " . $e->getMessage());
        }
    }

    function formatAddress($orderData, $target_db_conn)
    {
        $firstName = isset($orderData['shipping_firstname']) ? trim($orderData['shipping_firstname']) : '';
        $lastName = isset($orderData['shipping_lastname']) ? trim($orderData['shipping_lastname']) : '';
        $fullName = trim($firstName . ' ' . $lastName);

        $address1 = isset($orderData['shipping_address_1']) ? trim($orderData['shipping_address_1']) : '';
        $address2 = isset($orderData['shipping_address_2']) ? trim($orderData['shipping_address_2']) : '';

        $fullAddressLine = $address1;
        // Append address2 only if it's not empty and different from address1 to avoid duplication
        if (!empty($address2) && strtolower($address1) != strtolower($address2)) {
            // Check if address1 already contains address2 (common in some systems)
            if (stripos($address1, $address2) === false) {
                $fullAddressLine .= ', ' . $address2;
            }
        }


        $city = isset($orderData['shipping_city']) ? trim($orderData['shipping_city']) : '';
        $postcode = isset($orderData['shipping_postcode']) ? trim($orderData['shipping_postcode']) : '';
        $cityPostcodeLine = $city;
        if (!empty($postcode)) {
            $cityPostcodeLine .= (empty($city) ? '' : ' · ') . $postcode;
        }

        $zone = isset($orderData['shipping_zone']) ? trim($orderData['shipping_zone']) : '';
        $countryNameFromSource = isset($orderData['shipping_country']) ? trim($orderData['shipping_country']) : '';
        $zoneCountryLine = $zone;
        if (!empty($countryNameFromSource)) {
            $zoneCountryLine .= (empty($zone) ? '' : ' · ') . $countryNameFromSource;
        }

        $telephone = isset($orderData['telephone']) ? trim($orderData['telephone']) : '';
        $email = isset($orderData['email']) ? trim($orderData['email']) : '';

        $raw_address_parts = [];
        if (!empty($fullName)) $raw_address_parts[] = $fullName;
        if (!empty($fullAddressLine)) $raw_address_parts[] = $fullAddressLine;
        if (!empty($cityPostcodeLine)) $raw_address_parts[] = $cityPostcodeLine;
        if (!empty($zoneCountryLine)) $raw_address_parts[] = $zoneCountryLine;
        if (!empty($telephone)) $raw_address_parts[] = 'T. ' . $telephone;
        if (!empty($email)) $raw_address_parts[] = $email;

        $rawAddress = implode("\n", $raw_address_parts);

        return array(
            'ship_address_1' => $address1,
            'ship_address_2' => $address2,
            'ship_address_3' => null,
            'ship_city' => $city,
            'ship_state' => $zone,
            'ship_postal_code' => $postcode,
            'ship_country' => getCountryCode($countryNameFromSource, $target_db_conn),
            'raw_address' => $rawAddress
        );
    }

    function getCountryCode($countryName, $target_db_conn)
    {
        if (empty($countryName)) return 'TH'; // Default if empty

        // Attempt to lookup in a mapping table in target_db first (RECOMMENDED)
        try {
            // Assuming you have a table like 'country_codes_mapping' with 'name' and 'iso_code_2'
            $stmt = $target_db_conn->prepare("SELECT iso_code_2 FROM country_codes_mapping WHERE LOWER(name) = LOWER(?) LIMIT 1");
            $stmt->execute([$countryName]);
            $code = $stmt->fetchColumn();
            if ($code) {
                return $code;
            }
        } catch (PDOException $e) {
            error_log("DB Error looking up country code for '$countryName': " . $e->getMessage());
        }

        // Fallback to static map for common cases
        $staticCountryCodes = [
            'thailand' => 'TH',
            'united states' => 'US',
            'usa' => 'US',
            'united kingdom' => 'GB',
            'uk' => 'GB',
            'great britain' => 'GB',
            'france' => 'FR',
            'japan' => 'JP',
            'china' => 'CN',
            'australia' => 'AU',
            'canada' => 'CA',
            'germany' => 'DE',
            // Add more as needed
        ];
        $lcCountryName = strtolower($countryName);
        if (isset($staticCountryCodes[$lcCountryName])) {
            return $staticCountryCodes[$lcCountryName];
        }

        // If it's already a 2-letter code
        if (strlen($countryName) === 2 && ctype_alpha($countryName)) {
            return strtoupper($countryName);
        }

        error_log("Country name '$countryName' not mapped to a 2-letter code. Defaulting to TH.");
        return 'TH'; // Default fallback
    }

    // --- Main Processing Logic ---
    $websiteStmt = $target_db->query("SELECT * FROM website_database");
    $websites = $websiteStmt->fetchAll(PDO::FETCH_ASSOC);
    $summary = array();

    foreach ($websites as $site) {
        $currentSiteProcessed = 0;
        $currentSiteSkipped = 0;
        $currentSiteErrors = 0;
        $errorMessages = [];

        try {
            error_log("Processing website ID: " . $site['website_id'] . ", Name: " . $site['db_name']);
            $source_db = new PDO(
                "mysql:host=" . $site['db_host'] . ";dbname=" . $site['db_name'] . ";charset=utf8mb4",
                $site['db_user'],
                $site['db_password']
            );
            $source_db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

            // Check for source_order_id column (keep this)
            // ... 

            $existingStmt = $target_db->prepare("SELECT source_order_id FROM orders WHERE website_id = ? AND source_order_id IS NOT NULL");
            $existingStmt->execute([$site['website_id']]);
            $existingSourceOrderIds = $existingStmt->fetchAll(PDO::FETCH_COLUMN); // More efficient
            $existingSourceOrderIds = array_flip($existingSourceOrderIds); // Use keys for faster lookup


            $thirtyDaysAgo = date('Y-m-d H:i:s', strtotime('-' . intval($site['retreive_period']) . ' days'));
            $ordersStmt = $source_db->prepare("
                SELECT o.*, 
                       oc.name AS shipping_country_from_oc, 
                       oz.name AS shipping_zone_from_oc
                FROM oc_order o
                LEFT JOIN oc_country oc ON o.shipping_country_id = oc.country_id
                LEFT JOIN oc_zone oz ON o.shipping_zone_id = oz.zone_id
                WHERE o.date_added >= ? AND o.order_status_id IN (1,2,3)  -- Adjust order_status_id as needed
                ORDER BY o.date_added DESC
            "); // Consider adding a LIMIT here for testing, e.g., LIMIT 10
            $ordersStmt->execute([$thirtyDaysAgo]);

            while ($order = $ordersStmt->fetch(PDO::FETCH_ASSOC)) {
                if (isset($existingSourceOrderIds[$order['order_id']])) {
                    $currentSiteSkipped++;
                    continue;
                }

                // --- Start Transaction for this order ---
                $target_db->beginTransaction();
                try {
                    $targetOrderId = generateUniqueOrderId($target_db);
                    $orderDate = new DateTime($order['date_added']);
                    $yearMonthForTimesort = $orderDate->format('ym');
                    $newTimeSort = generateNewTimeSort($yearMonthForTimesort, $target_db);

                    $addressOrderData = [
                        'shipping_firstname' => $order['shipping_firstname'],
                        'shipping_lastname'  => $order['shipping_lastname'],
                        'shipping_address_1' => $order['shipping_address_1'],
                        'shipping_address_2' => $order['shipping_address_2'],
                        'shipping_city'      => $order['shipping_city'],
                        'shipping_postcode'  => $order['shipping_postcode'],
                        'shipping_zone'      => $order['shipping_zone_from_oc'] ?: $order['shipping_zone'],
                        'shipping_country'   => $order['shipping_country_from_oc'] ?: $order['shipping_country'],
                        'telephone'          => $order['telephone'],
                        'email'              => $order['email']
                    ];
                    $addressData = formatAddress($addressOrderData, $target_db);

                    $currencyStmt = $target_db->prepare("SELECT id FROM currencies WHERE LOWER(name) = LOWER(?) OR LOWER(description) = LOWER(?) LIMIT 1");
                    $currencyStmt->execute([$order['currency_code'], $order['currency_code']]);
                    $currency = $currencyStmt->fetch(PDO::FETCH_ASSOC);
                    $currencyId = $currency ? $currency['id'] : 1; // Default to 1 (e.g., USD or THB)
                    if (!$currency) {
                        error_log("Currency code '{$order['currency_code']}' not found for source order ID {$order['order_id']} from {$site['db_name']}. Defaulting to ID 1.");
                    }

                    // Determine payment_method_id (This logic might need to be more robust)
                    $paymentMethodId = 1; // Default
                    if (stripos($order['payment_method'], 'PayPal') !== false) $paymentMethodId = 2; // Example
                    else if (stripos($order['payment_code'], 'bluesnap') !== false) $paymentMethodId = 17;
                    // Add more mappings or a dedicated mapping function/table

                    $buyerName = trim($order['firstname'] . ' ' . $order['lastname']);
                    $recipientName = trim($order['shipping_firstname'] . ' ' . $order['shipping_lastname']);
                    $currentDateTime = date('Y-m-d H:i:s');

                    $orderInsert = $target_db->prepare("INSERT INTO orders (
                        order_id, source_order_id, payments_date, buyer_email, buyer_name, 
                        buyer_phone_number, recipient_name, ship_phone_number, ship_promotion_discount, 
                        shipping_fee, ship_address_1, ship_address_2, ship_address_3, ship_city, 
                        ship_state, ship_postal_code, ship_country, date_created, date_updated, 
                        timesort, order_status_id, order_type_id, website_id, 
                        currency_id, payment_method_id, override_address, raw_address, order_note
                    ) VALUES (
                        :order_id, :source_order_id, :payments_date, :buyer_email, :buyer_name, 
                        :buyer_phone_number, :recipient_name, :ship_phone_number, :ship_promotion_discount, 
                        :shipping_fee, :ship_address_1, :ship_address_2, :ship_address_3, :ship_city, 
                        :ship_state, :ship_postal_code, :ship_country, :date_created, :date_updated, 
                        :timesort, :order_status_id, :order_type_id, :website_id, 
                        :currency_id, :payment_method_id, :override_address, :raw_address, :order_note
                    )");
                    $orderInsert->execute([
                        ':order_id' => $targetOrderId,
                        ':source_order_id' => $order['order_id'],
                        ':payments_date' => $order['date_added'],
                        ':buyer_email' => $order['email'],
                        ':buyer_name' => $buyerName,
                        ':buyer_phone_number' => $order['telephone'],
                        ':recipient_name' => $recipientName,
                        ':ship_phone_number' => $order['telephone'], // Assuming same as buyer phone
                        ':ship_promotion_discount' => $order['coupon_discount_amount'] ? $order['coupon_discount_amount'] : 0.00, // Example, adjust field name
                        ':shipping_fee' => $order['shipping_cost'] ? $order['shipping_cost'] : 0.00, // Example, adjust field name
                        ':ship_address_2' => $addressData['ship_address_2'],
                        ':ship_address_3' => $addressData['ship_address_3'],
                        ':ship_city' => $addressData['ship_city'],
                        ':ship_state' => $addressData['ship_state'],
                        ':ship_postal_code' => $addressData['ship_postal_code'],
                        ':ship_country' => $addressData['ship_country'],
                        ':date_created' => $currentDateTime,
                        ':date_updated' => $currentDateTime,
                        ':timesort' => $newTimeSort,
                        // Map order_status_id from source to target
                        // Example: OpenCart Processing (2) -> Target Processing (e.g., 1 or your equivalent)
                        // OpenCart Pending (1) -> Target Pending Review (e.g., 6)
                        // This needs careful mapping based on your status IDs
                        ':order_status_id' => ($order['order_status_id'] == 2 || $order['order_status_id'] == 3) ? 1 : (($order['order_status_id'] == 1) ? 6 : 7), // Example mapping
                        ':order_type_id' => 1, // Default order type, adjust if needed
                        ':website_id' => $site['website_id'],
                        ':currency_id' => $currencyId,
                        ':payment_method_id' => $paymentMethodId,
                        ':override_address' => null, // Or logic to determine this
                        ':raw_address' => $addressData['raw_address'],
                        ':order_note' => $order['comment'] ? $order['comment'] : null // Import order comment as note
                    ]);

                    $itemStmt = $source_db->prepare("
                        SELECT op.*, p.model AS product_model, p.manufacturer_id, p.price AS product_base_price
                        FROM oc_order_product op 
                        LEFT JOIN oc_product p ON op.product_id = p.product_id 
                        WHERE op.order_id = ?
                    ");
                    $itemStmt->execute([$order['order_id']]);
                    $items = $itemStmt->fetchAll(PDO::FETCH_ASSOC);

                    foreach ($items as $item) {
                        $originalProductModel = !empty($item['product_model']) ? trim($item['product_model']) : trim($item['model']);
                        if (empty($originalProductModel)) {
                            error_log("Skipping item with empty model/SKU for source order_id {$order['order_id']}, product_id {$item['product_id']} from {$site['db_name']}");
                            continue; // Skip item if no base SKU
                        }
                        $finalProductSku = $originalProductModel;

                        $optionStmt = $source_db->prepare("
                            SELECT name, value FROM oc_order_option 
                            WHERE order_id = ? AND order_product_id = ?
                        ");
                        $optionStmt->execute([$order['order_id'], $item['order_product_id']]);
                        $productOptions = $optionStmt->fetchAll(PDO::FETCH_ASSOC);

                        foreach ($productOptions as $option) {
                            if (stripos($option['name'], 'Size') !== false || stripos($option['name'], 'ไซส์') !== false) {
                                $sizeValue = trim($option['value']);
                                if (!empty($sizeValue)) {
                                    $finalProductSku .= '-' . preg_replace('/[^a-zA-Z0-9\-\_]/', '', $sizeValue); // Sanitize size value
                                }
                            }
                        }

                        $skuStmt = $target_db->prepare("SELECT id, sku_brand_id FROM sku_settings WHERE LOWER(order_product_sku) = LOWER(?)");
                        $skuStmt->execute([$finalProductSku]);
                        $skuTarget = $skuStmt->fetch(PDO::FETCH_ASSOC);
                        $skuIdInTarget = null;

                        if ($skuTarget) {
                            $skuIdInTarget = $skuTarget['id'];
                        } else {
                            $brandIdInTarget = 1; // Default Brand ID
                            if (!empty($item['manufacturer_id'])) {
                                $manufacturerStmt = $source_db->prepare("SELECT name FROM oc_manufacturer WHERE manufacturer_id = ?");
                                $manufacturerStmt->execute([$item['manufacturer_id']]);
                                $manufacturer = $manufacturerStmt->fetch(PDO::FETCH_ASSOC);

                                if ($manufacturer && !empty($manufacturer['name'])) {
                                    $sourceBrandName = trim($manufacturer['name']);
                                    $targetBrandStmt = $target_db->prepare("SELECT id FROM sku_brands WHERE LOWER(name) = LOWER(?) LIMIT 1");
                                    $targetBrandStmt->execute([$sourceBrandName]);
                                    $targetBrand = $targetBrandStmt->fetch(PDO::FETCH_ASSOC);
                                    if ($targetBrand) {
                                        $brandIdInTarget = $targetBrand['id'];
                                    } else {
                                        // Requirement 1: Insert new brand if not found
                                        error_log("Brand '{$sourceBrandName}' not found in sku_brands. Inserting for SKU: {$finalProductSku} from {$site['db_name']}");
                                        $insertBrandStmt = $target_db->prepare("INSERT INTO sku_brands (name) VALUES (?)");
                                        $insertBrandStmt->execute([$sourceBrandName]);
                                        $brandIdInTarget = $target_db->lastInsertId();
                                        if (!$brandIdInTarget) {
                                            error_log("Failed to insert new brand '{$sourceBrandName}' for SKU: {$finalProductSku}. Defaulting brand.");
                                            $brandIdInTarget = 1; // Fallback default
                                        }
                                    }
                                }
                            }

                            $skuInsert = $target_db->prepare("
                                INSERT INTO sku_settings 
                                    (order_product_sku, report_product_name, warehouse_id, warehouse_sku_id, sku_brand_id, min_quantity, enable_low_stock_alert, date_created, date_updated) 
                                VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                            ");
                            $skuInsert->execute([
                                $finalProductSku,
                                trim($item['name']),
                                1,
                                1,
                                $brandIdInTarget,
                                0,
                                1
                            ]);
                            $skuIdInTarget = $target_db->lastInsertId();
                            if (!$skuIdInTarget) {
                                throw new Exception("Failed to insert new SKU '{$finalProductSku}' into sku_settings.");
                            }
                        }

                        $uniqueId = $targetOrderId . ',' . $skuIdInTarget;
                        $orderSkuInsert = $target_db->prepare("INSERT INTO orders_skus (
                            unique_id, order_id, order_item_id, sku_settings_id, 
                            item_price, shipping_price, total, quantity_purchased, product_status_id
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
                        $orderSkuInsert->execute([
                            $uniqueId,
                            $targetOrderId,
                            $item['order_product_id'], // Use source order_product_id as order_item_id
                            $skuIdInTarget,
                            $item['price'],
                            0.00,
                            $item['total'],
                            $item['quantity'],
                            1 // Default product_status_id
                        ]);
                    }
                    $target_db->commit(); // Commit transaction for this successful order
                    $currentSiteProcessed++;
                    $existingSourceOrderIds[$order['order_id']] = true;
                } catch (PDOException $e) {
                    $target_db->rollBack(); // Rollback on error for this specific order
                    $currentSiteErrors++;
                    $errorMessage = "PDOException for source order ID {$order['order_id']} from {$site['db_name']}: " . $e->getMessage();
                    error_log($errorMessage);
                    $errorMessages[] = $errorMessage;
                } catch (Exception $e) {
                    $target_db->rollBack();
                    $currentSiteErrors++;
                    $errorMessage = "Exception for source order ID {$order['order_id']} from {$site['db_name']}: " . $e->getMessage();
                    error_log($errorMessage);
                    $errorMessages[] = $errorMessage;
                }
            } // End foreach $orders
            $summary[] = ['website_id' => $site['website_id'], 'db_name' => $site['db_name'], 'processed' => $currentSiteProcessed, 'skipped' => $currentSiteSkipped, 'errors' => $currentSiteErrors, 'error_details' => $errorMessages];
        } catch (PDOException $e) {
            $errorMessage = "PDOException connecting to or querying source DB {$site['db_name']}: " . $e->getMessage();
            error_log($errorMessage);
            $summary[] = ['website_id' => $site['website_id'], 'db_name' => $site['db_name'], 'error' => $errorMessage, 'processed' => 0, 'skipped' => 0, 'errors' => 'N/A'];
        } catch (Exception $e) {
            $errorMessage = "General Exception for site {$site['db_name']}: " . $e->getMessage();
            error_log($errorMessage);
            $summary[] = ['website_id' => $site['website_id'], 'db_name' => $site['db_name'], 'error' => $errorMessage, 'processed' => 0, 'skipped' => 0, 'errors' => 'N/A'];
        }
    } // End foreach $websites

    echo json_encode(['success' => true, 'results' => $summary]);
} catch (Exception $e) {
    // http_response_code(500);
    error_log("Critical script error in db_import.php: " . $e->getMessage());
    echo json_encode(['error' => true, 'message' => 'Critical Error: ' . $e->getMessage() . ' at line ' . $e->getLine()]);
}
