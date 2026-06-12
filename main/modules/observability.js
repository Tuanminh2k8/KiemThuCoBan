/* ═════════════════════════════════════════════════════════════ */
/* OBSERVABILITY & MONITORING MODULE */
/* Enterprise-grade logging, error handling, performance tracking */
/* ═════════════════════════════════════════════════════════════ */

/**
 * Logger - Structured logging with multiple levels and outputs
 * Ready for cloud observability APIs (GCP Logging, DataDog, etc.)
 */
class Logger {
    constructor(serviceName = 'CYBERPUNK_MARKET') {
        this.serviceName = serviceName;
        this.logs = [];
        this.maxLogs = 1000;
        this.levels = {
            DEBUG: 0,
            INFO: 1,
            WARN: 2,
            ERROR: 3,
            CRITICAL: 4
        };
        this.currentLevel = this.levels.DEBUG;
        this.transports = ['console', 'storage']; // Can add 'cloud'
    }
    
    /**
     * Format log entry with structured metadata
     */
    createLogEntry(level, message, metadata = {}) {
        return {
            timestamp: new Date().toISOString(),
            level: level,
            service: this.serviceName,
            message: message,
            metadata: metadata,
            userAgent: navigator.userAgent,
            url: window.location.href,
            memory: this.getMemoryUsage()
        };
    }
    
    /**
     * Get browser memory usage (if available)
     */
    getMemoryUsage() {
        if (performance.memory) {
            return {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
            };
        }
        return null;
    }
    
    /**
     * Route log to appropriate transport
     */
    log(level, message, metadata = {}) {
        if (this.levels[level] < this.currentLevel) return;
        
        const entry = this.createLogEntry(level, message, metadata);
        this.logs.push(entry);
        
        // Maintain max size
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
        
        // Route to transports
        this.transports.forEach(transport => {
            this.sendToTransport(transport, entry);
        });
        
        return entry;
    }
    
    sendToTransport(transport, entry) {
        switch (transport) {
            case 'console':
                this.logToConsole(entry);
                break;
            case 'storage':
                this.logToStorage(entry);
                break;
            case 'cloud':
                this.sendToCloud(entry);
                break;
        }
    }
    
    logToConsole(entry) {
        const { level, message, metadata } = entry;
        const style = this.getConsoleStyle(level);
        console.log(
            `%c[${level}] ${message}`,
            style,
            metadata
        );
    }
    
    getConsoleStyle(level) {
        const styles = {
            DEBUG: 'color: #00d9ff; font-weight: bold;',
            INFO: 'color: #39ff14; font-weight: bold;',
            WARN: 'color: #ff6b00; font-weight: bold;',
            ERROR: 'color: #ff006e; font-weight: bold;',
            CRITICAL: 'color: #ff006e; font-weight: bold; background: #1a0f2e;'
        };
        return styles[level] || '';
    }
    
    logToStorage(entry) {
        try {
            const existing = JSON.parse(localStorage.getItem('app_logs') || '[]');
            existing.push(entry);
            if (existing.length > 100) {
                existing.shift();
            }
            localStorage.setItem('app_logs', JSON.stringify(existing));
        } catch (e) {
            console.error('Storage logging failed:', e);
        }
    }
    
    /**
     * Send logs to cloud observability API
     * Integration point for GCP Logging, DataDog, etc.
     */
    async sendToCloud(entry) {
        try {
            // Example: Send to GCP Cloud Logging
            // const response = await fetch('https://logging.googleapis.com/v2/entries:write', {
            //     method: 'POST',
            //     headers: { 'Authorization': `Bearer ${apiKey}` },
            //     body: JSON.stringify({
            //         entries: [entry]
            //     })
            // });
            console.debug('Cloud logging would send:', entry);
        } catch (e) {
            console.error('Cloud logging failed:', e);
        }
    }
    
    debug(msg, meta) { return this.log('DEBUG', msg, meta); }
    info(msg, meta) { return this.log('INFO', msg, meta); }
    warn(msg, meta) { return this.log('WARN', msg, meta); }
    error(msg, meta) { return this.log('ERROR', msg, meta); }
    critical(msg, meta) { return this.log('CRITICAL', msg, meta); }
    
