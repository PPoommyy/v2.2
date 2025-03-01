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
    const response = await axios.get("../../backend/get/order/get_orders_by_websites.php");
    const orderData = response.data;


    const randomColor = () =>
      `rgba(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, 1)`;

    const transparentize = (color, opacity) => color.replace("1)", `${opacity})`);

    const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    function processOrderData(orderData) {
      const datasets = [];

      orderData.data.forEach((site) => {
        if (site.orders && site.orders.length > 0) {
          const siteName = site.details.name;
          const siteOrders = Array(12).fill(0);
          site.orders.forEach((order) => {
            if (order.year === 2024 && order.months.length === 12) {
              order.months.forEach((value, index) => {
                siteOrders[index] += parseInt(value) || 0;
              });
            }
          });

          const color = randomColor();
          datasets.push({
            label: siteName,
            data: siteOrders,
            borderColor: color,
            backgroundColor: transparentize(color, 0.5),
            fill: false,
            tension: 0.2,
            pointRadius: 3,
            borderWidth: 2, 
          });
        }
      });

      return datasets;
    }

    const datasets = processOrderData(orderData);

    if (datasets.length === 0) {
      console.error("No valid data for the chart.");
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
        plugins: {
          legend: { position: "top" },
          title: { display: true, text: "Order Count per Website (2024)" },
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
    };

    new Chart(ctx, config);

  } catch (error) {
    console.error("Error fetching order data:", error);
  }
});
