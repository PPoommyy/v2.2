<!DOCTYPE html>
<html lang="en">
<body>
    <?php
        $text_order = "ออเดอร์วันที่";
        $text_normal = "งานปกติ (15-20 วัน)";
        $text_instant = "งานด่วน (7 วัน)";
        $text_special = "งานด่วนพิเศษ (3-5 วัน)";
        function thaiDateFormat($date, $additionalDays = 0) {
            $months = array(
                1 => "มกราคม",
                2 => "กุมภาพันธ์",
                3 => "มีนาคม",
                4 => "เมษายน",
                5 => "พฤษภาคม",
                6 => "มิถุนายน",
                7 => "กรกฎาคม",
                8 => "สิงหาคม",
                9 => "กันยายน",
                10 => "ตุลาคม",
                11 => "พฤศจิกายน",
                12 => "ธันวาคม"
            );
        
            $date = strtotime($date);
            $date = strtotime("+" . $additionalDays . " days", $date);
        
            $day = date('d', $date);
            $day = ltrim($day, '0'); // Remove leading zeros
            $month = date('n', $date);
            $monthThai = $months[$month];
        
            return $day . " " . $monthThai;
        }        

        $date = date("Y-m-d");
        echo "<h3>" . $text_order . " " . thaiDateFormat($date) . "</h3>";
        echo "<h1>กำหนดเสร็จ</h1>";
        echo $text_normal . " - " . thaiDateFormat($date, 20);
        echo "<br>";
        echo $text_instant . " - " . thaiDateFormat($date, 7);
        echo "<br>";
        echo $text_special . " - " . thaiDateFormat($date, 5);
    ?>
</body>
</html>