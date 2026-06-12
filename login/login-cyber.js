/* ═════════════════════════════════════════════════════════════ */
/* CYBERPUNK MARKET - JAVASCRIPT v2.0 */
/* 3D Background | Authentication | Interactive Effects */
/* ═════════════════════════════════════════════════════════════ */

// ═════════════════════════════════════════════════════════════
// 3D BACKGROUND WITH THREE.JS
// ═════════════════════════════════════════════════════════════

class CyberpunkBackground {
    constructor() {
        this.scene = new THREE.Scene();
        this.canvas = document.getElementById('canvas3d');
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        this.camera = new THREE.PerspectiveCamera(
            75,
            this.width / this.height,
            0.1,
            1000
        );
        this.camera.position.z = 50;
        
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true,
            antialias: true
        });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setClearColor(0x0a0e27, 0.1);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        
        this.particles = [];
        this.lines = [];
        
        this.createParticles();
        this.createNetworkLines();
        this.setupLights();
        
        window.addEventListener('resize', () => this.onWindowResize());
        this.animate();
    }
    
    createParticles() {
        const geometry = new THREE.BufferGeometry();
        const particleCount = 100;
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 200;
            positions[i + 1] = (Math.random() - 0.5) * 200;
            positions[i + 2] = (Math.random() - 0.5) * 200;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0x00d9ff,
            size: 2,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.8
        });
        
        const points = new THREE.Points(geometry, material);
        this.scene.add(points);
        this.particles.push({
            mesh: points,
            positions: positions,
            velocities: new Float32Array(particleCount * 3).map(() => (Math.random() - 0.5) * 2)
        });
    }
    
    createNetworkLines() {
        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0xff006e,
            transparent: true,
            opacity: 0.3
        });
        
        for (let i = 0; i < 5; i++) {
            const points = [];
            for (let j = 0; j < 8; j++) {
                points.push(
                    new THREE.Vector3(
                        (Math.random() - 0.5) * 150,
                        (Math.random() - 0.5) * 150,
                        (Math.random() - 0.5) * 150
                    )
                );
            }
            
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, lineMaterial);
            this.scene.add(line);
            this.lines.push({ line, points });
        }
    }
    
    setupLights() {
        const light1 = new THREE.PointLight(0x00d9ff, 100, 500);
        light1.position.set(100, 100, 100);
        this.scene.add(light1);
        
        const light2 = new THREE.PointLight(0xff006e, 80, 400);
        light2.position.set(-100, -100, 50);
        this.scene.add(light2);
        
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(ambientLight);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Rotate camera
        this.camera.position.x = Math.sin(Date.now() * 0.0001) * 60;
        this.camera.position.y = Math.cos(Date.now() * 0.00008) * 40;
        this.camera.lookAt(0, 0, 0);
        
        // Update particles
        this.particles.forEach(particle => {
            for (let i = 0; i < particle.positions.length; i += 3) {
                particle.positions[i] += particle.velocities[i];
                particle.positions[i + 1] += particle.velocities[i + 1];
                particle.positions[i + 2] += particle.velocities[i + 2];
                
                // Bounce off boundaries
                if (Math.abs(particle.positions[i]) > 100) particle.velocities[i] *= -1;
                if (Math.abs(particle.positions[i + 1]) > 100) particle.velocities[i + 1] *= -1;
                if (Math.abs(particle.positions[i + 2]) > 100) particle.velocities[i + 2] *= -1;
            }
            particle.mesh.geometry.attributes.position.needsUpdate = true;
        });
        
        // Rotate lines
        this.lines.forEach(lineObj => {
            lineObj.line.rotation.x += 0.0005;
            lineObj.line.rotation.y += 0.0008;
        });
        
        this.renderer.render(this.scene, this.camera);
    }
    
    onWindowResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.width, this.height);
    }
}

