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

    async initialize() {
        console.log('CategoryManager: Initializing...');
        try {
            await this.loadCategories();
            console.log('CategoryManager: Categories loaded successfully');
        } catch (error) {
            console.error('CategoryManager: Failed to initialize:', error);
        }
    }

    async loadCategories() {
        // محاولة تحميل من الكاش أولاً
        const cached = localStorage.getItem('categories');
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            const oneHour = 60 * 60 * 1000;
            
            if (Date.now() - timestamp < oneHour) {
                console.log('CategoryManager: Using cached categories');
                this.categories = data;
                this.updateUI();
                return;
            }
        }
        
        // إذا لم يكن هناك كاش أو انتهت صلاحيته
        await this.fetchCategories();
    }

    updateUI() {
        console.log('CategoryManager: Updating UI');
        
        // تحديث Explore dropdown في Header
        this.updateExploreDropdown();
        
        // تحديث Footer categories
        this.updateFooterCategories();
    }

    updateExploreDropdown() {
        const dropdownMenu = document.querySelector('.masry-dropdown-menu');
        if (!dropdownMenu) {
            console.log('CategoryManager: Dropdown menu not found, will retry...');
            // محاولة مرة أخرى بعد تأكد تحميل DOM
            setTimeout(() => this.updateExploreDropdown(), 100);
            return;
        }

        const categoriesHTML = this.categories.map(category => `
            <li>
                <a class="dropdown-item masry-dropdown-item" 
                   href="../pages/allListings.html?category=${category._id}">
                    <i class="fas fa-${this.getCategoryIcon(category)}"></i>
                    <span>${category.categoryName}</span>
                </a>
            </li>
        `).join('');

        dropdownMenu.innerHTML = categoriesHTML;
        console.log('CategoryManager: Explore dropdown updated');
    }

    updateFooterCategories() {
        const footerCategories = document.querySelector('.masry-footer__categories');
        if (!footerCategories) {
            console.log('CategoryManager: Footer categories not found, will retry...');
            setTimeout(() => this.updateFooterCategories(), 100);
            return;
        }

        const categoriesHTML = this.categories.map(category => `
            <a href="../pages/allListings.html?category=${category._id}" 
               class="masry-footer__link">
                ${category.categoryName}
            </a>
        `).join('');

        footerCategories.innerHTML = categoriesHTML;
        console.log('CategoryManager: Footer categories updated');
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

    navigateToListings(categoryId, source = '') {
        const url = new URL('../pages/allListings.html', window.location.href);
        if (categoryId) {
            url.searchParams.set('category', categoryId);
        }
        if (source) {
            url.searchParams.set('source', source);
        }
        window.location.href = url.toString();
    }
}

// Initialize immediately when the file loads
console.log('CategoryManager: Script loaded');

// Make sure CategoryManager is available globally
window.CategoryManager = CategoryManager;

// Initialize instance
const categoryManager = CategoryManager.getInstance();
categoryManager.initialize();

// تهيئة عند اكتمال تحميل DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log('CategoryManager: DOM loaded, initializing...');
    categoryManager.initialize();
});

// تهيئة عند تحميل component.js
document.addEventListener('componentLoaded', () => {
    console.log('CategoryManager: Components loaded, updating UI...');
    categoryManager.updateUI();
});

// Export for use in other files
window.CategoryManager = CategoryManager;

console.log(CategoryManager.getInstance());
