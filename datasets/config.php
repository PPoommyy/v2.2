<?php
    try{
        header('Content-type: application/json');
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        header('Cache-Control: post-check=0, pre-check=0',false);
        header('Pragma: no-cache');
        /* $HOST = 'localhost';
        $USERNAME = 'komsant_om';
        $PASSWORD = 'spkfwngib';
        $DATABASE = 'komsant_om'; */
        $HOST = 'localhost';
        $USERNAME = 'root';
        $PASSWORD = '';
        $DATABASE = 'komsant_om';
        $conn = new PDO("mysql:host=$HOST;dbname=$DATABASE;charset=utf8", $USERNAME, $PASSWORD);
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        //echo "Connected successfully"; 
    } catch(PDOException $e) {
        //echo "Connection failed: " . $e->getMessage();
    }
  ?>