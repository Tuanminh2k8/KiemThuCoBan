/* ═════════════════════════════════════════════════════════════ */
/* DATA MODELS - Enterprise Data Structures */
/* Inventory, Financial, Products, Transactions */
/* ═════════════════════════════════════════════════════════════ */

/**
 * Product - Core product entity
 */
class Product {
    constructor(data) {
        this.sku = data.sku || this.generateSKU();
        this.name = data.name;
        this.category = data.category;
        this.description = data.description || '';
        this.price = {
            cost: data.cost || 0,
            retail: data.retail || 0,
            currency: 'VNĐ'
        };
        this.stock = {
            current: data.stock?.current || 0,
            reserved: data.stock?.reserved || 0,
            reorderLevel: data.stock?.reorderLevel || 10,
            reorderQuantity: data.stock?.reorderQuantity || 50
        };
        this.supplier = data.supplier || null;
        this.lastUpdated = new Date().toISOString();
        this.isActive = data.isActive !== false;
    }
    
    generateSKU() {
        return `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Get available stock (current - reserved)
     */
    getAvailableStock() {
        return Math.max(0, this.stock.current - this.stock.reserved);
    }
    
    /**
     * Check if stock is low
     */
    isLowStock() {
        return this.getAvailableStock() <= this.stock.reorderLevel;
    }
    
    /**
     * Calculate profit margin
     */
    getProfitMargin() {
        if (this.price.cost === 0) return 0;
        return ((this.price.retail - this.price.cost) / this.price.retail) * 100;
    }
    
    /**
     * Update stock
     */
    updateStock(quantity, type = 'deduct') {
        if (type === 'deduct') {
            this.stock.current = Math.max(0, this.stock.current - quantity);
        } else if (type === 'add') {
            this.stock.current += quantity;
        } else if (type === 'reserve') {
            this.stock.reserved += quantity;
        } else if (type === 'unreserve') {
            this.stock.reserved = Math.max(0, this.stock.reserved - quantity);
        }
        this.lastUpdated = new Date().toISOString();
    }
}

/**
 * LineItem - Item in a transaction/invoice
 */
class LineItem {
    constructor(product, quantity, discountPercent = 0) {
        this.product = {
            sku: product.sku,
            name: product.name,
            unitPrice: product.price.retail
        };
        this.quantity = quantity;
        this.discountPercent = discountPercent;
        this.tax = 0;
    }
    
    /**
     * Calculate subtotal (before tax & discount)
     */
    getSubtotal() {
        return this.product.unitPrice * this.quantity;
    }
    
    /**
     * Calculate discount amount
     */
    getDiscount() {
        return this.getSubtotal() * (this.discountPercent / 100);
    }
    
    /**
     * Calculate taxable amount
     */
    getTaxableAmount() {
        return this.getSubtotal() - this.getDiscount();
    }
    
    /**
     * Calculate total with tax
     */
    getTotal() {
        const taxableAmount = this.getTaxableAmount();
        this.tax = taxableAmount * 0.1; // 10% VAT
        return taxableAmount + this.tax;
    }
}

/**
 * Transaction - Financial transaction record
 */
class Transaction {
    constructor(data) {
        this.id = data.id || this.generateId();
        this.type = data.type; // 'sale', 'refund', 'purchase', 'adjustment'
        this.date = new Date().toISOString();
        this.lineItems = data.lineItems || [];
        this.customer = data.customer || null;
        this.paymentMethod = data.paymentMethod || 'cash';
        this.status = 'completed'; // 'pending', 'completed', 'cancelled', 'refunded'
        this.notes = data.notes || '';
        this.createdBy = data.createdBy || 'system';
    }
    
    generateId() {
        return `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Add line item
     */
    addLineItem(lineItem) {
        this.lineItems.push(lineItem);
    }
    
    /**
     * Calculate totals
     */
    calculateTotals() {
        return {
            subtotal: this.lineItems.reduce((sum, item) => sum + item.getSubtotal(), 0),
            discount: this.lineItems.reduce((sum, item) => sum + item.getDiscount(), 0),
            tax: this.lineItems.reduce((sum, item) => sum + item.tax, 0),
            total: this.lineItems.reduce((sum, item) => sum + item.getTotal(), 0)
        };
    }
    
    /**
     * Get payment details
     */
    getPaymentDetails() {
        const totals = this.calculateTotals();
        return {
            amount: totals.total,
            method: this.paymentMethod,
            status: this.status,
            date: this.date
        };
    }
    
    /**
     * Cancel transaction
     */
    cancel() {
        this.status = 'cancelled';
    }
    
    /**
     * Create refund transaction
     */
    createRefund(refundItems) {
        const refundLineItems = refundItems.map(item => 
            new LineItem(item.product, item.quantity, 0)
        );
        
        return new Transaction({
            type: 'refund',
            lineItems: refundLineItems,
            customer: this.customer,
            notes: `Refund for transaction ${this.id}`
        });
    }
}

/**
 * Invoice - Billing document
 */
class Invoice {
    constructor(transaction, data = {}) {
        this.invoiceNumber = data.invoiceNumber || this.generateInvoiceNumber();
        this.transaction = transaction;
        this.issueDate = new Date().toISOString();
        this.dueDate = data.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        this.status = 'issued'; // 'issued', 'paid', 'overdue', 'cancelled'
        this.paymentTerms = data.paymentTerms || 'Net 30';
        this.notes = data.notes || '';
        this.company = {
            name: 'CYBERPUNK MARKET',
            address: '123 Digital Street, Neo-Tokyo',
            taxId: 'TAX-0123456789'
        };
    }
    
    generateInvoiceNumber() {
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        const seq = Math.random().toString(36).substr(2, 5).toUpperCase();
        return `INV-${year}${month}-${seq}`;
    }
    
