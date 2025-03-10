<!DOCTYPE html>
<html lang="en">
<head>
    <title>Login</title>
    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
</head>
<body>
    <form id="loginForm">
        <input type="email" id="email" placeholder="Email" required>
        <input type="password" id="password" placeholder="Password" required>
        <button type="submit">Login</button>
    </form>
    <script>
        document.getElementById('loginForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await axios.post('backend/auth.php', { email, password });
                if (response.data.status === "success") {
                    localStorage.setItem('user', JSON.stringify(response.data.user));
                    window.location.href = 'dashboard.php';
                } else {
                    alert(response.data.message);
                }
            } catch (error) {
                console.error(error);
            }
        });
    </script>
</body>
</html>
