/* ═════════════════════════════════════════════════════════════ */
/* DASHBOARD ORCHESTRATOR - Central Module Controller */
/* Module switching | Real-time updates | System health */
/* ═════════════════════════════════════════════════════════════ */

/**
 * DashboardOrchestrator - Main application controller
 * Coordinates all modules: inventory, financial, analytics
 */
class DashboardOrchestrator {
    constructor() {
        this.currentModule = 'dashboard';
        this.modules = {
            'dashboard': { name: 'Dashboard', icon: 'fa-chart-line' },
            'inventory': { name: 'Inventory Grid', icon: 'fa-boxes' },
            'financial': { name: 'Financial Hub', icon: 'fa-dollar-sign' },
            'analytics': { name: 'Analytics', icon: 'fa-chart-pie' },
            'settings': { name: 'Settings', icon: 'fa-cog' }
        };
        this.activeListeners = new Map();
        this.isInitialized = false;
        
        observability.logger.info('Dashboard Orchestrator initialized');
    }
    
    /**
     * Initialize the dashboard system
     */
    async initialize() {
        try {
            observability.performanceMonitor.mark('dashboard-init-start');
            
            // Wait for DOM ready
            if (document.readyState === 'loading') {
                await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
            }
            
            // Initialize modules
            this.setupModuleNavigation();
            this.setupModuleEvents();
            this.setupRealTimeUpdates();
            this.setupSystemMonitoring();
            
            // Initialize 3D background (optional, for dashboard module)
            this.initialize3DBackground();
            
            // Load initial module
            this.switchModule('dashboard');
            
            const duration = observability.performanceMonitor.measure(
                'dashboard-init',
                'dashboard-init-start'
            );
            
            this.isInitialized = true;
            observability.logger.info('Dashboard initialization complete', { duration });
            
            return { success: true, duration };
        } catch (error) {
            observability.errorHandler.handleError(error, { context: 'Dashboard initialization' });
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Setup navigation between modules
     */
    setupModuleNavigation() {
        const navItems = document.querySelectorAll('[data-module]');
        
        navItems.forEach(item => {
            const moduleKey = item.getAttribute('data-module');
            
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchModule(moduleKey);
            });
        });
        
        observability.logger.info('Module navigation setup complete', { 
            itemCount: navItems.length 
        });
    }
    
    /**
     * Switch to different module
     */
    switchModule(moduleKey) {
        if (!this.modules[moduleKey]) {
            observability.logger.warn('Unknown module requested', { module: moduleKey });
            return;
        }
        
        // Hide all modules
        document.querySelectorAll('[data-module-content]').forEach(el => {
            el.style.display = 'none';
        });
        
        // Show selected module
        const moduleContent = document.getElementById(`${moduleKey}-module`);
        if (moduleContent) {
            moduleContent.style.display = 'block';
            
            // Trigger module initialization
            this.initializeModule(moduleKey);
        }
        
        // Update navigation highlight
        document.querySelectorAll('[data-module]').forEach(el => {
            el.classList.toggle('active', el.getAttribute('data-module') === moduleKey);
        });
        
        this.currentModule = moduleKey;
        observability.logger.info('Module switched', { from: this.currentModule, to: moduleKey });
    }
    
    /**
     * Initialize specific module
     */
    initializeModule(moduleKey) {
        switch (moduleKey) {
            case 'dashboard':
                this.initializeDashboard();
                break;
            case 'inventory':
                this.initializeInventoryModule();
                break;
            case 'financial':
                this.initializeFinancialModule();
                break;
            case 'analytics':
                this.initializeAnalyticsModule();
                break;
            case 'settings':
                this.initializeSettingsModule();
                break;
        }
    }
    
    /**
     * Initialize dashboard main view
     */
    initializeDashboard() {
        // Update stat cards
        const stats = this.generateDashboardStats();
        
        const statCards = document.querySelectorAll('.stat-card');
        const cardData = [
            { label: 'Total Revenue', value: stats.revenue, icon: 'fa-dollar-sign' },
            { label: 'Transactions', value: stats.transactions, icon: 'fa-exchange' },
            { label: 'Active Products', value: stats.products, icon: 'fa-box' },
            { label: 'System Health', value: stats.health, icon: 'fa-heart' }
        ];
        
        statCards.forEach((card, index) => {
            if (cardData[index]) {
                const value = card.querySelector('.stat-value');
                if (value) {
                    value.textContent = cardData[index].value;
                }
            }
        });
        
        // Setup charts
        this.setupDashboardCharts();
        
        observability.logger.info('Dashboard initialized');
    }
    
