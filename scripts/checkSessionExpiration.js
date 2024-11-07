function checkSessionExpiration() {
    const storedData = sessionStorage.getItem('userData');

    if (storedData) {
        const parsedData = JSON.parse(storedData);
        if (!parsedData.isLogIn || parsedData.expiration < Date.now()) {
            sessionStorage.removeItem('userData');
            //window.location.href = "../pages/login.php";
        }
    } else {
        //window.location.href = "../pages/login.php";
    }
}

const expirationCheckInterval = setInterval(checkSessionExpiration, 60 * 1000);

window.onload = (event) => {
    event.preventDefault();
    checkSessionExpiration();
};

window.onbeforeunload = () => {
    clearInterval(expirationCheckInterval);
};
