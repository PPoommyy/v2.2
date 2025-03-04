document.addEventListener("DOMContentLoaded", async function () {
  const orderDashboard = document.getElementById("order-dashboard");
  const toggleChart = document.getElementById("toggleChart");
  const websiteControls = document.getElementById("website-controls");
  const latestMonthBtn = document.getElementById("latestMonthBtn");

  if (!orderDashboard || !toggleChart || !websiteControls || !latestMonthBtn) {
      console.error("Required elements not found!");
      return;
  }

  const ctx = orderDashboard.getContext("2d");
  if (!ctx) {
      console.error("Failed to get 2D context from canvas!");
      return;
  }

  let chartInstance = null;
  let fullDatasets = [];
  let dailyDatasets = [];
  let latestMonthIndex = new Date().getMonth(); // เดือนล่าสุด (0 = Jan, 11 = Dec)
  let latestYear = new Date().getFullYear();
  let showLatestMonth = false; // ค่าเริ่มต้นให้แสดงทั้งปี

  try {
      // ✅ โหลดข้อมูล JSON จาก API
      const response = await axios.get("../../backend/count/count_by.php?table=websites&column=*&order_by=id&key=website_id&data_key=id&date=payments_date&table_key=orders");
      const orderData = response.data;

      console.log("Fetched data:", orderData);

    const transparentize = (color, opacity) => color.replace("1)", `${opacity})`);
      // ✅ ฟังก์ชันสุ่มสีเข้มขึ้น (RGB ค่าสูงขึ้น)
      const getRandomDarkColor = () => {
          const r = Math.floor(Math.random() * 156) + 100; // 100 - 255
          const g = Math.floor(Math.random() * 156) + 100;
          const b = Math.floor(Math.random() * 156) + 100;
          return `rgba(${r}, ${g}, ${b}, 1)`;
      };

      const transparentize = (color, opacity) => color.replace("1)", `${opacity})`);

      // ✅ กำหนด labels (ชื่อเดือน & วันของเดือนล่าสุด)
      const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const latestMonthDays = new Date(latestYear, latestMonthIndex + 1, 0).getDate(); // หาจำนวนวันในเดือนล่าสุด
      const dailyLabels = Array.from({ length: latestMonthDays }, (_, i) => i + 1); // 1, 2, 3, ..., 31

      function processOrderData(orderData) {
          const monthlyDatasets = [];
          const dailyDatasets = [];

          orderData.data.forEach((site) => {
              if (site.count_datas && Array.isArray(site.count_datas) && site.count_datas.length > 0) {
                  const siteName = site.details.name;
                  const siteMonthlyOrders = Array(12).fill(0);
                  const siteDailyOrders = Array(latestMonthDays).fill(0);

                  site.count_datas.forEach((order) => {
                    console.log(order)  
                    if (order.year === '2022' && Array.isArray(order.months) && order.months.length === 12) {
                          order.months.forEach((daysArray, monthIndex) => {
                            console.log(daysArray)  
                            if (Array.isArray(daysArray)) {
                                  const monthTotal = daysArray.reduce((sum, dayValue) => sum + (parseInt(dayValue) || 0), 0);
                                  siteMonthlyOrders[monthIndex] += monthTotal;

                                  if (monthIndex === latestMonthIndex) {
                                      daysArray.forEach((dayValue, dayIndex) => {
                                          siteDailyOrders[dayIndex] += parseInt(dayValue) || 0;
                                      });
                                  }
                              }
                          });
                      }
                  });

                  const color = getRandomDarkColor();
                  monthlyDatasets.push({
                      label: siteName,
                      data: siteMonthlyOrders,
                      borderColor: color,
                      backgroundColor: transparentize(color, 0.3),
                      fill: false,
                      tension: 0.3,
                      pointRadius: 4,
                      borderWidth: 2,
                      hidden: true,
                  });

                  dailyDatasets.push({
                      label: siteName,
                      data: siteDailyOrders,
                      borderColor: color,
                      backgroundColor: transparentize(color, 0.3),
                      fill: false,
                      tension: 0.3,
                      pointRadius: 4,
                      borderWidth: 2,
                      hidden: true,
                  });
              }
          });

          console.log("Monthly dataset:", monthlyDatasets);
          console.log("Daily dataset:", dailyDatasets);
          return { monthlyDatasets, dailyDatasets };
      }

      // ✅ ประมวลผลข้อมูล
      const { monthlyDatasets, dailyDatasets: processedDailyDatasets } = processOrderData(orderData);
      fullDatasets = monthlyDatasets;
      dailyDatasets = processedDailyDatasets;

      if (fullDatasets.length === 0) {
          console.error("No valid data for the chart.");
          return;
      }

      function getChartData() {
          if (showLatestMonth) {
              return {
                  labels: dailyLabels, // แสดงวันที่ของเดือนล่าสุด
                  datasets: dailyDatasets
              };
          }
          return {
              labels: monthLabels, // แสดงข้อมูลทั้งปี
              datasets: fullDatasets,
          };
      }

      const config = {
          type: "line",
          data: getChartData(),
          options: {
              responsive: true,
              maintainAspectRatio: true,
              aspectRatio: 2,
              plugins: {
                  legend: { display: false },
                  title: { display: true, text: "Order Count per Website" },
              },
              scales: {
                  y: {
                      beginAtZero: false,
                      suggestedMin: 0,
                      suggestedMax: Math.max(...fullDatasets.flatMap(d => d.data)) + 10,
                      title: { display: true, text: "Number of Orders" },
                  },
                  x: {
                      title: { display: true, text: showLatestMonth ? `Days of ${monthLabels[latestMonthIndex]}` : "Months" },
                  },
              },
          },
      };

      chartInstance = new Chart(ctx, config);

      // ✅ แสดง Checkbox เป็น Grid แถวละ 3 คอลัมน์
      let checkboxHTML = "<div class='row'>";
      fullDatasets.forEach((dataset, index) => {
          checkboxHTML += `
              <div class="col-md-4 col-6 d-flex align-items-center">
                  <input type="checkbox" id="toggle-${index}" data-index="${index}" class="website-checkbox me-2">
                  <label for="toggle-${index}" class="m-0">${dataset.label}</label>
              </div>
          `;
      });
      checkboxHTML += "</div>";

      websiteControls.innerHTML = checkboxHTML;

      document.querySelectorAll(".website-checkbox").forEach((checkbox) => {
          checkbox.addEventListener("change", function () {
              const index = this.dataset.index;
              chartInstance.data.datasets[index].hidden = !this.checked;
              chartInstance.update();
          });
      });

      // ✅ Toggle Switch เปิด/ปิดกราฟทั้งหมด
      toggleChart.addEventListener("change", function () {
          const checkboxes = document.querySelectorAll(".website-checkbox");
          checkboxes.forEach((checkbox, index) => {
              checkbox.checked = this.checked;
              chartInstance.data.datasets[index].hidden = !this.checked;
          });
          chartInstance.update();
      });

      // ✅ ปุ่ม "1 เดือน" ให้แสดง Order รายวันของเดือนล่าสุด
      latestMonthBtn.addEventListener("click", function () {
          showLatestMonth = !showLatestMonth;
          chartInstance.data = getChartData();
          chartInstance.options.scales.x.title.text = showLatestMonth ? `Days of ${monthLabels[latestMonthIndex]}` : "Months";
          chartInstance.update();
          latestMonthBtn.textContent = showLatestMonth ? "ดูทั้งปี" : "1 เดือน";
      });

  } catch (error) {
      console.error("Error fetching order data:", error);
  }
});
