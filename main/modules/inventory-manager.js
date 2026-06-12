/* ═════════════════════════════════════════════════════════════ */
/* INVENTORY MANAGER - Virtual Grid System */
/* SKU Management | Real-time Updates | Bulk Operations */
/* ═════════════════════════════════════════════════════════════ */

/**
 * InventoryGrid - Virtual grid with real-time updates and bulk operations
 * Handles thousands of SKUs efficiently
 */
class InventoryGrid {
    constructor() {
        this.inventory = new Inventory();
        this.filters = {};
        this.sortBy = 'name';
        this.pageSize = 50;
        this.currentPage = 0;
        this.searchIndex = new Map();
        this.updateQueue = [];
        this.isProcessing = false;
        
        observability.logger.info('Inventory Grid initialized');
    }
    
    /**
     * Populate with demo data
     */
    populateDemoData() {
        const categories = ['Electronics', 'Groceries', 'Clothing', 'Home & Garden', 'Books', 'Sports'];
        
        const demoProducts = [
            // Electronics
            { name: 'Laptop Dell XPS', category: 'Electronics', cost: 8000000, retail: 12000000, stock: 15 },
            { name: 'iPhone 15 Pro', category: 'Electronics', cost: 5000000, retail: 7500000, stock: 45 },
            { name: 'Samsung TV 55"', category: 'Electronics', cost: 3000000, retail: 4500000, stock: 8 },
            
            // Groceries
            { name: 'Rice (5kg)', category: 'Groceries', cost: 50000, retail: 85000, stock: 200 },
            { name: 'Coffee Arabica (1kg)', category: 'Groceries', cost: 120000, retail: 200000, stock: 85 },
            { name: 'Milk 1L', category: 'Groceries', cost: 15000, retail: 25000, stock: 150 },
            
            // Clothing
            { name: 'T-Shirt Cotton', category: 'Clothing', cost: 50000, retail: 150000, stock: 200 },
            { name: 'Jeans Blue', category: 'Clothing', cost: 100000, retail: 300000, stock: 120 },
            { name: 'Sneakers Nike', category: 'Clothing', cost: 200000, retail: 600000, stock: 45 },
            
            // Home & Garden
            { name: 'LED Bulb 10W', category: 'Home & Garden', cost: 30000, retail: 75000, stock: 300 },
            { name: 'Vacuum Cleaner', category: 'Home & Garden', cost: 500000, retail: 1200000, stock: 12 },
            { name: 'Bed Sheet Set', category: 'Home & Garden', cost: 80000, retail: 200000, stock: 50 },
            
            // Books
            { name: 'Cyberpunk Novel', category: 'Books', cost: 30000, retail: 80000, stock: 40 },
            { name: 'Business Guide', category: 'Books', cost: 50000, retail: 140000, stock: 25 },
            
            // Sports
            { name: 'Yoga Mat', category: 'Sports', cost: 80000, retail: 200000, stock: 60 },
            { name: 'Basketball', category: 'Sports', cost: 200000, retail: 500000, stock: 30 }
        ];
        
        demoProducts.forEach((data, index) => {
            const product = new Product({
                sku: `SKU-${1000 + index}`,
                name: data.name,
                category: data.category,
                cost: data.cost,
                retail: data.retail,
                stock: {
                    current: data.stock,
                    reserved: Math.floor(data.stock * 0.1),
                    reorderLevel: Math.floor(data.stock * 0.2),
                    reorderQuantity: Math.floor(data.stock * 0.5)
                }
            });
            
            this.inventory.addProduct(product);
            this.indexProduct(product);
        });
        
        observability.logger.info('Inventory demo data populated', { 
            productCount: demoProducts.length 
        });
    }
    
    /**
     * Index product for quick search
     */
    indexProduct(product) {
        // SKU index
        this.searchIndex.set(product.sku.toLowerCase(), product);
        
        // Name index (word-based)
        product.name.toLowerCase().split(' ').forEach(word => {
            if (!this.searchIndex.has(word)) {
                this.searchIndex.set(word, []);
            }
            if (Array.isArray(this.searchIndex.get(word))) {
                this.searchIndex.get(word).push(product);
            }
        });
    }
    
    /**
     * Search products by SKU or name
     */
    search(query) {
        const normalizedQuery = query.toLowerCase();
        const results = [];
        
        // Direct SKU match
        const skuMatch = this.inventory.getProduct(normalizedQuery);
        if (skuMatch) results.push(skuMatch);
        
        // Word-based search
        Array.from(this.inventory.products.values()).forEach(product => {
            if (product.name.toLowerCase().includes(normalizedQuery) && !results.includes(product)) {
                results.push(product);
            }
        });
        
        return results;
    }
    
