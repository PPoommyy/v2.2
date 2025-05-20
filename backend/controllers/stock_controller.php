<?php

function get_total_stock($conn, $limit, $offset, $search_sku = null)
{
    try {
        $query = "
            SELECT 
                ss.id AS sku_id,
                ss.order_product_sku,
                ss.report_product_name,
                ss.min_quantity,
                ss.max_quantity,
                ss.enable_low_stock_alert, /* <-- ADDED */
                COALESCE(current_stock.total_remaining, 0) AS total_remaining,
                CASE 
                    WHEN ss.enable_low_stock_alert = 1 AND ss.min_quantity IS NOT NULL AND COALESCE(current_stock.total_remaining, 0) <= ss.min_quantity THEN 1
                    ELSE 0
                END AS is_low_stock
            FROM sku_settings ss
            JOIN (
                SELECT 
                    s.sku_settings_id, 
                    SUM(s.remaining_quantity) AS total_remaining
                FROM stock s
                GROUP BY s.sku_settings_id
            ) AS current_stock ON ss.id = current_stock.sku_settings_id
        ";

        $conditions = [];
        $params = [];

        if (!empty($search_sku)) {
            $conditions[] = "(ss.order_product_sku LIKE :search_sku OR ss.report_product_name LIKE :search_sku_name)";
            $params[':search_sku'] = '%' . $search_sku . '%';
            $params[':search_sku_name'] = '%' . $search_sku . '%';
        }

        if (count($conditions) > 0) {
            $query .= " WHERE " . implode(" AND ", $conditions);
        }

        // GROUP BY needs to include enable_low_stock_alert if it's not part of an aggregate or subquery contextually like this
        // However, since it's directly from ss, it should be fine. The current GROUP BY in the subquery is correct.
        // The outer query doesn't need GROUP BY if the subquery `current_stock` correctly aggregates.
        // If we were grouping in the outer query:
        // $query .= " GROUP BY ss.id, ss.order_product_sku, ss.report_product_name, ss.min_quantity, ss.max_quantity, ss.enable_low_stock_alert ";


        $query .= " ORDER BY is_low_stock DESC, ss.order_product_sku ASC ";

        if ($limit !== null) {
            $query .= " LIMIT :limit ";
            // $params[':limit'] is already set if using the previous bindParam logic
        }
        if ($offset !== null) {
            $query .= " OFFSET :offset ";
            // $params[':offset'] is already set
        }

        $stmt = $conn->prepare($query);
        
        // Re-binding parameters to ensure correct scope and type
        if (!empty($search_sku)) {
            $stmt->bindParam(':search_sku', $params[':search_sku'], PDO::PARAM_STR);
            $stmt->bindParam(':search_sku_name', $params[':search_sku_name'], PDO::PARAM_STR);
        }
        if ($limit !== null) {
            $stmt->bindParam(':limit', $params[':limit'], PDO::PARAM_INT); // Ensure $params[':limit'] is defined before this
        }
        if ($offset !== null) {
            $stmt->bindParam(':offset', $params[':offset'], PDO::PARAM_INT); // Ensure $params[':offset'] is defined
        }
        // This re-binding logic needs careful checking. $params must be populated before binding.
        // Let's re-populate $params for limit/offset if they are part of the main params array.
        if ($limit !== null) $params_for_bind[':limit'] = (int)$limit;
        if ($offset !== null) $params_for_bind[':offset'] = (int)$offset;
        if (!empty($search_sku)) {
             $params_for_bind[':search_sku'] = '%' . $search_sku . '%';
             $params_for_bind[':search_sku_name'] = '%' . $search_sku . '%';
        }


        // Simpler binding if $params array is consistently built
        foreach ($params_for_bind as $key => $val) {
             if ($key === ':limit' || $key === ':offset') {
                $stmt->bindValue($key, (int)$val, PDO::PARAM_INT);
            } else {
                $stmt->bindValue($key, $val, PDO::PARAM_STR);
            }
        }
        
        $stmt->execute();
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return json_encode($result);

    } catch (PDOException $e) {
        error_log("Error in get_total_stock: " . $e->getMessage());
        return json_encode(["error" => "Database error: " . $e->getMessage()]);
    }
}

