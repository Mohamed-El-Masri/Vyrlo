class NearbyListings {
    constructor() {
        this.container = document.querySelector('.masry-home-listings');
        if (!this.container) {
            console.error('Listings container not found');
            return;
        }

        // تكوين المسارات الصحيحة للصور
        this.defaultImages = {
            listing: '../images/defaults/default-listing.png',
            category: '../images/defaults/default-category.png',
            error: '../images/defaults/default-error.png',
            fallback: `data:image/svg+xml;base64,${btoa(`
                <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
                    <rect width="100%" height="100%" fill="#f8f9fa"/>
                    <text x="50%" y="50%" font-family="Arial" font-size="14" fill="#999" text-anchor="middle">No Image</text>
                </svg>
            `)}`
        };
        

        // إعدادات التصفح
        this.page = 1;
        this.limit = 8;
        this.loading = false;
        this.hasMore = true;
        this.listingsCache = new Map();
        this.failedImages = new Set();

        // تحديث قيم التحميل
        this.lastValue = 5; // القيمة الأولية لتحميل 8 عناصر
        this.itemsPerLoad = 4; // عدد العناصر لكل تحميل تالي
        this.totalItems = 0;
        this.isFirstLoad = true;
        this.isLoadingMore = false;
        this.lastValue = 5; // للتحميل الأول (8 عناصر)

        this.init();
    }

    preloadDefaultImages() {
        Object.values(this.defaultImages).forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }

    handleImageError(img, type = 'listing') {
        // تسجيل الصورة الفاشلة
        this.failedImages.add(img.src);
        
        // محاولة استخدام الصورة الافتراضية
        if (!img.dataset.fallbackAttempted) {
            img.dataset.fallbackAttempted = 'true';
            img.src = this.defaultImages[type];
        } else {
            // إذا فشلت الصورة الافتراضية، استخدم الصورة الاحتياطية SVG
            img.src = this.defaultImages.fallback;
            img.style.padding = '20px';
            img.style.background = '#f8f9fa';
        }
        
        img.classList.add('placeholder-image');
    }

    async init() {
        try {
            this.render();
            await this.loadListings();
            
            // إضافة مراقب التمرير للتحميل التلقائي
            this.setupInfiniteScroll();
        } catch (error) {
            console.error('Initialization error:', error);
            this.showError('Failed to initialize listings');
        }
    }

    render() {
        this.container.innerHTML = `
            <div class="container">
                <div class="row justify-content-center">
                    <div class="col-12 mb-4">
                        <div class="main">
                            <h2 class="text-center">
                                Featured 
                                <span class="Services">Services</span> 
                                for you
                            </h2>
                        </div>
                    </div>
                </div>
                <div class="row listings-row">
                    <!-- Listings will be loaded here -->
                </div>
                <div class="row mt-4 justify-content-center">
                    <div class="col-12 text-center">
                        <button class="masry-load-more">
                            <span class="button-text">Load More</span>
                            <div class="button-loader"></div>
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.gridContainer = this.container.querySelector('.listings-row');
        this.loadMoreBtn = this.container.querySelector('.masry-load-more');
        this.loadMoreBtn.addEventListener('click', () => this.loadMore());

        // عرض skeletons للتحميل الأولي
        this.showLoadingSkeletons(8);
    }

    setupInfiniteScroll() {
        const options = {
            root: null,
            rootMargin: '100px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.loading && this.hasMore) {
                    this.loadMore();
                }
            });
        }, options);

        observer.observe(this.loadMoreBtn);
    }

    createLoadingSkeletons(count) {
        return Array(count).fill().map(() => `
            <div class="col-md-6 col-lg-3">
                <div class="vl-card skeleton-card">
                    <div class="vl-card__image-wrapper skeleton">
                        <div class="skeleton-badges">
                            <div class="skeleton-badge"></div>
                        </div>
                    </div>
                    <div class="vl-card__body">
                        <div class="skeleton-content">
                            <div class="skeleton-title"></div>
                            <div class="skeleton-rating"></div>
                            <div class="skeleton-info">
                                <div class="skeleton-info-item"></div>
                                <div class="skeleton-info-item"></div>
                                <div class="skeleton-info-item"></div>
                            </div>
                        </div>
                        <div class="skeleton-button"></div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    showLoadingSkeletons(count) {
        if (this.isFirstLoad) {
            this.gridContainer.innerHTML = this.createLoadingSkeletons(count);
        } else {
            // إضافة skeletons للتحميل الإضافي
            const loadingContainer = document.createElement('div');
            loadingContainer.className = 'loading-container';
            loadingContainer.innerHTML = this.createLoadingSkeletons(4);
            this.gridContainer.appendChild(loadingContainer);
        }
    }

    async loadListings() {
        if (this.loading || !this.hasMore) return;

        try {
            this.loading = true;
            this.updateLoadMoreButton(true);

            // عرض skeletons للتحميل الإضافي
            if (!this.isFirstLoad) {
                this.showLoadingSkeletons(4);
            }

            const url = new URL('https://virlo.vercel.app/listing/');
            url.searchParams.append('lastValue', this.lastValue);
            

            const response = await fetch(url);
            const data = await response.json();

            // إزالة skeletons
            if (this.isFirstLoad) {
                this.gridContainer.innerHTML = '';
            } else {
                const loadingContainer = this.gridContainer.querySelector('.loading-container');
                if (loadingContainer) {
                    loadingContainer.remove();
                }
            }

            // تحديث القيم
            if (this.isFirstLoad) {
                this.lastValue = 9;
                this.isFirstLoad = false;
            } else {
                this.lastValue += 4;
            }

            // التحقق من وجود المزيد من العناصر
            this.hasMore = data.listings.length === (this.isFirstLoad ? 8 : 4);

            // عرض النتائج
            this.renderListings(data.listings);

        } catch (error) {
            console.error('Error loading listings:', error);
            this.showError('Failed to load listings. Please try again later.');
            // إزالة skeletons في حالة الخطأ
            if (!this.isFirstLoad) {
                const loadingContainer = this.gridContainer.querySelector('.loading-container');
                if (loadingContainer) {
                    loadingContainer.remove();
                }
            }
        } finally {
            this.loading = false;
            this.updateLoadMoreButton(false);
        }
    }

    async loadMore() {
        if (this.loading || !this.hasMore) return;

        try {
            this.loading = true;
            this.updateLoadMoreButton(true);

            // جلب البيانات
            const url = new URL('https://virlo.vercel.app/listing/');
            url.searchParams.append('lastValue', this.lastValue);
            

            // إضافة skeletons للتحميل
            const loadingContainer = document.createElement('div');
            loadingContainer.className = 'listings-row loading-container';
            loadingContainer.innerHTML = this.createLoadingSkeletons(4);
            this.gridContainer.appendChild(loadingContainer);

            const response = await fetch(url);
            const data = await response.json();

            // إزالة skeletons
            loadingContainer.remove();

            if (data.listings && data.listings.length > 0) {
                // عرض القوائم الجديدة
                this.renderListings(data.listings, false);
                
                // تحديث lastValue للتحميل التالي
                this.lastValue = this.getNextLastValue();
                
                // التحقق من وجود المزيد من العناصر
                this.hasMore = data.listings.length >= 4;
            } else {
                this.hasMore = false;
            }

        } catch (error) {
            console.error('Error loading more listings:', error);
            this.showError('Failed to load more listings');
        } finally {
            this.loading = false;
            this.updateLoadMoreButton(false, !this.hasMore);
        }
    }

    getNextLastValue() {
        // إذا كان التحميل الأول (8 عناصر)
        if (this.isFirstLoad) {
            this.isFirstLoad = false;
            return 9; // القيمة التالية بعد تحميل أول 8 عناصر
        }
        // للتحميلات التالية (4 عناصر في كل مرة)
        return this.lastValue + 4;
    }

    renderListings(listings, isFirstLoad = false) {
        if (isFirstLoad) {
            this.gridContainer.innerHTML = '';
        }

        const fragment = document.createDocumentFragment();
        
        listings.forEach(listing => {
            const card = this.createListingCard(listing);
            const div = document.createElement('div');
            div.className = 'col-md-6 col-lg-3 mb-4';
            div.innerHTML = card;
            fragment.appendChild(div);
        });

        this.gridContainer.appendChild(fragment);
        this.lazyLoadImages();

        // تحديث حالة زر التحميل
        if (!this.hasMore) {
            this.updateLoadMoreButton(false, true);
        }
    }

    lazyLoadImages() {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (!this.failedImages.has(img.dataset.src)) {
                        img.addEventListener('image-error', () => this.handleImageError(img), { once: true });
                        img.src = img.dataset.src;
                    } else {
                        this.handleImageError(img);
                    }
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.1
        });

        document.querySelectorAll('.vl-card__image[loading="lazy"]').forEach(img => {
            imageObserver.observe(img);
        });
    }

    createListingCard(listing) {
        const detailsUrl = `../pages/listing-details.html?id=${listing._id}`;
        const status = this.checkIfOpen(listing.openingTimes);
        
        return `
        <div class="vl-card" data-id="${listing._id}">
            <div class="vl-card__image-wrapper">
                <a href="${detailsUrl}" class="vl-card__image-link">
                    <img 
                        src="${this.defaultImages.fallback}"
                        data-src="${listing.mainImage || this.defaultImages.listing}"
                        alt="${listing.listingName}"
                        class="vl-card__image"
                        loading="lazy"
                        onerror="this.dispatchEvent(new Event('image-error'))"
                    >
                </a>
                <div class="vl-card__status-badge ${status.isOpen ? 'is-open' : 'is-closed'}">
                    ${status.message}
                </div>
                <div class="vl-card__category-badge">
                    ${listing.categoryId?.categoryName || 'Uncategorized'}
                </div>
            </div>
            
            <div class="vl-card__body">
                <div class="vl-card__content">
                    <a href="${detailsUrl}" class="vl-card__title-link">
                        <h3 class="vl-card__title">${listing.listingName}</h3>
                    </a>
                    
                    ${this.createRatingSection(listing)}
                    ${this.createInfoSection(listing)}
                </div>
                
                <div class="vl-card__footer">
                    <a href="${detailsUrl}" class="vl-btn vl-btn--primary">
                        View Details
                    </a>
                </div>
            </div>
        </div>`;
    }

    createRatingSection(listing) {
        const rating = listing.rating || 0;
        const reviewsCount = listing.reviewsCount || 0;
        
        return `
            <div class="vl-rating" title="${rating} out of 5">
                <div class="vl-rating__stars">
                    ${this.generateStars(rating)}
                </div>
                <span class="vl-rating__count">
                    ${reviewsCount} ${reviewsCount === 1 ? 'Review' : 'Reviews'}
                </span>
            </div>
        `;
    }

    createInfoSection(listing) {
        return `
            <div class="vl-info">
                ${listing.location ? `
                    <div class="vl-info__item" title="${listing.location}">
                        <i class="bi bi-geo-alt"></i>
                        <span>${listing.location}</span>
                    </div>
                ` : ''}
                
                ${listing.phone ? `
                    <div class="vl-info__item">
                        <i class="bi bi-telephone"></i>
                        <a href="tel:${listing.phone}" class="vl-info__phone">
                            ${listing.phone}
                        </a>
                    </div>
                ` : ''}
                
                ${listing.email ? `
                    <div class="vl-info__item">
                        <i class="bi bi-envelope"></i>
                        <a href="mailto:${listing.email}" class="vl-info__email">
                            ${listing.email}
                        </a>
                    </div>
                ` : ''}
            </div>
        `;
    }

    generateStars(rating) {
        return Array(5).fill()
            .map((_, index) => {
                const starClass = index < Math.floor(rating) ? 'bi-star-fill' : 'bi-star';
                return `<i class="bi ${starClass}"></i>`;
            })
            .join('');
    }

    checkIfOpen(openingTimes) {
        if (!openingTimes) return { isOpen: false, message: 'CLOSED' };

        const now = new Date();
        const day = now.toLocaleDateString('en-US', { weekday: 'long' });
        const currentTime = this.getCurrentTime();
        
        const todaySchedule = openingTimes[day];
        
        // مغلق اليوم
        if (!todaySchedule || todaySchedule.status === 'close') {
            return { isOpen: false, message: 'CLOSED' };
        }

        const currentMinutes = this.timeToMinutes(currentTime);
        const openMinutes = this.timeToMinutes(todaySchedule.from);
        const closeMinutes = this.timeToMinutes(todaySchedule.to);

        const isOpen = currentMinutes >= openMinutes && currentMinutes <= closeMinutes;

        return {
            isOpen: isOpen,
            message: isOpen ? 'OPEN' : 'CLOSED'
        };
    }

    getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: false 
        });
    }

    timeToMinutes(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    formatTime(timeStr) {
        const [hours, minutes] = timeStr.split(':');
        const time = new Date();
        time.setHours(Number(hours));
        time.setMinutes(Number(minutes));
        return time.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
        });
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger text-center';
        errorDiv.innerHTML = `
            <img src="${this.defaultImages.error}" alt="Error" class="error-icon">
            <p>${message}</p>
        `;
        this.gridContainer.insertAdjacentElement('beforebegin', errorDiv);
        
        setTimeout(() => errorDiv.remove(), 5000);
    }

    updateLoadMoreButton(isLoading, hideCompletely = false) {
        const btn = this.loadMoreBtn;
        const buttonText = btn.querySelector('.button-text');
        const buttonLoader = btn.querySelector('.button-loader');

        if (hideCompletely) {
            buttonText.textContent = 'No More Listings';
            btn.disabled = true;
            btn.classList.add('no-more');
            buttonLoader.style.display = 'none';
        } else if (isLoading) {
            buttonText.textContent = 'Loading...';
            btn.disabled = true;
            buttonLoader.style.display = 'block';
        } else {
            buttonText.textContent = 'Load More';
            btn.disabled = false;
            buttonLoader.style.display = 'none';
            btn.classList.remove('no-more');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new NearbyListings();
});