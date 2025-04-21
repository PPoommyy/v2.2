<!DOCTYPE html>
<html lang="en">
<?php include('../../templates_/metadata.php'); ?>

<body>
    <div class="container mt-4">
        <div class="card p-4 shadow-sm">
            <h2 class="mb-4 text-center">Purchase Order Viewer</h2>

            <div class="ratio ratio-16x9 mb-4" id="pdf-viewer">
                <iframe id="po-pdf-frame" class="rounded border" src="" allowfullscreen></iframe>
            </div>

            <div class="d-flex justify-content-center" id="actionArea">
                <button id="confirmButton" class="btn btn-success me-2">
                    <i class="fa fa-check-circle"></i> Confirm Purchase Order
                </button>
                <button id="rejectButton" class="btn btn-danger">
                    <i class="fa fa-times-circle"></i> Reject Purchase Order
                </button>
            </div>
        </div>
    </div>

    <?php include("../../templates_/footer.php"); ?>
    <script>
        document.addEventListener("DOMContentLoaded", function() {
            const urlParams = new URLSearchParams(window.location.search);
            const poOrderId = urlParams.get('po_order_id');

            const confirmButton = document.getElementById('confirmButton');
            const rejectButton = document.getElementById('rejectButton');
            const actionArea = document.getElementById('actionArea');

            if (poOrderId) {
                const pdfPath = `../../files/PO-${poOrderId}.pdf`;
                document.getElementById('po-pdf-frame').src = pdfPath;

                axios.get(`../../backend/get/get_po_status.php?po_order_id=${poOrderId}`)
                    .then(response => {
                        const status = response.data.po_order_status_id;

                        actionArea.innerHTML = '';

                        if (status == 1) {
                            actionArea.appendChild(confirmButton);
                            actionArea.appendChild(rejectButton);
                            confirmButton.style.display = 'inline-block';
                            rejectButton.style.display = 'inline-block';
                        } else if (status == 2) {
                            const processingText = document.createElement('div');
                            processingText.className = 'me-2 align-self-center fw-bold text-warning';
                            processingText.innerText = 'Processing...';
                            actionArea.appendChild(processingText);

                            const cancelButton = document.createElement('button');
                            cancelButton.className = 'btn btn-secondary';
                            cancelButton.innerHTML = '<i class="fa fa-ban"></i> Cancel';
                            cancelButton.addEventListener('click', function() {
                                sendConfirmation(poOrderId, 'cancel');
                            });
                            actionArea.appendChild(cancelButton);
                        } else if (status == 3) {
                            const completeText = document.createElement('div');
                            completeText.className = 'fw-bold text-success';
                            completeText.innerText = 'Complete';
                            actionArea.appendChild(completeText);
                        } else if (status == 4) {
                            const canceledText = document.createElement('div');
                            canceledText.className = 'fw-bold text-danger';
                            canceledText.innerText = 'PO Order Is Canceled';
                            actionArea.appendChild(canceledText);
                        } else {
                            const unknownText = document.createElement('div');
                            unknownText.className = 'fw-bold text-muted';
                            unknownText.innerText = 'Unknown Status';
                            actionArea.appendChild(unknownText);
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching status:', error);
                        alert('ไม่สามารถโหลดสถานะ PO ได้');
                    });

                confirmButton.addEventListener('click', function() {
                    sendConfirmation(poOrderId, "confirm");
                });

                rejectButton.addEventListener('click', function() {
                    sendConfirmation(poOrderId, "reject");
                });

            } else {
                alert("ไม่พบ PO Order ID ใน URL");
            }

            function sendConfirmation(poOrderId, action) {
                const apiUrl = `../../backend/api/confirm_po.php?po_order_id=${poOrderId}&action=${action}`;

                axios.get(apiUrl)
                    .then(response => {
                        alert("อัพเดทสถานะสำเร็จ");
                        location.reload();
                    })
                    .catch(error => {
                        console.error(error);
                        alert("เกิดข้อผิดพลาดในการอัพเดทสถานะ");
                    });
            }
        });
    </script>

</body>

</html>