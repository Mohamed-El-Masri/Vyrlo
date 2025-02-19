class CategorySwiper {
    constructor() {
        this.swiperContainer = document.querySelector('.masry-cat-swiper');
        this.baseIconPath = '../images/categorey-icons/';
        this.fallbackImages = {
            'Accountant': 'accountant.png',
            'Bakery Shop': 'bakery-shop.png',
            'Dentist': 'dentist.png',
            'Restaurant': 'food-court.png',
            'Insurance': 'health-insurance.png',
            'Home Repairs': 'home-renovation.png',
            'Immigration Lawyer': 'immigration.png',
            'Family Doctor': 'medical-team.png',
            'Teller': 'money-bag.png',
            'Present': 'present.png',
            'Real Estate': 'real-estate.png',
            'Responsibility': 'responsibility.png',
            'Services': 'services.png',
            'Supermarket': 'supermarket.png',
            'Dessert Shop': 'sweets.png',
            'Translation': 'translate.png'
        };
        this.placeholderImage = '../images/categorey-icons/placeholder.jpg';
        this.init();
    }

    async init() {
        await this.loadCategories();
        this.initializeSwiper();
    }

    async loadCategories() {
        try {
            const categoryManager = CategoryManager.getInstance();
            await categoryManager.initialize();
            const categories = categoryManager.getCategories();
            
            this.renderCategoriesSwiper(categories);
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    renderCategoriesSwiper(categories) {
        const swiperHTML = `
            <div class="container">
                <h2 class="masry-cat-swiper__title">Explore <span>Categories</span></h2>
                <div class="swiper masry-categories-swiper">
                    <div class="swiper-wrapper">
                        ${categories.map(category => this.createCategorySlide(category)).join('')}
                    </div>
                    <div class="swiper-pagination"></div>
                    <div class="swiper-button-next"></div>
                    <div class="swiper-button-prev"></div>
                </div>
            </div>
        `;

        this.swiperContainer.innerHTML = swiperHTML;
    }

    getCategoryImage(category) {
        // محاولة استخدام iconTwo من API
        if (category.iconTwo && category.iconTwo.trim() !== '') {
            return category.iconTwo;
        }

        // محاولة استخدام الصورة المحلية المطابقة
        const fallbackImage = this.fallbackImages[category.categoryName];
        if (fallbackImage) {
            return `${this.baseIconPath}${fallbackImage}`;
        }

        // استخدام الصورة الافتراضية إذا لم يتوفر أي من الخيارات السابقة
        return this.placeholderImage;
    }

    createCategorySlide(category) {
        const imageUrl = this.getCategoryImage(category);
        
        return `
            <div class="swiper-slide">
                <div class="masry-cat-card">
                    <img src="${imageUrl}" 
                         alt="${category.categoryName}" 
                         class="masry-cat-card__image"
                         onerror="this.src='${this.placeholderImage}'">
                    <h3 class="masry-cat-card__title">${category.categoryName}</h3>
                    <span class="masry-cat-card__count">20 Listings</span>
                </div>
            </div>
        `;
    }

    initializeSwiper() {
        const swiperEl = document.querySelector('.masry-categories-swiper');
        
        // Initialize Swiper
        const swiper = new Swiper(swiperEl, {
            slidesPerView: 1,
            spaceBetween: 20,
            loop: true,
            autoplay: {
                delay: 3000,
                disableOnInteraction: true, // يتوقف عند التفاعل
                pauseOnMouseEnter: true,    // يتوقف عند hover
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            breakpoints: {
                640: {
                    slidesPerView: 2,
                },
                768: {
                    slidesPerView: 3,
                },
                1024: {
                    slidesPerView: 4,
                },
            }
        });

        // Add hover events
        swiperEl.addEventListener('mouseenter', () => {
            swiper.autoplay.stop();
        });

        swiperEl.addEventListener('mouseleave', () => {
            swiper.autoplay.start();
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CategorySwiper();
});
