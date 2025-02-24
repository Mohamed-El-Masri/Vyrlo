class ListingDetails {
    constructor() {
        this.config = {
            api: {
                baseUrl: 'https://virlo.vercel.app/listing',
                reviewsUrl: 'https://virlo.vercel.app/api/reviews'
            },
            defaultImages: {
                listing: '../images/defaults/default-listing.png'
            },
            reviewsPerPage: 5
        };

        this.state = {
            listing: null,
            owner: null,
            reviews: {
                items: [],
                averages: null,
                pagination: null
            }
        };

        this.init();
    }

    async init() {
        this.container = document.querySelector('.listing-details');
        if (!this.container) return;

        this.showInitialLoading();

        const id = this.getListingId();
        if (!id) {
            this.showError('Listing ID not found');
            return;
        }

        try {
            const cachedData = this.checkCachedData(id);
            if (cachedData) {
                this.state.listing = cachedData;
                this.renderDetails(true);
            }

            const listingData = await this.fetchListingDetails(id);
            this.state.listing = listingData;
            
            if (!cachedData || JSON.stringify(cachedData) !== JSON.stringify(listingData)) {
                this.renderDetails();
            }

        } catch (error) {
            this.handleError(error);
        }
    }

    getListingId() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    }

    async fetchListingDetails(id) {
        const response = await fetch(`${this.config.api.baseUrl}/${id}`);
        if (!response.ok) throw new Error('Failed to fetch listing details');
        return await response.json();
    }

    async fetchUserDetails(userId) {
        try {
            const response = await fetch(`${this.config.api.baseUrl.replace('listing', 'user')}/${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const userData = await response.json();
            return userData;

        } catch (error) {
            console.error('User fetch error details:', {
                userId,
                error: error.message,
                stack: error.stack
            });
            throw new Error('Failed to fetch user details');
        }
    }

    async fetchReviews(listingId, page = 1) {
        try {
            const response = await fetch(
                `${this.config.api.reviewsUrl}/${listingId}?page=${page}&limit=${this.config.reviewsPerPage}`
            );
            if (!response.ok) throw new Error('Failed to fetch reviews');
            
            const data = await response.json();
            this.state.reviews = {
                items: data.reviews,
                averages: data.averages,
                pagination: data.pagination
            };
            
            return data;
        } catch (error) {
            console.error('Error fetching reviews:', error);
            return null;
        }
    }

    renderDetails(useCached = false) {
        const { listing } = this.state;
        
        this.container.innerHTML = `
            <div class="listing-header">
                <div class="container">
                    <div class="listing-header__content">
                        <div class="listing-header__info">
                            <h1 class="listing-header__title">${listing.listingName}</h1>
                            <div class="listing-header__meta">
                                <span class="listing-status ${listing.isOpen ? 'is-open' : 'is-closed'}">
                                    <i class="bi bi-${listing.isOpen ? 'door-open' : 'door-closed'}"></i>
                                    ${listing.isOpen ? 'Open Now' : 'Closed'}
                                </span>
                                ${listing.categoryId ? `
                                    <span class="listing-badge category">
                                        <i class="bi bi-bookmark-star"></i>
                                        ${listing.categoryId.categoryName}
                                    </span>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="container">
                <div class="listing-content">
                    <div class="listing-main">
                        <div class="listing-gallery">
                            <img src="${listing.mainImage || this.config.defaultImages.listing}" 
                                 alt="${listing.listingName}"
                                 class="listing-gallery__main">
                            ${listing.gallery?.length ? `
                                <div class="listing-gallery__grid">
                                    ${listing.gallery.map(img => `
                                        <img src="${img}" alt="Gallery image" class="gallery-thumb">
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>

                        <section class="listing-section">
                            <h2 class="listing-section__title">
                                <i class="bi bi-info-circle"></i>
                                About
                            </h2>
                            <div class="listing-description">
                                <p>${listing.description || 'No description available'}</p>
                            </div>
                        </section>

                        ${listing.amenitielsList?.length ? `
                            <section class="listing-section">
                                <h2 class="listing-section__title">
                                    <i class="bi bi-stars"></i>
                                    Features & Amenities
                                </h2>
                                <div class="amenities-grid">
                                    ${listing.amenitielsList.map(amenity => `
                                        <div class="amenity-item">
                                            <i class="bi bi-check-circle-fill"></i>
                                            <span>${amenity}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </section>
                        ` : ''}

                        ${listing.latitude && listing.longitude ? `
                            <section class="listing-section location-section">
                                <h2 class="listing-section__title">
                                    <i class="bi bi-geo-alt"></i>
                                    Location Details
                                </h2>
                                <div class="location-info-grid">
                                    <div class="location-card address">
                                        <div class="location-card__header">
                                            <i class="bi bi-building"></i>
                                            <h3>Address</h3>
                                        </div>
                                        <p>${listing.location}</p>
                                    </div>
                                    <div class="location-card coordinates">
                                        <div class="location-card__header">
                                            <i class="bi bi-geo"></i>
                                            <h3>Coordinates</h3>
                                        </div>
                                        <div class="coordinates-grid">
                                            <div class="coordinate">
                                                <span>Latitude</span>
                                                <strong>${listing.latitude}</strong>
                                            </div>
                                            <div class="coordinate">
                                                <span>Longitude</span>
                                                <strong>${listing.longitude}</strong>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="map-container">
                                    <div class="map-wrapper">
                                        <iframe
                                            src="https://maps.google.com/maps?q=${listing.latitude},${listing.longitude}&z=15&output=embed"
                                            width="100%"
                                            height="400"
                                            frameborder="0"
                                            allowfullscreen>
                                        </iframe>
                                    </div>
                                </div>
                            </section>
                        ` : ''}
                    </div>

                    <aside class="listing-sidebar">
                        <div class="listing-card contact-info">
                            <h3>
                                <i class="bi bi-person-badge"></i>
                                Contact Information
                            </h3>
                            <ul class="contact-list">
                                ${listing.location ? `
                                    <li class="contact-item">
                                        <i class="bi bi-geo-alt"></i>
                                        <span>${listing.location}</span>
                                    </li>
                                ` : ''}
                                ${listing.mobile ? `
                                    <li class="contact-item">
                                        <i class="bi bi-phone"></i>
                                        <a href="tel:${listing.mobile}" class="contact-link">
                                            ${listing.mobile}
                                        </a>
                                    </li>
                                ` : ''}
                                ${listing.email ? `
                                    <li class="contact-item">
                                        <i class="bi bi-envelope"></i>
                                        <a href="mailto:${listing.email}" class="contact-link">
                                            ${listing.email}
                                        </a>
                                    </li>
                                ` : ''}
                                ${listing.taxNumber ? `
                                    <li class="contact-item">
                                        <i class="bi bi-card-text"></i>
                                        <span class="tax-number">Tax ID: ${listing.taxNumber}</span>
                                    </li>
                                ` : ''}
                                ${listing.socialMediaAccounts?.length ? `
                                    <li class="contact-item social-links">
                                        <i class="bi bi-share"></i>
                                        <div class="social-icons">
                                            ${listing.socialMediaAccounts.map(social => `
                                                <a href="${social.url}" target="_blank" class="social-icon">
                                                    <i class="bi bi-${social.platform}"></i>
                                                </a>
                                            `).join('')}
                                        </div>
                                    </li>
                                ` : ''}
                            </ul>
                        </div>

                        ${this.renderWorkingHours(listing)}
                    </aside>
                </div>
            </div>
        `;
    }

    renderOwnerInfo(owner) {
        if (!owner) return '';
        
        return `
            <div class="listing-owner">
                <i class="bi bi-person-circle"></i>
                <span>${owner.userName || 'Anonymous'}</span>
            </div>
        `;
    }

    renderRating(rating = 0, reviewsCount = 0) {
        const stars = Array(5).fill('')
            .map((_, i) => `<i class="bi bi-star${i < Math.floor(rating) ? '-fill' : ''}"></i>`)
            .join('');

        return `
            <div class="listing-rating">
                <div class="rating-stars">${stars}</div>
                <span class="rating-count">${reviewsCount} Reviews</span>
            </div>
        `;
    }

    renderWorkingHours(listing) {
        if (!listing.openingTimes) return '';

        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const currentTime = new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: false 
        });

        const todaySchedule = listing.openingTimes[today];
        const isCurrentlyOpen = this.isCurrentlyOpen(todaySchedule, currentTime);

        return `
            <div class="listing-card working-hours">
                <div class="hours-header ${isCurrentlyOpen ? 'is-open' : 'is-closed'}">
                    <h3>
                        <i class="bi bi-clock"></i>
                        Working Hours
                    </h3>
                    <span class="current-status">
                        <i class="bi bi-${isCurrentlyOpen ? 'check-circle' : 'x-circle'}-fill"></i>
                        ${isCurrentlyOpen ? 'Open Now' : 'Closed Now'}
                    </span>
                </div>
                <ul class="hours-list">
                    ${days.map(day => {
                        const dayData = listing.openingTimes[day];
                        const isToday = day === today;
                        const isDuringWorkingHours = isToday && this.isCurrentlyOpen(dayData, currentTime);
                        
                        if (!dayData) return '';

                        if (dayData.status === 'close') {
                            return `
                                <li class="hours-item ${isToday ? 'current-day is-closed' : ''} closed">
                                    <div class="day-info">
                                        ${isToday ? '<i class="bi bi-calendar-check"></i>' : ''}
                                        <span class="day">${day}</span>
                                    </div>
                                    <div class="hours-info closed">
                                        <i class="bi bi-x-circle-fill"></i>
                                        <span>Closed</span>
                                        ${dayData.closingReason ? `
                                            <span class="closing-reason">(${dayData.closingReason})</span>
                                        ` : ''}
                                    </div>
                                </li>
                            `;
                        }

                        return `
                            <li class="hours-item ${isToday ? `current-day ${isDuringWorkingHours ? 'is-open' : 'is-closed'}` : ''}">
                                <div class="day-info">
                                    ${isToday ? '<i class="bi bi-calendar-check"></i>' : ''}
                                    <span class="day">${day}</span>
                                </div>
                                <div class="hours-info">
                                    <span class="time opening">
                                        <i class="bi bi-sunrise"></i>
                                        ${dayData.from}
                                    </span>
                                    <span class="separator">
                                        <i class="bi bi-arrow-right"></i>
                                    </span>
                                    <span class="time closing">
                                        <i class="bi bi-sunset"></i>
                                        ${dayData.to}
                                    </span>
                                </div>
                            </li>
                        `;
                    }).join('')}
                </ul>
            </div>
        `;
    }

    isCurrentlyOpen(schedule, currentTime) {
        if (!schedule || schedule.status === 'close') return false;
        
        const current = this.timeToMinutes(currentTime);
        const open = this.timeToMinutes(schedule.from);
        const close = this.timeToMinutes(schedule.to);
        
        return current >= open && current <= close;
    }

    timeToMinutes(time) {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }

    isCurrentDay(day) {
        const today = new Date().toLocaleDateString('en-US', { weekday: 'lowercase' });
        return today === day;
    }

    showInitialLoading() {
        this.container.innerHTML = `
            <div class="listing-loading">
                <div class="loading-content">
                    <div class="loading-spinner"></div>
                    <h3>Loading Listing Details</h3>
                    <p>Please wait while we fetch the information...</p>
                </div>
            </div>
        `;
    }

    showError(message) {
        this.container.innerHTML = `
            <div class="listing-error">
                <div class="error-content">
                    <i class="bi bi-exclamation-circle"></i>
                    <h3>Oops! Something went wrong</h3>
                    <p>The page you're looking for could not be found.</p>
                    <div class="error-actions">
                        <button onclick="window.location.reload()" class="btn-refresh">
                            <i class="bi bi-arrow-clockwise"></i>
                            Refresh Page
                        </button>
                        <a href="../index.html" class="btn-home">
                            <i class="bi bi-house"></i>
                            Return Home
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    checkCachedData(id) {
        const cached = sessionStorage.getItem('lastViewedListing');
        if (cached) {
            const { id: cachedId, data, timestamp } = JSON.parse(cached);
            if (cachedId === id && Date.now() - timestamp < 5 * 60 * 1000) {
                return data;
            }
        }
        return null;
    }

    handleError(error) {
        console.error('Error in initialization:', error);
        this.showError('Failed to load listing details');
    }

    renderReviews() {
        const { averages, items } = this.state.reviews;
        if (!averages) return '';

        return `
            <section class="listing-section reviews-section">
                <h2 class="listing-section__title">
                    <i class="bi bi-star"></i>
                    Reviews & Ratings
                </h2>
                
                <div class="ratings-overview">
                    <div class="total-rating">
                        <span class="rating-number">${averages.totalAverage.toFixed(1)}</span>
                        <div class="rating-stars">
                            ${this.createRatingStars(averages.totalAverage)}
                        </div>
                        <span class="reviews-count">${this.state.reviews.pagination.totalReviews} reviews</span>
                    </div>
                    
                    <div class="rating-categories">
                        <div class="rating-category">
                            <span>Service</span>
                            <div class="rating-bar">
                                <div class="bar-fill" style="width: ${(averages.serviceAvg/5)*100}%"></div>
                            </div>
                            <span>${averages.serviceAvg.toFixed(1)}</span>
                        </div>
                        <div class="rating-category">
                            <span>Value for Money</span>
                            <div class="rating-bar">
                                <div class="bar-fill" style="width: ${(averages.moneyAvg/5)*100}%"></div>
                            </div>
                            <span>${averages.moneyAvg.toFixed(1)}</span>
                        </div>
                        <div class="rating-category">
                            <span>Cleanliness</span>
                            <div class="rating-bar">
                                <div class="bar-fill" style="width: ${(averages.cleanlinessAvg/5)*100}%"></div>
                            </div>
                            <span>${averages.cleanlinessAvg.toFixed(1)}</span>
                        </div>
                        <div class="rating-category">
                            <span>Location</span>
                            <div class="rating-bar">
                                <div class="bar-fill" style="width: ${(averages.locationAvg/5)*100}%"></div>
                            </div>
                            <span>${averages.locationAvg.toFixed(1)}</span>
                        </div>
                    </div>
                </div>

                <div class="reviews-list">
                    ${items.map(review => this.renderReviewItem(review)).join('')}
                </div>
                
                ${this.renderPagination()}
            </section>
        `;
    }

    renderReviewItem(review) {
        return `
            <div class="review-item">
                <div class="review-header">
                    <div class="reviewer-info">
                        <h4>${review.reviewerName}</h4>
                        <span class="review-date">${new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div class="review-rating">
                        ${this.createRatingStars(
                            (review.serviceRating + review.moneyRating + 
                             review.cleanlinessRating + review.locationRating) / 4
                        )}
                    </div>
                </div>
                <p class="review-text">${review.reviewText}</p>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => new ListingDetails());
