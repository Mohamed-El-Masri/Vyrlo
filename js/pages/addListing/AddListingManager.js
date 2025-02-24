import { ListingAPIService } from './services/ListingAPIService.js';
import { FormValidator } from './FormValidator.js';
import { ImageUploader } from './ImageUploader.js';

let addListingManagerInstance; // تعريف المتغير خارج الدالة

export class AddListingManager {
    constructor() {
        this.validator = new FormValidator();
        this.currentStep = 0;
        this.steps = [
            { id: 'basicInfo', fields: ['listingName', 'categoryId', 'description'] },
            { id: 'contactDetails', fields: ['email', 'phone', 'website'] },
            { id: 'location', fields: ['address', 'city', 'state'] },
            { id: 'businessHours', fields: ['hours'] },
            { id: 'media', fields: ['images'] }
        ];
                
        this.formData = {
            listingName: '',
            categoryId: '',
            description: '',
            // ... other form fields
        };

        // نؤجل التهيئة حتى يتم تحميل DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    async init() {
        try {
            await this.initializeComponents();
            this.attachEventListeners();
            console.log('AddListingManager initialized successfully');
        } catch (error) {
            console.error('Error initializing AddListingManager:', error);
        }
    }

    async initializeComponents() {
        // تهيئة مكون رفع الصور
        const mediaContainer = document.getElementById('mediaUploadContainer');
        if (mediaContainer) {
            this.imageUploader = new ImageUploader('mediaUploadContainer', {
                maxFiles: 10,
                maxFileSize: 5 * 1024 * 1024,
                allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
            });
        }

        // تحميل الفئات
        this.categoryManager = window.CategoryManager.getInstance();
        await this.loadCategories();
        
        // تهيئة التحقق من الصحة
        this.initializeValidation();
        
        // تهيئة اقتراحات الفئات
        this.initializeCategorySelect();
    }

    attachEventListeners() {
        // Previous Button
        const prevBtn = document.getElementById('prevBtn');
        prevBtn?.addEventListener('click', () => this.navigateStep(-1));

        // Next Button
        const nextBtn = document.getElementById('nextBtn');
        nextBtn?.addEventListener('click', () => this.navigateStep(1));

        // Submit Button
        const submitBtn = document.getElementById('submitBtn');
        submitBtn?.addEventListener('click', (e) => this.handleSubmit(e));

        // Form Inputs
        const form = document.getElementById('listingForm');
        form?.addEventListener('input', (e) => this.handleInput(e));
    }

    navigateStep(direction) {
        const newStep = this.currentStep + direction;
        if (newStep >= 0 && newStep < this.steps.length) {
            if (direction > 0 && !this.validateCurrentStep()) {
                return; // Don't proceed if current step is invalid
            }
            this.currentStep = newStep;
            this.updateUI();
        }
    }

    validateCurrentStep() {
        const currentStepData = this.steps[this.currentStep];
        return this.validator.validateStep(this.formData, currentStepData.fields);
    }

    updateUI() {
        // Update progress bar and step indicators
        this.updateProgressBar();
        this.updateStepVisibility();
        this.updateNavigationButtons();
    }

