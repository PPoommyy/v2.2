document.addEventListener("DOMContentLoaded", async function () {
    const orderDashboard = document.getElementById("order-dashboard");
    const yearDropdownButton = document.getElementById("yearDropdown");
    const yearDropdownMenu = document.getElementById("yearDropdownMenu");
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
    let selectedYear = new Date().getFullYear();
    let latestMonthIndex = new Date().getMonth();
    let latestYear = new Date().getFullYear();
    let showLatestMonth = false;
    let selectedWebsites = new Set()
    let isShowChartChecked = toggleChart.checked; // เก็บค่าของ toggle switch

    try {
        const response = await axios.get("../../backend/count/count_by.php?table=websites&column=*&order_by=id&key=website_id&data_key=id&date=payments_date&table_key=orders");
        const orderData = response.data;
        const availableYears = [...new Set(orderData.data.flatMap(site => site.count_datas.map(order => order.year)))];
        availableYears.sort((a, b) => b - a);
        availableYears.forEach((year) => {
            const item = document.createElement("li");
            item.innerHTML = `<a class="dropdown-item" data-year="${year}">${year}</a>`;
            item.addEventListener("click", function () {
                selectedYear = parseInt(this.querySelector("a").dataset.year);
                yearDropdownButton.textContent = `ปี ${selectedYear}`;
                loadChartData();
            });
            yearDropdownMenu.appendChild(item);
        });

        selectedYear = availableYears[0];
        yearDropdownButton.textContent = `ปี ${selectedYear}`;

        function getRandomDarkColor() {
            const r = Math.floor(Math.random() * 156) + 100;
            const g = Math.floor(Math.random() * 156) + 100;
            const b = Math.floor(Math.random() * 156) + 100;
            return `rgba(${r}, ${g}, ${b}, 1)`;
        }

        const transparentize = (color, opacity) => color.replace("1)", `${opacity})`);

        const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const latestMonthDays = new Date(latestYear, latestMonthIndex + 1, 0).getDate();
        const dailyLabels = Array.from({ length: latestMonthDays }, (_, i) => i + 1);

        function processOrderData(orderData) {
            const monthlyDatasets = [];
            const dailyDatasets = [];

            orderData.data.forEach((site) => {
                if (site.count_datas && Array.isArray(site.count_datas) && site.count_datas.length > 0) {
                    const siteName = site.details.name;
                    const siteMonthlyOrders = Array(12).fill(0);
                    const siteDailyOrders = Array(latestMonthDays).fill(0);

                    site.count_datas.forEach((order) => {
                        if (order.year === selectedYear && Array.isArray(order.months) && order.months.length === 12) {
                            order.months.forEach((daysArray, monthIndex) => {
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
                        hidden: !selectedWebsites.has(siteName),
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
                        hidden: !selectedWebsites.has(siteName),
                    });
                }
            });

            return { monthlyDatasets, dailyDatasets };
        }

        function loadChartData() {
            // ✅ เก็บค่าที่ถูกเลือกไว้ก่อนโหลดข้อมูลใหม่
            const prevSelectedWebsites = new Set(selectedWebsites);
        
            const { monthlyDatasets, dailyDatasets: processedDailyDatasets } = processOrderData(orderData);
            fullDatasets = monthlyDatasets;
            dailyDatasets = processedDailyDatasets;
        
            // ✅ คืนค่า `hidden` ของ dataset ตามที่เคยเลือกไว้
            fullDatasets.forEach(dataset => {
                dataset.hidden = !prevSelectedWebsites.has(dataset.label);
                if (!dataset.hidden) selectedWebsites.add(dataset.label);
            });
        
            dailyDatasets.forEach(dataset => {
                dataset.hidden = !prevSelectedWebsites.has(dataset.label);
                if (!dataset.hidden) selectedWebsites.add(dataset.label);
            });
        
            if (chartInstance) {
                chartInstance.destroy();
            }
        
            chartInstance = new Chart(ctx, {
                type: "line",
                data: {
                    labels: showLatestMonth ? dailyLabels : monthLabels,
                    datasets: showLatestMonth ? dailyDatasets : fullDatasets,
                },
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
            });
        
            updateWebsiteControls();
        
            // ✅ คืนค่าที่ถูกเลือกไว้หลัง reload
            document.querySelectorAll(".website-checkbox").forEach((checkbox) => {
                if (selectedWebsites.has(checkbox.dataset.label)) {
                    checkbox.checked = true;
                }
            });
        
            toggleChart.checked = isShowChartChecked;
        }        

        function updateWebsiteControls() {
            let checkboxHTML = "<div class='row'>";
            fullDatasets.forEach((dataset, index) => {
                const isChecked = selectedWebsites.has(dataset.label);
                checkboxHTML += `
                    <div class="col-md-4 col-6 d-flex align-items-center">
                        <input type="checkbox" id="toggle-${index}" data-label="${dataset.label}" class="website-checkbox me-2" ${isChecked ? "checked" : ""}>
                        <label for="toggle-${index}" class="m-0">${dataset.label}</label>
                    </div>
                `;
            });
            checkboxHTML += "</div>";
        
            websiteControls.innerHTML = checkboxHTML;
        
            document.querySelectorAll(".website-checkbox").forEach((checkbox) => {
                checkbox.addEventListener("change", function () {
                    const siteName = this.dataset.label;
                    const datasetIndex = fullDatasets.findIndex(d => d.label === siteName);
                    
                    if (datasetIndex !== -1) {
                        chartInstance.data.datasets[datasetIndex].hidden = !this.checked;
                    }
        
                    if (this.checked) {
                        selectedWebsites.add(siteName);
                    } else {
                        selectedWebsites.delete(siteName);
                    }
        
                    chartInstance.update();
                });
            });
        }        

        toggleChart.addEventListener("change", function () {
            isShowChartChecked = this.checked;
            document.querySelectorAll(".website-checkbox").forEach((checkbox, index) => {
                checkbox.checked = this.checked;
                chartInstance.data.datasets[index].hidden = !this.checked;
        
                if (this.checked) {
                    selectedWebsites.add(chartInstance.data.datasets[index].label);
                } else {
                    selectedWebsites.delete(chartInstance.data.datasets[index].label);
                }
            });
            chartInstance.update();
        });
        

        latestMonthBtn.addEventListener("click", function () {
            showLatestMonth = !showLatestMonth;
            loadChartData();
            latestMonthBtn.textContent = showLatestMonth ? "ดูทั้งปี" : "1 เดือน";
        });

        loadChartData();
    } catch (error) {
        console.error("Error fetching order data:", error);
    }
});
