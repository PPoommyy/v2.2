const form = document.getElementById('exchangeRateForm');

form.addEventListener('submit', async function (event) {
  event.preventDefault();

  // Get the current date and time
  const currentDate = new Date();

  // Adjust the current date to the previous day if the current time is after 6:00 p.m. Bangkok time
  if (currentDate.getHours() >= 18) {
    currentDate.setDate(currentDate.getDate() - 1);
  }

  // Format the date as YYYY-MM-DD
  const formattedDate = currentDate.toISOString().slice(0, 10);

  const apiUrl = 'https://apigw1.bot.or.th/bot/public/Stat-ExchangeRate/v2/DAILY_AVG_EXG_RATE/';
  const apiKey = 'e41875a4-c980-4c81-9a2e-b40f09bf961c';
  const currency = 'JPY';
  
  try {
    const response = await axios.get(apiUrl, {
      params: {
        start_period: formattedDate,
        end_period: formattedDate,
        currency: currency,
      },
      headers: {
        'X-IBM-Client-Id': apiKey,
        'accept': 'application/json',
      },
    });

    // console.log(response.data.result.data);
  } catch (error) {
    console.error('Error fetching data:', error);
    // Handle errors
  }
});
