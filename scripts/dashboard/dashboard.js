document.addEventListener("DOMContentLoaded", async function () {
  const orderDashboard = document.getElementById("order-dashboard");

  if (!orderDashboard) {
    console.error("Canvas element not found!");
    return;
  }

  const ctx = orderDashboard.getContext("2d");
  if (!ctx) {
    console.error("Failed to get 2D context from canvas!");
    return;
  }

  try {
    // โหลดข้อมูล JSON จาก API
    const response = await axios.get("../../backend/get/order/get_orders_by_websites.php");
    const orderData = response.data;

    console.log("Fetched data:", orderData);

    // ฟังก์ชันสุ่มสี
    const randomColor = () =>
      `rgba(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, 1)`;

    const transparentize = (color, opacity) => color.replace("1)", `${opacity})`);

    // กำหนด labels (ชื่อเดือน)
    const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // ฟังก์ชันจัดรูปแบบข้อมูลออเดอร์ให้เหมาะกับ Chart.js
    function processOrderData(orderData) {
      const datasets = [];

      orderData.data.forEach((site) => {
        if (site.orders && site.orders.length > 0) {
          const siteName = site.details.name;
          const siteOrders = Array(12).fill(0); // สร้าง array ขนาด 12 ช่องสำหรับเดือน
          console.log("siteOrders:", siteOrders);
          site.orders.forEach((order) => {
            console.log(`order: ${order.year}, ${order.months.length}`);
            if (order.year === 2024 && order.months.length === 12) {
              order.months.forEach((value, index) => {
                console.log(`site: ${siteName}, month: ${index}, value: ${value}`);
                siteOrders[index] += parseInt(value) || 0; // แปลงให้เป็นตัวเลขเสมอ
              });
            }
          });

          const color = randomColor();
          datasets.push({
            label: siteName,
            data: siteOrders,
            borderColor: color,
            backgroundColor: transparentize(color, 0.5), // ทำให้สีเป็นสีอ่อนลง
            fill: false, // ไม่เติมสี
            tension: 0.2, // เพิ่มความโค้งของเส้นเล็กน้อย
            pointRadius: 3, // ปรับขนาดจุด
            borderWidth: 2, // เส้นหนา
          });
        }
      });

      console.log("Final dataset:", datasets);
      return datasets;
    }

    // เตรียมข้อมูลสำหรับ Chart.js
    const datasets = processOrderData(orderData);

    // ตรวจสอบว่ามีข้อมูลหรือไม่
    if (datasets.length === 0) {
      console.error("No valid data for the chart.");
      return;
    }

    const data = {
      labels: labels,
      datasets: datasets,
    };

    // ตั้งค่ากราฟ
    const config = {
      type: "line",
      data: data,
      options: {
        responsive: true,
        plugins: {
          legend: { position: "top" },
          title: { display: true, text: "Order Count per Website (2024)" },
        },
        scales: {
          y: {
            beginAtZero: false, // ไม่เริ่มที่ 0
            title: { display: true, text: "Number of Orders" },
          },
          x: {
            title: { display: true, text: "Months" },
          },
        },
      },
    };

    // สร้างกราฟ
    new Chart(ctx, config);

  } catch (error) {
    console.error("Error fetching order data:", error);
  }
});