    /**
     * Generate dashboard statistics
     */
    generateDashboardStats() {
        const financialData = financialHub.getAccountingDashboard(30);
        const inventoryData = inventoryGrid.inventory.getStatistics();
        
        return {
            revenue: this.formatCurrency(financialData.revenue),
            transactions: financialData.transactionCount,
            products: inventoryData.totalProducts,
            health: '98%'
        };
    }
    
    /**
     * Setup dashboard charts
     */
    setupDashboardCharts() {
        const revenueChartId = 'revenueChart';
        const categoryChartId = 'categoryChart';
        
        if (document.getElementById(revenueChartId)) {
            analyticsEngine.setupRevenueChart(revenueChartId);
        }
        
        if (document.getElementById(categoryChartId)) {
            analyticsEngine.setupCategoryChart(categoryChartId);
        }
    }
    
    /**
     * Initialize inventory module
     */
    initializeInventoryModule() {
        const container = document.getElementById('inventory-module');
        if (!container) return;
        
        // Get current filters from UI
        const categoryFilter = container.querySelector('[data-filter="category"]')?.value;
        const stockFilter = container.querySelector('[data-filter="stock"]')?.value;
        
        inventoryGrid.setFilters({
            category: categoryFilter,
            stockStatus: stockFilter
        });
        
        // Render inventory table
        this.renderInventoryTable();
        
        // Setup search
        const searchInput = container.querySelector('[data-search="products"]');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const results = inventoryGrid.search(e.target.value);
                this.renderInventoryTable(results);
            });
        }
        
        observability.logger.info('Inventory module initialized');
    }
    
    /**
     * Render inventory table
     */
    renderInventoryTable(products = null) {
        const tbody = document.querySelector('#inventory-module tbody');
        if (!tbody) return;
        
        const data = products || inventoryGrid.getProducts().data;
        
        tbody.innerHTML = data.map(product => `
            <tr data-sku="${product.sku}">
                <td>${product.sku}</td>
                <td>${product.name}</td>
                <td>${product.category}</td>
                <td>${this.formatCurrency(product.price.retail)}</td>
                <td>${product.stock.current}</td>
                <td>${product.getAvailableStock()}</td>
                <td>
                    <span class="badge ${product.isLowStock() ? 'badge-warning' : 'badge-success'}">
                        ${product.isLowStock() ? 'LOW' : 'OK'}
                    </span>
                </td>
                <td>
                    <button class="btn-edit" onclick="orchestrator.editProduct('${product.sku}')">Edit</button>
                </td>
            </tr>
        `).join('');
    }
    
    /**
     * Initialize financial module
     */
    initializeFinancialModule() {
        const container = document.getElementById('financial-module');
        if (!container) return;
        
        const dashboard = financialHub.getAccountingDashboard(30);
        
        // Update financial cards
        const financialCards = container.querySelectorAll('.financial-card');
        const cardData = [
            { label: 'Total Revenue', value: this.formatCurrency(dashboard.revenue) },
            { label: 'Total Expenses', value: this.formatCurrency(dashboard.expenses) },
            { label: 'Net Profit', value: this.formatCurrency(dashboard.profit) },
            { label: 'Profit Margin', value: dashboard.profitMargin }
        ];
        
        financialCards.forEach((card, index) => {
            if (cardData[index]) {
                const value = card.querySelector('.card-value');
                if (value) {
                    value.textContent = cardData[index].value;
                }
            }
        });
        
        // Render transactions table
        this.renderTransactionsTable();
        
        observability.logger.info('Financial module initialized');
    }
    
    /**
     * Render transactions table
     */
    renderTransactionsTable() {
        const tbody = document.querySelector('#financial-module tbody');
        if (!tbody) return;
        
        const transactions = financialHub.getTransactions({ limit: 50 });
        
        tbody.innerHTML = transactions.map(txn => `
            <tr data-txn="${txn.id}">
                <td>${txn.id.substr(0, 15)}...</td>
                <td>${new Date(txn.date).toLocaleDateString('vi-VN')}</td>
                <td>${txn.type}</td>
                <td>${this.formatCurrency(txn.calculateTotals().total)}</td>
                <td>
                    <span class="badge badge-${txn.status === 'completed' ? 'success' : 'warning'}">
                        ${txn.status}
                    </span>
                </td>
            </tr>
        `).join('');
    }
    
    /**
     * Initialize analytics module
     */
    initializeAnalyticsModule() {
        const container = document.getElementById('analytics-module');
        if (!container) return;
        
        // Setup charts
        analyticsEngine.setupRevenueChart('analyticsRevenueChart');
        analyticsEngine.setupCategoryChart('analyticsCategoryChart');
        
        // Display KPIs
        const kpis = analyticsEngine.calculateKPIs();
        const trends = analyticsEngine.getTrendAnalysis();
        
        const trendContainer = container.querySelector('[data-trends]');
        if (trendContainer) {
            trendContainer.innerHTML = trends.map(trend => `
                <div class="trend-card">
                    <div class="trend-metric">${trend.metric}</div>
                    <div class="trend-value">${trend.value}</div>
                    <div class="trend-change ${trend.status}">
                        <i class="fas fa-arrow-${trend.trend}"></i> ${trend.percentageChange}
                    </div>
                </div>
            `).join('');
        }
        
        observability.logger.info('Analytics module initialized');
    }
    
    /**
     * Initialize settings module
     */
    initializeSettingsModule() {
        const container = document.getElementById('settings-module');
        if (!container) return;
        
        // Setup system info
        const systemInfo = document.querySelector('[data-system-info]');
        if (systemInfo) {
            const health = observability.healthCheck.getStatus();
            systemInfo.innerHTML = `
                <div>System Health: ${health.status}</div>
                <div>Memory: ${(performance.memory?.usedJSHeapSize / 1048576).toFixed(2)} MB</div>
                <div>Last Sync: ${new Date().toLocaleTimeString()}</div>
            `;
        }
        
        observability.logger.info('Settings module initialized');
    }
    
    /**
     * Setup module-specific event handlers
     */
    setupModuleEvents() {
        // Inventory events
        document.addEventListener('inventory-update', (e) => {
            if (this.currentModule === 'inventory') {
                this.renderInventoryTable();
            }
        });
        
        // Financial events
        document.addEventListener('transaction-created', (e) => {
            if (this.currentModule === 'financial') {
                this.renderTransactionsTable();
            }
        });
        
        observability.logger.info('Module event handlers setup complete');
    }
    
    /**
     * Setup real-time updates
     */
    setupRealTimeUpdates() {
        setInterval(() => {
            if (this.isInitialized) {
                // Update dashboard stats every 10 seconds
                if (this.currentModule === 'dashboard') {
                    const stats = this.generateDashboardStats();
                    // Update only if changed
                }
                
                // Update financial data every 5 seconds
                if (this.currentModule === 'financial') {
                    this.renderTransactionsTable();
                }
            }
        }, 5000);
        
        observability.logger.info('Real-time updates setup complete');
    }
    
    /**
     * Setup system monitoring
     */
    setupSystemMonitoring() {
        observability.healthCheck.register('dashboard', async () => {
            return {
                status: 'healthy',
                modules: Object.keys(this.modules).length,
                loaded: this.isInitialized
            };
        }, 30000);
        
        observability.healthCheck.startMonitoring();
        observability.logger.info('System monitoring started');
    }
    
    /**
     * Initialize 3D background (optional)
     */
    initialize3DBackground() {
        const canvas = document.getElementById('dashboardCanvas3d');
        if (!canvas && typeof THREE !== 'undefined') {
            try {
                // Only initialize if canvas exists
                // 3D background could be added later
            } catch (error) {
                observability.logger.warn('3D background initialization skipped', { error: error.message });
            }
        }
    }
    
    /**
     * Edit product (modal)
     */
    editProduct(sku) {
        const product = inventoryGrid.getProductDetails(sku);
        if (!product) return;
        
        // Create modal or navigate to edit page
        observability.logger.info('Product edit requested', { sku });
    }
    
    /**
     * Format currency
     */
    formatCurrency(value) {
        return new Intl.NumberFormat('vi-VN', { 
            style: 'currency', 
            currency: 'VND',
            minimumFractionDigits: 0 
        }).format(value);
    }
    
    /**
     * Get system status
     */
    getSystemStatus() {
        const health = observability.healthCheck.getStatus();
        const memory = performance.memory;
        
        return {
            status: health.status,
            moduleStatus: Object.keys(this.modules).reduce((acc, key) => {
                acc[key] = 'active';
                return acc;
            }, {}),
            memory: memory ? (memory.usedJSHeapSize / memory.jsHeapSizeLimit * 100).toFixed(2) + '%' : 'N/A',
            uptime: Math.floor((Date.now() - performance.timing.navigationStart) / 1000) + 's'
        };
    }
    
    /**
     * Shutdown dashboard
     */
    shutdown() {
        analyticsEngine.stopLiveAnalytics();
        observability.healthCheck.stopMonitoring();
        this.isInitialized = false;
        observability.logger.info('Dashboard shutdown complete');
    }
}

// Global instance
const orchestrator = new DashboardOrchestrator();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        orchestrator.initialize();
    });
} else {
    orchestrator.initialize();
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardOrchestrator;
}
