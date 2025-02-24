class CustomSelect {
    constructor(element, options = []) {
        this.element = element;
        this.options = options;
        this.placeholder = element.querySelector('.masry-select__placeholder');
        this.searchInput = element.querySelector('.masry-select__search input');
        this.optionsContainer = element.querySelector('.masry-select__options');
        
        this.init();
        this.bindEvents();
    }

    init() {
        // Populate initial options
        this.renderOptions(this.options);
        
        // Set initial state
        this.selected = null;
        this.isOpen = false;
    }

    
    bindEvents() {
        // Toggle dropdown
        this.element.querySelector('.masry-select__header').addEventListener('click', () => {
            this.toggleDropdown();
        });

        // Search functionality
        this.searchInput?.addEventListener('input', (e) => {
            this.filterOptions(e.target.value);
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.element.contains(e.target)) {
                this.closeDropdown();
            }
        });
    }

    toggleDropdown() {
        if (this.isOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }

    openDropdown() {
        this.element.classList.add('active');
        this.isOpen = true;
        if (this.searchInput) {
            this.searchInput.focus();
        }
    }

    closeDropdown() {
        this.element.classList.remove('active');
        this.isOpen = false;
        if (this.searchInput) {
            this.searchInput.value = '';
            this.filterOptions('');
        }
    }

    renderOptions(options) {
        this.optionsContainer.innerHTML = options.map(option => `
            <div class="masry-select__option" data-value="${option.value}">
                <i class="${option.icon}"></i>
                <span>${option.label}</span>
            </div>
        `).join('');

        // Bind click events to new options
        this.optionsContainer.querySelectorAll('.masry-select__option').forEach(option => {
            option.addEventListener('click', () => this.selectOption(option));
        });
    }

    filterOptions(query) {
        const filtered = this.options.filter(option => 
            option.label.toLowerCase().includes(query.toLowerCase())
        );
        this.renderOptions(filtered);
    }

    selectOption(optionElement) {
        const value = optionElement.dataset.value;
        const label = optionElement.querySelector('span').textContent;

        this.selected = { value, label };
        this.placeholder.textContent = label;
        this.placeholder.classList.add('selected');
        
        this.closeDropdown();
        
        // Trigger change event
        this.element.dispatchEvent(new CustomEvent('change', {
            detail: { value, label }
        }));
    }
}

class SearchHandler {
    constructor() {
        this.config = {
            api: {
                baseUrl: 'https://virlo.vercel.app/listing',
                categoriesUrl: 'https://virlo.vercel.app/categories'
            },
            debounceTime: 300,
            minSearchLength: 2
        };

        this.elements = {
            keywordInput: document.querySelector('.masry-search__input[data-search-type="keyword"]'),
            locationInput: document.querySelector('.masry-search__input[data-search-type="location"]'),
            categoryInput: document.querySelector('.masry-search__input[data-search-type="category"]'),
            searchButton: document.querySelector('.masry-search__button'),
            dropdowns: document.querySelectorAll('.masry-select__dropdown')
        };

        this.state = {
            keyword: '',
            location: '',
            category: '',
            isLoading: false,
            suggestions: {
                keywords: new Set(),
                locations: new Set(),
                categories: []
            }
        };

        this.init();
    }

    async init() {
        try {
            // تهيئة العناصر أولاً
            this.bindEvents();
            
            // ثم تحميل البيانات
            await this.loadInitialData();
            
            // وأخيراً استعادة البحث السابق
            this.restoreLastSearch();
        } catch (error) {
            console.error('Initialization error:', error);
            this.showError('Failed to initialize search');
        }
    }

    async loadInitialData() {
        try {
            const [listingsResponse, categoriesResponse] = await Promise.all([
                fetch(`${this.config.api.baseUrl}/?lastValue=1`),
                fetch(this.config.api.categoriesUrl)
            ]);

            const [listingsData, categoriesData] = await Promise.all([
                listingsResponse.json(),
                categoriesResponse.json()
            ]);

            this.processListingsData(listingsData);
            this.state.suggestions.categories = categoriesData;

            this.updateAllDropdowns();
        } catch (error) {
            console.error('Data loading error:', error);
            throw new Error('Failed to load initial data');
        }
    }

    updateAllDropdowns() {
        this.updateDropdown('keyword', Array.from(this.state.suggestions.keywords));
        this.updateDropdown('location', Array.from(this.state.suggestions.locations));
        this.updateDropdown('category', this.state.suggestions.categories);
    }

    processListingsData(data) {
        if (!data.listings) return;
        
        data.listings.forEach(listing => {
            if (listing.location) {
                this.state.suggestions.locations.add(listing.location);
            }
            if (listing.listingName) {
                listing.listingName.split(/\s+/).forEach(word => {
                    if (word.length > this.config.minSearchLength) {
                        this.state.suggestions.keywords.add(word);
                    }
                });
            }
        });
    }