// ═════════════════════════════════════════════════════════════
// AUTH MANAGER
// ═════════════════════════════════════════════════════════════

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.accounts = [];
        this.initDefaultAccounts();
    }
    
    initDefaultAccounts() {
        this.accounts = [
            { username: 'admin', email: 'admin@cyber.com', password: this.hashPassword('123456'), fullname: 'Admin User', role: 'admin' },
            { username: 'manager', email: 'manager@cyber.com', password: this.hashPassword('123456'), fullname: 'Manager User', role: 'manager' },
            { username: 'staff', email: 'staff@cyber.com', password: this.hashPassword('123456'), fullname: 'Staff User', role: 'staff' }
        ];
    }
    
    hashPassword(password) {
        return btoa(password);
    }
    
    verifyPassword(password, hash) {
        return this.hashPassword(password) === hash;
    }
    
    async login(username, password) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const account = this.accounts.find(a => a.username === username || a.email === username);
                if (account && this.verifyPassword(password, account.password)) {
                    this.currentUser = account;
                    localStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('currentUser', JSON.stringify(account));
                    resolve({ success: true, user: account });
                } else {
                    resolve({ success: false, error: 'Invalid credentials' });
                }
            }, 500);
        });
    }
    
    async register(userData) {
        return new Promise((resolve) => {
            setTimeout(() => {
                if (this.accounts.find(a => a.username === userData.username)) {
                    resolve({ success: false, error: 'Username already exists' });
                    return;
                }
                if (this.accounts.find(a => a.email === userData.email)) {
                    resolve({ success: false, error: 'Email already registered' });
                    return;
                }
                
                const newAccount = {
                    ...userData,
                    password: this.hashPassword(userData.password),
                    role: 'user'
                };
                delete newAccount.confirmPassword;
                
                this.accounts.push(newAccount);
                this.currentUser = newAccount;
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('currentUser', JSON.stringify(newAccount));
                resolve({ success: true, user: newAccount });
            }, 500);
        });
    }
}

// ═════════════════════════════════════════════════════════════
// FORM MANAGER
// ═════════════════════════════════════════════════════════════

class FormManager {
    constructor(authManager) {
        this.auth = authManager;
        this.currentTab = 'login';
        this.init();
    }
    
    init() {
        this.setupTabSwitching();
        this.setupFormHandlers();
        this.setupPasswordToggle();
        this.setupPasswordStrength();
        this.setupThemeToggle();
        this.restoreRememberedUser();
    }
    
