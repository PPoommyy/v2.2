import { Alert } from "../../components/Alert.js";

const loginForm = document.getElementById("loginForm");
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const response = await axios.post("../../backend/lokin/auth.php", {
    email,
    password,
  });
  const data = response.data;
  if (data.user) {
    await Alert.showSuccessMessage(data.message);
    setTimeout(() => {
      localStorage.setItem("user", JSON.stringify(data.user));
      location.href = "../../pages/dashboard/dashboard_orders.php";
    }, 2000);
  } else {
    await Alert.showErrorMessage(data.message);
  }
});
