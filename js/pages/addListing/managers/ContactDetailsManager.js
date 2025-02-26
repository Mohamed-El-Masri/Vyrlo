export class ContactDetailsManager {
    constructor() {
        this.initialize();
    }

    initialize() {
        // Initialize form fields
        const emailInput = document.getElementById('email');
        const phoneInput = document.getElementById('phone');
        const websiteInput = document.getElementById('website');
        const socialInputs = document.querySelectorAll('[data-social]');

        // Add real-time validation for required fields
        if (emailInput) {
            emailInput.addEventListener('input', () => this.validateField(emailInput, 'email'));
            emailInput.addEventListener('blur', () => this.validateField(emailInput, 'email', true));
        }

        if (phoneInput) {
            phoneInput.addEventListener('input', () => this.validateField(phoneInput, 'phone'));
            phoneInput.addEventListener('blur', () => this.validateField(phoneInput, 'phone', true));
        }

        // Optional fields validation
        if (websiteInput) {
            websiteInput.addEventListener('input', () => this.validateField(websiteInput, 'website'));
            websiteInput.addEventListener('blur', () => this.validateField(websiteInput, 'website', true));
        }

        socialInputs.forEach(input => {
            input.addEventListener('input', () => this.validateField(input, 'social'));
            input.addEventListener('blur', () => this.validateField(input, 'social', true));
        });
    }

    validateField(input, type, isBlur = false) {
        if (!input) return false;

        const value = input.value.trim();
        let result = { isValid: true, message: '', type: 'success' };

        switch (type) {
            case 'email':
                result = this.validateEmail(value);
                break;
            case 'phone':
                result = this.validatePhone(value);
                break;
            case 'website':
                result = this.validateWebsite(value);
                break;
            case 'social':
                result = this.validateSocialMedia(value, input.dataset.social);
                break;
        }

        this.showValidationMessage(input, result);
        return result.isValid;
    }

    validateEmail(email) {
        if (!email) {
            return {
                isValid: false,
                message: 'Email address is required',
                type: 'error'
            };
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return {
                isValid: false,
                message: 'Please enter a valid email address',
                type: 'error'
            };
        }

        return {
            isValid: true,
            message: 'Valid email address',
            type: 'success'
        };
    }

    validatePhone(phone) {
        if (!phone) {
            return {
                isValid: false,
                message: 'Phone number is required',
                type: 'error'
            };
        }

        // Clean phone number
        const cleanPhone = phone.replace(/[^\d+\-()]/g, '');

        // Validate international format
        const phoneRegex = /^\+?[\d\-\s()]{8,20}$/;
        if (!phoneRegex.test(cleanPhone)) {
            return {
                isValid: false,
                message: 'Please enter a valid phone number',
                type: 'error'
            };
        }

        return {
            isValid: true,
            message: 'Valid phone number',
            type: 'success'
        };
    }

    validateWebsite(url) {
        if (!url) return { isValid: true }; // Optional field

        try {
            new URL(url);
            return {
                isValid: true,
                message: 'Valid website URL',
                type: 'success'
            };
        } catch {
            return {
                isValid: false,
                message: 'Please enter a valid website URL (e.g., https://example.com)',
                type: 'error'
            };
        }
    }

    validateSocialMedia(url, platform) {
        if (!url) return { isValid: true }; // Optional field

        const patterns = {
            facebook: /^https?:\/\/(www\.)?(facebook|fb)\.com\/[a-zA-Z0-9.]+\/?$/,
            instagram: /^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9_.]+\/?$/,
            twitter: /^https?:\/\/(www\.)?twitter\.com\/[a-zA-Z0-9_]+\/?$/
        };

        if (!patterns[platform]?.test(url)) {
            return {
                isValid: false,
                message: `Please enter a valid ${platform} profile URL`,
                type: 'error'
            };
        }

        return {
            isValid: true,
            message: `Valid ${platform} profile URL`,
            type: 'success'
        };
    }

    showValidationMessage(input, result) {
        const messageEl = input.closest('.input-wrapper')?.querySelector('.validation-message');
        if (!messageEl) return;

        // Remove existing classes
        input.classList.remove('is-invalid', 'is-warning', 'is-valid');
        messageEl.classList.remove('error', 'warning', 'success');

        // Add appropriate classes based on validation result
        if (result.type === 'error') {
            input.classList.add('is-invalid');
            messageEl.classList.add('error');
        } else if (result.type === 'warning') {
            input.classList.add('is-warning');
            messageEl.classList.add('warning');
        } else if (result.type === 'success') {
            input.classList.add('is-valid');
            messageEl.classList.add('success');
        }

        // Update message text
        messageEl.textContent = result.message;
        messageEl.style.display = result.message ? 'block' : 'none';
    }
}
