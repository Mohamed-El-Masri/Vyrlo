import { ListingAPIService } from './services/ListingAPIService.js';
import { FormValidator } from './FormValidator.js';
import { ImageUploader } from './ImageUploader.js';
import { ContactDetailsManager } from './managers/ContactDetailsManager.js';
import { LocationManager } from './managers/LocationManager.js';

let addListingManagerInstance; // تعريف المتغير خارج الدالة

export class AddListingManager {
    constructor() {
        // تأكد من أن DOM جاهز قبل تهيئة المكون
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
        this.contactDetailsManager = null;
    }

    initialize() {
        this.currentStep = this.getSavedStep() || 1;
        this.formData = this.getSavedFormData() || {};
        this.validator = new FormValidator();
        this.categoryDebounceTimer = null;
        
        // تأكد من وجود العناصر المطلوبة قبل تهيئتها
        const form = document.getElementById('listingForm');
        if (!form) {
            console.error('Form element not found');
            return;
        }

        this.initializeForm();
    }

    initializeForm() {
        this.initializeValidation();
        this.initializeCategorySearch();
        this.initializeNavigation();
        this.updateProgressBar();
        this.initializeProgressNavigation();
        
        // تهيئة مدير تفاصيل الاتصال عندما نصل للخطوة الثانية
        if (this.currentStep === 2) {
            this.initializeContactDetails();
        }

        // Initialize location manager when reaching step 3
        if (this.currentStep === 3) {
            this.initializeLocation();
        }
    }

    initializeValidation() {
        const businessName = document.getElementById('listingName');
        if (businessName) {
            // تحقق في الوقت الحقيقي
            businessName.addEventListener('input', () => {
                const result = this.validator.validateBusinessName(businessName.value);
                this.validator.showMessage(businessName, result);
            });

            // تحقق عند خسارة التركيز
            businessName.addEventListener('blur', () => {
                const result = this.validator.validateBusinessName(businessName.value);
                this.validator.showMessage(businessName, result);
            });
        }

        // إضافة تحقق الوصف
        const description = document.getElementById('description');
        if (description) {
            // تحقق في الوقت الحقيقي بدون عرض رسالة النجاح
            description.addEventListener('input', () => {
                const result = this.validator.validateDescription(description.value);
                this.validator.showMessage(description, result);
                this.updateCharCount(description);
            });

            // تحقق كامل عند خسارة التركيز
            description.addEventListener('blur', () => {
                const result = this.validator.validateDescription(description.value);
                this.validator.showMessage(description, result);
            });

            // تحديث عداد الأحرف عند التحميل
            this.updateCharCount(description);
        }
    }

    validateField(input, type, isBlur = false) {
        const validateMethod = `validate${type.charAt(0).toUpperCase() + type.slice(1)}`;
        if (typeof this.validator[validateMethod] !== 'function') {
            console.error(`Validation method ${validateMethod} not found`);
            return false;
        }

        const result = this.validator[validateMethod](input.value);
        
        // عرض رسالة النجاح فقط عند الخروج من الحقل
        if (!isBlur && result.type === 'success') {
            this.validator.clearMessage(input);
            return result.isValid;
        }
        
        this.validator.showMessage(input, result);
        return result.isValid;
    }

