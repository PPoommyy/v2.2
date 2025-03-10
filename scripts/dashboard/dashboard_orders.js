document.addEventListener("DOMContentLoaded", async function () {
    const orderDashboard = document.getElementById("order-dashboard");
    const yearDropdownButton = document.getElementById("yearDropdown");
    const yearDropdownMenu = document.getElementById("yearDropdownMenu");
    const toggleChart = document.getElementById("toggleChart");
    const websiteControls = document.getElementById("website-controls");
    const latestMonthBtn = document.getElementById("latestMonthBtn");
    const latest3MonthsBtn = document.getElementById("latest3MonthsBtn");
    const latest6MonthsBtn = document.getElementById("latest6MonthsBtn");
    const latestYearBtn = document.getElementById("latestYearBtn");
    const filterDateRangeBtn = document.getElementById("filterDateRangeBtn");
    const dateStartInput = document.getElementById("order-date-input-start");
    const dateEndInput = document.getElementById("order-date-input-end");

    if (!orderDashboard || !toggleChart || !websiteControls) {
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
    let selectedYear = new Date().getFullYear();
    let selectedWebsites = new Set();
    let showMonthRange = 12; // ค่าเริ่มต้นให้แสดงทั้งปี
    let isShowChartChecked = toggleChart.checked;

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
                showMonthRange = 12;
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

        const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        function processOrderData(orderData) {
            const monthlyDatasets = [];

            orderData.data.forEach((site) => {
                if (site.count_datas && Array.isArray(site.count_datas) && site.count_datas.length > 0) {
                    const siteName = site.details.name;
                    const siteMonthlyOrders = Array(12).fill(0);

                    site.count_datas.forEach((order) => {
                        if (order.year === selectedYear && Array.isArray(order.months) && order.months.length === 12) {
                            order.months.forEach((daysArray, monthIndex) => {
                                if (Array.isArray(daysArray)) {
                                    const monthTotal = daysArray.reduce((sum, dayValue) => sum + (parseInt(dayValue) || 0), 0);
                                    siteMonthlyOrders[monthIndex] += monthTotal;
                                }
                            });
                        }
                    });

                    const color = getRandomDarkColor();
                    monthlyDatasets.push({
                        label: siteName,
                        data: siteMonthlyOrders,
                        borderColor: color,
                        backgroundColor: color.replace("1)", "0.3)"),
                        fill: false,
                        tension: 0.3,
                        pointRadius: 4,
                        borderWidth: 2,
                        hidden: !selectedWebsites.has(siteName),
                    });
                }
            });

            return { monthlyDatasets };
        }

        function loadChartData() {
            const { monthlyDatasets } = processOrderData(orderData);
            fullDatasets = monthlyDatasets;

            const filteredDatasets = fullDatasets.map(dataset => ({
                ...dataset,
                data: dataset.data.slice(12 - showMonthRange), // แสดงข้อมูลตามช่วงเดือนที่เลือก
                hidden: !selectedWebsites.has(dataset.label),
            }));

            if (chartInstance) {
                chartInstance.destroy();
            }

            chartInstance = new Chart(ctx, {
                type: "line",
                data: {
                    labels: monthLabels.slice(12 - showMonthRange),
                    datasets: filteredDatasets,
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
                            title: { display: true, text: "Number of Orders" },
                        },
                        x: {
                            title: { display: true, text: "Months" },
                        },
                    },
                },
            });

            updateWebsiteControls();
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
                    chartInstance.data.datasets[datasetIndex].hidden = !this.checked;
                    this.checked ? selectedWebsites.add(siteName) : selectedWebsites.delete(siteName);
                    chartInstance.update();
                });
            });
        }

        toggleChart.addEventListener("change", function () {
            document.querySelectorAll(".website-checkbox").forEach((checkbox, index) => {
                checkbox.checked = this.checked;
                chartInstance.data.datasets[index].hidden = !this.checked;
                this.checked ? selectedWebsites.add(chartInstance.data.datasets[index].label) : selectedWebsites.delete(chartInstance.data.datasets[index].label);
            });
            chartInstance.update();
        });

        latestMonthBtn.addEventListener("click", () => { showMonthRange = 1; loadChartData(); });
        latest3MonthsBtn.addEventListener("click", () => { showMonthRange = 3; loadChartData(); });
        latest6MonthsBtn.addEventListener("click", () => { showMonthRange = 6; loadChartData(); });
        latestYearBtn.addEventListener("click", () => { showMonthRange = 12; loadChartData(); });

        loadChartData();
    } catch (error) {
        console.error("Error fetching order data:", error);
    }
});
