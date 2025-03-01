document.addEventListener("DOMContentLoaded", async function () {
    const orderDashboard = document.getElementById("order-dashboard");
    const toggleChart = document.getElementById("toggleChart");
    const websiteControls = document.getElementById("website-controls");

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

    try {
        const response = await axios.get("../../backend/count/count_by.php?table=factories&column=*&order_by=id&key=factory_id&data_key=id&date=po_orders_date&table_key=po_orders");
        const orderData = response.data;

        if (!orderData || !Array.isArray(orderData.data)) {
            console.error("Invalid data format received:", orderData);
            return;
        }

        const getRandomDarkColor = () => {
            const r = Math.floor(Math.random() * 156) + 100;
            const g = Math.floor(Math.random() * 156) + 100;
            const b = Math.floor(Math.random() * 156) + 100;
            return `rgba(${r}, ${g}, ${b}, 1)`;
        };

        const transparentize = (color, opacity) => color.replace("1)", `${opacity})`);

        const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        function processOrderData(orderData) {
            const datasets = [];

            orderData.data.forEach((site) => {
                if (site.count_datas && Array.isArray(site.count_datas) && site.count_datas.length > 0) {
                    const siteName = site.details.name;
                    const siteOrders = Array(12).fill(0);

                    site.count_datas.forEach((order) => {
                        if (order.year === 2024 && Array.isArray(order.months) && order.months.length === 12) {
                            order.months.forEach((value, index) => {
                                siteOrders[index] += parseInt(value) || 0;
                            });
                        }
                    });

                    const color = getRandomDarkColor();
                    datasets.push({
                        label: siteName,
                        data: siteOrders,
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

            return datasets;
        }

        const datasets = processOrderData(orderData);

        if (datasets.length === 0) {
            console.warn("No valid data for the chart.");
            return;
        }

        const data = {
            labels: labels,
            datasets: datasets,
        };

        const config = {
            type: "line",
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2,
                plugins: {
                    legend: { display: false },
                    title: { display: true, text: "Order Count per Website (2024)" },
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        suggestedMin: 0,
                        suggestedMax: Math.max(...datasets.flatMap(d => d.data)) + 10,
                        title: { display: true, text: "Number of Orders" },
                    },
                    x: {
                        title: { display: true, text: "Months" },
                    },
                },
            },
        };

        chartInstance = new Chart(ctx, config);

        let checkboxHTML = "<div class='row'>";
        datasets.forEach((dataset, index) => {
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

        toggleChart.addEventListener("change", function () {
            const checkboxes = document.querySelectorAll(".website-checkbox");
            checkboxes.forEach((checkbox, index) => {
                checkbox.checked = this.checked;
                chartInstance.data.datasets[index].hidden = !this.checked;
            });
            chartInstance.update();
        });

    } catch (error) {
        console.error("Error fetching order data:", error);
    }
});