    setupTabSwitching() {
        const tabs = document.querySelectorAll('.cyber-tab');
        const contents = document.querySelectorAll('.tab-content');
        const indicator = document.querySelector('.cyber-tab-indicator');
        
        tabs.forEach((tab, index) => {
            tab.addEventListener('click', () => {
                // Remove active state
                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));
                
                // Add active state
                tab.classList.add('active');
                const tabName = tab.dataset.tab;
                document.getElementById(`${tabName}-tab`).classList.add('active');
                this.currentTab = tabName;
                
                // Update indicator
                const tabWidth = tab.offsetWidth;
                const tabLeft = tab.offsetLeft;
                indicator.style.width = tabWidth + 'px';
                indicator.style.left = tabLeft + 'px';
                
                // Update header
                this.updateHeader(tabName);
            });
        });
        
        // Initialize indicator
        const activeTab = tabs[0];
        indicator.style.width = activeTab.offsetWidth + 'px';
        indicator.style.left = activeTab.offsetLeft + 'px';
    }
    
    updateHeader(tabName) {
        const titleMap = {
            login: '[ ACCESS GRANTED ]',
            register: '[ INITIALIZE ACCOUNT ]',
            forgot: '[ SYSTEM RECOVERY ]'
        };
        document.getElementById('authTitle').textContent = titleMap[tabName];
    }
    
    setupFormHandlers() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.querySelector('#login-username').value;
            const password = document.querySelector('#login-password').value;
            
            const result = await this.auth.login(username, password);
            if (result.success) {
                showToast('[ LOGIN SUCCESSFUL ] Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = '../main/index.html';
                }, 1000);
            } else {
                showToast(result.error, 'error');
            }
        });
        
        // Register form
        document.getElementById('registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(document.getElementById('registerForm'));
            const userData = Object.fromEntries(formData);
            
            // Validation
            if (!this.validateRegister(userData)) return;
            
            const result = await this.auth.register(userData);
            if (result.success) {
                showToast('[ ACCOUNT CREATED ] Initializing...', 'success');
                setTimeout(() => {
                    window.location.href = '../main/index.html';
                }, 1000);
            } else {
                showToast(result.error, 'error');
            }
        });
        
        // Forgot password form
        document.getElementById('forgotForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.querySelector('#forgot-email').value;
            showToast('[ RESET LINK SENT ] Check your email', 'success');
        });
    }
    
    validateRegister(data) {
        const errors = {};
        
        if (data.fullname.length < 3) errors.fullname = 'Name too short';
        if (!this.isValidEmail(data.email)) errors.email = 'Invalid email';
        if (data.username.length < 3) errors.username = 'Username too short';
        if (data.password.length < 8) errors.password = 'Password too short';
        if (data.password !== data.confirmPassword) errors.confirmPassword = 'Passwords do not match';
        if (!data.agreeTerms) errors.agreeTerms = 'You must agree to terms';
        
        if (Object.keys(errors).length > 0) {
            Object.entries(errors).forEach(([field, msg]) => {
                const errorEl = document.querySelector(`[name="${field}"]`).parentElement.nextElementSibling;
                if (errorEl && errorEl.classList.contains('form-error')) {
                    errorEl.textContent = msg;
                    errorEl.classList.add('show');
                }
            });
            return false;
        }
        return true;
    }
    
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    
    setupPasswordToggle() {
        document.querySelectorAll('.password-toggle').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const input = this.parentElement.querySelector('input');
                const isPassword = input.type === 'password';
                input.type = isPassword ? 'text' : 'password';
                this.innerHTML = isPassword ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
            });
        });
    }
    
    setupPasswordStrength() {
        const passwordInput = document.getElementById('reg-password');
        if (passwordInput) {
            passwordInput.addEventListener('input', () => {
                const password = passwordInput.value;
                const strength = this.calculateStrength(password);
                
                const strengthBar = document.querySelector('.strength-bar');
                const strengthText = document.querySelector('.strength-text');
                
                if (strengthBar) {
                    strengthBar.style.setProperty('--fill-width', strength.percentage + '%');
                    strengthBar.innerHTML = `<div style="width: ${strength.percentage}%; height: 100%; background: ${strength.color}; box-shadow: 0 0 10px ${strength.color};"></div>`;
                }
                if (strengthText) {
                    strengthText.textContent = strength.level;
                    strengthText.style.color = strength.color;
                }
            });
        }
    }
    
    calculateStrength(password) {
        let score = 0;
        if (password.length > 8) score++;
        if (password.length > 12) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^a-zA-Z0-9]/.test(password)) score++;
        
        const levels = ['WEAK', 'FAIR', 'GOOD', 'STRONG', 'VERY STRONG', 'EXTREME'];
        const colors = ['#ff006e', '#ff8c00', '#ffd60a', '#00d9ff', '#39ff14', '#b500ff'];
        
        return {
            score,
            level: levels[Math.min(score, 5)],
            color: colors[Math.min(score, 5)],
            percentage: (score / 6) * 100
        };
    }
    
    setupThemeToggle() {
        const toggle = document.getElementById('themeToggle');
        toggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('cyberpunk-theme', isDark ? 'dark' : 'light');
        });
        
        // Restore theme
        const savedTheme = localStorage.getItem('cyberpunk-theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
        }
    }
    
    restoreRememberedUser() {
        const remembered = localStorage.getItem('rememberedUser');
        if (remembered) {
            document.querySelector('#login-username').value = remembered;
        }
        
        document.querySelector('[name="remember"]').addEventListener('change', (e) => {
            if (e.target.checked) {
                localStorage.setItem('rememberedUser', document.querySelector('#login-username').value);
            } else {
                localStorage.removeItem('rememberedUser');
            }
        });
    }
}

// ═════════════════════════════════════════════════════════════
// UI UTILITIES
// ═════════════════════════════════════════════════════════════

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `cyber-toast ${type}`;
    
    const icons = {
        success: '✓',
        error: '✗',
        info: 'ℹ'
    };
    
    toast.innerHTML = `<span>${icons[type]}</span> <span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.4s ease-out reverse';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// ═════════════════════════════════════════════════════════════
// INITIALIZATION
// ═════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in
    if (localStorage.getItem('isLoggedIn') === 'true') {
        window.location.href = '../main/index.html';
    }
    
    // Initialize 3D background
    try {
        new CyberpunkBackground();
    } catch (err) {
        console.warn('Three.js not loaded, skipping 3D background');
    }
    
    // Initialize auth system
    const authManager = new AuthManager();
    new FormManager(authManager);
    
    // Show startup message
    setTimeout(() => {
        showToast('[ SYSTEM ONLINE ] READY FOR AUTHENTICATION', 'success');
    }, 500);
});
