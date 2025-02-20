class CategorySwiper {
    constructor() {
        this.config = {
            api: {
                baseUrl: 'https://virlo.vercel.app/listing',
                categoriesUrl: 'https://virlo.vercel.app/categories',
                maxAttempts: 11, // عدد محاولات جلب البيانات
                lastValue: 1 // القيمة الأولية لـ lastValue
            }
        };
        this.container = document.querySelector('.masry-cat-swiper');
        this.categories = new Map();
        this.attempts = 0;
        this.init();
    }

    async init() {
        try {
            this.showSkeletonLoading();
            await this.fetchAllListings();
            const categoriesArray = this.prepareCategoriesArray();
            
            if (categoriesArray.length > 0) {
                this.hideSkeletonLoading();
                this.renderSwiper(categoriesArray);
                this.initSwiperJS();
            } else {
                this.container.style.display = 'none';
            }
        } catch (error) {
            console.error('Error initializing category swiper:', error);
            this.hideSkeletonLoading();
            this.container.style.display = 'none';
        }
    }

    showSkeletonLoading() {
        this.container.innerHTML = `
            <div class="container">
                <div class="head">
                    <h2>Explore by <span class="color">Category</span></h2>
                    <p>Loading categories...</p>
                </div>
                <div class="swiper-skeleton">
                    ${Array(4).fill().map(() => `
                        <div class="category-skeleton">
                            <div class="icon-skeleton"></div>
                            <div class="title-skeleton"></div>
                            <div class="count-skeleton"></div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    hideSkeletonLoading() {
        const skeleton = this.container.querySelector('.swiper-skeleton');
        if (skeleton) {
            skeleton.remove();
        }
    }

    async fetchAllListings() {
        let hasMore = true;
        let lastValue = this.config.api.lastValue;

        while (hasMore && this.attempts < this.config.api.maxAttempts) {
            try {
                console.log(`Fetching listings attempt ${this.attempts + 1}, lastValue: ${lastValue}`);
                const response = await fetch(`${this.config.api.baseUrl}?lastValue=${lastValue}`);
                const data = await response.json();

                if (!data.listings || data.listings.length === 0) {
                    hasMore = false;
                    continue;
                }

                // تجميع الفئات وعدد العناصر
                data.listings.forEach(listing => {
                    if (listing?.categoryId && listing.categoryId._id) {
                        const category = listing.categoryId;
                        if (!this.categories.has(category._id)) {
                            this.categories.set(category._id, {
                                _id: category._id,
                                categoryName: category.categoryName,
                                iconTwo: category.iconTwo,
                                count: 1
                            });
                        } else {
                            const existing = this.categories.get(category._id);
                            existing.count++;
                        }
                    }
                });

                lastValue++;
                this.attempts++;

            } catch (error) {
                console.error('Error fetching listings:', error);
                hasMore = false;
            }
        }
    }

    prepareCategoriesArray() {
        return Array.from(this.categories.values())
            .sort((a, b) => b.count - a.count);
    }

    getIconForCategory(category) {
        // 1. Check iconTwo from API
        if (category.iconTwo && category.iconTwo.trim()) {
            return `bi bi-${category.iconTwo}`;
        }

        // 2. Default icon mappings
        const defaultIcons = {
            'Restaurants': 'restaurant',
            'Cafes': 'cup-hot',
            'Hotels': 'building',
            'Shopping': 'shop-window',
            'Health': 'heart-pulse',
            'Beauty': 'gem',
            'Education': 'book',
            'Entertainment': 'controller',
            'Services': 'tools',
            'Automotive': 'car-front',
            'Real Estate': 'house-door',
            'Food': 'egg-fried',
            'Sports': 'trophy',
            'Technology': 'laptop',
            'Art': 'palette',
            'Music': 'music-note',
            'Fashion': 'bag',
            'Travel': 'airplane',
            'Pets': 'pet',
            'Finance': 'cash-coin',
            'default': 'grid'
        };

        // 3. Return mapped icon or default
        return `bi bi-${defaultIcons[category.categoryName] || defaultIcons.default}`;
    }

    renderSwiper(categories) {
        this.container.innerHTML = `
            <div class="container">
                <div class="head">
                    <h2>Explore by <span class="color">Category</span></h2>
                    <p>Discover local services and businesses in your area</p>
                </div>
                <div class="swiper mySwiper">
                    <div class="swiper-wrapper">
                        ${categories.map(category => this.createCategoryCard(category)).join('')}
                    </div>
                    <div class="swiper-pagination"></div>
                    <div class="swiper-button-next"></div>
                    <div class="swiper-button-prev"></div>
                </div>
            </div>
        `;
    }

    createCategoryCard(category) {
        const icon = this.getIconForCategory(category);

        return `
            <div class="swiper-slide">
                <a href="../pages/allListings.html?category=${category._id}" class="masry-category-card">
                    <div class="masry-category-card__content">
                        <div class="masry-category-card__top">
                            <div class="masry-category-card__icon-wrapper">
                                <i class="${icon}"></i>
                            </div>
                            <h3 class="masry-category-card__title">${category.categoryName}</h3>
                        </div>
                        <div class="masry-category-card__bottom">
                            <div class="masry-category-card__stats">
                                <span class="masry-category-card__count">${category.count}</span>
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
            </div>
        `;
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
}

document.addEventListener('DOMContentLoaded', () => new CategorySwiper());



