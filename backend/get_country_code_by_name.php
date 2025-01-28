<?php
    include('config.php');
    include('./controllers/data_controller.php');

    try {
        $name = isset($_GET['name']) ? $_GET['name'] : "";
        $country_code_short_name = json_decode(get_value_by_key($conn, "country_currency", "country_code", "short_name", $name, "id", 1), true);
        
        if ($country_code_short_name && count($country_code_short_name) > 0) {
            $response = array(
                'status' => 200,
                'data' => $country_code_short_name[0]['country_code']
            );
        } else {
            $country_code_full_name = json_decode(get_value_by_key($conn, "country_currency", "country_code", "full_name", $name, "id", 1), true);
            if ($country_code_full_name && count($country_code_full_name) > 0) {
                $response = array(
                    'status' => 200,
                    'data' => $country_code_full_name[0]['country_code']
                );
            } else {
                $response = array(
                    'status' => 404,
                    'message' => 'Country code not found for the given name.',
                );
            }
        }

        echo json_encode($response);
    } catch (\Exception $e) {
        $response = array(
            'status' => 500,
            'error' => $e->getMessage(),
        );

        echo json_encode($response);
    }
?>