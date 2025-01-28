<!DOCTYPE html>
<html lang="en">
  <?php include('../templates/metadata.php');?>
  <body>
      <?php include('../templates/header.php');?>
      <div class="container">
        <form id="exchangeRateForm">
          <!-- create download user data as csv button -->
          <button type="submit" class="btn btn-primary">Download User Data as CSV</button>
        </form>
      </div>
      <?php include("../templates/footer.php"); ?>
      <script type="module">
        import { Downloader } from "../components/Downloader.js";

        document.getElementById("exchangeRateForm").addEventListener("submit", function(event) {
          event.preventDefault();

          axios.get("../backend/get_user_data.php")
            .then((response) => {
              const userData = response.data;
              console.log("userData: ", userData);
              const userDataCsv = Downloader.generateUserDataCSV(userData);
            })
            .catch((error) => {
              console.error(error);
            });
        });
      </script>
      <script src="../assets/js/exceljs4.4.0.min.js"></script>
  </body>
</html>