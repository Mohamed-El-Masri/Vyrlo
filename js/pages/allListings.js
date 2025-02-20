// Import required utilities
import { securityManager } from '../utils/security.js';
import { performanceManager } from '../utils/performanceManager.js';
import { uiManager } from '../utils/uiManager.js';

class AllListings {
    constructor() {
        // Initialize config
        this.config = {
            api: {
                baseUrl: 'https://virlo.vercel.app/listing',
                itemsPerPage: 4,
                initialLoad: 4,
                batchSize: 1,
                prefetchCount: 2
            },
            timing: {
                scrollThrottle: 100,
                searchDebounce: 300,
                resizeDebounce: 250
            }
        };

        // 1. تعريف الحالة
        this.state = {
            filters: {
                name: '',
                location: '',
                categoryId: ''
            },
            pagination: {
                lastValue: 1,
                totalItems: 0,
                hasMore: true
            },
            ui: {
                loading: false,
                error: null,
                isMobile: window.innerWidth <= 768,
                scrollThreshold: 800
            },
            items: [],
            filteredItems: []
        };

        // 2. ربط المعالجات (bind handlers)
        this.boundHandlers = {
            scroll: this.handleScroll.bind(this),
            search: this.handleSearch.bind(this),
            resize: this.handleResize.bind(this),
            clearFilters: this.clearFilters.bind(this)
        };

        // 3. إنشاء النسخ المحسنة من المعالجات
        this.optimizedHandlers = {
            scroll: this.throttle(this.boundHandlers.scroll, 100),
            search: this.debounce(this.boundHandlers.search, 300),
            resize: this.debounce(this.boundHandlers.resize, 250)
        };

        // 4. بدء التهيئة
        this.init().catch(this.handleError.bind(this));
    }

    verifyDependencies() {
        const required = ['securityManager', 'performanceManager', 'uiManager'];
        for (const dep of required) {
            if (!window[dep]) throw new Error(`Missing required dependency: ${dep}`);
        }
    }

    setupHandlers() {
        // Bind methods
        this.handleScroll = this.handleScroll.bind(this);
        this.handleSearch = this.handleSearch.bind(this);
        this.handleResize = this.handleResize.bind(this);

        // Create throttled scroll handler
        this.throttledScroll = this.createThrottledFunction(
            this.handleScroll,
            this.config.timing.scrollThrottle
        );

        // Create debounced search handler
        this.debouncedSearch = this.createDebouncedFunction(
            this.handleSearch,
            this.config.timing.searchDebounce
        );

        // Create debounced resize handler
        this.debouncedResize = this.createDebouncedFunction(
            this.handleResize,
            this.config.timing.resizeDebounce
        );
    }

    createThrottledFunction(func, limit) {
        let waiting = false;
        return (...args) => {
            if (!waiting) {
                func.apply(this, args);
                waiting = true;
                requestAnimationFrame(() => {
                    waiting = false;
                });
            }
        };
    }

    createDebouncedFunction(func, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    async init() {
        try {
            // Verify dependencies
            this.verifyDependencies();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Load initial content
            await this.loadInitialContent();
        } catch (error) {
            this.handleError(error);
        }
    }

    setupEventListeners() {
        // Filter inputs
        const filterGroups = document.querySelectorAll('.filter-group');
        filterGroups.forEach(group => {
            const input = group.querySelector('input');
            const filterType = group.getAttribute('data-type');
            if (input && filterType) {
                input.dataset.filterType = filterType;
                input.addEventListener('input', this.optimizedHandlers.search);
            }
        });

        // Scroll and resize
        window.addEventListener('scroll', this.optimizedHandlers.scroll);
        window.addEventListener('resize', this.optimizedHandlers.resize);

        // Load more button
        const loadMoreBtn = document.querySelector('.masry-load-more');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => this.loadMore());
        }

