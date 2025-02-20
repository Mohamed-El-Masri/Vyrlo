
class SecurityManager {
    constructor() {
        this.rateLimit = {
            requests: new Map(),
            maxRequests: 50,
            timeWindow: 60000 // 1 minute
        };
        this.csrfToken = this.generateCSRFToken();
    }

    // Rate Limiting
    checkRateLimit(userId) {
        const now = Date.now();
        const userRequests = this.rateLimit.requests.get(userId) || [];
        
        // Clean old requests
        const validRequests = userRequests.filter(time => 
            now - time < this.rateLimit.timeWindow
        );
        
        if (validRequests.length >= this.rateLimit.maxRequests) {
            throw new Error('Rate limit exceeded');
        }

        validRequests.push(now);
        this.rateLimit.requests.set(userId, validRequests);
        return true;
    }

    // Input Sanitization
    sanitizeInput(data) {
        if (typeof data === 'string') {
            return this.escapeHtml(data.trim());
        }
        if (Array.isArray(data)) {
            return data.map(item => this.sanitizeInput(item));
        }
        if (typeof data === 'object' && data !== null) {
            return Object.fromEntries(
                Object.entries(data).map(([key, value]) => 
                    [key, this.sanitizeInput(value)]
                )
            );
        }
        return data;
    }

    // XSS Protection
    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // CSRF Protection
    generateCSRFToken() {
        return Math.random().toString(36).substring(2) + 
               Date.now().toString(36);
    }

    validateCSRFToken(token) {
        return token === this.csrfToken;
    }

    // Data Validation
    validateData(data, schema) {
        for (const [key, rules] of Object.entries(schema)) {
            const value = data[key];
            
            if (rules.required && !value) {
                throw new Error(`${key} is required`);
            }
            
            if (rules.type && typeof value !== rules.type) {
                throw new Error(`${key} must be of type ${rules.type}`);
            }
            
            if (rules.pattern && !rules.pattern.test(value)) {
                throw new Error(`${key} has invalid format`);
            }
        }
        return true;
    }
}

export const securityManager = new SecurityManager();