    /**
     * Apply filters
     */
    setFilters(filters) {
        this.filters = filters;
    }
    
    /**
     * Get filtered and paginated products
     */
    getProducts() {
        let products = Array.from(this.inventory.products.values());
        
        // Apply category filter
        if (this.filters.category) {
            products = products.filter(p => p.category === this.filters.category);
        }
        
        // Apply stock status filter
        if (this.filters.stockStatus) {
            if (this.filters.stockStatus === 'low') {
                products = products.filter(p => p.isLowStock());
            } else if (this.filters.stockStatus === 'out') {
                products = products.filter(p => p.stock.current === 0);
            } else if (this.filters.stockStatus === 'in') {
                products = products.filter(p => p.stock.current > 0);
            }
        }
        
        // Apply price range filter
        if (this.filters.minPrice || this.filters.maxPrice) {
            products = products.filter(p => {
                const price = p.price.retail;
                const minOk = !this.filters.minPrice || price >= this.filters.minPrice;
                const maxOk = !this.filters.maxPrice || price <= this.filters.maxPrice;
                return minOk && maxOk;
            });
        }
        
        // Sort
        products.sort((a, b) => {
            if (this.sortBy === 'name') {
                return a.name.localeCompare(b.name);
            } else if (this.sortBy === 'price') {
                return a.price.retail - b.price.retail;
            } else if (this.sortBy === 'stock') {
                return b.stock.current - a.stock.current;
            }
            return 0;
        });
        
        // Paginate
        const start = this.currentPage * this.pageSize;
        const end = start + this.pageSize;
        
        return {
            data: products.slice(start, end),
            total: products.length,
            page: this.currentPage,
            pageSize: this.pageSize,
            totalPages: Math.ceil(products.length / this.pageSize)
        };
    }
    
    /**
     * Get single product details
     */
    getProductDetails(sku) {
        const product = this.inventory.getProduct(sku);
        
        if (!product) {
            observability.logger.warn('Product not found', { sku });
            return null;
        }
        
        return {
            ...product,
            availableStock: product.getAvailableStock(),
            profitMargin: product.getProfitMargin(),
            isLowStock: product.isLowStock(),
            totalValue: product.stock.current * product.price.cost
        };
    }
    
