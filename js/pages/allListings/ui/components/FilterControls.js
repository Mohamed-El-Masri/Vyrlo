export class FilterControls {
    constructor(filterManager) {
        this.filterManager = filterManager;
        this.setupStatusFilter();
        this.setupRatingFilter();
        this.setupSearchFilters();
    }

    setupStatusFilter() {
        const container = document.querySelector('.masry-filter-section');
        if (!container) return;

        // إضافة العنوان بالتصميم الجديد
        const filterHeader = document.createElement('h3');
        filterHeader.className = 'masry-filter__title';
        filterHeader.textContent = 'Status';
        
        const statusFilter = document.createElement('div');
        statusFilter.className = 'masry-status-filter';
        statusFilter.innerHTML = `
            <button class="masry-status__btn active" data-status="all">
                <i class="bi bi-grid"></i>
                All
            </button>
            <button class="masry-status__btn" data-status="open">
                <i class="bi bi-door-open"></i>
                Open Now
            </button>
            <button class="masry-status__btn" data-status="closed">
                <i class="bi bi-door-closed"></i>
                Closed
            </button>
        `;

        container.appendChild(filterHeader);
        container.appendChild(statusFilter);

        // إضافة التفاعلات
        statusFilter.addEventListener('click', (e) => {
            const btn = e.target.closest('.masry-status__btn');
            if (!btn) return;

            statusFilter.querySelectorAll('.masry-status__btn').forEach(b => 
                b.classList.toggle('active', b === btn)
            );

            this.handleStatusChange(btn.dataset.status);
        });
    }

    setupRatingFilter() {
        const container = document.querySelector('.masry-rating-filter');
        if (!container) return;

        const stars = Array.from({ length: 5 }, (_, i) => 5 - i);
        container.innerHTML = `
            <div class="masry-rating-stars" role="group" aria-label="Filter by rating">
                ${stars.map(rating => `
                    <button class="masry-rating-star" 
                            data-rating="${rating}"
                            aria-label="${rating} stars">
                        <i class="bi bi-star-fill"></i>
                        <span class="masry-rating__label">${rating}+</span>
                    </button>
                `).join('')}
            </div>
        `;

        container.addEventListener('click', (e) => {
            const star = e.target.closest('.masry-rating-star');
            if (!star) return;

            const rating = parseInt(star.dataset.rating);
            this.handleRatingSelect(rating);
        });
    }

    handleRatingSelect(rating) {
        const stars = document.querySelectorAll('.masry-rating-star');
        stars.forEach(star => {
            const starRating = parseInt(star.dataset.rating);
            star.classList.toggle('active', starRating <= rating);
        });

        this.filterManager.handleRatingChange(rating);
    }

    setupSearchFilters() {
        const searchInput = document.getElementById('keywordSearch');
        const locationInput = document.getElementById('locationSearch');

        if (searchInput) {
            this.setupSearchInput(searchInput, 'name');
        }
        if (locationInput) {
            this.setupSearchInput(locationInput, 'location');
        }
    }

    setupSearchInput(input, type) {
        const searchTimeout = 300;
        let timeoutId;

        input.addEventListener('input', () => {
            clearTimeout(timeoutId);
            
            timeoutId = setTimeout(() => {
                const value = input.value.trim();
                this.filterManager.handleSearch(type, value);
            }, searchTimeout);
        });
    }
}
