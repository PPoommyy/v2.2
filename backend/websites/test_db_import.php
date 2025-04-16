<?php
try {
    $target_db = new PDO("mysql:host=localhost;dbname=komsant_om;charset=utf8", 'komsant_om', 'spkfwngib');
    $target_db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

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

            $stmt = $target_db->prepare("SHOW COLUMNS FROM test_orders LIKE 'source_order_id'");
            $stmt->execute();
            if ($stmt->rowCount() === 0) {
                $target_db->exec("ALTER TABLE test_orders ADD COLUMN source_order_id varchar(255) DEFAULT NULL");
            }

            $existingStmt = $target_db->prepare("SELECT source_order_id FROM test_orders WHERE website_id = ? AND source_order_id IS NOT NULL");
            $existingStmt->execute(array($site['website_id']));
            $existingSourceOrderIds = array();
            while ($row = $existingStmt->fetch(PDO::FETCH_ASSOC)) {
                $existingSourceOrderIds[$row['source_order_id']] = true;
            }
            $thirtyDaysAgo = date('Y-m-d H:i:s', strtotime('-' . intval($site['retreive_period']) . ' days'));
            $ordersStmt = $source_db->prepare("SELECT * FROM oc_order WHERE date_added >= ? AND order_status_id IN (1,2,3)  ORDER BY date_added DESC");
            $ordersStmt->execute(array($thirtyDaysAgo));
            $test_orders = $ordersStmt->fetchAll(PDO::FETCH_ASSOC);

            $processed = 0;
            $skipped = 0;
            foreach ($test_orders as $order) {
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

                $orderInsert = $target_db->prepare("INSERT INTO test_orders (...) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

                $orderInsert->execute(array(...));

                $itemStmt = $source_db->prepare("SELECT op.*, p.model AS product_model FROM oc_order_product op LEFT JOIN oc_product p ON op.product_id = p.product_id WHERE op.order_id = ?");
                $itemStmt->execute(array($order['order_id']));
                $items = $itemStmt->fetchAll(PDO::FETCH_ASSOC);

                foreach ($items as $item) {
                    $productModel = !empty($item['product_model']) ? $item['product_model'] : $item['model'];
                    $skuStmt = $target_db->prepare("SELECT id FROM sku_settings WHERE order_product_sku = ?");
                    $skuStmt->execute(array($productModel));
                    $sku = $skuStmt->fetch(PDO::FETCH_ASSOC);

                    if ($sku) {
                        $uniqueId = $targetOrderId . ',' . $sku['id'];
                        $orderSkuInsert = $target_db->prepare("INSERT INTO test_orders_skus (...) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                        $orderSkuInsert->execute(array(...));
                    }
                }
                $processed++;
                $existingSourceOrderIds[$order['order_id']] = true;
            }
        } catch (PDOException $e) {
            $summary[] = array('website_id' => $site['website_id'], 'error' => $e->getMessage());
        }
    }
} catch (PDOException $e) {
    $summary[] = array('website_id' => $site['website_id'], 'error' => $e->getMessage());
}