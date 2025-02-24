import { APIService } from './services/APIService.js';
import { UIManager } from './ui/UIManager.js';
import { FilterManager } from './managers/FilterManager.js';
import { config } from './config.js';

export class ListingsManager {
    constructor({ api, ui, filterManager, config }) {
        this.api = api;
        this.ui = ui;
        this.filterManager = filterManager;
        this.config = config;
        this.state = this.getInitialState();
    }

    getInitialState() {
        return {
            listings: [],
            filteredListings: [],
            pagination: {
                lastValue: 1,
                totalItems: 0,
                consecutiveSameSize: 0,
                hasMore: true
            },
            filters: {
                search: null,
                location: null,
                category: null,
                status: 'all',
                rating: null
            },
            view: localStorage.getItem('listingsView') || 'grid',
            sort: localStorage.getItem('listingsSort') || 'rating',
            loading: false
        };
    }

    async loadInitialData() {
        try {
            this.ui.showLoading();
            
            // التحقق من الاتصال بالإنترنت
            if (!navigator.onLine) {
                throw new Error('Please check your internet connection and try again.');
            }

            // محاولة تحميل البيانات
            const params = new URLSearchParams();
            params.set('lastValue', '1');
            
            const data = await this.api.fetchListings(params);
            
            if (!data || !data.listings) {
                throw new Error('Unable to load listings. Please try again later.');
            }

            this.processListingsResponse(data);
            await this.loadCategories(); // سيتم تنفيذها الآن
            this.setupInfiniteScroll();
            
        } catch (error) {
            console.error('Load Error:', error);
            this.ui.showError(
                error.message || 'Unable to load listings. Please try again later.',
                'error'
            );
        } finally {
            this.ui.hideLoading();
        }
    }

