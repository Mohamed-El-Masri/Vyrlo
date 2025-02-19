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
        // تأكد من تهيئة كل العناصر
        this.initializeElements();
        
        if (!this.validateElements()) {
            console.error('Some required elements are missing from the DOM');
            return;
        }

        this.init();
    }

    initializeElements() {
        this.fields = {
            keyword: this.createFieldObject(1),
            location: this.createFieldObject(2),
            category: this.createFieldObject(3)
        };

        this.searchButton = document.querySelector('.masry-search__button');
        this.datasource = {
            locations: new Set(),
            keywords: new Set(),
            categories: []
        };
    }

    createFieldObject(index) {
        const field = document.querySelector(`.masry-search__field:nth-child(${index})`);
        return field ? {
            container: field,
            input: field.querySelector('.masry-search__input'),
            dropdown: field.querySelector('.masry-select__dropdown'),
            searchInput: field.querySelector('.masry-select__search input'),
            options: field.querySelector('.masry-select__options'),
            activeField: field
        } : null;
    }

    validateElements() {
        // التحقق من وجود جميع العناصر المطلوبة
        return Object.values(this.fields).every(field => 
            field && field.input && field.dropdown && field.options
        ) && this.searchButton;
    }

    async init() {
        try {
            await this.fetchInitialData();
            this.setupEventListeners();
            this.cacheResults();
        } catch (error) {
            console.error('Initialization error:', error);
        }
    }

    async fetchInitialData() {
        try {
            const [listingsResponse, categoriesInstance] = await Promise.all([
                fetch('https://virlo.vercel.app/listing/'),
                CategoryManager.getInstance()
            ]);

            const listingsData = await listingsResponse.json();
            
            // تحليل البيانات
            listingsData.listings.forEach(listing => {
                // تخزين المواقع
                if (listing.location) {
                    this.datasource.locations.add(listing.location);
                }
                
                // تحليل الكلمات المفتاحية من العنوان والوصف
                if (listing.listingName) {
                    listing.listingName.split(/\s+/).forEach(word => {
                        if (word.length > 2) this.datasource.keywords.add(word);
                    });
                }
                if (listing.description) {
                    listing.description.split(/\s+/).forEach(word => {
                        if (word.length > 2) this.datasource.keywords.add(word);
                    });
                }
            });

            // الحصول على التصنيفات
            this.datasource.categories = categoriesInstance.getCategories();

            // تحديث القوائم المنسدلة
            this.updateAllDropdowns();
        } catch (error) {
            console.error('Error fetching initial data:', error);
        }
    }

    setupEventListeners() {
        Object.entries(this.fields).forEach(([fieldName, elements]) => {
            if (!elements) return;

            elements.input?.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleDropdown(fieldName);
            });

            elements.searchInput?.addEventListener('input', (e) => {
                this.performSearch(fieldName, e.target.value);
            });

            elements.options?.addEventListener('click', (e) => {
                const option = e.target.closest('.masry-select__option');
                if (option) {
                    this.selectOption(fieldName, option);
                }
            });
        });

        // إغلاق القوائم عند النقر خارجها
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.masry-search__field')) {
                this.closeAllDropdowns();
            }
        });

        // معالجة البحث
        this.searchButton?.addEventListener('click', () => this.handleSearch());
    }

    performSearch(fieldName, query) {
        query = query.toLowerCase().trim();
        const field = this.fields[fieldName];
        let filteredItems;

        switch (fieldName) {
            case 'category':
                filteredItems = this.datasource.categories.filter(cat => 
                    cat.categoryName.toLowerCase().includes(query)
                );
                break;
            case 'location':
                filteredItems = Array.from(this.datasource.locations).filter(loc => 
                    loc.toLowerCase().includes(query)
                );
                break;
            case 'keyword':
                filteredItems = Array.from(this.datasource.keywords).filter(key => 
                    key.toLowerCase().includes(query)
                );
                break;
        }

        this.renderFilteredOptions(fieldName, filteredItems);
        this.showDropdown(fieldName);
    }

    renderFilteredOptions(fieldName, items) {
        const field = this.fields[fieldName];
        let html = '';

        if (items.length === 0) {
            html = '<div class="masry-select__no-results">No results found</div>';
        } else {
            html = items.map(item => {
                if (fieldName === 'category') {
                    const icon = CategoryManager.getInstance().getCategoryIcon(item);
                    return `
                        <div class="masry-select__option" data-value="${item._id}">
                            <i class="fas fa-${icon}"></i>
                            <span>${item.categoryName}</span>
                        </div>
                    `;
                } else {
                    const icon = fieldName === 'location' ? 'bi-geo-alt' : 'bi-search';
                    return `
                        <div class="masry-select__option">
                            <i class="bi ${icon}"></i>
                            <span>${item}</span>
                        </div>
                    `;
                }
            }).join('');
        }

        field.options.innerHTML = html;
    }

    selectOption(fieldName, option) {
        const field = this.fields[fieldName];
        const value = option.textContent.trim();
        
        field.input.value = value;
        field.activeField.classList.add('has-value');
        this.hideDropdown(fieldName);

        // تحديث حالة البحث
        this.updateSearchState();
    }

    toggleDropdown(fieldName) {
        const isVisible = this.fields[fieldName].dropdown.style.display === 'block';
        
        this.closeAllDropdowns();
        
        if (!isVisible) {
            this.showDropdown(fieldName);
        }
    }

    showDropdown(fieldName) {
        const field = this.fields[fieldName];
        field.dropdown.style.display = 'block';
        field.activeField.classList.add('active');
        field.searchInput?.focus();
    }

    hideDropdown(fieldName) {
        const field = this.fields[fieldName];
        field.dropdown.style.display = 'none';
        field.activeField.classList.remove('active');
        if (field.searchInput) {
            field.searchInput.value = '';
        }
    }

    closeAllDropdowns() {
        Object.keys(this.fields).forEach(fieldName => {
            this.hideDropdown(fieldName);
        });
    }

    updateAllDropdowns() {
        Object.keys(this.fields).forEach(fieldName => {
            const items = fieldName === 'category' ? 
                this.datasource.categories :
                Array.from(this.datasource[fieldName + 's']);
            this.renderFilteredOptions(fieldName, items);
        });
    }

    handleSearch() {
        const searchParams = {
            keyword: this.fields.keyword.input.value,
            location: this.fields.location.input.value,
            category: this.fields.category.input.value
        };

        // الانتقال إلى صفحة alllistings مع تمرير المعلمات لاستخدامها في التصفية
        const filteredParams = Object.fromEntries(Object.entries(searchParams).filter(([key, value]) => value));
        const queryString = new URLSearchParams(filteredParams).toString();
        window.location.href = `/pages/allListings.html?${queryString}`;
    }

    // حفظ النتائج في ذاكرة التخزين المؤقت
    cacheResults() {
        localStorage.setItem('searchData', JSON.stringify({
            locations: Array.from(this.datasource.locations),
            keywords: Array.from(this.datasource.keywords),
            timestamp: Date.now()
        }));
    }
}

// تهيئة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    new SearchHandler();
});
