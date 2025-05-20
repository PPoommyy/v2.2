<?php
function get_skus($conn, $limit, $offset, $filters = [])
{
    try {
        $query = "
            SELECT 
                ss.id, 
                ss.order_product_sku, 
                ss.report_product_name,
                ss.warehouse_id,      -- This is the foreign key ID
                ss.warehouse_sku_id,  -- This is the foreign key ID
                ss.sku_brand_id,      -- This is the foreign key ID
                w.name as warehouse_name,
                ws.name as warehouse_sku_name,
                sb.name as sku_brand_name
            FROM sku_settings ss
            LEFT JOIN warehouses w ON ss.warehouse_id = w.id
            LEFT JOIN warehouse_skus ws ON ss.warehouse_sku_id = ws.id
            LEFT JOIN sku_brands sb ON ss.sku_brand_id = sb.id
        ";

        $conditions = [];
        $params = []; // Parameters for binding

        // Define a map for filter keys from frontend to database columns
        // Frontend sends: search_sku, warehouse_id, warehouse_sku_id, sku_brand_id
        $filter_column_map = [
            'search_sku'        => ['ss.order_product_sku', 'ss.report_product_name'], // Uses LIKE
            'warehouse_id'      => 'ss.warehouse_id',       // Uses = (exact match with ID)
            'warehouse_sku_id'  => 'ss.warehouse_sku_id',   // Uses =
            'sku_brand_id'          => 'ss.sku_brand_id'        // Uses =
        ];

        foreach ($filters as $key => $value) {
            // Ensure value is not an empty string after trimming.
            // For ID fields, an empty string from select means "All", so we don't filter.
            $trimmed_value = trim((string)$value);
            if ($trimmed_value !== "" && isset($filter_column_map[$key])) {

                $db_targets = $filter_column_map[$key];
                $param_placeholder = ":" . preg_replace('/[^a-z0-9_]/i', '', $key); // Sanitize placeholder key

                if ($key === 'search_sku' && is_array($db_targets)) {
                    $or_conditions = [];
                    foreach ($db_targets as $idx => $db_col) {
                        $specific_placeholder = $param_placeholder . "_" . $idx;
                        $or_conditions[] = $db_col . " LIKE " . $specific_placeholder;
                        $params[$specific_placeholder] = '%' . $trimmed_value . '%';
                    }
                    $conditions[] = "(" . implode(" OR ", $or_conditions) . ")";
                } else if (in_array($key, ['warehouse_id', 'warehouse_sku_id', 'sku_brand_id'])) {
                    // Exact match for ID based filters
                    $db_column = $db_targets; // It's a string (e.g., 'ss.warehouse_id')
                    $conditions[] = $db_column . " = " . $param_placeholder;
                    $params[$param_placeholder] = (int)$trimmed_value; // Cast to int for ID
                }
                // Add other filter types here if needed (e.g., date ranges, etc.)
            }
        }

        if (count($conditions) > 0) {
            $query .= " WHERE " . implode(" AND ", $conditions);
        }

        $query .= " ORDER BY ss.order_product_sku ASC ";

        if ($limit !== null) {
            $query .= " LIMIT :limit_val ";
            $params[':limit_val'] = (int)$limit;
        }
        if ($offset !== null) {
            $query .= " OFFSET :offset_val ";
            $params[':offset_val'] = (int)$offset;
        }

        $stmt = $conn->prepare($query);
        foreach ($params as $param_key => $param_val) {
            // Determine PDO type based on the key or value type
            if (
                $param_key === ':limit_val' || $param_key === ':offset_val' ||
                strpos($param_key, '_id_val') !== false || is_int($param_val)
            ) { // Check if param is for an ID
                $stmt->bindValue($param_key, (int)$param_val, PDO::PARAM_INT);
            } else {
                $stmt->bindValue($param_key, $param_val, PDO::PARAM_STR);
            }
        }
        $stmt->execute();

        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return json_encode($result);
    } catch (PDOException $e) {
        error_log("Error in get_skus: " . $e->getMessage() . " Query: " . $query . " Params: " . json_encode($params));
        return json_encode(['error' => 'Database error in get_skus. Check logs.']);
    }
}

