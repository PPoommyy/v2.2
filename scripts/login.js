import { Alert } from "../components/Alert.js";
const loginForm = document.getElementById('loginForm');

window.onload = (event) => {
    event.preventDefault();
    const dataToStore = {
        isLogIn: false,
    };

    sessionStorage.setItem('userData', JSON.stringify(dataToStore));
};

loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!username || !password) {
        Alert.showErrorMessage('Please enter a username and password');
        return;
    }

    axios.post('../backend/lokin.php', { username, password })
        .then(response => {
            if (response.data.res) {
                const expirationTime = 60 * 60 * 1000;
                const currentTime = new Date().getTime();

                const dataToStore = {
                    isLogIn: true,
                    expiration: currentTime + expirationTime,
                };

                sessionStorage.setItem('userData', JSON.stringify(dataToStore));
                Alert.showSuccessMessage('Login successful!');
                window.location.href = "../pages/order_list.php";
            } else {
                const dataToStore = {
                    isLogIn: false,
                };

                sessionStorage.setItem('userData', JSON.stringify(dataToStore));
                Alert.showErrorMessage('Login failed. Please check your credentials.');
            }
        })
        .catch(error => {
            Alert.showErrorMessage('Error!');
        });
});