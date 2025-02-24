import { debounce } from '../utils/helpers.js';

export class FilterManager {
    constructor(listingsManager) {
        this.listingsManager = listingsManager;
        this.filters = new Map();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // تحديث الفلاتر النشطة عند التغيير
        this.updateActiveFilters();

        // إضافة زر Reset
        const resetBtn = document.createElement('button');
        resetBtn.className = 'masry-reset-filters';
        resetBtn.innerHTML = `
            <i class="bi bi-arrow-counterclockwise"></i>
            <span>Reset Filters</span>
        `;
        document.querySelector('.masry-listings-header .container').appendChild(resetBtn);

        resetBtn.addEventListener('click', () => this.resetAllFilters());
    }

    handleSearch(type, value) {
        this.filters.set(type, value || null);
        this.updateActiveFilters();
        this.listingsManager.filterListings();
    }

    handleStatusChange(status) {
        this.filters.set('status', status);
        this.updateActiveFilters();
        this.listingsManager.filterListings();
    }

    handleRatingChange(rating) {
        this.filters.set('rating', rating);
        this.updateActiveFilters();
        this.listingsManager.filterListings();
    }

    updateActiveFilters() {
        const container = document.getElementById('activeFilters');
        if (!container) return;

        const activeFilters = Array.from(this.filters.entries())
            .filter(([_, value]) => value !== null)
            .map(([key, value]) => this.createFilterTag(key, value));

        container.innerHTML = activeFilters.join('');
    }

    createFilterTag(key, value) {
        return `
            <div class="masry-active-filter">
                <span>${this.getFilterLabel(key, value)}</span>
                <button class="masry-active-filter__remove" 
                        onclick="window.listingsManager.filterManager.removeFilter('${key}')">
                    <i class="bi bi-x"></i>
                </button>
            </div>
        `;
    }

    getFilterLabel(key, value) {
        switch (key) {
            case 'name': return `Search: ${value}`;
            case 'location': return `Location: ${value}`;
            case 'status': return value === 'open' ? 'Open Now' : 'Closed';
            case 'rating': return `${value}+ Stars`;
            default: return value;
        }
    }

    removeFilter(key) {
        this.filters.delete(key);
        this.updateActiveFilters();
        this.listingsManager.filterListings();
    }

    resetAllFilters() {
        this.filters.clear();
        this.updateActiveFilters();
        this.listingsManager.resetAndLoad();
    }

    getActiveFilters() {
        return Object.fromEntries(this.filters);
    }

    updateFiltersCount() {
        const filters = document.querySelectorAll('.masry-filter');
        filters.forEach(filter => {
            const type = filter.dataset.filterType;
            const count = this.getFilterCount(type);
            const countEl = filter.querySelector('.masry-filter-count');
            if (countEl) {
                countEl.textContent = count;
                countEl.classList.toggle('empty', count === 0);
            }
        });
    }

    getFilterCount(type) {
        const listings = this.listingsManager.state.listings;
        switch(type) {
            case 'open':
                return listings.filter(l => this.listingsManager.isCurrentlyOpen(l)).length;
            case 'closed':
                return listings.filter(l => !this.listingsManager.isCurrentlyOpen(l)).length;
            // ... add other filter counts
        }
        return 0;
    }
}