    async loadCategories() {
        try {
            const categories = await this.api.fetchCategories();
            
            // تحديث واجهة المستخدم بالفئات
            if (categories && Array.isArray(categories)) {
                this.setupCategoryFilter(categories);
                
                // إذا كان هناك categoryId في URL، قم بتحديد الفئة المناسبة
                const urlParams = new URLSearchParams(window.location.search);
                const categoryId = urlParams.get('categoryId');
                if (categoryId) {
                    const category = categories.find(cat => cat._id === categoryId);
                    if (category) {
                        this.ui.updateCategoryInfo(category);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to load categories:', error);
            // عدم إظهار خطأ للمستخدم لأن هذه وظيفة ثانوية
        }
    }

    setupCategoryFilter(categories) {
        const container = document.querySelector('.masry-filter-group');
        if (!container) return;

        const categoryFilters = categories.map(category => `
            <label class="masry-checkbox">
                <input type="checkbox" 
                       name="category" 
                       value="${category._id}"
                       ${this.state.filters.category === category._id ? 'checked' : ''}>
                <span class="masry-checkbox__label">
                    <i class="bi bi-${category.iconOne || 'tag'}"></i>
                    ${category.categoryName}
                </span>
            </label>
        `).join('');

        container.innerHTML = categoryFilters;

        // إضافة مستمعي الأحداث
        container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.handleCategoryChange(checkbox.value, checkbox.checked);
            });
        });
    }

    async loadListings() {
        const params = new URLSearchParams();
        
        // إضافة lastValue دائماً
        params.set('lastValue', this.state.pagination.lastValue.toString());
        
        // إضافة الفلاتر فقط إذا كانت موجودة
        if (this.state.filters.search) params.set('name', this.state.filters.search);
        if (this.state.filters.location) params.set('location', this.state.filters.location);
        if (this.state.filters.category) params.set('categoryId', this.state.filters.category);

        const data = await this.api.fetchListings(params);
        this.processListingsResponse(data);
        this.ui.renderListings(this.state.filteredListings);
    }

    async loadMore() {
        if (this.state.loading || !this.state.pagination.hasMore) return;

        try {
            this.state.loading = true;
            this.ui.showLoadingMore();
            
            this.state.pagination.lastValue++;
            await this.loadListings();
            
        } finally {
            this.state.loading = false;
            this.ui.hideLoadingMore();
        }
    }

    async filterByCategory(categoryId) {
        if (!categoryId) return;
        this.state.filters.category = categoryId;
        await this.loadInitialData();
        this.updateURL();
    }

    async initializeFromURL() {
        const params = new URLSearchParams(window.location.search);
        this.state.filters = {
            ...this.state.filters,
            name: params.get('name'),
            location: params.get('location'),
            categoryId: params.get('categoryId')
        };
    }

    processListingsResponse(data, isLoadMore = false) {
        if (!data?.listings) return;
        
        if (isLoadMore) {
            this.state.listings = [...this.state.listings, ...data.listings];
            
            if (data.totalItems === this.state.pagination.totalItems) {
                this.state.pagination.consecutiveSameSize++;
                if (this.state.pagination.consecutiveSameSize >= 3) {
                    this.state.pagination.hasMore = false;
                }
            } else {
                this.state.pagination.consecutiveSameSize = 0;
            }
        } else {
            this.state.listings = data.listings;
        }

        this.state.pagination.totalItems = data.totalItems;
        this.filterListings();
    }

    setupInfiniteScroll() {
        const options = {
            root: null,
            rootMargin: '100px',
            threshold: 0.5
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.state.loading && this.state.pagination.hasMore) {
                    this.loadMore();
                }
            });
        }, options);

        const target = document.getElementById('loadMore');
        if (target) observer.observe(target);
    }

    updateURL() {
        const params = new URLSearchParams();
        
        // إضافة البارامترات فقط إذا لها قيمة فعلية
        if (this.state.filters.category?.trim()) {
            params.set('categoryId', this.state.filters.category);
        }
        if (this.state.filters.search?.trim()) {
            params.set('name', this.state.filters.search);
        }
        if (this.state.filters.location?.trim()) {
            params.set('location', this.state.filters.location);
        }
        // لا نضيف القيم الـ null أو الفارغة

        const newURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
        window.history.pushState({}, '', newURL);
    }

    filterListings() {
        let filtered = [...this.state.listings];

        // فلترة حسب الفئة
        if (this.state.filters.category) {
            filtered = filtered.filter(listing => 
                listing.categoryId?._id === this.state.filters.category
            );
        }

        // فلترة حسب البحث
        if (this.state.filters.search) {
            const searchTerm = this.state.filters.search.toLowerCase();
            filtered = filtered.filter(listing =>
                listing.listingName.toLowerCase().includes(searchTerm)
            );
        }

        // فلترة حسب الموقع
        if (this.state.filters.location) {
            const locationTerm = this.state.filters.location.toLowerCase();
            filtered = filtered.filter(listing =>
                listing.location.toLowerCase().includes(locationTerm)
            );
        }

        // فلترة حسب الحالة (مفتوح/مغلق)
        if (this.state.filters.status !== 'all') {
            filtered = filtered.filter(listing => {
                const isOpen = this.isCurrentlyOpen(listing);
                return this.state.filters.status === 'open' ? isOpen : !isOpen;
            });
        }

        // فلترة حسب التقييم
        if (this.state.filters.rating) {
            filtered = filtered.filter(listing => 
                (listing.totalRating || 0) >= this.state.filters.rating
            );
        }

        // تطبيق الترتيب
        filtered = this.sortListings(filtered);

        // تحديث القوائم المفلترة وعدد النتائج
        this.state.filteredListings = filtered;
        
        // تحديث واجهة المستخدم
        if (this.ui) {
            this.ui.renderListings(filtered);
            this.ui.updateTotalResults(filtered.length);
        }
    }

    sortListings(listings) {
        switch (this.state.sort) {
            case 'rating':
                return listings.sort((a, b) => (b.totalRating || 0) - (a.totalRating || 0));
            case 'name':
                return listings.sort((a, b) => a.listingName.localeCompare(b.listingName));
            case 'newest':
                return listings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            default:
                return listings;
        }
    }

    isCurrentlyOpen(listing) {
        if (!listing.openingTimes) return false;

        const now = new Date();
        const day = now.toLocaleDateString('en-US', { weekday: 'long' });
        const time = now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        });

        const schedule = listing.openingTimes[day];
        if (!schedule || schedule.status === 'close') return false;

        return this.isTimeInRange(time, schedule.from, schedule.to);
    }

    isTimeInRange(current, start, end) {
        const parseTime = (time) => {
            const [hours, minutes] = time.split(':').map(Number);
            return hours * 60 + minutes;
        };

        const currentMinutes = parseTime(current);
        const startMinutes = parseTime(start);
        const endMinutes = parseTime(end);

        return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    }
}
