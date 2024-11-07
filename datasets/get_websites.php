<?php
    include('config.php');
    include('./controllers/data_controller.php');
?>
<?php
    
    try {
        $website_groups = json_decode(get_website_group($conn),true);
        $currencies = json_decode(get_currency_list($conn), true);
        $paymentMethods = json_decode(get_payment_methods($conn), true);

        $data = [];

        foreach ($website_groups as $group) {
            $groupID = $group['id'];
            $websites_list = json_decode(get_website_by_group($conn, $groupID), true);

            $data[] = [
                'group_id' => $groupID,
                'website_group_name' => $group['name'],
                'website_list' => $websites_list,
            ];
        }

        $response = [
            'data' => $data,
            'currencies' => $currencies,
            'paymentMethods' => $paymentMethods,
        ];

        $jsonData = json_encode($response);
        echo $jsonData;
    }   catch (\Exception $e) {
        echo $e->getMessage();
    }
?>