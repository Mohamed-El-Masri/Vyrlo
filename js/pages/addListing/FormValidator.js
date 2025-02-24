export class FormValidator {
    validateCurrentStep(step, formData) {
        const errors = {};

        switch(step) {
            case 0: // Basic Information
                if (!formData.listingName || formData.listingName.length < 6 || formData.listingName.length > 20) {
                    errors.listingName = 'Business name must be between 6 and 20 characters';
                }
                if (!formData.categoryId) {
                    errors.category = 'Please select a category';
                }
                if (!formData.description || formData.description.length < 50 || formData.description.length > 1000) {
                    errors.description = 'Description must be between 50 and 1000 characters';
                }
                break;
            // ... other steps validation
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }

    showErrors(errors) {
        // إزالة كل رسائل الخطأ السابقة
        document.querySelectorAll('.invalid-feedback').forEach(el => {
            el.style.display = 'none';
        });

        // إظهار الأخطاء الجديدة
        Object.entries(errors).forEach(([field, message]) => {
            const input = document.querySelector(`[name="${field}"]`);
            if (input) {
                input.classList.add('is-invalid');
                const feedback = input.nextElementSibling;
                if (feedback && feedback.classList.contains('invalid-feedback')) {
                    feedback.textContent = message;
                    feedback.style.display = 'block';
                }
            }
        });
    }

    validateContactDetails(data) {
        const errors = {};

        // Email validation
        if (!data.email || !this.isValidEmail(data.email)) {
            errors.email = 'Please enter a valid email address';
        }

        // Phone validation
        if (!data.phone || !this.isValidPhone(data.phone)) {
            errors.phone = 'Please enter a valid phone number';
        }

        // Website validation (optional)
        if (data.website && !this.isValidUrl(data.website)) {
            errors.website = 'Please enter a valid website URL';
        }

        // Social media validation
        const socialLinks = ['facebook', 'instagram', 'twitter'];
        socialLinks.forEach(platform => {
            const link = data[`social_${platform}`];
            if (link && !this.isValidUrl(link)) {
                errors[`social_${platform}`] = `Please enter a valid ${platform} URL`;
            }
        });

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }

    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
}

export class ImageUploader {
    // ... code ...
}

export class ListingAPIService {
    // ... code ...
}
