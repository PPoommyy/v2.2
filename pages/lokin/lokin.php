<!DOCTYPE html>
<html lang="en">
<head>
    <title>Login</title>
</head>
<?php include('../../templates_/metadata.php');?>
<body>
    <!-- use bootstrap 5 to create beautiful login page for order management webapp -->
    <div class="container">
        <div class="row">
            <div class="col-md-6 offset-md-3 mt-5">
                <div class="card">
                    <div class="card-header">
                        <h4>Login</h4>
                    </div>
                    <div class="card-body">
                        <form id="loginForm">
                            <div class="form-group
                                <label for="email">Email</label>
                                <input type="email" class="form-control" id="email" name="email" required>
                            </div>
                            <div class="form-group
                                <label for="password">Password</label>
                                <input type="password" class="form-control" id="password" name="password" required>
                            </div>
                            <button type="submit" class="btn btn-primary">Login</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <?php include("../../templates_/footer.php"); ?>
    <script type="module" src="../../scripts/lokin/lokin.js"></script>
</body>
</html>