    /**
     * Update single product
     */
    updateProduct(sku, updates) {
        const product = this.inventory.getProduct(sku);
        
        if (!product) {
            observability.logger.error('Product not found for update', { sku });
            return { success: false, error: 'Product not found' };
        }
        
        try {
            // Apply updates
            Object.assign(product, updates);
            product.lastUpdated = new Date().toISOString();
            
            this.indexProduct(product);
            
            observability.logger.info('Product updated', { sku, updates });
            return { success: true, product };
        } catch (error) {
            observability.errorHandler.handleError(error, { sku, updates });
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Deduct stock (sale)
     */
    deductStock(sku, quantity) {
        const product = this.inventory.getProduct(sku);
        
        if (!product) {
            return { success: false, error: 'Product not found' };
        }
        
        if (product.getAvailableStock() < quantity) {
            observability.logger.warn('Insufficient stock', { 
                sku, 
                requested: quantity, 
                available: product.getAvailableStock() 
            });
            return { success: false, error: 'Insufficient stock' };
        }
        
        product.updateStock(quantity, 'deduct');
        observability.logger.info('Stock deducted', { sku, quantity });
        return { success: true, newStock: product.stock.current };
    }
    
    /**
     * Restore stock (refund)
     */
    restoreStock(sku, quantity) {
        const product = this.inventory.getProduct(sku);
        
        if (!product) {
            return { success: false, error: 'Product not found' };
        }
        
        product.updateStock(quantity, 'add');
        product.updateStock(quantity, 'unreserve');
        observability.logger.info('Stock restored', { sku, quantity });
        return { success: true, newStock: product.stock.current };
    }
    
    /**
     * Bulk update stock from queue
     */
    queueBulkUpdate(updates) {
        this.updateQueue.push(...updates);
        this.processBulkUpdates();
    }
    
    /**
     * Process bulk updates efficiently
     */
    async processBulkUpdates() {
        if (this.isProcessing || this.updateQueue.length === 0) return;
        
        this.isProcessing = true;
        observability.performanceMonitor.mark('bulk-update-start');
        
        try {
            const batch = this.updateQueue.splice(0, 100); // Process 100 at a time
            const results = this.inventory.bulkUpdateStock(batch);
            
            const duration = observability.performanceMonitor.measure(
                'bulk-update',
                'bulk-update-start'
            );
            
            observability.logger.info('Bulk update processed', { 
                count: batch.length, 
                duration,
                results 
            });
            
            // Continue if more updates pending
            if (this.updateQueue.length > 0) {
                setTimeout(() => this.processBulkUpdates(), 100);
            }
        } finally {
            this.isProcessing = false;
        }
    }
    
    /**
     * Get inventory insights
     */
    getInsights() {
        const stats = this.inventory.getStatistics();
        const lowStockItems = this.inventory.getLowStockProducts();
        
        return {
            statistics: stats,
            lowStockItems: lowStockItems,
            topCategories: this.getTopCategories(),
            reorderSuggestions: this.getReorderSuggestions(),
            inventoryHealth: this.calculateInventoryHealth(stats)
        };
    }
    
    /**
     * Get top categories
     */
    getTopCategories() {
        const categories = {};
        
        this.inventory.categories.forEach((skus, category) => {
            const products = skus.map(sku => this.inventory.getProduct(sku));
            const totalValue = products.reduce((sum, p) => sum + p.stock.current * p.price.cost, 0);
            categories[category] = {
                count: products.length,
                totalValue: totalValue,
                units: products.reduce((sum, p) => sum + p.stock.current, 0)
            };
        });
        
        return categories;
    }
    
    /**
     * Get reorder suggestions
     */
    getReorderSuggestions() {
        const suggestions = [];
        
        this.inventory.products.forEach(product => {
            if (product.isLowStock()) {
                suggestions.push({
                    sku: product.sku,
                    name: product.name,
                    current: product.stock.current,
                    reorderQuantity: product.stock.reorderQuantity,
                    supplier: product.supplier,
                    estimatedCost: product.stock.reorderQuantity * product.price.cost
                });
            }
        });
        
        return suggestions.sort((a, b) => a.estimatedCost - b.estimatedCost);
    }
    
    /**
     * Calculate inventory health score
     */
    calculateInventoryHealth(stats) {
        const health = {
            score: 100,
            issues: []
        };
        
        // Penalize if too many low stock items
        const lowStockPercent = (stats.lowStockCount / stats.totalProducts) * 100;
        if (lowStockPercent > 20) {
            health.score -= 20;
            health.issues.push(`${stats.lowStockCount} items below reorder level`);
        }
        
        // Penalize if stock value is too high (overstocked)
        if (stats.totalValue > 50000000) { // > 50M VNĐ
            health.score -= 10;
            health.issues.push('Excess inventory value - risk of obsolescence');
        }
        
        // Reward if inventory turnover looks good
        if (stats.totalProducts > 0 && lowStockPercent < 5) {
            health.score += 5;
        }
        
        health.status = health.score >= 80 ? 'HEALTHY' : health.score >= 60 ? 'WARNING' : 'CRITICAL';
        
        return health;
    }
    
    /**
     * Export inventory data
     */
    exportInventory(format = 'json') {
        const data = {
            exportDate: new Date().toISOString(),
            statistics: this.inventory.getStatistics(),
            products: Array.from(this.inventory.products.values()).map(p => ({
                sku: p.sku,
                name: p.name,
                category: p.category,
                price: p.price,
                stock: p.stock,
                profitMargin: p.getProfitMargin()
            }))
        };
        
        if (format === 'csv') {
            return this.convertToCSV(data.products);
        }
        
        return JSON.stringify(data, null, 2);
    }
    
    /**
     * Convert to CSV format
     */
    convertToCSV(products) {
        const headers = ['SKU', 'Name', 'Category', 'Cost', 'Retail', 'Stock', 'Reserved', 'Profit Margin'];
        const rows = products.map(p => [
            p.sku,
            p.name,
            p.category,
            p.price.cost,
            p.price.retail,
            p.stock.current,
            p.stock.reserved,
            ((p.price.retail - p.price.cost) / p.price.retail * 100).toFixed(2) + '%'
        ]);
        
        return [
            headers.join(','),
            ...rows.map(r => r.map(v => `"${v}"`).join(','))
        ].join('\n');
    }
}

// Global instance
const inventoryGrid = new InventoryGrid();
inventoryGrid.populateDemoData();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InventoryGrid;
}
