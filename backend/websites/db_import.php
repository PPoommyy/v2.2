<?php
try {
    header('Content-type: application/json');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Cache-Control: post-check=0, pre-check=0', false);
    header('Pragma: no-cache');

    $target_db = new PDO("mysql:host=103.13.231.64;dbname=komsant_test;charset=utf8", 'komsant', 'ktest347#');
    $target_db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    function generateUniqueOrderId($target_db)
    {
        try {
            do {
                $newOrderId = uniqid();
                $stmt = $target_db->prepare("SELECT 1 FROM orders WHERE order_id = ? LIMIT 1");
                $stmt->execute(array($newOrderId));
                $orderExists = $stmt->fetchColumn() !== false;
            } while ($orderExists);
            return $newOrderId;
        } catch (PDOException $e) {
            throw new Exception("Error generating unique order ID: " . $e->getMessage());
        }
    }

    function generateNewTimeSort($date)
    {
        global $target_db;
        $stmt = $target_db->prepare("SELECT timesort FROM orders WHERE timesort LIKE ? ORDER BY timesort DESC LIMIT 1");
        $stmt->execute(array(substr($date, 0, 4) . '%'));
        $lastTimeSort = $stmt->fetchColumn();
        $year = substr($date, 0, 2);
        $month = substr($date, 2, 2);
        if ($lastTimeSort && substr($lastTimeSort, 0, 4) === $year . $month) {
            $seqNum = intval(substr($lastTimeSort, 4)) + 1;
            return $year . $month . str_pad($seqNum, 4, '0', STR_PAD_LEFT);
        }
        return $year . $month . '0001';
    }

    function formatAddress($orderData)
    {
        return array(
            'ship_address_1' => isset($orderData['shipping_address_1']) ? $orderData['shipping_address_1'] : null,
            'ship_address_2' => isset($orderData['shipping_address_2']) ? $orderData['shipping_address_2'] : null,
            'ship_address_3' => null,
            'ship_city' => isset($orderData['shipping_city']) ? $orderData['shipping_city'] : null,
            'ship_state' => isset($orderData['shipping_zone']) ? $orderData['shipping_zone'] : null,
            'ship_postal_code' => isset($orderData['shipping_postcode']) ? $orderData['shipping_postcode'] : null,
            'ship_country' => isset($orderData['shipping_country'])
                ? (strlen($orderData['shipping_country']) > 2
                    ? getCountryCode($orderData['shipping_country'])
                    : $orderData['shipping_country'])
                : null,
            'raw_address' => sprintf(
                "%s %s\n%s\n%s%s\n%s %s\nT. %s\n%s",
                isset($orderData['shipping_firstname']) ? $orderData['shipping_firstname'] : '',
                isset($orderData['shipping_lastname']) ? $orderData['shipping_lastname'] : '',
                isset($orderData['shipping_address_1']) ? $orderData['shipping_address_1'] : '',
                !empty($orderData['shipping_address_2']) ? $orderData['shipping_address_2'] . ' · ' : '',
                isset($orderData['shipping_city']) ? $orderData['shipping_city'] : '',
                isset($orderData['shipping_zone']) ? $orderData['shipping_zone'] : '',
                isset($orderData['shipping_country']) ? $orderData['shipping_country'] : '',
                isset($orderData['telephone']) ? $orderData['telephone'] : '',
                isset($orderData['email']) ? $orderData['email'] : ''
            )
        );
    }

    function getCountryCode($countryName)
    {
        $countryCodes = array('Thailand' => 'TH', 'United States' => 'US', 'United Kingdom' => 'GB');
        return isset($countryCodes[$countryName]) ? $countryCodes[$countryName] : substr($countryName, 0, 2);
    }

    $websiteStmt = $target_db->query("SELECT * FROM website_database");
    $websites = $websiteStmt->fetchAll(PDO::FETCH_ASSOC);

    $summary = array();

    foreach ($websites as $site) {
        try {
            $source_db = new PDO(
                "mysql:host=" . $site['db_host'] . ";dbname=" . $site['db_name'] . ";charset=utf8",
                $site['db_user'],
                $site['db_password']
            );
            $source_db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

            $stmt = $target_db->prepare("SHOW COLUMNS FROM orders LIKE 'source_order_id'");
            $stmt->execute();
            if ($stmt->rowCount() === 0) {
                $target_db->exec("ALTER TABLE orders ADD COLUMN source_order_id varchar(255) DEFAULT NULL");
            }

            $existingStmt = $target_db->prepare("SELECT source_order_id FROM orders WHERE website_id = ? AND source_order_id IS NOT NULL");
            $existingStmt->execute(array($site['website_id']));
            $existingSourceOrderIds = array();
            while ($row = $existingStmt->fetch(PDO::FETCH_ASSOC)) {
                $existingSourceOrderIds[$row['source_order_id']] = true;
            }

            $thirtyDaysAgo = date('Y-m-d H:i:s', strtotime('-' . intval($site['retreive_period']) . ' days'));
            $ordersStmt = $source_db->prepare("SELECT * FROM oc_order WHERE date_added >= ? AND order_status_id IN (1,2,3)  ORDER BY date_added DESC");
            $ordersStmt->execute(array($thirtyDaysAgo));
            $orders = $ordersStmt->fetchAll(PDO::FETCH_ASSOC);

            $processed = 0;
            $skipped = 0;
            foreach ($orders as $order) {
                if (isset($existingSourceOrderIds[$order['order_id']])) {
                    $skipped++;
                    continue;
                }

                $targetOrderId = generateUniqueOrderId($target_db);
                $orderDate = new DateTime($order['date_added']);
                $yearMonth = $orderDate->format('ym');
                $newTimeSort = generateNewTimeSort($yearMonth);
                $addressData = formatAddress($order);

                $currencyStmt = $target_db->prepare("SELECT id FROM currencies WHERE name = ?");
                $currencyStmt->execute(array($order['currency_code']));
                $currency = $currencyStmt->fetch(PDO::FETCH_ASSOC);
                $currencyId = isset($currency['id']) ? $currency['id'] : 1;

                $paymentMethodId = (strpos($order['payment_code'], 'bluesnap') !== false) ? 17 : 1;
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
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

                $orderInsert->execute(array(
                    $targetOrderId,
                    $order['order_id'],
                    $order['date_added'],
                    $order['email'],
                    $buyerName,
                    $order['telephone'],
                    $recipientName,
                    $order['telephone'],
                    0.0,
                    0.0,
                    $addressData['ship_address_1'],
                    $addressData['ship_address_2'],
                    $addressData['ship_address_3'],
                    $addressData['ship_city'],
                    $addressData['ship_state'],
                    $addressData['ship_postal_code'],
                    $addressData['ship_country'],
                    $currentDateTime,
                    $currentDateTime,
                    $newTimeSort,
                    $order['order_status_id'] > 1 ? $order['order_status_id'] - 1 : 6,
                    1,
                    $site['website_id'],
                    $currencyId,
                    $paymentMethodId,
                    null,
                    $addressData['raw_address'],
                    null
                ));

                $itemStmt = $source_db->prepare("SELECT op.*, p.model AS product_model FROM oc_order_product op LEFT JOIN oc_product p ON op.product_id = p.product_id WHERE op.order_id = ?");
                $itemStmt->execute(array($order['order_id']));
                $items = $itemStmt->fetchAll(PDO::FETCH_ASSOC);

                foreach ($items as $item) {
                    $productModel = !empty($item['product_model']) ? $item['product_model'] : $item['model'];
                    $skuStmt = $target_db->prepare("SELECT id FROM sku_settings WHERE order_product_sku = ?");
                    $skuStmt->execute(array($productModel));
                    $sku = $skuStmt->fetch(PDO::FETCH_ASSOC);

                    if (!$sku) {
                        $skuInsert = $target_db->prepare("INSERT INTO sku_settings (order_product_sku, report_product_name, warehouse_id, warehouse_sku_id, sku_brand_id) VALUES (?, ?, ?, ?, ?)");
                        $skuInsert->execute(array(
                            $productModel,
                            $item['name'],
                            1,
                            1,
                            1
                        ));
                        $skuId = $target_db->lastInsertId();
                    } else {
                        $skuId = $sku['id'];
                    }

                    $uniqueId = $targetOrderId . ',' . $skuId;
                    $orderSkuInsert = $target_db->prepare("INSERT INTO orders_skus (
                        unique_id, order_id, order_item_id, sku_settings_id, 
                        item_price, shipping_price, total, quantity_purchased, 
                        product_status_id
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");

                    $orderSkuInsert->execute(array(
                        $uniqueId,
                        $targetOrderId,
                        $skuId,
                        $skuId,
                        $item['price'],
                        0.0,
                        $item['total'],
                        $item['quantity'],
                        1
                    ));
                }
                $processed++;
                $existingSourceOrderIds[$order['order_id']] = true;
            }

            $summary[] = array('website_id' => $site['website_id'], 'processed' => $processed, 'skipped' => $skipped);
        } catch (PDOException $e) {
            $summary[] = array('website_id' => $site['website_id'], 'error' => $e->getMessage());
        }
    }

    echo json_encode(array('success' => true, 'results' => $summary));
} catch (Exception $e) {
    echo json_encode(array('error' => true, 'message' => $e->getMessage()));
}
