document.addEventListener("DOMContentLoaded", async function() {
    try {
        const response = await axios.get("../../backend/lokin/check_permission.php");
        const menus = response.data.menus;
        
        document.querySelectorAll(".nav-item").forEach(item => {
            const menuName = item.getAttribute("data-menu");
            if (!menus.includes(menuName)) {
                item.style.display = "none";
            }
        });
    } catch (error) {
        console.error("Failed to fetch menus", error);
    }
});