    bindEvents() {
        if (!this.elements.keywordInput || 
            !this.elements.locationInput || 
            !this.elements.categoryInput) {
            console.warn('Some search elements are missing');
            return;
        }

        // Bind search inputs
        this.elements.keywordInput.addEventListener('input', 
            this.debounce(e => this.handleInput(e, 'keyword'), this.config.debounceTime)
        );
        this.elements.locationInput.addEventListener('input',
            this.debounce(e => this.handleInput(e, 'location'), this.config.debounceTime)
        );
        this.elements.categoryInput.addEventListener('input',
            this.debounce(e => this.handleInput(e, 'category'), this.config.debounceTime)
        );

        // Bind search button
        if (this.elements.searchButton) {
            this.elements.searchButton.addEventListener('click', () => this.handleSearch());
        }

        // Close dropdowns on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.masry-search__field')) {
                this.closeAllDropdowns();
            }
        });
    }

    handleInput(event, type) {
        if (!event || !event.target) {
            console.warn(`Invalid event for ${type}`);
            return;
        }

        const value = event.target.value.trim();
        this.state[type] = value;

        if (value.length < this.config.minSearchLength) {
            this.closeDropdown(type);
            return;
        }

        this.showDropdown(type);
        this.filterSuggestions(type, value);
    }

    filterSuggestions(type, value) {
        const suggestions = Array.from(this.state.suggestions[type + 's'] || [])
            .filter(item => {
                const searchValue = type === 'category' ? item.categoryName : item;
                return searchValue.toLowerCase().includes(value.toLowerCase());
            });

        this.updateDropdown(type, suggestions);
    }

    updateDropdown(type, suggestions) {
        const dropdown = document.querySelector(`.masry-search__field[data-type="${type}"] .masry-select__options`);
        if (!dropdown) return;

        dropdown.innerHTML = suggestions.map(item => {
            const value = type === 'category' ? item.categoryName : item;
            const icon = this.getSuggestionIcon(type);
            return `
                <div class="masry-select__option" data-value="${type === 'category' ? item._id : value}">
                    <i class="${icon}"></i>
                    <span>${value}</span>
                </div>
            `;
        }).join('');

        dropdown.querySelectorAll('.masry-select__option').forEach(option => {
            option.addEventListener('click', () => this.selectOption(type, option));
        });
    }

    getSuggestionIcon(type) {
        const icons = {
            keyword: 'fa-solid fa-search',
            location: 'fa-solid fa-location-dot',
            category: 'fa-solid fa-layer-group'
        };
        return icons[type] || 'fa-solid fa-circle';
    }

    selectOption(type, option) {
        const value = option.querySelector('span').textContent;
        const input = this.elements[`${type}Input`];
        if (input) {
            input.value = value;
            this.state[type] = type === 'category' ? option.dataset.value : value;
            this.hideDropdown(type);
        }
    }

    showDropdown(type) {
        const field = this.elements[`${type}Input`]?.closest('.masry-search__field');
        if (field) {
            field.dropdown.style.display = 'block';
            field.activeField.classList.add('active');
            field.searchInput?.focus();
        }
    }

    hideDropdown(type) {
        const field = this.elements[`${type}Input`]?.closest('.masry-search__field');
        if (field) {
            field.dropdown.style.display = 'none';
            field.activeField.classList.remove('active');
            if (field.searchInput) {
                field.searchInput.value = '';
            }
        }
    }

    closeAllDropdowns() {
        Object.keys(this.elements).forEach(type => {
            this.hideDropdown(type);
        });
    }

    handleSearch() {
        const searchParams = {
            keyword: this.state.keyword,
            location: this.state.location,
            category: this.state.category
        };

        // الانتقال إلى صفحة alllistings مع تمرير المعلمات لاستخدامها في التصفية
        const filteredParams = Object.fromEntries(Object.entries(searchParams).filter(([key, value]) => value));
        const queryString = new URLSearchParams(filteredParams).toString();
        window.location.href = `/pages/allListings.html?${queryString}`;
    }

    showLoadingIndicator(type) {
        const field = this.elements[`${type}Input`]?.closest('.masry-search__field');
        if (field) {
            field.dropdown.classList.add('loading');
        }
    }

    hideLoadingIndicator(type) {
        const field = this.elements[`${type}Input`]?.closest('.masry-search__field');
        if (field) {
            field.dropdown.classList.remove('loading');
        }
    }

    showError(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'masry-select__error';
        errorElement.textContent = message;
        
        const field = this.elements.keywordInput?.closest('.masry-search__field') ||
                     this.elements.locationInput?.closest('.masry-search__field') ||
                     this.elements.categoryInput?.closest('.masry-search__field');
        
        if (field) {
            field.appendChild(errorElement);
        }
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    restoreLastSearch() {
        try {
            const savedSearch = localStorage.getItem('lastSearch');
            if (!savedSearch) return;

            const searchData = JSON.parse(savedSearch);
            
            // التحقق من صلاحية البيانات المخزنة
            if (Date.now() - searchData.timestamp > 24 * 60 * 60 * 1000) {
                localStorage.removeItem('lastSearch');
                return;
            }

            // تحديث حقول البحث إذا كانت موجودة
            if (this.elements.keywordInput && searchData.keyword) {
                this.elements.keywordInput.value = searchData.keyword;
                this.state.keyword = searchData.keyword;
            }

            if (this.elements.locationInput && searchData.location) {
                this.elements.locationInput.value = searchData.location;
                this.state.location = searchData.location;
            }

            if (this.elements.categoryInput && searchData.category) {
                this.elements.categoryInput.value = searchData.category;
                this.state.category = searchData.category;
            }
        } catch (error) {
            console.warn('Failed to restore last search:', error);
        }
    }

    // إضافة وظيفة حفظ البحث الأخير
    saveLastSearch() {
        const searchData = {
            keyword: this.state.keyword,
            location: this.state.location,
            category: this.state.category,
            timestamp: Date.now()
        };
        localStorage.setItem('lastSearch', JSON.stringify(searchData));
    }

    // إضافة وظيفة البحث المتقدم
    async performAdvancedSearch() {
        try {
            this.showLoadingState();
            
            const params = new URLSearchParams({
                lastValue: 1,
                name: this.state.keyword,
                location: this.state.location,
                categoryId: this.state.category
            });

            const response = await fetch(`${this.config.api.baseUrl}/?${params}`);
            const data = await response.json();

            this.saveLastSearch();
            return data;
        } catch (error) {
            console.error('Search error:', error);
            this.showError('Failed to perform search');
            return null;
        } finally {
            this.hideLoadingState();
        }
    }

    // تحسين عرض حالة التحميل
    showLoadingState() {
        this.state.isLoading = true;
        this.elements.searchButton.classList.add('loading');
        this.elements.searchButton.disabled = true;
    }

    hideLoadingState() {
        this.state.isLoading = false;
        this.elements.searchButton.classList.remove('loading');
        this.elements.searchButton.disabled = false;
    }

    // تحسين معالجة الأخطاء
    handleError(error, type = 'general') {
        console.error(`${type} error:`, error);
        
        const errorMessages = {
            network: 'Network connection error. Please check your internet connection.',
            api: 'Server error. Please try again later.',
            validation: 'Please check your input and try again.',
            general: 'An error occurred. Please try again.'
        };

        this.showError(errorMessages[type] || errorMessages.general);
    }

    // إضافة وظيفة التحقق من المدخلات
    validateInputs() {
        const validations = {
            keyword: this.state.keyword.length >= this.config.minSearchLength,
            location: this.state.location.length >= this.config.minSearchLength,
            category: this.state.category.length > 0
        };

        return Object.values(validations).some(isValid => isValid);
    }

    // تحسين معالجة البحث
    async handleSearch() {
        if (!this.validateInputs()) {
            this.showError('Please enter at least one search criteria');
            return;
        }

        try {
            const searchResults = await this.performAdvancedSearch();
            if (searchResults) {
                // تحويل النتائج إلى معلمات URL
                const queryParams = new URLSearchParams({
                    keyword: this.state.keyword,
                    location: this.state.location,
                    category: this.state.category,
                    results: JSON.stringify(searchResults)
                });

                // الانتقال إلى صفحة النتائج
                window.location.href = `/pages/allListings.html?${queryParams.toString()}`;
            }
        } catch (error) {
            this.handleError(error, 'api');
        }
    }

    // إضافة وظيفة الاقتراحات الذكية
    updateSmartSuggestions(type, value) {
        if (value.length < this.config.minSearchLength) return;

        const recentSearches = this.getRecentSearches();
        const suggestions = new Set([
            ...Array.from(this.state.suggestions[type + 's'] || []),
            ...recentSearches[type] || []
        ]);

        this.updateDropdown(type, Array.from(suggestions));
    }

    // إضافة وظيفة استرجاع البحث السابق
    getRecentSearches() {
        try {
            const searches = localStorage.getItem('recentSearches');
            return searches ? JSON.parse(searches) : {};
        } catch {
            return {};
        }
    }
}

// تهيئة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    const searchHandler = new SearchHandler();
    
    // إضافة مستمع للتغييرات في الموقع
    if ('geolocation' in navigator) {
        const locationInput = document.querySelector('.masry-search__input[placeholder="Select location"]');
        
        document.querySelector('.masry-search__location-detect')?.addEventListener('click', () => {
            navigator.geolocation.getCurrentPosition(
                position => {
                    // تحويل الإحداثيات إلى عنوان باستخدام Reverse Geocoding
                    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json`)
                        .then(response => response.json())
                        .then(data => {
                            if (locationInput && data.address) {
                                locationInput.value = data.address.city || data.address.town || data.address.village || '';
                                searchHandler.handleInput({ target: locationInput }, 'location');
                            }
                        })
                        .catch(error => searchHandler.handleError(error, 'network'));
                },
                error => searchHandler.handleError(error, 'location')
            );
        });
    }
});
