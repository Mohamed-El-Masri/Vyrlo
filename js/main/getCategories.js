// all categories api url : https://virlo.vercel.app/categories

class CategoryManager {
    static instance = null;
    categories = [];
    isLoading = false;

    static getInstance() {
        if (!CategoryManager.instance) {
            CategoryManager.instance = new CategoryManager();
        }
        return CategoryManager.instance;
    }

    async fetchCategories() {
        if (this.isLoading) return;
        
        try {
            this.isLoading = true;
            const response = await fetch('https://virlo.vercel.app/categories');
            if (!response.ok) throw new Error('Failed to fetch categories');
            
            this.categories = await response.json();
            this.updateUI();
            
            // Cache categories for 1 hour
            localStorage.setItem('categories', JSON.stringify({
                data: this.categories,
                timestamp: Date.now()
            }));
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            this.isLoading = false;
        }
    }

    updateUI() {
        this.updateHeader();
        this.updateFooter();
        this.updateSearchDropdown();
    }

    updateHeader() {
        const dropdownMenu = document.querySelector('.masry-dropdown-menu');
        if (!dropdownMenu) return;

        const categoriesHTML = this.categories.map(category => `
            <li>
                <a class="dropdown-item masry-dropdown-item" href="../pages/allListings.html?id=${category._id}">
                    <i class="fas fa-${category.iconOne || this.getDefaultIcon(category.categoryName)}"></i>
                    <span>${category.categoryName}</span>
                </a>
            </li>
        `).join('');

        dropdownMenu.innerHTML = categoriesHTML;
    }

    updateFooter() {
        const footerCategories = document.querySelector('.masry-footer__categories');
        if (!footerCategories) return;

        const categoriesHTML = this.categories.map(category => `
            <a href="../pages/allListings.html?id=${category._id}" class="masry-footer__link">
                ${category.categoryName}
            </a>
        `).join('');

        footerCategories.innerHTML = categoriesHTML;
    }

    updateSearchDropdown() {
        const searchOptions = document.querySelector('.masry-search__options');
        if (!searchOptions) return;

        const optionsHTML = this.categories.map(category => `
            <div class="masry-search__option" data-value="${category._id}" data-category="${category.categoryName}">
                <i class="fas fa-${category.iconOne || this.getDefaultIcon(category.categoryName)}"></i>
                <span>${category.categoryName}</span>
            </div>
        `).join('');

        searchOptions.innerHTML = optionsHTML;
    }

    getCategoryIcon(category) {
        // التحقق من وجود أيقونة في البيانات
        if (category.iconOne && category.iconOne.trim() !== '') {
            return category.iconOne;
        }
        
        // استخدام الأيقونة الثانية إذا كانت الأولى فارغة
        // if (category.iconTwo && category.iconTwo.trim() !== '') {
        //     return category.iconTwo;
        // }

        // القائمة الاحتياطية للأيقونات حسب نوع الفئة
        const fallbackIcons = {
            'Accountant': 'calculator',
            'Bakery Shop': 'bread-slice',
            'Dentist': 'tooth',
            'Restaurant': 'utensils',
            'Insurance': 'shield-alt',
            'Home Repairs': 'tools',
            'Immigration Lawyer': 'gavel',
            'Family Doctor': 'user-md',
            'Teller': 'cash-register',
            'Present': 'gift',
            'Supermarket': 'shopping-cart',
            'Dessert Shop': 'ice-cream',
            'Translation': 'language'
        };

        // استخدام الأيقونة الاحتياطية أو الافتراضية
        return fallbackIcons[category.categoryName] || 'store';
    }

    getDefaultIcon(categoryName) {
        const defaultIcons = {
            'Accountant': 'calculator',
            'Bakery Shop': 'bread-slice',
            'Dentist': 'tooth',
            'Restaurant': 'utensils',
            'Insurance': 'shield-alt',
            'Home Repairs': 'tools',
            'Immigration Lawyer': 'gavel',
            'Family Doctor': 'user-md',
            'Teller': 'cash-register',
            'Present': 'gift',
            'Supermarket': 'shopping-cart',
            'Dessert Shop': 'ice-cream',
            'Translation': 'language'
        };

        return defaultIcons[categoryName] || 'store';
    }

    getCategories() {
        return this.categories;
    }

    getCategoryById(id) {
        return this.categories.find(cat => cat._id === id);
    }

    getCategoryByName(name) {
        return this.categories.find(cat => cat.categoryName.toLowerCase() === name.toLowerCase());
    }

    // Initialize categories from cache or fetch new ones
    async initialize() {
        const cached = localStorage.getItem('categories');
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            const oneHour = 60 * 60 * 1000;
            
            if (Date.now() - timestamp < oneHour) {
                this.categories = data;
                this.updateUI();
                return;
            }
        }
        
        await this.fetchCategories();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const categoryManager = CategoryManager.getInstance();
    categoryManager.initialize();
});

// Export for use in other files
window.CategoryManager = CategoryManager;



console.log(CategoryManager.getInstance());
