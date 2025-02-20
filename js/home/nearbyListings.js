class NearbyListings {
    constructor() {
        this.config = {
            api: {
                baseUrl: 'https://virlo.vercel.app/listing/',
                batchSizes: {
                    initial: 8,    // العدد الأولي للتحميل
                    more: 4        // عدد العناصر لكل تحميل إضافي
                },
                maxDuplicateAttempts: 15  // زيادة عدد المحاولات للتأكد من عدم وجود بيانات جديدة
            },
            defaultImages: {
                listing: '../images/defaults/default-listing.png',
                placeholder: `data:image/svg+xml;base64,${btoa('<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f8f9fa"/><text x="50%" y="50%" font-family="Arial" font-size="14" fill="#999" text-anchor="middle">No Image</text></svg>')}`
            }
        };

        this.state = {
            currentLastValue: 1,
            loadedItems: new Set(),
            loading: false,
            hasMore: true,
            remainingItems: [],
            loadMoreAttempts: 0,    // عداد محاولات Load More
            maxLoadMoreAttempts: 5,  // الحد الأقصى للمحاولات
            consecutiveEmptyResponses: 0,  // عداد للردود الفارغة المتتالية
            maxEmptyResponses: 5          // الحد الأقصى للردود الفارغة المتتالية
        };

        this.init();
    }

    async init() {
        this.container = document.querySelector('.masry-home-listings');
        if (!this.container) {
            console.error('Container not found');
            return;
        }

        await this.setupUI();
        await this.loadInitialContent();
    }

    async setupUI() {
        this.container.innerHTML = `
            <div class="container">
                <div class="main">
                    <h2>Featured <span class="Services">Services</span> for you</h2>
                </div>
                <div class="listings-row"></div>
                <button class="masry-load-more">
                    <span class="button-text">Load More</span>
                    <span class="button-loader"></span>
                </button>
            </div>
        `;

        this.grid = this.container.querySelector('.listings-row');
        this.loadMoreBtn = this.container.querySelector('.masry-load-more');
        this.loadMoreBtn?.addEventListener('click', () => this.handleLoadMore());
    }

    async loadInitialContent() {
        console.log('🚀 Loading initial content...');
        this.showSkeletons(this.config.api.batchSizes.initial);
        const items = await this.fetchBatch(this.config.api.batchSizes.initial);
        this.removeSkeletons();
        
        if (items.length > 0) {
            await this.renderItems(items, true);
        }
    }

    async fetchBatch(count) {
        if (!this.state.hasMore || this.state.loading) return [];

        this.state.loading = true;
        let items = [...this.state.remainingItems]; // استخدام العناصر المتبقية أولاً
        this.state.remainingItems = [];
        let noNewItemsCount = 0;  // عداد للمحاولات التي لم تجلب عناصر جديدة

        try {
            while (items.length < count && this.state.hasMore) {
                console.log(`📡 Fetching page ${this.state.currentLastValue}`);
                
                const response = await fetch(`${this.config.api.baseUrl}?lastValue=${this.state.currentLastValue}`);
                const data = await response.json();

                if (!data.listings?.length) {
                    this.state.consecutiveEmptyResponses++;
                    console.log(`❌ Empty response (${this.state.consecutiveEmptyResponses}/${this.state.maxEmptyResponses})`);
                    
                    if (this.state.consecutiveEmptyResponses >= this.state.maxEmptyResponses) {
                        console.log('🛑 Maximum empty responses reached');
                        this.state.hasMore = false;
                        this.updateLoadMoreButton(false, true);
                        break;
                    }
                    
                    this.state.currentLastValue++;
                    continue;
                }

                this.state.consecutiveEmptyResponses = 0; // إعادة تعيين العداد عند وجود بيانات
                const newItems = data.listings.filter(item => !this.state.loadedItems.has(item._id));
                
                if (newItems.length === 0) {
                    noNewItemsCount++;
                    console.log(`⚠️ No new items (attempt ${noNewItemsCount}/${this.config.api.maxDuplicateAttempts})`);
                    
                    if (noNewItemsCount >= this.config.api.maxDuplicateAttempts) {
                        console.log('🛑 Maximum duplicate attempts reached');
                        this.state.hasMore = false;
                        this.updateLoadMoreButton(false, true);
                        break;
                    }
                    
                    this.state.currentLastValue++;
                    continue;
                }

                noNewItemsCount = 0; // إعادة تعيين العداد عند وجود عناصر جديدة
                items.push(...newItems);
                this.state.currentLastValue++;

                if (items.length >= count) {
                    console.log(`✅ Got enough items: ${items.length}`);
                    break;
                }
            }

        } catch (error) {
            console.error('Error fetching items:', error);
        } finally {
            this.state.loading = false;
        }

        // تخزين العناصر الإضافية
        if (items.length > count) {
            this.state.remainingItems = items.slice(count);
            items = items.slice(0, count);
        }

        console.log(`✅ Batch complete: ${items.length} items collected`);
        return items;
    }

    async handleLoadMore() {
        if (this.state.loading || !this.state.hasMore) return;
        
        this.updateLoadMoreButton(true);
        this.showSkeletons(this.config.api.batchSizes.more);
        
        const items = await this.fetchBatch(this.config.api.batchSizes.more);
        this.removeSkeletons();
        
        if (items.length > 0) {
            await this.renderItems(items);
        }
        
        this.updateLoadMoreButton(false, !this.state.hasMore);
    }

    async renderItems(items) {
        console.log('Items to render:', items);
        
        // تأكد من عدم تكرار العناصر
        const uniqueItems = items.filter(item => !this.state.loadedItems.has(item._id));
        
        if (uniqueItems.length === 0) {
            console.log('No new items to render');
            return;
        }

        const fragment = document.createDocumentFragment();
        uniqueItems.forEach(item => {
            const card = this.createCard(item);
            fragment.appendChild(card);
            this.state.loadedItems.add(item._id);
        });

        this.grid.appendChild(fragment);
        
        // تحديث حالة الزر
        this.updateLoadMoreButton(false, !this.state.hasMore && this.state.remainingItems.length === 0);
    }

    createCard(item) {
        const truncateText = (text, limit) => {
            return text.length > limit ? text.substring(0, limit) + '...' : text;
        };

        const card = document.createElement('div');
        card.className = 'vl-card';
        const detailsUrl = `../pages/listing-details.html?id=${item._id}`;
        
        card.innerHTML = `
            <a href="${detailsUrl}" class="vl-card__link">
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
                    <h3 class="vl-card__title">${truncateText(item.listingName, 18)}</h3>
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
                                <span>${truncateText(item.email, 26)}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </a>
        `;

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

    createSkeletonCard() {
        return `
            <div class="skeleton-card">
                <div class="vl-card__image-wrapper">
                    <div class="skeleton-pulse"></div>
                    <div class="skeleton-badge skeleton-pulse"></div>
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

    showSkeletons(count) {
        const skeletonsContainer = document.createElement('div');
        skeletonsContainer.className = 'loading-container';
        skeletonsContainer.innerHTML = Array(count)
            .fill(this.createSkeletonCard())
            .join('');
        
        if (this.state.currentLastValue === 1) {
            this.grid.innerHTML = '';
        }
        
        this.grid.appendChild(skeletonsContainer);
    }

    removeSkeletons() {
        const skeletons = this.grid.querySelectorAll('.loading-container');
        skeletons.forEach(skeleton => {
            skeleton.classList.add('fade-out');
            setTimeout(() => skeleton.remove(), 300);
        });
    }

    updateLoadMoreButton(isLoading, noMoreItems = false) {
        if (!this.loadMoreBtn) return;

        const buttonText = this.loadMoreBtn.querySelector('.button-text');
        const buttonLoader = this.loadMoreBtn.querySelector('.button-loader');

        if (noMoreItems) {
            this.loadMoreBtn.disabled = true;
            this.loadMoreBtn.classList.add('no-more');
            buttonText.textContent = 'No More Listings';
            buttonLoader.style.display = 'none';
        } else if (isLoading) {
            this.loadMoreBtn.disabled = true;
            buttonText.textContent = 'Loading...';
            buttonLoader.style.display = 'block';
        } else {
            this.loadMoreBtn.disabled = false;
            this.loadMoreBtn.classList.remove('no-more');
            buttonText.textContent = 'Load More';
            buttonLoader.style.display = 'none';
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => new NearbyListings());
