// Khi trang tải xong
document.addEventListener("DOMContentLoaded", () => {
    const loginBtn = document.querySelector(".login-btn");

    // Hiệu ứng chào mừng
    const banner = document.querySelector(".banner h1");
    banner.style.transition = "transform 0.5s ease, color 0.5s ease";
    banner.addEventListener("mouseover", () => {
        banner.style.transform = "scale(1.05)";
        banner.style.color = "#f1c40f";
    });
    banner.addEventListener("mouseout", () => {
        banner.style.transform = "scale(1)";
        banner.style.color = "#fff";
    });

    // Xử lý nút Login
    loginBtn.addEventListener("click", () => {
        alert("Chuyển đến trang đăng nhập!");
        // Có thể thay bằng: window.location.href = "login.html";
    });

    // Hiệu ứng cho danh mục
    const categories = document.querySelectorAll(".category-item");
    categories.forEach(item => {
        item.addEventListener("click", () => {
            alert(`Bạn đã chọn danh mục: ${item.textContent}`);
        });
    });

    // Hiệu ứng sản phẩm
    const products = document.querySelectorAll(".product-card");
    products.forEach(card => {
        card.addEventListener("mouseover", () => {
            card.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
        });
        card.addEventListener("mouseout", () => {
            card.style.boxShadow = "0 2px 6px rgba(0,0,0,0.1)";
        });
    });

    // Tìm kiếm sản phẩm
    const searchInput = document.querySelector(".banner input");
    searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            alert(`Tìm kiếm sản phẩm: ${searchInput.value}`);
        }
    });
});
