document.addEventListener('DOMContentLoaded', function() {
    // ===== KHỞI TẠO DỮ LIỆU ===== 
    initializeAccounts();
    
    // ===== TAB SWITCHING ===== 
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Xóa active class
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Thêm active class
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId + '-tab').classList.add('active');
            
            // Xóa thông báo
            clearMessages();
        });
    });
    
    // ===== LOGIN FORM ===== 
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', handleLogin);
    
    // ===== REGISTER FORM ===== 
    const registerForm = document.getElementById('registerForm');
    registerForm.addEventListener('submit', handleRegister);
    
    // ===== HÀM ĐĂNG NHẬP ===== 
    function handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        const remember = document.getElementById('remember').checked;
        const message = document.getElementById('loginMessage');
        
        clearMessages();
        
        // Lấy tài khoản từ localStorage
        const accounts = JSON.parse(localStorage.getItem('accounts')) || [];
        const account = accounts.find(acc => acc.username === username && acc.password === password);
        
        if (account) {
            // Đăng nhập thành công
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', username);
            localStorage.setItem('role', account.role);
            
            if (remember) {
                localStorage.setItem('rememberMe', 'true');
                localStorage.setItem('savedUsername', username);
            }
            
            showMessage(message, '✓ Đăng nhập thành công! Đang chuyển hướng...', 'success');
            
            setTimeout(function() {
                window.location.href = '../main/index.html';
            }, 1500);
        } else {
            showMessage(message, '✗ Tên đăng nhập hoặc mật khẩu không đúng!', 'error');
            document.getElementById('login-password').value = '';
            document.getElementById('login-password').focus();
        }
    }
    
    // ===== HÀM ĐĂNG KÝ ===== 
    function handleRegister(e) {
        e.preventDefault();
        
        const fullname = document.getElementById('reg-fullname').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const username = document.getElementById('reg-username').value.trim();
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-confirm-password').value;
        const agreeTerms = document.getElementById('agree-terms').checked;
        const message = document.getElementById('registerMessage');
        
        clearMessages();
        
        // Kiểm tra dữ liệu
        if (!fullname || !email || !username || !password || !confirmPassword) {
            showMessage(message, '✗ Vui lòng điền đầy đủ tất cả các trường!', 'error');
            return;
        }
        
        if (password.length < 6) {
            showMessage(message, '✗ Mật khẩu phải ít nhất 6 ký tự!', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showMessage(message, '✗ Mật khẩu xác nhận không khớp!', 'error');
            return;
        }
        
        if (!agreeTerms) {
            showMessage(message, '✗ Vui lòng đồng ý với điều khoản dịch vụ!', 'error');
            return;
        }
        
        // Kiểm tra username đã tồn tại
        const accounts = JSON.parse(localStorage.getItem('accounts')) || [];
        if (accounts.find(acc => acc.username === username)) {
            showMessage(message, '✗ Tên đăng nhập này đã tồn tại!', 'error');
            return;
        }
        
        if (accounts.find(acc => acc.email === email)) {
            showMessage(message, '✗ Email này đã được đăng ký!', 'error');
            return;
        }
        
        // Tạo tài khoản mới
        const newAccount = {
            fullname: fullname,
            email: email,
            username: username,
            password: password,
            role: 'Nhân viên',
            createdAt: new Date().toLocaleString('vi-VN')
        };
        
        accounts.push(newAccount);
        localStorage.setItem('accounts', JSON.stringify(accounts));
        
        // Hiển thị thông báo thành công
        showMessage(message, '✓ Đăng ký thành công! Vui lòng đăng nhập.', 'success');
        
        // Reset form
        document.getElementById('registerForm').reset();
        
        // Chuyển sang tab login sau 2 giây
        setTimeout(function() {
            document.querySelector('[data-tab="login"]').click();
            document.getElementById('login-username').focus();
        }, 2000);
    }
    
    // ===== HÀM HIỂN THỊ THÔNG BÁO ===== 
    function showMessage(element, text, type) {
        element.textContent = text;
        element.className = 'message ' + type;
    }
    
    // ===== HÀM XÓA THÔNG BÁO ===== 
    function clearMessages() {
        document.getElementById('loginMessage').textContent = '';
        document.getElementById('registerMessage').textContent = '';
    }
    
    // ===== HÀM KHỞI TẠO ACCOUNTS ===== 
    function initializeAccounts() {
        const savedAccounts = localStorage.getItem('accounts');
        
        if (!savedAccounts) {
            const demoAccounts = [
                { fullname: 'Quản trị viên', email: 'admin@supermarket.vn', username: 'admin', password: '123456', role: 'Admin', createdAt: '2026-01-01 08:00:00' },
                { fullname: 'Nguyễn Văn Quản Lý', email: 'manager@supermarket.vn', username: 'manager', password: '123456', role: 'Quản lý', createdAt: '2026-01-01 08:00:00' },
                { fullname: 'Trần Thị Nhân Viên', email: 'staff@supermarket.vn', username: 'staff', password: '123456', role: 'Nhân viên', createdAt: '2026-01-01 08:00:00' }
            ];
            
            localStorage.setItem('accounts', JSON.stringify(demoAccounts));
        }
    }
    
    // ===== KHI NHỚ ĐĂNG NHẬP ===== 
    if (localStorage.getItem('rememberMe') === 'true') {
        document.getElementById('login-username').value = localStorage.getItem('savedUsername');
        document.getElementById('remember').checked = true;
        document.getElementById('login-password').focus();
    }
});