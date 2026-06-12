/* ===== SuperMarket Pro - Advanced Authentication System ===== */
/* Modern Login/Register with 3D Effects, Validation & Theme Toggle */

// ===== CONSTANTS & CONFIGURATION =====
const CONFIG = {
    ANIMATION_DURATION: 300,
    TOAST_DURATION: 4000,
    API_TIMEOUT: 5000,
    PASSWORD_MIN_LENGTH: 8,
    USERNAME_MIN_LENGTH: 3
};

// ===== UTILITY FUNCTIONS =====
const Utils = {
    // Show toast notification
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            info: 'fa-info-circle',
            warning: 'fa-warning'
        };
        
        toast.innerHTML = `
            <i class="fas ${icons[type] || icons.info} toast-icon"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, CONFIG.TOAST_DURATION);
    },

    // Show modal confirmation
    showModal(title, message) {
        return new Promise((resolve) => {
            const modal = document.getElementById('confirmModal');
            document.getElementById('modalTitle').textContent = title;
            document.getElementById('modalMessage').textContent = message;
            
            const confirmBtn = document.getElementById('modalConfirm');
            const cancelBtn = document.getElementById('modalCancel');
            const closeBtn = document.querySelector('.modal-close');
            
            const cleanup = () => {
                modal.classList.remove('show');
                confirmBtn.removeEventListener('click', onConfirm);
                cancelBtn.removeEventListener('click', onCancel);
                closeBtn.removeEventListener('click', onCancel);
            };
            
            const onConfirm = () => {
                cleanup();
                resolve(true);
            };
            
            const onCancel = () => {
                cleanup();
                resolve(false);
            };
            
            modal.classList.add('show');
            confirmBtn.addEventListener('click', onConfirm);
            cancelBtn.addEventListener('click', onCancel);
            closeBtn.addEventListener('click', onCancel);
        });
    },

    // Validate email
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    // Validate username
    isValidUsername(username) {
        return /^[a-zA-Z0-9_]{3,20}$/.test(username);
    },

    // Check password strength
    checkPasswordStrength(password) {
        let strength = 0;
        if (password.length >= CONFIG.PASSWORD_MIN_LENGTH) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[!@#$%^&*]/.test(password)) strength++;
        
        return {
            score: strength,
            level: ['Rất yếu', 'Yếu', 'Trung bình', 'Khá', 'Mạnh', 'Rất mạnh'][strength],
            color: ['#e74c3c', '#e74c3c', '#f39c12', '#f39c12', '#27ae60', '#27ae60'][strength]
        };
    },

    // Local storage helpers
    storage: {
        set(key, value) {
            localStorage.setItem(key, JSON.stringify(value));
        },
        get(key) {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        },
        remove(key) {
            localStorage.removeItem(key);
        },
        clear(prefix = '') {
            Object.keys(localStorage).forEach(key => {
                if (!prefix || key.startsWith(prefix)) {
                    localStorage.removeItem(key);
                }
            });
        }
    }
};

// ===== 3D CANVAS BACKGROUND =====
class CanvasBackground {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.resize();
        this.init();
        window.addEventListener('resize', () => this.resize());
        this.animate();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    init() {
        this.particles = [];
        for (let i = 0; i < 50; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                z: Math.random() * 200 + 50,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                vz: (Math.random() - 0.5) * 1
            });
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.strokeStyle = 'rgba(102, 126, 234, 0.3)';
        this.ctx.lineWidth = 1;

        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.z += p.vz;

            if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;
            if (p.z < 50) p.vz *= -1;
            if (p.z > 250) p.vz *= -1;

            const scale = 200 / p.z;
            const x = p.x * scale;
            const y = p.y * scale;
            const size = 2 * (1 - (p.z - 50) / 200);

            this.ctx.fillStyle = `rgba(102, 126, 234, ${0.5 * (1 - (p.z - 50) / 200)})`;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }

        requestAnimationFrame(() => this.animate());
    }
}

// ===== PARTICLE SYSTEM =====
class ParticleSystem {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.particles = [];
        this.init();
    }

    init() {
        for (let i = 0; i < 30; i++) {
            this.createParticle();
        }
    }

    createParticle() {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        const size = Math.random() * 4 + 2;
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;
        const duration = Math.random() * 20 + 10;
        
        particle.style.cssText = `
            left: ${x}px;
            top: ${y}px;
            width: ${size}px;
            height: ${size}px;
            animation: float ${duration}s ease-in-out infinite;
        `;
        
        this.container.appendChild(particle);
    }
}

// ===== AUTHENTICATION MANAGER =====
class AuthManager {
    constructor() {
        this.currentUser = Utils.storage.get('currentUser');
        this.accounts = Utils.storage.get('accounts') || [];
        this.initDefaultAccounts();
    }

    initDefaultAccounts() {
        if (this.accounts.length === 0) {
            this.accounts = [
                {
                    id: 1,
                    fullname: 'Quản Trị Viên',
                    email: 'admin@supermarket.vn',
                    username: 'admin',
                    password: this.hashPassword('123456'),
                    role: 'Admin',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 2,
                    fullname: 'Nguyễn Văn Quản Lý',
                    email: 'manager@supermarket.vn',
                    username: 'manager',
                    password: this.hashPassword('123456'),
                    role: 'Quản Lý',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 3,
                    fullname: 'Trần Thị Nhân Viên',
                    email: 'staff@supermarket.vn',
                    username: 'staff',
                    password: this.hashPassword('123456'),
                    role: 'Nhân Viên',
                    createdAt: new Date().toISOString()
                }
            ];
            Utils.storage.set('accounts', this.accounts);
        }
    }

    hashPassword(password) {
        // Simple hash for demo (use bcrypt in production)
        return btoa(password);
    }

    verifyPassword(password, hash) {
        return btoa(password) === hash;
    }

    async login(username, password) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const account = this.accounts.find(acc => 
                    (acc.username === username || acc.email === username) && 
                    this.verifyPassword(password, acc.password)
                );

                if (account) {
                    const user = { ...account };
                    delete user.password;
                    this.currentUser = user;
                    Utils.storage.set('currentUser', user);
                    Utils.storage.set('isLoggedIn', true);
                    resolve({ success: true, user });
                } else {
                    resolve({ success: false, error: 'Thông tin đăng nhập không chính xác' });
                }
            }, 1000);
        });
    }

    async register(userData) {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Validation
                if (this.accounts.find(acc => acc.username === userData.username)) {
                    resolve({ success: false, error: 'Tên đăng nhập đã tồn tại' });
                    return;
                }

                if (this.accounts.find(acc => acc.email === userData.email)) {
                    resolve({ success: false, error: 'Email đã được đăng ký' });
                    return;
                }

                const newAccount = {
                    id: this.accounts.length + 1,
                    ...userData,
                    password: this.hashPassword(userData.password),
                    role: 'Nhân Viên',
                    createdAt: new Date().toISOString()
                };

                delete newAccount.confirmPassword;
                this.accounts.push(newAccount);
                Utils.storage.set('accounts', this.accounts);

                resolve({ success: true, message: 'Đăng ký thành công' });
            }, 1000);
        });
    }

    async forgotPassword(email) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const account = this.accounts.find(acc => acc.email === email || acc.username === email);
                
                if (account) {
                    // Simulate sending reset email
                    resolve({ 
                        success: true, 
                        message: 'Đã gửi link đặt lại mật khẩu đến email của bạn' 
                    });
                } else {
                    resolve({ 
                        success: false, 
                        error: 'Không tìm thấy tài khoản với email/username này' 
                    });
                }
            }, 1000);
        });
    }

    logout() {
        this.currentUser = null;
        Utils.storage.remove('currentUser');
        Utils.storage.remove('isLoggedIn');
    }
}

// ===== FORM VALIDATOR =====
class FormValidator {
    constructor(formId) {
        this.form = document.getElementById(formId);
        this.errors = {};
    }

    validate() {
        this.errors = {};
        const inputs = this.form.querySelectorAll('input[required]');

        inputs.forEach(input => {
            this.validateField(input);
        });

        return Object.keys(this.errors).length === 0;
    }

    validateField(field) {
        const value = field.value.trim();
        const name = field.name;
        const errorElement = field.parentElement.parentElement.querySelector('.form-error');

        if (field.type === 'text' && name === 'fullname') {
            if (value.length < 3) {
                this.setError(name, 'Họ tên phải từ 3 ký tự trở lên', errorElement);
            }
        }

        if (field.type === 'email') {
            if (!Utils.isValidEmail(value)) {
                this.setError(name, 'Email không hợp lệ', errorElement);
            }
        }

        if (field.type === 'text' && name === 'username') {
            if (!Utils.isValidUsername(value)) {
                this.setError(name, 'Username phải 3-20 ký tự, chỉ chứa chữ, số, gạch dưới', errorElement);
            }
        }

        if (field.type === 'password' && name === 'password') {
            if (value.length < CONFIG.PASSWORD_MIN_LENGTH) {
                this.setError(name, `Mật khẩu phải từ ${CONFIG.PASSWORD_MIN_LENGTH} ký tự trở lên`, errorElement);
            }
        }

        if (field.type === 'password' && name === 'confirmPassword') {
            const passwordField = this.form.querySelector('input[name="password"]');
            if (value !== passwordField.value) {
                this.setError(name, 'Mật khẩu xác nhận không khớp', errorElement);
            }
        }

        if (field.type === 'checkbox' && name === 'agreeTerms') {
            if (!field.checked) {
                this.setError(name, 'Vui lòng đồng ý với điều khoản', errorElement);
            }
        }

        // Remove error if field is now valid
        if (!this.errors[name] && errorElement) {
            errorElement.classList.remove('show');
        }
    }

    setError(fieldName, message, errorElement) {
        this.errors[fieldName] = message;
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }
}

// ===== FORM MANAGER =====
class FormManager {
    constructor() {
        this.authManager = new AuthManager();
        this.loginForm = document.getElementById('loginForm');
        this.registerForm = document.getElementById('registerForm');
        this.forgotForm = document.getElementById('forgotForm');
        this.init();
    }

    init() {
        this.setupTabSwitching();
        this.setupFormHandlers();
        this.setupPasswordToggle();
        this.setupPasswordStrength();
        this.setupRealTimeValidation();
        this.setupThemeToggle();
        this.restoreRememberedUser();
    }

    setupTabSwitching() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        const indicator = document.querySelector('.tab-indicator');

        tabBtns.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                // Update active states
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                btn.classList.add('active');

                const tabId = btn.getAttribute('data-tab');
                document.getElementById(tabId + '-tab').classList.add('active');

                // Update indicator position
                const rect = btn.getBoundingClientRect();
                const parentRect = btn.parentElement.getBoundingClientRect();
                indicator.style.width = btn.offsetWidth + 'px';
                indicator.style.left = (btn.offsetLeft) + 'px';

                // Update footer text
                const footerText = document.getElementById('footerText');
                const authTitle = document.getElementById('authTitle');
                const authSubtitle = document.getElementById('authSubtitle');

                if (tabId === 'login') {
                    authTitle.textContent = 'Đăng Nhập';
                    authSubtitle.textContent = 'Truy cập hệ thống quản lý';
                    footerText.innerHTML = 'Chưa có tài khoản? <a href="#register" class="link-primary">Đăng ký ngay</a>';
                } else if (tabId === 'register') {
                    authTitle.textContent = 'Đăng Ký';
                    authSubtitle.textContent = 'Tạo tài khoản mới';
                    footerText.innerHTML = 'Đã có tài khoản? <a href="#login" class="link-primary">Đăng nhập</a>';
                } else if (tabId === 'forgot') {
                    authTitle.textContent = 'Quên Mật Khẩu';
                    authSubtitle.textContent = 'Đặt lại mật khẩu của bạn';
                    footerText.innerHTML = '<a href="#login" class="link-primary">Quay lại đăng nhập</a>';
                }
            });
        });

        // Set initial indicator position
        const activeBtn = document.querySelector('.tab-btn.active');
        indicator.style.width = activeBtn.offsetWidth + 'px';
        indicator.style.left = activeBtn.offsetLeft + 'px';
    }

    setupFormHandlers() {
        // Login form
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));

        // Register form
        this.registerForm.addEventListener('submit', (e) => this.handleRegister(e));

        // Forgot password form
        this.forgotForm.addEventListener('submit', (e) => this.handleForgotPassword(e));
    }

    async handleLogin(e) {
        e.preventDefault();

        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        const remember = document.getElementById('remember').checked;

        if (!username || !password) {
            Utils.showToast('Vui lòng điền đầy đủ thông tin', 'error');
            return;
        }

        const result = await this.authManager.login(username, password);

        if (result.success) {
            if (remember) {
                Utils.storage.set('rememberMe', { username });
            }

            Utils.showToast('✓ Đăng nhập thành công!', 'success');
            
            setTimeout(() => {
                window.location.href = '../main/index.html';
            }, 1500);
        } else {
            Utils.showToast(result.error, 'error');
            document.getElementById('login-password').value = '';
        }
    }

    async handleRegister(e) {
        e.preventDefault();

        const validator = new FormValidator('registerForm');
        if (!validator.validate()) {
            Utils.showToast('Vui lòng kiểm tra lại các trường', 'error');
            return;
        }

        const formData = {
            fullname: document.getElementById('reg-fullname').value.trim(),
            email: document.getElementById('reg-email').value.trim(),
            username: document.getElementById('reg-username').value.trim(),
            password: document.getElementById('reg-password').value,
            confirmPassword: document.getElementById('reg-confirm-password').value
        };

        const result = await this.authManager.register(formData);

        if (result.success) {
            Utils.showToast(result.message, 'success');
            this.registerForm.reset();

            // Switch to login tab
            setTimeout(() => {
                document.querySelector('[data-tab="login"]').click();
                document.getElementById('login-username').focus();
            }, 1500);
        } else {
            Utils.showToast(result.error, 'error');
        }
    }

    async handleForgotPassword(e) {
        e.preventDefault();

        const email = document.getElementById('forgot-email').value.trim();

        if (!email) {
            Utils.showToast('Vui lòng nhập email hoặc username', 'error');
            return;
        }

        const result = await this.authManager.forgotPassword(email);

        if (result.success) {
            Utils.showToast(result.message, 'success');
            this.forgotForm.reset();
        } else {
            Utils.showToast(result.error, 'error');
        }
    }

    setupPasswordToggle() {
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const input = btn.parentElement.querySelector('input[type="password"], input[type="text"]');
                const icon = btn.querySelector('i');

                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        });
    }

    setupPasswordStrength() {
        const passwordInput = document.getElementById('reg-password');
        if (!passwordInput) return;

        passwordInput.addEventListener('input', (e) => {
            const strength = Utils.checkPasswordStrength(e.target.value);
            const strengthFill = document.querySelector('.strength-fill');
            const strengthText = document.querySelector('.strength-text');

            if (strengthFill && strengthText) {
                strengthFill.style.width = (strength.score * 20) + '%';
                strengthFill.style.backgroundColor = strength.color;
                strengthText.textContent = `Độ mạnh: ${strength.level}`;
                strengthText.style.color = strength.color;
            }
        });
    }

    setupRealTimeValidation() {
        document.querySelectorAll('input[required]').forEach(input => {
            input.addEventListener('blur', () => {
                const formId = input.form.id;
                const validator = new FormValidator(formId);
                validator.validateField(input);
            });

            input.addEventListener('input', () => {
                const errorElement = input.parentElement.parentElement.querySelector('.form-error');
                if (errorElement && errorElement.classList.contains('show')) {
                    const formId = input.form.id;
                    const validator = new FormValidator(formId);
                    validator.validateField(input);
                }
            });
        });
    }

    setupThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        const savedTheme = Utils.storage.get('theme') || 'light';

        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }

        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            const isDark = document.body.classList.contains('dark-theme');
            Utils.storage.set('theme', isDark ? 'dark' : 'light');
            themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        });
    }

    restoreRememberedUser() {
        const remembered = Utils.storage.get('rememberMe');
        if (remembered && remembered.username) {
            document.getElementById('login-username').value = remembered.username;
            document.getElementById('remember').checked = true;
            document.getElementById('login-password').focus();
        }
    }
}

// ===== SOCIAL LOGIN HANDLERS =====
class SocialAuthHandlers {
    static setupHandlers() {
        document.querySelectorAll('.social-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const provider = btn.classList[1].replace('-btn', '');
                this.handleSocialLogin(provider);
            });
        });
    }

    static handleSocialLogin(provider) {
        const providers = {
            google: 'Google',
            facebook: 'Facebook',
            github: 'GitHub'
        };

        Utils.showToast(`Tính năng đăng nhập với ${providers[provider]} đang được phát triển`, 'info');
    }
}

// ===== FOOTER LINK HANDLERS =====
class FooterLinkHandlers {
    static setupHandlers() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('link-primary')) {
                e.preventDefault();
                const href = e.target.getAttribute('href');
                const tabName = href.substring(1);
                document.querySelector(`[data-tab="${tabName}"]`).click();
            }
        });
    }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    // Initialize 3D background
    new CanvasBackground('bgCanvas');

    // Initialize particles
    new ParticleSystem('particlesContainer');

    // Initialize form manager
    new FormManager();

    // Setup social login
    SocialAuthHandlers.setupHandlers();

    // Setup footer links
    FooterLinkHandlers.setupHandlers();

    // Check if user is already logged in
    if (Utils.storage.get('isLoggedIn')) {
        window.location.href = '../main/index.html';
    }
});

// ===== DEBUGGING =====
console.log('%c🏪 SuperMarket Pro - Advanced Authentication System', 'font-size: 16px; color: #667eea; font-weight: bold;');
console.log('%cDemo Accounts:', 'font-weight: bold;');
console.log('admin / 123456');
console.log('manager / 123456');
console.log('staff / 123456');