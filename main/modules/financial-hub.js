/* ═════════════════════════════════════════════════════════════ */
/* FINANCIAL HUB - Transactions, Invoicing & Tax */
/* Enterprise accounting ready for QuickBooks integration */
/* ═════════════════════════════════════════════════════════════ */

/**
 * FinancialHub - Central financial management system
 * Ready for integration with QuickBooks Online API, Xero, etc.
 */
class FinancialHub {
    constructor() {
        this.transactions = [];
        this.invoices = [];
        this.reports = [];
        this.taxSettings = {
            vatRate: 0.10, // 10% VAT
            incomeTaxRate: 0.10, // 10% income tax
            businessTaxRate: 0.05, // 5% business tax
            currency: 'VNĐ'
        };
        this.accountsIntegration = null; // For QuickBooks, Xero, etc.
        
        observability.logger.info('Financial Hub initialized');
    }
    
    /**
     * Create and record a transaction
     */
    createTransaction(data) {
        try {
            const transaction = new Transaction(data);
            
            // Validate line items
            if (!transaction.lineItems || transaction.lineItems.length === 0) {
                throw new Error('Transaction must have at least one line item');
            }
            
            // Record in journal
            this.transactions.push(transaction);
            
            observability.logger.info('Transaction created', {
                id: transaction.id,
                type: transaction.type,
                total: transaction.calculateTotals().total
            });
            
            return { success: true, transaction };
        } catch (error) {
            observability.errorHandler.handleError(error, { data });
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Create invoice from transaction
     */
    createInvoice(transaction, invoiceData = {}) {
        try {
            const invoice = new Invoice(transaction, invoiceData);
            this.invoices.push(invoice);
            
            observability.logger.info('Invoice created', {
                invoiceNumber: invoice.invoiceNumber,
                transactionId: transaction.id
            });
            
            return { success: true, invoice };
        } catch (error) {
            observability.errorHandler.handleError(error, { transaction, invoiceData });
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Process refund
     */
    processRefund(originalTransactionId, refundItems) {
        try {
            const originalTxn = this.transactions.find(t => t.id === originalTransactionId);
            
            if (!originalTxn) {
                throw new Error('Original transaction not found');
            }
            
            // Create refund transaction
            const refundTxn = originalTxn.createRefund(refundItems);
            this.transactions.push(refundTxn);
            
            // Update inventory
            refundItems.forEach(item => {
                inventoryGrid.restoreStock(item.product.sku, item.quantity);
            });
            
            observability.logger.info('Refund processed', {
                originalId: originalTransactionId,
                refundId: refundTxn.id
            });
            
            return { success: true, refundTransaction: refundTxn };
        } catch (error) {
            observability.errorHandler.handleError(error, { originalTransactionId, refundItems });
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Record payment for invoice
     */
    recordPayment(invoiceNumber, paymentData) {
        try {
            const invoice = this.invoices.find(i => i.invoiceNumber === invoiceNumber);
            
            if (!invoice) {
                throw new Error('Invoice not found');
            }
            
            invoice.markAsPaid(paymentData.date || new Date().toISOString());
            
            observability.logger.info('Payment recorded', {
                invoiceNumber,
                amount: paymentData.amount,
                method: paymentData.method
            });
            
            return { success: true, invoice };
        } catch (error) {
            observability.errorHandler.handleError(error, { invoiceNumber, paymentData });
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Generate financial report for period
     */
    generateFinancialReport(startDate, endDate, reportType = 'monthly') {
        try {
            observability.performanceMonitor.mark('report-start');
            
            const report = new FinancialReport(reportType);
            
            // Filter transactions by date
            this.transactions
                .filter(t => {
                    const txnDate = new Date(t.date);
                    return txnDate >= new Date(startDate) && txnDate <= new Date(endDate);
                })
                .forEach(t => report.addTransaction(t));
            
            // Filter invoices by date
            this.invoices
                .filter(i => {
                    const invDate = new Date(i.issueDate);
                    return invDate >= new Date(startDate) && invDate <= new Date(endDate);
                })
                .forEach(i => report.addInvoice(i));
            
            const duration = observability.performanceMonitor.measure(
                'financial-report',
                'report-start'
            );
            
            this.reports.push(report);
            
            observability.logger.info('Financial report generated', {
                period: reportType,
                duration,
                transactionCount: report.transactions.length
            });
            
            return { success: true, report, duration };
        } catch (error) {
            observability.errorHandler.handleError(error, { startDate, endDate });
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Calculate payable taxes
     */
    calculateTaxes(reportData) {
        const revenue = reportData.revenue;
        const expenses = reportData.expenses;
        const profit = revenue - expenses;
        
        const taxes = {
            vat: revenue * this.taxSettings.vatRate,
            incomeTax: profit * this.taxSettings.incomeTaxRate,
            businessTax: revenue * this.taxSettings.businessTaxRate,
            totalTaxes: 0
        };
        
        taxes.totalTaxes = taxes.vat + taxes.incomeTax + taxes.businessTax;
        
        return {
            grossIncome: revenue,
            deductibleExpenses: expenses,
            taxableIncome: profit,
            taxes: taxes,
            netIncome: profit - taxes.totalTaxes
        };
    }
    
    /**
     * Get accounting dashboard metrics
     */
    getAccountingDashboard(days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        const recentTxns = this.transactions.filter(t => new Date(t.date) >= startDate);
        const recentInvoices = this.invoices.filter(i => new Date(i.issueDate) >= startDate);
        
        // Calculate daily totals
        const dailyData = {};
        
        recentTxns.forEach(t => {
            const dateKey = new Date(t.date).toISOString().split('T')[0];
            if (!dailyData[dateKey]) {
                dailyData[dateKey] = { sales: 0, purchases: 0 };
            }
            const total = t.calculateTotals().total;
            if (t.type === 'sale') {
                dailyData[dateKey].sales += total;
            } else if (t.type === 'purchase') {
                dailyData[dateKey].purchases += total;
            }
        });
        
        const totalRevenue = recentTxns
            .filter(t => t.type === 'sale' && t.status === 'completed')
            .reduce((sum, t) => sum + t.calculateTotals().total, 0);
        
        const totalExpenses = recentTxns
            .filter(t => t.type === 'purchase')
            .reduce((sum, t) => sum + t.calculateTotals().total, 0);
        
        const paidInvoices = recentInvoices.filter(i => i.status === 'paid').length;
        const pendingInvoices = recentInvoices.filter(i => i.status === 'issued').length;
        const overdueInvoices = recentInvoices.filter(i => i.status === 'overdue').length;
        
        return {
            period: `Last ${days} days`,
            revenue: totalRevenue,
            expenses: totalExpenses,
            profit: totalRevenue - totalExpenses,
            profitMargin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue * 100).toFixed(2) + '%' : '0%',
            transactionCount: recentTxns.length,
            invoiceMetrics: {
                total: recentInvoices.length,
                paid: paidInvoices,
                pending: pendingInvoices,
                overdue: overdueInvoices,
                averageValue: recentInvoices.length > 0 
                    ? recentInvoices.reduce((sum, i) => sum + i.calculateInvoiceTotals().finalTotal, 0) / recentInvoices.length 
                    : 0
            },
            dailyData: dailyData
        };
    }
    
    /**
     * Export to QuickBooks format (QBO)
     */
    exportToQuickBooks(reportData) {
        try {
            const qboData = {
                Header: {
                    CompanyName: 'CYBERPUNK MARKET',
                    ExportDate: new Date().toISOString(),
                    ExportType: 'Transaction List'
                },
                Transactions: reportData.report.transactions.map(t => ({
                    Id: t.id,
                    Type: t.type.toUpperCase(),
                    Date: t.date,
                    Customer: t.customer?.name || 'N/A',
                    Amount: t.calculateTotals().total,
                    Description: t.notes,
                    LineItems: t.lineItems.map(li => ({
                        ItemName: li.product.name,
                        Quantity: li.quantity,
                        UnitPrice: li.product.unitPrice,
                        Amount: li.getTotal()
                    }))
                }))
            };
            
            observability.logger.info('QuickBooks export prepared', {
                transactionCount: qboData.Transactions.length
            });
            
            return {
                success: true,
                data: qboData,
                format: 'qbo'
            };
        } catch (error) {
            observability.errorHandler.handleError(error, { reportData });
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Import from QuickBooks
     * Integration point for QBO API
     */
    async importFromQuickBooks(qboData) {
        try {
            observability.logger.info('Starting QuickBooks import');
            
            let importedCount = 0;
            const errors = [];
            
            // Process imported transactions
            for (const qboTxn of qboData.transactions) {
                try {
                    // Map QBO transaction to our format
                    const lineItems = qboTxn.lineItems.map(li => {
                        const product = new Product({
                            name: li.itemName,
                            cost: li.unitPrice,
                            retail: li.unitPrice,
                            stock: { current: li.quantity }
                        });
                        return new LineItem(product, li.quantity);
                    });
                    
                    const transaction = new Transaction({
                        id: qboTxn.id,
                        type: qboTxn.type.toLowerCase(),
                        lineItems: lineItems,
                        notes: `Imported from QuickBooks: ${qboTxn.description}`
                    });
                    
                    this.transactions.push(transaction);
                    importedCount++;
                } catch (e) {
                    errors.push({ qboTxnId: qboTxn.id, error: e.message });
                }
            }
            
            observability.logger.info('QuickBooks import completed', {
                imported: importedCount,
                errors: errors.length
            });
            
            return {
                success: true,
                imported: importedCount,
                errors: errors
            };
        } catch (error) {
            observability.errorHandler.handleError(error, { qboData });
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Get analytics for dashboard
     */
    getAnalytics(days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        const recentTxns = this.transactions.filter(t => new Date(t.date) >= startDate);
        
        // Sales by category
        const salesByCategory = {};
        recentTxns
            .filter(t => t.type === 'sale')
            .forEach(t => {
                t.lineItems.forEach(li => {
                    // This would need category info from product
                    const key = 'General';
                    if (!salesByCategory[key]) {
                        salesByCategory[key] = { count: 0, total: 0 };
                    }
                    salesByCategory[key].count++;
                    salesByCategory[key].total += li.getTotal();
                });
            });
        
        return {
            period: `Last ${days} days`,
            totalTransactions: recentTxns.length,
            totalRevenue: recentTxns
                .filter(t => t.type === 'sale')
                .reduce((sum, t) => sum + t.calculateTotals().total, 0),
            totalExpenses: recentTxns
                .filter(t => t.type === 'purchase')
                .reduce((sum, t) => sum + t.calculateTotals().total, 0),
            transactionsByType: this.getTransactionsByType(recentTxns),
            salesByCategory: salesByCategory
        };
    }
    
    /**
     * Helper: Get transactions by type
     */
    getTransactionsByType(transactions) {
        const result = {
            sale: 0,
            purchase: 0,
            refund: 0,
            adjustment: 0
        };
        
        transactions.forEach(t => {
            result[t.type]++;
        });
        
        return result;
    }
    
    /**
     * Get transactions for display
     */
    getTransactions(filter = {}) {
        let filtered = this.transactions;
        
        if (filter.type) {
            filtered = filtered.filter(t => t.type === filter.type);
        }
        if (filter.status) {
            filtered = filtered.filter(t => t.status === filter.status);
        }
        if (filter.startDate && filter.endDate) {
            filtered = filtered.filter(t => {
                const txnDate = new Date(t.date);
                return txnDate >= new Date(filter.startDate) && txnDate <= new Date(filter.endDate);
            });
        }
        
        return filtered
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, filter.limit || 50);
    }
    
    /**
     * Get invoices for display
     */
    getInvoices(filter = {}) {
        let filtered = this.invoices;
        
        if (filter.status) {
            filtered = filtered.filter(i => i.status === filter.status);
        }
        if (filter.startDate && filter.endDate) {
            filtered = filtered.filter(i => {
                const invDate = new Date(i.issueDate);
                return invDate >= new Date(filter.startDate) && invDate <= new Date(filter.endDate);
            });
        }
        
        return filtered
            .sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate))
            .slice(0, filter.limit || 50);
    }
}

// Global instance
const financialHub = new FinancialHub();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FinancialHub;
}
