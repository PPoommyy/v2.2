<!DOCTYPE html>
<html lang="th">

<head>
    <title>เข้าสู่ระบบ - ระบบจัดการคำสั่งซื้อ</title>
    <?php /* ใส่ Metadata และ Link CSS ของ Bootstrap 5 ที่นี่ */ ?>
    <?php include('../../templates_/metadata.php'); ?>
    <style>
        /* Custom CSS เพื่อปรับแต่งเพิ่มเติม (ถ้าต้องการ) */
        .form-signin {
            max-width: 400px;
            /* จำกัดความกว้างสูงสุดของฟอร์ม */
            padding: 1rem;
        }

        .form-signin .form-floating:focus-within {
            z-index: 2;
        }

        .form-signin input[type="email"] {
            margin-bottom: -1px;
            border-bottom-right-radius: 0;
            border-bottom-left-radius: 0;
        }

        .form-signin input[type="password"] {
            margin-bottom: 10px;
            border-top-left-radius: 0;
            border-top-right-radius: 0;
        }

        .logo-img {
            max-width: 150px;
            /* ปรับขนาดตามต้องการ */
            margin-bottom: 1rem;
        }
    </style>
</head>

<body class="d-flex align-items-center py-4 bg-body-tertiary min-vh-100">
    <main class="form-signin w-100 m-auto text-center">
        <form id="loginForm">
            <h1 class="h3 mb-3 fw-normal">Order Management System</h1>

            <div id="alertPlaceholder"></div>
            <div class="form-floating mb-3">
                <input type="email" class="form-control" id="email" name="email" placeholder="name@example.com" required>
                <label for="email">อีเมล</label>
            </div>
            <div class="form-floating mb-3">
                <input type="password" class="form-control" id="password" name="password" placeholder="Password" required>
                <label for="password">รหัสผ่าน</label>
            </div>

            <button class="btn btn-primary w-100 py-2" type="submit" id="loginButton">
                <span class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true" id="loginSpinner"></span>
                <span id="loginButtonText">เข้าสู่ระบบ</span>
            </button>

        </form>
    </main>

    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
    <script type="module" src="../../scripts/lokin/lokin.js"></script>
</body>

</html>