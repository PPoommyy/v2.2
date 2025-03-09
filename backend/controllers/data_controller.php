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

    function get_factory_sku_by_search ($conn, $searchTerm, $factory_id) {
        try {
            $query = "
            SELECT order_product_sku, id, report_product_name
            FROM `sku_settings`
            JOIN factory_sku_settings fss ON sku_settings.id = fss.sku_settings_id
            WHERE `order_product_sku` LIKE :searchTerm_start
            OR `order_product_sku` LIKE :searchTerm_contain
            AND fss.factory_id = :factory_id
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
            $stmt->bindValue(':factory_id', $factory_id, PDO::PARAM_INT);
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
                os.orders_skus_id,
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

    function get_last_timesort ($conn, $table, $start_with) {
        try {
            $query = "
            SELECT timesort
            FROM $table
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

    function get_data($conn, $table, $columns, $filter = '', $filterParams = [], $orderBy = '') {
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

    function select($conn, $table, $key, $order_by, $limit = null, $offset = null, $joins = [[]], $where = [[]], $logical_operator = 'AND') {
        try {
            $columnList = implode(", ", $key);
            $query = "SELECT $columnList FROM $table";
    
            if (!empty($joins)) {
                foreach ($joins as $join) {
                    if (count($join) == 3) {
                        $query .= " JOIN $join[0] ON $join[1] = $join[2]";
                    }
                }
            }
    
            $whereClauses = [];
            $params = [];
            if (!empty($where)) {
                foreach ($where as $index => $condition) {
                    if (count($condition) < 3) continue;
                    $column = $condition[0];
                    $operator = strtoupper($condition[1]);
                    $paramKey = ":param$index";
    
                    if ($operator === 'BETWEEN' && is_array($condition[2]) && count($condition[2]) == 2) {
                        $paramKey1 = ":param" . $index . "_1";
                        $paramKey2 = ":param" . $index . "_2";
                        $whereClauses[] = "$column BETWEEN $paramKey1 AND $paramKey2";
                        $params[$paramKey1] = $condition[2][0];
                        $params[$paramKey2] = $condition[2][1];
                    } elseif ($operator === 'IN' && is_array($condition[2])) {
                        $inParams = [];
                        foreach ($condition[2] as $i => $val) {
                            $inKey = ":param" . $index . "_" . $i;
                            $inParams[] = $inKey;
                            $params[$inKey] = $val;
                        }
                        $whereClauses[] = "$column IN (" . implode(",", $inParams) . ")";
                    } else {
                        $whereClauses[] = "$column $operator $paramKey";
                        $params[$paramKey] = $condition[2];
                    }
                }
                if (!empty($whereClauses)) {
                    $query .= " WHERE " . implode(" $logical_operator ", $whereClauses);
                }
            }
    
            if ($order_by) {
                $query .= " ORDER BY $order_by ASC";
            }
    
            if ($limit) {
                $query .= " LIMIT :limit";
                $params[':limit'] = (int) $limit;
            }
            if ($offset) {
                $query .= " OFFSET :offset";
                $params[':offset'] = (int) $offset;
            }
    
            $stmt = $conn->prepare($query);
            foreach ($params as $param => $value) {
                if (is_numeric($value)) {
                    $stmt->bindValue($param, (int)$value, PDO::PARAM_INT);
                } else {
                    $stmt->bindValue($param, $value);
                }
            }
    
            $stmt->execute();
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return json_encode(["result" => $result, "query" => $params]);
        } catch (PDOException $e) {
            return json_encode(["error" => $e->getMessage(), "query" => $query]);
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
            return $e->getMessage();
        }
    }

    function update($conn, $table, $key, $value, $toUpdate) {
        try {
            /* $updateColumns = array_map(function ($column) {
                return $column . ' = :' . $column;
            }, array_keys($order));
    
            $updateClause = implode(', ', $updateColumns);
    
            $query = "
                UPDATE $table
                SET $updateClause
                WHERE $key = :value
            ";
    
            $stmt = $conn->prepare($query);
    
            foreach ($order as $column => $columnValue) {
                if (is_int($columnValue)) {
                    $stmt->bindValue(':' . $column, $columnValue, PDO::PARAM_INT);
                } else {
                    $stmt->bindValue(':' . $column, $columnValue, PDO::PARAM_STR);
                }
            }
    
            $stmt->bindValue(':value', $value);
            $stmt->execute();
            return true; */

            // create function to update data in table
            $updateColumns = array_map(function ($column) {
                return $column . ' = :' . $column;
            }, array_keys($toUpdate));
    
            $updateClause = implode(', ', $updateColumns);
    
            $query = "
                UPDATE $table
                SET $updateClause
                WHERE $key = :value
            ";
    
            $stmt = $conn->prepare($query);
    
            foreach ($toUpdate as $column => $columnValue) {
                if (is_int($columnValue)) {
                    $stmt->bindValue(':' . $column, $columnValue, PDO::PARAM_INT);
                } else {
                    $stmt->bindValue(':' . $column, $columnValue, PDO::PARAM_STR);
                }
            }
    
            $stmt->bindValue(':value', $value);
            $stmt->execute();
            return true;
        } catch (PDOException $e) {
            return $e->getMessage();
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

    function get_user_data($conn) {
        try {
            /*
                1. get buyer_email, buyer_name, buyer_phone_number and ship_country from orders
                2. join country_currency to get country name
             */
            $query = "
                SELECT buyer_email, buyer_name, buyer_phone_number, country_currency.short_name
                FROM orders
                JOIN country_currency ON orders.ship_country = country_currency.country_code
                ORDER BY buyer_name ASC
            ";
            $stmt = $conn->prepare($query);
            $stmt->execute();
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC); 
            return json_encode($result);
        } catch(PDOException $e) {
            return false;
        }
    }

    function count_by($conn, $table, $key, $value, $date) {
        try {
            $query = "
            SELECT 
              YEAR($date) as year,
              MONTH($date) as month,
              DAY($date) as day,
              COUNT(*) as count
            FROM $table
            WHERE $key = :value
            GROUP BY year, month, day
            ORDER BY year, month, day;
            ";
    
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':value', $value);
            $stmt->execute();
    
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
            /* $groupedData = [];
            foreach ($result as $row) {
                $year = $row["year"];
                $month = $row["month"] - 1;
                $day = $row["day"] - 1;
                $count = $row["count"];
    
                $daysInMonth = cal_days_in_month(CAL_GREGORIAN, $month + 1, $year);
    
                if (!isset($groupedData[$year])) {
                    $groupedData[$year] = [];
                }
    
                if (!isset($groupedData[$year][$month])) {
                    $groupedData[$year][$month] = array_fill(0, $daysInMonth, 0);
                }
    
                $groupedData[$year][$month][$day] = $count;
            } */
            $groupedData = [];
            foreach ($result as $row) {
                $year = $row["year"];
                $month = $row["month"] - 1; // index เดือนเริ่มที่ 0
                $day = $row["day"] - 1; // index วันเริ่มที่ 0
                $count = $row["count"];
    
                // ถ้ายังไม่มีปีนี้ใน array ให้สร้าง entry ใหม่
                if (!isset($groupedData[$year])) {
                    $groupedData[$year] = array_fill(0, 12, array_fill(0, 31, 0));
                }
    
                // ใส่ค่าจำนวน order ลงใน index ของเดือนและวัน
                $groupedData[$year][$month][$day] = $count;
            }
    
            // แปลงข้อมูลให้อยู่ในรูปแบบที่ต้องการ
            $formattedData = [];
            foreach ($groupedData as $year => $months) {
                $formattedData[] = [
                    "year" => $year,
                    "months" => $months
                ];
            }
    
            $formattedData = [];
            foreach ($groupedData as $year => $months) {
                $formattedData[] = [
                    "year" => $year,
                    "months" => $months
                ];
            }
    
            return json_encode($formattedData);
        } catch (PDOException $e) {
            echo $e->getMessage();
            return null;
        }
    }
    

?>