function get_sku_count($conn, $filters = [])
{
    try {
        $query = "
            SELECT COUNT(DISTINCT ss.id) as count 
            FROM sku_settings ss
            LEFT JOIN warehouses w ON ss.warehouse_id = w.id
            LEFT JOIN warehouse_skus ws ON ss.warehouse_sku_id = ws.id
            LEFT JOIN sku_brands sb ON ss.sku_brand_id = sb.id
        ";

        $conditions = [];
        $params = [];

        $filter_column_map = [
            'search_sku'        => ['ss.order_product_sku', 'ss.report_product_name'],
            'warehouse_id'      => 'ss.warehouse_id',
            'warehouse_sku_id'  => 'ss.warehouse_sku_id',
            'sku_brand_id'          => 'ss.sku_brand_id'
        ];

        foreach ($filters as $key => $value) {
            $trimmed_value = trim((string)$value);
            if ($trimmed_value !== "" && isset($filter_column_map[$key])) {
                $db_targets = $filter_column_map[$key];
                $param_placeholder = ":" . preg_replace('/[^a-z0-9_]/i', '', $key);

                if ($key === 'search_sku' && is_array($db_targets)) {
                    $or_conditions = [];
                    foreach ($db_targets as $idx => $db_col) {
                        $specific_placeholder = $param_placeholder . "_" . $idx;
                        $or_conditions[] = $db_col . " LIKE " . $specific_placeholder;
                        $params[$specific_placeholder] = '%' . $trimmed_value . '%';
                    }
                    $conditions[] = "(" . implode(" OR ", $or_conditions) . ")";
                } else if (in_array($key, ['warehouse_id', 'warehouse_sku_id', 'sku_brand_id'])) {
                    $db_column = $db_targets;
                    $conditions[] = $db_column . " = " . $param_placeholder;
                    $params[$param_placeholder] = (int)$trimmed_value;
                }
            }
        }

        if (count($conditions) > 0) {
            $query .= " WHERE " . implode(" AND ", $conditions);
        }

        $stmt = $conn->prepare($query);
        foreach ($params as $param_key => $param_val) {
            if (strpos($param_key, '_id') !== false || is_int($param_val)) { // Simple check for ID params
                $stmt->bindValue($param_key, (int)$param_val, PDO::PARAM_INT);
            } else {
                $stmt->bindValue($param_key, $param_val, PDO::PARAM_STR);
            }
        }
        $stmt->execute();

        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return json_encode($result);
    } catch (PDOException $e) {
        error_log("Error in get_sku_count: " . $e->getMessage() . " Query: " . $query . " Params: " . json_encode($params));
        return json_encode([['count' => 0, 'error' => 'Database error in get_sku_count. Check logs.']]);
    }
}

function get_sku_brands($conn)
{
    try {
        $query = "
            SELECT sb.id, sb.name
            FROM sku_brands sb
            ORDER BY sb.name ASC;
            ";

        $stmt = $conn->prepare($query);
        $stmt->execute();
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $jsonData = json_encode($result);
        return $jsonData;
    } catch (PDOException $e) {
        echo $e->getMessage();
        return null;
    }
}

function get_sku_brands_count($conn)
{
    try {
        $query = "
            SELECT COUNT(*) as count 
            FROM sku_brands sb;
            ";

        $stmt = $conn->prepare($query);
        $stmt->execute();
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $jsonData = json_encode($result);
        return $jsonData;
    } catch (PDOException $e) {
        echo $e->getMessage();
        return null;
    }
}

function get_warehouse_skus($conn)
{
    try {
        $query = "
            SELECT ws.id, ws.name
            FROM warehouse_skus ws
            ORDER BY ws.name ASC;
            ";

        $stmt = $conn->prepare($query);
        $stmt->execute();
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $jsonData = json_encode($result);
        return $jsonData;
    } catch (PDOException $e) {
        echo $e->getMessage();
        return null;
    }
}

function get_warehouse_skus_count($conn)
{
    try {
        $query = "
            SELECT COUNT(*) as count 
            FROM warehouse_skus ws;
            ";

        $stmt = $conn->prepare($query);
        $stmt->execute();
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $jsonData = json_encode($result);
        return $jsonData;
    } catch (PDOException $e) {
        echo $e->getMessage();
        return null;
    }
}

function get_product_sets($conn)
{
    try {
        $query = "
            SELECT 
                ps.order_product_sku, 
                ps.report_product_name,
                psi.product_set_id
            FROM 
                product_set_items psi
            JOIN 
                sku_settings ps ON psi.product_set_id = ps.id
            GROUP BY
                psi.product_set_id;
            ";

        $stmt = $conn->prepare($query);
        $stmt->execute();
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $jsonData = json_encode($result);
        return $jsonData;
    } catch (PDOException $e) {
        echo $e->getMessage();
        return null;
    }
}

