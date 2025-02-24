class CategorySwiper {
    constructor() {
        this.config = {
            api: {
                baseUrl: 'https://virlo.vercel.app',
                endpoints: {
                    categories: '/categories',
                    listings: '/listing'
                }
            },
            cache: {
                key: 'categories_data',
                duration: 30 * 60 * 1000
            },
            defaultIcons: {
                'Accountant': 'fas fa-calculator',
                'Bakery Shop': 'fas fa-bread-slice',
                'Dentist': 'fas fa-tooth',
                'Restaurant': 'fas fa-utensils',
                'Insurance': 'fas fa-shield-alt',
                'Home Repairs': 'fas fa-tools',
                'Immigration Lawyer': 'fas fa-gavel',
                'Family Doctor': 'fas fa-user-md',
                'Teller': 'fas fa-cash-register',
                'Present': 'fas fa-gift',
                'Supermarket': 'fas fa-shopping-cart',
                'Dessert Shop': 'fas fa-ice-cream',
                'Translation': 'fas fa-language',
                'Cafe': 'fas fa-coffee',
                'Shop': 'fas fa-store',
                'Hotel': 'fas fa-hotel',
                'Service': 'fas fa-concierge-bell',
                'default': 'fas fa-store'
            }
        };

        this.state = {
            categories: [],
            categoryStats: new Map(),
            activeListings: new Map(),
            isLoading: false,
            error: null
        };

        this.container = document.querySelector('.masry-cat-swiper');
        this.init();
    }

    async init() {
        try {
            this.showLoadingState();
            
            await Promise.all([
                this.fetchCategories(),
                this.fetchCategoryStats()
            ]);

            window.categoryData = {
                activeListings: this.state.activeListings,
                categoryStats: this.state.categoryStats,
                categories: this.state.categories
            };

            this.renderSwiper();
            
            const event = new CustomEvent('categorySwiperReady', {
                detail: window.categoryData,
                bubbles: true,
                cancelable: true
            });
            window.dispatchEvent(event);
            document.dispatchEvent(event);
            
        } catch (error) {
            this.showError('Failed to load categories');
        }
    }

    updateLoadingState(loadingStates) {
        const skeletonCards = document.querySelectorAll('.masry-category-card.skeleton');
        
        loadingStates.forEach((state, categoryId) => {
            const card = document.querySelector(`[data-category-id="${categoryId}"]`);
            if (card && state.loaded) {
                card.classList.remove('skeleton');
                card.querySelector('.skeleton-loader').style.display = 'none';
                card.querySelector('.masry-category-card__count').textContent = state.count;
            }
        });
    }

    async fetchCategories() {
        const response = await fetch(`${this.config.api.baseUrl}/categories`);
        if (!response.ok) throw new Error('Failed to fetch categories');
        
        const categories = await response.json();
        
        this.state.categories = categories.map(category => {
            const icon = this.getIconClass(category);
            return {
                ...category,
                icon
            };
        });
        return this.state.categories;
    }

    async fetchCategoryStats() {
        try {
            const allListings = new Map();
            let lastValue = 1;
            let previousCount = 0;
            let currentCount = 0;
            let attempts = 0;

            while (true) {
                const response = await fetch(`${this.config.api.baseUrl}/listing/?lastValue=${lastValue}`);
                
                if (!response.ok) {
                    break;
                }

                const data = await response.json();
                if (!data.listings || !data.listings.length) {
                    break;
                }

                data.listings.forEach(listing => {
                    if (!allListings.has(listing._id) && listing.isActive === true) {
                        allListings.set(listing._id, listing);
                        currentCount++;
                        
                        if (listing.categoryId) {
                            const categoryId = listing.categoryId._id;
                            const currentCategoryCount = this.state.categoryStats.get(categoryId) || 0;
                            this.state.categoryStats.set(categoryId, currentCategoryCount + 1);
                        }
                    }
                });

                if (currentCount === previousCount) {
                    attempts++;
                    if (attempts >= 2) {
                        break;
                    }
                } else {
                    previousCount = currentCount;
                    attempts = 0;
                }

                lastValue += 5;
            }

            this.state.activeListings = allListings;

        } catch (error) {
            throw error;
        }
    }

    getIconClass(category) {
        if (category.iconTwo && typeof category.iconTwo === 'string' && category.iconTwo.trim()) {
            return category.iconTwo;
        }

        const defaultIcon = this.config.defaultIcons[category.categoryName];
        if (defaultIcon) {
            return defaultIcon;
        }

        return 'fas fa-store';
    }

    renderSwiper() {
        if (!this.container) return;

        const fragment = document.createDocumentFragment();
        const container = document.createElement('div');
        container.className = 'container';

        container.appendChild(this.createHeader());

        const swiperContainer = this.createSwiperContainer();
        
        const wrapper = swiperContainer.querySelector('.swiper-wrapper');
        this.state.categories.forEach(category => {
            wrapper.appendChild(this.createCategoryCardElement(category));
        });

        container.appendChild(swiperContainer);
        fragment.appendChild(container);
        
        this.container.innerHTML = '';
        this.container.appendChild(fragment);

        this.initSwiperJS();

        this.initLazyLoading();
    }

    createHeader() {
        const header = document.createElement('div');
        header.className = 'head';
        header.innerHTML = `
            <h2>Explore by <span class="color">Category</span></h2>
            <p>Discover local services and businesses in your area</p>
        `;
        return header;
    }

    createSwiperContainer() {
        const div = document.createElement('div');
        div.className = 'swiper mySwiper';
        div.innerHTML = `
            <div class="swiper-wrapper"></div>
            <div class="swiper-pagination"></div>
            <div class="swiper-button-next"></div>
            <div class="swiper-button-prev"></div>
        `;
        return div;
    }

    createCategoryCardElement(category) {
        const count = this.state.categoryStats.get(category._id) || 0;
        const icon = this.getIconClass(category);
        
        const slide = document.createElement('div');
        slide.className = 'swiper-slide';
        slide.innerHTML = `
            <a href="../pages/allListings.html?category=${category._id}" 
               class="masry-category-card"
               data-category-id="${category._id}">
                <div class="masry-category-card__content">
                    <div class="masry-category-card__top">
                        <div class="masry-category-card__icon-wrapper">
                            <i class="${icon}"></i>
                        </div>
                        <h3 class="masry-category-card__title">${category.categoryName}</h3>
                    </div>
                    <div class="masry-category-card__bottom">
                        <div class="masry-category-card__stats">
                            <span class="masry-category-card__count">${count}</span>
                            <span class="masry-category-card__label">Active Listings</span>
                        </div>
                        <div class="masry-category-card__action">
                            <span class="masry-category-card__explore">
                                <span>Explore</span>
                                <i class="bi bi-arrow-right"></i>
                            </span>
                        </div>
                    </div>
                </div>
            </a>
        `;
        return slide;
    }

    initLazyLoading() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const card = entry.target;
                    const icon = card.querySelector('i[data-src]');
                    if (icon) {
                        icon.className = icon.dataset.src;
                        icon.removeAttribute('data-src');
                    }
                    observer.unobserve(card);
                }
            });
        }, {
            root: null,
            rootMargin: '50px',
            threshold: 0.1
        });

        this.container.querySelectorAll('.masry-category-card').forEach(card => {
            observer.observe(card);
        });
    }

    showLoadingState() {
        if (!this.container) return;
        
        const getSkeletonCount = () => {
            const width = window.innerWidth;
            if (width >= 1024) return 4;
            if (width >= 768) return 3;
            if (width >= 640) return 2;
            return 1;
        };
        
        this.container.innerHTML = `
            <div class="container">
                <div class="head">
                    <h2>Explore by <span class="color">Category</span></h2>
                    <p>Loading categories...</p>
                </div>
                <div class="swiper mySwiper">
                    <div class="swiper-wrapper">
                        ${Array(getSkeletonCount()).fill().map(() => `
                            <div class="swiper-slide">
                                <div class="masry-category-card skeleton">
                                    <div class="skeleton-loader">
                                        <div class="skeleton-loader__spinner"></div>
                                        <div class="skeleton-loader__text">Loading category...</div>
                                    </div>
                                    <div class="masry-category-card__content">
                                        <div class="masry-category-card__top">
                                            <div class="masry-category-card__icon-wrapper skeleton-icon"></div>
                                            <div class="masry-category-card__title skeleton-text"></div>
                                        </div>
                                        <div class="masry-category-card__bottom">
                                            <div class="masry-category-card__stats">
                                                <div class="skeleton-text skeleton-count"></div>
                                                <div class="skeleton-text skeleton-label"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="swiper-pagination"></div>
                    <div class="swiper-button-next"></div>
                    <div class="swiper-button-prev"></div>
                </div>
            </div>
        `;
        
        this.initSkeletonSwiper();
    }

    initSkeletonSwiper() {
        new Swiper(".mySwiper", {
            slidesPerView: 1,
            spaceBetween: 10,
            pagination: {
                el: ".swiper-pagination",
                clickable: true,
            },
            navigation: {
                nextEl: ".swiper-button-next",
                prevEl: ".swiper-button-prev",
            },
            breakpoints: {
                640: {
                    slidesPerView: 2,
                    spaceBetween: 20,
                },
                768: {
                    slidesPerView: 3,
                    spaceBetween: 30,
                },
                1024: {
                    slidesPerView: 4,
                    spaceBetween: 30,
                },
            },
        });
    }

    hideLoadingState() {
        const skeleton = this.container.querySelector('.swiper-skeleton');
        if (skeleton) {
            skeleton.remove();
        }
    }

    initSwiperJS() {
        new Swiper(".mySwiper", {
            slidesPerView: 1,
            spaceBetween: 10,
            pagination: {
                el: ".swiper-pagination",
                clickable: true,
            },
            navigation: {
                nextEl: ".swiper-button-next",
                prevEl: ".swiper-button-prev",
            },
            breakpoints: {
                640: {
                    slidesPerView: 2,
                    spaceBetween: 20,
                },
                768: {
                    slidesPerView: 3,
                    spaceBetween: 30,
                },
                1024: {
                    slidesPerView: 4,
                    spaceBetween: 30,
                },
            },
        });
    }

    showError(message) {
        const errorHTML = `
            <div class="masry-error-message">
                <div class="masry-error-message__icon">
                    <i class="fas fa-exclamation-circle"></i>
                </div>
                <div class="masry-error-message__content">
                    <h3>Oops! Something went wrong</h3>
                    <p>${message}</p>
                    <button class="masry-error-message__retry" onclick="window.location.reload()">
                        <i class="fas fa-redo"></i> Try Again
                    </button>
                </div>
            </div>
        `;

        if (this.container) {
            this.container.innerHTML = errorHTML;
        }
    }

    handleError(error) {
        const errorMessages = {
            'Failed to fetch': 'Network connection error. Please check your internet connection.',
            'Failed to fetch data': 'Unable to load categories. Please try again later.',
            'Invalid data format': 'The data received is invalid. Please contact support.'
        };

        const message = errorMessages[error.message] || 'An unexpected error occurred.';
        this.showError(message);
        this.state.error = error;
    }

    cacheManager = {
        set: (key, data) => {
            try {
                const cacheItem = {
                    data,
                    timestamp: Date.now(),
                    version: '1.0'
                };
                localStorage.setItem(key, JSON.stringify(cacheItem));
                return true;
            } catch (error) {
                this.clearExpiredCache();
                return false;
            }
        },

        get: (key) => {
            try {
                const item = localStorage.getItem(key);
                if (!item) return null;

                const { data, timestamp, version } = JSON.parse(item);
                
                if (version !== '1.0') {
                    this.cacheManager.clear(key);
                    return null;
                }

                if (Date.now() - timestamp > this.config.cache.duration) {
                    this.cacheManager.clear(key);
                    return null;
                }

                return data;
            } catch {
                return null;
            }
        },

        clear: (key) => {
            try {
                localStorage.removeItem(key);
            } catch (error) {
            }
        },

        clearExpiredCache: () => {
            try {
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('categories_')) {
                        const item = localStorage.getItem(key);
                        if (item) {
                            const { timestamp } = JSON.parse(item);
                            if (Date.now() - timestamp > this.config.cache.duration) {
                                localStorage.removeItem(key);
                            }
                        }
                    }
                });
            } catch (error) {
            }
        }
    };
}

document.addEventListener('DOMContentLoaded', () => new CategorySwiper());