    /**
     * Get all logs (for debugging/export)
     */
    getLogs(filter = {}) {
        let result = this.logs;
        
        if (filter.level) {
            result = result.filter(l => l.level === filter.level);
        }
        if (filter.since) {
            result = result.filter(l => new Date(l.timestamp) >= new Date(filter.since));
        }
        
        return result;
    }
    
    /**
     * Export logs as JSON
     */
    exportLogs() {
        return JSON.stringify(this.logs, null, 2);
    }
    
    /**
     * Clear logs
     */
    clear() {
        this.logs = [];
        localStorage.removeItem('app_logs');
    }
}

/**
 * ErrorHandler - Centralized error handling with context
 */
class ErrorHandler {
    constructor(logger) {
        this.logger = logger;
        this.errorStack = [];
        this.maxErrors = 100;
        this.setupGlobalHandlers();
    }
    
    setupGlobalHandlers() {
        // Handle uncaught errors
        window.addEventListener('error', (event) => {
            this.handleError(
                new Error(`Uncaught: ${event.message}`),
                { filename: event.filename, lineno: event.lineno }
            );
        });
        
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(
                event.reason,
                { type: 'unhandledPromiseRejection' }
            );
        });
    }
    
    /**
     * Structured error handling
     */
    handleError(error, context = {}) {
        const errorEntry = {
            timestamp: new Date().toISOString(),
            message: error.message || String(error),
            stack: error.stack,
            context: context,
            severity: context.severity || 'error'
        };
        
        this.errorStack.push(errorEntry);
        if (this.errorStack.length > this.maxErrors) {
            this.errorStack.shift();
        }
        
        this.logger.error(errorEntry.message, {
            stack: error.stack,
            context: context
        });
        
        return errorEntry;
    }
    
    /**
     * Wrap async function with error handling
     */
    wrapAsync(asyncFn) {
        return async (...args) => {
            try {
                return await asyncFn(...args);
            } catch (error) {
                this.handleError(error, { 
                    context: 'async-function',
                    args: args 
                });
                throw error;
            }
        };
    }
    
    /**
     * Wrap sync function with error handling
     */
    wrapSync(fn) {
        return (...args) => {
            try {
                return fn(...args);
            } catch (error) {
                this.handleError(error, { 
                    context: 'sync-function',
                    args: args 
                });
                throw error;
            }
        };
    }
    
    getErrors() {
        return this.errorStack;
    }
    
    exportErrors() {
        return JSON.stringify(this.errorStack, null, 2);
    }
}

/**
 * PerformanceMonitor - Track performance metrics
 * Ready for performance.measure() API and cloud monitoring
 */
class PerformanceMonitor {
    constructor(logger) {
        this.logger = logger;
        this.metrics = [];
        this.marks = {};
    }
    
    /**
     * Mark performance point
     */
    mark(name) {
        this.marks[name] = performance.now();
        this.logger.debug(`Performance mark: ${name}`);
    }
    
    /**
     * Measure time between marks
     */
    measure(name, startMark, endMark) {
        if (!this.marks[startMark] || !this.marks[endMark]) {
            this.logger.warn(`Missing marks for measure: ${name}`);
            return null;
        }
        
        const duration = this.marks[endMark] - this.marks[startMark];
        
        const metric = {
            name: name,
            duration: duration,
            timestamp: new Date().toISOString(),
            threshold: 100 // Alert if > 100ms
        };
        
        this.metrics.push(metric);
        
        if (duration > metric.threshold) {
            this.logger.warn(`Slow operation: ${name} took ${duration.toFixed(2)}ms`);
        }
        
        return duration;
    }
    
    /**
     * Get page load metrics
     */
    getPageLoadMetrics() {
        if (!window.performance || !window.performance.timing) {
            return null;
        }
        
        const timing = window.performance.timing;
        return {
            dns: timing.domainLookupEnd - timing.domainLookupStart,
            tcp: timing.connectEnd - timing.connectStart,
            request: timing.responseStart - timing.requestStart,
            response: timing.responseEnd - timing.responseStart,
            dom: timing.domInteractive - timing.domLoading,
            load: timing.loadEventEnd - timing.loadEventStart,
            total: timing.loadEventEnd - timing.navigationStart
        };
    }
    