function get_stock_in_transactions($conn, $limit, $offset, $search_sku = null, $date_start_str = null, $date_end_str = null)
{
    try {
        $query = "
            SELECT 
                s.id AS stock_id,
                ss.id AS sku_settings_id,
                ss.order_product_sku,
                ss.report_product_name,
                s.quantity AS received_quantity,
                s.remaining_quantity, /* This might be the remaining of THIS batch, not total */
                s.received_date
            FROM stock s
            JOIN sku_settings ss ON s.sku_settings_id = ss.id ";

        $conditions = [];
        $params = [];

        if (!empty($search_sku)) {
            $conditions[] = "(ss.order_product_sku LIKE :search_sku OR ss.report_product_name LIKE :search_sku_name)";
            $params[':search_sku'] = '%' . $search_sku . '%';
            $params[':search_sku_name'] = '%' . $search_sku . '%';
        }
        if (!empty($date_start_str)) {
            // Assuming $date_start_str is 'Y-m-d'
            $conditions[] = "s.received_date >= :date_start";
            $params[':date_start'] = $date_start_str . " 00:00:00"; // Start of the day
        }
        if (!empty($date_end_str)) {
            // Assuming $date_end_str is 'Y-m-d'
            $conditions[] = "s.received_date <= :date_end";
            $params[':date_end'] = $date_end_str . " 23:59:59"; // End of the day
        }

        if (count($conditions) > 0) {
            $query .= " WHERE " . implode(" AND ", $conditions);
        }
        $query .= " ORDER BY s.received_date DESC, ss.order_product_sku ASC ";

        if ($limit !== null) {
            $query .= " LIMIT :limit ";
            $params[':limit'] = (int)$limit;
        }
        if ($offset !== null) {
            $query .= " OFFSET :offset ";
            $params[':offset'] = (int)$offset;
        }

        $stmt = $conn->prepare($query);
        // Bind parameters (simplified, ensure correct types if issues)
        foreach ($params as $key => $val) {
             if ($key === ':limit' || $key === ':offset') {
                $stmt->bindValue($key, (int)$val, PDO::PARAM_INT);
            } else {
                $stmt->bindValue($key, $val, PDO::PARAM_STR);
            }
        }
        $stmt->execute();

        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return json_encode($result);
    } catch (PDOException $e) {
        error_log("Error in get_stock_in_transactions: " . $e->getMessage());
        return json_encode(["error" => "Database error: " . $e->getMessage()]);
    }
}

function get_stock_out_transactions($conn, $limit, $offset, $search_sku = null, $date_start_str = null, $date_end_str = null)
{
    try {
        $query = "
            SELECT 
                so.id AS stock_out_id,
                ss.id AS sku_settings_id,
                ss.order_product_sku,
                ss.report_product_name,
                so.quantity AS issued_quantity,
                so.issued_date
            FROM stock_out so
            JOIN sku_settings ss ON so.sku_settings_id = ss.id ";

        $conditions = [];
        $params = [];

        if (!empty($search_sku)) {
            $conditions[] = "(ss.order_product_sku LIKE :search_sku OR ss.report_product_name LIKE :search_sku_name)";
            $params[':search_sku'] = '%' . $search_sku . '%';
            $params[':search_sku_name'] = '%' . $search_sku . '%';
        }
        if (!empty($date_start_str)) {
            $conditions[] = "so.issued_date >= :date_start";
            $params[':date_start'] = $date_start_str . " 00:00:00";
        }
        if (!empty($date_end_str)) {
            $conditions[] = "so.issued_date <= :date_end";
            $params[':date_end'] = $date_end_str . " 23:59:59";
        }

        if (count($conditions) > 0) {
            $query .= " WHERE " . implode(" AND ", $conditions);
        }
        $query .= " ORDER BY so.issued_date DESC, ss.order_product_sku ASC ";

         if ($limit !== null) {
            $query .= " LIMIT :limit ";
            $params[':limit'] = (int)$limit;
        }
        if ($offset !== null) {
            $query .= " OFFSET :offset ";
            $params[':offset'] = (int)$offset;
        }
        
        $stmt = $conn->prepare($query);
        foreach ($params as $key => $val) {
             if ($key === ':limit' || $key === ':offset') {
                $stmt->bindValue($key, (int)$val, PDO::PARAM_INT);
            } else {
                $stmt->bindValue($key, $val, PDO::PARAM_STR);
            }
        }
        $stmt->execute();

        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return json_encode($result);
    } catch (PDOException $e) {
        error_log("Error in get_stock_out_transactions: " . $e->getMessage());
        return json_encode(["error" => "Database error: " . $e->getMessage()]);
    }
}
?>