document.addEventListener('DOMContentLoaded', function() {
    // ===== KIỂM TRA ĐĂNG NHẬP ===== 
    checkLogin();
    
    // ===== CẬP NHẬT THÔNG TIN NGƯỜI DÙNG ===== 
    function updateUserInfo() {
        const username = localStorage.getItem('username');
        const role = localStorage.getItem('role');
        const userInfo = document.getElementById('userInfo');
        
        if (username) {
            userInfo.textContent = `👤 ${username} (${role})`;
        }
    }
    
    // ===== KIỂM TRA XÁC THỰC ===== 
    function checkLogin() {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        
        if (isLoggedIn !== 'true') {
            alert('Vui lòng đăng nhập để truy cập trang này!');
            window.location.href = '../login/login.html';
            return;
        }
        
        updateUserInfo();
    }
    
    // ===== XỬ LÝ ĐĂNG XUẤT ===== 
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn.addEventListener('click', function() {
        if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('username');
            localStorage.removeItem('role');
            window.location.href = '../login/login.html';
        }
    });
    
    // ===== XỬ LÝ DANH MỤC ===== 
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        card.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            alert(`Xem sản phẩm: ${this.querySelector('h3').textContent}\n(Danh mục: ${category})`);
        });
    });
    
    // ===== XỬ LÝ TÌM KIẾM ===== 
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    
    function performSearch() {
        const searchTerm = searchInput.value.trim();
        if (searchTerm) {
            alert(`Tìm kiếm: "${searchTerm}"\nCó ${Math.floor(Math.random() * 100) + 1} kết quả tìm thấy`);
            searchInput.value = '';
        } else {
            alert('Vui lòng nhập từ khóa tìm kiếm!');
        }
    }
    
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // ===== XỬ LÝ THÊM VÀO GIỎ HÀNG ===== 
    const addBtns = document.querySelectorAll('.btn-add');
    addBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const productName = this.parentElement.querySelector('h4').textContent;
            const price = this.parentElement.querySelector('.price').textContent;
            
            btn.textContent = '✓ Đã thêm';
            btn.style.backgroundColor = '#27ae60';
            
            setTimeout(() => {
                btn.textContent = 'Thêm vào giỏ';
                btn.style.backgroundColor = '';
            }, 1500);
            
            console.log(`Sản phẩm: ${productName} - ${price}`);
        });
    });
    
    // ===== HIỆU ỨNG CUỘN TRANG ===== 
    const navLinks = document.querySelectorAll('.navbar a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href.startsWith('#')) {
                e.preventDefault();
                
                // Xóa class active cũ
                navLinks.forEach(l => l.classList.remove('active'));
                // Thêm class active cho link hiện tại
                this.classList.add('active');
                
                // Cuộn đến phần tương ứng
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
    
    // ===== HIỆU ỨNG LOADING ===== 
    window.addEventListener('load', function() {
        document.body.style.opacity = '1';
    });
});
