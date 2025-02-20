class AnalyticsManager {
    constructor() {
        this.events = [];
        this.initErrorTracking();
    }

    // Event Tracking
    trackEvent(category, action, label = null, value = null) {
        // مثال للأحداث التي نتتبعها:
        const events = {
            page: {
                'load': 'صفحة تم تحميلها',
                'init': 'تم تهيئة الصفحة',
                'cleanup': 'تم تنظيف الصفحة'
            },
            filter: {
                'update': 'تم تحديث الفلتر',
                'clear': 'تم مسح الفلاتر'
            },
            listing: {
                'view': 'تم عرض قائمة',
                'load_more': 'تم تحميل المزيد'
            },
            error: {
                'api': 'خطأ في الـ API',
                'ui': 'خطأ في واجهة المستخدم'
            }
        };
        
        // تسجيل الحدث
        const event = {
            category,    // نوع الحدث
            action,      // الإجراء
            label,       // وصف إضافي
            value,       // قيمة رقمية إن وجدت
            timestamp: new Date().toISOString()
        };

        this.events.push(event);
        this.sendToAnalytics(event);

        // Keep only last 1000 events
        if (this.events.length > 1000) {
            this.events = this.events.slice(-1000);
        }
    }

    // Error Tracking
    initErrorTracking() {
        window.addEventListener('error', (event) => {
            this.trackError('javascript', event.error);
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.trackError('promise', event.reason);
        });
    }

    trackError(type, error) {
        const errorEvent = {
            type,
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        };

        this.events.push(errorEvent);
        this.sendToAnalytics(errorEvent);
    }

    // Performance Monitoring
    trackPerformance(metric) {
        const performanceEvent = {
            ...metric,
            timestamp: new Date().toISOString()
        };

        this.events.push(performanceEvent);
        this.sendToAnalytics(performanceEvent);
    }

    // Send to Analytics Service
    async sendToAnalytics(event) {
        try {
            // Implementation depends on your analytics service
            console.log('Analytics event:', event);
        } catch (error) {
            console.error('Failed to send analytics:', error);
        }
    }
}

export const analyticsManager = new AnalyticsManager();
