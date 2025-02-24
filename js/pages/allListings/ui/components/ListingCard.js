import { isCurrentlyOpen, optimizeImage } from '../../utils/helpers.js';

export class ListingCard {
    static create(listing, viewMode = 'grid') {
        return viewMode === 'grid' ? 
            this.createGridCard(listing) : 
            this.createListCard(listing);
    }

    static createGridCard(listing) {
        const isOpen = isCurrentlyOpen(listing.openingTimes);
        
        return `
            <article class="masry-listing-card" data-id="${listing._id}">
                <div class="masry-listing-image">
                    <img src="${optimizeImage(listing.mainImage)}" 
                         alt="${listing.listingName}"
                         loading="lazy"
                         data-gallery='${JSON.stringify(listing.gallery || [])}'>
                    ${this.createBadges(listing, isOpen)}
                </div>
                <div class="masry-listing-content">
                    ${this.createHeader(listing)}
                    ${this.createInfo(listing, isOpen)}
                    ${this.createFooter(listing)}
                </div>
            </article>
        `;
    }

    static createListCard(listing) {
        const isOpen = isCurrentlyOpen(listing.openingTimes);
        
        return `
            <article class="masry-listing-card masry-listing-card--list" data-id="${listing._id}">
                <div class="masry-listing-image">
                    <img src="${optimizeImage(listing.mainImage, 400)}" 
                         alt="${listing.listingName}"
                         loading="lazy">
                    ${this.createBadges(listing, isOpen)}
                </div>
                <div class="masry-listing-content">
                    ${this.createHeader(listing)}
                    ${this.createDetailedInfo(listing, isOpen)}
                    ${this.createFooter(listing)}
                </div>
            </article>
        `;
    }

    static createBadges(listing, isOpen) {
        return `
            <div class="masry-listing-badges">
                <span class="masry-badge ${isOpen ? 'open' : 'closed'}">
                    ${isOpen ? 'Open Now' : 'Closed'}
                </span>
                <span class="masry-badge category">
                    ${listing.categoryId?.categoryName || 'Uncategorized'}
                </span>
            </div>
        `;
    }

    static createHeader(listing) {
        return `
            <div class="masry-listing-header">
                <h3 class="masry-listing-title">
                    <a href="listing-details.html?id=${listing._id}">
                        ${listing.listingName}
                    </a>
                </h3>
                ${this.createRating(listing)}
            </div>
        `;
    }

    static createInfo(listing, isOpen) {
        return `
            <div class="masry-listing-info">
                <div class="masry-listing-location">
                    <i class="bi bi-geo-alt"></i>
                    <span>${listing.location}</span>
                </div>
                ${this.createOpeningHours(listing, isOpen)}
            </div>
        `;
    }

    static createFooter(listing) {
        return `
            <div class="masry-listing-footer">
                ${this.createAmenities(listing)}
                <a href="listing-details.html?id=${listing._id}" 
                   class="masry-btn masry-btn--primary">
                    View Details
                </a>
            </div>
        `;
    }

    static createRating(listing) {
        const rating = listing.totalRating || 0;
        const reviews = listing.reviewIds?.length || 0;
        
        return `
            <div class="masry-listing-rating">
                <div class="masry-stars">
                    ${this.createStars(rating)}
                </div>
                <span class="masry-review-count">(${reviews} ${reviews === 1 ? 'Review' : 'Reviews'})</span>
            </div>
        `;
    }

    static createStars(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            const starClass = i <= rating ? 'filled' : 'empty';
            stars += `<i class="bi bi-star-fill ${starClass}"></i>`;
        }
        return stars;
    }

    static createOpeningHours(listing, isOpen) {
        return `
            <div class="masry-listing-hours ${isOpen ? 'open' : 'closed'}">
                <i class="bi bi-clock"></i>
                <span>${isOpen ? 'Open Now' : 'Closed'}</span>
            </div>
        `;
    }

    static createAmenities(listing) {
        const amenities = listing.amenitielsList || [];
        if (!amenities.length) return '';

        const displayAmenities = amenities.slice(0, 3);
        return `
            <div class="masry-amenities">
                ${displayAmenities.map(amenity => `
                    <span class="masry-amenity">
                        <i class="bi bi-check-circle"></i>
                        ${amenity}
                    </span>
                `).join('')}
                ${amenities.length > 3 ? `
                    <span class="masry-amenity-more">+${amenities.length - 3}</span>
                ` : ''}
            </div>
        `;
    }
}

// filepath: /C:/Users/HP/Desktop/Vyrlo/js/pages/allListings/ui/components/LoadingIndicator.js
export class LoadingIndicator {
    // ... Loading states ...
}

// filepath: /C:/Users/HP/Desktop/Vyrlo/js/pages/allListings/ui/components/FilterControls.js
export class FilterControls {
    // ... Filter UI components ...
}
