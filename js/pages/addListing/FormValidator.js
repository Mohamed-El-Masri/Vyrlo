export class FormValidator {
    constructor() {
        this.errors = new Map();
    }

    validateBusinessName(value) {
        if (!value) {
            return {
                isValid: false,
                message: 'Business name is required',
                type: 'error'
            };
        }

        if (value.length < 6) {
            return {
                isValid: false,
                message: `Add ${6 - value.length} more characters`,
                type: 'warning'
            };
        }

        if (value.length > 20) {
            return {
                isValid: false,
                message: `Remove ${value.length - 20} characters`,
                type: 'error'
            };
        }

        return {
            isValid: true,
            message: `Perfect! (${value.length}/20)`,
            type: 'success'
        };
    }

    validateDescription(value) {
        if (!value || value.trim().length === 0) {
            return {
                isValid: false,
                message: 'Description is required',
                type: 'error'
            };
        }

        if (value.trim().length < 50) {
            return {
                isValid: false,
                message: `Add ${50 - value.trim().length} more characters`,
                type: 'warning'
            };
        }

        if (value.length > 1000) {
            return {
                isValid: false,
                message: `Remove ${value.length - 1000} characters`,
                type: 'error'
            };
        }

        return {
            isValid: true,
            message: `Perfect! (${value.length}/1000)`,
            type: 'success'
        };
    }

    validateCategory(value, categoryId) {
        if (!categoryId) {
            return {
                isValid: false,
                message: 'Please select a category from the list',
                type: 'error'
            };
        }

        return {
            isValid: true,
            message: 'Category selected',
            type: 'success'
        };
    }

    validateCustomAmenity(value) {
        if (!value) {
            return {
                isValid: false,
                message: 'Feature cannot be empty',
                type: 'error'
            };
        }

        if (value.length < 3) {
            return {
                isValid: false,
                message: 'Feature must be at least 3 characters long',
                type: 'error'
            };
        }

        if (value.length > 50) {
            return {
                isValid: false,
                message: 'Feature cannot exceed 50 characters',
                type: 'error'
            };
        }

        // تحقق من عدم وجود رموز خاصة عدا بعض الرموز المسموحة
        const validPattern = /^[a-zA-Z0-9\s\-_&()]+$/;
        if (!validPattern.test(value)) {
            return {
                isValid: false,
                message: 'Feature can only contain letters, numbers, spaces, and - _ & ()',
                type: 'error'
            };
        }

        return {
            isValid: true,
            message: 'Valid feature',
            type: 'success'
        };
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

        // تنظيف رقم الهاتف من كل شيء ما عدا الأرقام والعلامات
        const cleanPhone = phone.replace(/[^\d+\-()]/g, '');

        // قواعد التحقق للمناطق المختلفة
        const phonePatterns = {
            // مصر (01xx) - 11 رقم
            eg: /^01[0-25][0-9]{8}$/,

            // الولايات المتحدة وكندا - بداية بـ +1 أو 1
            namerica: /^(?:\+?1[-\s.]?)?\(?([0-9]{3})\)?[-\s.]?([0-9]{3})[-\s.]?([0-9]{4})$/,

            // أوروبا - الأرقام تبدأ عادةً بـ +3x أو +4x
            europe: /^(?:\+|00)[3-4][0-9]\d{9,13}$/
        };

        // التحقق من النمط المناسب
        if (phonePatterns.eg.test(cleanPhone)) {
            return {
                isValid: true,
                message: 'Valid Egyptian phone number',
                type: 'success'
            };
        }

        if (phonePatterns.namerica.test(cleanPhone)) {
            return {
                isValid: true,
                message: 'Valid North American phone number',
                type: 'success'
            };
        }

        if (phonePatterns.europe.test(cleanPhone)) {
            return {
                isValid: true,
                message: 'Valid European phone number',
                type: 'success'
            };
        }

        // التحقق العام (على الأقل 8 أرقام، حد أقصى 15 رقم)
        const generalPhonePattern = /^\+?[\d\-\s()]{8,15}$/;
        if (generalPhonePattern.test(cleanPhone)) {
            return {
                isValid: true,
                message: 'Valid phone number',
                type: 'success'
            };
        }

        return {
            isValid: false,
            message: 'Please enter a valid phone number',
            type: 'error'
        };
    }

    validateWebsite(url) {
        if (!url) return { isValid: true }; // حقل اختياري

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
        if (!url) return { isValid: true }; // حقل اختياري

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

    showMessage(input, result) {
        if (!input || !result) return;

        const wrapper = input.closest('.input-wrapper');
        if (!wrapper) return;

        const messageEl = wrapper.querySelector('.validation-message');
        if (!messageEl) return;

        // إزالة الكلاسات السابقة
        input.classList.remove('is-invalid', 'is-warning', 'is-valid');
        messageEl.classList.remove('error', 'warning', 'success');
        
        // إضافة الكلاس المناسب
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

        // تحديث نص الرسالة
        messageEl.textContent = result.message;
        messageEl.style.display = 'block';
    }

    clearMessage(input) {
        if (!input) return;

        const wrapper = input.closest('.input-wrapper');
        if (!wrapper) return;

        const messageEl = wrapper.querySelector('.validation-message');
        if (messageEl) {
            messageEl.classList.remove('error', 'warning', 'success');
            messageEl.textContent = '';
        }

        input.classList.remove('is-invalid', 'is-warning', 'is-valid');
    }

    showSuccess(input) {
        if (!input) return;
        
        input.classList.remove('is-invalid', 'is-warning');
        input.classList.add('is-valid');
        
        const wrapper = input.closest('.input-wrapper');
        if (!wrapper) return;

        const messageEl = wrapper.querySelector('.validation-message');
        if (messageEl) {
            messageEl.style.display = 'none';
        }
    }

    showError(input, message) {
        if (!input || !message) return;

        const wrapper = input.closest('.input-wrapper');
        if (!wrapper) return;

        const messageEl = wrapper.querySelector('.validation-message');
        if (!messageEl) return;

        input.classList.remove('is-valid', 'is-warning');
        input.classList.add('is-invalid');
        
        messageEl.textContent = message;
        messageEl.classList.remove('warning', 'success');
        messageEl.classList.add('error');
        messageEl.style.display = 'block';
    }
}