    async loadCategories() {
        try {
            // Wait for categories to be loaded
            await this.categoryManager.loadCategories();
            this.categories = this.categoryManager.getCategories();
            this.renderCategorySuggestions(this.categories);
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    }

    renderCategorySuggestions(categories) {
        const suggestionsList = document.getElementById('categorySuggestions');
        if (!suggestionsList) return;

        const html = categories.map(category => `
            <div class="suggestion-item" data-id="${category._id}">
                <i class="fas fa-${this.categoryManager.getCategoryIcon(category)}"></i>
                <span>${category.categoryName}</span>
            </div>
        `).join('');
        suggestionsList.innerHTML = html;
        this.attachCategoryListeners();
    }

    attachCategoryListeners() {
        document.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const categoryId = item.dataset.id;
                const categoryName = item.querySelector('span').textContent;
                document.getElementById('categoryInput').value = categoryName;
                document.getElementById('categoryId').value = categoryId;
                // Hide suggestions
                document.getElementById('categorySuggestions').style.display = 'none';
                
                // Validate field
                this.validator.validateField('category', categoryId);
            });
        });
    }

    initializeCategorySelect() {
        const categoryInput = document.getElementById('categoryInput');
        const suggestionsList = document.getElementById('categorySuggestions');

        if (categoryInput && suggestionsList) {
            // عرض/إخفاء قائمة الاقتراحات
            categoryInput.addEventListener('focus', () => {
                suggestionsList.style.display = 'block';
                this.showCategorySuggestions(this.categories, suggestionsList);
            });

            // تحديث الاقتراحات عند الكتابة
            categoryInput.addEventListener('input', (e) => {
                const value = e.target.value.toLowerCase();
                const filteredCategories = this.categories.filter(cat => 
                    cat.categoryName.toLowerCase().includes(value)
                );
                this.showCategorySuggestions(filteredCategories, suggestionsList);
            });

            // إخفاء الاقتراحات عند النقر خارج الحقل
            document.addEventListener('click', (e) => {
                if (!categoryInput.contains(e.target) && !suggestionsList.contains(e.target)) {
                    suggestionsList.style.display = 'none';
                }
            });
        }
    }

    showCategorySuggestions(categories, container) {
        if (!container) return;

        const html = categories.map(category => `
            <div class="suggestion-item" data-id="${category._id}">
                <i class="fas fa-${category.icon || 'folder'}"></i>
                <span>${category.categoryName}</span>
            </div>
        `).join('');
        container.innerHTML = html;

        // إضافة معالجات النقر للاقتراحات
        container.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = item.dataset.id;
                const name = item.querySelector('span').textContent;
                
                document.getElementById('categoryInput').value = name;
                document.getElementById('categoryId').value = id;
                container.style.display = 'none';
                
                this.validateField('category', id);
            });
        });
    }

    validateField(fieldName, value) {
        const input = document.getElementById(fieldName);
        if (!input) return;

        let isValid = false;
        let message = '';

        switch (fieldName) {
            case 'listingName':
                isValid = value.length >= 6 && value.length <= 20;
                message = 'Business name must be between 6 and 20 characters';
                break;
            case 'category':
                isValid = !!value;
                message = 'Please select a category';
                break;
            case 'description':
                isValid = value.length >= 50 && value.length <= 1000;
                message = 'Description must be between 50 and 1000 characters';
                break;
        }

        this.updateValidationState(input, isValid, message);
        return isValid;
    }

    initializeValidation() {
        this.initializeBusinessNameValidation();
        this.initializeCategoryValidation();
        this.initializeDescriptionValidation();
    }

    initializeBusinessNameValidation() {
        const input = document.getElementById('listingName');
        if (!input) return;

        input.addEventListener('input', () => {
            const value = input.value.trim();
            const isValid = value.length >= 6 && value.length <= 20;
            const message = !value ? 'Business name is required' :
                          value.length < 6 ? 'Business name must be at least 6 characters' :
                          value.length > 20 ? 'Business name must be less than 20 characters' : '';
            
            this.updateValidationState(input, isValid, message);
        });
    }

    initializeCategoryValidation() {
        const input = document.getElementById('categoryInput');
        const hiddenInput = document.getElementById('categoryId');
        if (!input || !hiddenInput) return;

        input.addEventListener('input', () => {
            const value = input.value.trim();
            const isValid = hiddenInput.value !== '';
            const message = !isValid ? 'Please select a category from the list' : '';
            
            this.showCategorySuggestions(value);
            this.updateValidationState(input, isValid, message);
        });
    }

    initializeDescriptionValidation() {
        const input = document.getElementById('description');
        const counter = document.querySelector('.char-counter .current');
        if (!input || !counter) return;

        input.addEventListener('input', () => {
            const value = input.value.trim();
            const length = value.length;
            counter.textContent = length;

            const isValid = length >= 50 && length <= 1000;
            const message = !value ? 'Description is required' :
                          length < 50 ? 'Description must be at least 50 characters' :
                          length > 1000 ? 'Description must be less than 1000 characters' : '';
            
            this.updateValidationState(input, isValid, message);
        });
    }

    updateValidationState(input, isValid, message) {
        input.classList.remove('is-valid', 'is-invalid');
        input.classList.add(isValid ? 'is-valid' : 'is-invalid');

        const feedback = input.nextElementSibling?.classList.contains('invalid-feedback') ?
            input.nextElementSibling :
            input.parentElement.querySelector('.invalid-feedback');
            
        if (feedback) {
            feedback.textContent = message;
            feedback.style.display = isValid ? 'none' : 'block';
        }
    }

    async initialize() {
        if (this.editMode && this.listingId) {
            await this.loadExistingListing();
        }
        this.renderForm();
        this.attachEventListeners();
    }

    async loadExistingListing() {
        try {
            const listing = await ListingAPIService.getListing(this.listingId);
            this.formData = { ...this.formData, ...listing };
        } catch (error) {
            this.showError('Failed to load listing');
        }
    }

    renderForm() {
        // Implement step-by-step form rendering
    }

    async handleSubmit(e) {
        e.preventDefault();
        try {
            const data = this.collectFormData();
            let response;

            if (this.editMode) {
                response = await ListingAPIService.updateListing(this.listingId, data);
            } else {
                response = await ListingAPIService.createListing(data);
            }

            this.showSuccess(`Listing successfully ${this.editMode ? 'updated' : 'created'}`);
            window.location.href = '/pages/myListings.html';
        } catch (error) {
            this.showError(error.message);
        }
    }

    collectFormData() {
        // Collect and validate form data
        return this.formData;
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const submitBtn = document.getElementById('submitBtn');
        const currentStepIndicator = document.getElementById('currentStep');

        // تحديث مؤشر الخطوة الحالية
        currentStepIndicator.textContent = this.currentStep + 1;

        // تحديث حالة زر السابق
        prevBtn.disabled = this.currentStep === 0;
        prevBtn.style.visibility = this.currentStep === 0 ? 'hidden' : 'visible';

        // تحديث حالة زر التالي/الإرسال
        if (this.currentStep === this.steps.length - 1) {
            nextBtn.style.display = 'none';
            submitBtn.style.display = 'flex';
        } else {
            nextBtn.style.display = 'flex';
            submitBtn.style.display = 'none';
        }

        // تحديث شريط التقدم
        const progress = ((this.currentStep + 1) / this.steps.length) * 100;
        document.querySelector('.masry-progress__bar-fill').style.setProperty('--progress-width', `${progress}%`);

        // تحديث حالة الخطوات
        this.steps.forEach((step, index) => {
            const stepElement = document.querySelector(`[data-step="${index + 1}"]`);
            if (index < this.currentStep) {
                stepElement.classList.add('completed');
                stepElement.classList.remove('active');
            } else if (index === this.currentStep) {
                stepElement.classList.add('active');
                stepElement.classList.remove('completed');
            } else {
                stepElement.classList.remove('active', 'completed');
            }
        });
    }

    // ... Other helper methods
}

// تحسين طريقة التهيئة
function initializeManager() {
    if (!addListingManagerInstance) {
        addListingManagerInstance = new AddListingManager();
        window.addListingManager = addListingManagerInstance; // للتصحيح
    }
}

// انتظار تحميل المكونات
document.addEventListener('DOMContentLoaded', () => {
    // انتظار تحميل المكونات
    document.addEventListener('componentLoaded', initializeManager);
});