        // Clear filters button
        const clearBtn = document.querySelector('.clear-filters');
        if (clearBtn) {
            clearBtn.addEventListener('click', this.boundHandlers.clearFilters);
        }
    }

    handleScroll() {
        if (this.state.ui.loading || !this.state.pagination.hasMore) return;

        const scrolled = window.scrollY;
        const viewportHeight = window.innerHeight;
        const totalHeight = document.documentElement.scrollHeight;

        if (totalHeight - (scrolled + viewportHeight) < this.state.ui.scrollThreshold) {
            // Fix: Use proper async/await pattern
            this.loadMore().catch(error => this.handleError(error));
        }
    }

    async handleSearch(event) {
        const filterType = event.target.dataset.filterType;
        const value = event.target.value.trim();

        // تحديث حالة الفلتر
        this.state.filters[filterType] = value;

        // تحديث URL
        this.updateUrlWithFilters();

        // إعادة تحميل البيانات مع الفلاتر الجديدة
        await this.reloadWithFilters();
    }

    handleResize() {
        this.updateLayoutForScreenSize();
    }

    async updateFilter(field, value) {
        try {
            this.state.filters[field] = value;
            this.updateUrl();
            
            // Use worker for filtering if available
            if (this.worker) {
                this.worker.postMessage({
                    type: 'FILTER_ITEMS',
                    data: {
                        items: this.state.items.all,
                        filters: this.state.filters
                    }
                });
            } else {
                await this.filterAndDisplayItems();
            }
        } catch (error) {
            this.handleError(error);
        }
    }

    async loadInitialContent() {
        try {
            this.showLoading();
            
            // Try loading from cache first
            const cachedData = this.loadFromCache();
            if (cachedData) {
                this.state.items.all = cachedData;
                await this.filterAndDisplayItems();
                return;
            }

            // Fetch fresh data
            const items = await this.fetchItems(1);
            this.state.items.all = items;
            this.saveToCache(items);
            
            await this.filterAndDisplayItems();
            this.prefetchNextBatch();

        } catch (error) {
            this.handleError(error);
        } finally {
            this.hideLoading();
        }
    }

    async loadMore() {
        if (this.state.ui.loading || !this.state.ui.hasMore) return;

        this.state.ui.loading = true;
        try {
            const nextBatch = await this.fetchBatch(this.state.lastValue);
            if (nextBatch && nextBatch.length > 0) {
                await this.appendItems(nextBatch);
                this.state.lastValue++;
                this.updateLoadMoreButton();
            } else {
                this.state.ui.hasMore = false;
                this.updateLoadMoreButton('No More Listings');
            }
        } catch (error) {
            this.handleError(error);
        } finally {
            this.state.ui.loading = false;
        }
    }

    handleWorkerMessage(event) {
        const { type, data } = event.data;
        
        switch (type) {
            case 'ITEMS_FILTERED':
                this.state.items.filtered = data;
                this.renderItems(data.slice(0, this.config.api.initialLoad));
                this.updateResultsCount(data.length);
                break;

            case 'ITEMS_SORTED':
                this.state.items.all = data;
                this.filterAndDisplayItems();
                break;
        }
    }

    handleError(error) {
        this.state.ui.error = error;
        
        const message = error.message || 'Something went wrong';
        this.ui.showError(message, document.querySelector('.listings-grid'));
        
        console.error('Listings Error:', error);
    }

    cleanup() {
        // Clear timeouts and event listeners
        if (this.worker) {
            this.worker.terminate();
        }
        
        // Clear cache if needed
        if (this.state.ui.error) {
            this.clearCache();
        }
    }

    async fetchItems() {
        const params = new URLSearchParams({
            lastValue: this.state.pagination.lastValue.toString()
        });

        // إضافة الفلاتر النشطة
        if (this.state.filters.name) {
            params.append('name', this.state.filters.name);
        }
        if (this.state.filters.location) {
            params.append('location', this.state.filters.location);
        }
        if (this.state.filters.categoryId) {
            params.append('categoryId', this.state.filters.categoryId);
        }

        try {
            const response = await fetch(`${this.config.api.baseUrl}/?${params}`);
            if (!response.ok) throw new Error('Failed to fetch listings');

            const data = await response.json();
            
            // تحديث حالة الصفحات
            this.state.pagination = {
                lastValue: data.lastValue,
                totalItems: data.totalItems,
                hasMore: data.listings.length > 0
            };

            return data.listings;

        } catch (error) {
            this.handleError(error);
            return [];
        }
    }

    renderItem(item) {
        return `
            <div class="listing-card" data-id="${item._id}">
                <a href="listing-details.html?id=${item._id}" class="listing-card__link">
                    <div class="listing-card__image">
                        <img src="${item.mainImage || this.config.defaultImage}" 
                             alt="${item.listingName}"
                             loading="lazy">
                        <div class="listing-card__badge ${item.isPosted ? 'is-open' : 'is-closed'}">
                            ${item.isPosted ? 'OPEN' : 'CLOSED'}
                        </div>
                    </div>
                    <div class="listing-card__content">
                        <h3 class="listing-card__title">${item.listingName}</h3>
                        <div class="listing-card__info">
                            <div class="listing-card__location">
                                <i class="bi bi-geo-alt"></i>
                                <span>${item.location}</span>
                            </div>
                            <div class="listing-card__category">
                                <i class="bi bi-tag"></i>
                                <span>${item.categoryId.categoryName}</span>
                            </div>
                        </div>
                        ${item.description ? `
                            <p class="listing-card__description">
                                ${this.truncateText(item.description, 150)}
                            </p>
                        ` : ''}
                        ${this.renderOpeningHours(item.openingTimes)}
                    </div>
                </a>
            </div>
        `;
    }

    renderOpeningHours(times) {
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const todayHours = times[today];

        return `
            <div class="listing-card__hours">
                <i class="bi bi-clock"></i>
                <span>
                    ${todayHours.status === 'open' 
                        ? `Open: ${todayHours.from} - ${todayHours.to}`
                        : `Closed: ${todayHours.closingReason || 'Not Available'}`}
                </span>
            </div>
        `;
    }

    updateUrlWithFilters() {
        const params = new URLSearchParams();
        Object.entries(this.state.filters).forEach(([key, value]) => {
            if (value) params.append(key, value);
        });

        const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
        window.history.pushState({}, '', newUrl);
    }

    async reloadWithFilters() {
        try {
            this.showLoading();
            
            // إعادة تعيين حالة الصفحات
            this.state.pagination.lastValue = 1;
            this.state.pagination.hasMore = true;
            
            // جلب البيانات مع الفلاتر
            const items = await this.fetchItems();
            
            // تحديث العرض
            this.updateDisplay(items);
            
        } catch (error) {
            this.handleError(error);
        } finally {
            this.hideLoading();
        }
    }

    updateDisplay(items) {
        // تحديث عداد النتائج
        this.updateResultsCount(items.length);
        
        // تحديث القوائم المعروضة
        if (items.length === 0) {
            this.showNoResults();
        } else {
            this.renderItems(items);
        }
        
        // تحديث زر "تحميل المزيد"
        this.updateLoadMoreButton();
    }

    showNoResults() {
        const grid = document.querySelector('.listings-grid');
        if (!grid) return;

        grid.innerHTML = `
            <div class="no-results">
                <i class="bi bi-search"></i>
                <h3>No Results Found</h3>
                <p>Try adjusting your search criteria</p>
                <button class="clear-filters" onclick="this.clearFilters()">
                    Clear All Filters
                </button>
            </div>
        `;
    }

    clearFilters() {
        // إعادة تعيين الفلاتر
        Object.keys(this.state.filters).forEach(key => {
            this.state.filters[key] = '';
        });

        // إعادة تعيين حقول البحث
        document.querySelectorAll('.masry-search__field input').forEach(input => {
            input.value = '';
        });

        // إعادة تحميل البيانات
        this.reloadWithFilters();
    }

    // ... rest of utility methods ...
}

// Ensure proper initialization
let instance = null;

function initializeAllListings() {
    try {
        if (!instance) {
            instance = new AllListings();
            window.allListings = instance;
        }
        return instance;
    } catch (error) {
        console.error('Initialization failed:', error);
        document.querySelector('.listings-grid')?.innerHTML = `
            <div class="error-message">
                <i class="bi bi-exclamation-circle"></i>
                <h3>Initialization Failed</h3>
                <p>Please refresh the page or contact support</p>
            </div>
        `;
        return null;
    }
}

// Initialize when dependencies are ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAllListings);
} else {
    initializeAllListings();
}

export default AllListings;