    async initializeCategorySearch() {
        const categoryInput = document.getElementById('categoryInput');
        if (!categoryInput) return; // تحقق من وجود العنصر أولاً

        // تعطيل الإدخال المباشر في حقل الفئة
        categoryInput.setAttribute('readonly', true);

        // إنشاء حاوية الاقتراحات إذا لم تكن موجودة
        let suggestionsContainer = document.getElementById('categorySuggestions');
        if (!suggestionsContainer) {
            suggestionsContainer = document.createElement('div');
            suggestionsContainer.id = 'categorySuggestions';
            suggestionsContainer.className = 'category-suggestions';
            categoryInput.parentElement.appendChild(suggestionsContainer);
        }
        
        // استخدام AbortController للتحكم في الطلبات
        this.abortController = new AbortController();
        
        // فتح القائمة عند التركيز
        categoryInput.addEventListener('focus', async () => {
            try {
                const allCategories = await ListingAPIService.getCategories(this.abortController.signal);
                if (allCategories && allCategories.length > 0) {
                    this.showCategorySuggestions(allCategories);
                }
            } catch (error) {
                if (error.name === 'AbortError') {
                    console.log('Category fetch aborted');
                } else {
                    console.error('Error loading categories:', error);
                }
            }
        });

        // تنظيف عند مغادرة الصفحة
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });

        // تحسين إغلاق القائمة عند النقر خارجها
        document.addEventListener('click', (e) => {
            const suggestions = document.getElementById('categorySuggestions');
            if (suggestions && !suggestions.contains(e.target) && !categoryInput.contains(e.target)) {
                suggestions.style.display = 'none';
            }
        });
    }

    cleanup() {
        // إلغاء أي طلبات معلقة
        if (this.abortController) {
            this.abortController.abort();
        }
    }

    async searchCategories(query) {
        if (!query) return;
        
        const suggestions = await ListingAPIService.searchCategories(query);
        this.showCategorySuggestions(suggestions);
    }

    showCategorySuggestions(suggestions) {
        const container = document.getElementById('categorySuggestions');
        if (!container) return;

        try {
            container.style.display = 'block';
            
            // Store suggestions in a class property to access it later
            this.currentSuggestions = suggestions;
            
            container.innerHTML = `
                <div class="search-item">
                    <input type="text" 
                        class="form-control search-category" 
                        placeholder="Type to filter categories..."
                        autocomplete="off">
                </div>
                <div class="suggestions-list">
                    ${this.renderSuggestionItems(suggestions)}
                </div>
            `;

            const searchInput = container.querySelector('.search-category');
            if (searchInput) {
                setTimeout(() => searchInput.focus(), 100);
                this.initializeSearchListener(searchInput, suggestions);
            }

            // Attach click handlers to suggestion items
            container.querySelectorAll('.suggestion-item').forEach(item => {
                item.addEventListener('click', () => {
                    this.selectCategory(item);
                });
            });

        } catch (error) {
            console.error('Error showing suggestions:', error);
        }

        // عند اختيار الفئة، نعرض الميزات الخاصة بها
        const items = container.querySelectorAll('.suggestion-item');
        items.forEach(item => {
            item.addEventListener('click', () => {
                this.selectCategory(item, suggestions);
            });
        });
    }

    initializeSearchListener(searchInput, suggestions) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = suggestions.filter(cat => 
                cat.name.toLowerCase().includes(query)
            );
            
            const suggestionsList = document.querySelector('.suggestions-list');
            if (suggestionsList) {
                suggestionsList.innerHTML = this.renderSuggestionItems(filtered);
                this.attachSuggestionListeners();
            }
        });
    }

    renderSuggestionItems(items) {
        if (!items || items.length === 0) {
            return '<div class="no-results">No categories found</div>';
        }

        return items.map(category => `
            <div class="suggestion-item" data-id="${category.id}">
                <i class="${category.icon}" aria-hidden="true"></i>
                <div class="suggestion-content">
                    <span class="suggestion-name">${category.name}</span>
                    ${category.description ? `<small class="suggestion-description">${category.description}</small>` : ''}
                </div>
            </div>
        `).join('');
    }

    attachSuggestionListeners() {
        const items = document.querySelectorAll('.suggestion-item');
        
        items.forEach(item => {
            // إضافة active class عند تحريك الماوس
            item.addEventListener('mouseenter', () => {
                items.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
            });

            // اختيار الفئة عند النقر
            item.addEventListener('click', () => {
                this.selectCategory(item);
            });
        });
    }

    selectCategory(item) {
        const categoryInput = document.getElementById('categoryInput');
        const categoryId = document.getElementById('categoryId');
        const suggestionsContainer = document.getElementById('categorySuggestions');
        
        categoryInput.value = item.querySelector('.suggestion-name').textContent;
        categoryId.value = item.dataset.id;
        
        // Find the selected category from stored suggestions
        const selectedCategory = this.currentSuggestions?.find(cat => cat.id === item.dataset.id);
        
        suggestionsContainer.style.display = 'none';
        categoryInput.classList.remove('is-invalid');
        categoryInput.classList.add('is-valid');
        
        // إظهار تأثير بصري للاختيار
        categoryInput.blur();
        this.validateField(categoryInput);

        // Show amenities only if we found the category
        if (selectedCategory && selectedCategory.amenities?.length > 0) {
            this.showAmenities(selectedCategory.amenities);
        } else {
            // Hide amenities container if no amenities found
            const amenitiesContainer = document.getElementById('amenitiesContainer');
            if (amenitiesContainer) {
                amenitiesContainer.style.display = 'none';
            }
        }
    }

    showAmenities(amenities) {
        const container = document.getElementById('amenitiesContainer');
        const amenitiesList = document.getElementById('amenitiesList');
        
        if (!container || !amenitiesList || !amenities?.length) {
            if (container) container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        
        // Render predefined amenities
        const existingAmenitiesHTML = amenities.map(amenity => `
            <div class="amenity-item" data-amenity="${amenity}">
                <span class="amenity-text">${amenity}</span>
            </div>
        `).join('');

        amenitiesList.innerHTML = existingAmenitiesHTML;

        // Add click handlers
        amenitiesList.querySelectorAll('.amenity-item').forEach(item => {
            item.addEventListener('click', () => {
                item.classList.toggle('selected');
                this.updateSelectedAmenities();
            });
        });

        // Initialize custom amenities
        this.initializeCustomAmenities();
    }

    initializeCustomAmenities() {
        const input = document.getElementById('customAmenityInput');
        const addButton = document.getElementById('addCustomAmenity');
        
        if (!input || !addButton) return;

        input.addEventListener('input', () => {
            const result = this.validator.validateCustomAmenity(input.value);
            this.validator.showMessage(input, result);
            addButton.disabled = !result.isValid;
        });

        addButton.addEventListener('click', () => {
            const value = input.value.trim();
            const result = this.validator.validateCustomAmenity(value);
            
            if (result.isValid) {
                this.addCustomAmenity(value);
                input.value = '';
                addButton.disabled = true;
            }
        });
    }

    addCustomAmenity(value, isRestoring = false) {
        const amenitiesList = document.getElementById('amenitiesList');
        
        // تحقق من عدم التكرار
        const existingAmenities = Array.from(amenitiesList.querySelectorAll('.amenity-text'))
            .map(el => el.textContent.toLowerCase());
        
        if (existingAmenities.includes(value.toLowerCase())) {
            if (!isRestoring) {
                this.validator.showMessage(
                    document.getElementById('customAmenityInput'),
                    {
                        isValid: false,
                        message: 'This feature already exists',
                        type: 'error'
                    }
                );
            }
            return;
        }

        // إضافة الخاصية المخصصة
        const amenityItem = document.createElement('div');
        amenityItem.className = 'amenity-item custom';
        amenityItem.dataset.amenity = value;
        amenityItem.innerHTML = `
            <span class="amenity-text">${value}</span>
            <button type="button" class="remove-amenity" title="Remove feature">
                <i class="fas fa-times"></i>
            </button>
        `;

        // إضافة الأحداث
        amenityItem.addEventListener('click', (e) => {
            if (e.target.closest('.remove-amenity')) {
                amenityItem.remove();
            } else {
                amenityItem.classList.toggle('selected');
            }
            this.updateSelectedAmenities();
            this.saveFormState(); // حفظ الحالة بعد كل تغيير
        });

        amenitiesList.appendChild(amenityItem);
        
        if (!isRestoring) {
            amenityItem.classList.add('selected'); // تحديد الخاصية الجديدة تلقائياً
        }
        
        this.updateSelectedAmenities();
        this.saveFormState();
    }

    updateSelectedAmenities() {
        const selectedAmenities = Array.from(
            document.querySelectorAll('.amenity-item.selected')
        ).map(item => item.dataset.amenity);

        let amenitiesInput = document.getElementById('selectedAmenities');
        if (!amenitiesInput) {
            amenitiesInput = document.createElement('input');
            amenitiesInput.type = 'hidden';
            amenitiesInput.id = 'selectedAmenities';
            amenitiesInput.name = 'amenities';
            document.getElementById('listingForm').appendChild(amenitiesInput);
        }
        
        amenitiesInput.value = JSON.stringify(selectedAmenities);
    }

    navigateSuggestions(newIndex, items) {
        items.forEach(item => item.classList.remove('active'));
        if (newIndex >= 0 && newIndex < items.length) {
            items[newIndex].classList.add('active');
            items[newIndex].scrollIntoView({ block: 'nearest' });
        }
    }

    initializeNavigation() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');

        prevBtn?.addEventListener('click', () => this.goToPreviousStep());
        nextBtn?.addEventListener('click', () => this.validateAndProceed());

        // تحديث حالة زر السابق
        this.updateNavigationButtons();

        // استعادة البيانات المحفوظة
        this.restoreFormData();

        // حفظ البيانات عند الانتقال بين الصفحات
        window.addEventListener('beforeunload', () => {
            this.saveFormState();
        });
    }

    validateAndProceed() {
        const isValid = this.validateCurrentStep();
        if (!isValid) {
            this.showStepErrors();
            this.shakeNextButton();
            return;
        }
        this.proceedToNextStep();
    }

    showStepErrors() {
        const currentStepEl = document.querySelector(`.form-step[id="${this.getCurrentStepId()}"]`);
        const invalidInputs = currentStepEl.querySelectorAll('.is-invalid, .is-warning');
        
        invalidInputs.forEach(input => {
            input.classList.add('highlight-error');
            setTimeout(() => input.classList.remove('highlight-error'), 2000);
        });

        // Scroll to first error
        if (invalidInputs.length > 0) {
            invalidInputs[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    shakeNextButton() {
        const nextBtn = document.getElementById('nextBtn');
        nextBtn.classList.add('shake');
        setTimeout(() => nextBtn.classList.remove('shake'), 500);
    }

    proceedToNextStep() {
        const totalSteps = 5;
        if (this.currentStep < totalSteps) {
            // Hide current step
            document.querySelector(`.form-step[id="${this.getCurrentStepId()}"]`).classList.remove('active');
            
            // Update step counter
            this.currentStep++;
            
            // Show next step
            document.querySelector(`.form-step[id="${this.getCurrentStepId()}"]`).classList.add('active');
            
            // Update UI elements
            this.updateStepIndicator();
            this.updateProgressBar();
            this.updateNavigationButtons();
        }
        if (this.currentStep === 2) {
            this.initializeContactDetails();
        }
    }

    getCurrentStepId() {
        const stepMap = {
            1: 'basicInfo',
            2: 'contactDetails',
            3: 'location',
            4: 'businessHours',
            5: 'media'
        };
        return stepMap[this.currentStep];
    }

    updateStepIndicator() {
        // Update step number display
        const stepIndicator = document.getElementById('currentStep');
        if (stepIndicator) {
            stepIndicator.textContent = this.currentStep;
        }

        // Update progress steps
        document.querySelectorAll('.masry-progress__step').forEach((step, index) => {
            if (index + 1 < this.currentStep) {
                step.classList.add('completed');
            }
            if (index + 1 === this.currentStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const submitBtn = document.getElementById('submitBtn');

        // Show/hide previous button
        if (prevBtn) {
            prevBtn.style.display = this.currentStep === 1 ? 'none' : 'flex';
        }

        // Toggle between next and submit buttons
        if (nextBtn && submitBtn) {
            if (this.currentStep === 5) {
                nextBtn.style.display = 'none';
                submitBtn.style.display = 'flex';
            } else {
                nextBtn.style.display = 'flex';
                submitBtn.style.display = 'none';
            }
        }
    }

    validateCurrentStep() {
        if (this.currentStep === 1) {
            const businessName = document.getElementById('listingName');
            const categoryInput = document.getElementById('categoryInput');
            const description = document.getElementById('description');

            const businessNameResult = this.validator.validateBusinessName(businessName.value);
            const categoryResult = this.validator.validateCategory(categoryInput.value, document.getElementById('categoryId').value);
            const descriptionResult = this.validator.validateDescription(description.value);

            // عرض الرسائل
            this.validator.showMessage(businessName, businessNameResult);
            this.validator.showMessage(categoryInput, categoryResult);
            this.validator.showMessage(description, descriptionResult);

            // إرجاع النتيجة النهائية
            return businessNameResult.isValid && 
                   categoryResult.isValid && 
                   descriptionResult.isValid;
        } else if (this.currentStep === 2) {
            return this.validateContactDetails();
        } else if (this.currentStep === 3) {
            return this.locationManager?.validateLocation() || false;
        }
        return true;
    }

    updateCharCount(textarea) {
        if (!textarea) return;

        const counter = textarea.parentElement.querySelector('.char-counter .current');
        const maxCounter = textarea.parentElement.querySelector('.char-counter .maximum');
        
        if (counter && maxCounter) {
            const currentLength = textarea.value.length;
            const maxLength = textarea.getAttribute('maxlength') || 1000;
            
            counter.textContent = currentLength;
            maxCounter.textContent = maxLength;

            // تحديث لون العداد بناءً على الطول
            const charCounter = textarea.parentElement.querySelector('.char-counter');
            if (charCounter) {
                if (currentLength === 0) {
                    charCounter.className = 'char-counter';
                } else if (currentLength < 50) {
                    charCounter.className = 'char-counter warning';
                } else if (currentLength > 1000) {
                    charCounter.className = 'char-counter error';
                } else {
                    charCounter.className = 'char-counter success';
                }
            }
        }
    }

    validateField(input) {
        let error = '';
        
        switch(input.id) {
            case 'listingName':
                error = this.validator.validateBusinessName(input.value);
                if (input.value.length > 0) {
                    this.validator.showError(input, error || `${input.value.length}/20 characters`);
                }
                if (!error) {
                    this.validator.showSuccess(input);
                }
                break;
            case 'categoryInput':
                const categoryId = document.getElementById('categoryId');
                if (!categoryId.value) {
                    error = 'Please select a category from the list';
                }
                break;
            case 'description':
                error = this.validator.validateDescription(input.value);
                const charCounter = input.parentElement.querySelector('.char-counter');
                if (error) {
                    charCounter?.classList.add('invalid');
                } else {
                    charCounter?.classList.remove('invalid');
                }
                break;
        }

        if (error) {
            this.validator.showError(input, error);
            return false;
        } else {
            this.validator.showSuccess(input);
            return true;
        }
    }

    updateProgressBar() {
        const progressBar = document.querySelector('.masry-progress__bar-fill');
        const progressSteps = document.querySelectorAll('.masry-progress__step');
        
        // تأكد من وجود عناصر التقدم قبل محاولة تحديثها
        if (!progressBar || !progressSteps.length) return;

        const progress = ((this.currentStep - 1) / 4) * 100;
        progressBar.style.width = `${progress}%`;

        progressSteps.forEach((step, index) => {
            if (index + 1 < this.currentStep) {
                step.classList.add('completed');
            } else {
                step.classList.remove('completed');
            }
            if (index + 1 === this.currentStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
    }

    // حفظ البيانات والخطوة الحالية
    saveFormState() {
        const formData = this.collectFormData();
        localStorage.setItem('listingFormData', JSON.stringify(formData));
        localStorage.setItem('listingCurrentStep', this.currentStep);
    }

    // استرجاع البيانات المحفوظة
    getSavedFormData() {
        const saved = localStorage.getItem('listingFormData');
        return saved ? JSON.parse(saved) : null;
    }

    getSavedStep() {
        return parseInt(localStorage.getItem('listingCurrentStep')) || 1;
    }

    // تجميع البيانات من النموذج
    collectFormData() {
        const formData = {
            basicInfo: {
                listingName: document.getElementById('listingName')?.value,
                categoryId: document.getElementById('categoryId')?.value,
                categoryName: document.getElementById('categoryInput')?.value,
                description: document.getElementById('description')?.value,
                amenities: {
                    selected: [], // القيم المحددة
                    custom: []    // القيم المخصصة
                }
            }
        };

        // جمع الخصائص المحددة والمخصصة
        const amenityItems = document.querySelectorAll('.amenity-item');
        amenityItems.forEach(item => {
            const amenityValue = item.dataset.amenity;
            if (item.classList.contains('selected')) {
                if (item.classList.contains('custom')) {
                    formData.basicInfo.amenities.custom.push(amenityValue);
                } else {
                    formData.basicInfo.amenities.selected.push(amenityValue);
                }
            }
        });

        return formData;
    }

    // استعادة البيانات المحفوظة إلى النموذج
    restoreFormData() {
        if (this.formData?.basicInfo) {
            const { basicInfo } = this.formData;
            
            // استعادة القيم الأساسية
            if (document.getElementById('listingName')) {
                document.getElementById('listingName').value = basicInfo.listingName || '';
            }
            if (document.getElementById('categoryInput')) {
                document.getElementById('categoryInput').value = basicInfo.categoryName || '';
            }
            if (document.getElementById('categoryId')) {
                document.getElementById('categoryId').value = basicInfo.categoryId || '';
            }
            if (document.getElementById('description')) {
                document.getElementById('description').value = basicInfo.description || '';
                this.updateCharCount(document.getElementById('description'));
            }

            // استعادة الخصائص المخصصة
            if (basicInfo.amenities?.custom) {
                basicInfo.amenities.custom.forEach(amenity => {
                    this.addCustomAmenity(amenity, true); // true للإشارة إلى أنه استعادة
                });
            }

            // تحديد الخصائص المحددة مسبقاً
            if (basicInfo.amenities?.selected) {
                const amenityItems = document.querySelectorAll('.amenity-item');
                amenityItems.forEach(item => {
                    if (basicInfo.amenities.selected.includes(item.dataset.amenity)) {
                        item.classList.add('selected');
                    }
                });
            }
        }
    }

    goToPreviousStep() {
        if (this.currentStep > 1) {
            document.querySelector(`.form-step[id="${this.getCurrentStepId()}"]`).classList.remove('active');
            this.currentStep--;
            document.querySelector(`.form-step[id="${this.getCurrentStepId()}"]`).classList.add('active');
            this.updateStepIndicator();
            this.updateProgressBar();
            this.updateNavigationButtons();
        }
    }

    initializeProgressNavigation() {
        document.querySelectorAll('.masry-progress__step').forEach((step, index) => {
            step.addEventListener('click', () => {
                const stepNumber = index + 1;
                
                // التحقق من إمكانية الانتقال للخطوة
                if (stepNumber < this.currentStep) {
                    // يمكن الرجوع للخطوات السابقة دائماً
                    this.navigateToStep(stepNumber);
                } else if (stepNumber > this.currentStep) {
                    // للانتقال للأمام، نتحقق من الخطوة الحالية أولاً
                    const isCurrentStepValid = this.validateCurrentStep();
                    if (isCurrentStepValid) {
                        this.navigateToStep(stepNumber);
                    } else {
                        this.showStepErrors();
                        this.shakeNextButton();
                    }
                }
            });
        });
    }

    navigateToStep(stepNumber) {
        if (stepNumber === this.currentStep) return;

        // إخفاء الخطوة الحالية
        document.querySelector(`.form-step[id="${this.getCurrentStepId()}"]`).classList.remove('active');
        
        // تحديث الخطوة الحالية
        this.currentStep = stepNumber;
        
        // إظهار الخطوة الجديدة
        document.querySelector(`.form-step[id="${this.getCurrentStepId()}"]`).classList.add('active');
        
        // تحديث UI
        this.updateStepIndicator();
        this.updateProgressBar();
        this.updateNavigationButtons();

        // حفظ الحالة
        this.saveFormState();
    }

    validateStep(step) {
        switch(step) {
            case 1:
                return this.validateBasicInfo();
            case 2:
                return this.validateContactDetails();
            case 3:
                return this.validateLocation();
            case 4:
                return this.validateBusinessHours();
            case 5:
                return this.validateMedia();
            default:
                return true;
        }
    }

    validateBasicInfo() {
        const businessName = document.getElementById('listingName');
        const categoryInput = document.getElementById('categoryInput');
        const description = document.getElementById('description');

        // تحقق من جميع الحقول
        const isNameValid = this.validateField(businessName, 'businessName');
        const isCategoryValid = this.validateField(categoryInput, 'category');
        const isDescriptionValid = this.validateField(description, 'description');

        // يجب أن تكون جميع الحقول صحيحة
        return isNameValid && isCategoryValid && isDescriptionValid;
    }

    validateContactDetails() {
        if (!this.contactDetailsManager) {
            this.initializeContactDetails();
        }
        
        const emailInput = document.getElementById('email');
        const phoneInput = document.getElementById('phone');
        
        const isEmailValid = this.contactDetailsManager.validateField(emailInput, 'email');
        const isPhoneValid = this.contactDetailsManager.validateField(phoneInput, 'phone');
        
        // التحقق من الحقول الاختيارية فقط إذا تم إدخال قيم
        const websiteInput = document.getElementById('website');
        const isWebsiteValid = !websiteInput.value || this.contactDetailsManager.validateField(websiteInput, 'website');
        
        const socialInputs = document.querySelectorAll('[data-social]');
        const areSocialLinksValid = Array.from(socialInputs).every(input => 
            !input.value || this.contactDetailsManager.validateField(input, 'social')
        );

        return isEmailValid && isPhoneValid && isWebsiteValid && areSocialLinksValid;
    }

    validateLocation() {
        const address = document.getElementById('address');
        const latitude = document.getElementById('latitude');
        const longitude = document.getElementById('longitude');

        // تحقق من وجود العنوان والإحداثيات
        const isAddressValid = address ? this.validateField(address, 'address') : true;
        const hasCoordinates = latitude?.value && longitude?.value;

        return isAddressValid && hasCoordinates;
    }

    validateBusinessHours() {
        // يمكن إضافة منطق التحقق من ساعات العمل هنا
        // مثال بسيط: التأكد من أن هناك جدول ساعات عمل محدد
        const hasBusinessHours = document.querySelector('.business-hours-container')?.children.length > 0;
        return hasBusinessHours;
    }

    validateMedia() {
        // يمكن إضافة منطق التحقق من الوسائط هنا
        // مثال: التأكد من وجود صورة رئيسية على الأقل
        const mainImage = document.getElementById('mainImage')?.files.length > 0;
        return mainImage;
    }

    showStepError(step) {
        const stepNames = {
            1: 'Basic Information',
            2: 'Contact Details',
            3: 'Location',
            4: 'Business Hours',
            5: 'Media'
        };

        // إظهار رسالة خطأ للمستخدم
        const message = `Please complete ${stepNames[step]} before proceeding`;
        this.showToast(message, 'error');
    }

    showToast(message, type = 'error') {
        // إضافة نظام Toast للإشعارات
        // يمكنك استخدام مكتبة خارجية أو تنفيذ واحدة بسيطة
        console.log(`${type.toUpperCase()}: ${message}`);
    }

    initializeContactDetails() {
        if (!this.contactDetailsManager) {
            this.contactDetailsManager = new ContactDetailsManager();
        }
    }

    initializeLocation() {
        try {
            if (!this.locationManager && window.google && window.google.maps) {
                this.locationManager = new LocationManager();
            } else if (!window.google || !window.google.maps) {
                console.error('Google Maps API not loaded');
                // Optionally show user-friendly error
                const mapContainer = document.getElementById('locationMap');
                if (mapContainer) {
                    mapContainer.innerHTML = '<div class="map-error">Error loading Google Maps. Please refresh the page.</div>';
                }
            }
        } catch (error) {
            console.error('Error initializing location manager:', error);
        }
    }
}

// تحديث طريقة تهيئة المكون
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('listingForm');
    if (form) {
        const manager = new AddListingManager();
        // حفظ المثيل في متغير عام للوصول إليه لاحقاً إذا لزم الأمر
        window.addListingManager = manager;
    }
});