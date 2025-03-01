<!DOCTYPE html>
<html lang="en">
<?php include('../../templates/metadata.php');?>
<body>
    <?php include('../../templates/header.php');?>
    <div class="container mt-4">
        <h2>Stock Management</h2>
        
        <div class="d-flex justify-content-between align-items-center mb-3">
            <div class="btn-group" role="group" aria-label="Stock Menu">
                <input type="radio" class="btn-check" name="btnradio" id="total-stock" autocomplete="off" checked>
                <label class="btn btn-outline-warning" for="total-stock">TOTAL</label>
    
                <input type="radio" class="btn-check" name="btnradio" id="stock-in" autocomplete="off">
                <label class="btn btn-outline-success" for="stock-in">IN</label>
    
                <input type="radio" class="btn-check" name="btnradio" id="stock-out" autocomplete="off">
                <label class="btn btn-outline-danger" for="stock-out">OUT</label>
            </div>
            
            <div>
                <a href="stock_in.php" class="btn btn-outline-success"><i class="fa-solid fa-square-plus"></i> Import</a>
                <a href="export_stock.php" class="btn btn-outline-danger"><i class="fa-solid fa-square-minus"></i> Export</a>
            </div>
        </div>
        <div id="stock-container" class="overflow-scroll"></div>
        <div id="loading-spinner" class="spinner-border text-primary fixed-top top-50 start-50" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
    </div>
    <?php include("../../templates/footer.php"); ?>
    <script type="module" src="../../scripts/stock_management/stock.js"></script>
</body>
</html>