    /**
     * Calculate invoice totals with tax
     */
    calculateInvoiceTotals() {
        const txnTotals = this.transaction.calculateTotals();
        
        // Additional invoice-level tax calculation
        const taxableIncome = txnTotals.total;
        const incomeTax = taxableIncome * 0.05; // 5% business tax
        
        return {
            ...txnTotals,
            incomeTax: incomeTax,
            finalTotal: taxableIncome + incomeTax
        };
    }
    
    /**
     * Mark as paid
     */
    markAsPaid(paymentDate = new Date().toISOString()) {
        this.status = 'paid';
        this.paidDate = paymentDate;
    }
    
    /**
     * Generate PDF export data
     */
    generatePDFData() {
        const totals = this.calculateInvoiceTotals();
        
        return {
            invoiceNumber: this.invoiceNumber,
            issueDate: this.issueDate,
            dueDate: this.dueDate,
            company: this.company,
            customer: this.transaction.customer,
            lineItems: this.transaction.lineItems,
            totals: totals,
            paymentTerms: this.paymentTerms,
            notes: this.notes
        };
    }
}

/**
 * FinancialReport - Aggregated financial data
 */
class FinancialReport {
    constructor(period = 'monthly') {
        this.period = period;
        this.generatedDate = new Date().toISOString();
        this.transactions = [];
        this.invoices = [];
    }
    
    /**
     * Add transaction
     */
    addTransaction(transaction) {
        this.transactions.push(transaction);
    }
    
    /**
     * Add invoice
     */
    addInvoice(invoice) {
        this.invoices.push(invoice);
    }
    
    /**
     * Calculate revenue
     */
    calculateRevenue() {
        return this.transactions
            .filter(t => t.type === 'sale' && t.status === 'completed')
            .reduce((sum, t) => sum + t.calculateTotals().total, 0);
    }
    
    /**
     * Calculate expenses
     */
    calculateExpenses() {
        return this.transactions
            .filter(t => t.type === 'purchase')
            .reduce((sum, t) => sum + t.calculateTotals().total, 0);
    }
    
    /**
     * Calculate net profit
     */
    calculateNetProfit() {
        return this.calculateRevenue() - this.calculateExpenses();
    }
    
    /**
     * Calculate tax liability
     */
    calculateTaxLiability() {
        const profit = this.calculateNetProfit();
        const incomeTax = profit * 0.10; // 10% income tax
        const vat = this.calculateRevenue() * 0.10; // 10% VAT
        
        return {
            incomeTax: incomeTax,
            vat: vat,
            total: incomeTax + vat
        };
    }
    
    /**
     * Get summary report
     */
    getSummary() {
        return {
            period: this.period,
            generatedDate: this.generatedDate,
            revenue: this.calculateRevenue(),
            expenses: this.calculateExpenses(),
            netProfit: this.calculateNetProfit(),
            taxes: this.calculateTaxLiability(),
            transactionCount: this.transactions.length,
            invoiceCount: this.invoices.length
        };
    }
}

/**
 * Inventory - Collection of products
 */
class Inventory {
    constructor() {
        this.products = new Map(); // SKU -> Product
        this.categories = new Map();
        this.lastSync = new Date().toISOString();
    }
    
    /**
     * Add product
     */
    addProduct(product) {
        this.products.set(product.sku, product);
        
        if (!this.categories.has(product.category)) {
            this.categories.set(product.category, []);
        }
        this.categories.get(product.category).push(product.sku);
        
        this.lastSync = new Date().toISOString();
    }
    
    /**
     * Get product by SKU
     */
    getProduct(sku) {
        return this.products.get(sku);
    }
    
    /**
     * Get all products in category
     */
    getProductsByCategory(category) {
        const skus = this.categories.get(category) || [];
        return skus.map(sku => this.products.get(sku));
    }
    
    /**
     * Get low stock products
     */
    getLowStockProducts() {
        const lowStockItems = [];
        this.products.forEach(product => {
            if (product.isLowStock()) {
                lowStockItems.push({
                    sku: product.sku,
                    name: product.name,
                    current: product.stock.current,
                    reorderLevel: product.stock.reorderLevel,
                    reorderQuantity: product.stock.reorderQuantity
                });
            }
        });
        return lowStockItems;
    }
    
    /**
     * Bulk update stock
     */
    bulkUpdateStock(updates) {
        const results = [];
        updates.forEach(update => {
            const product = this.getProduct(update.sku);
            if (product) {
                product.updateStock(update.quantity, update.type);
                results.push({ sku: update.sku, success: true });
            } else {
                results.push({ sku: update.sku, success: false, error: 'Product not found' });
            }
        });
        this.lastSync = new Date().toISOString();
        return results;
    }
    
    /**
     * Get inventory value
     */
    getInventoryValue() {
        let totalValue = 0;
        this.products.forEach(product => {
            totalValue += product.stock.current * product.price.cost;
        });
        return totalValue;
    }
    
    /**
     * Get inventory statistics
     */
    getStatistics() {
        const productArray = Array.from(this.products.values());
        
        return {
            totalProducts: this.products.size,
            totalCategories: this.categories.size,
            totalUnits: productArray.reduce((sum, p) => sum + p.stock.current, 0),
            totalValue: this.getInventoryValue(),
            lowStockCount: productArray.filter(p => p.isLowStock()).length,
            averagePrice: productArray.length > 0 
                ? productArray.reduce((sum, p) => sum + p.price.retail, 0) / productArray.length 
                : 0
        };
    }
}

/**
 * Export all models
 */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Product,
        LineItem,
        Transaction,
        Invoice,
        FinancialReport,
        Inventory
    };
}
