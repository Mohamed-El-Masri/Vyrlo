import { ListingCard } from './components/ListingCard.js';
import { LoadingIndicator } from './components/LoadingIndicator.js';
import { FilterControls } from './components/FilterControls.js';

export class UIManager {
    constructor(listingsManager, filterManager) {
        this.listingsManager = listingsManager;
        this.filterControls = new FilterControls(filterManager);
        this.setupUIElements();
        this.setupEventDelegation();
    }

    setupUIElements() {
        this.elements = {
            container: document.getElementById('listingsContainer'),
            loadMore: document.getElementById('loadMore'),
            totalResults: document.getElementById('totalResults'),
            categoryName: document.querySelector('.masry-category-name'),
            categoryIcon: document.querySelector('.masry-category-icon'),
            viewToggles: document.querySelectorAll('.masry-view__btn'),
            sortSelect: document.getElementById('sortSelect'),
            activeFilters: document.getElementById('masry-active-filters')
        };
    }

    setupEventDelegation() {
        // Listing Card Interactions
        this.elements.container?.addEventListener('click', (e) => {
            const card = e.target.closest('.masry-listing-card');
            if (!card) return;

            const dataset = card.dataset;
            if (e.target.matches('.masry-listing-image img')) {
                this.handleImageClick(dataset.id);
            }
        });

        // View Toggle
        this.elements.viewToggles.forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                this.updateViewMode(view);
            });
        });

        // Sort Change
        this.elements.sortSelect?.addEventListener('change', (e) => {
            this.listingsManager.handleSort(e.target.value);
        });
    }

    updateViewMode(view) {
        if (!this.elements.container) return;
        
        // Update buttons
        this.elements.viewToggles.forEach(btn => {
            const isActive = btn.dataset.view === view;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-pressed', isActive);
        });

        // Update container class
        this.elements.container.className = `masry-listings-${view}`;
        
        // Save preference
        localStorage.setItem('listingsView', view);
    }

    updateTotalResults(filteredCount, totalCount) {
        const resultsElement = document.getElementById('totalResults');
        if (!resultsElement) return;

        if (filteredCount === totalCount) {
            resultsElement.innerHTML = `${totalCount} Listings`;
        } else {
            resultsElement.innerHTML = `${filteredCount} of ${totalCount} Listings`;
        }
    }

    setupMobileFilters() {
        // إضافة زر الفلاتر
        const filterToggle = document.createElement('button');
        filterToggle.className = 'masry-filter-toggle';
        filterToggle.innerHTML = `
            <i class="bi bi-funnel"></i>
            <span>Filters</span>
        `;
        document.body.appendChild(filterToggle);

        // إضافة overlay
        const overlay = document.createElement('div');
        overlay.className = 'masry-overlay';
        document.body.appendChild(overlay);

        // إضافة زر إغلاق للسايدبار
        const closeBtn = document.createElement('button');
        closeBtn.className = 'masry-sidebar__close';
        closeBtn.innerHTML = '<i class="bi bi-x"></i>';
        document.querySelector('.masry-sidebar').appendChild(closeBtn);

        // إضافة التفاعلات
        const toggleDrawer = (show) => {
            document.querySelector('.masry-sidebar').classList.toggle('active', show);
            overlay.classList.toggle('active', show);
            document.body.style.overflow = show ? 'hidden' : '';
        };

        filterToggle.addEventListener('click', () => toggleDrawer(true));
        closeBtn.addEventListener('click', () => toggleDrawer(false));
        overlay.addEventListener('click', () => toggleDrawer(false));
    }

    updateCategoryInfo(category) {
        if (this.elements.categoryName) {
            this.elements.categoryName.textContent = category?.categoryName || 'All Listings';
        }
        if (this.elements.categoryIcon && category?.iconOne) {
            this.elements.categoryIcon.className = `bi bi-${category.iconOne}`;
        }
    }

    renderListings(listings, isLoadMore = false) {
        if (!this.elements.container) return;

        if (!listings.length) {
            this.elements.container.innerHTML = this.createNoResultsMessage();
            return;
        }

        const fragment = document.createDocumentFragment();
        listings.forEach(listing => {
            const cardHTML = ListingCard.create(listing);
            const element = document.createElement('div');
            element.innerHTML = cardHTML;
            fragment.appendChild(element.firstElementChild);
        });

        if (isLoadMore) {
            this.elements.container.appendChild(fragment);
        } else {
            this.elements.container.innerHTML = '';
            this.elements.container.appendChild(fragment);
        }

        // Update load more button visibility
        this.updateLoadMoreVisibility();
    }

    updateLoadMoreVisibility() {
        if (!this.elements.loadMore) return;
        
        const hasMore = this.listingsManager.state.pagination.hasMore;
        this.elements.loadMore.style.display = hasMore ? 'block' : 'none';
    }

    showLoading() {
        LoadingIndicator.show();
    }

    hideLoading() {
        LoadingIndicator.hide();
    }

    showLoadingMore() {
        LoadingIndicator.showLoadMore();
    }

    hideLoadingMore() {
        LoadingIndicator.hideLoadMore();
    }

    createNoResultsMessage() {
        return `
            <div class="masry-no-results">
                <i class="bi bi-search"></i>
                <h2>No Results Found</h2>
                <p>Try adjusting your filters or search criteria</p>
                <button onclick="window.listingsManager.resetAllFilters()" 
                        class="masry-btn">
                    Clear All Filters
                </button>
            </div>
        `;
    }

    showError(message, type = 'error') {
        const container = document.getElementById('listingsContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="masry-error-container">
                <div class="masry-error">
                    <div class="masry-error__icon">
                        <i class="bi ${type === 'error' ? 'bi-exclamation-circle' : 'bi-info-circle'}"></i>
                    </div>
                    <h3 class="masry-error__title">
                        ${type === 'error' ? 'Oops! Something went wrong' : 'Notice'}
                    </h3>
                    <p class="masry-error__message">${message}</p>
                    ${type === 'error' ? `
                        <button onclick="window.location.reload()" class="masry-error__button">
                            <i class="bi bi-arrow-clockwise"></i>
                            Try Again
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }
}
