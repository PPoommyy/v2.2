const testGetData = async () => {
  try {
    const response = await axios.get(
      `../../backend/test/test_db_import_2.php`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  const data = await testGetData();
});
