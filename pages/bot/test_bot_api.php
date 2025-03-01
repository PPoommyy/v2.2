<!DOCTYPE html>
<html lang="en">
  <?php include('../../templates/metadata.php');?>
  <body>
      <?php include('../../templates/header.php');?>
      <div class="container">
        <form id="exchangeRateForm">
          <div class="form-group">
              <label for="startDate">Start Date</label>
              <input type="date" class="form-control" id="startDate" name="startDate" >
          </div>
          <div class="form-group">
              <label for="endDate">End Date</label>
              <input type="date" class="form-control" id="endDate" name="endDate" >
          </div>
          <button type="submit" class="btn btn-primary">Get Exchange Rate</button>
        </form>
      </div>
      <?php include("../../templates/footer.php"); ?>
      <script type="module" src="../../scripts/testBotApi.js"></script>
  </body>
</html>