function get_product_set_items($conn, $key, $value)
{
    try {
        $query = "
            SELECT
                item.order_product_sku, 
                item.report_product_name, 
                psi.id,
                psi.product_set_item_id,
                psi.product_set_item_id AS order_item_id,
                psi.product_set_item_id AS sku_settings_id,
                psi.quantity,
                ws.name AS sku,
                sb.name AS brand
            FROM 
                product_set_items psi
            JOIN 
                sku_settings item ON psi.product_set_item_id = item.id
            JOIN 
                warehouse_skus ws ON item.warehouse_sku_id = ws.id
            JOIN 
                sku_brands sb ON item.sku_brand_id = sb.id
            WHERE
                $key = :value;
            ";

        $stmt = $conn->prepare($query);
        $stmt->bindParam(':value', $value, PDO::PARAM_INT);
        $stmt->execute();
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $jsonData = json_encode($result);
        return $jsonData;
    } catch (PDOException $e) {
        echo $e->getMessage();
        return null;
    }
}

function get_product_sets_count($conn)
{
    try {
        $query = "
            SELECT COUNT(*) as count 
            FROM 
                product_set_items psi
            JOIN 
                sku_settings ps ON psi.product_set_id = ps.id
            JOIN 
                sku_settings p ON psi.product_set_item_id = p.id
            GROUP BY psi.product_set_id;
            ";

        $stmt = $conn->prepare($query);
        $stmt->execute();
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $jsonData = json_encode($result);
        return $jsonData;
    } catch (PDOException $e) {
        echo $e->getMessage();
        return null;
    }
}

function get_factory_skus($conn, $factory_id, $limit, $offset)
{
    try {
        $query = "
            SELECT 
                ss.id AS sku_settings_id, 
                ss.order_product_sku, 
                ss.report_product_name,
                fss.factory_id,
                fss.factory_sku_settings_id AS factory_sku_settings_id,
                fss.item_price,
                fss.created_at,
                fss.updated_at,
                CASE 
                    WHEN fss.factory_sku_settings_id IS NOT NULL THEN 1 
                    ELSE 0 
                END AS exist
            FROM
                sku_settings ss
            LEFT JOIN
                factory_sku_settings fss 
                ON ss.id = fss.sku_settings_id AND fss.factory_id = :factory_id
            ORDER BY ss.order_product_sku ASC, ss.id ASC
            ";
        if ($limit) $query .= " LIMIT :limit";
        if ($offset) $query .= " OFFSET :offset";

        $stmt = $conn->prepare($query);
        $stmt->bindParam(':factory_id', $factory_id, PDO::PARAM_INT);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $jsonData = json_encode($result);
        return $jsonData;
    } catch (PDOException $e) {
        echo $e->getMessage();
        return null;
    }
}

function get_factory_skus_count($conn, $factory_id)
{
    try {
        $query = "
            SELECT 
                COUNT(*) as count,
                ss.id as sku_settings_id, 
                ss.order_product_sku, 
                ss.report_product_name
            FROM
                sku_settings ss
            LEFT JOIN
                factory_sku_settings fss 
                ON ss.id = fss.sku_settings_id AND fss.factory_id = :factory_id
            ORDER BY ss.order_product_sku ASC;
            ";

        $stmt = $conn->prepare($query);
        $stmt->bindParam(':factory_id', $factory_id, PDO::PARAM_INT);
        $stmt->execute();
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $jsonData = json_encode($result);
        return $jsonData;
    } catch (PDOException $e) {
        echo $e->getMessage();
        return null;
    }
}

function get_factory_order_skus($conn, $factory_id, $limit, $offset)
{
    try {
        /* 
            retrive skus data in order_skus table that are in factory_sku_settings table by factory_id
             */
        $query = "
            SELECT 
                os.id AS order_sku_id, 
                os.order_product_sku, 
                os.report_product_name,
                fss.factory_id,
                fss.factory_sku_settings_id AS factory_sku_settings_id,
                fss.created_at,
                fss.updated_at,
                CASE 
                    WHEN fss.factory_sku_settings_id IS NOT NULL THEN 1 
                    ELSE 0 
                END AS exist
            FROM
                order_skus os
            LEFT JOIN
                factory_sku_settings fss 
                ON os.id = fss.order_sku_id AND fss.factory_id = :factory_id
            ORDER BY os.order_product_sku ASC, os.id ASC
            LIMIT :limit OFFSET :offset;
            ";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':factory_id', $factory_id, PDO::PARAM_INT);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $jsonData = json_encode($result);
        return $jsonData;
    } catch (PDOException $e) {
        echo $e->getMessage();
        return null;
    }
}
