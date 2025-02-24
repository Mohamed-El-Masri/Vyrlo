class FeaturedServices {
    constructor() {
        this.config = {
            itemsPerBatch: 4,
            containerSelector: '.featured-services',
            defaultImages: {
                placeholder: '../images/defaults/placeholder.jpg',
                listing: '../images/defaults/default-listing.png'
            }
        };

        this.state = {
            listings: [],
            displayedCount: 0,
            isLoading: false,
            totalPages: 0,
            currentPage: 1,
            isFirstLoad: true
        };

        this.container = document.querySelector(this.config.containerSelector);
        window.addEventListener('categorySwiperReady', this.handleDataReady.bind(this));
    }

    handleDataReady(event) {
        if (!event.detail?.activeListings) return;
        
        const listings = Array.from(event.detail.activeListings.values())
            .filter(listing => listing.isActive)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        this.state.listings = listings;
        this.state.totalPages = Math.ceil(listings.length / this.config.itemsPerBatch);
        
        this.initializeDisplay();
    }

    async initializeDisplay() {
        if (!this.container) return;

        this.setupUI();
        this.grid = this.container.querySelector('.listings-row');
        this.loadMoreBtn = this.container.querySelector('.masry-load-more');
        
        if (this.state.isFirstLoad) {
            await this.showSkeletonLoading();
            this.state.isFirstLoad = false;
        }
        
        await this.loadMore();
        
        this.loadMoreBtn.addEventListener('click', () => this.loadMore());
    }

    setupUI() {
        this.container.innerHTML = `
            <div class="container">
                <div class="main">
                    <h2>Featured <span class="Services">Services</span> for you</h2>
                </div>
                <div class="listings-row"></div>
                <div class="load-more-container">
                    <button class="masry-load-more">
                        <div class="button-content">
                            <span class="button-text">Load More</span>
                            <div class="button-loader"></div>
                        </div>
                    </button>
                </div>
            </div>
        `;
    }

    async loadMore() {
        if (this.state.isLoading) return;
        
        this.state.isLoading = true;
        this.setLoadingState(true);

        try {
            const remainingItems = this.state.listings.length - this.state.displayedCount;
            
            if (remainingItems <= 0) {
                this.setNoMoreItems();
                return;
            }

            const itemsToLoad = Math.min(this.config.itemsPerBatch, remainingItems);
            const nextItems = this.state.listings.slice(
                this.state.displayedCount,
                this.state.displayedCount + itemsToLoad
            );

            const skeletons = this.grid.querySelectorAll('.loading-container');
            if (skeletons.length) {
                await this.fadeOutSkeletons();
            }

            await this.addNewItems(nextItems);

            this.state.displayedCount += itemsToLoad;
            this.state.currentPage++;
            this.updateLoadMoreButton();

        } finally {
            this.state.isLoading = false;
            this.setLoadingState(false);
        }
    }

    async fadeOutSkeletons() {
        const skeletons = this.grid.querySelectorAll('.loading-container');
        if (!skeletons.length) return;

        skeletons.forEach(skeleton => skeleton.classList.add('fade-out'));
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        skeletons.forEach(skeleton => skeleton.remove());
    }

    async addNewItems(items) {
        const fragment = document.createDocumentFragment();
        
        items.forEach(item => {
            const card = this.createListingCard(item);
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            fragment.appendChild(card);
        });

        this.grid.appendChild(fragment);

        await new Promise(resolve => requestAnimationFrame(() => {
            const cards = this.grid.querySelectorAll('.vl-card[style*="opacity: 0"]');
            cards.forEach((card, index) => {
                setTimeout(() => {
                    card.style.transition = 'all 0.4s ease';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, index * 100);
            });
            setTimeout(resolve, (cards.length * 100) + 400);
        }));
    }

    updateLoadMoreButton() {
        const remainingItems = this.state.listings.length - this.state.displayedCount;
        const progress = (this.state.displayedCount / this.state.listings.length) * 100;

        if (remainingItems <= 0) {
            this.setNoMoreItems();
        } else {
            this.loadMoreBtn.innerHTML = `
                <div class="button-content">
                    <span class="button-text">Load More (${remainingItems} items left)</span>
                    <div class="button-loader"></div>
                </div>
                <div class="progress-bar" style="width: ${progress}%"></div>
            `;
        }
    }

    createListingCard(item) {
        const card = document.createElement('div');
        card.className = 'vl-card';
        
        const detailsUrl = `../pages/listing-details.html?id=${item._id}&source=featured`;
        
        card.innerHTML = `
            <a href="${detailsUrl}" class="vl-card__link" data-listing-id="${item._id}">
                <div class="vl-card__image-wrapper">
                    <img class="vl-card__image" 
                         src="${this.config.defaultImages.placeholder}"
                         data-src="${item.mainImage || this.config.defaultImages.listing}"
                         alt="${item.listingName}"
                         loading="lazy"
                         onerror="this.src='${this.config.defaultImages.listing}'">
                    <div class="vl-card__status-badge ${item.isOpen ? 'is-open' : 'is-closed'}">
                        ${item.isOpen ? 'OPEN' : 'CLOSED'}
                    </div>
                    ${item.categoryId ? `
                        <div class="vl-card__category-badge">
                            ${item.categoryId.categoryName}
                        </div>
                    ` : ''}
                </div>
                <div class="vl-card__body">
                    <h3 class="vl-card__title">${this.truncateText(item.listingName, 18)}</h3>
                    <div class="vl-card__rating">
                        ${this.createRating(item.rating || 0)}
                    </div>
                    <div class="vl-info">
                        ${item.location ? `
                            <div class="vl-info__item">
                                <i class="bi bi-geo-alt"></i>
                                <span>${item.location}</span>
                            </div>
                        ` : ''}
                        ${item.mobile ? `
                            <div class="vl-info__item">
                                <i class="bi bi-phone"></i>
                                <span>${item.mobile}</span>
                            </div>
                        ` : ''}
                        ${item.email ? `
                            <div class="vl-info__item email">
                                <i class="bi bi-envelope"></i>
                                <span>${this.truncateText(item.email, 26)}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </a>
        `;

        const link = card.querySelector('.vl-card__link');
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            sessionStorage.setItem('lastViewedListing', JSON.stringify({
                id: item._id,
                data: item,
                timestamp: Date.now()
            }));

            window.location.href = detailsUrl;
        });
        
        return card;
    }

    createRating(rating) {
        return `
            <div class="vl-rating__stars">
                ${Array(5).fill('')
                    .map((_, index) => `
                        <i class="bi bi-star${index < Math.floor(rating) ? '-fill' : ''}"></i>
                    `).join('')}
            </div>
        `;
    }

    async showSkeletonLoading() {
        const container = document.createElement('div');
        container.className = 'loading-container';
        container.style.opacity = '0';
        
        for (let i = 0; i < this.config.itemsPerBatch; i++) {
            container.innerHTML += this.createSkeletonCard();
        }
        
        this.grid.appendChild(container);

        await new Promise(resolve => requestAnimationFrame(() => {
            container.style.transition = 'opacity 0.3s ease';
            container.style.opacity = '1';
            setTimeout(resolve, 300);
        }));
    }

    createSkeletonCard() {
        return `
            <div class="skeleton-card">
                <div class="vl-card__image-wrapper">
                    <div class="skeleton-pulse"></div>
                    <div class="skeleton-badge status skeleton-pulse"></div>
                    <div class="skeleton-badge category skeleton-pulse"></div>
                </div>
                <div class="skeleton-content">
                    <div class="skeleton-title skeleton-pulse"></div>
                    <div class="skeleton-rating">
                        ${Array(5).fill('<div class="skeleton-star skeleton-pulse"></div>').join('')}
                    </div>
                    <div class="skeleton-info">
                        <div class="skeleton-info-item skeleton-pulse"></div>
                        <div class="skeleton-info-item skeleton-pulse"></div>
                        <div class="skeleton-info-item skeleton-pulse"></div>
                    </div>
                </div>
            </div>
        `;
    }

    setLoadingState(isLoading) {
        if (!this.loadMoreBtn) return;

        const buttonContent = this.loadMoreBtn.querySelector('.button-content');
        const loader = this.loadMoreBtn.querySelector('.button-loader');
        const text = this.loadMoreBtn.querySelector('.button-text');
        
        if (!buttonContent || !loader || !text) return;

        if (isLoading) {
            loader.style.display = 'block';
            text.style.opacity = '0.7';
            this.loadMoreBtn.classList.add('is-loading');
            this.loadMoreBtn.disabled = true;
        } else {
            loader.style.display = 'none';
            text.style.opacity = '1';
            this.loadMoreBtn.classList.remove('is-loading');
            this.loadMoreBtn.disabled = false;
        }
    }

    setNoMoreItems() {
        this.loadMoreBtn.classList.add('no-more');
        this.loadMoreBtn.innerHTML = `
            <div class="button-content">
                <span class="button-text">All Items Loaded</span>
                <i class="fas fa-check-circle"></i>
            </div>
        `;
        this.loadMoreBtn.disabled = true;
    }

    truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }
}

// تأكد من تحميل DOM قبل تهيئة المكون
document.addEventListener('DOMContentLoaded', () => new FeaturedServices());