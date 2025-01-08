<?php
    function get_websites_details ($conn) {
        try {
            $query = "
            SELECT
                w.id as id,
                w.name as name,
                w.shipping_fee, 
                c.id as currency_id,
                c.name as currency_name, 
                p.id as payment_method_id,
                p.name as payment_method
            FROM websites w
            LEFT JOIN currencies c ON w.currency = c.id
            LEFT JOIN payment_methods p ON w.payment_method = p.id
            WHERE w.group_id = 2
            ORDER BY w.name ASC;
            ";
            $stmt = $conn->prepare($query); 
            $stmt->execute();
        
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC); 
            $jsonData = json_encode($result);
            return $jsonData;
        } catch(PDOException $e) {
            return null;
        }
    }

    function get_payment_methods ($conn) {
        try {
            $query = "
            SELECT id, name
            FROM payment_methods
            ORDER BY name ASC;
            ";
            $stmt = $conn->prepare($query); 
            $stmt->execute();
        
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC); 
            $jsonData = json_encode($result);
            return $jsonData;
        } catch(PDOException $e) {
            return null;
        }
    }

    function get_currencies_name ($conn) {
        try {
            $query = "
            SELECT id, name, description, is_enabled
            FROM currencies
            ORDER BY name ASC;
            ";
            $stmt = $conn->prepare($query); 
            $stmt->execute();
        
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC); 
            $jsonData = json_encode($result);
            return $jsonData;
        } catch(PDOException $e) {
            return null;
        }
    }

    function get_order_status_name ($conn) {
        try {
            $query = "
            SELECT id, name
            FROM order_status
            ORDER BY name ASC;
            ";
            $stmt = $conn->prepare($query); 
            $stmt->execute();
        
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC); 
            $jsonData = json_encode($result);
            return $jsonData;
        } catch(PDOException $e) {
            return null;
        }
    }

    function get_sku_by_search ($conn, $searchTerm) {
        try {
            $query = "
            SELECT order_product_sku, id, report_product_name
            FROM `sku_settings` 
            WHERE `order_product_sku` LIKE :searchTerm_start
            OR `order_product_sku` LIKE :searchTerm_contain
            ORDER BY 
                CASE 
                    WHEN `order_product_sku` LIKE :searchTerm_start THEN 0
                    ELSE 1
                END,
                `order_product_sku` ASC
            LIMIT 8;
            ";

            $stmt = $conn->prepare($query);
            $stmt->bindValue(':searchTerm_start', $searchTerm . '%', PDO::PARAM_STR);
            $stmt->bindValue(':searchTerm_contain', '%' . $searchTerm . '%', PDO::PARAM_STR);
            $stmt->execute();
        
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC); 
            $jsonData = json_encode($result);
            return $jsonData;
        } catch(PDOException $e) {
            return null;
        }
    }

    function get_order_by_timesort($conn, $searchTerm) {
        try {
            $query = "
            SELECT 
                o.order_id,
                payments_date,
                buyer_name,
                ship_phone_number,
                ship_promotion_discount,
                o.shipping_fee,
                deposit,
                ship_address_1,
                ship_address_2,
                ship_address_3,
                ship_city,
                ship_state,
                ship_postal_code,
                ship_country,
                o.timesort,
                raw_address,
                override_address,
                order_note,
                fulfillment_status,
                w.name as website_name,
                w.id as website_id,
                c.name as currency_code,
                c.id as currency_id,
                pm.name as payment_methods,
                pm.id as payment_method_id,
                ost.name as order_status,
                ost.id as order_status_id
            FROM orders o
            JOIN orders_skus os ON o.order_id = os.order_id
            JOIN currencies c ON o.currency_id = c.id
            JOIN websites w ON o.website_id = w.id
            JOIN payment_methods pm ON o.payment_method_id = pm.id
            JOIN order_status ost ON o.order_status_id = ost.id
            WHERE ost.name = 'processing' 
            AND (o.timesort LIKE :searchTerm_start OR o.timesort LIKE :searchTerm_contain)
            ORDER BY 
                CASE 
                    WHEN o.timesort LIKE :searchTerm_start THEN 0
                    ELSE 1
                END,
                o.timesort ASC
            LIMIT 10;
            ";
    
            $stmt = $conn->prepare($query);
            $stmt->bindValue(':searchTerm_start', $searchTerm . '%', PDO::PARAM_STR);
            $stmt->bindValue(':searchTerm_contain', '%' . $searchTerm . '%', PDO::PARAM_STR);
            $stmt->execute();
        
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            if ($result) {
                return json_encode($result);
            } else {
                return json_encode(['error' => 'No results found']);
            }
        } catch(PDOException $e) {
            error_log("Database Query Error: " . $e->getMessage());
            return json_encode(['error' => $e->getMessage()]);
        }
    }       

    function get_sku_by_name ($conn, $name) {
        try {
            $query = "
            SELECT order_product_sku, id, report_product_name
            FROM `sku_settings` 
            WHERE `order_product_sku` LIKE :name
            ORDER BY `id` DESC
            LIMIT 1;
            ";

            $stmt = $conn->prepare($query);
            $stmt->bindValue(':name', $name, PDO::PARAM_STR);
            $stmt->execute();
        
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC); 
            $jsonData = json_encode($result);
            return $jsonData;
        } catch(PDOException $e) {
            return null;
        }
    }

    function get_website_group($conn) {
        try {
            $query = "
            SELECT id, name
            FROM website_groups
            ORDER BY id ASC;
            ";
            $stmt = $conn->prepare($query); 
            $stmt->execute();
        
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC); 
            $jsonData = json_encode($result);
            return $jsonData;
        } catch(PDOException $e) {
            return null;
        }
    }

    function get_website_by_group($conn, $group_id) {
        try {
            $query = "
            SELECT 
                w.id as website_id, 
                w.name as website_name,
                c.name as currency_name, 
                w.shipping_fee,
                p.name as payment_method_name
            FROM websites w
            LEFT JOIN currencies c ON w.currency = c.id
            LEFT JOIN payment_methods p ON w.payment_method = p.id
            WHERE w.group_id = :group_id
            ORDER BY w.name ASC;
            ";
            $stmt = $conn->prepare($query); 
            $stmt->bindValue(':group_id', $group_id, PDO::PARAM_INT);
            $stmt->execute();
        
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC); 
            $jsonData = json_encode($result);
            return $jsonData;
        } catch(PDOException $e) {
            return null;
        }
    }

    function get_country_list($conn, $limit, $offset) {
        try {
            $query = "
            SELECT
                cc.id,
                short_name,
                full_name,
                country_code,
                default_value,
                c.name AS currency_name,
                sm.name AS service_name,
                ot.name AS order_type,
                tax_rate,
                enable_invoice
            FROM country_currency cc 
            JOIN currencies c ON cc.currency_id = c.id 
            JOIN service_methods sm ON cc.service_id = sm.id 
            JOIN order_types ot ON cc.order_type_id = ot.id 
            ORDER BY short_name ASC
            LIMIT :limit OFFSET :offset;
            ";
            $stmt = $conn->prepare($query); 
            $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
        
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $jsonData = json_encode($result);
            return $jsonData;
        } catch(PDOException $e) {
            return null;
        }
    }

    function get_country_list_count($conn) {
        try {
            $query = "
            SELECT COUNT(*) as count 
            FROM country_currency cc
            JOIN currencies c ON cc.currency_id = c.id 
            JOIN service_methods sm ON cc.service_id = sm.id 
            ORDER BY short_name ASC;
            ";

            $stmt = $conn->prepare($query);
            $stmt->execute();

            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $jsonData = json_encode($result);
            return $jsonData;
        } catch (PDOException $e) {
            return null;
        }
    }

    function get_currency_list ($conn) {
        try {
            $query = "
            SELECT id, name, description, is_enabled
            FROM currencies
            ORDER BY name ASC;
            ";
            $stmt = $conn->prepare($query); 
            $stmt->execute();
        
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC); 
            $jsonData = json_encode($result);
            return $jsonData;
        } catch(PDOException $e) {
            return null;
        }
    }

    function get_currency_list_count ($conn) {
        try {
            $query = "
            SELECT COUNT(*) as count
            FROM currencies
            ORDER BY name ASC;
            ";
            $stmt = $conn->prepare($query); 
            $stmt->execute();
        
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC); 
            $jsonData = json_encode($result);
            return $jsonData;
        } catch(PDOException $e) {
            return null;
        }
    }

    function get_payment_methods_count ($conn) {
        try {
            $query = "
            SELECT name
            FROM payment_methods
            ORDER BY name ASC;
            ";
            $stmt = $conn->prepare($query); 
            $stmt->execute();
        
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC); 
            $jsonData = json_encode($result);
            return $jsonData;
        } catch(PDOException $e) {
            return null;
        }
    }

    function get_last_timesort ($conn, $start_with) {
        try {
            $query = "
            SELECT timesort
            FROM orders
            WHERE timesort IS NOT NULL 
                AND timesort LIKE :start_with
            ORDER BY timesort DESC
            LIMIT 1;
            ";
            $stmt = $conn->prepare($query);
            $stmt->bindValue(':start_with', $start_with . '%', PDO::PARAM_STR);
            $stmt->execute();
        
            $result = $stmt->fetch();
            return $result['timesort']?$result['timesort']:'';
        } catch(PDOException $e) {
            return $e->getMessage();
        }
    }

    function get_country_code ($conn, $currency_id) {
        try {
            $query = "
            SELECT country_code
            FROM country_currency
            WHERE currency_id = $currency_id
            LIMIT 1;
            ";
            $stmt = $conn->prepare($query); 
            $stmt->execute();
        
            $result = $stmt->fetch();
            return $result['country_code'];
        } catch(PDOException $e) {
            return $e->getMessage();
        }
    }

    function get_country_code_by_name ($conn, $currency_id) {
        try {
            $query = "
            SELECT country_code
            FROM country_currency
            WHERE currency_id = $currency_id
            LIMIT 1;
            ";
            $stmt = $conn->prepare($query); 
            $stmt->execute();
        
            $result = $stmt->fetch();
            return $result['country_code'];
        } catch(PDOException $e) {
            return $e->getMessage();
        }
    }

    function get_value_by_key ($conn, $table, $key, $condition_key, $condition_value, $order_by, $limit) {
        try {
            $query = "
            SELECT $key
            FROM $table
            WHERE $condition_key LIKE :searchTerm_contain
            ORDER BY $order_by DESC
            LIMIT :limit;
            ";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':searchTerm_contain', '%' . $condition_value . '%', PDO::PARAM_STR);
            $stmt->execute();
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC); 
            $jsonData = json_encode($result);
            return $jsonData;
        } catch(PDOException $e) {
            return $e->getMessage();
        }
    }

    function get_data($conn, $table, $columns, $key = '', $filter = '', $filterParams = [], $orderBy = '') {
        try {
            $query = "
            SELECT $columns 
            FROM $table 
            $filter";
            if ($orderBy) {
                $query .= " ORDER BY $orderBy";
            }
            
            $stmt = $conn->prepare($query);
            
            foreach ($filterParams as $paramName => &$paramValue) {
                $paramType = is_int($paramValue) ? PDO::PARAM_INT : PDO::PARAM_STR;
                $stmt->bindParam($paramName, $paramValue, $paramType);
            }
    
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $jsonData = json_encode($results);
            return $jsonData;
        } catch (PDOException $e) {
            return ['error' => 'Database error: ' . $e->getMessage()];
        }
    }

    function select($conn, $table, $key, $order_by, $limit = null, $offset = null, $joins = [], $where = [], $logical_operator = 'AND') {
        try {
            // Convert array of columns to a comma-separated string
            $columnList = implode(", ", $key);
    
            // Start building the query
            $query = "SELECT $columnList FROM $table";
    
            // Process the JOIN clauses from the array
            foreach ($joins as $join) {
                $tableToJoin = $join[0]; // Table to join
                $firstCondition = $join[1]; // First condition (e.g., users.id)
                $secondCondition = $join[2]; // Second condition (e.g., orders.user_id)
    
                // Add the JOIN clause to the query
                $query .= " JOIN $tableToJoin ON $firstCondition = $secondCondition";
            }
    
            // Process the WHERE clauses from the array
            if (!empty($where)) {
                $whereClauses = [];
                foreach ($where as $condition) {
                    $column = $condition[0]; // Column name (e.g., users.status)
                    $operator = $condition[1]; // Comparison operator (e.g., =, <, >, LIKE)
                    $value = $condition[2]; // Value to compare
    
                    // Add a placeholder for the value and build the condition
                    $whereClauses[] = "$column $operator :$column";
                }
                // Join conditions with the specified logical operator (AND/OR)
                $query .= " WHERE " . implode(" $logical_operator ", $whereClauses);
            }
    
            // Append ORDER BY clause
            $query .= " ORDER BY $order_by ASC";
            // Append LIMIT and OFFSET clauses if provided
            if ($limit) {
                $query .= " LIMIT :limit";
            }
            if ($offset) {
                $query .= " OFFSET :offset";
            }
    
            // Prepare the query
            $stmt = $conn->prepare($query);
    
            // Bind WHERE conditions
            if (!empty($where)) {
                foreach ($where as $condition) {
                    $column = $condition[0]; // Column name
                    $value = $condition[2]; // Value to bind
                    $stmt->bindValue(":$column", $value);
                }
            }
    
            // Bind LIMIT and OFFSET parameters if provided
            if ($limit) {
                $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
            }
            if ($offset) {
                $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
            }
    
            // Execute the query
            $stmt->execute();
    
            // Fetch and return the result as JSON
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC); 
            return json_encode($result);
            // return $query;
        } catch (PDOException $e) {
            // Handle any exceptions by returning null
            return $e;
        }
    }    

    function select_count($conn, $table, $order_by) {
        try {
            $query = "
            SELECT COUNT(*) as count
            FROM $table
            ORDER BY $order_by ASC;
            ";
            $stmt = $conn->prepare($query); 
            $stmt->execute();
        
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC); 
            $jsonData = json_encode($result);
            return $jsonData;
        } catch(PDOException $e) {
            return null;
        }
    }

    function update_by_key($conn, $table, $condition_key, $condition_value, $key, $value) {
        try {
        
            $query = "
            UPDATE $table SET $key = :value WHERE $condition_key = :condition_value
            ";
        
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':value', $value);
            $stmt->bindParam(':condition_value', $condition_value);
            $stmt->execute();
            return true;
        } catch(PDOException $e) {
            return false;
        };
    }

    function insert($conn, $table, $data) {
        try {
            $columns = implode(', ', array_keys($data));
            $placeholders = ':' . implode(', :', array_keys($data));
            $query = "
            INSERT INTO $table ($columns) 
            VALUES ($placeholders)";
            $stmt = $conn->prepare($query);
    
            foreach ($data as $column => $columnValue) {
                if (is_int($columnValue)) {
                    $stmt->bindValue(':' . $column, $columnValue, PDO::PARAM_INT);
                } else {
                    $stmt->bindValue(':' . $column, $columnValue, PDO::PARAM_STR);
                }
            }
            $stmt->execute();
            return $conn->lastInsertId();
        } catch(PDOException $e) {
            return false; // Return false on failure
        }
    }

    function delete($conn, $table, $key, $value) {
        try {
            $query = "
            DELETE FROM $table WHERE $key = :value
            ";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':value', $value);
            $stmt->execute();
            return true;
        } catch(PDOException $e) {
            return false;
        }
    }

    function check_username($conn, $username) {
        try {
            $query = "
                SELECT * FROM user 
                WHERE username = :username
            ";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':username', $username);
            $stmt->execute();
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC); 
            return count($result) > 0;
        } catch(PDOException $e) {
            return false;
        }
    }

    function check_password($conn, $username, $password) {
        try {
            $query = "
                SELECT * FROM user 
                WHERE username = :username 
                    AND password = :password
            ";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':username', $username);
            $stmt->bindParam(':password', $password);
            $stmt->execute();
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC); 
            return count($result) > 0;
        } catch(PDOException $e) {
            return false;
        }
    }
?>