    /**
     * Get Core Web Vitals
     */
    async getCoreWebVitals() {
        try {
            const vitals = {};
            
            // LCP - Largest Contentful Paint
            if ('PerformanceObserver' in window) {
                new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    vitals.lcp = entries[entries.length - 1].renderTime || entries[entries.length - 1].loadTime;
                }).observe({ entryTypes: ['largest-contentful-paint'] });
            }
            
            return vitals;
        } catch (e) {
            this.logger.warn('Core Web Vitals unavailable', { error: e.message });
            return null;
        }
    }
    
    getMetrics() {
        return this.metrics;
    }
    
    exportMetrics() {
        return JSON.stringify(this.metrics, null, 2);
    }
}

/**
 * HealthCheck - System health monitoring
 */
class HealthCheck {
    constructor(logger) {
        this.logger = logger;
        this.checks = {};
        this.checkInterval = null;
    }
    
    /**
     * Register a health check
     */
    register(name, checkFn, interval = 30000) {
        this.checks[name] = {
            check: checkFn,
            status: 'unknown',
            lastCheck: null,
            interval: interval
        };
    }
    
    /**
     * Run all health checks
     */
    async runAll() {
        const results = {};
        
        for (const [name, config] of Object.entries(this.checks)) {
            try {
                const result = await Promise.race([
                    config.check(),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Health check timeout')), 5000)
                    )
                ]);
                
                config.status = result ? 'healthy' : 'unhealthy';
                config.lastCheck = new Date().toISOString();
                results[name] = config.status;
                
            } catch (error) {
                config.status = 'error';
                config.lastCheck = new Date().toISOString();
                results[name] = 'error';
                this.logger.warn(`Health check failed: ${name}`, { error: error.message });
            }
        }
        
        return results;
    }
    
    /**
     * Start continuous health checks
     */
    startMonitoring() {
        this.checkInterval = setInterval(() => {
            this.runAll();
        }, 60000); // Check every minute
        
        this.logger.info('Health check monitoring started');
    }
    
    /**
     * Stop health checks
     */
    stopMonitoring() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.logger.info('Health check monitoring stopped');
        }
    }
    
    getStatus() {
        return this.checks;
    }
}

/**
 * Observability - Main facade combining all monitoring systems
 */
class Observability {
    constructor() {
        this.logger = new Logger();
        this.errorHandler = new ErrorHandler(this.logger);
        this.performanceMonitor = new PerformanceMonitor(this.logger);
        this.healthCheck = new HealthCheck(this.logger);
        
        this.logger.info('Observability system initialized');
    }
    
    /**
     * Initialize observability with default checks
     */
    initialize() {
        // Register default health checks
        this.healthCheck.register('database', async () => {
            // Check database connectivity
            return true; // Placeholder
        });
        
        this.healthCheck.register('api', async () => {
            try {
                const response = await fetch('/api/health', { 
                    method: 'HEAD',
                    timeout: 3000 
                });
                return response.ok;
            } catch {
                return false;
            }
        });
        
        this.healthCheck.register('storage', async () => {
            try {
                localStorage.setItem('health_check', 'ok');
                return localStorage.getItem('health_check') === 'ok';
            } catch {
                return false;
            }
        });
        
        // Start health checks
        this.healthCheck.startMonitoring();
        
        this.logger.info('Default health checks registered');
    }
    
    /**
     * Collect all observability data for export
     */
    collectTelemetry() {
        return {
            logs: this.logger.getLogs(),
            errors: this.errorHandler.getErrors(),
            metrics: this.performanceMonitor.getMetrics(),
            health: this.healthCheck.getStatus(),
            pageLoad: this.performanceMonitor.getPageLoadMetrics()
        };
    }
    
    /**
     * Export telemetry data
     */
    exportTelemetry() {
        return JSON.stringify(this.collectTelemetry(), null, 2);
    }
    
    /**
     * Send telemetry to backend/cloud
     */
    async sendTelemetry(endpoint) {
        try {
            const telemetry = this.collectTelemetry();
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(telemetry)
            });
            
            if (response.ok) {
                this.logger.info('Telemetry sent successfully');
            } else {
                this.logger.warn('Telemetry send failed', { status: response.status });
            }
        } catch (error) {
            this.logger.error('Telemetry send error', { error: error.message });
        }
    }
}

// Global instance
const observability = new Observability();
observability.initialize();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Logger, ErrorHandler, PerformanceMonitor, HealthCheck, Observability };
}
